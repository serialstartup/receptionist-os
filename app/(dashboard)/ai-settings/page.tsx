"use client"

import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import { Bot, Clock, MessageCircle, Save } from "lucide-react"
import { useState } from "react"

type SettingsTab = "personality" | "scheduling"

export default function AISettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("personality")
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => setIsSaving(false), 1000)
  }

  return (
    <div>
      <TopBar title="AI Settings" subtitle="Configure your AI Receptionist's behavior and knowledge." />

      <div className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              AI Configuration
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Define how your automated assistant communicates and manages your calendar.
            </p>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-70"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Tabs */}
        <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto border-b border-border mb-6">
          {(
            [
              { key: "personality", label: "Personality & Tone" },
              { key: "scheduling", label: "Scheduling Rules" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as SettingsTab)}
              className={cn(
                "border-b-2 px-4 py-3 text-sm font-medium transition-all focus:outline-none",
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "personality" ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* AI Bio */}
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">
                  Business Knowledge Base
                </h3>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-2">
                  System Instructions
                </p>
                <textarea
                  defaultValue="You are BeautyAI, the front desk receptionist for an upscale salon. Your goal is to help clients understand our services, book appointments smoothly, and answer basic questions about our location and parking."
                  className="h-40 w-full resize-none rounded-lg border border-border bg-background p-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                />
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  This prompt acts as the core instruction set for the AI. Tell it precisely who it is and how it should represent your business.
                </p>
              </div>
            </div>

            {/* AI Tone & Language */}
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">
                  Voice & Interaction
                </h3>
              </div>
              
              <div>
                <p className="text-sm font-medium text-foreground mb-1.5">Communication Tone</p>
                <select className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer">
                  <option>Friendly & Casual</option>
                  <option>Professional & Polite</option>
                  <option>Luxury & Exclusive</option>
                  <option>Energetic & Upbeat</option>
                </select>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Determines the vocabulary and warmth of the AI's responses.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-1.5">
                  Primary Language
                </p>
                <select className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer">
                  <option>English (US)</option>
                  <option>Türkçe</option>
                  <option>Español</option>
                  <option>Deutsch</option>
                </select>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  The AI will default to this language but can adapt if the customer speaks another language.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg border border-border/50">
                <div>
                   <p className="text-sm font-medium text-foreground">Emoji Usage</p>
                   <p className="text-xs text-muted-foreground">Allow AI to use emojis in chat.</p>
                </div>
                <button className="relative h-6 w-11 rounded-full bg-primary transition-colors focus:outline-none">
                  <span className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Appointment Rules */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">
                  Calendar Rules
                </h3>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-foreground mb-1.5">
                    Default Buffer Time
                  </p>
                  <div className="flex items-center gap-2">
                    <select className="w-32 rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer">
                      <option value="0">None</option>
                      <option value="5">5 mins</option>
                      <option value="10">10 mins</option>
                      <option selected value="15">15 mins</option>
                      <option value="30">30 mins</option>
                    </select>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Time automatically blocked out between appointments.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-1.5">
                    Maximum Advance Booking
                  </p>
                  <select className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer">
                    <option>14 Days</option>
                    <option selected>30 Days</option>
                    <option>60 Days</option>
                    <option>90 Days</option>
                  </select>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    How far into the future clients can schedule an appointment.
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg border border-border/50 mt-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Require Manual Approval</p>
                    <p className="text-xs text-muted-foreground mt-0.5">AI will mark new bookings as "Pending".</p>
                  </div>
                  <button className="relative h-6 w-11 rounded-full bg-muted transition-colors focus:outline-none">
                    <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform" />
                  </button>
                </div>
              </div>
            </div>

             {/* Working Hours */}
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">
                  Business Hours
                </h3>
              </div>

              <div className="space-y-4 flex-1">
                {[
                   { day: "Monday", open: "09:00 AM", close: "06:00 PM", active: true },
                   { day: "Tuesday", open: "09:00 AM", close: "06:00 PM", active: true },
                   { day: "Wednesday", open: "09:00 AM", close: "06:00 PM", active: true },
                   { day: "Thursday", open: "09:00 AM", close: "06:00 PM", active: true },
                   { day: "Friday", open: "09:00 AM", close: "07:00 PM", active: true },
                   { day: "Saturday", open: "10:00 AM", close: "04:00 PM", active: true },
                   { day: "Sunday", open: "Closed", close: "Closed", active: false },
                ].map((schedule) => (
                   <div key={schedule.day} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                     <span className={cn("text-sm font-medium w-24", schedule.active ? "text-foreground" : "text-muted-foreground")}>{schedule.day}</span>
                     {schedule.active ? (
                        <div className="flex items-center gap-2">
                           <input
                              type="text"
                              defaultValue={schedule.open}
                              className="w-24 rounded-lg border border-border bg-background px-2 py-1.5 text-center text-xs focus:border-primary focus:outline-none"
                           />
                           <span className="text-muted-foreground text-xs">to</span>
                           <input
                              type="text"
                              defaultValue={schedule.close}
                              className="w-24 rounded-lg border border-border bg-background px-2 py-1.5 text-center text-xs focus:border-primary focus:outline-none"
                           />
                        </div>
                     ) : (
                        <span className="text-sm font-semibold text-destructive px-4 py-1.5 bg-destructive/10 rounded-md">
                           Closed
                        </span>
                     )}
                   </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
