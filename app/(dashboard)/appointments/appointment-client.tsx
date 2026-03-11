"use client"

import { useState } from "react"
import { TopBar } from "@/components/dashboard/top-bar"
import { StatsCard } from "@/components/ui/stats-card"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"
import {
  CalendarCheck,
  DollarSign,
  Users,
  Plus,
  Download,
  MoreVertical,
  CalendarDays,
} from "lucide-react"
import { AdvancedCalendar } from "@/components/dashboard/advanced-calendar"

type ViewMode = "list" | "calendar"
type TimeFilter = "today" | "week" | "month"

const statusStyles = {
  scheduled: "text-warning bg-warning/10",
  confirmed: "text-success bg-success/10",
  completed: "text-muted-foreground bg-muted",
  cancelled: "text-destructive bg-destructive/10",
  "no-show": "text-destructive bg-destructive/10",
}

interface AppointmentClientProps {
  appointments: any[]
}

export function AppointmentsClient({ appointments }: AppointmentClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today")

  // For MVP Calendar view, we generate a simple 7-day grid starting from today
  const today = new Date()
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return d
  })

  return (
    <div>
      <TopBar
        title="Appointments"
        subtitle="Manage your daily schedule and client bookings"
        searchPlaceholder="Search appointments..."
      />

      <div className="p-6">
        {/* Action Row */}
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1">
            {(["list", "calendar"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm font-medium transition-all",
                  viewMode === mode
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {mode === "list" ? "List View" : "Calendar View"}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg border border-border bg-card p-1">
              {(["today", "week", "month"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium capitalize transition-all rounded-md",
                    timeFilter === filter
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-colors">
              <Plus className="h-4 w-4" />
              New
            </button>
          </div>
        </div>

        {/* Content Area */}
        {appointments.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={CalendarDays}
              title="No appointments yet"
              description="Your schedule is completely clear. Start adding your bookings to see them here."
              action={
                <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                  Add Appointment
                </button>
              }
            />
          </div>
        ) : viewMode === "list" ? (
          <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Service
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {appointments.map((appt) => {
                  const startTime = new Date(appt.start_time)
                  const endTime = new Date(appt.end_time)
                  const durationMins = Math.round((endTime.getTime() - startTime.getTime()) / 60000)
                  
                  return (
                  <tr
                    key={appt.id}
                    className="transition-colors hover:bg-accent/30 group"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-foreground">
                        {startTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric'})} • {startTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit'})}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {durationMins} min
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                           {appt.customers?.name?.charAt(0) || "U"}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">
                            {appt.customers?.name || "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground">{appt.customers?.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {appt.services?.name || "Service Removed"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                          statusStyles[appt.status as keyof typeof statusStyles] || statusStyles.scheduled
                        )}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6">
            <AdvancedCalendar appointments={appointments} />
          </div>
        )}

        {/* Bottom Stats */}
        {appointments.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatsCard
              title="Bookings Total"
              value={appointments.length}
              icon={CalendarCheck}
              trend={{ value: "Based on real database", positive: true }}
            />
            <StatsCard
              title="Expected Revenue"
              value={"Data Sync"}
              icon={DollarSign}
              subtitle="Pending integration"
            />
            <StatsCard
              title="Waitlist"
              value={0}
              icon={Users}
              subtitle="Clients waiting"
            />
          </div>
        )}
      </div>
    </div>
  )
}
