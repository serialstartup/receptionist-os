You are a senior startup CTO and system architect.

Your task is to design the complete roadmap and architecture for a SaaS platform.

The product:

AI Receptionist for Beauty Salons.

This platform will automate WhatsApp and Instagram conversations, create appointments, manage customers, and help salons increase bookings.

The goal is to build a scalable SaaS platform that can eventually become the "Shopify for Beauty Salons".

The product must be production-ready, scalable, and modular.

It must be finished feature by feature.

------------------------------------------------

TECH STACK (MANDATORY)

Frontend:
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui

Backend:
- Next.js Server Actions
- Route Handlers
- Supabase

Database:
- Supabase Postgres

Authentication:
- Supabase Auth

AI:
- OpenAI API
- Tool calling agent architecture

Messaging integrations:
- WhatsApp Business API
- Instagram Messaging API

Deployment:
- Vercel
- Supabase

Architecture must support:

- server components
- client components
- server actions
- route handlers

------------------------------------------------

CORE PRODUCT FEATURES

1️⃣ AI Receptionist

AI should:

- respond to WhatsApp messages
- respond to Instagram DM
- answer pricing questions
- recommend services
- create appointments
- confirm bookings

The AI must use tools such as:

- checkAvailability
- createAppointment
- cancelAppointment
- getServices
- getCustomer

AI must NOT write to the database directly.

AI must call backend tools.

------------------------------------------------

2️⃣ Appointment System

The system must include a scheduling engine that handles:

- service duration
- staff availability
- working hours
- existing appointments
- resource constraints

The system must prevent double booking.

------------------------------------------------

3️⃣ CRM

Customer profiles should include:

- name
- phone
- age
- visit count
- previous services
- notes

The CRM should automatically create customers from conversations.

------------------------------------------------

4️⃣ Campaign Automation

Salons should be able to:

- send WhatsApp promotions
- send reminders
- schedule campaigns
- target past customers

------------------------------------------------

5️⃣ Unified Inbox

Businesses must be able to see messages from:

- WhatsApp
- Instagram

in a single dashboard.

------------------------------------------------

6️⃣ Dashboard

Dashboard should show:

- today appointments
- upcoming bookings
- empty time slots
- revenue
- new customers

------------------------------------------------

UI REQUIREMENTS

The UI must be:

- modern SaaS design
- clean
- minimal
- elegant
- calm color palette
- no harsh colors

Design inspiration:

- Linear
- Stripe
- Vercel

The layout should include:

Sidebar navigation

- Dashboard
- Appointments
- Customers
- Campaigns
- Messages
- AI Settings
- Analytics

------------------------------------------------

TECHNICAL ARCHITECTURE

The system must include:

Messaging layer
Conversation manager
AI agent
Tool layer
Scheduling engine
Database
Dashboard

------------------------------------------------

DATABASE TABLES

The system must include tables such as:

- businesses
- users
- staff
- services
- customers
- appointments
- messages
- campaigns

------------------------------------------------

OUTPUT REQUIRED

Create a detailed project roadmap including:

1️⃣ System architecture
2️⃣ Database schema
3️⃣ Folder structure for Next.js
4️⃣ AI agent design
5️⃣ Messaging integration architecture
6️⃣ Scheduling engine logic
7️⃣ MVP scope
8️⃣ Phase 2 features
9️⃣ Phase 3 scaling plan
10️⃣ Development milestones

The roadmap must be step-by-step so the application can be implemented feature by feature.


Now break this project into a realistic engineering roadmap.

The roadmap should include:

- development phases
- tasks for each phase
- estimated complexity
- dependencies between tasks

Start with MVP and then scale toward a full SaaS platform.

Focus on building the core system first:

AI receptionist
Scheduling engine
CRM
Messaging integrations



------------------------------------------------

We tought database schema and system architecture would be like that:

1️⃣ Supabase Database Schema (Production-Ready MVP)

Bu schema şu sistemleri destekler:
	•	AI receptionist
	•	CRM
	•	Appointment system
	•	Messaging
	•	Campaigns

