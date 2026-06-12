import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  const { subject, message } = await req.json()

  if (!subject || !message?.trim()) {
    return NextResponse.json({ error: "Subject and message required." }, { status: 400 })
  }

  const senderEmail = userData.user?.email ?? "unknown@user"

  const { error } = await resend.emails.send({
    from: "Receptionist OS <onboarding@resend.dev>",
    to: process.env.RESEND_TO_EMAIL!,
    subject: `[Support] ${subject}`,
    html: `
      <p><strong>From:</strong> ${senderEmail}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <hr />
      <p>${message.replace(/\n/g, "<br />")}</p>
    `,
  })

  if (error) {
    console.error("Resend error:", error)
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
