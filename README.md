# Tikling — Mt. Apo Booking Site

A mobile-first booking website for **Laag Ta ORB**, a registered hiking organization based in Davao del Sur specializing in guided Mt. Apo treks.

## Features

- **Landing page** — hero, about, photo gallery, licenses/trust section, FAQ, contact
- **Trip catalog** — scheduled Mt. Apo group treks with slot availability + private group bookings
- **Multi-step booking** — participant info, health waivers, manual payment notice, booking reference ID
- **Hike log** — `/hikes` page with photo albums per trekking day (title, summary, photos)
- **Admin dashboard** — `/admin` for bookings and hiking day management (JSON storage until Firebase)
- **Backend** — Supabase (production) with local JSON file fallback (development)
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
| `gallery.ts` | Photo gallery items |
| `licenses.ts` | License and permit documents |
| `faq.ts` | FAQ and policy text |

Replace Unsplash placeholder images with client photos in `/public` or update URLs in data files.

## Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

- **Without env vars**: bookings save to `data/bookings.json` locally
- **With Supabase**: bookings persist on Vercel (required for production deploy)
- **With Resend**: owner and client receive email on each booking

### Supabase setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL editor
3. Add URL and service role key to `.env.local`

### Resend setup

1. Create account at [resend.com](https://resend.com)
2. Add API key and verified sender email to `.env.local`

## Deploy to Vercel

```bash
npx vercel
```

Set environment variables in the Vercel dashboard. Supabase is recommended for production since serverless functions cannot write to the filesystem.

## Project structure

```
src/
  app/           # Pages and API routes
  components/    # UI sections and booking form
  data/          # Editable content (replace with client data)
  lib/           # Supabase, email, utilities
  types/         # TypeScript interfaces
data/
  bookings.json  # Local booking storage (dev fallback)
supabase/
  schema.sql     # Database schema
```

## Payment

This site does **not** process online payments. The booking flow clearly states that payment is collected in person on trek day (cash/GCash).
