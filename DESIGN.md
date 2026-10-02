---
name: Tikling Apo Tours
description: Mt. Apo group and private climbs, booked from a phone; a softened GitHub Primer world.
colors:
  background: "#22272e"
  foreground: "#adbac7"
  surface: "#262c34"
  surface-elevated: "#2d333b"
  muted: "#909dab"
  border: "#444c56"
  input-bg: "#1c2128"
  primary: "#3b8640"
  primary-hover: "#46954a"
  primary-foreground: "#ffffff"
  primary-muted: "rgba(70, 149, 74, 0.15)"
  accent: "#539bf5"
  accent-hover: "#6cb6ff"
  accent-muted: "rgba(83, 155, 245, 0.15)"
  warning: "#c69026"
  warning-muted: "rgba(198, 144, 38, 0.15)"
  danger: "#e5534b"
  danger-muted: "rgba(229, 83, 75, 0.15)"
  background-light: "#fafbfc"
  foreground-light: "#2c333a"
  surface-light: "#f3f5f7"
  surface-elevated-light: "#ffffff"
  muted-light: "#59636e"
  border-light: "#d8dee4"
  input-bg-light: "#ffffff"
  primary-light: "#1f883d"
  primary-hover-light: "#1a7f37"
  primary-muted-light: "rgba(31, 136, 61, 0.1)"
  accent-light: "#0969da"
  accent-hover-light: "#0550ae"
  accent-muted-light: "rgba(9, 105, 218, 0.1)"
  warning-light: "#9a6700"
  warning-muted-light: "rgba(154, 103, 0, 0.1)"
  danger-light: "#cf222e"
  danger-muted-light: "rgba(207, 34, 46, 0.1)"
typography:
  display:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "clamp(2rem, 6vw, 3.5rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.025em"
  numeral:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 800
    lineHeight: 0.85
    letterSpacing: "-0.025em"
    fontFeature: "\"tnum\""
  headline:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
  body-sm:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.4
  caption:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  seg: "2px"
  md: "6px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "40px"
  section: "56px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-primary-sm:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "6px 14px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
    height: "40px"
  box:
    backgroundColor: "{colors.surface-elevated}"
    rounded: "{rounded.md}"
  box-header:
    backgroundColor: "{colors.surface}"
    typography: "{typography.label}"
    padding: "10px 16px"
  field-input:
    backgroundColor: "{colors.input-bg}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  label-pill:
    backgroundColor: "{colors.primary-muted}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  slot-segment:
    backgroundColor: "{colors.primary}"
    rounded: "{rounded.seg}"
    height: "10px"
  nav-link-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
---

# Design System: Tikling Apo Tours

## Overview

**Creative North Star: "The Trail Repo"**

The site borrows GitHub Primer's vocabulary wholesale and softens it: bordered boxes with tinted header rows, 6px corners, small label pills, green for the action you take and blue for the link you follow. The owner pinned this theme. The redesign changed the palette's temperature and the page layout, not the world. Dark mode is the default and uses GitHub "dark dimmed" tones. Light mode is GitHub light with gentler grounds (a near-white page, a cool grey surface, softened ink).

Density is compact and phone-first. Body text is 15px, labels are 13px, and the Next-climb box carries date numerals, a slot meter, the price and a Book button above the fold at 390x844. Information sits in boxes and divided lists rather than in floating cards. Photos sit in plain 6px-cornered frames with no scrims or overlays. Depth comes from tonal layering (page, surface, elevated surface) plus a single soft shadow kept for the boxes that lead a page.

The one signature is the segmented slot meter: one segment per slot, open slots filled and taken slots hollow, with the count always spelled out in words beside it. It is the only moving element. Open segments press in once on first paint.

**Key Characteristics:**
- GitHub Primer vocabulary, softened: green primary buttons, blue links, bordered boxes, label pills.
- Dark "dimmed" default, softened light alternative; every colour is a CSS custom property that swaps per theme.
- One radius (6px) for everything rectangular; pills are fully round; slot segments are 2px.
- Outfit for headings and numerals, DM Sans for everything else.
- Tonal layering first, one soft shadow second.
- One motion moment (the slot meter), and it respects reduced motion.

## Colors

A cool slate neutral field with one green action colour, one blue link colour, and amber and red kept for slot scarcity and errors. Dark values are canonical; each has a `-light` sibling in the frontmatter, and the CSS swaps them on the `.dark` class.

