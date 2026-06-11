# CLAUDE.md

This file guides Claude Code/Codex when working inside the Receptionist OS repo.
- Read obsidian folders in order to details:
  - '/Users/oguztasci/Desktop/secondBrain/receptionist-os-wiki'
  - '/Users/oguztasci/Desktop/secondBrain/receptionist-os-wiki/current-state'
  - '/Users/oguztasci/Desktop/secondBrain/receptionist-os-wiki/next-actions'

Whenever we change something or add new features, we will update our obsidian folder in:
   - '/Users/oguztasci/Desktop/secondBrain/receptionist-os-wiki/decisions/[this date]'

Permanent project memory lives at:
`/Users/oguztasci/Desktop/secondBrain/receptionist-os-wiki`

The wiki has its own `CLAUDE.md` for Obsidian memory rules. Do not overwrite it.
This repo file explains the product, current state, architecture, and next work.

## Project Identity

Receptionist OS is an AI receptionist and operations platform for local service
businesses.

It helps businesses manage:
- WhatsApp conversations
- Instagram DM conversations
- appointment requests
- customer records
- service catalogues
- AI-assisted booking flows
- campaigns and reminders
- dashboard operations

Primary target customers:
- estetik merkezleri
- kuaförler
- tırnak salonları
- dental klinikler
- beauty salons
- local appointment-based service businesses

Core promise:
Receptionist OS turns WhatsApp and Instagram messages into structured CRM,
conversation, and appointment workflows. The AI receptionist answers common
questions, checks services and availability, and helps customers book.

Long-term direction:
Receptionist OS should become a Shopify-like operating system for local service
businesses: messaging, bookings, customers, automation, analytics, campaigns,
and integrations in one dashboard.

## Current State

Dashboard and core operations are mostly implemented.

Ready or near-ready modules:
- Dashboard
- Appointments
- Customers
- Services
- Settings
- AI Settings
- Messages
- Analytics
- Campaigns
- Calendar
- Sentry setup
- Supabase Auth and RLS foundation
- WhatsApp webhook + AI agent (end-to-end working as of 2026-06-09)
- OpenAI tool-calling agent (working on Vercel)

Active focus:
WhatsApp booking loop validation + dashboard Messages screen.

WhatsApp pilot status (as of 2026-06-09): WORKING end-to-end.
- Vercel deployment live at receptionist-os.vercel.app
- Meta webhook registered and verified
- Inbound message → customer/conversation created → AI response → WhatsApp reply: ✅
- Missing migrations 002/003/004/006 applied to Supabase
- All 6 Supabase migrations now applied

Where we stopped (2026-06-09):
- WhatsApp pilot pipeline fully validated
- Next: test Messages dashboard screen shows conversations
- Next: test booking flow (AI creates appointment via tool call)
- Next: verify Appointments screen shows AI-created bookings

## Today's MVP Goal

WhatsApp pilot is working end-to-end as of 2026-06-09. ✅

Completed acceptance criteria:
- WhatsApp outbound test works. ✅
- WhatsApp inbound webhook works. ✅
- Customer, conversation, and message records exist. ✅
- AI response is created and sent. ✅
- Duplicate message IDs are ignored. ✅

Remaining acceptance criteria:
- Booking creates an `appointments` row. (needs booking flow test)
- Messages screen shows conversation and messages. (needs dashboard test)
- Appointments screen shows AI-created booking. (needs booking flow test)
- Human takeover disables AI for that conversation. (not yet tested)

## Long-Term Product Goal

The pilot may temporarily use one Meta test number or one manually connected
WhatsApp Business number. That is not the final design.

The final SaaS architecture must let every business connect its own WhatsApp
Business number from the dashboard.

Expected future onboarding:
1. Business opens Integrations.
2. Business clicks "Connect WhatsApp".
3. Business authorizes through Meta onboarding or OAuth-style flow.
4. System stores business-specific WhatsApp account data.
5. Incoming webhooks route by Meta phone number IDs.
6. Outbound messages use that business's integration credentials.

`business_integrations` is the central table for this model.

Do not build features that assume one global WhatsApp number forever.

Meta Embedded Signup / Tech Provider onboarding comes after the first pilot
validates the messaging and booking loop.

## Tech Stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn-style UI,
  lucide-react, sonner.
- Backend: Server Components, Server Actions, Route Handlers, Supabase Auth,
  Supabase Postgres, RLS.
