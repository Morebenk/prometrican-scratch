import { error, fail } from "@sveltejs/kit";
import type { Actions } from "./$types";

export const actions: Actions = {
  resetData: async ({ request, locals }) => {
    const formData = await request.formData();
    const currentPassword = formData.get("currentPassword")?.toString();
    const resetAttempts = formData.get("resetAttempts") === "on";
    const resetIncorrect = formData.get("resetIncorrect") === "on";
    const resetBookmarks = formData.get("resetBookmarks") === "on";

    if (!locals.user) {
      throw error(401, "Unauthorized");
    }

    if (!currentPassword) {
      return fail(400, {
        errorMessage: "Password is required",
      });
    }

    try {
      const supabase = locals.supabase;

      // Verify password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: locals.user.email,
        password: currentPassword,
      });

      if (signInError) {
        return fail(400, {
          errorMessage: "Current password is incorrect",
        });
      }

      const userId = locals.user.id;

      // Perform selective deletions based on user choices
      if (resetAttempts) {
        const { error: deleteQuizAttemptsError } =
          await locals.supabaseServiceRole
            .from("quiz_attempts")
            .delete()
            .eq("user_id", userId);

        if (deleteQuizAttemptsError) {
          console.error(
            "Error deleting quiz attempts:",
            deleteQuizAttemptsError,
          );
          throw error(500, "Failed to reset quiz attempts");
        }
      }

      if (resetIncorrect) {
        const { error: deleteIncorrectResponsesError } =
          await locals.supabaseServiceRole
            .from("incorrect_responses")
            .delete()
            .eq("user_id", userId);

        if (deleteIncorrectResponsesError) {
          console.error(
            "Error deleting incorrect responses:",
            deleteIncorrectResponsesError,
          );
          throw error(500, "Failed to reset incorrect responses");
        }
      }

      if (resetBookmarks) {
        const { error: deleteBookmarksError } = await locals.supabaseServiceRole
          .from("bookmarks")
          .delete()
          .eq("user_id", userId);

        if (deleteBookmarksError) {
          console.error("Error deleting bookmarks:", deleteBookmarksError);
          throw error(500, "Failed to reset bookmarks");
        }
      }

      return { success: true };
    } catch (e) {
      console.error("Error in reset data action:", e);
      throw error(500, "Internal server error");
    }
  },
};
