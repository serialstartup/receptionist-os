import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import {
  handleGetServices,
  handleGetAvailableSlots,
  handleCreateAppointment,
  handleCancelAppointment,
} from "@/lib/ai/tool-handlers"

const SERVER_SECRET = process.env.VAPI_SERVER_SECRET || ""

interface VapiToolCall {
  id?: string
  toolCallId?: string
  name?: string
  parameters?: Record<string, unknown>
  arguments?: Record<string, unknown> | string
  function?: { name?: string; arguments?: Record<string, unknown> | string }
}

/**
 * Vapi's tool-calls request shape isn't fully pinned down yet (no live
 * account/real payload to verify against — see obsidian 2026-08-08 log;
 * docs.vapi.ai examples disagree on `parameters` vs `arguments` vs
 * `function.arguments`). This normalizes every documented variant so the
 * handler works regardless; confirm against a real payload once Vapi sends
 * one and simplify then.
 */
function normalizeToolCall(raw: VapiToolCall) {
  const id = raw.toolCallId || raw.id || ""
  const name = raw.name || raw.function?.name || ""
  const rawArgs = raw.parameters ?? raw.arguments ?? raw.function?.arguments ?? {}
  const args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs
  return { id, name, args }
}

/**
 * POST Handler: Vapi server messages (tool-calls, status-update, etc.)
 * Only `tool-calls` is handled — that's what the AI receptionist needs to
 * answer pricing/availability and book/cancel appointments during a call.
 */
export async function POST(request: Request) {
  try {
    if (SERVER_SECRET) {
      const provided = request.headers.get("x-vapi-secret")
      if (provided !== SERVER_SECRET) {
        return new NextResponse("Unauthorized", { status: 401 })
      }
    }

    const body = await request.json()
    const message = body.message

    if (message?.type !== "tool-calls") {
      return NextResponse.json({ received: true })
    }

    const toolCallList: VapiToolCall[] = message.toolCallList || message.toolCalls || []
    if (toolCallList.length === 0) {
      return NextResponse.json({ results: [] })
    }

    const callerNumber: string | undefined = message.call?.customer?.number
    const assistantId: string | undefined = message.call?.assistantId ?? message.assistant?.id
    const callId: string | undefined = message.call?.id

    if (!callerNumber || !assistantId) {
      const results = toolCallList.map((raw) => ({
        toolCallId: normalizeToolCall(raw).id,
        result: JSON.stringify({ error: "Missing caller number or assistant id on call." }),
      }))
      return NextResponse.json({ results })
    }

    const supabase = createAdminClient()

    // 1. Resolve business by Vapi assistant ID (multi-tenant routing)
    const { data: integration } = await supabase
      .from("business_integrations")
      .select("business_id")
      .eq("vapi_assistant_id", assistantId)
      .eq("platform", "voice")
      .eq("is_active", true)
      .single()

    if (!integration) {
      const results = toolCallList.map((raw) => ({
        toolCallId: normalizeToolCall(raw).id,
        result: JSON.stringify({ error: "No business is configured for this assistant." }),
      }))
      return NextResponse.json({ results })
    }

    const businessId = integration.business_id

    const { data: business } = await supabase
      .from("businesses")
      .select("timezone")
      .eq("id", businessId)
      .single()

    // 2. Find or create customer by caller phone number
    let { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("business_id", businessId)
      .eq("phone", callerNumber)
      .single()

    if (!customer) {
      const { data: newCustomer } = await supabase
        .from("customers")
        .insert({ business_id: businessId, name: "Caller", phone: callerNumber })
        .select("id")
        .single()
      customer = newCustomer
    }

    if (!customer) throw new Error("Could not find or create customer")

    // 3. Find or create the voice conversation (one per phone call)
    let { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("business_id", businessId)
      .eq("platform", "voice")
      .eq("platform_conversation_id", callId || callerNumber)
      .single()

    if (!conversation) {
      const { data: newConversation } = await supabase
        .from("conversations")
        .insert({
          business_id: businessId,
          customer_id: customer.id,
          platform: "voice",
          platform_conversation_id: callId || callerNumber,
        })
        .select("id")
        .single()
      conversation = newConversation
    }

    if (!conversation) throw new Error("Could not find or create conversation")

    // 4. Execute each requested tool call with the same deterministic logic
    // the WhatsApp/Instagram agentic loop uses.
    const results = await Promise.all(
      toolCallList.map(async (raw) => {
        const { id, name, args } = normalizeToolCall(raw)
        let result: unknown

        if (name === "getServices") {
          result = await handleGetServices(supabase, businessId)
        } else if (name === "getAvailableSlots") {
          result = await handleGetAvailableSlots(businessId, args)
        } else if (name === "createAppointment") {
          result = await handleCreateAppointment(
            supabase,
            businessId,
            customer.id,
            business?.timezone || "UTC",
            "voice",
            args
          )
        } else if (name === "cancelAppointment") {
          result = await handleCancelAppointment(supabase, businessId, customer.id)
        } else {
          result = { error: `Unknown tool: ${name}` }
        }

        return { toolCallId: id, result: JSON.stringify(result) }
      })
    )

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Vapi Webhook Error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
