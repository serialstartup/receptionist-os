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
  X,
  Loader2,
  MoreVertical,
  CalendarDays,
  Search,
} from "lucide-react"
import { AdvancedCalendar } from "@/components/dashboard/advanced-calendar"

import { createAppointment } from "../actions"
import { useRouter } from "next/navigation"

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
  customers: any[]
  services: any[]
  profile?: any
}

export function AppointmentsClient({
  appointments,
  customers,
  services,
  profile,
}: AppointmentClientProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today")
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    customer_id: "",
    service_id: "",
    start_time: "",
    notes: "",
  })

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createAppointment(formData)
      setIsModalOpen(false)
      setFormData({
        customer_id: "",
        service_id: "",
        start_time: "",
        notes: "",
      })
      router.refresh()
    } catch (error) {
      console.error("Error creating appointment:", error)
      alert("Failed to create appointment.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExport = () => {
    // Generate CSV content
    const headers = ["Date", "Time", "Customer", "Phone", "Service", "Status"]
    const rows = filteredAppointments.map((appt) => {
      const startTime = new Date(appt.start_time)
      return [
        startTime.toLocaleDateString(),
        startTime.toLocaleTimeString(),
        appt.customers?.name || "Unknown",
        appt.customers?.phone || "",
        appt.services?.name || "",
        appt.status,
      ].join(",")
    })

    const csvContent = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `appointments_${timeFilter}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filter appointments
  const filteredAppointments = appointments.filter((appt) => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch =
      appt.customers?.name?.toLowerCase().includes(searchLower) ||
      appt.services?.name?.toLowerCase().includes(searchLower) ||
      appt.customers?.phone?.toLowerCase().includes(searchLower)

    if (!matchesSearch) return false

    // Time filtering
    const apptDate = new Date(appt.start_time)
    const now = new Date()
    
    if (timeFilter === "today") {
      return apptDate.toDateString() === now.toDateString()
    } else if (timeFilter === "week") {
      const oneWeekAgo = new Date(now)
      oneWeekAgo.setDate(now.getDate() - 7)
      return apptDate >= oneWeekAgo && apptDate <= now
    } else if (timeFilter === "month") {
      const oneMonthAgo = new Date(now)
      oneMonthAgo.setMonth(now.getMonth() - 1)
      return apptDate >= oneMonthAgo && apptDate <= now
    }

    return true
  })

  // Calculate totals based on filtered results for consistency
  const totalRevenue = filteredAppointments.reduce(
    (acc, appt) => acc + (appt.services?.price || 0),
    0
  )

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
        searchPlaceholder="Search by customer or service..."
        profile={profile}
      />

      <div className="p-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-1 items-center gap-4 sm:w-auto">
            <h2 className="text-lg font-bold text-foreground">
              Appointments List
            </h2>
            <div className="relative max-w-sm flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by customer or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background pr-4 pl-9 text-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg border border-border bg-card p-1">
              {(["today", "week", "month"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-all",
                    timeFilter === filter
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              New
            </button>
          </div>
        </div>

        {/* Content Area */}
        {filteredAppointments.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={CalendarDays}
              title={searchQuery ? "No results found" : "No appointments yet"}
              description={
                searchQuery
                  ? `We couldn't find any appointments matching "${searchQuery}".`
                  : "Your schedule is completely clear. Start adding your bookings to see them here."
              }
              action={
                !searchQuery && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Add Appointment
                  </button>
                )
              }
            />
          </div>
        ) : (
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
                {filteredAppointments.map((appt) => {
                  const startTime = new Date(appt.start_time)
                  const endTime = new Date(appt.end_time)
                  const durationMins = Math.round(
                    (endTime.getTime() - startTime.getTime()) / 60000
                  )

                  return (
                    <tr
                      key={appt.id}
                      className="group transition-colors hover:bg-accent/30"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-foreground">
                          {startTime.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          •{" "}
                          {startTime.toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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
                            <span className="text-xs text-muted-foreground">
                              {appt.customers?.phone}
                            </span>
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
                            statusStyles[
                              appt.status as keyof typeof statusStyles
                            ] || statusStyles.scheduled
                          )}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {appt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent hover:text-foreground">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Stats */}
        {appointments.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatsCard
              title="Bookings Total"
              value={filteredAppointments.length}
              icon={CalendarCheck}
              trend={{ value: "Based on real database", positive: true }}
            />
            <StatsCard
              title="Expected Revenue"
              value={`$${totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              trend={{ value: "Based on booked services", positive: true }}
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

      {/* New Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg animate-in rounded-xl border border-border bg-card p-6 shadow-lg duration-200 fade-in zoom-in">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground">
                Add New Appointment
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Customer
                </label>
                <select
                  required
                  value={formData.customer_id}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_id: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="">Select a customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Service
                </label>
                <select
                  required
                  value={formData.service_id}
                  onChange={(e) =>
                    setFormData({ ...formData, service_id: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="">Select a service...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {s.duration_minutes} min
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Start Time
                </label>
                <input
                  required
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData({ ...formData, start_time: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Any special requests?"
                  className="h-20 w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Book Appointment"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
