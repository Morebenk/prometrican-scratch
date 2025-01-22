import { error, fail, redirect } from "@sveltejs/kit";
import type { Database } from "../../../../../DatabaseDefinitions";

type QuizInsert = Database["public"]["Tables"]["quizzes"]["Insert"];

interface FormData {
  title?: string;
  description?: string;
  category_id?: string;
  is_active?: boolean;
}

export async function load({ locals }: { locals: App.Locals }) {
  const { supabase, user } = locals;

  if (!user) {
    throw error(401, "Unauthorized");
  }

  try {
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
      subjects: subjects || [],
    };
  } catch (err) {
    console.error("Error in loading form data:", err);
    throw error(500, "Failed to load form data");
  }
}

export const actions = {
  default: async ({
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

      // Check if quiz with same title exists in the same category
      if (data.category_id && data.title) {
        const { data: existingQuiz } = await supabase
          .from("quizzes")
          .select("id")
          .eq("category_id", data.category_id)
          .eq("title", data.title)
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

      // Create quiz
      if (!data.title || !data.category_id) {
        throw new Error("Title and category are required");
      }

      const newQuiz: QuizInsert = {
        title: data.title,
        description: data.description || null,
        category_id: data.category_id,
        is_active: data.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: createError } = await supabase
        .from("quizzes")
        .insert(newQuiz);

      if (createError) {
        console.error("Error creating quiz:", createError);
        return fail(500, {
          error: "Failed to create quiz. Please try again.",
          values: data,
        });
      }

      throw redirect(303, "/admin/content/quizzes");
    } catch (err) {
      if (err instanceof Error && "status" in err) {
        throw err;
      }

      console.error("Error in quiz creation:", err);
      return fail(500, {
        error: "An unexpected error occurred. Please try again.",
        values: data,
      });
    }
  },
};
