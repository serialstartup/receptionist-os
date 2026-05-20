"use client"

import { useState } from "react"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import {
  User,
  Building2,
  Users,
  CreditCard,
  Bell,
  CheckCircle2,
  ExternalLink,
  Settings as SettingsIcon,
  Loader2,
} from "lucide-react"
import { updateBusiness, updateProfile } from "../actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type SettingsSection =
  | "profile"
  | "business"
  | "team"
  | "billing"
  | "notifications"

const sections = [
  { key: "business" as const, label: "Business Info", icon: Building2 },
  { key: "profile" as const, label: "Your Profile", icon: User },
  { key: "billing" as const, label: "Billing", icon: CreditCard },
  { key: "notifications" as const, label: "Notifications", icon: Bell },
]

interface SettingsClientProps {
  business: any
  profile: any
}

export function SettingsClient({ business, profile }: SettingsClientProps) {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("business")
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Business state
  const [businessData, setBusinessData] = useState({
    name: business?.name || "",
    timezone: business?.timezone || "Europe/Istanbul",
    working_hours_start: business?.working_hours_start || "09:00",
    working_hours_end: business?.working_hours_end || "18:00",
    working_days: (business?.working_days as number[]) || [1, 2, 3, 4, 5, 6],
  })

  // Profile state
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || "",
  })

  const handleSaveBusiness = async () => {
    if (!business?.id) return
    setIsSaving(true)
    try {
      await updateBusiness(business.id, businessData)
      toast.success("Business settings saved.")
      router.refresh()
    } catch {
      toast.error("Failed to save business settings.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      await updateProfile(profileData)
      toast.success("Profile saved.")
      router.refresh()
    } catch {
      toast.error("Failed to save profile settings.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <TopBar title="Settings" profile={profile} />

      <div className="flex min-h-[calc(100vh-64px)] flex-col border-t border-border md:flex-row">
        {/* Content */}
        <div className="flex-1 p-4 md:p-8">
          {activeSection === "business" && (
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Business Information
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your salon or beauty business details and subscription.
              </p>

              {/* General Profile Card */}
              <div className="mt-6 rounded-xl border border-border bg-card p-6">
                <h3 className="text-base font-bold text-foreground">
                  General Profile
                </h3>

                <div className="mt-5 flex flex-col items-start gap-6 sm:flex-row">
                  {/* Logo */}
                  <div className="relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary/10 text-2xl font-bold text-primary uppercase">
                      {business?.name?.charAt(0) || "B"}
                    </div>
                    <button className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow transition-colors hover:bg-primary/90">
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Fields */}
                  <div className="grid w-full flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">
                        Business Name
                      </label>
                      <input
                        type="text"
                        value={businessData.name}
                        onChange={(e) => setBusinessData({ ...businessData, name: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">
                        Account Owner User
                      </label>
                      <input
                        type="text"
                        readOnly
                        defaultValue={profile?.full_name || "Admin"}
                        className="mt-1 w-full cursor-not-allowed rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">
                        Timezone
                      </label>
                      <select
                        value={businessData.timezone}
                        onChange={(e) => setBusinessData({ ...businessData, timezone: e.target.value })}
                        className="mt-1 w-full cursor-pointer rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                      >
                        <option value="Europe/Istanbul">Europe/Istanbul (UTC+3)</option>
                        <option value="Europe/London">Europe/London (UTC+0/+1)</option>
                        <option value="Europe/Berlin">Europe/Berlin (UTC+1/+2)</option>
                        <option value="Europe/Paris">Europe/Paris (UTC+1/+2)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="America/Chicago">America/Chicago (CST)</option>
                        <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                        <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
                        <option value="Asia/Riyadh">Asia/Riyadh (UTC+3)</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">
                        Working Hours Start
                      </label>
                      <input
                        type="time"
                        value={businessData.working_hours_start}
                        onChange={(e) => setBusinessData({ ...businessData, working_hours_start: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">
                        Working Hours End
                      </label>
                      <input
                        type="time"
                        value={businessData.working_hours_end}
                        onChange={(e) => setBusinessData({ ...businessData, working_hours_end: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-xs font-medium text-foreground">
                        Working Days
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {DAY_LABELS.map((label, idx) => {
                          const active = businessData.working_days.includes(idx)
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                const days = active
                                  ? businessData.working_days.filter((d) => d !== idx)
                                  : [...businessData.working_days, idx].sort()
                                setBusinessData({ ...businessData, working_days: days })
                              }}
                              className={cn(
                                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                                active
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "border border-border text-muted-foreground hover:bg-accent"
                              )}
                            >
                              {label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-border pt-6">
                  <button
                    onClick={() => setBusinessData({
                      name: business?.name || "",
                      timezone: business?.timezone || "Europe/Istanbul",
                      working_hours_start: business?.working_hours_start || "09:00",
                      working_hours_end: business?.working_hours_end || "18:00",
                      working_days: (business?.working_days as number[]) || [1, 2, 3, 4, 5, 6],
                    })}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleSaveBusiness}
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70"
                  >
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>

              {/* Subscription */}
              <div className="mt-6 rounded-xl border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground">
                    Subscription Plan
                  </h3>
                  <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold tracking-wider text-success uppercase">
                    ACTIVE
                  </span>
                </div>

                <div className="mt-4 flex flex-col items-start justify-between gap-6 sm:flex-row">
                  <div>
                    <p className="text-xs tracking-wider text-muted-foreground uppercase">
                      Current Plan
                    </p>
                    <h4 className="mt-1 text-xl font-bold text-primary">
                      Pro Beauty Enterprise
                    </h4>
                    <div className="mt-4 space-y-2.5">
                      {[
                        "Unlimited AI Image Generations",
                        "Advanced CRM & Automation",
                        "Priority 24/7 Support",
                      ].map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span className="text-sm text-foreground">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      Next billing date:{" "}
                      <strong className="text-foreground">Dec 1, 2024</strong>
                    </p>
                  </div>

                  <div className="flex w-full flex-col gap-3 sm:w-auto">
                    <button className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]">
                      Upgrade Plan
                    </button>
                    <button className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent">
                      Manage Billing
                    </button>
                  </div>
                </div>

                {/* Usage */}
                <div className="mt-6 flex items-start gap-4 rounded-xl border border-border/50 bg-accent/50 p-5">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <span className="text-xs font-bold">i</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      Monthly AI Usage Limits
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        AI Processing Power
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        85% used
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full w-[85%] rounded-full bg-primary transition-all" />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Your limit resets in 12 days. If you reach 100%, the AI
                      receptionist will fall back to basic automated replies.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "profile" && (
            <div>
              <h2 className="text-2xl font-bold text-foreground">Personal Profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">Manage your account information and preferences.</p>

              <div className="mt-6 rounded-xl border border-border bg-card p-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      readOnly
                      defaultValue={profile?.email || ""}
                      className="w-full cursor-not-allowed rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground outline-none"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 border-t border-border pt-6">
                  <button 
                    onClick={() => setProfileData({ full_name: profile?.full_name || "" })}
                    className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-70 transition-all shadow-lg shadow-primary/20"
                  >
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isSaving ? "Saving..." : "Update Profile"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection !== "business" && activeSection !== "profile" && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <SettingsIcon className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Section Unavailable
              </h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                This settings section is either under construction or not
                available in the Early Access preview.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
