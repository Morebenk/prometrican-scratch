import { error } from "@sveltejs/kit";
import type { Quiz } from "../../types.js";

export async function load({ locals }: { locals: App.Locals }) {
  const { supabase, user } = locals;

  if (!user) {
    throw error(401, "Unauthorized");
  }

  try {
    const { data: quizzes, error: fetchError } = await supabase
      .from("quizzes")
      .select(
        `
        *,
        category:categories(
          name,
          subject:subjects(name)
        ),
        quiz_attempts(count)
      `,
      )
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching quizzes:", fetchError);
      throw error(500, "Failed to load quizzes");
    }

    return {
      quizzes: quizzes as (Quiz & {
        category: {
          name: string;
          subject: {
            name: string;
          };
        };
        quiz_attempts: { count: number }[];
      })[],
    };
  } catch (err) {
    console.error("Error in quizzes load function:", err);
    throw error(500, "Failed to load quizzes");
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
      throw error(400, "Quiz ID is required");
    }

    // Check if quiz has any attempts
    const { count: attemptCount } = await supabase
      .from("quiz_attempts")
      .select("id", { count: "exact", head: true })
      .eq("quiz_id", id);

    if (attemptCount && attemptCount > 0) {
      throw error(400, "Cannot delete quiz with existing attempts");
    }

    const { error: deleteError } = await supabase
      .from("quizzes")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting quiz:", deleteError);
      throw error(500, "Failed to delete quiz");
    }

    return { success: true };
  },
};
