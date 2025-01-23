import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { Subject, Category, Quiz, DatabaseCategory } from "./types";
import { QuizStatus } from "./types";

export const load = (async ({ locals, url }) => {
  const subjectId = url.searchParams.get("subject") || null;
  const supabase = locals.supabase;

  // Fetch all subjects
  const { data: subjects, error: subjectsError } = await supabase
    .from("subjects")
    .select("*")
    .order("name");

  if (subjectsError) {
    throw error(500, "Error fetching subjects");
  }

  // If no subject is selected and we have subjects, use the first one
  const activeSubjectId = subjectId || (subjects?.[0]?.id ?? null);

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
    };
  }

  // Get questions count per quiz
  const { data: quizQuestionsData, error: questionsError } = await supabase
    .from("quiz_questions")
    .select("quiz_id");

  if (questionsError) {
    throw error(500, "Error fetching quiz questions counts");
  }

  // Count questions per quiz
  const questionCountMap = (quizQuestionsData ?? []).reduce(
    (acc, { quiz_id }) => {
      acc.set(quiz_id, (acc.get(quiz_id) || 0) + 1);
      return acc;
    },
    new Map<string, number>(),
  );

  // Fetch categories with their quizzes
  const { data: categoriesData, error: categoriesError } = await supabase
    .from("categories")
    .select(
      `
            *,
            quizzes(*)
        `,
    )
    .eq("subject_id", activeSubjectId)
    .order("name");

  if (categoriesError) {
    throw error(500, "Error fetching categories");
  }

  const categories = (categoriesData as DatabaseCategory[]) ?? [];

  // Fetch quiz attempts to determine status
  const { data: quizAttempts, error: attemptsError } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("user_id", locals.user.id);

  if (attemptsError) {
    throw error(500, "Error fetching quiz attempts");
  }

  // Create a map of quiz statuses
  const quizStatusMap = new Map<string, QuizStatus>();
  quizAttempts?.forEach((attempt) => {
    // Only store the most recent attempt status
    const currentStatus = quizStatusMap.get(attempt.quiz_id);
    if (
      !currentStatus ||
      new Date(attempt.started_at) >
        new Date(quizStatusMap.get(attempt.quiz_id)!)
    ) {
      quizStatusMap.set(
        attempt.quiz_id,
        attempt.completed_at ? QuizStatus.COMPLETED : QuizStatus.IN_PROGRESS,
      );
    }
  });

  // Calculate completion metrics for categories
  const processedCategories = categories.map((category) => {
    const quizzes = category.quizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      category_id: quiz.category_id,
      total_questions: questionCountMap.get(quiz.id) ?? 0,
      status: quizStatusMap.get(quiz.id) ?? QuizStatus.NOT_STARTED,
    }));

    // Category completion is based on completed quizzes
    const completedQuizzes = quizzes.filter(
      (quiz) => quiz.status === QuizStatus.COMPLETED,
    ).length;
    const categoryCompletion =
      quizzes.length > 0 ? (completedQuizzes / quizzes.length) * 100 : 0;

    const categoryData: Category = {
      id: category.id,
      subject_id: category.subject_id,
      name: category.name,
      description: category.description,
      quizzes,
      completion: categoryCompletion,
    };

    return categoryData;
  });

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
  };
}) satisfies PageServerLoad;
