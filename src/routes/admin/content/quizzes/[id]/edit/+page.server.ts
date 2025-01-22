import { error, fail, redirect } from "@sveltejs/kit";
import type { Database } from "../../../../../../DatabaseDefinitions";

type QuizUpdate = Database["public"]["Tables"]["quizzes"]["Update"];

interface FormData {
  title?: string;
  description?: string;
  category_id?: string;
  is_active?: boolean;
}

export async function load({
  locals,
  params,
}: {
  locals: App.Locals;
  params: { id: string };
}) {
  const { supabase, user } = locals;
  const { id } = params;

  if (!user) {
    throw error(401, "Unauthorized");
  }

  try {
    // Get the quiz data
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select(
        `
        *,
        category:categories(
          id,
          name,
          subject:subjects(
            id,
            name
          )
        ),
        quiz_attempts(count)
      `,
      )
      .eq("id", id)
      .single();

    if (quizError || !quiz) {
      throw error(404, "Quiz not found");
    }

    // Get all subjects with their categories for the dropdown
    const { data: subjects, error: fetchError } = await supabase
      .from("subjects")
      .select(
        `
        id,
        name,
        categories (
          id,
          name
        )
      `,
      )
      .order("name");

    if (fetchError) {
      console.error("Error fetching subjects:", fetchError);
      throw error(500, "Failed to load subjects");
    }

    return {
      quiz,
      subjects: subjects || [],
      hasAttempts: quiz.quiz_attempts[0]?.count > 0,
    };
  } catch (err) {
    console.error("Error in loading quiz:", err);
    throw error(500, "Failed to load quiz");
  }
}

export const actions = {
  default: async ({
    request,
    locals,
    params,
  }: {
    request: Request;
    locals: App.Locals;
    params: { id: string };
  }) => {
    const { supabase, user } = locals;
    const { id } = params;

    if (!user) {
      throw error(401, "Unauthorized");
    }

    const formData = await request.formData();
    const data: FormData = {
      title: formData.get("title")?.toString().trim(),
      description: formData.get("description")?.toString().trim(),
      category_id: formData.get("category_id")?.toString(),
      is_active: formData.get("is_active") === "true",
    };

    // Validation
    const errors: Record<string, string> = {};

    if (!data.title) {
      errors.title = "Title is required";
    } else if (data.title.length < 3) {
      errors.title = "Title must be at least 3 characters";
    } else if (data.title.length > 100) {
      errors.title = "Title must be less than 100 characters";
    }

    if (!data.category_id) {
      errors.category_id = "Category is required";
    }

    if (data.description && data.description.length > 500) {
      errors.description = "Description must be less than 500 characters";
    }

    if (Object.keys(errors).length > 0) {
      return fail(400, {
        errors,
        values: data,
      });
    }

    try {
      // Verify category exists
      if (data.category_id) {
        const { data: category, error: categoryError } = await supabase
          .from("categories")
          .select("id")
          .eq("id", data.category_id)
          .single();

        if (categoryError || !category) {
          return fail(400, {
            errors: { category_id: "Invalid category selected" },
            values: data,
          });
        }
      }

      // Check if quiz with same title exists in the same category (excluding current quiz)
      if (data.category_id && data.title) {
        const { data: existingQuiz } = await supabase
          .from("quizzes")
          .select("id")
          .eq("category_id", data.category_id)
          .eq("title", data.title)
          .neq("id", id)
          .single();

        if (existingQuiz) {
          return fail(400, {
            errors: {
              title: "A quiz with this title already exists in this category",
            },
            values: data,
          });
        }
      }

      // Update quiz
      if (!data.title || !data.category_id) {
        throw new Error("Title and category are required");
      }

      const updateData: QuizUpdate = {
        title: data.title,
        description: data.description || null,
        category_id: data.category_id,
        is_active: data.is_active ?? true,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("quizzes")
        .update(updateData)
        .eq("id", id);

      if (updateError) {
        console.error("Error updating quiz:", updateError);
        return fail(500, {
          error: "Failed to update quiz. Please try again.",
          values: data,
        });
      }

      throw redirect(303, "/admin/content/quizzes");
    } catch (err) {
      if (err instanceof Error && "status" in err) {
        throw err;
      }

      console.error("Error in quiz update:", err);
      return fail(500, {
        error: "An unexpected error occurred. Please try again.",
        values: data,
      });
    }
  },
};
