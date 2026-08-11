import OpenAI from "openai"
import { tools } from "./tools"
import { createAdminClient } from "@/lib/supabase/server"
import { format } from "date-fns"
import {
  handleGetServices,
  handleGetAvailableSlots,
  handleCreateAppointment,
  handleCancelAppointment,
} from "./tool-handlers"

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

function stripEmojis(text: string): string {
  return text.replace(/\p{Extended_Pictographic}/gu, "").replace(/\s{2,}/g, " ").trim()
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
      businesses(name, location, phone, website, timezone, working_hours_start, working_hours_end, working_days, ai_instructions, ai_tone, ai_language, ai_emoji_enabled, ai_enabled)
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
  const noEmoji = business.ai_emoji_enabled === false
  const customInstructions = business.ai_instructions
    ? `\nBusiness Instructions:\n${business.ai_instructions}`
    : ""

  const systemPromptParts = [
    noEmoji
      ? "FORMATTING RULE (highest priority): You MUST NOT use any emoji or emoji-like symbol in any message. Zero exceptions. If you are about to write an emoji, replace it with nothing."
      : null,
    `You are the AI Receptionist for "${business.name}"${business.location ? ` (${business.location})` : ""}.`,
    `Tone: ${tone}. ${noEmoji ? "Plain text only — no emojis." : "You may use emojis occasionally."}`,
    `Current booking state: ${conversation.current_state}`,
    "Rules:",
    `- Today's date is: ${format(new Date(), "yyyy-MM-dd")}.`,
    `- Business hours: ${business.working_hours_start} to ${business.working_hours_end}.`,
    business.working_days && business.working_days.length > 0
      ? `- Open days: ${(business.working_days as number[]).sort((a, b) => a - b).map((d) => ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d]).join(", ")}.`
      : null,
    business.phone ? `- Business phone: ${business.phone}.` : null,
    business.website ? `- Website: ${business.website}.` : null,
    "- USE TOOLS for service pricing and available slots. NEVER guess availability.",
    "- When a customer requests a specific service and time: call getServices to get the service ID, then getAvailableSlots to verify, then createAppointment to confirm — complete the full booking in one flow without asking the user to wait.",
    `- Keep responses concise for ${conversation.platform}.`,
    customInstructions || null,
  ]

  const systemPrompt = systemPromptParts.filter(Boolean).join("\n")

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
        result = JSON.stringify(await handleGetServices(supabase, conversation.business_id))
        newState = "COLLECT_SERVICE"
      } else if (toolCall.function.name === "getAvailableSlots") {
        const slots = await handleGetAvailableSlots(conversation.business_id, args)
        result = JSON.stringify(slots)
        if (!("error" in slots)) newState = "COLLECT_TIME"
      } else if (toolCall.function.name === "createAppointment") {
        const booking = await handleCreateAppointment(
          supabase,
          conversation.business_id,
          conversation.customer_id,
          business.timezone,
          conversation.platform,
          args
        )
        result = JSON.stringify(booking)
        if (booking.success) newState = "DONE"
      } else if (toolCall.function.name === "cancelAppointment") {
        const cancellation = await handleCancelAppointment(
          supabase,
          conversation.business_id,
          conversation.customer_id
        )
        result = JSON.stringify(cancellation)
        if (cancellation.success) newState = "START"
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
    if (noEmoji) finalContent = stripEmojis(finalContent)

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
