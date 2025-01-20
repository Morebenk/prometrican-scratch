import { error, json } from "@sveltejs/kit"
import type { RequestHandler } from "@sveltejs/kit"

export const POST: RequestHandler = async ({ request, locals }) => {
  const { questionId, choiceId } = await request.json()

  if (!questionId || !choiceId) {
    throw error(400, "Missing question ID or choice ID")
  }

  if (!locals.user) {
    throw error(401, "Unauthorized")
  }

  try {
    const supabase = locals.supabase

    // Record incorrect response
    const { error: createError } = await supabase
      .from("incorrect_responses")
      .insert({
        user_id: locals.user.id,
        question_id: questionId,
        choice_id: choiceId,
      })

    if (createError) {
      throw error(500, "Error recording incorrect response")
    }

    return json({ success: true })
  } catch (e) {
    console.error("Error recording incorrect response:", e)
    throw error(500, "Internal server error")
  }
}

// Get incorrect responses for a specific question
export const GET: RequestHandler = async ({ url, locals }) => {
  const questionId = url.searchParams.get("questionId")

  if (!questionId) {
    throw error(400, "Missing question ID")
  }

  if (!locals.user) {
    throw error(401, "Unauthorized")
  }

  try {
    const supabase = locals.supabase

    const { data, error: fetchError } = await supabase
      .from("incorrect_responses")
      .select("choice_id")
      .eq("user_id", locals.user.id)
      .eq("question_id", questionId)

    if (fetchError) {
      throw error(500, "Error fetching incorrect responses")
    }

    return json({
      incorrectChoices: data?.map((r) => r.choice_id) || [],
    })
  } catch (e) {
    console.error("Error fetching incorrect responses:", e)
    throw error(500, "Internal server error")
  }
}
