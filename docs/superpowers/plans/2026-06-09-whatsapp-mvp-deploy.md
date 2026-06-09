# WhatsApp MVP Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all P0 code gaps blocking the WhatsApp pilot, resolve the Vercel build failure, and deploy to production so Meta can call the webhook.

**Architecture:** Six sequential fixes applied directly to existing files (no new abstractions), followed by Vercel env var setup and a production deploy. The AI agent is triggered from the webhook using Next.js `after()` so Meta receives 200 OK immediately while AI processing runs in the background.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase (admin client), OpenAI, WhatsApp Business Cloud API, Vercel, pnpm 10.

---

## File Map

| File | Change |
|---|---|
| `app/api/webhooks/whatsapp/route.ts` | Import + call `processConversationMessage` via `after()` |
| `lib/whatsapp/client.ts` | Add optional `credentials` param to `sendMessage` |
| `lib/ai/agent.ts` | Fetch tenant credentials and pass to `sendMessage` |
| `app/(dashboard)/messages/page.tsx` | `updated_at` → `last_message_at` |
| `.env.example` | Sync env var names with code |
| `package.json` | Add `pnpm.onlyBuiltDependencies` via `pnpm approve-builds` |

---

## Task 1: Webhook calls processConversationMessage via after()

**Files:**
- Modify: `app/api/webhooks/whatsapp/route.ts`

Meta requires a 200 response within 20 seconds. We use Next.js `after()` to run AI processing after the response is sent, so the webhook always returns quickly.

- [ ] **Step 1: Add imports at the top of the webhook**

Open `app/api/webhooks/whatsapp/route.ts`. Replace the existing imports block:

```typescript
import { NextResponse, after } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { processConversationMessage } from "@/lib/ai/agent"
import crypto from "crypto"
```

- [ ] **Step 2: Replace the stub AI block with a real call**

Find this block (around line 140):

```typescript
      if (conversation.ai_enabled) {
        // We'll use a detached execution to simulate a background job if our environment allows,
        // but Vercel/Next.js routes need a stable way. For now, let's keep it in-process 
        // but emphasize the structure.
        console.log("Queuing AI response for conversation:", conversation.id)
        
        // This is where we'd call processIncomingMessage(conversation.id) in the background.
      }
```

Replace it with:

```typescript
      if (conversation.ai_enabled) {
        const convId = conversation.id
        after(async () => {
          try {
            await processConversationMessage(convId)
          } catch (err) {
            console.error("AI agent error for conversation", convId, err)
          }
        })
      }
```

- [ ] **Step 3: Verify the file builds**

```bash
cd /Applications/projects/resepsionist-os/resepsionist-os
pnpm build 2>&1 | tail -20
```

Expected: build succeeds or fails only on unrelated issues (not on this file). If it errors on this file, check the import path and the `after` export.

- [ ] **Step 4: Commit**

```bash
git add app/api/webhooks/whatsapp/route.ts
git commit -m "feat: webhook triggers AI agent via after() after saving message"
```

---

## Task 2: Tenant-aware WhatsApp sending

**Files:**
- Modify: `lib/whatsapp/client.ts`
- Modify: `lib/ai/agent.ts`

The WhatsApp client currently reads global env vars. We add an optional `credentials` parameter so it can use per-tenant credentials from `business_integrations`. Global env vars remain as fallback for the pilot.

- [ ] **Step 1: Update `lib/whatsapp/client.ts`**

Replace the entire file with:

```typescript
const API_VERSION = "v21.0"

export interface WhatsAppMessageResponse {
  messaging_product: "whatsapp"
  contacts: Array<{ input: string; wa_id: string }>
  messages: Array<{ id: string }>
}

interface WhatsAppCredentials {
  accessToken: string
  phoneNumberId: string
}

export const whatsapp = {
  async sendMessage(
    to: string,
    text: string,
    credentials?: WhatsAppCredentials
  ): Promise<WhatsAppMessageResponse | null> {
    const accessToken = credentials?.accessToken ?? process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = credentials?.phoneNumberId ?? process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!accessToken || !phoneNumberId) {
      console.error("WhatsApp credentials missing.")
      return null
    }

    const url = `https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { body: text },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("WhatsApp API Error:", JSON.stringify(data, null, 2))
        throw new Error(data.error?.message || "Failed to send WhatsApp message")
      }

      console.log(`WhatsApp message sent to ${to}. ID: ${data.messages?.[0]?.id}`)
      return data as WhatsAppMessageResponse
    } catch (error) {
      console.error("Error sending WhatsApp message:", error)
      return null
    }
  },
}
```

- [ ] **Step 2: Update the WhatsApp send block in `lib/ai/agent.ts`**

Find this block in `agent.ts` (around line 259):

```typescript
    if (conversation.platform === "whatsapp") {
      const { whatsapp } = await import("@/lib/whatsapp/client")
      await whatsapp.sendMessage(customer.phone, finalContent)
    }
