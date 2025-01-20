import { error } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import type { Subject, Category, Quiz } from "./types"

interface DatabaseQuiz {
  id: string
  title: string
  description: string | null
  category_id: string
  created_at: Date | null
  updated_at: Date | null
  is_active: boolean | null
}

interface DatabaseCategory {
  id: string
  subject_id: string
  name: string
  description: string | null
  created_at: Date | null
  updated_at: Date | null
  quizzes: DatabaseQuiz[]
}

interface QuizAttemptRow {
  id: string
  quiz_id: string
  user_id: string
  completed_at: Date | null
  score: number | null
  started_at: Date | null
  last_answered_question_id: string | null
}

export const load = (async ({ locals, url }) => {
  const subjectId = url.searchParams.get("subject") || null
  const supabase = locals.supabase

  // Fetch all subjects
  const { data: subjects, error: subjectsError } = await supabase
    .from("subjects")
    .select("*")
    .order("name")

  if (subjectsError) {
    throw error(500, "Error fetching subjects")
  }

  // If no subject is selected and we have subjects, use the first one
  const activeSubjectId = subjectId || (subjects?.[0]?.id ?? null)

  if (!activeSubjectId) {
    return {
      subjects:
        (subjects?.map((subject) => ({
          id: subject.id,
          name: subject.name,
          description: subject.description,
        })) as Subject[]) ?? [],
      categories: [],
      activeSubjectId: null,
      session: locals.session,
    }
  }

  // Get question counts for each quiz
  const { data: quizQuestionsData, error: questionsError } = await supabase
    .from("quiz_questions")
    .select("quiz_id")

  if (questionsError) {
    throw error(500, "Error fetching quiz questions counts")
  }

  // Count questions per quiz manually
  const questionCountMap = (quizQuestionsData ?? []).reduce(
    (acc, { quiz_id }) => {
      acc.set(quiz_id, (acc.get(quiz_id) || 0) + 1)
      return acc
    },
    new Map<string, number>(),
  )

  // Fetch categories for the active subject with their quizzes
  const { data: categoriesData, error: categoriesError } = await supabase
    .from("categories")
    .select(
      `
            *,
            quizzes(*)
        `,
    )
    .eq("subject_id", activeSubjectId)
    .order("name")

  if (categoriesError) {
    throw error(500, "Error fetching categories")
  }

  const categories = (categoriesData as DatabaseCategory[]) ?? []

  // Fetch quiz attempts for progress calculation
  const { data: quizAttemptsData, error: attemptsError } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("user_id", locals.user.id)

  if (attemptsError) {
    throw error(500, "Error fetching quiz attempts")
  }

  const quizAttempts = (quizAttemptsData as QuizAttemptRow[]) ?? []

  // Calculate completion metrics for quizzes and categories
  const processedCategories = categories.map((category) => {
    const quizzes = category.quizzes.map((quiz) => {
      const attempts = quizAttempts.filter(
        (attempt) => attempt.quiz_id === quiz.id,
      )
      const completedAttempts = attempts.filter(
        (attempt) => attempt.completed_at !== null,
      )
      const totalQuestions = questionCountMap.get(quiz.id) ?? 0
      const completedQuestions = completedAttempts.length

      const quizData: Quiz = {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        category_id: quiz.category_id,
        total_questions: totalQuestions,
        completed_questions: completedQuestions,
        completion:
          totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0,
      }

      return quizData
    })

    const categoryCompletion =
      quizzes.length > 0
        ? quizzes.reduce((sum, quiz) => sum + quiz.completion, 0) /
          quizzes.length
        : 0

    const categoryData: Category = {
      id: category.id,
      subject_id: category.subject_id,
      name: category.name,
      description: category.description,
      quizzes,
      completion: categoryCompletion,
    }

    return categoryData
  })

  return {
    subjects:
      (subjects?.map((subject) => ({
        id: subject.id,
        name: subject.name,
        description: subject.description,
      })) as Subject[]) ?? [],
    categories: processedCategories,
    activeSubjectId,
    session: locals.session,
  }
}) satisfies PageServerLoad
