import { createClient } from "@/lib/supabase/server"
import { AdvancedCalendar } from "@/components/dashboard/advanced-calendar"
import { TopBar } from "@/components/dashboard/top-bar"

export default async function CalendarPage() {
  const supabase = await createClient()

  // Fetch all business appointments for the high-granularity calendar
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      *,
      customers (name, phone, email),
      services (name, price, duration_minutes)
    `)
    .order("start_time", { ascending: true })

  const { data: userData } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", userData.user?.id)
    .single()

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, phone")
    .eq("business_id", profile?.business_id)
    .order("name", { ascending: true })

  const { data: services } = await supabase
    .from("services")
    .select("id, name, duration_minutes, price")
    .eq("business_id", profile?.business_id)
    .order("name", { ascending: true })

  return (
    <div className="flex flex-col h-full bg-muted/10">
      <TopBar
        title="Service Schedule"
        subtitle="Full weekly view with 15-minute precision"
        profile={profile}
      />
      <div className="flex-1 p-6">
        <AdvancedCalendar
          appointments={appointments || []}
          customers={customers || []}
          services={services || []}
        />
      </div>
    </div>
  )
}
