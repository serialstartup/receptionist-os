import { config } from "dotenv"
import { createClient } from "@supabase/supabase-js"

config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const BELLA_BEAUTY_ID = "3c6ab215-f052-4206-bf06-06a7e04f27c3"

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing required env vars in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function main() {
  const { data: conversations, error: convErr } = await supabase
    .from("conversations")
    .select("id, platform, platform_conversation_id, customer_id, created_at, updated_at")
    .eq("business_id", BELLA_BEAUTY_ID)
    .eq("platform", "voice")
    .order("created_at", { ascending: false })
    .limit(5)

  console.log("--- voice conversations (Bella Beauty) ---")
  console.log(convErr ? convErr.message : JSON.stringify(conversations, null, 2))

  const { data: appointments, error: apptErr } = await supabase
    .from("appointments")
    .select("id, service_id, staff_id, start_time, end_time, status, source, customer_id, created_at")
    .eq("business_id", BELLA_BEAUTY_ID)
    .order("created_at", { ascending: false })
    .limit(5)

  console.log("--- recent appointments (Bella Beauty) ---")
  console.log(apptErr ? apptErr.message : JSON.stringify(appointments, null, 2))

  const { data: customers, error: custErr } = await supabase
    .from("customers")
    .select("id, name, phone, created_at")
    .eq("business_id", BELLA_BEAUTY_ID)
    .order("created_at", { ascending: false })
    .limit(5)

  console.log("--- recent customers (Bella Beauty) ---")
  console.log(custErr ? custErr.message : JSON.stringify(customers, null, 2))
}

main()
