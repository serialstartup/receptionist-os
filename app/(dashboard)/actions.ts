"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createService(formData: {
  name: string
  category: string
  price: number
  duration_minutes: number
  description: string
}) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) throw new Error("Unauthorized")

  // Get business_id from user profile
  const { data: profile } = await supabase
    .from("users")
    .select("business_id")
    .eq("id", userData.user.id)
    .single()

  if (!profile?.business_id) throw new Error("Business not found")

  const { error } = await supabase.from("services").insert({
    ...formData,
    business_id: profile.business_id,
    is_active: true,
  })

  if (error) throw error

  revalidatePath("/services")
  return { success: true }
}

export async function createCampaign(formData: {
  name: string
  type: string
  status: string
  discount_value?: number
  rules?: any
}) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from("users")
    .select("business_id")
    .eq("id", userData.user.id)
    .single()

  if (!profile?.business_id) throw new Error("Business not found")

  // The current campaigns table is missing several columns. 
  // We will insert only what's available in the base schema for now, 
  // but we should encourage the user to update the schema.
  const { error } = await supabase.from("campaigns").insert({
    business_id: profile.business_id,
    name: formData.name,
    status: formData.status,
    // Note: message, type, discount_value, rules, sent_count, conversion_count 
    // are currently MISSING in the user's Supabase schema cache.
  })

  if (error) throw error

  revalidatePath("/campaigns")
  return { success: true }
}

export async function createAppointment(formData: {
  customer_id: string
  service_id: string
  start_time: string
  notes?: string
}) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from("users")
    .select("business_id")
    .eq("id", userData.user.id)
    .single()

  if (!profile?.business_id) throw new Error("Business not found")

  // Fetch service duration to calculate end_time
  const { data: service } = await supabase
    .from("services")
    .select("duration_minutes")
    .eq("id", formData.service_id)
    .single()

  if (!service) throw new Error("Service not found")

  const startTime = new Date(formData.start_time)
  const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000)

  const { error } = await supabase.from("appointments").insert({
    business_id: profile.business_id,
    customer_id: formData.customer_id,
    service_id: formData.service_id,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    status: "scheduled",
    source: "dashboard",
    notes: formData.notes,
  })

  if (error) throw error

  revalidatePath("/appointments")
  revalidatePath("/dashboard")
  revalidatePath("/calendar")
  
  return { success: true }
}

export async function createCustomer(formData: {
  name: string
  phone: string
  email?: string
  age?: number
  notes?: string
}) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from("users")
    .select("business_id")
    .eq("id", userData.user.id)
    .single()

  if (!profile?.business_id) throw new Error("Business not found")

  const { error } = await supabase.from("customers").insert({
    business_id: profile.business_id,
    name: formData.name,
    phone: formData.phone,
    email: formData.email,
    age: formData.age,
    notes: formData.notes,
    tags: ["NEW"], // Default tag for new customers
    visit_count: 0
  })

  if (error) throw error

  revalidatePath("/customers")
  return { success: true }
}

export async function updateService(id: string, formData: {
  name: string
  category: string
  price: number
  duration_minutes: number
  description: string
}) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("services")
    .update(formData)
    .eq("id", id)

  if (error) throw error

  revalidatePath("/services")
  return { success: true }
}

export async function deleteService(id: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)

  if (error) throw error

  revalidatePath("/services")
  return { success: true }
}

export async function updateAppointment(id: string, formData: {
  status: string
  notes?: string
}) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from("users")
    .select("business_id")
    .eq("id", userData.user.id)
    .single()
  if (!profile?.business_id) throw new Error("Business not found")

  const { error } = await supabase
    .from("appointments")
    .update(formData)
    .eq("id", id)
    .eq("business_id", profile.business_id)

  if (error) throw error

  revalidatePath("/appointments")
  revalidatePath("/calendar")
  return { success: true }
}

export async function deleteAppointment(id: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from("users")
    .select("business_id")
    .eq("id", userData.user.id)
    .single()
  if (!profile?.business_id) throw new Error("Business not found")

  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("business_id", profile.business_id)

  if (error) throw error

  revalidatePath("/appointments")
  revalidatePath("/calendar")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function updateCustomer(id: string, formData: {
  name: string
  phone: string
  email?: string
  age?: number
  notes?: string
}) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from("users")
    .select("business_id")
    .eq("id", userData.user.id)
    .single()
  if (!profile?.business_id) throw new Error("Business not found")

  const { error } = await supabase
    .from("customers")
    .update(formData)
    .eq("id", id)
    .eq("business_id", profile.business_id)

  if (error) throw error

  revalidatePath("/customers")
  return { success: true }
}

