import { error, fail, redirect } from "@sveltejs/kit";
import type { Database } from "../../../../../DatabaseDefinitions";

type QuestionInsert = Database["public"]["Tables"]["questions"]["Insert"];
type ChoiceInsert = Database["public"]["Tables"]["choices"]["Insert"];
type QuizQuestionInsert =
  Database["public"]["Tables"]["quiz_questions"]["Insert"];

interface Choice {
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
  quiz_ids?: string[];
  addAnother?: boolean;
}

export async function load({ locals }: { locals: App.Locals }) {
  const { supabase, user } = locals;

  if (!user) {
    throw error(401, "Unauthorized");
  }

  try {
    // Get all subjects with their categories for the dropdown
    const { data: subjects, error: subjectsError } = await supabase
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

    if (subjectsError) {
      console.error("Error fetching subjects:", subjectsError);
      throw error(500, "Failed to load subjects");
    }

    // Get active quizzes
    const { data: quizzes, error: quizzesError } = await supabase
      .from("quizzes")
      .select(
        `
        id,
        title,
        category:categories(
          id,
          name,
          subject:subjects(
            id,
            name
          )
        )
      `,
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (quizzesError) {
      console.error("Error fetching quizzes:", quizzesError);
      throw error(500, "Failed to load quizzes");
    }

    return {
      subjects: subjects || [],
      quizzes: quizzes || [],
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
      category_id: formData.get("category_id")?.toString(),
      content: formData.get("content")?.toString().trim(),
      explanation: formData.get("explanation")?.toString().trim(),
      image_url: formData.get("image_url")?.toString(),
      is_active: formData.get("is_active") === "true",
      choices: JSON.parse(formData.get("choices")?.toString() || "[]"),
      quiz_ids: JSON.parse(formData.get("quiz_ids")?.toString() || "[]"),
      addAnother: formData.get("add_another") === "true",
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

      // Verify quizzes exist and belong to the same category
      if (data.quiz_ids && data.quiz_ids.length > 0) {
        const { data: quizzes, error: quizzesError } = await supabase
          .from("quizzes")
          .select("id, category_id")
          .in("id", data.quiz_ids);

        if (quizzesError || !quizzes) {
          return fail(400, {
            errors: { quiz_ids: "Invalid quizzes selected" },
            values: data,
          });
        }

        const invalidQuizzes = quizzes.filter(
          (q) => q.category_id !== data.category_id,
        );
        if (invalidQuizzes.length > 0) {
          return fail(400, {
            errors: {
              quiz_ids: "All selected quizzes must belong to the same category",
            },
            values: data,
          });
        }
      }

      // Start a Supabase transaction
      // First create the question
      const { data: question, error: questionError } = await supabase
        .from("questions")
        .insert({
          category_id: data.category_id || null,
          content: data.content || "",
          image_url: data.image_url || null,
          explanation: data.explanation || null,
          is_active: data.is_active ?? true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (questionError || !question) {
        console.error("Error creating question:", questionError);
        return fail(500, {
          error: "Failed to create question. Please try again.",
          values: data,
        });
      }

      // Then create the choices
      if (data.choices && data.choices.length > 0) {
        const { error: choicesError } = await supabase.from("choices").insert(
          data.choices.map((choice) => ({
            question_id: question.id,
            content: choice.content.trim(),
            is_correct: choice.is_correct,
            explanation: choice.explanation?.trim() || null,
          })),
        );

        if (choicesError) {
          console.error("Error creating choices:", choicesError);
          // Try to clean up the question since choices failed
          await supabase.from("questions").delete().eq("id", question.id);
          return fail(500, {
            error: "Failed to create question choices. Please try again.",
            values: data,
          });
        }
      }

      // Add to selected quizzes
      if (data.quiz_ids && data.quiz_ids.length > 0) {
        // Get max order for each quiz
        const { data: maxOrders } = await supabase
          .from("quiz_questions")
          .select("quiz_id, order")
          .in("quiz_id", data.quiz_ids)
          .order("order", { ascending: false });

        const orderByQuiz = new Map(
          data.quiz_ids.map((id) => [
            id,
            Math.max(
              ...(maxOrders
                ?.filter((m) => m.quiz_id === id)
                .map((m) => m.order) || [0]),
            ) + 1,
          ]),
        );

        const { error: linkError } = await supabase
          .from("quiz_questions")
          .insert(
            data.quiz_ids.map((quizId) => ({
              quiz_id: quizId,
              question_id: question.id,
              order: orderByQuiz.get(quizId) || 1,
            })),
          );

        if (linkError) {
          console.error("Error linking question to quizzes:", linkError);
          // Don't roll back - the question is still valid even if quiz linking fails
        }
      }

      if (data.addAnother) {
        return {
          success: true,
          values: {
            category_id: data.category_id,
            quiz_ids: data.quiz_ids,
            is_active: data.is_active,
          },
        };
      }

      throw redirect(303, "/admin/content/questions");
    } catch (err) {
      if (err instanceof Error && "status" in err) {
        throw err;
      }

      console.error("Error in question creation:", err);
      return fail(500, {
        error: "An unexpected error occurred. Please try again.",
        values: data,
      });
    }
  },
};
