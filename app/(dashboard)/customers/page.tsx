import { createClient } from "@/lib/supabase/server"
import { CustomersClient } from "./customers-client"

export default async function CustomersPage() {
  const supabase = await createClient()

  const { data: customers, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false })

  const { data: userData } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", userData.user?.id)
    .single()

  return <CustomersClient customers={customers || []} profile={profile} />
}
