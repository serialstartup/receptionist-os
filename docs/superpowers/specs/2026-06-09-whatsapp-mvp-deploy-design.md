# Receptionist OS — WhatsApp MVP Deploy Design

Date: 2026-06-09

## Goal

Fix all P0 code gaps blocking the WhatsApp pilot, resolve the Vercel build failure, set up environment variables on Vercel, and produce a live production URL that can be registered as the Meta webhook endpoint.

## Scope

Six discrete fixes + one deployment step. No new features, no refactoring beyond what's needed for the pilot.

---

## Fix 1 — Webhook triggers AI agent

**File:** `app/api/webhooks/whatsapp/route.ts`

**Problem:** After saving an incoming message, the webhook logs "Queuing AI response" but never calls `processConversationMessage()`.

**Fix:** Import `processConversationMessage` from `lib/ai/agent` and call it after a successful message insert when `conversation.ai_enabled` is true. For the MVP pilot, call it synchronously (Vercel function timeout is 300s, sufficient for a single AI round-trip). Add a try/catch so an AI failure never blocks the 200 OK response to Meta.

```
save message → if ai_enabled → processConversationMessage(conversation.id) → return 200
```

---

## Fix 2 — Tenant-aware WhatsApp sending

**Files:** `lib/whatsapp/client.ts`, `lib/ai/agent.ts`

**Problem:** `whatsapp.sendMessage()` reads `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` from global env. In the SaaS model each business has its own credentials in `business_integrations`.

**Fix:** Add an optional second parameter to `sendMessage(to, text, credentials?)`. If credentials are supplied (token + phoneNumberId), use them. Otherwise fall back to env vars. In `agent.ts`, after generating a reply, fetch `wa_access_token` and `wa_phone_number_id` from `business_integrations` and pass them to `sendMessage`.

This keeps the pilot working via env fallback while enabling multi-tenant sending immediately.

---

## Fix 3 — Messages page schema alignment

**File:** `app/(dashboard)/messages/page.tsx`

**Problem:** Query selects and orders by `conversations.updated_at`; migration 004 defines `last_message_at` instead. This causes a silent query issue (Supabase returns no ordering error but data is wrong).

**Fix:** Replace `updated_at` with `last_message_at` in the select and order clauses.

---

## Fix 4 — Update .env.example

**File:** `.env.example`

**Problem:** Uses `WHATSAPP_TOKEN` (old) instead of `WHATSAPP_ACCESS_TOKEN`, and is missing `WHATSAPP_PHONE_NUMBER_ID`, `META_APP_SECRET`, and `NEXT_PUBLIC_APP_URL`.

**Fix:** Bring `.env.example` in sync with the env var names used in the code.

---

## Fix 5 — Resolve pnpm approve-builds (Vercel build failure)

**Problem:** `unrs-resolver@1.11.1` requires script execution during install. Vercel's pnpm install fails because the package hasn't been approved.

**Fix:** Run `pnpm approve-builds` locally. This writes approved package list to `package.json` under `pnpm.onlyBuiltDependencies` (pnpm v9+) or creates a `.pnpmfile.cjs`. Commit the result.

---

## Fix 6 — Vercel environment variables

All required env vars must be added to Vercel (Production + Preview):

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project settings |
| `OPENAI_API_KEY` | OpenAI dashboard |
| `WHATSAPP_ACCESS_TOKEN` | Meta developer console |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta developer console |
| `WHATSAPP_VERIFY_TOKEN` | Choose a secret string |
| `META_APP_SECRET` | Meta app settings |
| `INSTAGRAM_VERIFY_TOKEN` | Meta developer console |
| `NEXT_PUBLIC_APP_URL` | https://your-production-domain.vercel.app |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry project |
| `SENTRY_DSN` | Sentry project |
| `SENTRY_AUTH_TOKEN` | Sentry organization settings |

Done via `vercel env add` CLI or Vercel dashboard.

---

## Deployment

After all fixes are committed and env vars are set:

```bash
vercel --prod
```

Or push to `main` if auto-deploy is configured on the Vercel project.

**Output:** A production URL in the form `https://resepsionist-os.vercel.app` (or custom domain). This URL becomes the Meta webhook callback: `https://<domain>/api/webhooks/whatsapp`.

---

## Success Criteria

- [ ] `pnpm build` succeeds locally
- [ ] Vercel build succeeds
- [ ] GET `/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=<token>&hub.challenge=test` returns `test`
- [ ] POST to webhook creates customer, conversation, message in Supabase
- [ ] AI response is generated and sent back via WhatsApp
- [ ] Messages page shows the conversation with correct ordering
- [ ] Appointments page shows bookings created by AI

---

## Out of Scope

- Instagram pilot (WhatsApp first)
- Self-serve WhatsApp onboarding UI
- Campaign advanced template compliance
- Any new dashboard features
