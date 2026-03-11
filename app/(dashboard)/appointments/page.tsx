import { createClient } from "@/lib/supabase/server"
import { AppointmentsClient } from "./appointment-client"

export default async function AppointmentsPage() {
  const supabase = await createClient()

  // Fetch appointments with related services and customers
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("*, services(name), customers(name, phone)")
    .order("start_time", { ascending: true })

  if (error) {
    console.error("Error fetching appointments:", error)
  }

  return <AppointmentsClient appointments={appointments || []} />
}
