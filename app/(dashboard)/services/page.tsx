import { createClient } from "@/lib/supabase/server"
import { ServicesClient } from "./services-client"

export default async function ServicesPage() {
  const supabase = await createClient()

  // Fetch all services belonging to the user's business
  const { data: services, error } = await supabase
    .from("services")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching services:", error)
  }

  return <ServicesClient services={services || []} />
}