```

Replace it with:

```typescript
    if (conversation.platform === "whatsapp") {
      const { whatsapp } = await import("@/lib/whatsapp/client")
      const { data: waIntegration } = await supabase
        .from("business_integrations")
        .select("wa_access_token, wa_phone_number_id")
        .eq("business_id", conversation.business_id)
        .eq("is_active", true)
        .maybeSingle()

      const waCredentials =
        waIntegration?.wa_access_token && waIntegration?.wa_phone_number_id
          ? {
              accessToken: waIntegration.wa_access_token,
              phoneNumberId: waIntegration.wa_phone_number_id,
            }
          : undefined

      await whatsapp.sendMessage(customer.phone, finalContent, waCredentials)
    }
```

- [ ] **Step 3: Verify build**

```bash
pnpm build 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
git add lib/whatsapp/client.ts lib/ai/agent.ts
git commit -m "feat: make WhatsApp sending tenant-aware with env fallback"
```

---

## Task 3: Fix Messages page schema (updated_at → last_message_at)

**Files:**
- Modify: `app/(dashboard)/messages/page.tsx`

Migration 004 defines `last_message_at` on conversations. The page currently selects and orders by `updated_at` which does not exist on this table, causing wrong ordering.

- [ ] **Step 1: Update the select and order in `app/(dashboard)/messages/page.tsx`**

Find (lines 16–25):

```typescript
  const { data: conversations } = await supabase
    .from("conversations")
    .select(`
      id,
      platform,
      current_state,
      ai_enabled,
      updated_at,
      customers(id, name, phone)
    `)
    .eq("business_id", profile?.business_id)
    .order("updated_at", { ascending: false })
```

Replace with:

```typescript
  const { data: conversations } = await supabase
    .from("conversations")
    .select(`
      id,
      platform,
      current_state,
      ai_enabled,
      last_message_at,
      customers(id, name, phone)
    `)
    .eq("business_id", profile?.business_id)
    .order("last_message_at", { ascending: false })
```

- [ ] **Step 2: Verify build**

```bash
pnpm build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add app/\(dashboard\)/messages/page.tsx
git commit -m "fix: messages page orders by last_message_at per migration 004 schema"
```

---

## Task 4: Sync .env.example with current env var names

**Files:**
- Modify: `.env.example`

The current `.env.example` uses `WHATSAPP_TOKEN` (old name) and is missing several required variables.

- [ ] **Step 1: Replace `.env.example` contents**

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# App URL (used for internal links and Meta webhook registration)
NEXT_PUBLIC_APP_URL=

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
META_APP_SECRET=

# Instagram API
INSTAGRAM_VERIFY_TOKEN=

# Sentry
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=
SENTRY_AUTH_TOKEN=
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "fix: sync .env.example with current env var names"
```

---

## Task 5: Fix Vercel build — pnpm approve-builds

**Files:**
- Modify: `package.json` (pnpm adds `pnpm.onlyBuiltDependencies`)

Vercel's build fails because `unrs-resolver@1.11.1` (a transitive dependency) tries to run scripts but hasn't been approved. Running `pnpm approve-builds` interactively approves packages and records the approval in `package.json`.

- [ ] **Step 1: Run approve-builds**

```bash
pnpm approve-builds
```

The command will list packages requesting script execution. Approve all of them (press space or enter to approve each). This adds a `pnpm.onlyBuiltDependencies` array to `package.json`.

- [ ] **Step 2: Verify the field was added to package.json**

```bash
grep -A5 "onlyBuiltDependencies" package.json
```

