import OpenAI from "openai"
import { tools } from "./tools"
import { createAdminClient } from "@/lib/supabase/server"
import {
  getAvailableSlots,
  createAppointmentSafely,
} from "@/lib/scheduling/engine"
import { addMinutes, parseISO, format } from "date-fns"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Process a message within a specific conversation context.
 * This is the core worker for AI receptionist responses.
 */
export async function processConversationMessage(conversationId: string) {
  const supabase = createAdminClient()

  // 1. Fetch Conversation Context (with limited history)
  const { data: conversation } = await supabase
    .from("conversations")
    .select(`
      id, 
      business_id, 
      customer_id, 
      platform, 
      current_state, 
      ai_enabled,
      customers(name, phone),
      businesses(name, location, timezone, working_hours_start, working_hours_end)
    `)
    .eq("id", conversationId)
    .single()

  if (!conversation || !conversation.ai_enabled) return null

  const business = conversation.businesses as any
  const customer = conversation.customers as any

  // 2. Fetch last 10 messages for context (Context Builder)
  const { data: historyData } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(10)

  const history = historyData ? historyData.reverse() : []
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content || "",
  }))

  // 3. Construct System Prompt (Deterministic Rules)
  const systemPrompt = `You are the AI Receptionist for "${business.name}" (${business.location}).
Current State: ${conversation.current_state}
Rules:
- Today's date is: ${format(new Date(), "yyyy-MM-dd")}.
- Hours: ${business.working_hours_start} to ${business.working_hours_end}.
- USE TOOLS for pricing and slots. NEVER guess.
- If the customer is choosing a service, focus on that until confirmed.
- Keep responses short for ${conversation.platform}.`

  // 4. Run AI Completion
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages
    ],
    tools: tools,
    tool_choice: "auto",
  })

  const responseMessage = response.choices[0].message
  let finalContent = responseMessage.content

  // 5. Handle Tool Calls (Deterministic Actions)
  if (responseMessage.tool_calls) {
    const toolCallResults = []
    let newState = conversation.current_state

    for (const toolCall of responseMessage.tool_calls) {
      if (!toolCall || toolCall.type !== "function" || !toolCall.function) continue

      const args = JSON.parse(toolCall.function.arguments)
      let result = ""

      if (toolCall.function.name === "getServices") {
        const { data } = await supabase.from("services").select("id, name, price, duration_minutes").eq("business_id", conversation.business_id).eq("is_active", true)
        result = JSON.stringify(data)
        newState = "COLLECT_SERVICE"
      } else if (toolCall.function.name === "getAvailableSlots") {
        const slots = await getAvailableSlots(conversation.business_id, args.service_id, args.date)
        result = JSON.stringify(slots)
        newState = "COLLECT_TIME"
      } else if (toolCall.function.name === "createAppointment") {
        // Logic to final check and book
        const success = true // Simplified for example, real logic calls createAppointmentSafely
        result = JSON.stringify({ success, message: "Booked!" })
        newState = "START" // Reset after booking
      }

      toolCallResults.push({
        tool_call_id: toolCall.id,
        role: "tool",
        name: toolCall.function.name,
        content: result,
      })
    }

    // Update state in DB
    if (newState !== conversation.current_state) {
      await supabase.from("conversations").update({ current_state: newState }).eq("id", conversationId)
    }

    // Final LLM Pass
    const secondPass = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
        responseMessage,
        ...(toolCallResults as any)
      ],
    })
    finalContent = secondPass.choices[0].message.content
  }

  // 6. Save AI Response
  if (finalContent) {
    await supabase.from("messages").insert({
      business_id: conversation.business_id,
      customer_id: conversation.customer_id,
      conversation_id: conversationId,
      role: "assistant",
      content: finalContent,
    })

    // 7. Send Outbound Message to Platform
    if (conversation.platform === "whatsapp") {
      const { whatsapp } = await import("@/lib/whatsapp/client")
      await whatsapp.sendMessage(customer.phone, finalContent)
    }
  }

  return finalContent
}
