import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { whatsapp } from "@/lib/whatsapp/client"

/**
 * POST /api/integrations/whatsapp/connect
 * Sends a 6-digit verification code to the provided phone number.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's business
    const { data: user } = await supabase
      .from("users")
      .select("business_id")
      .eq("id", userData.user.id)
      .single()

    if (!user?.business_id) {
      return NextResponse.json({ error: "No business found" }, { status: 404 })
    }

    const { phone_number } = await request.json()

    if (!phone_number || phone_number.length < 10) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 })
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Upsert into business_integrations (admin client to bypass RLS for upsert)
    const adminSupabase = createAdminClient()
    const { error: upsertError } = await adminSupabase
      .from("business_integrations")
      .upsert(
        {
          business_id: user.business_id,
          platform: "whatsapp",
          wa_phone_number: phone_number,
          verification_code: code,
          verification_expires_at: expiresAt.toISOString(),
          is_active: false,
          verified_at: null,
        },
        { onConflict: "business_id,platform" }
      )

    if (upsertError) {
      console.error("Upsert error:", upsertError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Send verification code via WhatsApp
    const message = `🔐 BeautyAI Doğrulama Kodu: *${code}*\n\nBu kodu Bağlantılar sayfasına girerek WhatsApp entegrasyonunuzu tamamlayın. Kod 10 dakika geçerlidir.`
    const result = await whatsapp.sendMessage(phone_number, message)

    if (!result) {
      return NextResponse.json(
        { error: "Failed to send verification code. Check WhatsApp credentials." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: "Verification code sent" })
  } catch (error) {
    console.error("WhatsApp Connect Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
