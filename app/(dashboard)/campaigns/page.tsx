import { createClient } from "@/lib/supabase/server"
import { CampaignsClient } from "./campaigns-client"

export default async function CampaignsPage() {
  const supabase = await createClient()

  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false })

  const { data: userData } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", userData.user?.id)
    .single()

  return <CampaignsClient campaigns={campaigns || []} profile={profile} />
}
