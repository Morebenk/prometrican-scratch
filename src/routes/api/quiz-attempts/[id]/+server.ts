import { error, json } from "@sveltejs/kit"
import type { RequestEvent } from "@sveltejs/kit"

export async function PATCH({
  params,
  request,
  locals,
}: RequestEvent<{ id: string }>) {
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
      throw error(404, "Quiz attempt not found")
    }

    if (existingAttempt.user_id !== locals.user.id) {
      throw error(403, "Unauthorized")
    }

    // Update the attempt
    const { error: updateError } = await supabase
      .from("quiz_attempts")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (updateError) {
      throw error(500, "Error updating quiz attempt")
    }

    return json({ success: true })
  } catch (e) {
    console.error("Error updating quiz attempt:", e)
    throw error(500, "Internal server error")
  }
}
