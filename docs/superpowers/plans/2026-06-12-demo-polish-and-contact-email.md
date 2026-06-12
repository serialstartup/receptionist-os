# Demo Polish & Contact Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the product demo-ready by completing 3 coding tasks: (1) AI agent learns working days + phone/website from DB, (2) AI Settings page shows what the AI "knows" about the business, (3) Help Center contact form sends real email via Resend.

**Architecture:**
- Task A: `lib/ai/agent.ts` already queries the businesses table — extend query + system prompt to include working_days, phone, website. AI Settings page adds a read-only "What the AI knows" panel.
- Task B: Install Resend, create `/api/contact` Route Handler, convert help/page.tsx to a client component with form state, wire submit.

**Tech Stack:** Next.js App Router, Server Actions, Supabase, Resend (email), TypeScript, Tailwind, sonner (toast)

---

## Scope Assessment

| Task | Type | Feasible Today? |
|------|------|----------------|
| Fill AI prompt / Services / Working Hours / Campaign | **Manual data entry** | User does this — no code needed |
| Integration page vs Onboarding planning | **Decision** | Keep integrations page for MVP; onboarding wizard = V2. Documented below. |
| AI agent reads working_days + phone/website | **Code (~30 min)** | ✅ Today |
| AI Settings shows "What AI knows" panel | **Code (~30 min)** | ✅ Today |
| Help Center contact → real email | **Code (~1.5h)** | ✅ Today |
| Stripe subscription + plan change | **Code (full day)** | ❌ Next session — separate plan |

### Integration Decision (no code needed)
**Decision:** Keep current Integrations page approach for MVP.
- Businesses connect WhatsApp/Instagram from the Integrations page after signup.
- Onboarding wizard (3-step: business name → connect WA → add services) is a V2 feature.
- Reason: current architecture works for a single-tenant pilot; wizard adds complexity before product/market fit.

### Stripe Plan
Stripe is a full-day implementation (install + products + checkout sessions + webhooks + subscriptions table migration + UI). Plan separately when ready.

---

## Task A: Agent Business Context Enhancement

**Files:**
- Modify: `lib/ai/agent.ts`

### What agent.ts currently injects into system prompt:
- `business.name`, `business.location`, `business.working_hours_start/end`, tone, emoji rule, `ai_instructions`

### What's missing (but in DB):
- `working_days integer[]` (e.g. `[1,2,3,4,5,6]` = Mon–Sat, 0=Sun)
- `business.phone`
- `business.website`

### Steps

- [ ] **A1: Extend the Supabase query to fetch new fields**

In `lib/ai/agent.ts`, find the conversation query (around line 20). Change:
```ts
businesses(name, location, timezone, working_hours_start, working_hours_end, ai_instructions, ai_tone, ai_language, ai_emoji_enabled, ai_enabled)
```
to:
```ts
businesses(name, location, phone, website, timezone, working_hours_start, working_hours_end, working_days, ai_instructions, ai_tone, ai_language, ai_emoji_enabled, ai_enabled)
```

- [ ] **A2: Add working_days and contact info to system prompt**

After the existing `systemPromptParts` array definition (after the business hours line), add these entries in the array:

```ts
// Inside systemPromptParts, after the business hours line:
business.working_days && business.working_days.length > 0
  ? `- Open days: ${business.working_days
      .sort()
      .map((d: number) => ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d])
      .join(", ")}.`
  : null,
business.phone ? `- Business phone: ${business.phone}.` : null,
business.website ? `- Website: ${business.website}.` : null,
```

- [ ] **A3: Verify build passes**
```bash
pnpm build
```
Expected: ✓ Compiled successfully

- [ ] **A4: Commit**
```bash
git add lib/ai/agent.ts
git commit -m "feat: inject working_days, phone, website into AI system prompt"
```

---

## Task B: AI Settings "What AI Knows" Panel

