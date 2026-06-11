import { config } from "dotenv"
import { createClient } from "@supabase/supabase-js"

config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Check key tables and columns
const checks = [
  supabase.from("conversations").select("id").limit(1),
  supabase.from("messages").select("platform_message_id, conversation_id").limit(1),
  supabase.from("business_integrations").select("wa_phone_number_id").limit(1),
]

const names = ["conversations table", "messages.platform_message_id + conversation_id", "business_integrations.wa_phone_number_id"]

const results = await Promise.allSettled(checks)

results.forEach((result, i) => {
  if (result.status === "fulfilled") {
    const { error } = result.value
    if (error) {
      console.log(`❌ ${names[i]}: ${error.message}`)
    } else {
      console.log(`✅ ${names[i]}: OK`)
    }
  }
})
