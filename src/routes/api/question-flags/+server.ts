import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, locals }) => {
  const { questionId, type, reason } = await request.json();

  if (!questionId || !type || !reason) {
    throw error(400, "Missing required fields");
  }

  if (!locals.user) {
    throw error(401, "Unauthorized");
  }

  try {
    const supabase = locals.supabase;

    // Insert new flag
    const { error: createError } = await supabase
      .from("question_flags")
      .insert({
        user_id: locals.user.id,
        question_id: questionId,
        flag_type: type,
        description: reason,
        status: "pending",
      });

    if (createError) {
      throw error(500, "Error creating flag");
    }

    return json({ success: true });
  } catch (e) {
    console.error("Error creating flag:", e);
    throw error(500, "Internal server error");
  }
};