Ana tablolar:
businesses
users
staff
services
customers
appointments
messages
campaigns
campaign_recipients


2️⃣ businesses (çoklu işletme desteği)
create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  timezone text default 'Europe/Istanbul',
  created_at timestamptz default now()
);

Her işletme kendi verisini tutar.

3️⃣ users (dashboard kullanıcıları)
create table users (
  id uuid primary key references auth.users(id),
  business_id uuid references businesses(id) on delete cascade,
  role text default 'admin',
  created_at timestamptz default now()
);

Supabase Auth ile bağlanır.

4️⃣ staff (çalışanlar)
create table staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  name text not null,
  role text,
  is_active boolean default true,
  created_at timestamptz default now()
);

5️⃣ services (sunulan hizmetler)
create table services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  name text not null,
  description text,
  price numeric,
  duration_minutes integer not null,
  created_at timestamptz default now()
);

Laser ----> 20 min
Hydrafacial ----> 60 min

6️⃣ customers (CRM)
create table customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  name text,
  phone text,
  age integer,
  notes text,
  visit_count integer default 0,
  created_at timestamptz default now()
);

AI konuşmadan müşteri oluşturabilir.


7️⃣ appointments (randevular)
create table appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  customer_id uuid references customers(id),
  service_id uuid references services(id),
  staff_id uuid references staff(id),
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text default 'scheduled',
  source text,
  created_at timestamptz default now()
);

source:
    - whatsapp
    - instagram
    - dashboard
    - website


8️⃣ messages (conversation history)
create table messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  customer_id uuid references customers(id),
  channel text,
  role text,
  content text,
  created_at timestamptz default now()
);

role:
    user
    assistant
    agent

9️⃣ campaigns (marketing)
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id),
  name text,
  message text,
  scheduled_at timestamptz,
  created_at timestamptz default now()
);

🔟 campaign_recipients
create table campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id),
  customer_id uuid references customers(id),
  status text default 'pending'
);

1️⃣1️⃣ Önerilen indexler
Performans için:
    create index idx_appointments_business on appointments(business_id);
    create index idx_appointments_time on appointments(start_time);
    create index idx_customers_phone on customers(phone);

2️⃣ Scheduling Engine Algorithm nedir?
Scheduling engine:

uygun randevu slotlarını hesaplayan algoritma

AI randevu alırken bunu kullanır.

Scheduling engine input
    service_id
    date
    business_id

Database’den gelen bilgiler

1️⃣ service duration
2️⃣ staff availability
3️⃣ working hours
4️⃣ existing appointments

Örnek salon
    working hours: 09:00–18:00
    service: hydrafacial
    duration: 60 min

Mevcut randevular
    10:00–11:00
    13:00–14:00

Algoritma hedefi
    available slots

3️⃣ Scheduling Engine Pseudocode
function getAvailableSlots(date, serviceDuration) {

 const workingStart = 9
 const workingEnd = 18

 const existingAppointments = getAppointments(date)

 const slots = []

 for (let time = workingStart; time < workingEnd; time += 15) {

   const slotStart = time
   const slotEnd = time + serviceDuration

   if (!conflicts(slotStart, slotEnd, existingAppointments)) {
     slots.push(slotStart)
   }

 }

 return slots
}

4️⃣ Conflict Detection
function conflicts(start, end, appointments) {

 for (const appt of appointments) {

   if (start < appt.end && end > appt.start) {
     return true
   }

 }

 return false
}

Bu şu kontrolü yapar:
    - slot overlap

5️⃣ Double Booking’i engelleme
Randevu oluştururken transaction kullanılır.
BEGIN;

SELECT * FROM appointments
WHERE staff_id = $1
AND start_time < $end
AND end_time > $start
FOR UPDATE;

INSERT INTO appointments (...)

COMMIT;

Bu: race condition problemini çözer.

6️⃣ AI agent ile bağlantı
    AI şöyle tool çağırır:

{
 "tool": "checkAvailability",
 "service_id": "hydrafacial",
 "date": "2026-03-11"
}

backend: scheduling engine’ı çalıştırır.