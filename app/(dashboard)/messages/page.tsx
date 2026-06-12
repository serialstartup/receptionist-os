import { createClient } from "@/lib/supabase/server"
import { MessagesClient } from "./messages-client"

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("users")
    .select("business_id, full_name, avatar_url")
    .eq("id", userData.user?.id)
    .single()

  const { data: conversations } = await supabase
    .from("conversations")
    .select(`
      id,
      platform,
      current_state,
      ai_enabled,
      last_message_at,
      customers(id, name, phone),
      messages(content, role, created_at)
    `)
    .eq("business_id", profile?.business_id)
    .order("last_message_at", { ascending: false })
    .order("created_at", { ascending: false, referencedTable: "messages" })
    .limit(1, { referencedTable: "messages" })

  return (
    <MessagesClient
      profile={profile}
      conversations={(conversations as any[]) ?? []}
    />
  )
}