### Primary
- **Primer Green** (primary / primary-light): primary buttons, the brand mark tile, the day numeral in the Next-climb date, open slot segments, reassurance and contact icons, success messages. Hover shifts to **Primer Green Hover**. **Green Wash** (primary-muted) tints selected booking options, the estimated-total box and the "Easy" difficulty pill.

### Secondary
- **Link Blue** (accent / accent-light): text links, "+N more dates" and "See all" links, the focus ring (2px outline, 2px offset), focused field borders, the private-group box border (at 40%) and its pill, the selected date badge. Hover shifts to **Link Blue Hover**. **Blue Wash** (accent-muted) marks checked safety confirmations.

### Tertiary
- **Trail Amber** (warning / warning-light): only for scarcity and ratings. Slot meters at 3 or fewer open slots turn amber, as do "Only N slots left" labels, "Moderate" pills, required badges and review stars.
- **Signal Red** (danger / danger-light): "Full" slot labels, "Hard" difficulty pills, form errors.

### Neutral
- **Dimmed Slate Ground** (background): the page. Light: **Soft Paper** (background-light).
- **Slate Surface** (surface): box header rows, alternating section bands (Inclusions, Photos, Contact), FAQ list ground, active nav pill.
- **Raised Slate** (surface-elevated): box bodies, review cards, the contact form, the phone booking bar.
- **Well Slate** (input-bg): form field wells, darker than the page in dark mode and white in light mode.
- **Dimmed Ink** (foreground): headings and body. Light: **Soft Ink**.
- **Quiet Ink** (muted): descriptions, meta text, inactive nav, field labels inside spec strips.
- **Slate Rule** (border): every box edge, divider, hollow slot segment and the scrollbar thumb.

### Named Rules
**The Green Acts, Blue Goes Rule.** Green means "do this" (book, send, confirm) and blue means "go there" (links, focus). Never use a blue button for the main action or a green text link.

**The Scarcity Colour Rule.** Amber appears only when something is running out or being rated, and red only when something is full or wrong. Neither is decoration.

**The Two-Theme Token Rule.** Never hardcode a hex in a component. Every colour is a custom property with a dark and a light value, and alpha tints use `/opacity` on the token (for example border-accent/40).

## Typography

**Display Font:** Outfit (with system-ui, sans-serif), weights 500 to 800
**Body Font:** DM Sans (with system-ui, sans-serif), weights 400 to 700

**Character:** Outfit's geometric, slightly condensed numerals carry headings, dates and prices with weight. DM Sans keeps body copy and UI labels quiet and readable at small sizes. All headings get -0.01em tracking, 1.15 line-height and balanced wrapping; paragraphs get pretty wrapping.

### Hierarchy
- **Display** (Outfit 800, 2rem on phones rising to 3.5rem at lg, 1.02): the single landing headline.
- **Numeral** (Outfit 800, 3.5rem on phones to 3.75rem, 0.85, tabular): the Next-climb month and day. Prices use Outfit 700 at 1.875rem.
- **Headline** (Outfit 700, 1.5rem on phones to 1.875rem, 1.15): section headings (h2). Legal pages use 1.875rem to 2.25rem at weight 800 for h1.
- **Title** (Outfit 700, 1.125rem to 1.5rem, 1.15): h3 inside sections and boxes. Legal h2 is 1.1875rem at 700.
- **Body** (DM Sans 400, 15px, 1.55): base body. Section descriptions and box copy run at 14px with 1.625 line-height; FAQ answers cap at 68ch; legal prose is 15px at 1.7.
- **Label** (DM Sans 500 to 600, 13px): box header titles, nav links, form labels, meta rows, slot-meter wording.
- **Caption** (DM Sans 500 to 600, 11px to 12px, sentence case): spec-strip labels, pill text, contact channel labels, the "On this page" spec label.

### Named Rules
**The Tabular Numbers Rule.** Every date, slot count, price and booking reference uses tabular figures so the numbers don't jitter as they change.

**The Sentence-Case Label Rule.** Small labels are sentence case, xs to 13px, semibold, muted. No tracked uppercase labels, and no label sits above a heading as an eyebrow.

## Layout

The page is a stack of full-width bands, each closed by a 1px bottom border, alternating between background and surface grounds. Content sits in a centred max-width 72rem (max-w-6xl) container with 16px gutters on phones and 24px from sm. Sections pad 40px vertically on phones and 56px from sm. Inside a band, a heading is followed by a 14px muted description (4px gap), then content 20px to 24px below.

