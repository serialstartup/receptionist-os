import { createClient } from "@/lib/supabase/server"
import { AnalyticsClient } from "./analytics-client"

export default async function AnalyticsPage() {
  const supabase = await createClient()

  // Execute queries in parallel
  const [
    { count: appointmentsCount },
    { count: customersCount },
    { data: appointments },
  ] = await Promise.all([
    supabase.from("appointments").select("id", { count: "exact", head: true }),
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("appointments").select("services(price)"),
  ])

  // Simple revenue calculation (MVP) based on connected services
  let totalRevenue = 0
  if (appointments) {
    appointments.forEach((appt) => {
      const price = appt.services?.price
      if (price) {
         // Assuming numeric price formatting
         totalRevenue += Number(price)
      }
    })
  }

  const metrics = {
    totalAppointments: appointmentsCount || 0,
    totalCustomers: customersCount || 0,
    totalRevenue,
  }

  return <AnalyticsClient metrics={metrics} />
}
