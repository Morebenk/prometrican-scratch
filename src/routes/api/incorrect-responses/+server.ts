import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, locals }) => {
  const { questionId, choiceId } = await request.json();

  if (!questionId || !choiceId) {
    throw error(400, "Missing required fields");
  }

  if (!locals.user) {
    throw error(401, "Unauthorized");
  }

  try {
    const supabase = locals.supabase;

    // Let Supabase generate the id and timestamp
    const { error: createError } = await supabase
      .from("incorrect_responses")
      .insert({
        user_id: locals.user.id,
        question_id: questionId,
        choice_id: choiceId,
      });

    if (createError) {
      console.error("DB Error:", createError);
      throw error(500, "Error recording incorrect response");
    }

    return json({ success: true });
  } catch (e) {
    console.error("Error recording incorrect response:", e);
    throw error(500, "Internal server error");
  }
};