Expected output (exact packages may vary):
```json
"onlyBuiltDependencies": [
  "unrs-resolver",
  ...
]
```

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "fix: approve pnpm build scripts for Vercel compatibility"
```

---

## Task 6: Push to GitHub and trigger Vercel deploy

- [ ] **Step 1: Push main branch to GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Watch Vercel build**

Open the Vercel dashboard for the `receptionist-os` project. A new deployment should appear automatically (Vercel auto-deploys on push to `main` if connected).

Alternatively trigger manually:
```bash
vercel --prod
```
(Requires `vercel` CLI — install with `npm i -g vercel` if missing.)

Expected: build succeeds, deployment URL shown.

- [ ] **Step 3: Note the production URL**

The URL will be in the form `https://resepsionist-os.vercel.app` or a custom domain. You'll need this for the next task.

---

## Task 7: Add environment variables to Vercel

All env vars must be added before the app can connect to Supabase, OpenAI, and WhatsApp. Do this via the Vercel dashboard:

**Project → Settings → Environment Variables → Add**

Set scope to **Production** and **Preview** for each:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → `anon public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → `service_role` key |
| `OPENAI_API_KEY` | platform.openai.com → API keys |
| `WHATSAPP_ACCESS_TOKEN` | Meta Developer Console → WhatsApp → API Setup → Temporary access token |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta Developer Console → WhatsApp → API Setup → Phone number ID |
| `WHATSAPP_VERIFY_TOKEN` | Choose any secret string (e.g. `resepsionist_pilot_2026`) — you'll use the same value in Meta console |
| `META_APP_SECRET` | Meta Developer Console → App Settings → Basic → App Secret |
| `INSTAGRAM_VERIFY_TOKEN` | Choose any secret string |
| `NEXT_PUBLIC_APP_URL` | `https://<your-production-domain>.vercel.app` |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry project settings (optional, skip if not configured) |
| `SENTRY_DSN` | Same Sentry value (optional) |
| `SENTRY_AUTH_TOKEN` | Sentry org settings → Auth tokens (optional) |

- [ ] **Step 1: Add all variables in Vercel dashboard (or via CLI)**

CLI alternative for each:
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# (paste value when prompted, repeat for each variable)
```

- [ ] **Step 2: Redeploy after adding env vars**

Env var changes require a fresh deploy:
```bash
vercel --prod
```
Or click **Redeploy** in the Vercel dashboard.

- [ ] **Step 3: Smoke test the webhook GET verification**

Replace `<domain>` and `<token>` with your values:

```bash
curl "https://<domain>/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=<WHATSAPP_VERIFY_TOKEN>&hub.challenge=testchallenge123"
```

Expected response: `testchallenge123`

If you get `Forbidden`, the `WHATSAPP_VERIFY_TOKEN` env var is missing or doesn't match.

---

## Task 8: Register webhook in Meta Developer Console

- [ ] **Step 1: Open Meta Developer Console**

Go to: Meta Developer Console → Your App → WhatsApp → Configuration → Webhook

- [ ] **Step 2: Set the callback URL**

```
https://<your-production-domain>/api/webhooks/whatsapp
```

- [ ] **Step 3: Set the verify token**

Use the same value you set as `WHATSAPP_VERIFY_TOKEN` in Vercel.

- [ ] **Step 4: Click Verify and Save**

Meta will call the GET endpoint. If verification passes, click **Save**.

- [ ] **Step 5: Subscribe to webhook fields**

In the Webhooks section, subscribe to: `messages`

- [ ] **Step 6: Send a test WhatsApp message**

Send a message from your personal WhatsApp to the Meta test number. Check:
- Vercel function logs (Dashboard → Deployments → Functions) for `WhatsApp Webhook Verified!` and `AI agent error` or successful processing
- Supabase → Table Editor → `messages` — a new row with `role: user` should appear
- Supabase → `conversations` — a row for the sender
- Supabase → `customers` — a row for the sender

- [ ] **Step 7: Verify AI response was sent**

Check Supabase `messages` for a row with `role: assistant`. Check your WhatsApp for the reply.

---

## Success Criteria

- [ ] `pnpm build` succeeds locally and on Vercel
- [ ] GET `/api/webhooks/whatsapp` verification returns the challenge
- [ ] Incoming WhatsApp message creates customer + conversation + message in Supabase
- [ ] Duplicate `platform_message_id` is silently ignored (no second row)
- [ ] AI response row exists in `messages` with `role: assistant`
- [ ] WhatsApp reply arrives on phone
- [ ] Messages page shows conversations ordered by most recent message
- [ ] Appointment booking via AI creates a row in `appointments`
