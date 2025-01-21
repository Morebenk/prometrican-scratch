import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";

interface FlagData {
  questionId: string;
  type: string;
  reason: string;
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const { questionId, type, reason } = (await request.json()) as FlagData;

  if (!questionId || !type || !reason) {
    throw error(400, "Missing required fields");
  }

  if (!locals.user) {
    throw error(401, "Unauthorized");
  }

  try {
    const supabase = locals.supabase;

    // Let Supabase generate the id and timestamp
    const { error: createError } = await supabase
      .from("flagged_questions")
      .insert({
        question_id: questionId,
        user_id: locals.user.id,
        reason: type,
        details: reason,
        status: "pending",
      });

    if (createError) {
      console.error("DB Error:", createError);
      throw error(500, "Error creating flag");
    }

    return json({ success: true });
  } catch (e) {
    console.error("Error creating flag:", e);
    throw error(500, "Internal server error");
  }
};
