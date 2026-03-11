import OpenAI from "openai"
import { tools } from "./tools"
import { createClient } from "@/lib/supabase/server"
import {
  getAvailableSlots,
  createAppointmentSafely,
} from "@/lib/scheduling/engine"
import { addMinutes, parseISO, format } from "date-fns"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function processCustomerMessage({
  businessId,
  customerId,
  customerName,
  customerPhone,
  messageContent,
  channel, // "whatsapp" | "instagram"
}: {
  businessId: string
  customerId?: string
  customerName?: string
  customerPhone?: string
  messageContent: string
  channel: string
}) {
  const supabase = await createClient()

  // 1. Fetch business details for system prompt context
  const { data: business } = await supabase
    .from("businesses")
    .select("name, location, timezone, working_hours_start, working_hours_end")
    .eq("id", businessId)
    .single()

  if (!business) throw new Error("Business not found")

  // 2. Fetch conversation history for this customer (last 10 messages)
  let historyQuery = supabase
    .from("messages")
    .select("role, content")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(10)

  if (customerId) {
    historyQuery = historyQuery.eq("customer_id", customerId)
  }

  const { data: historyData } = await historyQuery
  const history = historyData ? historyData.reverse() : []

  // Map history to OpenAI format
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = history.map(
    (m) => ({
      role: m.role as "user" | "assistant",
      content: m.content || "",
    })
  )

  // 3. Construct System Prompt
  const systemPrompt = `You are the AI Receptionist for "${business.name}", a beauty salon located in ${business.location}.
Your goal is to assist customers, answer questions about services, and book appointments.
Be friendly, professional, and concise.
Today's date is: ${format(new Date(), "yyyy-MM-dd")}.
Working hours are from ${business.working_hours_start} to ${business.working_hours_end}.

IMPORTANT INSTRUCTIONS:
- ONLY use the function calls provided to check availability, get services, or book appointments.
- DO NOT make up prices or availability. Always call \`getServices\` if asked about prices, and \`getAvailableSlots\` if asked about times.
- If a user wants to book, first check availability. Then confirm the time. Only then call \`createAppointment\`.
- Keep messages short and conversational, suitable for WhatsApp/Instagram.`

  // 4. Run OpenAI completion
  const response = await openai.chat.completions.create({
    model: "gpt-4o", // or gpt-4-turbo
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
      { role: "user", content: messageContent },
    ],
    tools: tools,
    tool_choice: "auto",
  })

  const responseMessage = response.choices[0].message

  // 5. Handle Tool Calls
  if (responseMessage.tool_calls) {
    const toolCallResults = []

    for (const toolCall of responseMessage.tool_calls) {
      if (toolCall.type !== "function") continue

      const args = JSON.parse(toolCall.function.arguments)
      let resultStr = ""

      try {
        if (toolCall.function.name === "getServices") {
          const { data: services } = await supabase
            .from("services")
            .select("id, name, duration_minutes, price")
            .eq("business_id", businessId)
            .eq("is_active", true)
          resultStr = JSON.stringify(services)
        } else if (toolCall.function.name === "getAvailableSlots") {
          const slots = await getAvailableSlots(
            businessId,
            args.service_id,
            args.date
          )
          resultStr = JSON.stringify(slots)
        } else if (toolCall.function.name === "createAppointment") {
          // Find service to get duration
          const { data: service } = await supabase
            .from("services")
            .select("duration_minutes")
            .eq("id", args.service_id)
            .single()

          // Get the slots to find the staff ID for that time
          const slots = await getAvailableSlots(
            businessId,
            args.service_id,
            args.date
          )
          const assignedSlot = slots.find((s) => s.time === args.time)

          if (!assignedSlot) {
            resultStr = JSON.stringify({
              error: "Time slot is no longer available.",
            })
          } else {
            // Find or create customer if needed, but for simplicity we rely on existing IDs if passed.
            // A more complete CRM integration would ensure customerId exists here.
            let actualCustomerId = customerId
            if (!actualCustomerId) {
              // Create customer record (simplified)
              const { data: newCust } = await supabase
                .from("customers")
                .insert({
                  business_id: businessId,
                  name: args.customer_name,
                  phone: args.customer_phone,
                })
                .select()
                .single()
              actualCustomerId = newCust?.id
            }

            const startDate = parseISO(`${args.date}T${args.time}:00`)
            const endDate = addMinutes(startDate, service!.duration_minutes)

            await createAppointmentSafely({
              businessId,
              customerId: actualCustomerId!,
              serviceId: args.service_id,
              staffId: assignedSlot.staff_id,
              startTime: startDate.toISOString(),
              endTime: endDate.toISOString(),
              source: channel,
            })
            resultStr = JSON.stringify({
              success: true,
              message: "Appointment booked successfully",
            })
          }
        } else if (toolCall.function.name === "cancelAppointment") {
          // simplified cancellation logic
          resultStr = JSON.stringify({
            success: false,
            message: "Cancellation tool needs implementation.",
          })
        }
      } catch (err: any) {
        resultStr = JSON.stringify({ error: err.message })
      }

      toolCallResults.push({
        tool_call_id: toolCall.id,
        role: "tool",
        name: toolCall.function.name,
        content: resultStr,
      })
    }

    // Call OpenAI again with the tool results
    const secondResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
        { role: "user", content: messageContent },
        responseMessage,
        ...(toolCallResults as any),
      ],
    })

    return secondResponse.choices[0].message.content
  }

  // 6. Return final text response
  return responseMessage.content
}
