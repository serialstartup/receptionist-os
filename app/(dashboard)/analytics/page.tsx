import { createClient } from "@/lib/supabase/server"
import { AnalyticsClient } from "./analytics-client"

export default async function AnalyticsPage() {
  const supabase = await createClient()

  // Fetch more detailed data for analytics
  const [
    { count: customersCount },
    { data: appointmentsData },
  ] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("appointments").select("*, services(price)"),
  ])

  const { data: userData } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", userData.user?.id)
    .single()

  return <AnalyticsClient appointments={appointmentsData || []} customersCount={customersCount || 0} profile={profile} />
}
