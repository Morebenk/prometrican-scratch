import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import type { DbIncorrectResponse, IncorrectResponsePayload } from "./types";

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const payload = (await request.json()) as IncorrectResponsePayload;
    const { questionId, choiceId, quizAttemptId } = payload;

    if (!questionId || !choiceId || !quizAttemptId) {
      return json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    // Verify the quiz attempt belongs to the user and is not completed
    const { data: attemptData, error: attemptError } = await locals.supabase
      .from("quiz_attempts")
      .select("id, completed_at")
      .eq("id", quizAttemptId)
      .eq("user_id", locals.user.id)
      .maybeSingle();

    if (attemptError || !attemptData) {
      return json(
        { success: false, message: "Invalid quiz attempt" },
        { status: 403 },
      );
    }

    if (attemptData.completed_at) {
      return json(
        { success: false, message: "Cannot modify completed quiz attempt" },
        { status: 400 },
      );
    }

    const incorrectResponse: DbIncorrectResponse = {
      user_id: locals.user.id,
      quiz_attempt_id: quizAttemptId,
      question_id: questionId,
      choice_id: choiceId,
    };

    // Record the incorrect response using column names for conflict handling
    const { error: insertError } = await locals.supabase
      .from("incorrect_responses")
      .upsert([incorrectResponse], {
        onConflict: "quiz_attempt_id,question_id,choice_id",
      });

    if (insertError) {
      console.error("Error recording incorrect response:", insertError);
      return json(
        { success: false, message: "Failed to record response" },
        { status: 500 },
      );
    }

    return json({ success: true });
  } catch (error) {
    console.error("Error in incorrect responses endpoint:", error);
    return json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
};
