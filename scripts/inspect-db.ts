import { config } from "dotenv"
import { createClient } from "@supabase/supabase-js"

config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const { data: messages } = await supabase
  .from("messages")
  .select("id, role, content, platform_message_id, conversation_id, created_at, channel")
  .order("created_at", { ascending: false })
  .limit(5)

console.log("=== Son Mesajlar ===")
console.log(JSON.stringify(messages, null, 2))

const { data: convs } = await supabase
  .from("conversations")
  .select("id, platform, platform_conversation_id, status, ai_enabled, current_state, last_message_at, customer_id")
  .order("last_message_at", { ascending: false })
  .limit(5)

console.log("\n=== Conversations ===")
console.log(JSON.stringify(convs, null, 2))

const { data: customers } = await supabase
  .from("customers")
  .select("id, name, phone, created_at")
  .order("created_at", { ascending: false })
  .limit(3)

console.log("\n=== Son Customers ===")
console.log(JSON.stringify(customers, null, 2))
