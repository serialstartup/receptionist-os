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
