import { error, json } from "@sveltejs/kit"
import type { RequestHandler } from "@sveltejs/kit"

export const POST: RequestHandler = async ({ request, locals }) => {
  const { questionId } = await request.json()

  if (!questionId) {
    throw error(400, "Missing question ID")
  }

  if (!locals.user) {
    throw error(401, "Unauthorized")
  }

  try {
    const supabase = locals.supabase

    // Insert new bookmark
    const { error: createError } = await supabase.from("bookmarks").insert({
      user_id: locals.user.id,
      question_id: questionId,
    })

    if (createError) {
      throw error(500, "Error creating bookmark")
    }

    return json({ success: true })
  } catch (e) {
    console.error("Error creating bookmark:", e)
    throw error(500, "Internal server error")
  }
}

export const DELETE: RequestHandler = async ({ url, locals }) => {
  const questionId = url.searchParams.get("questionId")

  if (!questionId) {
    throw error(400, "Missing question ID")
  }

  if (!locals.user) {
    throw error(401, "Unauthorized")
  }

  try {
    const supabase = locals.supabase

    // Delete bookmark
    const { error: deleteError } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", locals.user.id)
      .eq("question_id", questionId)

    if (deleteError) {
      throw error(500, "Error removing bookmark")
    }

    return json({ success: true })
  } catch (e) {
    console.error("Error removing bookmark:", e)
    throw error(500, "Internal server error")
  }
}
