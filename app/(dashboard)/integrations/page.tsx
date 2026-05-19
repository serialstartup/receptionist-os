import { createClient } from "@/lib/supabase/server"
import { IntegrationsClient } from "./integrations-client"

/**
 * Integrations Page (Server Component)
 * Fetches user profile and existing integration configs.
 */
export default async function IntegrationsPage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  
  let profile = null
  let integrations: any[] = []
  let businessId: string | null = null

  if (userData.user) {
    const { data } = await supabase
      .from("users")
      .select("*, businesses(id)")
      .eq("id", userData.user.id)
      .single()
    profile = data
    businessId = (data?.businesses as any)?.id || data?.business_id || null

    // Fetch existing integrations for this business
    if (businessId) {
      const { data: intData } = await supabase
        .from("business_integrations")
        .select("platform, wa_phone_number, ig_username, is_active, verified_at")
        .eq("business_id", businessId)

      integrations = intData || []
    }
  }

  return (
    <IntegrationsClient
      profile={profile}
      integrations={integrations}
      businessId={businessId}
    />
  )
}
