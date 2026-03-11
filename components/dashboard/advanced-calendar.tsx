"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"

interface Appointment {
  id: string
  start_time: string
  end_time: string
  customers?: { name: string }
  services?: { name: string; color?: string }
}

interface AdvancedCalendarProps {
  appointments: Appointment[]
}

const HOURS = Array.from({ length: 17 }).map((_, i) => i + 7) // 07:00 to 23:00
const INTERVALS = [0, 15, 30, 45]

export function AdvancedCalendar({ appointments }: AdvancedCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  // Calculate start of the week (Monday)
  const startOfWeek = useMemo(() => {
    const d = new Date(currentDate)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
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

  // Helper to calculate position
  const getApptStyle = (appt: Appointment, dayIndex: number) => {
    const start = new Date(appt.start_time)
    const end = new Date(appt.end_time)
    
    const startHour = start.getHours()
    const startMin = start.getMinutes()
    const endHour = end.getHours()
    const endMin = end.getMinutes()

    // Only show if within calendar range
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

  return (
    <div className="flex flex-col h-full min-h-[800px] bg-card rounded-xl border border-border overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-bold text-foreground">
            {startOfWeek.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
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
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background px-3 py-1.5 rounded-full border border-border">
          <Clock className="h-3 w-3 text-primary" />
          <span>15-min Intervals</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Time Sidebar */}
        <div className="w-16 border-r border-border bg-muted/10 flex-shrink-0">
          <div className="h-12 border-b border-border" /> {/* Spacer for header */}
          <div className="relative">
            {HOURS.map((hour) => (
              <div key={hour} className="h-[96px] border-b border-border/50 relative">
                <span className="absolute -top-3 left-2 text-[10px] font-bold text-muted-foreground uppercase">
                  {hour.toString().padStart(2, '0')}:00
                </span>
                {INTERVALS.slice(1).map(int => (
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
                    {day.toLocaleDateString(undefined, { weekday: 'short' })}
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
            <div className="flex min-h-[1632px] relative"> {/* 17 hours * 4 slots * 24px */}
              {/* Background Grid */}
              <div className="absolute inset-0 flex">
                {weekDays.map((_, i) => (
                  <div key={i} className="flex-1 border-r border-border/50 last:border-0 relative">
                     {HOURS.map(h => (
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
                  const dayIdx = weekDays.findIndex(d => d.toDateString() === apptDate.toDateString())
                  if (dayIdx === -1) return null

                  const style = getApptStyle(appt, dayIdx)
                  if (!style) return null

                  return (
                    <div
                      key={appt.id}
                      style={style}
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
                      
                      {/* Tooltip-like effect on hover */}
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
    </div>
  )
}
