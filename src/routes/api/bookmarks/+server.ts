import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, locals }) => {
  const { questionId } = await request.json();

  if (!questionId) {
    throw error(400, "Missing question ID");
  }

  if (!locals.user) {
    throw error(401, "Unauthorized");
  }

  try {
    const supabase = locals.supabase;

    // Check if bookmark already exists
    const { data: existing } = await supabase
      .from("bookmarks")
      .select()
      .eq("user_id", locals.user.id)
      .eq("question_id", questionId)
      .single();

    if (existing) {
      throw error(400, "Bookmark already exists");
    }

    // Let Supabase generate the id and timestamp
    const { error: createError } = await supabase.from("bookmarks").insert({
      user_id: locals.user.id,
      question_id: questionId,
    });

    if (createError) {
      console.error("DB Error:", createError);
      throw error(500, "Error creating bookmark");
    }

    return json({ success: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Bookmark already exists") {
      throw error(400, e.message);
    }
    console.error("Error creating bookmark:", e);
    throw error(500, "Internal server error");
  }
};

export const DELETE: RequestHandler = async ({ url, locals }) => {
  const questionId = url.searchParams.get("questionId");

  if (!questionId) {
    throw error(400, "Missing question ID");
  }

  if (!locals.user) {
    throw error(401, "Unauthorized");
  }

  try {
    const supabase = locals.supabase;

    // Delete bookmark
    const { error: deleteError } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", locals.user.id)
      .eq("question_id", questionId);

    if (deleteError) {
      console.error("DB Error:", deleteError);
      throw error(500, "Error removing bookmark");
    }

    return json({ success: true });
  } catch (e) {
    console.error("Error removing bookmark:", e);
    throw error(500, "Internal server error");
  }
};
