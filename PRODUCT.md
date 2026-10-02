# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: first-time Mt. Apo climbers — barkadas (friend groups) and solo joiners — who arrive from Facebook links on their phones. Their job is to find an upcoming trek date, see the price and remaining slots, decide whether the climb is safe and right for them, and book.

Secondary: group organizers (schools, companies, orgs) requesting a private trek, and the owner, who manages bookings, hiking days, albums, and reviews from the dashboard.

## Product Purpose

Tikling Apo Tours runs guided Mt. Apo treks from Davao del Sur. The site replaces scattered Facebook-message bookings with one place to see scheduled dates, transparent slot availability, and a booking form. Success means a visitor books a date (or requests a private trek) without needing to message anyone first.

## Positioning

A registered, licensed local operator with scheduled group dates and live slot counts, instead of ad-hoc Facebook posts. Payment happens in person on trek day; the site never takes online payment.

## Operating Context

- Visitors browse mostly on phones, often on mobile data.
- Bookings are confirmed by the owner within 24–48 hours via SMS or email.
- Payment is cash or GCash on trek day.
- Trail access depends on DENR status and PAGASA weather advisories.

## Capabilities and Constraints

- Next.js 16 app router, Tailwind CSS v4, Supabase/Firebase storage, Resend email, deployed on Vercel.
- Public routes: `/` (landing), `/hikes` and `/hikes/[id]` (photo albums), `/book`, `/book/success`.
- Owner routes under `/admin`.
- Light and dark themes; dark is the default for new visitors (confirmed).
- One visual system across public pages and the owner dashboard (confirmed).

## Brand Commitments

- Name: Tikling Apo Tours. Tagline: "Guided Mt. Apo treks from Davao del Sur".
- Visual theme: GitHub's own palette and Primer patterns (green primary buttons, blue links, bordered boxes, underline tabs, DM Sans + Outfit). Extra GitHub accent colours are fine when they blend in; do not soften the palette or replace the theme (confirmed by the user).
- Legal contact email for Terms of Use and Privacy Policy: projectneodevscoe@gmail.com (legal pages only; confirmed).

## Evidence on Hand

- Trip data, FAQ, licenses list, guide credentials, and stats live in `src/data/`.
- Approved guest reviews come from the database.
- Photos are Unsplash stock; license cards currently use unrelated stock photos. No real license scans are on hand — do not fabricate document images.
- Contact phone `+63 917 000 0000` and `hello@tiklingapo.ph` look like placeholders; keep them as-is until the owner replaces them.

## Product Principles

1. Dates, price, and slots first — a first-timer should see what they can book within one screen.
2. Earn trust with specifics (permits, safety practice, cancellation terms), not adjectives.
3. Phone-first: every action reachable with a thumb, no horizontal scroll.
4. Never imply online payment or invent claims beyond what the owner provides.
