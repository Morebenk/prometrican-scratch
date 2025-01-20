import { fail } from "@sveltejs/kit"
import { sendAdminEmail } from "$lib/mailer.js"

/** @type {import('./$types').Actions} */
export const actions = {
  submitContactUs: async ({ request, locals: { supabaseServiceRole } }) => {
    const formData = await request.formData()
    const errors: { [fieldName: string]: string } = {}

    const fullName = formData.get("full_name")?.toString() ?? ""
    if (fullName.length < 2) {
      errors["full_name"] = "Name is required"
    }
    if (fullName.length > 500) {
      errors["full_name"] = "Name too long"
    }

    const email = formData.get("email")?.toString() ?? ""
    if (email.length < 6) {
      errors["email"] = "Email is required"
    } else if (email.length > 500) {
      errors["email"] = "Email too long"
    } else if (!email.includes("@") || !email.includes(".")) {
      errors["email"] = "Invalid email"
    }

    const message = formData.get("message")?.toString() ?? ""
    if (message.length > 2000) {
      errors["message"] = "Message too long (" + message.length + " of 2000)"
    }

    if (Object.keys(errors).length > 0) {
      return fail(400, { errors })
    }

    // Save to database
    const { error: insertError } = await supabaseServiceRole
      .from("contact_requests")
      .insert({
        full_name: fullName,
        email,
        message_body: message,
        updated_at: new Date(),
      })

    if (insertError) {
      console.error("Error saving contact request", insertError)
      return fail(500, { errors: { _: "Error saving" } })
    }

    // Send email to admin
    await sendAdminEmail({
      subject: "New contact request",
      body: `New contact request from ${fullName}.\n\nEmail: ${email}\n\nMessage: ${message}`,
    })
  },
}
