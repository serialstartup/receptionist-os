import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

/**
 * GET /api/integrations/instagram/callback
 * Handles the Facebook OAuth callback after the user authorizes the app.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state") // Contains business_id
  const error = searchParams.get("error")

  if (error) {
    console.error("Instagram OAuth Error:", error)
    return NextResponse.redirect(new URL("/integrations?ig_error=denied", request.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/integrations?ig_error=missing_params", request.url))
  }

  try {
    const appId = process.env.FACEBOOK_APP_ID
    const appSecret = process.env.META_APP_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/integrations/instagram/callback`

    // 1. Exchange code for short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    )
    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      console.error("Token exchange error:", tokenData.error)
      return NextResponse.redirect(new URL("/integrations?ig_error=token_exchange", request.url))
    }

    const shortLivedToken = tokenData.access_token

    // 2. Exchange for long-lived token
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
    )
    const longTokenData = await longTokenRes.json()
    const longLivedToken = longTokenData.access_token || shortLivedToken

    // 3. Get user's pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${longLivedToken}`
    )
    const pagesData = await pagesRes.json()
    const page = pagesData.data?.[0] // Take the first page for MVP

    if (!page) {
      return NextResponse.redirect(new URL("/integrations?ig_error=no_page", request.url))
    }

    // 4. Get Instagram Business Account linked to the page
    const igRes = await fetch(
      `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
    )
    const igData = await igRes.json()
    const igAccountId = igData.instagram_business_account?.id

    if (!igAccountId) {
      return NextResponse.redirect(new URL("/integrations?ig_error=no_ig_account", request.url))
    }

    // 5. Get Instagram username
    const igProfileRes = await fetch(
      `https://graph.facebook.com/v21.0/${igAccountId}?fields=username&access_token=${page.access_token}`
    )
    const igProfileData = await igProfileRes.json()

    // 6. Save to database
    const adminSupabase = createAdminClient()
    const { error: upsertError } = await adminSupabase
      .from("business_integrations")
      .upsert(
        {
          business_id: state, // business_id passed via OAuth state parameter
          platform: "instagram",
          ig_user_id: igAccountId,
          ig_page_id: page.id,
          ig_access_token: page.access_token,
          ig_username: igProfileData.username || null,
          is_active: true,
          verified_at: new Date().toISOString(),
        },
        { onConflict: "business_id,platform" }
      )

    if (upsertError) {
      console.error("Instagram save error:", upsertError)
      return NextResponse.redirect(new URL("/integrations?ig_error=db_error", request.url))
    }

    return NextResponse.redirect(new URL("/integrations?ig_success=true", request.url))
  } catch (err) {
    console.error("Instagram Callback Error:", err)
    return NextResponse.redirect(new URL("/integrations?ig_error=unknown", request.url))
  }
}
