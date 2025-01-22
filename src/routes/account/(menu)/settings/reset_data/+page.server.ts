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
        const { error: deleteQuizAttempts } = await supabase
          .from("quiz_attempts")
          .delete()
          .eq("user_id", userId);

        if (deleteQuizAttempts) {
          console.error("Error deleting quiz attempts:", deleteQuizAttempts);
          throw error(500, "Failed to reset quiz attempts");
        }
      }

      if (resetIncorrect) {
        const { error: deleteIncorrectResponses } = await supabase
          .from("incorrect_responses")
          .delete()
          .eq("user_id", userId);

        if (deleteIncorrectResponses) {
          console.error(
            "Error deleting incorrect responses:",
            deleteIncorrectResponses,
          );
          throw error(500, "Failed to reset incorrect responses");
        }
      }

      if (resetBookmarks) {
        const { error: deleteBookmarks } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", userId);

        if (deleteBookmarks) {
          console.error("Error deleting bookmarks:", deleteBookmarks);
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
