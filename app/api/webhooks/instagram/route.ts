import { NextResponse } from "next/server"
import { processCustomerMessage } from "@/lib/ai/agent"
import { createClient } from "@/lib/supabase/server"

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

    // Check if valid Instagram message
    if (body.object === "instagram") {
      for (const entry of body.entry) {
        // Find business logic would usually be entry.id mappings

        for (const messaging of entry.messaging) {
          if (messaging.message && !messaging.message.is_echo) {
            const senderId = messaging.sender.id
            const recipientId = messaging.recipient.id
            const messageText = messaging.message.text

            const supabase = await createClient()

            // Assume mapping recipientId to businessId
            const { data: business } = await supabase
              .from("businesses")
              .select("id")
              .limit(1)
              .single()

            if (business && messageText) {
              const customerName = `IG User_${senderId.slice(-4)}`

              // Identify/Create Customer
              let { data: customerData } = await supabase
                .from("customers")
                .select("id")
                .eq("business_id", business.id)
                .eq("instagram_id", senderId)
                .single()

              if (!customerData) {
                const { data: newCustomer } = await supabase
                  .from("customers")
                  .insert({
                    business_id: business.id,
                    name: customerName,
                    instagram_id: senderId,
                  })
                  .select("id")
                  .single()
                customerData = newCustomer
              }

              // Save incoming
              await supabase.from("messages").insert({
                business_id: business.id,
                customer_id: customerData?.id,
                role: "user",
                content: messageText,
                channel: "instagram",
              })

              // Process with AI Agent
              const aiResponse = await processCustomerMessage({
                businessId: business.id,
                customerId: customerData?.id,
                customerName: customerName,
                messageContent: messageText,
                channel: "instagram",
              })

              if (aiResponse) {
                // Save AI response
                await supabase.from("messages").insert({
                  business_id: business.id,
                  customer_id: customerData?.id,
                  role: "assistant",
                  content: aiResponse,
                  channel: "instagram",
                })

                // Send back to Instagram
                console.log(
                  "Mock sending IG message to",
                  senderId,
                  ":",
                  aiResponse
                )
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
