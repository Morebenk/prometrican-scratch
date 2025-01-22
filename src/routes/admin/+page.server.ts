import { error } from "@sveltejs/kit";
import type { Stats } from "./types";

export async function load({ locals }: { locals: App.Locals }) {
  const { supabase, user } = locals;

  if (!user) {
    throw error(401, "Unauthorized");
  }

  try {
    // Get total users count
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Get total questions count
    const { count: totalQuestions } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true });

    // Get total quizzes count
    const { count: totalQuizzes } = await supabase
      .from("quizzes")
      .select("*", { count: "exact", head: true });

    // Get pending flags count
    const { count: pendingFlags } = await supabase
      .from("flagged_questions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // Get today's quiz attempts
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: recentAttempts } = await supabase
      .from("quiz_attempts")
      .select("*", { count: "exact", head: true })
      .gte("started_at", today.toISOString());

    const stats: Stats = {
      totalUsers: totalUsers || 0,
      totalQuestions: totalQuestions || 0,
      totalQuizzes: totalQuizzes || 0,
      pendingFlags: pendingFlags || 0,
      recentAttempts: recentAttempts || 0,
    };

    return { stats };
  } catch (err) {
    console.error("Error loading admin dashboard stats:", err);
    throw error(500, "Failed to load dashboard statistics");
  }
}
