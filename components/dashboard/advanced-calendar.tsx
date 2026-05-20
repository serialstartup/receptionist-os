"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Clock, X, User, AlignLeft, Phone, Calendar as CalendarIcon, Plus } from "lucide-react"
import { updateAppointment, createAppointment } from "@/app/(dashboard)/actions"

interface Appointment {
  id: string
  start_time: string
  end_time: string
  status: string
  source?: string
  notes?: string
  customers?: {
    name: string
    phone?: string
    email?: string
  }
  services?: {
    name: string
    price?: number
    duration_minutes?: number
    color?: string
  }
}

interface CustomerOption {
  id: string
  name: string
  phone?: string
}

interface ServiceOption {
  id: string
  name: string
  duration_minutes: number
  price?: number
}

interface AdvancedCalendarProps {
  appointments: Appointment[]
  customers: CustomerOption[]
  services: ServiceOption[]
}

const HOURS = Array.from({ length: 17 }).map((_, i) => i + 7) // 07:00 to 23:00
const INTERVALS = [0, 15, 30, 45]

export function AdvancedCalendar({ appointments, customers, services }: AdvancedCalendarProps) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    customer_id: "",
    service_id: "",
    start_time: "",
    notes: "",
  })

  const statusStyles: Record<string, string> = {
    scheduled: "text-warning bg-warning/10 border-warning/20",
    confirmed: "text-success bg-success/10 border-success/20",
    completed: "text-muted-foreground bg-muted border-border",
    cancelled: "text-destructive bg-destructive/10 border-destructive/20",
    "no-show": "text-destructive bg-destructive/10 border-destructive/20",
  }

  const startOfWeek = useMemo(() => {
    const d = new Date(currentDate)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }, [currentDate])

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      return d
    })
  }, [startOfWeek])

  const nextWeek = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + 7)
    setCurrentDate(d)
  }

  const prevWeek = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() - 7)
    setCurrentDate(d)
  }

  const goToToday = () => setCurrentDate(new Date())

  const getApptStyle = (appt: Appointment, dayIndex: number) => {
    const start = new Date(appt.start_time)
    const end = new Date(appt.end_time)

    const startHour = start.getHours()
    const startMin = start.getMinutes()

    if (startHour < 7 || startHour > 23) return null

    const topOffset = (startHour - 7) * 4 * 24 + (startMin / 15) * 24
    const durationMins = (end.getTime() - start.getTime()) / 60000
    const height = (durationMins / 15) * 24

    return {
      top: `${topOffset}px`,
      height: `${height}px`,
      left: `calc(${(dayIndex / 7) * 100}% + 2px)`,
      width: `calc(${100 / 7}% - 4px)`,
    }
  }

  async function handleStatusUpdate(newStatus: string) {
    if (!selectedAppointment) return
    setIsUpdating(true)
    try {
      await updateAppointment(selectedAppointment.id, { status: newStatus })
      toast.success(`Appointment ${newStatus}.`)
      setSelectedAppointment(null)
      router.refresh()
    } catch {
      toast.error("Failed to update appointment.")
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!createForm.customer_id || !createForm.service_id || !createForm.start_time) {
      toast.error("Please fill in all required fields.")
      return
    }
    setIsCreating(true)
    try {
      await createAppointment({
        customer_id: createForm.customer_id,
        service_id: createForm.service_id,
        start_time: createForm.start_time,
        notes: createForm.notes || undefined,
      })
      toast.success("Appointment created.")
      setShowCreateModal(false)
      setCreateForm({ customer_id: "", service_id: "", start_time: "", notes: "" })
      router.refresh()
    } catch {
      toast.error("Failed to create appointment.")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-[800px] bg-card rounded-xl border border-border overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-bold text-foreground">
            {startOfWeek.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </h3>
          <div className="flex items-center rounded-lg border border-border bg-background p-1">
            <button onClick={prevWeek} className="p-1.5 hover:bg-accent rounded-md transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={goToToday} className="px-3 py-1 text-xs font-semibold hover:bg-accent rounded-md transition-colors">
              Today
            </button>
            <button onClick={nextWeek} className="p-1.5 hover:bg-accent rounded-md transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background px-3 py-1.5 rounded-full border border-border">
            <Clock className="h-3 w-3 text-primary" />
            <span>15-min Intervals</span>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Time Sidebar */}
        <div className="w-16 border-r border-border bg-muted/10 flex-shrink-0">
          <div className="h-12 border-b border-border" />
          <div className="relative">
            {HOURS.map((hour) => (
              <div key={hour} className="h-[96px] border-b border-border/50 relative">
                <span className="absolute -top-3 left-2 text-[10px] font-bold text-muted-foreground uppercase">
                  {hour.toString().padStart(2, "0")}:00
                </span>
                {INTERVALS.slice(1).map((int) => (
                  <div key={int} className="h-6 border-b border-border/20 last:border-0" />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Grid Content */}
        <div className="flex-1 flex flex-col overflow-x-auto">
          {/* Day Headers */}
          <div className="flex border-b border-border bg-muted/5 flex-shrink-0">
            {weekDays.map((day, i) => {
              const isToday = day.toDateString() === new Date().toDateString()
              return (
                <div key={i} className="flex-1 min-w-[120px] py-3 text-center border-r border-border last:border-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {day.toLocaleDateString(undefined, { weekday: "short" })}
                  </p>
                  <p className={cn(
                    "mt-1 text-sm font-bold w-7 h-7 flex items-center justify-center mx-auto rounded-full",
                    isToday ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground"
                  )}>
                    {day.getDate()}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Slots & Appointments */}
          <div className="relative flex-1 overflow-y-auto scrollbar-thin">
            <div className="flex min-h-[1632px] relative">
              {/* Background Grid */}
              <div className="absolute inset-0 flex">
                {weekDays.map((_, i) => (
                  <div key={i} className="flex-1 border-r border-border/50 last:border-0 relative">
                    {HOURS.map((h) => (
                      <div key={h} className="h-[96px] border-b border-border/30">
                        <div className="h-6 border-b border-border/10" />
                        <div className="h-6 border-b border-border/10" />
                        <div className="h-6 border-b border-border/10" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Appointments Layer */}
              <div className="absolute inset-0 pointer-events-none">
                {appointments.map((appt) => {
                  const apptDate = new Date(appt.start_time)
                  const dayIdx = weekDays.findIndex((d) => d.toDateString() === apptDate.toDateString())
                  if (dayIdx === -1) return null

                  const style = getApptStyle(appt, dayIdx)
                  if (!style) return null

                  return (
                    <div
                      key={appt.id}
                      style={style}
                      onClick={() => setSelectedAppointment(appt)}
                      className="absolute pointer-events-auto rounded-md border border-primary/20 bg-primary/10 p-1.5 shadow-sm overflow-hidden hover:bg-primary/20 hover:border-primary/40 transition-all cursor-pointer group"
                    >
                      <div className="flex flex-col h-full">
                        <p className="text-[10px] font-bold text-primary truncate">
                          {appt.services?.name || "Service"}
                        </p>
                        <p className="text-[9px] font-medium text-foreground truncate">
                          {appt.customers?.name}
                        </p>
                      </div>
                      <div className="absolute inset-0 bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] font-bold text-primary-foreground">View Details</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedAppointment(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-32 bg-primary/5 border-b border-border flex items-center justify-center">
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="rounded-full bg-background/80 p-1.5 text-muted-foreground hover:text-foreground transition-colors shadow-sm"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="bg-primary/10 p-4 rounded-full">
                <CalendarIcon className="h-10 w-10 text-primary" />
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border",
                    statusStyles[selectedAppointment.status] || statusStyles.scheduled
                  )}>
                    {selectedAppointment.status}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Source: {selectedAppointment.source || "Manual"}
                  </span>
                </div>
                <h4 className="text-xl font-bold text-foreground">
                  {selectedAppointment.services?.name}
                </h4>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-accent/50 p-1.5 rounded-lg">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Customer</p>
                    <p className="text-sm font-semibold text-foreground">{selectedAppointment.customers?.name}</p>
                    {selectedAppointment.customers?.phone && (
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-primary">
                        <Phone className="h-3 w-3" />
                        <span>{selectedAppointment.customers.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-accent/50 p-1.5 rounded-lg">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Time & Duration</p>
                    <p className="text-sm font-semibold text-foreground">
                      {new Date(selectedAppointment.start_time).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(selectedAppointment.start_time).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} –{" "}
                      {new Date(selectedAppointment.end_time).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}{" "}
                      ({selectedAppointment.services?.duration_minutes} mins)
                    </p>
                  </div>
                </div>

                {selectedAppointment.notes && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-accent/50 p-1.5 rounded-lg">
                      <AlignLeft className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Notes</p>
                      <p className="text-sm text-foreground leading-relaxed italic">"{selectedAppointment.notes}"</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Action Buttons */}
              <div className="mt-8 flex flex-col gap-2">
                {selectedAppointment.status === "scheduled" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusUpdate("confirmed")}
                      disabled={isUpdating}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-success/10 border border-success/30 text-success text-sm font-semibold hover:bg-success/20 transition-colors disabled:opacity-50"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleStatusUpdate("cancelled")}
                      disabled={isUpdating}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {selectedAppointment.status === "confirmed" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusUpdate("completed")}
                      disabled={isUpdating}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 disabled:opacity-50"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => handleStatusUpdate("no-show")}
                      disabled={isUpdating}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    >
                      No-show
                    </button>
                    <button
                      onClick={() => handleStatusUpdate("cancelled")}
                      disabled={isUpdating}
                      className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground text-sm font-semibold hover:bg-accent transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Appointment Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">New Appointment</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
                  Customer <span className="text-destructive">*</span>
                </label>
                <select
                  value={createForm.customer_id}
                  onChange={(e) => setCreateForm((f) => ({ ...f, customer_id: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
                  Service <span className="text-destructive">*</span>
                </label>
                <select
                  value={createForm.service_id}
                  onChange={(e) => setCreateForm((f) => ({ ...f, service_id: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                >
                  <option value="">Select service...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.duration_minutes} min{s.price ? ` — $${s.price}` : ""})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
                  Date & Time <span className="text-destructive">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={createForm.start_time}
                  onChange={(e) => setCreateForm((f) => ({ ...f, start_time: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
                  Notes
                </label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Optional notes..."
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
