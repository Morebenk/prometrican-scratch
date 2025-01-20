import { error } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"

interface QuizQuestion {
  id: string
  content: string
  explanation: string | null
  image_url: string | null
  choices: {
    id: string
    content: string
    is_correct: boolean
    explanation: string | null
  }[]
}

interface QuizDetails {
  id: string
  title: string
  description: string | null
  category_id: string
  category: {
    id: string
    name: string
    subject_id: string
  }
}

interface QuestionData {
  questions: {
    id: string
    content: string
    explanation: string | null
    image_url: string | null
    choices: {
      id: string
      content: string
      is_correct: boolean
      explanation: string | null
    }[]
  } | null
}

export const load = (async ({ params, locals }) => {
  const { quizId } = params
  const supabase = locals.supabase

  // Fetch quiz details
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select(
      `
            *,
            category:categories (
                id,
                name,
                subject_id
            )
        `,
    )
    .eq("id", quizId)
    .single()

  if (quizError) {
    throw error(500, "Error fetching quiz details")
  }

  if (!quiz) {
    throw error(404, "Quiz not found")
  }

  // Fetch quiz questions with choices
  const { data: questions, error: questionsError } = await supabase
    .from("quiz_questions")
    .select(
      `
            questions (
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
    throw error(500, "Error fetching quiz questions")
  }

  // Get latest attempt or create new one
  const { data: existingAttempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("quiz_id", quizId)
    .eq("user_id", locals.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (attemptError && attemptError.code !== "PGRST116") {
    // PGRST116 is the error code for no rows returned
    throw error(500, "Error fetching quiz attempt")
  }

  const attempt = existingAttempt || {
    id: null,
    quiz_id: quizId,
    user_id: locals.user.id,
    started_at: new Date().toISOString(),
    completed_at: null,
    last_answered_question_id: null,
    score: 0,
  }

  // Transform questions data
  const processedQuestions = ((questions as QuestionData[]) || [])
    .map((q) => q.questions)
    .filter((q): q is NonNullable<typeof q> => q !== null)
    .map((q) => ({
      ...q,
      choices: q.choices.sort(() => Math.random() - 0.5), // Randomize choice order
    }))

  return {
    quiz: quiz as QuizDetails,
    questions: processedQuestions as QuizQuestion[],
    attempt,
    session: locals.session,
  }
}) satisfies PageServerLoad
