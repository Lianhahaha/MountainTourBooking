-- Run this in your Supabase SQL editor to set up booking storage

create table if not exists booking_requests (
  id text primary key,
  trip_id text,
  session_id text,
  trip_type text not null,
  trip_title text not null,
  preferred_date text,
  trek_time text,
  location_preference text,
  pax_count integer not null,
  participant_names text[] default '{}',
  lead_name text not null,
  phone text not null,
  email text not null,
  emergency_contact_name text not null,
  emergency_contact_phone text not null,
  notes text default '',
  fitness_confirmed boolean not null default false,
  waiver_accepted boolean not null default false,
  age_confirmed boolean not null default false,
  estimated_total numeric not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists contact_messages (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  phone text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- Allow service role full access (API uses service role key)
alter table booking_requests enable row level security;
alter table contact_messages enable row level security;

-- No public policies: the service role key bypasses RLS entirely.
-- Never create USING (true) policies — they expose tables to the anon key.
--
-- If you previously ran the permissive policies, remove them:
drop policy if exists "Service role full access on bookings" on booking_requests;
drop policy if exists "Service role full access on contacts" on contact_messages;

-- Hiking days (previously Firestore)
create table if not exists trek_sessions (
  id text primary key,
  date text not null,
  time text not null,
  max_slots integer not null check (max_slots >= 1),
  booked_count integer not null default 0 check (booked_count >= 0),
  status text not null default 'open' check (status in ('open', 'full', 'cancelled')),
  price numeric,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trek_sessions_date_idx on trek_sessions (date, time);
create index if not exists trek_sessions_status_idx on trek_sessions (status);

-- Photo albums (previously Firestore)
create table if not exists hiking_days (
  id text primary key,
  title text not null,
  summary text not null,
  date text not null,
  photos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hiking_days_date_idx on hiking_days (date desc);

-- Guest reviews (previously Firestore)
create table if not exists reviews (
  id text primary key default gen_random_uuid()::text,
  booking_id text not null default '',
  lead_name text not null,
  trip_title text not null default '',
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists reviews_status_created_idx on reviews (status, created_at desc);

-- Admin list queries filter and sort on these columns.
create index if not exists booking_requests_status_created_idx
  on booking_requests (status, created_at desc);
create index if not exists booking_requests_session_idx
  on booking_requests (session_id);

alter table trek_sessions enable row level security;
alter table hiking_days enable row level security;
alter table reviews enable row level security;

-- Again: no policies. The server uses the service role key; the anon key
-- cannot read bookings, reviews, or the owner's schedule.
