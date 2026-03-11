-- BeautyAI — Initial Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================================
-- 1. businesses (multi-tenant)
-- ============================================================
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  website text,
  location text,
  logo_url text,
  timezone text default 'Europe/Istanbul',
  working_hours_start time default '09:00',
  working_hours_end time default '18:00',
  working_days integer[] default '{1,2,3,4,5,6}', -- 0=Sun, 1=Mon...6=Sat
  created_at timestamptz default now()
);

-- ============================================================
-- 2. users (dashboard users, linked to Supabase Auth)
-- ============================================================
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid references businesses(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text default 'admin', -- admin | staff | viewer
  created_at timestamptz default now()
);

-- ============================================================
-- 3. staff (salon employees)
-- ============================================================
create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  role text, -- e.g. "Master Stylist", "Color Expert"
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- 4. services (offered services)
-- ============================================================
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  description text,
  category text, -- hair, nails, skin, massage, etc.
  price numeric,
  duration_minutes integer not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- 5. customers (CRM)
-- ============================================================
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text,
  phone text,
  email text,
  age integer,
  notes text,
  tags text[] default '{}', -- e.g. {'VIP', 'FREQUENT', 'NEW'}
  visit_count integer default 0,
  last_visit_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- 6. appointments
-- ============================================================
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  customer_id uuid references customers(id),
  service_id uuid references services(id),
  staff_id uuid references staff(id),
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text default 'scheduled', -- scheduled | confirmed | completed | cancelled | no-show
  source text, -- whatsapp | instagram | dashboard | website
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- 7. messages (conversation history)
-- ============================================================
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  customer_id uuid references customers(id),
  channel text, -- whatsapp | instagram
  role text, -- user | assistant | agent
  content text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- ============================================================
-- 8. campaigns (marketing)
-- ============================================================
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text,
  message text,
  channel text default 'whatsapp', -- whatsapp | instagram
  status text default 'draft', -- draft | active | scheduled | completed
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- 9. campaign_recipients
-- ============================================================
create table if not exists campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade not null,
  customer_id uuid references customers(id) not null,
  status text default 'pending', -- pending | sent | delivered | failed
  sent_at timestamptz
);

-- ============================================================
-- 10. Performance indexes
-- ============================================================
create index if not exists idx_appointments_business on appointments(business_id);
create index if not exists idx_appointments_time on appointments(start_time);
create index if not exists idx_appointments_staff on appointments(staff_id, start_time);
create index if not exists idx_customers_phone on customers(phone);
create index if not exists idx_customers_business on customers(business_id);
create index if not exists idx_messages_business on messages(business_id, created_at);
create index if not exists idx_messages_customer on messages(customer_id);
create index if not exists idx_staff_business on staff(business_id);
create index if not exists idx_services_business on services(business_id);
create index if not exists idx_campaigns_business on campaigns(business_id);

-- ============================================================
-- 11. Row Level Security (RLS)
-- ============================================================

-- Enable RLS on all tables
alter table businesses enable row level security;
alter table users enable row level security;
alter table staff enable row level security;
alter table services enable row level security;
alter table customers enable row level security;
alter table appointments enable row level security;
alter table messages enable row level security;
alter table campaigns enable row level security;
alter table campaign_recipients enable row level security;

-- Users can read their own business
create policy "Users can view own business" on businesses
  for select using (
    id in (select business_id from users where id = auth.uid())
  );

-- Users can update their own business
create policy "Users can update own business" on businesses
  for update using (
    id in (select business_id from users where id = auth.uid())
  );

-- Users table: can read/update own profile
create policy "Users can view own profile" on users
  for select using (id = auth.uid());

create policy "Users can update own profile" on users
  for update using (id = auth.uid());

-- Business-scoped policies (staff, services, customers, appointments, messages, campaigns)
-- Pattern: user can access rows where business_id matches their business

create policy "Business access" on staff
  for all using (
    business_id in (select business_id from users where id = auth.uid())
  );

create policy "Business access" on services
  for all using (
    business_id in (select business_id from users where id = auth.uid())
  );

create policy "Business access" on customers
  for all using (
    business_id in (select business_id from users where id = auth.uid())
  );

create policy "Business access" on appointments
  for all using (
    business_id in (select business_id from users where id = auth.uid())
  );

create policy "Business access" on messages
  for all using (
    business_id in (select business_id from users where id = auth.uid())
  );

create policy "Business access" on campaigns
  for all using (
    business_id in (select business_id from users where id = auth.uid())
  );

create policy "Business access" on campaign_recipients
  for all using (
    campaign_id in (
      select id from campaigns where business_id in (
        select business_id from users where id = auth.uid()
      )
    )
  );
