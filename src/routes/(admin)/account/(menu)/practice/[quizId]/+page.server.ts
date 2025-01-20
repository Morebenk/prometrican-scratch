import { error } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import type {
  DbQuizAttempt,
  QuizData,
  QuizQuestion,
  DbQuestion,
  DbChoice,
} from "../types"

interface QuestionData {
  order: number
  question: {
    id: string
    content: string
    explanation: string | null
    image_url: string | null
    choices: DbChoice[]
    bookmarks?: { id: string }[]
  } | null
}

function generateUUID() {
  return crypto.randomUUID()
}

export const load = (async ({ params, locals }) => {
  const { quizId } = params
  const supabase = locals.supabase

  if (!locals.user) {
    throw error(401, "Unauthorized")
  }

  try {
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

    // Get latest attempt
    const { data: existingAttempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("quiz_id", quizId)
      .eq("user_id", locals.user.id)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (attemptError) {
      console.error("Error fetching attempt:", attemptError)
      throw error(500, "Error fetching quiz attempt")
    }

    // Create new attempt if none exists or if the last one was completed
    let attempt = existingAttempt
    if (!attempt || attempt.completed_at) {
      const newAttempt: DbQuizAttempt = {
        id: generateUUID(), // Generate UUID for new attempt
        quiz_id: quizId,
        user_id: locals.user.id,
        started_at: new Date(),
        score: 0,
        completed_at: null,
        last_answered_question_id: null,
      }

      const { data: createdAttempt, error: createError } = await supabase
        .from("quiz_attempts")
        .insert([newAttempt])
        .select()
        .single()

      if (createError) {
        console.error("Error creating attempt:", createError)
        throw error(500, "Error creating quiz attempt")
      }

      attempt = createdAttempt
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
                    )
                )
            `,
      )
      .eq("quiz_id", quizId)
      .order("order")

    if (questionsError) {
      console.error("Error fetching questions:", questionsError)
      throw error(500, "Error fetching quiz questions")
    }

    const validQuestionIds = (questionData || [])
      .map((q) => q.question?.id)
      .filter((id): id is string => id !== undefined)

    // Get bookmarks for these questions
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from("bookmarks")
      .select("question_id")
      .eq("user_id", locals.user.id)
      .in("question_id", validQuestionIds)

    if (bookmarksError) {
      console.error("Error fetching bookmarks:", bookmarksError)
      // Non-critical error, continue without bookmarks
    }

    const bookmarkedQuestionIds = new Set(
      bookmarks?.map((b) => b.question_id) || [],
    )

    // Get incorrect responses for these questions
    const { data: incorrectResponses, error: incorrectError } = await supabase
      .from("incorrect_responses")
      .select("question_id, choice_id")
      .eq("user_id", locals.user.id)
      .in("question_id", validQuestionIds)

    if (incorrectError) {
      console.error("Error fetching incorrect responses:", incorrectError)
      // Non-critical error, continue without incorrect responses
    }

    // Process and order questions
    const questions = ((questionData as QuestionData[]) || [])
      .filter(
        (
          q,
        ): q is QuestionData & {
          question: NonNullable<QuestionData["question"]>
        } => q.question !== null,
      )
      .map((q) => ({
        ...q.question,
        order: q.order,
        choices: q.question.choices.sort(() => Math.random() - 0.5),
        isBookmarked: bookmarkedQuestionIds.has(q.question.id),
        incorrectChoices:
          incorrectResponses
            ?.filter((r) => r.question_id === q.question.id)
            .map((r) => r.choice_id) || [],
      }))
      .sort((a, b) => a.order - b.order)

    return {
      quiz: quiz as QuizData,
      questions: questions as QuizQuestion[],
      attempt,
      session: locals.session,
    }
  } catch (e) {
    console.error("Error in quiz load:", e)
    throw error(500, "Error loading quiz content")
  }
}) satisfies PageServerLoad
