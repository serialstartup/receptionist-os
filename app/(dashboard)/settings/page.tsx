import { createClient } from "@/lib/supabase/server"
import { SettingsClient } from "./settings-client"

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  let business = null
  let userProfile = null

  if (userData.user) {
    // Get the user profile
    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", userData.user.id)
      .single()

    userProfile = profile

    if (profile?.business_id) {
      // Get the business details
      const { data: b } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", profile.business_id)
        .single()
      business = b
    }
  }

  return <SettingsClient business={business} profile={userProfile} />
}
