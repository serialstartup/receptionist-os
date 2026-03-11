"use server"

import { createAdminClient, createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get("email") as string).trim()
  const password = formData.get("password") as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect("/dashboard")
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const fullName = (formData.get("fullName") as string).trim()
  const businessName = (formData.get("businessName") as string).trim()
  const email = (formData.get("email") as string).trim()
  const password = formData.get("password") as string

  // 1. Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (authError) {
    return { error: authError.message }
  }

  // Even if email confirmation is turned on, authData.user will exist.
  if (authData?.user) {
    try {
      const adminSupabase = createAdminClient()
      
      // 2. Create business
      const { data: business, error: bizError } = await adminSupabase
        .from("businesses")
        .insert({ name: businessName })
        .select()
        .single()

      if (bizError) {
        throw new Error(`Business creation failed: ${bizError.message}`)
      }

      // 3. Create user profile linked to business
      const { error: profileError } = await adminSupabase.from("users").insert({
        id: authData.user.id,
        business_id: business.id,
        full_name: fullName,
        role: "admin",
      })

      if (profileError) {
        throw new Error(`Profile creation failed: ${profileError.message}`)
      }
    } catch (err: any) {
      // In a real production app, we might want to clean up the Auth user if business creation fails,
      // but for now, we catch the error to display it.
      return { error: err.message || "Failed to finalize account setup." }
    }
  }

  redirect("/dashboard")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function signInWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}
