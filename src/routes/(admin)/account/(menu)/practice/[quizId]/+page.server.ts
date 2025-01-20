import { error } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"

export const load = (async ({ params, locals }) => {
  const { quizId } = params
  const supabase = locals.supabase

  if (!locals.user) {
    throw error(401, "Unauthorized")
  }

  // Fetch quiz with category and subject info
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select(
      `
            *,
            category:categories (
                id,
                name,
                subject_id,
                subject:subjects (
                    id,
                    name
                )
            )
        `,
    )
    .eq("id", quizId)
    .single()

  if (quizError) {
    console.error("Error fetching quiz:", quizError)
    throw error(500, "Error fetching quiz details")
  }

  if (!quiz) {
    throw error(404, "Quiz not found")
  }

  // Get latest attempt or prepare new one
  const { data: existingAttempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("quiz_id", quizId)
    .eq("user_id", locals.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  // Only throw error if it's not a "no rows" error
  if (attemptError && attemptError.code !== "PGRST116") {
    console.error("Error fetching attempt:", attemptError)
    throw error(500, "Error fetching quiz attempt")
  }

  // Create new attempt if none exists
  let attempt = existingAttempt
  if (!attempt) {
    const { data: newAttempt, error: createError } = await supabase
      .from("quiz_attempts")
      .insert({
        quiz_id: quizId,
        user_id: locals.user.id,
        started_at: new Date().toISOString(),
        score: 0,
      })
      .select()
      .single()

    if (createError) {
      console.error("Error creating attempt:", createError)
      throw error(500, "Error creating quiz attempt")
    }

    attempt = newAttempt
  }

  // Fetch quiz questions with choices
  const { data: questionData, error: questionsError } = await supabase
    .from("quiz_questions")
    .select(
      `
            order,
            question:questions (
                id,
                content,
                explanation,
                image_url,
                choices (
                    id,
                    content,
                    is_correct,
                    explanation
                ),
                bookmarks!inner (
                    id
                )
            )
        `,
    )
    .eq("quiz_id", quizId)
    .eq("bookmarks.user_id", locals.user.id)
    .order("order")

  if (questionsError) {
    console.error("Error fetching questions:", questionsError)
    throw error(500, "Error fetching quiz questions")
  }

  // Get incorrect responses for this user's questions
  const { data: incorrectResponses, error: incorrectError } = await supabase
    .from("incorrect_responses")
    .select("question_id, choice_id")
    .eq("user_id", locals.user.id)
    .in("question_id", questionData?.map((q) => q.question.id) || [])

  if (incorrectError) {
    console.error("Error fetching incorrect responses:", incorrectError)
    throw error(500, "Error fetching response history")
  }

  // Process and order questions
  const questions =
    questionData
      ?.map((q) => ({
        ...q.question,
        order: q.order,
        choices: q.question.choices.sort(() => Math.random() - 0.5),
        isBookmarked: Boolean(q.question.bookmarks?.length),
        incorrectChoices:
          incorrectResponses
            ?.filter((r) => r.question_id === q.question.id)
            .map((r) => r.choice_id) || [],
      }))
      .sort((a, b) => a.order - b.order) || []

  return {
    quiz,
    questions,
    attempt,
    session: locals.session,
  }
}) satisfies PageServerLoad
