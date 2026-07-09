-- Run this in your Supabase SQL editor to set up booking storage

create table if not exists booking_requests (
  id text primary key,
  trip_id text,
  trip_type text not null,
  trip_title text not null,
  preferred_date text,
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

create policy "Service role full access on bookings"
  on booking_requests for all
  using (true)
  with check (true);

create policy "Service role full access on contacts"
  on contact_messages for all
  using (true)
  with check (true);
