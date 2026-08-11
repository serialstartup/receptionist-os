import type { SupabaseClient } from "@supabase/supabase-js"
import { getAvailableSlots } from "@/lib/scheduling/engine"
import { addMinutes } from "date-fns"
import { localToUTC } from "@/lib/timezone"

/**
 * Deterministic tool implementations shared by every AI channel (WhatsApp/
 * Instagram agentic loop in agent.ts, Vapi voice webhook, future channels).
 * Each handler takes the business/customer already resolved by the caller
 * and returns a plain result object — callers decide how to serialize it
 * (JSON string for OpenAI tool messages, Vapi's `result` field, etc).
 */

export async function handleGetServices(supabase: SupabaseClient, businessId: string) {
  const { data } = await supabase
    .from("services")
    .select("id, name, price, duration_minutes")
    .eq("business_id", businessId)
    .eq("is_active", true)

  return data
}

export async function handleGetAvailableSlots(
  businessId: string,
  args: { service_id?: string; date?: string }
) {
  if (!args.service_id || !args.date) {
    return { error: "Missing required parameters: service_id and date." }
  }

  try {
    return await getAvailableSlots(businessId, args.service_id, args.date)
  } catch (err) {
    console.error("getAvailableSlots error:", err)
    return { error: "Could not fetch available slots. Please try again." }
  }
}

export async function handleCreateAppointment(
  supabase: SupabaseClient,
  businessId: string,
  customerId: string,
  timezone: string,
  source: string,
  args: { service_id?: string; date?: string; time?: string }
) {
  if (!args.service_id || !args.date || !args.time) {
    return { success: false, message: "Missing required parameters: service_id, date, and time." }
  }

  try {
    const { data: service } = await supabase
      .from("services")
      .select("duration_minutes")
      .eq("id", args.service_id)
      .single()

    if (!service) {
      return { success: false, message: "Service not found." }
    }

    const startDt = localToUTC(`${args.date}T${args.time}`, timezone || "UTC")
    const endDt = addMinutes(startDt, service.duration_minutes)
    const startTime = startDt.toISOString()
    const endTime = endDt.toISOString()

    // Calendar-level conflict check (no staff required)
    const { data: conflicts } = await supabase
      .from("appointments")
      .select("id")
      .eq("business_id", businessId)
      .neq("status", "cancelled")
      .lt("start_time", endTime)
      .gt("end_time", startTime)

    if (conflicts && conflicts.length > 0) {
      return { success: false, message: "That time slot is no longer available. Please choose another slot." }
    }

    const { error: insertError } = await supabase.from("appointments").insert({
      business_id: businessId,
      customer_id: customerId,
      service_id: args.service_id,
      start_time: startTime,
      end_time: endTime,
      status: "confirmed",
      source,
    })

    if (insertError) {
      return { success: false, message: "Failed to book appointment. Please try again." }
    }

    return { success: true, message: `Appointment confirmed for ${args.date} at ${args.time}.` }
  } catch {
    return { success: false, message: "An error occurred while booking." }
  }
}

export async function handleCancelAppointment(
  supabase: SupabaseClient,
  businessId: string,
  customerId: string
) {
  try {
    const { data: appt } = await supabase
      .from("appointments")
      .select("id, start_time")
      .eq("business_id", businessId)
      .eq("customer_id", customerId)
      .in("status", ["scheduled", "confirmed"])
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true })
      .limit(1)
      .maybeSingle()

    if (!appt) {
      return { success: false, message: "No upcoming appointment found to cancel." }
    }

    await supabase.from("appointments").update({ status: "cancelled" }).eq("id", appt.id)

    return { success: true, message: "Appointment cancelled successfully." }
  } catch {
    return { success: false, message: "An error occurred while cancelling." }
  }
}
