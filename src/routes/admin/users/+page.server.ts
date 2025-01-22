import { error } from "@sveltejs/kit";
import type { AdminUser } from "../types";

export async function load({ locals }: { locals: App.Locals }) {
  const { supabase } = locals;

  try {
    // Get all users with their profiles
    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    // Convert to AdminUser type
    const users = data?.map((profile) => ({
      ...profile,
      is_admin: profile.is_admin || false,
      email: profile.email || "",
    })) as AdminUser[];

    return {
      users,
    };
  } catch (err) {
    console.error("Error loading users:", err);
    throw error(500, "Failed to load users");
  }
}

export const actions = {
  toggleAdmin: async ({
    request,
    locals,
  }: {
    request: Request;
    locals: App.Locals;
  }) => {
    const { supabase, user } = locals;

    if (!user) {
      throw error(401, "Unauthorized");
    }

    try {
      const formData = await request.formData();
      const userId = formData.get("userId")?.toString();
      const value = formData.get("value") === "true";

      if (!userId) {
        throw error(400, "User ID is required");
      }

      // Check if trying to modify own admin status
      if (userId === user.id) {
        throw error(403, "Cannot modify your own admin status");
      }

      // Update admin status
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          is_admin: value,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

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
