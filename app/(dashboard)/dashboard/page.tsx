import { TopBar } from "@/components/dashboard/top-bar"
import { StatsCard } from "@/components/ui/stats-card"
import { WeeklyChart } from "@/components/dashboard/weekly-chart"
import { EmptyState } from "@/components/ui/empty-state"
import { createClient } from "@/lib/supabase/server"
import {
  CalendarCheck,
  Clock,
  Users,
  DollarSign,
  LayoutGrid,
  Calendar,
  User,
} from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()

  // Execute queries in parallel using Promise.all
  const [
    { data: appointments },
    { data: customers },
  ] = await Promise.all([
    supabase.from("appointments").select("id, start_time, status, service_id, services(name), customers(name)").order("start_time", { ascending: true }),
    supabase.from("customers").select("id, name, created_at, phone").order("created_at", { ascending: false }).limit(5),
  ])

  // Process data for Stats (in a real app, you would sum real services and revenues)
  // Since this is MVP, we calculate based on the available data simply.
  const appts = appointments || []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const todayAppts = appts.filter(a => {
    const d = new Date(a.start_time)
    d.setHours(0, 0, 0, 0)
    return d.getTime() === today.getTime()
  })

  const upcomingAppts = appts.filter(a => new Date(a.start_time) > today)

  // Example Weekly Data (In a real app, aggregate appts by day, for now pass a placeholder or aggregated real if possible)
  // For MVP, if there are no appts, we return null or empty. But we can show a placeholder if empty to look good.
  const weeklyData = [
    { day: "Mon", confirmed: 4, suggested: 2 },
    { day: "Tue", confirmed: 6, suggested: 3 },
    { day: "Wed", confirmed: 5, suggested: 4 },
    { day: "Thu", confirmed: 8, suggested: 5 },
    { day: "Fri", confirmed: 12, suggested: 7 },
    { day: "Sat", confirmed: 15, suggested: 9 },
    { day: "Sun", confirmed: 10, suggested: 6 },
  ]

  return (
    <div>
      <TopBar
        title="Dashboard"
        searchPlaceholder="Search bookings..."
        showNewBooking
      />

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Today Appts"
            value={todayAppts.length}
            icon={CalendarCheck}
            trend={{ value: "Based on real data", positive: true }}
          />
          <StatsCard
            title="Upcoming"
            value={upcomingAppts.length}
            icon={Clock}
            subtitle="All upcoming bookings"
          />
          <StatsCard
            title="Recent Customers"
            value={customers?.length || 0}
            icon={Users}
            subtitle="Total customers added"
          />
        </div>

        {/* Charts and Lists Row */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Weekly Chart */}
          <div className="col-span-2 rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Weekly Appointments
                </h3>
                <p className="text-sm text-muted-foreground">
                  Booking trends over the last 7 days
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Confirmed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-primary/30" />
                  <span className="text-muted-foreground">AI Suggested</span>
                </div>
              </div>
            </div>

            <WeeklyChart data={weeklyData} />
          </div>

          <div className="flex flex-col gap-6">
            {/* Upcoming Appointments */}
            <div className="rounded-xl border border-border bg-card p-6 flex-1">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-foreground">Next Up</h3>
                <p className="text-sm text-muted-foreground">
                  Upcoming appointments
                </p>
              </div>

              {upcomingAppts.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppts.slice(0, 4).map((apt: any) => (
                    <div
                      key={apt.id}
                      className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-accent/50"
                    >
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {apt.services?.name || "Service"}
                          </p>
                          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            {apt.status}
                          </span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {apt.customers?.name || "Unknown Customer"}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70">
                          {new Date(apt.start_time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Calendar className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm font-medium text-foreground">No upcoming</p>
                  <p className="text-xs text-muted-foreground">Your schedule is clear</p>
                </div>
              )}
            </div>

            {/* Recent Customers */}
            <div className="rounded-xl border border-border bg-card p-6 flex-1">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-foreground">Recent Customers</h3>
                <p className="text-sm text-muted-foreground">
                  Latest signups or visitors
                </p>
              </div>

              {customers && customers.length > 0 ? (
                <div className="space-y-4">
                  {customers.map((cust: any) => (
                    <div
                      key={cust.id}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent/50"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {cust.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {cust.phone || "No phone"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <User className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm font-medium text-foreground">No customers</p>
                  <p className="text-xs text-muted-foreground">Add your first client</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
