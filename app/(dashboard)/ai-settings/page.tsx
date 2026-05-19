import { createClient } from "@/lib/supabase/server"
import { AISettingsClient } from "./ai-settings-client"

export default async function AISettingsPage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", userData.user?.id)
    .single()

  return <AISettingsClient profile={profile} />
}
