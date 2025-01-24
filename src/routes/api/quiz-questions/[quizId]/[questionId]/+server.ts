import { error, json, type RequestEvent } from "@sveltejs/kit";
import type { DbQuiz } from "../../../../admin/types";

type QuizQuestion = {
  id: string;
  quiz_id: string;
  question_id: string;
  order: number;
};

export async function DELETE(event: RequestEvent) {
  const { supabase, user } = event.locals;
  const { quizId, questionId } = event.params;

  if (!user || !quizId || !questionId) {
    throw error(401, "Unauthorized");
  }

  try {
    // Verify the quiz exists and user has access
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id")
      .eq("id", quizId)
      .single();

    if (quizError || !quiz) {
      throw error(404, "Quiz not found");
    }

    // Remove the question from the quiz
    const { error: deleteError } = await supabase
      .from("quiz_questions")
      .delete()
      .eq("quiz_id", quizId)
      .eq("question_id", questionId);

    if (deleteError) {
      console.error("Error removing question from quiz:", deleteError);
      throw error(500, "Failed to remove question from quiz");
    }

    // Update order of remaining questions
    const { data: remainingQuestions, error: fetchError } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("order");

    if (!fetchError && remainingQuestions) {
      // Reorder questions to close any gaps
      const updates: QuizQuestion[] = remainingQuestions.map(
        (question, index) => ({
          ...question,
          order: index,
        }),
      );

      if (updates.length > 0) {
        const { error: updateError } = await supabase
          .from("quiz_questions")
          .upsert(updates, {
            onConflict: "id",
          });

        if (updateError) {
          console.error("Error updating question order:", updateError);
        }
      }
    }

    return json({ success: true });
  } catch (err) {
    console.error("Error in quiz question deletion:", err);
    throw error(500, "An unexpected error occurred");
  }
}
