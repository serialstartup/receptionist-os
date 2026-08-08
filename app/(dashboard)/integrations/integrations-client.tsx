"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { TopBar } from "@/components/dashboard/top-bar"
import { WhatsAppConnectWizard } from "@/components/dashboard/whatsapp-connect-wizard"
import { cn } from "@/lib/utils"
import {
  MessageCircle,
  Instagram,
  CheckCircle2,
  Link as LinkIcon,
  Bot,
} from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/lib/i18n"

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
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const router = useRouter()
  const waIntegration = integrations.find((i) => i.platform === "whatsapp")
  const igIntegration = integrations.find((i) => i.platform === "instagram")

  const [waConnected, setWaConnected] = useState(
    !!(waIntegration?.is_active && waIntegration?.verified_at)
  )
  const [waPhone, setWaPhone] = useState(waIntegration?.wa_phone_number || "")
  const [showWizard, setShowWizard] = useState(false)

  const [igState, setIgState] = useState<"disconnected" | "connected">(
    igIntegration?.is_active && igIntegration?.verified_at ? "connected" : "disconnected"
  )
  const [aiEnabled, setAiEnabled] = useState<boolean>(profile?.ai_enabled ?? true)
  const [togglingAI, setTogglingAI] = useState(false)

  useEffect(() => {
    const igSuccess = searchParams.get("ig_success")
    const igError = searchParams.get("ig_error")
    if (!igSuccess && !igError) return

    if (igSuccess === "true") {
      toast.success(t("integrations.instagramConnected"))
    } else if (igError) {
      const messages: Record<string, string> = {
        denied: t("integrations.igErrorDenied"),
        no_page: t("integrations.igErrorNoPage"),
        no_ig_account: t("integrations.igErrorNoAccount"),
        token_exchange: t("integrations.igErrorToken"),
        db_error: t("integrations.igErrorDB"),
      }
      toast.error(messages[igError] || t("integrations.igErrorUnknown"))
    }

    // Clean up query params from URL without triggering a navigation
    const url = new URL(window.location.href)
    url.searchParams.delete("ig_success")
    url.searchParams.delete("ig_error")
    router.replace(url.pathname + (url.search || ""))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleToggleAI = async () => {
    setTogglingAI(true)
    const next = !aiEnabled
    try {
      const { toggleBusinessAI } = await import("@/app/(dashboard)/actions")
      await toggleBusinessAI(next)
      setAiEnabled(next)
      toast.success(next ? t("integrations.aiEnabled") : t("integrations.aiDisabled"))
    } catch {
      toast.error(t("integrations.failedToggleAI"))
    } finally {
      setTogglingAI(false)
    }
  }

  const handleWizardSuccess = (displayPhone: string) => {
    setWaPhone(displayPhone)
    setWaConnected(true)
    toast.success(t("integrations.whatsappConnected"))
  }

  const handleConnectInstagram = () => {
    if (!businessId) return
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
    const redirectUri = `${window.location.origin}/api/integrations/instagram/callback`
    const scope =
      "instagram_basic,instagram_manage_messages,pages_show_list,pages_read_engagement,business_management"
    const oauthUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${businessId}&scope=${scope}&response_type=code`
    window.location.href = oauthUrl
  }

  return (
    <div>
      {showWizard && (
        <WhatsAppConnectWizard
          onClose={() => setShowWizard(false)}
          onSuccess={handleWizardSuccess}
        />
      )}

      <TopBar
        title={t("integrations.title")}
        subtitle={t("integrations.subtitle")}
        profile={profile}
      />

      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* WhatsApp Card */}
          <div className={cn(
            "relative overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-300",
            waConnected ? "border-green-500/30 bg-green-500/5" : "border-border shadow-sm"
          )}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#25D366]">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{t("integrations.whatsappBusiness")}</h3>
                  <p className="text-sm text-muted-foreground">{t("integrations.whatsappDesc")}</p>
                </div>
              </div>
              <div className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                waConnected ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
              )}>
                {waConnected ? t("common.connected") : t("common.notConnected")}
              </div>
            </div>

            <div className="mt-8">
              {!waConnected ? (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <MessageCircle className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h4 className="text-sm font-semibold">{t("integrations.connectWhatsAppBusiness")}</h4>
                  <p className="mt-2 mb-6 max-w-[280px] text-xs text-muted-foreground">
                    {t("integrations.connectWhatsAppDesc")}
                  </p>
                  <button
                    onClick={() => setShowWizard(true)}
                    className="flex w-full max-w-[240px] items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#25D366]/90 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {t("integrations.connectWhatsApp")}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 rounded-lg bg-green-500/10 p-4 text-sm text-green-600 dark:text-green-500">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <p>{t("integrations.aiIsActiveFor")} <strong>{waPhone}</strong></p>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{t("integrations.automaticResponses")}</p>
                      <p className="text-xs text-muted-foreground">{t("integrations.automaticDesc")}</p>
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

                  <div className="border-t border-border pt-4">
                    <button
                      onClick={() => setShowWizard(true)}
                      className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    >
                      {t("integrations.updateCredentials")}
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
                  <h3 className="text-lg font-bold">{t("integrations.instagramDirect")}</h3>
                  <p className="text-sm text-muted-foreground">{t("integrations.instagramDesc")}</p>
                </div>
              </div>
              <div className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                igState === "connected" ? "bg-pink-500/10 text-pink-500" : "bg-muted text-muted-foreground"
              )}>
                {igState === "connected" ? t("common.connected") : t("common.notConnected")}
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center py-6 text-center">
              {igState === "disconnected" ? (
                <>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <LinkIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h4 className="text-sm font-semibold">{t("integrations.connectInstagramAccount")}</h4>
                  <p className="mt-2 mb-6 max-w-[280px] text-xs text-muted-foreground">
                    {t("integrations.connectInstagramDesc")}
                  </p>
                  <button
                    onClick={handleConnectInstagram}
                    className="flex w-full max-w-[240px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#ee2a7b] to-[#6228d7] px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {t("integrations.connectWithFacebook")}
                  </button>
                </>
              ) : (
                <div className="w-full space-y-6">
                  <div className="flex items-center gap-3 rounded-lg bg-pink-500/10 p-4 text-sm text-pink-600 dark:text-pink-500 text-left">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <p>{t("integrations.instagramDmActive")} <strong>@{igIntegration?.ig_username || "your_account"}</strong></p>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-4 text-left">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{t("integrations.dmStoryReplies")}</p>
                      <p className="text-xs text-muted-foreground">{t("integrations.dmStoryDesc")}</p>
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
            <h3 className="text-lg font-bold">{t("integrations.howItWorks")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("integrations.howItWorksDesc")}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {t("integrations.automatedReplies")}
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {t("integrations.realtimeSync")}
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {t("integrations.noHallucination")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
