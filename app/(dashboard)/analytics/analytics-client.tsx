"use client"

import { TopBar } from "@/components/dashboard/top-bar"
import { StatsCard } from "@/components/ui/stats-card"
import { DollarSign, CalendarCheck, Users, Bot } from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface AnalyticsClientProps {
  profile: any
  revenueByDay: Array<{ day: string; revenue: number }>
  serviceStats: Array<{ name: string; count: number; revenue: number }>
  sourceBreakdown: Array<{ name: string; value: number; color: string }>
  totalRevenue: number
  appointmentsCount: number
  customersCount: number
  aiRate: number
}

export function AnalyticsClient({
  profile,
  revenueByDay,
  serviceStats,
  sourceBreakdown,
  totalRevenue,
  appointmentsCount,
  customersCount,
  aiRate,
}: AnalyticsClientProps) {
  const maxServiceCount = serviceStats[0]?.count || 1

  return (
    <div>
      <TopBar
        title="Analytics"
        subtitle="Monitor your business performance over the last 30 days."
        profile={profile}
      />

      <div className="p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Revenue (30d)"
            value={`$${totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            trend={{ value: "Based on completed appointments", positive: true }}
          />
          <StatsCard
            title="Appointments (30d)"
            value={appointmentsCount.toLocaleString()}
            icon={CalendarCheck}
            subtitle="Excluding cancelled"
          />
          <StatsCard
            title="Total Clients"
            value={customersCount.toLocaleString()}
            icon={Users}
            subtitle="All registered customers"
          />
          <StatsCard
            title="AI Handle Rate"
            value={`${aiRate}%`}
            icon={Bot}
            trend={{ value: "Conversations handled by AI", positive: aiRate > 50 }}
          />
        </div>

        {/* Charts */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Revenue Trend */}
          <div className="col-span-3 rounded-xl border border-border bg-card p-6 flex flex-col min-h-[380px]">
            <h3 className="text-lg font-bold text-foreground">Revenue Trend</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Last 30 days — based on appointment service prices</p>
            {revenueByDay.every((d) => d.revenue === 0) ? (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                No revenue data yet.
              </div>
            ) : (
              <div className="flex-1 h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={revenueByDay.filter((_, i) => i % 3 === 0)}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.55 0.18 260)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="oklch(0.55 0.18 260)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 250)" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: "oklch(0.55 0.01 260)" }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "oklch(0.55 0.01 260)" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(v) => [`$${v ?? 0}`, "Revenue"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="oklch(0.55 0.18 260)"
                      strokeWidth={2}
                      fill="url(#colorRevenue)"
                      activeDot={{ r: 5, fill: "oklch(0.55 0.18 260)", strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Source Breakdown */}
          <div className="col-span-2 rounded-xl border border-border bg-card p-6 flex flex-col justify-between">
            <h3 className="text-lg font-bold text-foreground">Booking Source</h3>
            {sourceBreakdown.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                No booking data yet.
              </div>
            ) : (
              <div className="mt-4 flex flex-col items-center flex-1 justify-center">
                <div className="h-[180px] w-[180px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {sourceBreakdown.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-2xl font-bold text-foreground">{appointmentsCount}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-0.5">Bookings</p>
                  </div>
                </div>
                <div className="mt-5 w-full space-y-3">
                  {sourceBreakdown.map((ch) => (
                    <div key={ch.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: ch.color }} />
                        <span className="text-xs font-medium text-muted-foreground">{ch.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{ch.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Popular Services */}
        <div className="mt-6 rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-bold text-foreground mb-6">Popular Services (30d)</h3>
          {serviceStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointment data yet.</p>
          ) : (
            <div className="space-y-5">
              {serviceStats.map((svc) => (
                <div key={svc.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{svc.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">${svc.revenue.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded">
                        {svc.count} appts
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(svc.count / maxServiceCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
