import { createClient } from "@/lib/supabase/server"
import { AnalyticsClient } from "./analytics-client"
import { format, subDays, startOfDay } from "date-fns"

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("users")
    .select("*, business_id")
    .eq("id", userData.user?.id)
    .single()

  const businessId = profile?.business_id
  if (!businessId) {
    return <AnalyticsClient
      profile={profile}
      revenueByDay={[]}
      serviceStats={[]}
      sourceBreakdown={[]}
      totalRevenue={0}
      appointmentsCount={0}
      customersCount={0}
      aiRate={0}
    />
  }

  const thirtyDaysAgo = startOfDay(subDays(new Date(), 30)).toISOString()

  const [
    { count: customersCount },
    { data: appointments },
    { data: conversations },
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
    supabase
      .from("appointments")
      .select("id, start_time, source, services(name, price)")
      .eq("business_id", businessId)
      .neq("status", "cancelled")
      .gte("start_time", thirtyDaysAgo),
    supabase
      .from("conversations")
      .select("ai_enabled")
      .eq("business_id", businessId),
  ])

  // Revenue trend: group by day (last 30 days)
  const dayMap: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = format(subDays(new Date(), i), "MM/dd")
    dayMap[d] = 0
  }
  for (const appt of appointments ?? []) {
    const d = format(new Date(appt.start_time), "MM/dd")
    const svc = Array.isArray(appt.services) ? appt.services[0] : appt.services
    if (d in dayMap) dayMap[d] += svc?.price ?? 0
  }
  const revenueByDay = Object.entries(dayMap).map(([day, revenue]) => ({ day, revenue }))

  // Service popularity
  const serviceCountMap: Record<string, { name: string; count: number; revenue: number }> = {}
  for (const appt of appointments ?? []) {
    const svc = Array.isArray(appt.services) ? appt.services[0] : appt.services
    const name = svc?.name ?? "Unknown"
    if (!serviceCountMap[name]) serviceCountMap[name] = { name, count: 0, revenue: 0 }
    serviceCountMap[name].count++
    serviceCountMap[name].revenue += svc?.price ?? 0
  }
  const serviceStats = Object.values(serviceCountMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Source breakdown
  const sourceCounts: Record<string, number> = {}
  for (const appt of appointments ?? []) {
    const src = appt.source ?? "dashboard"
    sourceCounts[src] = (sourceCounts[src] ?? 0) + 1
  }
  const total = (appointments ?? []).length || 1
  const colors: Record<string, string> = {
    whatsapp: "oklch(0.55 0.18 145)",
    instagram: "oklch(0.55 0.18 305)",
    dashboard: "oklch(0.55 0.18 260)",
  }
  const sourceBreakdown = Object.entries(sourceCounts).map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: Math.round((count / total) * 100),
    color: colors[name] ?? "oklch(0.7 0.1 260)",
  }))

  // AI rate
  const convList = conversations ?? []
  const aiRate = convList.length > 0
    ? Math.round((convList.filter((c) => c.ai_enabled).length / convList.length) * 100)
    : 0

  const totalRevenue = (appointments ?? []).reduce((acc, appt) => {
    const svc = Array.isArray(appt.services) ? appt.services[0] : appt.services
    return acc + (svc?.price ?? 0)
  }, 0)

  return (
    <AnalyticsClient
      profile={profile}
      revenueByDay={revenueByDay}
      serviceStats={serviceStats}
      sourceBreakdown={sourceBreakdown}
      totalRevenue={totalRevenue}
      appointmentsCount={(appointments ?? []).length}
      customersCount={customersCount ?? 0}
      aiRate={aiRate}
    />
  )
}
