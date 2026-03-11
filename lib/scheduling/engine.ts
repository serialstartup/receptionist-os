import { createClient } from "@/lib/supabase/server"
import {
  addMinutes,
  isBefore,
  isAfter,
  setHours,
  setMinutes,
  format,
  parseISO,
  startOfDay,
  addDays,
} from "date-fns"

/**
 * Parses a time string like "09:00" into a Date object for a specific day.
 */
function parseTimeStr(date: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number)
  return setMinutes(setHours(startOfDay(date), hours), minutes)
}

/**
 * Checks if a requested time slot conflicts with existing appointments.
 */
export function checkConflict(
  startSlot: Date,
  endSlot: Date,
  appointments: Array<{ start_time: string; end_time: string }>
): boolean {
  for (const appt of appointments) {
    const apptStart = new Date(appt.start_time)
    const apptEnd = new Date(appt.end_time)

    // Overlap condition: start < appt.end AND end > appt.start
    if (isBefore(startSlot, apptEnd) && isAfter(endSlot, apptStart)) {
      return true // Conflict found
    }
  }
  return false
}

/**
 * Gets available slots for a given service and date.
 * Fetches business hours, staff availability, and existing appointments to compute free intervals.
 */
export async function getAvailableSlots(
  businessId: string,
  serviceId: string,
  dateStr: string
) {
  const supabase = await createClient()
  const date = parseISO(dateStr)
  const dayOfWeek = date.getDay() // 0 = Sunday, ..., 6 = Saturday

  // 1. Fetch Business Details
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("working_hours_start, working_hours_end, working_days")
    .eq("id", businessId)
    .single()

  if (bizError || !business) {
    throw new Error("Business not found")
  }

  // Check if business is open on this day
  if (!business.working_days.includes(dayOfWeek)) {
    return [] // Closed today
  }

  // 2. Fetch Service Details
  const { data: service, error: srvError } = await supabase
    .from("services")
    .select("duration_minutes")
    .eq("id", serviceId)
    .single()

  if (srvError || !service) {
    throw new Error("Service not found")
  }

  // 3. Fetch all staff available for this service (assuming all active staff for now)
  const { data: staff, error: staffError } = await supabase
    .from("staff")
    .select("id")
    .eq("business_id", businessId)
    .eq("is_active", true)

  if (staffError || !staff || staff.length === 0) {
    throw new Error("No staff available")
  }

  // 4. Fetch existing appointments for the given date and business
  const startOfDayUtc = startOfDay(date).toISOString()
  const endOfDayUtc = startOfDay(addDays(date, 1)).toISOString()

  const { data: appointments, error: apptError } = await supabase
    .from("appointments")
    .select("staff_id, start_time, end_time")
    .eq("business_id", businessId)
    .gte("start_time", startOfDayUtc)
    .lt("start_time", endOfDayUtc)
    .neq("status", "cancelled")

  if (apptError) {
    throw new Error("Error fetching appointments")
  }

  // 5. Calculate available slots
  const availableSlots: Array<{ time: string; staff_id: string }> = []
  const duration = service.duration_minutes

  const startTime = parseTimeStr(date, business.working_hours_start)
  const endTime = parseTimeStr(date, business.working_hours_end)

  // Interval step in minutes (e.g., check every 15 minutes)
  const stepMinutes = 15

  let currentSlot = startTime

  while (addMinutes(currentSlot, duration) <= endTime) {
    const slotStart = currentSlot
    const slotEnd = addMinutes(currentSlot, duration)

    // Don't suggest times in the past if checking for today
    if (isBefore(slotStart, new Date())) {
      currentSlot = addMinutes(currentSlot, stepMinutes)
      continue
    }

    // Find at least one staff member who is free
    for (const member of staff) {
      const staffAppointments = (appointments || []).filter(
        (a) => a.staff_id === member.id
      )

      const hasConflict = checkConflict(slotStart, slotEnd, staffAppointments)

      if (!hasConflict) {
        availableSlots.push({
          time: format(slotStart, "HH:mm"),
          staff_id: member.id,
        })
        break // One available staff is enough for this time slot
      }
    }

    currentSlot = addMinutes(currentSlot, stepMinutes)
  }

  return availableSlots
}

/**
 * Creates an appointment with transaction-like safety (to handle race conditions).
 * Next.js server actions / Supabase JS doesn't support generic BEGIN/COMMIT transactions easily,
 * but Supabase Postgres can handle concurrent inserts safely or via RPC.
 * For MVP, we'll perform a pre-check and insert.
 */
export async function createAppointmentSafely({
  businessId,
  customerId,
  serviceId,
  staffId,
  startTime,
  endTime,
  source,
}: {
  businessId: string
  customerId: string
  serviceId: string
  staffId: string
  startTime: string // ISO string
  endTime: string // ISO string
  source: string
}) {
  const supabase = await createClient()

  // Pre-check for conflicts right before inserting
  const { data: existingAppts } = await supabase
    .from("appointments")
    .select("id")
    .eq("business_id", businessId)
    .eq("staff_id", staffId)
    .neq("status", "cancelled")
    .lt("start_time", endTime)
    .gt("end_time", startTime)

  if (existingAppts && existingAppts.length > 0) {
    throw new Error(
      "Time slot is no longer available. Please choose another time."
    )
  }

  // Insert appointment
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      business_id: businessId,
      customer_id: customerId,
      service_id: serviceId,
      staff_id: staffId,
      start_time: startTime,
      end_time: endTime,
      status: "confirmed", // AI books are typically confirmed
      source,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}
