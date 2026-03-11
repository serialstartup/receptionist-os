import { NextResponse } from "next/server"
import { processCustomerMessage } from "@/lib/ai/agent"
import { createClient } from "@/lib/supabase/server"

// Verify token for WhatsApp Webhook setup (from Meta Developer Portal)
const VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN || "beautyai_whatsapp_verify_token_123"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WhatsApp Webhook Verified!")
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse("Forbidden", { status: 403 })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Check if this is a valid WhatsApp cloud API message
    if (body.object === "whatsapp_business_account") {
      const entry = body.entry?.[0]
      const changes = entry?.changes?.[0]
      const value = changes?.value
      const message = value?.messages?.[0]
      const contact = value?.contacts?.[0]

      if (message && message.type === "text") {
        const phoneNumberId = value.metadata.phone_number_id
        const fromNumber = message.from
        const messageText = message.text.body
        const customerName = contact?.profile?.name || "Customer"

        // 1. Identify Business via WhatsApp Phone Number ID
        // In a real multi-tenant app, we'd look up the business ID using `phoneNumberId`.
        // Let's assume we have a helper or fallback for MVP:
        const supabase = await createClient()

        // Mock business lookup (Assume the token is associated with the first business or a specific one)
        const { data: business } = await supabase
          .from("businesses")
          .select("id")
          .limit(1)
          .single()

        if (business) {
          // 2. Identify/Create Customer in DB
          let { data: customerData } = await supabase
            .from("customers")
            .select("id")
            .eq("business_id", business.id)
            .eq("phone", fromNumber)
            .single()

          if (!customerData) {
            const { data: newCustomer } = await supabase
              .from("customers")
              .insert({
                business_id: business.id,
                name: customerName,
                phone: fromNumber,
              })
              .select("id")
              .single()
            customerData = newCustomer
          }

          // 3. Save incoming message
          await supabase.from("messages").insert({
            business_id: business.id,
            customer_id: customerData?.id,
            role: "user",
            content: messageText,
            channel: "whatsapp",
          })

          // 4. Process with AI Agent
          const aiResponse = await processCustomerMessage({
            businessId: business.id,
            customerId: customerData?.id,
            customerName: customerName,
            customerPhone: fromNumber,
            messageContent: messageText,
            channel: "whatsapp",
          })

          if (aiResponse) {
            // 5. Save AI response
            await supabase.from("messages").insert({
              business_id: business.id,
              customer_id: customerData?.id,
              role: "assistant",
              content: aiResponse,
              channel: "whatsapp",
            })

            // 6. Send message back to WhatsApp (Mocked request for now)
            // In a real app, use fetch to POST to graph.facebook.com/.../messages
            console.log("Mock sending WhatsApp to", fromNumber, ":", aiResponse)
            /*
            await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                to: fromNumber,
                type: "text",
                text: { body: aiResponse }
              })
            });
            */
          }
        }
      }
    }

    return new NextResponse("OK", { status: 200 })
  } catch (error) {
    console.error("WhatsApp Webhook Error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
