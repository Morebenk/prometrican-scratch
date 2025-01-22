import { redirect } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import type { Profile } from "./types";

export const load = async ({ locals }: { locals: App.Locals }) => {
  const { supabase, user } = locals;

  if (!user) {
    throw redirect(303, "/login");
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as Profile | null;

  if (!typedProfile?.is_admin) {
    throw redirect(303, "/");
  }

  return {
    user,
  };
};
