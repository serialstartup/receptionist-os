# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server with Turbopack
pnpm build        # Production build
pnpm typecheck    # Run tsc --noEmit (run before commits)
pnpm lint         # ESLint
pnpm format       # Prettier (auto-fix)
```

No test suite is configured yet.

## Architecture

### Multi-Tenant SaaS Model

The `businesses` table is the tenant root. Every data table (`services`, `customers`, `appointments`, `messages`, `conversations`, `campaigns`, `staff`) has a `business_id` FK. Each dashboard user is linked to one business via `users.business_id`. All Supabase queries must be scoped by `business_id` — this is enforced by RLS policies in the migrations.

### Supabase Clients — Which to Use Where

| Module | Client | Why |
|---|---|---|
| Server Components, Server Actions | `createClient()` from `lib/supabase/server.ts` | Cookie-based session, respects RLS |
| Browser/Client Components | `createClient()` from `lib/supabase/client.ts` | Browser SSR client |
| Webhook handlers, AI agent | `createAdminClient()` from `lib/supabase/server.ts` | Uses `SERVICE_ROLE_KEY`, bypasses RLS |

Never use `createAdminClient()` inside dashboard Server Actions — it bypasses RLS and exposes cross-tenant data.

### Auth Flow

`middleware.ts` → `lib/supabase/middleware.ts` runs on every request. It refreshes the Supabase session cookie and redirects unauthenticated users to `/login`. Webhook routes (`/api/webhooks/*`) are excluded from auth.

Dashboard layout (`app/(dashboard)/layout.tsx`) fetches the authenticated user's profile from `users` and passes it to `DashboardLayoutWrapper`. All dashboard pages live in `app/(dashboard)/` route group.

### Server Actions Pattern

All mutations go through `app/(dashboard)/actions.ts` (Server Actions). Each action:
1. Calls `createClient()` to get a session-aware Supabase client
2. Fetches `users.business_id` to scope the write operation
3. Inserts/updates with `business_id` from the profile (never from client input)
4. Calls `revalidatePath()` to bust the cache

### AI Receptionist Pipeline

Incoming message → webhook handler → upsert to `messages` + `conversations` → call `processConversationMessage(conversationId)` in `lib/ai/agent.ts`.

`processConversationMessage` runs a stateful FSM:
- Reads `conversations.current_state` (START → COLLECT_SERVICE → COLLECT_TIME → CONFIRMING → DONE)
- Calls OpenAI `gpt-4o` with tool definitions from `lib/ai/tools.ts`
- Tool calls are resolved deterministically: `getServices`, `getAvailableSlots` (via `lib/scheduling/engine.ts`), `createAppointment`
- State transitions are written back to `conversations.current_state`
- Response is saved to `messages` and sent back via the platform client

### Messaging Platform Clients

- `lib/whatsapp/client.ts` — wraps Meta Graph API v21.0 for sending WhatsApp messages
- Instagram messages are sent directly in the webhook handler via the Graph API
- Webhook verification for both platforms uses `VERIFY_TOKEN` env vars (GET handler returns `hub.challenge`)
- WhatsApp webhooks validate the `x-hub-signature-256` header using `META_APP_SECRET`
- Platform → business routing: webhooks look up `business_integrations` table by `wa_phone_number_id` or `ig_user_id`

### Database Schema (Migrations in `supabase/migrations/`)

Key tables and their purpose:
- `businesses` — tenant root, stores working hours, timezone
- `users` — auth users, linked to a business via `business_id`, role: admin/staff/viewer
- `staff` — employees (separate from auth users)
- `services` — offered services with price and `duration_minutes`
- `customers` — CRM records with tags and visit history
- `appointments` — bookings with status (`scheduled|confirmed|completed|cancelled|no-show`), source (`whatsapp|instagram|dashboard`)
- `conversations` — threaded message context per customer per platform, holds `current_state` and `ai_enabled` flag
- `messages` — individual messages linked to a conversation, role: `user|assistant|agent`
- `campaigns` / `campaign_recipients` — bulk messaging
- `business_integrations` — per-business WhatsApp and Instagram credentials (tokens stored in DB — encrypt in production)

### Path Aliases

`@/` maps to the project root (configured in `tsconfig.json`). Use `@/lib/...`, `@/components/...`, `@/app/...`.

## Environment Variables

See `.env.example`. Required for full local operation:
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` + `WHATSAPP_VERIFY_TOKEN` + `META_APP_SECRET`
- `INSTAGRAM_VERIFY_TOKEN`
