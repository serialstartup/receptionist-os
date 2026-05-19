import { createClient } from "@/lib/supabase/server"
import { ServicesClient } from "./services-client"

export default async function ServicesPage() {
  const supabase = await createClient()

  // Fetch all services belonging to the user's business
  const { data: services, error } = await supabase
    .from("services")
    .select("*")
    .order("created_at", { ascending: false })

  const { data: userData } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", userData.user?.id)
    .single()

  return <ServicesClient services={services || []} profile={profile} />
}
