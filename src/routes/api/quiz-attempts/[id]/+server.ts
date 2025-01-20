import { error, json } from "@sveltejs/kit"
import type { RequestHandler } from "@sveltejs/kit"
import type { DbQuizAttempt } from "../../../(admin)/account/(menu)/practice/types"

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  const { id } = params

  if (!id) {
    throw error(400, "Missing attempt ID")
  }

  if (!locals.user) {
    throw error(401, "Unauthorized")
  }

  try {
    const updateData = await request.json()
    const supabase = locals.supabase

    // Verify the attempt belongs to the current user
    const { data: existingAttempt, error: fetchError } = await supabase
      .from("quiz_attempts")
      .select("user_id")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Error fetching attempt:", fetchError)
      throw error(404, "Quiz attempt not found")
    }

    if (existingAttempt.user_id !== locals.user.id) {
      throw error(403, "Unauthorized")
    }

    // Format dates properly for the database
    const formattedData = {
      ...updateData,
      ...(updateData.completed_at && {
        completed_at: updateData.completed_at,
      }),
      ...(updateData.started_at && {
        started_at: updateData.started_at,
      }),
    }

    // Update the attempt - note we don't try to update the ID
    delete formattedData.id

    // Update the attempt
    const { error: updateError } = await supabase
      .from("quiz_attempts")
      .update(formattedData)
      .eq("id", id)

    if (updateError) {
      console.error("Error updating attempt:", updateError)
      throw error(500, "Error updating quiz attempt")
    }

    return json({ success: true })
  } catch (e) {
    console.error("Error updating quiz attempt:", e)
    throw error(500, "Internal server error")
  }
}
