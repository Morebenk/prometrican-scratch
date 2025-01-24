import { error, fail, redirect } from "@sveltejs/kit";
import type { Database } from "../../../../../../DatabaseDefinitions";

type QuizUpdate = Database["public"]["Tables"]["quizzes"]["Update"];

interface QuizWithRelations {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  category_id: string;
  category: {
    id: string;
    name: string;
    subject: {
      id: string;
      name: string;
    };
  };
  quiz_attempts: {
    count: number;
  }[];
  quiz_questions?: {
    id: string;
    order: number;
    question_id: string;
    question: {
      id: string;
      content: string;
      explanation: string | null;
      image_url: string | null;
      choices: {
        id: string;
        content: string;
        is_correct: boolean;
      }[];
    };
  }[];
}

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
    // Get basic quiz data first
    const { data, error: quizError } = await supabase
      .from("quizzes")
      .select(
        `
        id,
        title,
        description,
        is_active,
        category_id,
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

    if (quizError) {
      console.error("Error fetching quiz:", quizError);
      throw error(404, "Quiz not found");
    }

    const quiz = data as QuizWithRelations;

    if (!quiz) {
      throw error(404, "Quiz not found");
    }

    // Get quiz questions with their details
    const { data: quizQuestions, error: questionsError } = await supabase
      .from("quiz_questions")
      .select(
        `
        id,
        order,
        question_id,
        question:questions(
          id,
          content,
          explanation,
          image_url,
          choices(
            id,
            content,
            is_correct
          )
        )
      `,
      )
      .eq("quiz_id", id)
      .order("order");

    if (questionsError) {
      console.error("Error fetching quiz questions:", questionsError);
      throw error(500, "Failed to load quiz questions");
    }

    // Get all available questions for the quiz's category
    const { data: availableQuestions, error: availableError } = await supabase
      .from("questions")
      .select(
        `
        id,
        content,
        explanation,
        image_url,
        category_id,
        choices (
          id,
          content,
          is_correct
        )
      `,
      )
      .eq("category_id", quiz.category_id)
      .eq("is_active", true);

    if (availableError) {
      console.error("Error fetching available questions:", availableError);
      throw error(500, "Failed to load available questions");
    }

    // Get all subjects with their categories
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

    // Add the questions to the quiz object
    quiz.quiz_questions = quizQuestions || [];

    return {
      quiz,
      subjects: subjects || [],
      availableQuestions: availableQuestions || [],
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
