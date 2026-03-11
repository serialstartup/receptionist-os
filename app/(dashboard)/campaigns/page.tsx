import { createClient } from "@/lib/supabase/server"
import { CampaignsClient } from "./campaigns-client"

export default async function CampaignsPage() {
  const supabase = await createClient()

  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching campaigns:", error)
  }

  return <CampaignsClient campaigns={campaigns || []} />
}
