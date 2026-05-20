import { createClient } from "@/lib/supabase/server"
import { AISettingsClient } from "./ai-settings-client"

export default async function AISettingsPage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("users")
    .select("*, businesses(*)")
    .eq("id", userData.user?.id)
    .single()

  const business = (profile as any)?.businesses ?? null

  return <AISettingsClient profile={profile} business={business} />
}
