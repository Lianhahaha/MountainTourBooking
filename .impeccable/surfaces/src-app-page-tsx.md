---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/app/terms/page.tsx","src/app/privacy/page.tsx"]
---

# Landing page (/)

Scope: public landing page; the same system carries to /hikes, /book, /book/success, /terms, /privacy, and the owner dashboard.
Mode: Persuade.
Audience: first-time Mt. Apo climbers (barkadas, solo joiners) arriving from Facebook links on phones.
Action: book a scheduled date; secondary, request a private trek.
Proof on hand: live session dates and slot counts, trip specs, guide credentials, permit list, FAQ policies, approved reviews, owner hike albums.
Constraints: keep the GitHub theme (user-pinned), softer palette, compact sizing, phone-first, dark default, no invented claims, no online payment implied.

## Direction contract

THESIS: Keep the incumbent GitHub-style theme and soften it; win on layout. The next bookable date, its slots, and its price lead the page instead of a photo hero with stats.

OWN-WORLD: GitHub Primer vocabulary — bordered boxes with tinted header rows, 6px corners, label pills, green primary buttons, blue links. Dark default uses GitHub "dark dimmed" tones; light uses softened GitHub light. DM Sans for text, Outfit for headings and date numerals. Per-slot segmented meter (open = filled, taken = hollow, words always shown).

STORY: The visitor sees the next climb box with date, slots left, and price and can book in one tap. Scrolling: all dates, private-group option, how booking works, inclusions and pack list, guide and licenses, latest album, reviews, FAQ, contact. They believe it is organized and licensed; they book.

FIRST VIEWPORT: Compact 56px header (name, Book, menu on phones). Headline, then the Next climb box (date numerals, weekday and meet-up time, slot meter, meet-up note, price, Book button) — its Book button above the fold at 390×844. Description, five-cell spec strip, and reassurances follow; on desktop the box sits right of the headline column.

FORM: Refinement of the incumbent GitHub theme (user rejected the rolled gear-tag world, seed 0a0ace3d). Signature interaction: open slot segments press in once on first paint; reduced motion shows them settled. Phone sticky bar names the next date and hides over the contact form.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
