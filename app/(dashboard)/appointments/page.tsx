import { createClient } from "@/lib/supabase/server"
import { AppointmentsClient } from "./appointment-client"

export default async function AppointmentsPage() {
  const supabase = await createClient()

  // Fetch appointments with related services and customers
  const { data: appointments } = await supabase
    .from("appointments")
    .select("*, services(name, price), customers(name, phone)")
    .order("start_time", { ascending: true })

  // Fetch customers and services for the creation modal
  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, phone")
    .order("name", { ascending: true })

  const { data: services } = await supabase
    .from("services")
    .select("id, name, duration_minutes, price")
    .eq("is_active", true)
    .order("name", { ascending: true })

  const { data: userData } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", userData.user?.id)
    .single()

  return (
    <AppointmentsClient 
      appointments={appointments || []} 
      customers={customers || []}
      services={services || []}
      profile={profile}
    />
  )
}
