"use client"

import { useState } from "react"
import { TopBar } from "@/components/dashboard/top-bar"
import { StatsCard } from "@/components/ui/stats-card"
import { cn } from "@/lib/utils"
import { DollarSign, CalendarCheck, Users, Bot, Star } from "lucide-react"
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

type TimeRange = "today" | "7days" | "30days" | "custom"

interface AnalyticsClientProps {
  appointments: any[]
  customersCount: number
  profile: any
}

// Mock Data for Charts
const revenueData = [
  { day: "Mon", revenue: 2100 },
  { day: "Tue", revenue: 2800 },
  { day: "Wed", revenue: 3200 },
  { day: "Thu", revenue: 4500 },
  { day: "Fri", revenue: 3800 },
  { day: "Sat", revenue: 4200 },
  { day: "Sun", revenue: 3100 },
]

const channelData = [
  { name: "Instagram", value: 45, color: "var(--color-ig, oklch(0.55 0.18 260))" },
  { name: "Word of Mouth", value: 30, color: "var(--color-wom, oklch(0.65 0.2 145))" },
  { name: "Google Search", value: 25, color: "var(--color-gs, oklch(0.75 0.15 70))" },
]

const popularServices = [
  { name: "Hair Coloring", count: 240 },
  { name: "Manicure & Pedicure", count: 185 },
  { name: "Express Haircut", count: 142 },
  { name: "Facial Treatment", count: 98 },
]

export function AnalyticsClient({ appointments, customersCount, profile }: AnalyticsClientProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("7days")

  const filteredAppointments = appointments.filter((appt) => {
    const apptDate = new Date(appt.start_time)
    const now = new Date()

    if (timeRange === "today") {
      return apptDate.toDateString() === now.toDateString()
    } else if (timeRange === "7days") {
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(now.getDate() - 7)
      return apptDate >= sevenDaysAgo && apptDate <= now
    } else if (timeRange === "30days") {
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(now.getDate() - 30)
      return apptDate >= thirtyDaysAgo && apptDate <= now
    }
    return true
  })

  const totalRevenue = filteredAppointments.reduce((acc, appt) => {
    const service = Array.isArray(appt.services) ? appt.services[0] : appt.services
    return acc + (service?.price || 0)
  }, 0)

  const appointmentsCount = filteredAppointments.length

  return (
    <div>
      <TopBar
        title="Analytics Overview"
        subtitle="Monitor your salon's performance and growth metrics."
        searchPlaceholder="Search analytics..."
        profile={profile}
      />

      <div className="p-6">
        {/* Time Range Filter */}
        <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
          {(
            [
              { key: "today", label: "Today" },
              { key: "7days", label: "Last 7 Days" },
              { key: "30days", label: "Last 30 Days" },
              { key: "custom", label: "All Time" },
            ] as const
          ).map((range) => (
            <button
              key={range.key}
              onClick={() => setTimeRange(range.key)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-all focus:outline-none",
                timeRange === range.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border text-muted-foreground hover:bg-accent"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title={`Revenue (${timeRange})`}
            value={`$${totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            trend={{ value: "Based on real data", positive: true }}
          />
          <StatsCard
            title="Appointments"
            value={appointmentsCount.toLocaleString()}
            icon={CalendarCheck}
            subtitle={timeRange === "custom" ? "All Time" : `InRange: ${timeRange}`}
          />
          <StatsCard
            title="Total Client Base"
            value={customersCount.toLocaleString()}
            icon={Users}
            subtitle="Registered Customers"
          />
          <StatsCard
            title="AI Efficiency"
            value="88.5%"
            icon={Bot}
            trend={{ value: "Pending AI Log tracking", positive: true }}
          />
        </div>

        {/* Charts */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Revenue Trends */}
          <div className="col-span-3 rounded-xl border border-border bg-card p-6 flex flex-col min-h-[400px]">
            <h3 className="text-lg font-bold text-foreground">
              Projected Revenue Trends
            </h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Sample Data Prediction for MVP</p>
            <div className="flex-1 h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="oklch(0.55 0.18 260)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="oklch(0.55 0.18 260)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 250)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12, fill: "oklch(0.55 0.01 260)" }}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "oklch(0.55 0.01 260)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    itemStyle={{ color: "var(--foreground)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="oklch(0.55 0.18 260)"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                    activeDot={{ r: 6, fill: "oklch(0.55 0.18 260)", strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Acquisition Channels */}
          <div className="col-span-2 rounded-xl border border-border bg-card p-6 flex flex-col justify-between">
            <h3 className="text-lg font-bold text-foreground">
              Acquisition Channels
            </h3>
            <div className="mt-4 flex flex-col items-center flex-1 justify-center">
              <div className="h-[200px] w-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-2xl font-bold text-foreground">1.2k</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-0.5">Leads</p>
                </div>
              </div>
              <div className="mt-6 w-full space-y-3">
                {channelData.map((ch) => (
                  <div
                    key={ch.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: ch.color }}
                      />
                      <span className="text-xs font-medium text-muted-foreground">{ch.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {ch.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Popular Services */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground">
              Popular Services Prediction
            </h3>
            <div className="mt-6 space-y-5">
              {popularServices.map((service) => (
                <div key={service.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {service.name}
                    </span>
                    <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded">
                      {service.count} appts
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${(service.count / 240) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 flex flex-col items-center justify-center text-center">
             <Star className="h-8 w-8 text-muted-foreground/50 mb-3" />
             <h3 className="text-sm font-bold text-foreground">Staff Analytics Removed</h3>
             <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Staff performance tracking is unavailable in this lean MVP build.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
