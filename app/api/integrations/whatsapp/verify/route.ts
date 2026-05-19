import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

/**
 * POST /api/integrations/whatsapp/verify
 * Verifies the 6-digit code and activates the WhatsApp integration.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: user } = await supabase
      .from("users")
      .select("business_id")
      .eq("id", userData.user.id)
      .single()

    if (!user?.business_id) {
      return NextResponse.json({ error: "No business found" }, { status: 404 })
    }

    const { code } = await request.json()

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: "Invalid code format" }, { status: 400 })
    }

    // Fetch the pending integration
    const adminSupabase = createAdminClient()
    const { data: integration } = await adminSupabase
      .from("business_integrations")
      .select("*")
      .eq("business_id", user.business_id)
      .eq("platform", "whatsapp")
      .single()

    if (!integration) {
      return NextResponse.json({ error: "No pending verification found" }, { status: 404 })
    }

    // Check expiry
    if (
      integration.verification_expires_at &&
      new Date(integration.verification_expires_at) < new Date()
    ) {
      return NextResponse.json({ error: "Verification code expired. Please request a new one." }, { status: 410 })
    }

    // Check code match
    if (integration.verification_code !== code) {
      return NextResponse.json({ error: "Incorrect verification code" }, { status: 400 })
    }

    // Activate integration
    const { error: updateError } = await adminSupabase
      .from("business_integrations")
      .update({
        is_active: true,
        verified_at: new Date().toISOString(),
        verification_code: null, // Clear the code
        verification_expires_at: null,
        // For MVP, use the global env token. In production, each business would have their own.
        wa_phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || null,
        wa_access_token: process.env.WHATSAPP_ACCESS_TOKEN || null,
      })
      .eq("id", integration.id)

    if (updateError) {
      console.error("Activation error:", updateError)
      return NextResponse.json({ error: "Failed to activate integration" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "WhatsApp integration activated",
      phone_number: integration.wa_phone_number,
    })
  } catch (error) {
    console.error("WhatsApp Verify Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