**Files:**
- Modify: `app/(dashboard)/ai-settings/page.tsx`
- Modify: `app/(dashboard)/ai-settings/ai-settings-client.tsx`

### Goal
Add a read-only "Business Context" card in AI Settings that shows the AI what it currently knows about the business (pulled from businesses table). Includes a link to Settings to update any field.

### Steps

- [ ] **B1: Fetch additional business fields in page.tsx**

In `app/(dashboard)/ai-settings/page.tsx`, extend the businesses query to also fetch:
```ts
.select(`
  name, location, phone, website,
  working_hours_start, working_hours_end, working_days,
  ai_instructions, ai_tone, ai_language, ai_emoji_enabled, ai_enabled
`)
```
Pass these to `AISettingsClient` as part of the `business` prop (no interface change needed — it's typed as `any`).

- [ ] **B2: Add "Business Context for AI" section to ai-settings-client.tsx**

Add this section at the **top of the first tab** (before the AI Instructions textarea), inside the existing tab content:

```tsx
{/* Business Context Card */}
<div className="rounded-xl border border-border bg-muted/30 p-5 space-y-3">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="text-sm font-semibold text-foreground">Business Context</h3>
      <p className="text-xs text-muted-foreground mt-0.5">
        What the AI currently knows about your business.{" "}
        <Link href="/settings" className="text-primary underline hover:no-underline">
          Edit in Settings →
        </Link>
      </p>
    </div>
  </div>
  <div className="grid grid-cols-2 gap-2 text-xs">
    {[
      { label: "Name", value: business?.name },
      { label: "Location", value: business?.location },
      { label: "Phone", value: business?.phone },
      { label: "Website", value: business?.website },
      {
        label: "Hours",
        value: business?.working_hours_start && business?.working_hours_end
          ? `${business.working_hours_start} – ${business.working_hours_end}`
          : null,
      },
      {
        label: "Open days",
        value: business?.working_days?.length
          ? business.working_days
              .sort()
              .map((d: number) => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d])
              .join(", ")
          : null,
      },
    ].map(({ label, value }) => (
      <div key={label} className="flex flex-col gap-0.5">
        <span className="text-muted-foreground">{label}</span>
        <span className={value ? "text-foreground font-medium" : "text-muted-foreground/50 italic"}>
          {value || "Not set"}
        </span>
      </div>
    ))}
  </div>
</div>
```

Add `import Link from "next/link"` at the top of the file if not already present.

- [ ] **B3: Verify build**
```bash
pnpm build
```

- [ ] **B4: Commit**
```bash
git add app/(dashboard)/ai-settings/page.tsx app/(dashboard)/ai-settings/ai-settings-client.tsx
git commit -m "feat: show business context panel in AI Settings"
```

---

## Task C: Help Center Contact Form → Resend Email

**Files:**
- Modify: `package.json` (install resend)
- Create: `app/api/contact/route.ts`
- Modify: `app/(dashboard)/help/page.tsx` → convert to client component

### Prerequisites
- Add `RESEND_API_KEY` to Vercel env vars (get from resend.com)
- Add `RESEND_TO_EMAIL` to Vercel env vars (your support email, e.g. oguzhan.suavi@gmail.com)
- Add both to `.env.local` for local dev

### Steps

- [ ] **C1: Install Resend**
```bash
pnpm add resend
```

- [ ] **C2: Add env vars to .env.local**
```bash
# .env.local — add these two lines
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_TO_EMAIL=oguzhan.suavi@gmail.com
```
Also add to `.env.example` (without values):
```
RESEND_API_KEY=
RESEND_TO_EMAIL=
```

- [ ] **C3: Create /api/contact/route.ts**

Create file at `app/api/contact/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  const { subject, message } = await req.json()

  if (!subject || !message?.trim()) {
    return NextResponse.json({ error: "Subject and message required." }, { status: 400 })
  }

  const senderEmail = userData.user?.email ?? "unknown@user"

  const { error } = await resend.emails.send({
    from: "Receptionist OS <onboarding@resend.dev>",
    to: process.env.RESEND_TO_EMAIL!,
    subject: `[Support] ${subject}`,
    html: `
      <p><strong>From:</strong> ${senderEmail}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <hr />
      <p>${message.replace(/\n/g, "<br />")}</p>
    `,
  })

  if (error) {
    console.error("Resend error:", error)
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **C4: Convert help/page.tsx to client component**

Replace the static contact form section with a wired client form. Add `"use client"` at the top and convert to a proper client component with `useState`:

```tsx
"use client"

import { useState } from "react"
import { toast } from "sonner"
// ... keep all existing imports
```

Add state:
```tsx
const [subject, setSubject] = useState("Technical Issue")
const [message, setMessage] = useState("")
const [sending, setSending] = useState(false)

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!message.trim()) return
  setSending(true)
  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message }),
    })
    if (!res.ok) throw new Error()
    toast.success("Message sent! We'll get back to you shortly.")
    setMessage("")
  } catch {
    toast.error("Failed to send message. Please try again.")
  } finally {
    setSending(false)
  }
}
```

Update the form JSX:
```tsx
<form className="space-y-5" onSubmit={handleSubmit}>
  <div>
    <label ...>Subject</label>
    <select
      value={subject}
      onChange={(e) => setSubject(e.target.value)}
      className="..."
    >
      <option>Technical Issue</option>
      <option>Billing Question</option>
      <option>Feature Request</option>
      <option>Other</option>
    </select>
  </div>
  <div>
    <label ...>Message</label>
    <textarea
      rows={5}
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      placeholder="Describe your issue in detail..."
      className="..."
    />
  </div>
  <button
    type="submit"
    disabled={sending || !message.trim()}
    className="w-full rounded-lg bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
  >
    {sending ? "Sending..." : "Send Message"}
  </button>
