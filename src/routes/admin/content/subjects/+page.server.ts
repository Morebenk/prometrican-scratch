import { error } from "@sveltejs/kit";
import type { Subject } from "../../types.js";

export async function load({ locals }: { locals: App.Locals }) {
  const { supabase, user } = locals;

  if (!user) {
    throw error(401, "Unauthorized");
  }

  try {
    const { data: subjects, error: fetchError } = await supabase
      .from("subjects")
      .select("*")
      .order("name");

    if (fetchError) {
      console.error("Error fetching subjects:", fetchError);
      throw error(500, "Failed to load subjects");
    }

    return {
      subjects: subjects as Subject[],
    };
  } catch (err) {
    console.error("Error in subjects load function:", err);
    throw error(500, "Failed to load subjects");
  }
}

export const actions = {
  delete: async ({
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

    const formData = await request.formData();
    const id = formData.get("id")?.toString();

    if (!id) {
      throw error(400, "Subject ID is required");
    }

    // First check if subject has categories
    const { data: categories } = await supabase
      .from("categories")
      .select("id")
      .eq("subject_id", id);

    if (categories && categories.length > 0) {
      throw error(400, "Cannot delete subject with existing categories");
    }

    const { error: deleteError } = await supabase
      .from("subjects")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting subject:", deleteError);
      throw error(500, "Failed to delete subject");
    }

    return { success: true };
  },
};
