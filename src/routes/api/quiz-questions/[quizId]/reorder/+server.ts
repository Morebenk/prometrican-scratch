import { error, json, type RequestEvent } from "@sveltejs/kit";

type ReorderRequest = {
  old_index: number;
  new_index: number;
};

type QuizQuestion = {
  id: string;
  quiz_id: string;
  question_id: string;
  order: number;
};

export async function POST(event: RequestEvent) {
  const { supabase, user } = event.locals;
  const { quizId } = event.params;

  if (!user || !quizId) {
    throw error(401, "Unauthorized");
  }

  try {
    const { old_index, new_index }: ReorderRequest = await event.request.json();

    if (typeof old_index !== "number" || typeof new_index !== "number") {
      throw error(400, "Invalid index values");
    }

    // Verify the quiz exists and user has access
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id")
      .eq("id", quizId)
      .single();

    if (quizError || !quiz) {
      throw error(404, "Quiz not found");
    }

    // Get all questions for this quiz
    const { data: questions, error: fetchError } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("order");

    if (fetchError || !questions) {
      throw error(500, "Failed to fetch quiz questions");
    }

    // Validate indices
    if (
      old_index < 0 ||
      old_index >= questions.length ||
      new_index < 0 ||
      new_index >= questions.length
    ) {
      throw error(400, "Invalid index values");
    }

    // Update orders
    const updates: QuizQuestion[] = questions.map((question) => {
      const currentIndex = questions.findIndex((q) => q.id === question.id);
      let newOrder: number;

      if (currentIndex === old_index) {
        // This is the question being moved
        newOrder = new_index;
      } else if (old_index < new_index) {
        // Moving question down
        if (currentIndex > old_index && currentIndex <= new_index) {
          newOrder = currentIndex - 1;
        } else {
          newOrder = currentIndex;
        }
      } else {
        // Moving question up
        if (currentIndex >= new_index && currentIndex < old_index) {
          newOrder = currentIndex + 1;
        } else {
          newOrder = currentIndex;
        }
      }

      return {
        id: question.id,
        quiz_id: question.quiz_id,
        question_id: question.question_id,
        order: newOrder,
      };
    });

    // Update all questions with their new order
    const { error: updateError } = await supabase
      .from("quiz_questions")
      .upsert(updates, {
        onConflict: "id",
      });

    if (updateError) {
      console.error("Error updating question order:", updateError);
      throw error(500, "Failed to update question order");
    }

    return json({ success: true });
  } catch (err) {
    console.error("Error in quiz question reordering:", err);
    throw error(500, "An unexpected error occurred");
  }
}
