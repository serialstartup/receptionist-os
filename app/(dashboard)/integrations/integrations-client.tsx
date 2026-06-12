"use client"

import { useState } from "react"
import { TopBar } from "@/components/dashboard/top-bar"
import { cn } from "@/lib/utils"
import {
  MessageCircle,
  Instagram,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Link as LinkIcon,
  Bot,
} from "lucide-react"
import { toast } from "sonner"

interface Integration {
  platform: string
  wa_phone_number?: string | null
  ig_username?: string | null
  is_active: boolean
  verified_at?: string | null
}

interface IntegrationsClientProps {
  profile: any
  integrations: Integration[]
  businessId: string | null
}

export function IntegrationsClient({ profile, integrations, businessId }: IntegrationsClientProps) {
  const waIntegration = integrations.find((i) => i.platform === "whatsapp")
  const igIntegration = integrations.find((i) => i.platform === "instagram")

  const [waState, setWaState] = useState<"disconnected" | "verifying" | "connected">(
    waIntegration?.is_active && waIntegration?.verified_at ? "connected" : "disconnected"
  )
  const [igState, setIgState] = useState<"disconnected" | "connected">(
    igIntegration?.is_active && igIntegration?.verified_at ? "connected" : "disconnected"
  )
  const [aiEnabled, setAiEnabled] = useState<boolean>(profile?.ai_enabled ?? true)
  const [togglingAI, setTogglingAI] = useState(false)

  const [phoneNumber, setPhoneNumber] = useState(waIntegration?.wa_phone_number || "")
  const [verificationCode, setVerificationCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleToggleAI = async () => {
    setTogglingAI(true)
    const next = !aiEnabled
    try {
      const { toggleBusinessAI } = await import("@/app/(dashboard)/actions")
      await toggleBusinessAI(next)
      setAiEnabled(next)
      toast.success(next ? "AI receptionist enabled." : "AI receptionist paused.")
    } catch {
      toast.error("Failed to update AI setting.")
    } finally {
      setTogglingAI(false)
    }
  }

  const handleConnectWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/integrations/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phoneNumber }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to send code")
        return
      }

      setWaState("verifying")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/integrations/whatsapp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verificationCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Verification failed")
        return
      }

      setWaState("connected")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleConnectInstagram = () => {
    if (!businessId) {
      setError("Business not found")
      return
    }

    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
    const redirectUri = `${window.location.origin}/api/integrations/instagram/callback`
    const scope = "instagram_manage_messages,pages_messaging,pages_show_list"

    const oauthUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${businessId}&scope=${scope}&response_type=code`

    window.location.href = oauthUrl
  }

  return (
    <div>
      <TopBar
        title="Connections & Integrations"
        subtitle="Manage your social media channels and AI receptionist settings."
        searchPlaceholder="Search integrations..."
        profile={profile}
      />

      <div className="p-6">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-xs underline">Dismiss</button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* WhatsApp Card */}
          <div className={cn(
            "relative overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-300",
            waState === "connected" ? "border-green-500/30 bg-green-500/5" : "border-border shadow-sm"
          )}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#25D366]">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">WhatsApp Business</h3>
                  <p className="text-sm text-muted-foreground">Automate bookings via WhatsApp</p>
                </div>
              </div>
              <div className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                waState === "connected" ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
              )}>
                {waState === "connected" ? "Connected" : waState === "verifying" ? "Verifying..." : "Not Connected"}
              </div>
            </div>

            <div className="mt-8">
              {waState === "disconnected" && (
                <form onSubmit={handleConnectWhatsApp} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Business Phone Number</label>
                    <div className="mt-1.5 flex gap-2">
                      <input
                        type="tel"
                        placeholder="90XXXXXXXXXX"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                        required
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Connect"}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">We'll send a verification code to this number via WhatsApp.</p>
                  </div>
                </form>
              )}

              {waState === "verifying" && (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Verification Code</label>
                    <div className="mt-1.5 flex gap-2">
                      <input
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none text-center tracking-[0.5em] font-bold"
                        required
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                      </button>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-amber-500">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>
                        Waiting for code...{" "}
                        <button
                          type="button"
                          onClick={() => { setWaState("disconnected"); setVerificationCode("") }}
                          className="underline"
                        >
                          Resend
                        </button>
                      </span>
                    </div>
                  </div>
                </form>
              )}

              {waState === "connected" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 rounded-lg bg-green-500/10 p-4 text-sm text-green-600 dark:text-green-500">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <p>AI Receptionist is active for <strong>{phoneNumber}</strong></p>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Automatic Responses</p>
                      <p className="text-xs text-muted-foreground">AI will handle all incoming inquiries</p>
                    </div>
                    <button
                      onClick={handleToggleAI}
                      disabled={togglingAI}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-50",
                        aiEnabled ? "bg-primary" : "bg-muted"
                      )}
                    >
                      <span className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition-transform",
                        aiEnabled ? "translate-x-5" : "translate-x-0.5"
                      )} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instagram Card */}
          <div className={cn(
            "relative overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-300",
            igState === "connected" ? "border-pink-500/30 bg-pink-500/5" : "border-border shadow-sm"
          )}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white">
                  <Instagram className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Instagram Direct</h3>
                  <p className="text-sm text-muted-foreground">AI responses for DMs & Stories</p>
                </div>
              </div>
              <div className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                igState === "connected" ? "bg-pink-500/10 text-pink-500" : "bg-muted text-muted-foreground"
              )}>
                {igState === "connected" ? "Connected" : "Not Connected"}
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center py-6 text-center">
              {igState === "disconnected" ? (
                <>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <LinkIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h4 className="text-sm font-semibold">Connect Instagram Account</h4>
                  <p className="mt-2 mb-6 max-w-[280px] text-xs text-muted-foreground">
                    Connect your Instagram Professional account via Facebook to enable AI responses.
                  </p>
                  <button
                    onClick={handleConnectInstagram}
                    className="flex w-full max-w-[240px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#ee2a7b] to-[#6228d7] px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Connect with Facebook
                  </button>
                </>
              ) : (
                <div className="w-full space-y-6">
                  <div className="flex items-center gap-3 rounded-lg bg-pink-500/10 p-4 text-sm text-pink-600 dark:text-pink-500 text-left">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <p>Instagram DM Automation is active for <strong>@{igIntegration?.ig_username || "your_account"}</strong></p>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-4 text-left">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">DM & Story Replies</p>
                      <p className="text-xs text-muted-foreground">Automated replies to direct messages</p>
                    </div>
                    <button
                      onClick={handleToggleAI}
                      disabled={togglingAI}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-50",
                        aiEnabled ? "bg-primary" : "bg-muted"
                      )}
                    >
                      <span className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition-transform",
                        aiEnabled ? "translate-x-5" : "translate-x-0.5"
                      )} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-accent/30 p-8">
          <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bot className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold">How Social AI Works</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Once connected, BeautyAI monitors your incoming messages. If a user asks about services, pricing, or availability, 
              our AI receptionist will respond instantly and attempt to book an appointment directly into your calendar.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                24/7 Automated Replies
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Real-time Calendar Sync
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                No-hallucination Policy
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
