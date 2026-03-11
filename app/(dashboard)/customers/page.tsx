import { createClient } from "@/lib/supabase/server"
import { CustomersClient } from "./customers-client"

export default async function CustomersPage() {
  const supabase = await createClient()

  const { data: customers, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching customers:", error)
  }

  return <CustomersClient customers={customers || []} />
}
