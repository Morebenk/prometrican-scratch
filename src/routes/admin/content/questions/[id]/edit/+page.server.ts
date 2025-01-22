import { error, fail, redirect } from "@sveltejs/kit";
import type { Database } from "../../../../../../DatabaseDefinitions";

type QuestionUpdate = Database["public"]["Tables"]["questions"]["Update"];
type ChoiceUpdate = Database["public"]["Tables"]["choices"]["Update"];

interface Choice {
  id?: string;
  content: string;
  is_correct: boolean;
  explanation?: string;
}

interface FormData {
  category_id?: string;
  content?: string;
  explanation?: string;
  image_url?: string;
  is_active?: boolean;
  choices?: Choice[];
  deletedChoiceIds?: string[];
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
    const { data: question, error: questionError } = await supabase
      .from("questions")
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
        choices (
          id,
          content,
          is_correct,
          explanation
        )
      `,
      )
      .eq("id", id)
      .single();

    if (questionError || !question) {
      throw error(404, "Question not found");
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
      question,
      subjects: subjects || [],
    };
  } catch (err) {
    console.error("Error in loading question:", err);
    throw error(500, "Failed to load question");
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
      category_id: formData.get("category_id")?.toString(),
      content: formData.get("content")?.toString().trim(),
      explanation: formData.get("explanation")?.toString().trim(),
      image_url: formData.get("image_url")?.toString(),
      is_active: formData.get("is_active") === "true",
      choices: JSON.parse(formData.get("choices")?.toString() || "[]"),
      deletedChoiceIds: JSON.parse(
        formData.get("deletedChoiceIds")?.toString() || "[]",
      ),
    };

    // Validation
    const errors: Record<string, string> = {};

    if (!data.category_id) {
      errors.category_id = "Category is required";
    }

    if (!data.content) {
      errors.content = "Content is required";
    } else if (data.content.length < 10) {
      errors.content = "Content must be at least 10 characters";
    } else if (data.content.length > 1000) {
      errors.content = "Content must be less than 1000 characters";
    }

    if (data.explanation && data.explanation.length > 1000) {
      errors.explanation = "Explanation must be less than 1000 characters";
    }

    // Validate choices
    if (!data.choices || data.choices.length < 2) {
      errors.choices = "At least 2 choices are required";
    } else {
      const correctChoices = data.choices.filter((choice) => choice.is_correct);
      if (correctChoices.length !== 1) {
        errors.choices = "Exactly one correct choice must be selected";
      }

      if (data.choices.some((choice) => !choice.content.trim())) {
        errors.choices = "All choices must have content";
      }

      if (data.choices.some((choice) => choice.content.length > 500)) {
        errors.choices = "Choice content must be less than 500 characters";
      }

      // Check for duplicate choices
      const choiceTexts = data.choices.map((choice) => choice.content.trim());
      if (new Set(choiceTexts).size !== choiceTexts.length) {
        errors.choices = "All choices must be unique";
      }
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

      // Update question
      const updateData: QuestionUpdate = {
        category_id: data.category_id || null,
        content: data.content || "",
        image_url: data.image_url || null,
        explanation: data.explanation || null,
        is_active: data.is_active ?? true,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("questions")
        .update(updateData)
        .eq("id", id);

      if (updateError) {
        console.error("Error updating question:", updateError);
        return fail(500, {
          error: "Failed to update question. Please try again.",
          values: data,
        });
      }

      // Delete removed choices
      if (data.deletedChoiceIds && data.deletedChoiceIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("choices")
          .delete()
          .in("id", data.deletedChoiceIds);

        if (deleteError) {
          console.error("Error deleting choices:", deleteError);
          return fail(500, {
            error: "Failed to delete choices. Please try again.",
            values: data,
          });
        }
      }

      // Update existing choices and add new ones
      if (data.choices && data.choices.length > 0) {
        const existingChoices = data.choices.filter((c) => c.id);
        const newChoices = data.choices.filter((c) => !c.id);

        // Update existing choices
        if (existingChoices.length > 0) {
          const { error: updateChoicesError } = await supabase
            .from("choices")
            .upsert(
              existingChoices.map((choice) => ({
                id: choice.id,
                question_id: id,
                content: choice.content.trim(),
                is_correct: choice.is_correct,
                explanation: choice.explanation?.trim() || null,
              })),
            );

          if (updateChoicesError) {
            console.error("Error updating choices:", updateChoicesError);
            return fail(500, {
              error: "Failed to update choices. Please try again.",
              values: data,
            });
          }
        }

        // Add new choices
        if (newChoices.length > 0) {
          const { error: newChoicesError } = await supabase
            .from("choices")
            .insert(
              newChoices.map((choice) => ({
                question_id: id,
                content: choice.content.trim(),
                is_correct: choice.is_correct,
                explanation: choice.explanation?.trim() || null,
              })),
            );

          if (newChoicesError) {
            console.error("Error adding new choices:", newChoicesError);
            return fail(500, {
              error: "Failed to add new choices. Please try again.",
              values: data,
            });
          }
        }
      }

      throw redirect(303, "/admin/content/questions");
    } catch (err) {
      if (err instanceof Error && "status" in err) {
        throw err;
      }

      console.error("Error in question update:", err);
      return fail(500, {
        error: "An unexpected error occurred. Please try again.",
        values: data,
      });
    }
  },
};