- AI: OpenAI API, tool-calling agent architecture.
- Messaging: WhatsApp Business Cloud API, Instagram Messaging API, Meta Graph API.
- Deployment/monitoring: Vercel, Supabase, Sentry.

## Commands

Use pnpm.

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm format
pnpm test:e2e
pnpm test:e2e:seed
```

Known local issue:
`pnpm typecheck` and `pnpm lint` may fail locally because Homebrew Node is linked
against a missing `icu4c` version. Treat this as a local toolchain issue until
Node/icu4c is fixed.

## Architecture Rules

`businesses` is the tenant root.

Every business-owned table must be scoped by `business_id`.

Core tenant-scoped tables:
- `users`
- `staff`
- `services`
- `customers`
- `appointments`
- `messages`
- `conversations`
- `campaigns`
- `campaign_recipients`
- `business_integrations`

Dashboard code must never trust client-provided `business_id`.

Dashboard writes should:
1. Authenticate the user.
2. Fetch `users.business_id`.
3. Use that `business_id` for all writes.
4. Revalidate affected routes.

Webhook and AI worker code may use admin access because Meta/OpenAI requests are
not user-session requests.

Never use admin access for normal dashboard mutations.

## Supabase Client Rules

Use the correct client for the context.

| Context | Client | Reason |
|---|---|---|
| Server Components | `createClient()` | session-aware, respects RLS |
| Server Actions | `createClient()` | authenticated dashboard mutations |
| Client Components | browser client | browser session |
| Webhooks | `createAdminClient()` | no user session, bypass RLS |
| AI agent | `createAdminClient()` | background/platform processing |

`createAdminClient()` uses `SUPABASE_SERVICE_ROLE_KEY`.

Do not expose service role logic to client components.

## Messaging Pipeline

Target pipeline:
1. WhatsApp or Instagram webhook receives event.
2. Webhook verifies token/signature.
3. Webhook extracts platform message ID and sender.
4. Webhook routes platform ID to business.
5. Webhook finds or creates customer.
6. Webhook finds or creates conversation.
7. Webhook inserts message.
8. Duplicate platform message IDs are ignored.
9. If AI is enabled, webhook triggers the AI agent.
10. AI reads conversation history and business settings.
11. AI calls deterministic tools.
12. AI response is saved to `messages`.
13. Platform client sends the response back.

Routing IDs:
- WhatsApp inbound uses `value.metadata.phone_number_id`.
- Instagram inbound uses recipient/business account ID.

The routing record lives in `business_integrations`.

## WhatsApp Architecture

Temporary pilot:
- One Meta test number or manually connected WhatsApp Business number is allowed.
- Vercel env may hold fallback credentials for local/pilot testing.

Permanent SaaS model:
- Each business has a `business_integrations` row.
- Each WhatsApp integration stores phone number ID and token.
- Webhooks route by `wa_phone_number_id`.
- Outbound sends use business-specific credentials.

## Instagram Architecture

Instagram Messaging API is a parallel platform.

For the immediate MVP, WhatsApp has priority.

Instagram should reuse the same conversation/message/AI abstraction once
WhatsApp proves webhook delivery, AI response, appointment creation, and
dashboard visibility.

## AI Receptionist Rules

The AI should not write arbitrary data directly.

It should use deterministic backend tools for business actions.

Key files:
- `lib/ai/tools.ts`
- `lib/ai/agent.ts`
- `lib/scheduling/engine.ts`

The agent should:
- read business settings
- read conversation history
- keep responses concise
- use tools for pricing and availability
- never guess appointment availability
- respect conversation-level `ai_enabled`
- respect business-level `ai_enabled`
- save assistant messages
- send outbound messages through the correct platform client

Booking must be deterministic and conflict-aware.

## Scheduling Rules

The scheduling engine must account for:
- business working days
- business working hours
- service duration
- staff availability
- existing appointments
- appointment status
- conflicts and double-booking prevention

If a requested slot is no longer available, the AI should ask the user to choose
another time.

## Database Summary

Important tables:
- `businesses`: tenant root, settings, working hours, AI settings
- `users`: dashboard users linked to one business
- `staff`: service providers
- `services`: service catalog
- `customers`: CRM records
- `appointments`: bookings
- `messages`: individual chat messages
- `conversations`: threaded platform conversations
- `business_integrations`: WhatsApp/Instagram connection data
- `campaigns`: campaign definitions
- `campaign_recipients`: campaign send records

Migration files live in `supabase/migrations/`.

Keep migrations idempotent when possible.

## Known P0 Gaps

Resolved (2026-06-09):
1. ✅ Webhook now triggers `processConversationMessage()` via `after()`.
2. ✅ WhatsApp client is tenant-aware (reads from business_integrations).
3. ✅ Messages page updated to use `last_message_at`.
4. ✅ `.env.example` updated with correct env names.
5. ✅ All migrations 001-006 applied to Supabase production.
6. ✅ Vercel deployment live with all env vars.

Remaining:
- Local Node/icu4c blocks `pnpm typecheck` and `pnpm lint`.
- Booking loop not yet validated end-to-end (AI tool → appointment row).
- Messages dashboard screen not yet tested with real conversations.
- Human takeover flow not yet tested.

## Meta Setup Notes

Never write API keys, access tokens, app secrets, verify tokens, or private phone
numbers into this file, the wiki, commits, or chat.

Use Vercel environment variables for production.

Important env names:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `META_APP_SECRET`
- `INSTAGRAM_VERIFY_TOKEN`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`