Layouts are phone-first single columns that split at md or lg into asymmetric two-column grids (about 1fr to 2fr or 1fr to 1.6fr). The hero uses named grid areas: title, Next-climb box and body stack on phones, and from md the box moves to a fixed 25rem column right of the headline. Spec strips are 3 columns on phones and 5 from sm, built as 1px gap-on-border grids inside a rounded frame. Inclusion lists become a segmented tab control on phones and three boxes from md.

**Tap targets.** Buttons get a 44px minimum height on coarse pointers only (`pointer: coarse`), so desktop stays compact at 36px to 40px. Inputs drop to 16px font below 640px to stop iOS focus zoom.

**Sticky chrome.** The header is a sticky 56px bar with 80% to 90% background and backdrop blur; anchor scrolling offsets 4.5rem for it. On phones (below 768px) a fixed bottom booking bar slides up once the hero Book button scrolls away, names the next date and slots left, and slides back down while the contact form is on screen. Pages with the bar add 68px plus the safe-area inset of bottom padding.

### Named Rules
**The Band-and-Rule Rule.** Sections are separated by a 1px Slate Rule and a ground change, never by decorative dividers or large empty gaps.

## Elevation & Depth

Depth comes mainly from tonal layering: page ground, then surface for header rows and bands, then raised surface for box bodies. One soft shadow token exists, and it goes on the box that leads a page (the hero Next-climb box) and on the open phone menu. Everything else is flat with a 1px border.

### Shadow Vocabulary
- **Lead box, dark** (`box-shadow: 0 1px 0 rgba(0,0,0,0.2), 0 8px 24px -8px rgba(28,33,40,0.6)`): the hero Next-climb box and the open mobile menu.
- **Lead box, light** (`box-shadow: 0 1px 0 rgba(31,35,40,0.04), 0 3px 8px -2px rgba(31,35,40,0.08)`): same uses in light mode.
- **Hollow segment** (`box-shadow: inset 0 0 0 1.5px var(--border)`): taken slot segments only. This draws an outline; it does not add elevation.

### Named Rules
**The One Lifted Box Rule.** At most one box per view carries the shadow, and it is the one holding the primary action. Hover never adds shadow; hover changes border or ground.

## Shapes

One radius governs every rectangle: buttons, boxes, fields, badges, photo frames, nav pills, segmented controls (6px). Status and difficulty labels, step numbers and the theme toggle segments are fully round. Slot segments are 2px. Borders are always 1px Slate Rule, tinted with the role colour at 30% to 60% when a box carries meaning (private-group box in blue, total box in green). Boxes clip their children (overflow hidden) so header rows and divided lists meet the corners cleanly. Empty states use a dashed 1px border.

## Components

### Buttons
Compact and confident, GitHub-sized.
- **Shape:** gently rounded (6px).
- **Primary:** Primer Green fill, white semibold 14px text, 10px by 20px padding, 40px minimum height, 8px icon gap. Full-width at 15px with 12px vertical padding for the hero Book button.
- **Primary small:** same fill at 6px by 14px, 36px minimum height; header "Book a climb", phone header "Book", sticky-bar "Book now".
- **Hover / Focus:** fill shifts to Primer Green Hover (colour transition only); focus shows the 2px Link Blue outline at 2px offset. Disabled drops to 40% (60% for the small variant) opacity.
- **Secondary:** Raised Slate fill, 1px Slate Rule border, foreground text; hover darkens the border to Quiet Ink. Used for "Request a private climb" and "Ask about dates".
- **Text links:** Link Blue, 13px medium, underline on hover with a 3px offset and 1px thickness, often trailed by a 14px arrow icon.

### Label pills
- **Style:** fully round, 11px to 12px semibold, 2px by 8px padding. Difficulty pills use a wash plus role text (Easy green, Moderate amber, Hard red). Outline pills use a 1px role border at 30% to 40% with role text ("Private group" in blue, slots-left in green, low slots in amber).
- **State:** pills are informational and are never clickable.

### Box and box header
The core container, the GitHub "Box".
- **Corner Style:** 6px, clipped.
- **Background:** Raised Slate body; header row on Slate Surface.
- **Border:** 1px Slate Rule outside, 1px Slate Rule under the header row; inner lists divide with 1px rules.
- **Header row:** 10px by 16px, flex row with the title on the left (13px semibold, with an optional 16px muted icon) and meta on the right (12px muted).
- **Internal Padding:** 16px on phones, 20px from sm.
- **Shadow Strategy:** flat, apart from the lead box (see Elevation).

