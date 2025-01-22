import { error } from "@sveltejs/kit";
import type { AdminUser, QuizAttempt } from "../../types";

export async function load({
  params,
  locals,
}: {
  params: { id: string };
  locals: App.Locals;
}) {
  const { supabase } = locals;
  const userId = params.id;

  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) {
      throw profileError;
    }

    if (!profile) {
      throw error(404, "User not found");
    }

    // Get quiz attempts
    const { data: attempts, error: attemptsError } = await supabase
      .from("quiz_attempts")
      .select(
        `
                *,
                quiz:quizzes(title)
            `,
      )
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(10);

    if (attemptsError) {
      throw attemptsError;
    }

    // Calculate statistics
    const { data: stats, error: statsError } = await supabase
      .from("quiz_attempts")
      .select("score")
      .eq("user_id", userId)
      .eq("completed_at", "is not null");

    if (statsError) {
      throw statsError;
    }

    const totalAttempts = stats?.length || 0;
    const averageScore =
      stats?.reduce((acc, curr) => acc + (curr.score || 0), 0) /
        (totalAttempts || 1) || 0;

    // Convert to AdminUser type and include email
    const user: AdminUser = {
      ...profile,
      is_admin: profile.is_admin || false,
      email: profile.email || "",
    };

    const typedAttempts =
      (attempts?.map((attempt) => ({
        ...attempt,
        quiz_title: attempt.quiz?.title || "Unknown Quiz",
      })) as (QuizAttempt & { quiz_title: string })[]) || [];

    return {
      user,
      activity: {
        recentAttempts: typedAttempts,
        totalAttempts,
        averageScore,
      },
    };
  } catch (err) {
    console.error("Error loading user details:", err);
    if (err instanceof Error && "status" in err) {
      throw err;
    }
    throw error(500, "Failed to load user details");
  }
}

export const actions = {
  toggleAdmin: async ({
    params,
    request,
    locals,
  }: {
    params: { id: string };
    request: Request;
    locals: App.Locals;
  }) => {
    const { supabase, user: currentUser } = locals;
    const targetUserId = params.id;

    if (!currentUser) {
      throw error(401, "Unauthorized");
    }

    // Prevent self-modification
    if (targetUserId === currentUser.id) {
      throw error(403, "Cannot modify your own admin status");
    }

    try {
      const formData = await request.formData();
      const value = formData.get("value") === "true";

      // Update admin status
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          is_admin: value,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetUserId);

      if (updateError) {
        throw updateError;
      }

      return { success: true };
    } catch (err) {
      console.error("Error updating admin status:", err);
      throw error(500, "Failed to update admin status");
    }
  },
};
