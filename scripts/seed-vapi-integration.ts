import { config } from "dotenv"
import { createClient } from "@supabase/supabase-js"

config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const vapiAssistantId = process.env.VAPI_ASSISTANT_ID!

if (!supabaseUrl || !serviceRoleKey || !vapiAssistantId) {
  console.error("Missing required env vars. Check .env.local / VAPI_ASSISTANT_ID")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function main() {
  const { data: business, error: bizErr } = await supabase
    .from("businesses")
    .select("id, name")
    .limit(1)
    .single()

  if (bizErr || !business) {
    console.error("Could not find a business:", bizErr?.message)
    process.exit(1)
  }

  console.log(`Found business: ${business.name} (${business.id})`)

  const { data, error } = await supabase
    .from("business_integrations")
    .upsert(
      {
        business_id: business.id,
        platform: "voice",
        vapi_assistant_id: vapiAssistantId,
        is_active: true,
      },
      { onConflict: "business_id,platform" }
    )
    .select("id, platform, vapi_assistant_id, is_active")
    .single()

  if (error) {
    console.error("Failed to upsert integration:", error.message)
    process.exit(1)
  }

  console.log("✅ Vapi voice integration saved:")
  console.log(`   ID: ${data.id}`)
  console.log(`   Platform: ${data.platform}`)
  console.log(`   Assistant ID: ${data.vapi_assistant_id}`)
  console.log(`   Active: ${data.is_active}`)
}

main()