Production WhatsApp webhook path:
`/api/webhooks/whatsapp`

Full callback URL format:
`https://<production-domain>/api/webhooks/whatsapp`

Meta webhook verification uses `hub.mode`, `hub.verify_token`, and
`hub.challenge`.

WhatsApp POST signature verification uses `x-hub-signature-256` and
`META_APP_SECRET`.

## Dashboard Module Notes

- Appointments: CRUD/status changes exist; AI-created appointments must appear.
- Customers: CRM exists; webhooks should create customers automatically.
- Messages: real conversations/messages, AI takeover/handoff; human reply may
  need more work.
- AI Settings: business-level prompt, tone, language, emoji settings; agent
  should read them.
- Services: active catalogue feeds AI service and pricing answers.
- Settings: working hours, working days, timezone affect scheduling.
- Campaigns: basic flow exists; advanced template compliance can come later.

## Testing and Acceptance

Before considering a change complete, run or document why you could not run:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

WhatsApp pilot acceptance:
- Meta outbound test message works.
- Meta webhook GET verification works.
- Meta inbound POST reaches the app.
- Incoming message creates/fetches customer.
- Incoming message creates/fetches conversation.
- Incoming message inserts into `messages`.
- Duplicate message IDs are ignored.
- AI response is saved.
- WhatsApp reply is sent.
- Appointment booking creates an appointment.
- Dashboard shows conversation and appointment.
- Human takeover disables AI for that conversation.

Dashboard acceptance:
- authenticated users only see their business data
- mutations scope by `business_id`
- `revalidatePath()` updates the relevant page
- empty states and errors are handled

## Wiki Memory Rules

Permanent project memory:
`/Users/oguztasci/Desktop/secondBrain/receptionist-os-wiki`

Before major work, read `index.md`, `current-state.md`, `next-actions.md`,
`open-questions.md`, and directly relevant decision or architecture pages.

After meaningful changes, update `current-state.md`, `next-actions.md`,
`log.md`, and a decision file if a durable product/architecture decision was
made.

Wiki language is Turkish.

Do not store secrets in the wiki.

## Coding Rules

Prefer existing patterns over new abstractions.

Keep edits scoped to the requested outcome.

Use Server Actions for authenticated dashboard mutations.

Use Route Handlers for platform webhooks and integration callbacks.

Use structured APIs over ad hoc string parsing.

Keep UI consistent with the existing dashboard.

Use lucide-react icons for dashboard controls when possible.

Never revert unrelated user changes.

Do not run destructive git commands unless explicitly asked.

## Current Priority Order

1. ✅ Finish WhatsApp live pilot (end-to-end working 2026-06-09).
2. ✅ Fix tenant-aware WhatsApp sending.
3. ✅ Align message/conversation schema usage.
4. ✅ Deploy and test on production URL.
5. Test Messages dashboard screen with real WhatsApp conversations.
6. Validate AI booking loop (service → slot → appointment row).
7. Test Appointments screen shows AI-created bookings.
8. Test human takeover flow (conversation status → 'human').
9. Prepare demo/pilot customer flow.
10. Move toward self-serve WhatsApp onboarding.
