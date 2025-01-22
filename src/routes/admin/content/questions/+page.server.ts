import { error } from "@sveltejs/kit";
import type { Question } from "../../types.js";

export async function load({ locals, url }: { locals: App.Locals; url: URL }) {
  const { supabase, user } = locals;

  if (!user) {
    throw error(401, "Unauthorized");
  }

  // Get filter parameters
  const subject_id = url.searchParams.get("subject");
  const category_id = url.searchParams.get("category");
  const quiz_id = url.searchParams.get("quiz");
  const search = url.searchParams.get("search");
  const show_inactive = url.searchParams.get("show_inactive") === "true";

  try {
    // Get all subjects and categories for filters
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

    // Build questions query
    let query = supabase.from("questions").select(`
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
        ),
        quiz_questions!quiz_questions_question_id_fkey (
          quiz:quizzes (
            id,
            title
          )
        )
      `);

    // Apply filters
    if (subject_id) {
      query = query.eq("categories.subject_id", subject_id);
    }
    if (category_id) {
      query = query.eq("category_id", category_id);
    }
    if (!show_inactive) {
      query = query.eq("is_active", true);
    }
    if (quiz_id) {
      query = query.eq("quiz_questions.quiz_id", quiz_id);
    }
    if (search) {
      query = query.ilike("content", `%${search}%`);
    }

    // Get questions
    const { data: questions, error: fetchError } = await query.order(
      "created_at",
      { ascending: false },
    );

    if (fetchError) {
      console.error("Error fetching questions:", fetchError);
      throw error(500, "Failed to load questions");
    }

    // Get all quizzes for filters
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
      questions,
      subjects,
      quizzes,
      filters: {
        subject_id,
        category_id,
        quiz_id,
        search,
        show_inactive,
      },
    };
  } catch (err) {
    console.error("Error in questions load function:", err);
    throw error(500, "Failed to load questions");
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
      throw error(400, "Question ID is required");
    }

    // Check if question is used in any quizzes
    const { data: quizzes } = await supabase
      .from("quiz_questions")
      .select("quiz_id")
      .eq("question_id", id);

    if (quizzes && quizzes.length > 0) {
      throw error(400, "Cannot delete question that is used in quizzes");
    }

    const { error: deleteError } = await supabase
      .from("questions")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting question:", deleteError);
      throw error(500, "Failed to delete question");
    }

    return { success: true };
  },
};