</form>
```

Note: Since this page becomes `"use client"`, remove any server-side data fetching from it. The help page currently has no server fetching so this is safe.

- [ ] **C5: Add env vars to Vercel**
```bash
# In Vercel dashboard or via CLI:
vercel env add RESEND_API_KEY
vercel env add RESEND_TO_EMAIL
```

- [ ] **C6: Verify build**
```bash
pnpm build
```

- [ ] **C7: Commit**
```bash
git add app/api/contact/route.ts app/(dashboard)/help/page.tsx .env.example
git commit -m "feat: wire help center contact form to Resend email"
```

---

## Task D: Stripe Subscription (NEXT SESSION)

Stripe is a full-day feature. Implement in a dedicated session. Key work:
1. Install `stripe` + `@stripe/stripe-js`
2. Create products/prices in Stripe dashboard (Free, Pro, Enterprise tiers)
3. `app/api/stripe/checkout/route.ts` — create checkout session
4. `app/api/stripe/webhook/route.ts` — handle subscription events
5. Migration: `subscriptions` table (business_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end)
6. Settings page Subscription section → real data + "Upgrade Plan" opens Stripe checkout
7. Stripe billing portal for plan management

---

## Verification

After Tasks A, B, C:

1. **AI context:** Ask the AI via WhatsApp "kaçta açılıyorsunuz?" → should give real hours. "Pazartesi açık mısınız?" → should check working_days.
2. **AI Settings panel:** Open AI Settings → Business Context card shows name, location, phone, hours, days.
3. **Contact form:** Help Center → fill form → click Send → toast appears → email arrives in support inbox.
4. `pnpm build` passes cleanly.

---

## User Manual Tasks (no code — you do these in the dashboard)

1. **Services:** Dashboard → Services → add at least 3 services with name, price, duration
2. **Working Hours:** Settings → set `09:00`–`19:00`, select working days
3. **AI Settings:** AI Instructions → write business description (location, specialties, tone)
4. **Campaign:** Campaigns → create a test campaign → execute → verify send
