# Tikling — Mt. Apo Booking Site

A mobile-first booking website for **Laag Ta ORB**, a registered hiking organization based in Davao del Sur specializing in guided Mt. Apo treks.

## Features

- **Landing page** — hero, about, photo gallery, licenses/trust section, FAQ, contact
- **Trip catalog** — scheduled Mt. Apo group treks with slot availability + private group bookings
- **Multi-step booking** — participant info, health waivers, manual payment notice, booking reference ID
- **Hike log** — `/hikes` page with photo albums per trekking day (title, summary, photos)
- **Admin dashboard** — `/admin` for bookings, hiking days, albums, and reviews
- **Backend** — Supabase (production) with a local JSON store for development
- **Email notifications** — owner + client auto-reply via Resend (optional)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Customize content

Edit files in `src/data/`:

| File | Content |
|------|---------|
| `org.ts` | Organization name, guide bio, contact info, stats |
| `trips.ts` | Mt. Apo scheduled treks and private group template |
| `licenses.ts` | License and permit documents |
| `faq.ts` | FAQ and policy text |

Replace Unsplash placeholder images with client photos in `/public` or update URLs in data files.

## Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

- **Without Supabase env vars**: everything is stored in `data/*.json` (local development only)
- **With Supabase**: bookings, hiking days, albums, and reviews persist on Vercel
- **With Resend**: owner and client receive email on each booking
- **`ADMIN_PASSWORD`**: protects `/admin`; use a long random value in production
- **`NEXT_PUBLIC_SITE_URL`**: the public origin, used for canonical URLs, OG tags, and the sitemap

### Supabase setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL editor (it creates all four tables)
3. Add the project URL and service role key to `.env.local`
4. Deploy. Row level security is enabled with no public policies, so the anon
   key cannot read bookings or reviews.

> **Upgrading from the Firestore version:** the app no longer reads Firestore.
> Export the old `booking_requests`, `trek_sessions`, `hiking_days`, and
> `reviews` collections from the Firebase console, then import them into the
> matching Supabase tables (the column names are snake_case). The old Firebase
> project can be deleted once the export is verified.

### Resend setup

1. Create account at [resend.com](https://resend.com)
2. Add API key and verified sender email to `.env.local`

## Deploy to Vercel

```bash
npx vercel
```

Set environment variables in the Vercel dashboard. Supabase is **required** for
production: serverless functions cannot write to the filesystem, so without it
the local store refuses to run and the site reports the outage instead of
losing data. Also set `NEXT_PUBLIC_SITE_URL` to the production origin so
canonical links, the sitemap, and Open Graph tags point at the real domain.
For Resend, verify your sending domain and set `RESEND_FROM_EMAIL` to an address
on it; the default `onboarding@resend.dev` is only for testing.

## Project structure

```
src/
  app/           # Pages and API routes
  components/    # UI sections, booking form, owner dashboard
  data/          # Editable content (replace with client data)
  lib/           # Supabase, local dev store, email, utilities
  types/         # TypeScript interfaces
data/            # Local JSON store (gitignored, development only)
supabase/
  schema.sql     # Database schema
```

## Payment

This site does **not** process online payments. The booking flow clearly states that payment is collected in person on trek day (cash/GCash).
