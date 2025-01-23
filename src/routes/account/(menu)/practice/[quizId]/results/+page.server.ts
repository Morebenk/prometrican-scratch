import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./types";
import type { QuizWithCategory } from "../types";
import type { DbQuizAttempt } from "../../types";

interface QuizAnswer {
  question: {
    id: string;
    content: string;
    explanation: string | null;
    image_url: string | null;
    choices: {
      id: string;
      content: string;
      is_correct: boolean;
      explanation: string | null;
    }[];
  };
  selected_choice: {
    id: string;
    content: string;
    is_correct: boolean;
    explanation: string | null;
  };
}

export const load: PageServerLoad = async ({ params, locals }) => {
  const { quizId } = params;
  const supabase = locals.supabase;

  if (!locals.user) {
    throw error(401, "Unauthorized");
  }

  try {
    // Get quiz with category and subject info
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
      .single();

    if (quizError) {
      console.error("Error fetching quiz:", quizError);
      throw error(500, "Error fetching quiz details");
    }

    if (!quiz) {
      throw error(404, "Quiz not found");
    }

    // Get latest completed attempt
    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("quiz_id", quizId)
      .eq("user_id", locals.user.id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(1)
      .single();

    if (attemptError) {
      console.error("Error fetching attempt:", attemptError);
      throw error(500, "Error fetching quiz attempt");
    }

    if (!attempt) {
      // Redirect to quiz if no completed attempt found
      redirect(303, `/account/practice/${quizId}`);
    }

    // Get answers with questions and choices
    const { data: answers, error: answersError } = await supabase
      .from("quiz_answers")
      .select(
        `
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
        ),
        selected_choice:choices!quiz_answers_choice_id_fkey (
          id,
          content,
          is_correct,
          explanation
        )
      `,
      )
      .eq("attempt_id", attempt.id)
      .order("created_at");

    if (answersError) {
      console.error("Error fetching answers:", answersError);
      throw error(500, "Error fetching quiz answers");
    }

    return {
      quiz: quiz as QuizWithCategory,
      attempt: attempt as DbQuizAttempt,
      answers: answers as QuizAnswer[],
    };
  } catch (e) {
    console.error("Error in quiz results load:", e);
    throw error(500, "Error loading quiz results");
  }
};
