import { error, json, type RequestEvent } from "@sveltejs/kit";

export async function POST(event: RequestEvent) {
  const { supabase, user } = event.locals;

  if (!user) {
    throw error(401, "Unauthorized");
  }

  try {
    const { quiz_id, question_id, order } = await event.request.json();

    if (!quiz_id || !question_id) {
      throw error(400, "Missing required fields");
    }

    // Verify the quiz exists and user has access
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id")
      .eq("id", quiz_id)
      .single();

    if (quizError || !quiz) {
      throw error(404, "Quiz not found");
    }

    // Add the question to the quiz
    const { error: insertError } = await supabase
      .from("quiz_questions")
      .insert({
        quiz_id,
        question_id,
        order: order || 0,
      });

    if (insertError) {
      console.error("Error adding question to quiz:", insertError);
      throw error(500, "Failed to add question to quiz");
    }

    return json({ success: true });
  } catch (err) {
    console.error("Error in quiz question creation:", err);
    throw error(500, "An unexpected error occurred");
  }
}
