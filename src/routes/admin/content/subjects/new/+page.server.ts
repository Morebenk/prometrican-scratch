import { error, fail, redirect } from "@sveltejs/kit";
import type { Database } from "../../../../../DatabaseDefinitions";

type SubjectInsert = Database["public"]["Tables"]["subjects"]["Insert"];

interface FormData {
  name?: string;
  description?: string;
}

export async function load({ locals }: { locals: App.Locals }) {
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }
  return {};
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
      name: formData.get("name")?.toString().trim(),
      description: formData.get("description")?.toString().trim(),
    };

    // Validation
    const errors: Record<string, string> = {};

    if (!data.name) {
      errors.name = "Name is required";
    } else if (data.name.length < 2) {
      errors.name = "Name must be at least 2 characters";
    } else if (data.name.length > 50) {
      errors.name = "Name must be less than 50 characters";
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
      // Check if subject with same name exists
      const { data: existingSubject } = await supabase
        .from("subjects")
        .select("id")
        .eq("name", data.name || "")
        .single();

      if (existingSubject) {
        return fail(400, {
          errors: { name: "A subject with this name already exists" },
          values: data,
        });
      }

      // Create subject
      if (!data.name) {
        throw new Error("Name is required");
      }

      const newSubject: SubjectInsert = {
        name: data.name,
        description: data.description || null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const { error: createError } = await supabase
        .from("subjects")
        .insert(newSubject);

      if (createError) {
        console.error("Error creating subject:", createError);
        return fail(500, {
          error: "Failed to create subject. Please try again.",
          values: data,
        });
      }

      throw redirect(303, "/admin/content/subjects");
    } catch (err) {
      if (err instanceof Error && "status" in err) {
        throw err;
      }

      console.error("Error in subject creation:", err);
      return fail(500, {
        error: "An unexpected error occurred. Please try again.",
        values: data,
      });
    }
  },
};
