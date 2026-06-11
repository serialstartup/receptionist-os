import { config } from "dotenv"
import { createClient } from "@supabase/supabase-js"

config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const waPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!
const waAccessToken = process.env.WHATSAPP_ACCESS_TOKEN!

if (!supabaseUrl || !serviceRoleKey || !waPhoneNumberId || !waAccessToken) {
  console.error("Missing required env vars. Check .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function main() {
  // 1. Get the first business
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

  // 2. Upsert the WhatsApp integration (safe to run multiple times)
  const { data, error } = await supabase
    .from("business_integrations")
    .upsert(
      {
        business_id: business.id,
        platform: "whatsapp",
        wa_phone_number_id: waPhoneNumberId,
        wa_access_token: waAccessToken,
        is_active: true,
      },
      { onConflict: "business_id,platform" }
    )
    .select("id, platform, wa_phone_number_id, is_active")
    .single()

  if (error) {
    console.error("Failed to upsert integration:", error.message)
    process.exit(1)
  }

  console.log("✅ WhatsApp integration saved:")
  console.log(`   ID: ${data.id}`)
  console.log(`   Platform: ${data.platform}`)
  console.log(`   Phone Number ID: ${data.wa_phone_number_id}`)
  console.log(`   Active: ${data.is_active}`)
}

main()
