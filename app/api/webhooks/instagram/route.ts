import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { processConversationMessage } from "@/lib/ai/agent"

// Verify token for Instagram Webhook setup
const VERIFY_TOKEN =
  process.env.INSTAGRAM_VERIFY_TOKEN || "beautyai_ig_verify_token_123"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Instagram Webhook Verified!")
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse("Forbidden", { status: 403 })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (body.object === "instagram") {
      const supabase = createAdminClient()

      for (const entry of body.entry) {
        for (const messaging of entry.messaging) {
          if (messaging.message && !messaging.message.is_echo) {
            const senderId = messaging.sender.id
            const recipientId = messaging.recipient.id
            const messageText = messaging.message.text

            // Multi-tenant: Look up business by Instagram User ID
            const { data: integration } = await supabase
              .from("business_integrations")
              .select("business_id, ig_access_token")
              .eq("ig_user_id", recipientId)
              .eq("is_active", true)
              .single()

            if (!integration || !messageText) continue

            const businessId = integration.business_id
            const customerName = `IG User_${senderId.slice(-4)}`

            // Identify/Create Customer
            let { data: customerData } = await supabase
              .from("customers")
              .select("id")
              .eq("business_id", businessId)
              .eq("instagram_id", senderId)
              .single()

            if (!customerData) {
              const { data: newCustomer } = await supabase
                .from("customers")
                .insert({
                  business_id: businessId,
                  name: customerName,
                  instagram_id: senderId,
                })
                .select("id")
                .single()
              customerData = newCustomer
            }

            // Find or create conversation
            let { data: conversation } = await supabase
              .from("conversations")
              .select("id, ai_enabled")
              .eq("business_id", businessId)
              .eq("customer_id", customerData?.id)
              .eq("platform", "instagram")
              .single()

            if (!conversation) {
              const { data: newConv } = await supabase
                .from("conversations")
                .insert({
                  business_id: businessId,
                  customer_id: customerData?.id,
                  platform: "instagram",
                  platform_conversation_id: senderId,
                })
                .select("id, ai_enabled")
                .single()
              conversation = newConv
            }

            if (!conversation) continue

            // Save incoming message
            await supabase.from("messages").insert({
              business_id: businessId,
              customer_id: customerData?.id,
              conversation_id: conversation.id,
              role: "user",
              content: messageText,
            })

            // Process with AI Agent (if enabled)
            if (conversation.ai_enabled) {
              const aiResponse = await processConversationMessage(conversation.id)

              if (aiResponse) {
                // Send back to Instagram via Send API
                const igToken = integration.ig_access_token
                if (igToken) {
                  await fetch(
                    `https://graph.facebook.com/v21.0/me/messages?access_token=${igToken}`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        recipient: { id: senderId },
                        message: { text: aiResponse },
                      }),
                    }
                  )
                } else {
                  console.log("No IG token, cannot send reply to", senderId)
                }
              }
            }
          }
        }
      }
    }

    return new NextResponse("EVENT_RECEIVED", { status: 200 })
  } catch (error) {
    console.error("IG Webhook Error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