export async function deleteCustomer(id: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from("users")
    .select("business_id")
    .eq("id", userData.user.id)
    .single()
  if (!profile?.business_id) throw new Error("Business not found")

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id)
    .eq("business_id", profile.business_id)

  if (error) throw error

  revalidatePath("/customers")
  return { success: true }
}

export async function updateCampaign(id: string, formData: {
  status: string
}) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from("users")
    .select("business_id")
    .eq("id", userData.user.id)
    .single()
  if (!profile?.business_id) throw new Error("Business not found")

  const { error } = await supabase
    .from("campaigns")
    .update(formData)
    .eq("id", id)
    .eq("business_id", profile.business_id)

  if (error) throw error

  revalidatePath("/campaigns")
  return { success: true }
}

export async function deleteCampaign(id: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from("users")
    .select("business_id")
    .eq("id", userData.user.id)
    .single()
  if (!profile?.business_id) throw new Error("Business not found")

  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", id)
    .eq("business_id", profile.business_id)

  if (error) throw error

  revalidatePath("/campaigns")
  return { success: true }
}

export async function updateBusiness(id: string, formData: {
  name: string
  timezone?: string
  working_hours_start?: string
  working_hours_end?: string
  working_days?: number[]
}) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("businesses")
    .update(formData)
    .eq("id", id)

  if (error) throw error

  revalidatePath("/settings")
  return { success: true }
}

export async function executeCampaign(campaignId: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from("users")
    .select("business_id")
    .eq("id", userData.user.id)
    .single()
  if (!profile?.business_id) throw new Error("Business not found")

  // Verify campaign belongs to this business
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, name, discount_value, status")
    .eq("id", campaignId)
    .eq("business_id", profile.business_id)
    .single()
  if (!campaign) throw new Error("Campaign not found")

  // Get customers with WhatsApp phones
  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, phone")
    .eq("business_id", profile.business_id)
    .not("phone", "is", null)

  if (!customers || customers.length === 0) return { sent: 0 }

  const message = campaign.discount_value
    ? `Hi! ${campaign.name} — Get ${campaign.discount_value}% off your next visit. Reply to book your appointment now!`
    : `Hi! ${campaign.name} — Reply to book your next appointment!`

  const { whatsapp } = await import("@/lib/whatsapp/client")

  let sent = 0
  for (const customer of customers) {
    if (!customer.phone) continue
    const result = await whatsapp.sendMessage(customer.phone, message)
    if (result) {
      sent++
      await supabase.from("campaign_recipients").upsert({
        campaign_id: campaignId,
        customer_id: customer.id,
        sent_at: new Date().toISOString(),
        status: "sent",
      }, { onConflict: "campaign_id,customer_id" })
    }
  }

  // Update sent_count
  await supabase
    .from("campaigns")
    .update({ sent_count: sent, status: "ACTIVE" })
    .eq("id", campaignId)

  revalidatePath("/campaigns")
  return { sent }
}

export async function getConversationMessages(conversationId: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error("Unauthorized")

  const { data } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  return data ?? []
}

export async function toggleAITakeover(conversationId: string, aiEnabled: boolean) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("conversations")
    .update({ ai_enabled: aiEnabled })
    .eq("id", conversationId)

  if (error) throw error

  revalidatePath("/messages")
  return { success: true }
}

export async function updateAISettings(formData: {
  ai_instructions: string
  ai_tone: string
  ai_language: string
  ai_emoji_enabled: boolean
  ai_enabled: boolean
}) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) throw new Error("Unauthorized")

  const { data: profile } = await supabase
    .from("users")
    .select("business_id")
    .eq("id", userData.user.id)
    .single()

  if (!profile?.business_id) throw new Error("Business not found")

  const { error } = await supabase
    .from("businesses")
    .update(formData)
    .eq("id", profile.business_id)

  if (error) throw error

  revalidatePath("/ai-settings")
  return { success: true }
}

export async function updateProfile(formData: {
  full_name: string
}) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("users")
    .update({ full_name: formData.full_name })
    .eq("id", userData.user.id)

  if (error) throw error

  revalidatePath("/")
  revalidatePath("/settings")
  revalidatePath("/dashboard")
  return { success: true }
}
