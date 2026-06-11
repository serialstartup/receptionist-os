import OpenAI from "openai"
import { tools } from "./tools"
import { createAdminClient } from "@/lib/supabase/server"
import { getAvailableSlots } from "@/lib/scheduling/engine"
import { addMinutes, parseISO, format } from "date-fns"

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

/**
 * Process a message within a specific conversation context.
 * Uses a multi-turn agentic loop so tool chains like
 * getServices → getAvailableSlots → createAppointment complete in one agent run.
 */
export async function processConversationMessage(conversationId: string) {
  const supabase = createAdminClient()

  // 1. Fetch conversation context
  const { data: conversation } = await supabase
    .from("conversations")
    .select(`
      id,
      business_id,
      customer_id,
      platform,
      platform_conversation_id,
      current_state,
      ai_enabled,
      customers(name, phone, instagram_id),
      businesses(name, location, timezone, working_hours_start, working_hours_end, ai_instructions, ai_tone, ai_language, ai_emoji_enabled, ai_enabled)
    `)
    .eq("id", conversationId)
    .single()

  if (!conversation) return null

  const business = conversation.businesses as any
  const customer = conversation.customers as any

  // Respect per-conversation and global ai_enabled flags
  if (!conversation.ai_enabled || business?.ai_enabled === false) return null

  // 2. Fetch last 10 messages for context
  const { data: historyData } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(10)

  const history = historyData ? historyData.reverse() : []

  // 3. Build system prompt
  const toneMap: Record<string, string> = {
    friendly: "Friendly and warm",
    professional: "Professional and polite",
    luxury: "Sophisticated and exclusive",
    energetic: "Energetic and upbeat",
  }
  const tone = toneMap[business.ai_tone ?? "friendly"] ?? "Friendly and warm"
  const emojiNote = business.ai_emoji_enabled === false
    ? "NEVER use emojis. Do not include any emoji character in your responses."
    : "You may use emojis occasionally."
  const customInstructions = business.ai_instructions
    ? `\n\nBusiness Instructions:\n${business.ai_instructions}`
    : ""

  const systemPrompt = `You are the AI Receptionist for "${business.name}"${business.location ? ` (${business.location})` : ""}.
Tone: ${tone}. ${emojiNote}
Current booking state: ${conversation.current_state}
Rules:
- Today's date is: ${format(new Date(), "yyyy-MM-dd")}.
- Business hours: ${business.working_hours_start} to ${business.working_hours_end}.
- USE TOOLS for service pricing and available slots. NEVER guess availability.
- When a customer requests a specific service and time: call getServices to get the service ID, then getAvailableSlots to verify, then createAppointment to confirm — complete the full booking in one flow without asking the user to wait.
- Keep responses concise for ${conversation.platform}.${customInstructions}`

  // 4. Agentic loop — supports multi-step tool chains
  const agentMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content || "",
    })),
  ]

  let finalContent: string | null = null
  let newState = conversation.current_state
  const MAX_TURNS = 6

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: agentMessages,
      tools,
      tool_choice: "auto",
    })

    const responseMessage = response.choices[0].message
    agentMessages.push(responseMessage)

    // No tool calls → final answer, exit loop
    if (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0) {
      finalContent = responseMessage.content
      break
    }

    // Process each tool call in this turn
    for (const toolCall of responseMessage.tool_calls) {
      if (!toolCall || toolCall.type !== "function" || !toolCall.function) continue

      const args = JSON.parse(toolCall.function.arguments)
      let result = ""

      if (toolCall.function.name === "getServices") {
        const { data } = await supabase
          .from("services")
          .select("id, name, price, duration_minutes")
          .eq("business_id", conversation.business_id)
          .eq("is_active", true)
        result = JSON.stringify(data)
        newState = "COLLECT_SERVICE"
      } else if (toolCall.function.name === "getAvailableSlots") {
        if (!args.service_id || !args.date) {
          result = JSON.stringify({ error: "Missing required parameters: service_id and date." })
        } else {
          try {
            const slots = await getAvailableSlots(conversation.business_id, args.service_id, args.date)
            result = JSON.stringify(slots)
            newState = "COLLECT_TIME"
          } catch (err) {
            console.error("getAvailableSlots error:", err)
            result = JSON.stringify({ error: "Could not fetch available slots. Please try again." })
          }
        }
      } else if (toolCall.function.name === "createAppointment") {
        try {
          const { data: service } = await supabase
            .from("services")
            .select("duration_minutes")
            .eq("id", args.service_id)
            .single()

          if (!service) {
            result = JSON.stringify({ success: false, message: "Service not found." })
          } else {
            const startDt = parseISO(`${args.date}T${args.time}:00`)
            const endDt = addMinutes(startDt, service.duration_minutes)
            const startTime = startDt.toISOString()
            const endTime = endDt.toISOString()

            // Calendar-level conflict check (no staff required)
            const { data: conflicts } = await supabase
              .from("appointments")
              .select("id")
              .eq("business_id", conversation.business_id)
              .neq("status", "cancelled")
              .lt("start_time", endTime)
              .gt("end_time", startTime)

            if (conflicts && conflicts.length > 0) {
              result = JSON.stringify({ success: false, message: "That time slot is no longer available. Please choose another slot." })
            } else {
              const { error: insertError } = await supabase
                .from("appointments")
                .insert({
                  business_id: conversation.business_id,
                  customer_id: conversation.customer_id,
                  service_id: args.service_id,
                  start_time: startTime,
                  end_time: endTime,
                  status: "confirmed",
                  source: conversation.platform,
                })

              if (insertError) {
                result = JSON.stringify({ success: false, message: "Failed to book appointment. Please try again." })
              } else {
                result = JSON.stringify({ success: true, message: `Appointment confirmed for ${args.date} at ${args.time}.` })
                newState = "DONE"
              }
            }
          }
        } catch {
          result = JSON.stringify({ success: false, message: "An error occurred while booking." })
        }
      } else if (toolCall.function.name === "cancelAppointment") {
        try {
          const { data: cust } = await supabase
            .from("customers")
            .select("id")
            .eq("business_id", conversation.business_id)
            .eq("phone", args.customer_phone)
            .maybeSingle()

          if (!cust) {
            result = JSON.stringify({ success: false, message: "No customer found with that phone number." })
          } else {
            const { data: appt } = await supabase
              .from("appointments")
              .select("id, start_time")
              .eq("business_id", conversation.business_id)
              .eq("customer_id", cust.id)
              .in("status", ["scheduled", "confirmed"])
              .gte("start_time", new Date().toISOString())
              .order("start_time", { ascending: true })
              .limit(1)
              .maybeSingle()

            if (!appt) {
              result = JSON.stringify({ success: false, message: "No upcoming appointment found to cancel." })
            } else {
              await supabase
                .from("appointments")
                .update({ status: "cancelled" })
                .eq("id", appt.id)

              result = JSON.stringify({ success: true, message: "Appointment cancelled successfully." })
              newState = "START"
            }
          }
        } catch {
          result = JSON.stringify({ success: false, message: "An error occurred while cancelling." })
        }
      }

      agentMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      })
    }
  }

  // 5. Update conversation state if changed
  if (newState !== conversation.current_state) {
    await supabase
      .from("conversations")
      .update({ current_state: newState })
      .eq("id", conversationId)
  }

  // 6. Save and send final response
  if (finalContent) {
    await supabase.from("messages").insert({
      business_id: conversation.business_id,
      customer_id: conversation.customer_id,
      conversation_id: conversationId,
      role: "assistant",
      content: finalContent,
    })

    if (conversation.platform === "whatsapp") {
      const { whatsapp } = await import("@/lib/whatsapp/client")
      const { data: waIntegration } = await supabase
        .from("business_integrations")
        .select("wa_access_token, wa_phone_number_id")
        .eq("business_id", conversation.business_id)
        .eq("is_active", true)
        .maybeSingle()

      const waCredentials =
        waIntegration?.wa_access_token && waIntegration?.wa_phone_number_id
          ? {
              accessToken: waIntegration.wa_access_token,
              phoneNumberId: waIntegration.wa_phone_number_id,
            }
          : undefined

      await whatsapp.sendMessage(customer.phone, finalContent, waCredentials)
    } else if (conversation.platform === "instagram") {
      const { data: integration } = await supabase
        .from("business_integrations")
        .select("ig_access_token")
        .eq("business_id", conversation.business_id)
        .eq("is_active", true)
        .maybeSingle()

      if (integration?.ig_access_token) {
        const recipientId = (conversation as any).platform_conversation_id ?? customer.instagram_id
        if (recipientId) {
          const { instagram } = await import("@/lib/instagram/client")
          await instagram.sendMessage(recipientId, finalContent, integration.ig_access_token)
        }
      }
    }
  }

  return finalContent
}
