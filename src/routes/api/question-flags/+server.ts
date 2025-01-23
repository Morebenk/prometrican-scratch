import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import type { PostgrestError } from "@supabase/supabase-js";

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }

  if (!locals.supabase) {
    throw error(500, "Database client not available");
  }

  try {
    const { questionId, type, reason: description } = await request.json();

    if (!questionId || !type) {
      throw error(400, "Missing required fields");
    }

    // First verify the question exists
    const { data: question, error: questionError } = await locals.supabase
      .from("questions")
      .select("id")
      .eq("id", questionId)
      .single();

    if (questionError) {
      console.error("Error verifying question:", questionError);
      throw error(404, "Question not found");
    }

    // Check for existing flag from this user for this question
    const { data: existingFlag } = await locals.supabase
      .from("flagged_questions")
      .select()
      .eq("user_id", locals.user.id)
      .eq("question_id", questionId)
      .maybeSingle();

    let result;

    if (existingFlag) {
      // Update existing flag
      const { data: updatedFlag, error: updateError } = await locals.supabase
        .from("flagged_questions")
        .update({
          reason: type,
          details: description || null,
          status: "pending", // Reset status since it's a new report
        })
        .eq("id", existingFlag.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating flag:", {
          error: updateError,
          details: (updateError as PostgrestError).details,
          hint: (updateError as PostgrestError).hint,
          code: (updateError as PostgrestError).code,
        });
        throw error(500, "Error updating flag");
      }

      result = updatedFlag;
    } else {
      // Create new flag
      const { data: newFlag, error: createError } = await locals.supabase
        .from("flagged_questions")
        .insert({
          user_id: locals.user.id,
          question_id: questionId,
          reason: type,
          details: description || null,
          status: "pending",
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating flag:", {
          error: createError,
          details: (createError as PostgrestError).details,
          hint: (createError as PostgrestError).hint,
          code: (createError as PostgrestError).code,
        });
        throw error(500, "Error creating flag");
      }

      result = newFlag;
    }

    return json({ success: true, flag: result });
  } catch (e) {
    console.error("Error in question flags endpoint:", e);
    if (e instanceof Error) {
      throw error(500, e.message);
    }
    throw error(500, "Internal server error");
  }
};
