/**
 * E2E test seed script.
 * Creates a test user + business + seed data in Supabase.
 * Run once before running tests: pnpm tsx e2e/seed.ts
 *
 * Requires .env.local with SUPABASE_SERVICE_ROLE_KEY set.
 */

import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import * as path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const TEST_EMAIL = process.env.TEST_USER_EMAIL || "e2e-test@resepsionist.dev"
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "E2eTestPass123!"

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function seed() {
  console.log("🌱 Starting E2E seed...")

  // 1. Create or find test auth user
  let userId: string
  const { data: existing } = await admin.auth.admin.listUsers()
  const existingUser = existing?.users.find((u) => u.email === TEST_EMAIL)

  if (existingUser) {
    userId = existingUser.id
    console.log(`✓ Auth user already exists: ${TEST_EMAIL} (${userId})`)
  } else {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    if (error) throw new Error(`Auth user create failed: ${error.message}`)
    userId = created.user.id
    console.log(`✓ Auth user created: ${TEST_EMAIL} (${userId})`)
  }

  // 2. Create or find test business
  let businessId: string
  const { data: existingBusiness } = await admin
    .from("businesses")
    .select("id")
    .eq("name", "E2E Test Business")
    .single()

  if (existingBusiness) {
    businessId = existingBusiness.id
    console.log(`✓ Business already exists (${businessId})`)
  } else {
    const { data: biz, error } = await admin
      .from("businesses")
      .insert({
        name: "E2E Test Business",
        timezone: "Europe/Istanbul",
        working_hours_start: "09:00",
        working_hours_end: "18:00",
        working_days: [1, 2, 3, 4, 5, 6],
      })
      .select("id")
      .single()
    if (error) throw new Error(`Business create failed: ${error.message}`)
    businessId = biz.id
    console.log(`✓ Business created (${businessId})`)
  }

  // 3. Create or find user profile
  const { data: existingProfile } = await admin
    .from("users")
    .select("id")
    .eq("id", userId)
    .single()

  if (!existingProfile) {
    const { error } = await admin.from("users").insert({
      id: userId,
      business_id: businessId,
      full_name: "E2E Tester",
      role: "admin",
    })
    if (error) throw new Error(`User profile create failed: ${error.message}`)
    console.log("✓ User profile created")
  } else {
    // Ensure business_id is correct
    await admin.from("users").update({ business_id: businessId }).eq("id", userId)
    console.log("✓ User profile already exists")
  }

  // 4. Create test customer
  let customerId: string
  const { data: existingCustomer } = await admin
    .from("customers")
    .select("id")
    .eq("business_id", businessId)
    .eq("name", "E2E Test Customer")
    .single()

  if (existingCustomer) {
    customerId = existingCustomer.id
    console.log(`✓ Customer already exists (${customerId})`)
  } else {
    const { data: customer, error } = await admin
      .from("customers")
      .insert({
        business_id: businessId,
        name: "E2E Test Customer",
        phone: "+905550000001",
        email: "customer@e2etest.dev",
      })
      .select("id")
      .single()
    if (error) throw new Error(`Customer create failed: ${error.message}`)
    customerId = customer.id
    console.log(`✓ Customer created (${customerId})`)
  }

  // 5. Create test service
  let serviceId: string
  const { data: existingService } = await admin
    .from("services")
    .select("id")
    .eq("business_id", businessId)
    .eq("name", "E2E Test Service")
    .single()

  if (existingService) {
    serviceId = existingService.id
    console.log(`✓ Service already exists (${serviceId})`)
  } else {
    const { data: service, error } = await admin
      .from("services")
      .insert({
        business_id: businessId,
        name: "E2E Test Service",
        duration_minutes: 60,
        price: 100,
      })
      .select("id")
      .single()
    if (error) throw new Error(`Service create failed: ${error.message}`)
    serviceId = service.id
    console.log(`✓ Service created (${serviceId})`)
  }

  // 6. Create a scheduled appointment (for status update test)
  // Use today 2 hours ago so it appears in all time filters (today/week/month are all past-inclusive)
  const startTime = new Date()
  startTime.setHours(startTime.getHours() - 2, 0, 0, 0)
  const endTime = new Date(startTime.getTime() + 60 * 60000)

  // Always delete + recreate to ensure correct date (idempotent)
  await admin
    .from("appointments")
    .delete()
    .eq("business_id", businessId)
    .eq("status", "scheduled")

  const { error: apptError } = await admin.from("appointments").insert({
    business_id: businessId,
    customer_id: customerId,
    service_id: serviceId,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    status: "scheduled",
    source: "dashboard",
  })
  if (apptError) throw new Error(`Appointment create failed: ${apptError.message}`)
  console.log("✓ Scheduled appointment created (today, 2h ago)")

  console.log("\n✅ Seed complete!")
  console.log(`\nAdd to .env.test.local:`)
  console.log(`TEST_USER_EMAIL=${TEST_EMAIL}`)
  console.log(`TEST_USER_PASSWORD=${TEST_PASSWORD}`)
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message)
  process.exit(1)
})