### Slot meter (signature)
- **Structure:** a grid with one column per slot, 3px gaps, 10px tall segments (8px compact) with 2px corners.
- **States:** open segments are filled Primer Green; taken segments are hollow with a 1.5px inset Slate Rule. With 3 or fewer open, the open segments turn Trail Amber and the label reads "Only N slots left" in amber. At zero the label reads "Full" in red.
- **Words always:** a 13px (12px compact) semibold tabular label sits under the bar: "N of M slots left". The segments are aria-hidden; the words carry the meaning.
- **Motion:** on the hero meter only, open segments scale up from 25% height and fade in from 35% opacity, once on first paint (700ms, cubic-bezier(0.16, 1, 0.3, 1), staggered 55ms per segment after a 250ms delay). Under reduced motion they render settled.

### Inputs / Fields
- **Style:** Well Slate background, 1px Slate Rule border, 6px corners, 8px by 12px padding, 14px text, muted placeholder, primary-green caret. Labels sit above in 13px medium foreground with a 4px gap.
- **Focus:** border turns Link Blue with a 2px Link Blue ring at 25%.
- **Error:** a red 14px message below the form; success is a green line with a check icon.

### Navigation
- **Desktop (md+):** 13px medium links in 6px-cornered pills, muted at rest, foreground on hover; the current section (tracked on scroll) gets a Slate Surface pill. A 1px vertical rule separates links from the owner link, theme toggle and Book button.
- **Phone:** brand plus a small Book button and a 36px menu button. The menu drops below the header as a two-column grid of 15px links on the background with the lead shadow, over a 30% black backdrop, and closes on Escape.
- **Brand:** a 28px green 6px-cornered tile with the peak icon, plus the name in Outfit 700 at 17px.

### Lists and FAQ
Divided lists inside a bordered, rounded frame, not separate cards. FAQ items are native details elements (one open at a time) with 14px semibold questions, a chevron that rotates 180 degrees, and a Raised Slate hover.

### Legal prose
Long-form terms and privacy pages use a 15rem sticky table of contents beside the text on lg (a collapsible box on phones), sections spaced 32px apart, 1.1875rem bold h2s with a 5rem scroll margin, 15px body at 1.7 line-height in ink mixed 82% toward muted, disc lists with muted markers, and underlined Link Blue links.

### Icons
One stroke set: 24px grid, 1.75 stroke, round caps and joins, currentColor, drawn as inline SVG paths. Sizes are 14px in meta rows, 16px in buttons and headers, 18px to 20px for menu and contact rows. Decorative icons are aria-hidden; standalone icons carry a title.

### Photo frames
Album photos sit in 4:3, 6px-cornered frames on Raised Slate with object-fit cover. The thumbnail strip is sized to the number of photos. Built-in sample albums are captioned "Sample album · stock photos" and never featured as the latest climb.

## Do's and Don'ts

### Do:
- **Do** put the main action in a Primer Green button and every navigational link in Link Blue.
- **Do** group related content in a Box with a tinted header row, and divide items inside it with 1px rules.
- **Do** use 6px corners on every rectangle and full rounding only for pills, step numbers and toggles.
- **Do** spell out slot counts in words beside every slot meter, and use tabular figures for dates, slots and prices.
- **Do** keep 44px minimum tap targets on coarse pointers only, and 16px inputs on phones.
- **Do** define every new colour as a custom property with both a dark-dimmed and a softened-light value.
- **Do** draw icons from the single 24px, 1.75-stroke inline SVG set.
- **Do** label built-in sample albums "Sample album · stock photos" and keep them out of featured slots.
- **Do** gate any new motion behind `prefers-reduced-motion: no-preference`; the slot-meter entrance is the only signature motion.

### Don't:
- **Don't** put eyebrow or kicker labels above headings, and don't use tracked uppercase micro-labels.
- **Don't** nest a bordered box or callout inside another box; use plain text, a divider or a header row instead.
- **Don't** lay gradient scrims or text over photos.
- **Don't** use unicode glyphs (check marks, stars, arrows, bullets) as icons; use the SVG set.
- **Don't** add a second shadowed box to a view, and don't add shadow on hover.
- **Don't** use amber or red for anything other than scarcity, ratings, full dates or errors.
- **Don't** introduce a radius other than 6px, full, or the 2px slot segment.
