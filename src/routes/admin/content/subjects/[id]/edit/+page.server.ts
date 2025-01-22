import { error, fail, redirect } from "@sveltejs/kit";
import type { Database } from "../../../../../../DatabaseDefinitions";
import type { Subject } from "../../../../types.js";

type SubjectUpdate = Database["public"]["Tables"]["subjects"]["Update"];

interface FormData {
  name?: string;
  description?: string;
}

export async function load({
  params,
  locals,
}: {
  params: { id: string };
  locals: App.Locals;
}) {
  const { supabase, user } = locals;

  if (!user) {
    throw error(401, "Unauthorized");
  }

  const { data: subject, error: fetchError } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", params.id)
    .single();

  if (fetchError) {
    console.error("Error fetching subject:", fetchError);
    throw error(404, "Subject not found");
  }

  return {
    subject: subject as Subject,
  };
}

export const actions = {
  default: async ({
    params,
    request,
    locals,
  }: {
    params: { id: string };
    request: Request;
    locals: App.Locals;
  }) => {
    const { supabase, user } = locals;

    if (!user) {
      throw error(401, "Unauthorized");
    }

    const formData = await request.formData();
    const name = formData.get("name")?.toString().trim();
    const description = formData.get("description")?.toString().trim();

    const data: FormData = { name, description };

    // Validation
    const errors: Record<string, string> = {};

    if (!name) {
      errors.name = "Name is required";
    } else if (name.length < 2) {
      errors.name = "Name must be at least 2 characters";
    } else if (name.length > 50) {
      errors.name = "Name must be less than 50 characters";
    }

    if (description && description.length > 500) {
      errors.description = "Description must be less than 500 characters";
    }

    if (Object.keys(errors).length > 0) {
      return fail(400, {
        errors,
        values: data,
      });
    }

    try {
      // At this point, name is validated and non-empty
      if (!name) {
        throw new Error("Name is required");
      }

      // Check if another subject with the same name exists
      const { data: existingSubject } = await supabase
        .from("subjects")
        .select("id")
        .eq("name", name)
        .neq("id", params.id)
        .single();

      if (existingSubject) {
        return fail(400, {
          errors: { name: "A subject with this name already exists" },
          values: data,
        });
      }

      // Update subject
      const updateData: SubjectUpdate = {
        name,
        description: description || null,
        updated_at: new Date(),
      };

      const { error: updateError } = await supabase
        .from("subjects")
        .update(updateData)
        .eq("id", params.id);

      if (updateError) {
        console.error("Error updating subject:", updateError);
        return fail(500, {
          error: "Failed to update subject. Please try again.",
          values: data,
        });
      }

      throw redirect(303, "/admin/content/subjects");
    } catch (err) {
      if (err instanceof Error && "status" in err) {
        throw err;
      }

      console.error("Error in subject update:", err);
      return fail(500, {
        error: "An unexpected error occurred. Please try again.",
        values: data,
      });
    }
  },
};
