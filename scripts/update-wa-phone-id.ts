import { config } from "dotenv"
import { createClient } from "@supabase/supabase-js"

config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const { data, error } = await supabase
  .from("business_integrations")
  .update({ wa_phone_number_id: "1134439073094626" })
  .eq("platform", "whatsapp")
  .select("id, wa_phone_number_id, is_active")
  .single()

if (error) {
  console.error("Error:", error.message)
  process.exit(1)
}

console.log("✅ Phone Number ID updated:", data)
