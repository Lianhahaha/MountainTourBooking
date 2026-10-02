---
name: Tikling Apo Tours
description: Mt. Apo group and private climbs, booked from a phone, in GitHub's own Primer world.
colors:
  background: "#0d1117"
  foreground: "#e6edf3"
  surface: "#161b22"
  surface-elevated: "#21262d"
  muted: "#8b949e"
  border: "#30363d"
  input-bg: "#0d1117"
  primary: "#238636"
  primary-hover: "#2ea043"
  primary-foreground: "#ffffff"
  primary-muted: "rgba(46, 160, 67, 0.15)"
  success: "#3fb950"
  accent: "#4493f8"
  accent-hover: "#58a6ff"
  accent-muted: "rgba(56, 139, 253, 0.15)"
  done: "#a371f7"
  done-muted: "rgba(163, 113, 247, 0.15)"
  tab-active: "#f78166"
  warning: "#d29922"
  warning-muted: "rgba(187, 128, 9, 0.15)"
  danger: "#f85149"
  danger-muted: "rgba(248, 81, 73, 0.15)"
  background-light: "#ffffff"
  foreground-light: "#1f2328"
  surface-light: "#f6f8fa"
  surface-elevated-light: "#ffffff"
  muted-light: "#656d76"
  border-light: "#d0d7de"
  input-bg-light: "#ffffff"
  primary-light: "#1a7f37"
  primary-hover-light: "#2da44e"
  primary-muted-light: "rgba(26, 127, 55, 0.12)"
  success-light: "#1a7f37"
  accent-light: "#0969da"
  accent-hover-light: "#0550ae"
  accent-muted-light: "rgba(9, 105, 218, 0.12)"
  done-light: "#8250df"
  done-muted-light: "rgba(130, 80, 223, 0.12)"
  tab-active-light: "#fd8c73"
  warning-light: "#9a6700"
  warning-muted-light: "rgba(154, 103, 0, 0.12)"
  danger-light: "#cf222e"
  danger-muted-light: "rgba(207, 34, 46, 0.12)"
typography:
  display:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "3.5rem"
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
    backgroundColor: "{colors.background}"
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
  label-pill-private:
    backgroundColor: "{colors.done-muted}"
    textColor: "{colors.done}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  slot-segment:
    backgroundColor: "{colors.primary}"
    rounded: "{rounded.seg}"
    height: "10px"
  header-bar:
    backgroundColor: "{colors.surface}"
    height: "56px"
  section-tab:
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
  section-tab-active:
    textColor: "{colors.foreground}"
  section-tab-underline:
    backgroundColor: "{colors.tab-active}"
    rounded: "{rounded.full}"
    height: "2px"
  counter-pill:
    textColor: "{colors.foreground}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "0 6px"
    height: "18px"
---

# Design System: Tikling Apo Tours

## Overview

**Creative North Star: "The Trail Repo"**

The site uses GitHub's own Primer theme, unaltered: the standard GitHub dark palette by default, the standard GitHub light palette as the alternative, bordered boxes with surface-tinted header rows, 6px corners, small label pills, underline tabs with a coral marker, green for the action you take and blue for the link you follow. The owner pinned this theme and asked for GitHub's palette itself. New colours are welcome only when they are GitHub colours doing a GitHub job: the purple "done" hue marks private group climbs and the coral tab hue marks the active section tab.

Density is compact and phone-first. Body text is 15px, labels are 13px, and the Next-climb box carries date numerals, a slot meter, the price and a Book button above the fold at 390x844. The landing page reads like a repository page: a surface-coloured header bar, a sticky row of section tabs with counters, then sections that share one canvas and are separated by 1px rules. Information sits in boxes and divided lists rather than in floating cards. Photos sit in plain 6px-cornered frames with no scrims or overlays. Depth comes from the canvas-and-surface pairing plus a single shadow kept for the box that leads a page.

The one signature is the segmented slot meter: one segment per slot, open slots filled and taken slots hollow, with the count always spelled out in words beside it. It is the only moving element. Open segments press in once on first paint.

**Key Characteristics:**
- Standard GitHub Primer palette and vocabulary: green primary buttons, blue links, bordered boxes, label pills, underline tabs.
- GitHub dark is the default, GitHub light the alternative; every colour is a CSS custom property that swaps per theme.
- Boxes follow GitHub: canvas body, surface header row. Sections share one canvas, divided by 1px rules.
- One radius (6px) for everything rectangular; pills are fully round; slot segments are 2px.
- Outfit for headings and numerals, DM Sans for everything else.
- One motion moment (the slot meter), and it respects reduced motion.

## Colors

GitHub's own neutral canvas with one green action colour, a brighter green for success text, one blue link colour, GitHub's purple and coral for two narrow jobs, and amber and red kept for slot scarcity and errors. Dark values are canonical; each has a `-light` sibling in the frontmatter, and the CSS swaps them on the `.dark` class.

### Primary
- **GitHub Green** (primary / primary-light): primary buttons, the brand mark tile, open slot segments, the "Easy" difficulty pill text. Hover shifts to **GitHub Green Hover** (primary-hover). **Green Wash** (primary-muted) tints selected booking options, the estimated-total box and the "Easy" pill.
- **Success Green** (success / success-light): green as text and icon rather than fill. The day numeral in the Next-climb date and in every date row, "Next" date pill text, reassurance and credential check icons, the Included list icons, contact channel icons, success messages.

### Secondary
- **Link Blue** (accent / accent-light): text links, "+N more dates" and "Ask something else" links, the focus ring (2px outline, 2px offset), focused field borders, Pack list icons, the selected date badge. Hover shifts to **Link Blue Hover**. **Blue Wash** (accent-muted) marks checked safety confirmations.

### Tertiary
- **Done Purple** (done / done-light): private group climbs only. The private-group box border (at 40%), the "Private group" pill (Purple Wash fill, done-muted, with a 40% purple border) on the landing page and in the booking form.
- **Tab Coral** (tab-active / tab-active-light): only the 2px underline beneath the active section tab.
- **Trail Amber** (warning / warning-light): scarcity and ratings. Slot meters at 3 or fewer open slots turn amber, as do "Only N slots left" labels, "Moderate" pills, required badges and review stars.
- **Signal Red** (danger / danger-light): "Full" slot labels, "Hard" difficulty pills, form errors.

### Neutral
- **Canvas** (background): the page, every box body, review cards, the FAQ and contact lists, spec-strip cells. Light: **Canvas White** (background-light).
- **Surface** (surface): the header bar, box header rows, the phone menu, the phone booking bar, the contact form panel, segmented-control tracks, credential chips, row hover ground.
- **Raised Surface** (surface-elevated): secondary buttons, the selected segment in segmented controls, photo frames, hovered booking options.
- **Field Well** (input-bg): form field wells; matches the canvas in both themes.
- **Ink** (foreground): headings and body.
- **Quiet Ink** (muted): descriptions, meta text, inactive nav and tabs, icons in tabs and menus, spec-strip labels.
- **Rule** (border): every box edge, section divider, hollow slot segment and the scrollbar thumb.

### Named Rules
**The Green Acts, Blue Goes Rule.** Green fill means "do this" (book, send, confirm) and blue means "go there" (links, focus). Never use a blue button for the main action or a green text link. Success Green marks confirmation and the date numeral, never a link.

**The One Job Per Accent Rule.** Purple marks private group climbs and coral marks the active tab; neither appears anywhere else. A new colour enters only as a GitHub palette hue with one named job.

**The Scarcity Colour Rule.** Amber appears only when something is running out or being rated, and red only when something is full or wrong. Neither is decoration.

**The Two-Theme Token Rule.** Never hardcode a hex in a component. Every colour is a custom property with a GitHub dark and a GitHub light value, and alpha tints use `/opacity` on the token (for example border-done/40).

## Typography

**Display Font:** Outfit (with system-ui, sans-serif), weights 500 to 800
**Body Font:** DM Sans (with system-ui, sans-serif), weights 400 to 700

**Character:** Outfit's geometric, slightly condensed numerals carry headings, dates and prices with weight. DM Sans keeps body copy and UI labels quiet and readable at small sizes. All headings get -0.01em tracking, 1.15 line-height and balanced wrapping; paragraphs get pretty wrapping.

### Hierarchy
- **Display** (Outfit 800, 2rem on phones, 3rem at sm, 2.75rem at md where the hero splits, 3.5rem at lg, 1.02): the single landing headline.
- **Numeral** (Outfit 800, 3.5rem on phones to 3.75rem, 0.85, tabular): the Next-climb month and day. Date rows use the same treatment at 1.75rem. Prices use Outfit 700 at 1.875rem; spec-strip values use Outfit 700 at 15px to 16px.
- **Headline** (Outfit 700, 1.5rem on phones to 1.875rem, 1.15): section headings (h2). Legal pages use 1.875rem to 2.25rem at weight 800 for h1.
- **Title** (Outfit 700, 1.125rem to 1.5rem, 1.15): h3 inside sections and boxes. Legal h2 is 1.1875rem at 700.
- **Body** (DM Sans 400, 15px, 1.55): base body. Section descriptions and box copy run at 14px with 1.625 line-height; FAQ answers cap at 68ch; legal prose is 15px at 1.7.
- **Label** (DM Sans 500 to 600, 13px to 14px): box header titles, header links and section tabs (14px), form labels, meta rows, slot-meter wording.
- **Caption** (DM Sans 500 to 600, 11px to 12px, sentence case): spec-strip labels, pill text, tab counters, contact channel labels, menu group labels.

### Named Rules
**The Tabular Numbers Rule.** Every date, slot count, price, tab counter and booking reference uses tabular figures so the numbers don't jitter as they change.

**The Sentence-Case Label Rule.** Small labels are sentence case, 11px to 13px, semibold, muted. No tracked uppercase labels, and no label sits above a heading as an eyebrow.

## Layout

All sections share the page canvas. Each is closed by a 1px bottom rule; there are no tinted bands. Content sits in a centred max-width 72rem (max-w-6xl) container with 16px gutters on phones and 24px from sm. Sections pad 40px vertically on phones and 56px from sm. Inside a section, a heading is followed by a 14px muted description (4px gap), then content 20px to 24px below.

Layouts are phone-first single columns that split at md or lg into asymmetric two-column grids (about 1fr to 2fr or 1fr to 1.6fr). The hero uses named grid areas: title, Next-climb box and body stack on phones, and from md the box moves to a fixed 25rem column right of the headline. Inclusion lists become a segmented tab control on phones and three boxes from md.

**Responsive grids.** The hero spec strip is a 1px gap-on-border grid inside a rounded frame: 3 columns on phones, 5 at sm, back to 3 from md (where the hero splits and the text column narrows) and 5 again from xl. Whenever it runs 3 columns, the last cell spans 2 so the grid closes without a hole. Date rows stack on phones, form a 2x2 grid from sm (date and meet-up, slot meter and price with Book), and run as 4 columns from lg (8rem date, flexible details, 14rem meter, auto price and Book).

**Tap targets.** Buttons get a 44px minimum height on coarse pointers only (`pointer: coarse`), so desktop stays compact at 36px to 40px. Inputs drop to 16px font below 640px to stop iOS focus zoom.

**Sticky chrome.** The header is a sticky 56px solid Surface bar with a bottom rule. On the landing page the section tab bar sticks directly beneath it (at 56px) on the canvas at 95% with backdrop blur. Anchor scrolling offsets 6.75rem to clear both bars; legal headings keep a 5rem scroll margin. On phones (below 768px) a fixed bottom booking bar on Surface at 95% slides up once the hero Book button scrolls away, names the next date and slots left, and slides back down while the contact form is on screen. Pages with the bar add 68px plus the safe-area inset of bottom padding.

### Named Rules
**The One Canvas Rule.** Sections sit on the same canvas and are separated by a single 1px Rule, never by alternating tinted bands, decorative dividers or large empty gaps. Surface is for header rows and chrome, not for section backgrounds.

## Elevation & Depth

Depth comes from GitHub's pairing of canvas and surface: canvas for content, surface for header rows and chrome, raised surface for a selected segment or a secondary button. One shadow token exists. It goes on the box that leads a page (the hero Next-climb box), on the open phone menu, and on the selected segment of a segmented control. Everything else is flat with a 1px border.

### Shadow Vocabulary
- **Lead, dark** (`box-shadow: 0 0 0 1px #30363d, 0 8px 24px rgba(1,4,9,0.6)`): the hero Next-climb box, the open phone menu and the selected segment, dark mode. This is GitHub's dark overlay shadow, a 1px ring plus a deep drop.
- **Lead, light** (`box-shadow: 0 1px 0 rgba(31,35,40,0.04), 0 3px 6px rgba(140,149,159,0.15)`): same uses in light mode.
- **Hollow segment** (`box-shadow: inset 0 0 0 1.5px var(--border)`): taken slot segments only. This draws an outline; it does not add elevation.

### Named Rules
**The One Lifted Box Rule.** At most one box per view carries the shadow, and it is the one holding the primary action. The selected segment of a segmented control may carry it as a state marker. Hover never adds shadow; hover changes border or ground.

## Shapes

One radius governs every rectangle: buttons, boxes, fields, badges, photo frames, nav links, tabs, segmented controls (6px). Status and difficulty labels, tab counters, step numbers and the active-tab underline are fully round. Slot segments are 2px. Borders are always 1px Rule, tinted with the role colour at 30% to 60% when a box carries meaning (private-group box in purple, total box in green). Boxes clip their children (overflow hidden) so header rows and divided lists meet the corners cleanly. Empty states use a dashed 1px border.

## Components

### Buttons
Compact and confident, GitHub-sized.
- **Shape:** gently rounded (6px).
- **Primary:** GitHub Green fill, white semibold 14px text, 10px by 20px padding, 40px minimum height, 8px icon gap. Full-width at 15px with 12px vertical padding for the hero Book button.
- **Primary small:** same fill at 6px by 14px, 36px minimum height; header "Book a climb", phone header "Book" (13px), date-row "Book", sticky-bar "Book now".
- **Hover / Focus:** fill shifts to GitHub Green Hover (colour transition only); focus shows the 2px Link Blue outline at 2px offset. Disabled drops to 40% (60% for the small variant) opacity.
- **Secondary:** Raised Surface fill, 1px Rule border, foreground text; hover darkens the border to Quiet Ink. Used for "Request a private climb" and "Ask about dates".
- **Text links:** Link Blue, 13px medium, underline on hover with a 3px offset and 1px thickness, often trailed by a 14px arrow icon.

### Label pills
- **Style:** fully round, 11px to 12px semibold, 2px by 8px padding. Difficulty pills use a wash plus role text (Easy green, Moderate amber, Hard red). Outline pills use a 1px role border at 30% to 40% with role text ("Private group" in purple on Purple Wash, "Next" in success green, slots-left in green, low slots in amber).
- **State:** pills are informational and are never clickable.

### Box and box header
The core container, GitHub's "Box".
- **Corner Style:** 6px, clipped.
- **Background:** Canvas body; header row on Surface.
- **Border:** 1px Rule outside, 1px Rule under the header row; inner lists divide with 1px rules.
- **Header row:** 10px by 16px, flex row with the title on the left (13px semibold, with an optional 16px muted icon) and meta on the right (12px muted).
- **Internal Padding:** 16px on phones, 20px from sm.
- **Shadow Strategy:** flat, apart from the lead box (see Elevation).

### Slot meter (signature)
- **Structure:** a grid with one column per slot, 3px gaps, 10px tall segments (8px compact) with 2px corners.
- **States:** open segments are filled GitHub Green; taken segments are hollow with a 1.5px inset Rule. With 3 or fewer open, the open segments turn Trail Amber and the label reads "Only N slots left" in amber. At zero the label reads "Full" in red.
- **Words always:** a 13px (12px compact) semibold tabular label sits under the bar: "N of M slots left". The segments are aria-hidden; the words carry the meaning.
- **Motion:** on the hero meter only, open segments scale up from 25% height and fade in from 35% opacity, once on first paint (700ms, cubic-bezier(0.16, 1, 0.3, 1), staggered 55ms per segment after a 250ms delay). Under reduced motion they render settled.

### Inputs / Fields
- **Style:** Field Well background, 1px Rule border, 6px corners, 8px by 12px padding, 14px text, muted placeholder, primary-green caret. Labels sit above in 13px medium foreground with a 4px gap.
- **Focus:** border turns Link Blue with a 2px Link Blue ring at 25%.
- **Error:** a red 14px message below the form; success is a green line with a check icon.

### Navigation
- **Header bar:** a sticky 56px Surface bar with a bottom rule. Desktop links are 14px medium in 6px-cornered hit areas, muted at rest, foreground on hover with a Canvas hover ground; the current page is foreground. On the landing page the header keeps only cross-page links (Photos), then a 1px vertical rule, the owner link, the theme toggle and the "Book a climb" button; on other pages it also carries the home-section links.
- **Section tabs (landing page):** GitHub underline tabs in a sticky bar under the header. Each tab is a 16px muted icon, a 14px label and an optional counter pill (Dates, Reviews, FAQ), in a 6px-cornered hit area with a Surface hover ground. Inactive tabs are muted; the tab whose section is in view (scroll-spy) turns foreground semibold and gets a 2px fully round Tab Coral underline on the bar's bottom rule. On phones the row scrolls sideways with a hidden scrollbar and keeps the active tab in view.
- **Counter pill:** fully round, 18px tall, 20px minimum width, 12px medium tabular foreground text on Quiet Ink at 20%.
- **Phone:** brand plus a small Book button and a 36px bordered menu button. The menu drops below the header on Surface with the lead shadow, over a 40% black backdrop, and closes on Escape. It groups links under two caption labels, "On the home page" and "More", each a two-column grid of 15px links with 16px muted icons, then the owner link and a three-way theme segmented control.
- **Brand:** a 28px green 6px-cornered tile with the peak icon, plus the name in Outfit 700 at 17px.

### Segmented controls
The phone Inclusions switcher and the theme picker: a Surface track with a 1px Rule border, 4px inner padding and 6px corners; segments are 13px, muted at rest; the selected segment is Raised Surface, foreground, with the lead shadow.

### Lists and FAQ
Divided lists inside a bordered, rounded Canvas frame, not separate cards. FAQ items are native details elements (one open at a time) with 14px semibold questions, a chevron that rotates 180 degrees, and a Surface hover ground. Contact channel rows follow the same pattern.

### Legal prose
Long-form terms and privacy pages use a 15rem sticky table of contents beside the text on lg (a collapsible box on phones), sections spaced 32px apart, 1.1875rem bold h2s with a 5rem scroll margin, 15px body at 1.7 line-height in ink mixed 82% toward muted, disc lists with muted markers, and underlined Link Blue links.

### Icons
One stroke set: 24px grid, 1.75 stroke, round caps and joins, currentColor, drawn as inline SVG paths. Sizes are 14px in meta rows, 16px in buttons, headers, tabs and menus, 18px to 20px for contact rows and the menu button. Decorative icons are aria-hidden; standalone icons carry a title.

### Photo frames
Album photos sit in 4:3, 6px-cornered frames on Raised Surface with object-fit cover. The thumbnail strip is sized to the number of photos. Built-in sample albums are captioned "Sample album · stock photos" and never featured as the latest climb.

## Do's and Don'ts

### Do:
- **Do** put the main action in a GitHub Green button and every navigational link in Link Blue.
- **Do** group related content in a Box with a Canvas body and a Surface header row, and divide items inside it with 1px rules.
- **Do** separate landing sections with a single 1px Rule on the shared canvas.
- **Do** use 6px corners on every rectangle and full rounding only for pills, counters, step numbers and the tab underline.
- **Do** spell out slot counts in words beside every slot meter, and use tabular figures for dates, slots, prices and counters.
- **Do** keep 44px minimum tap targets on coarse pointers only, and 16px inputs on phones.
- **Do** define every new colour as a custom property with both a GitHub dark and a GitHub light value, taken from GitHub's palette and given one named job.
- **Do** draw icons from the single 24px, 1.75-stroke inline SVG set.
- **Do** label built-in sample albums "Sample album · stock photos" and keep them out of featured slots.
- **Do** gate any new motion behind `prefers-reduced-motion: no-preference`; the slot-meter entrance is the only signature motion.

### Don't:
- **Don't** put eyebrow or kicker labels above headings, and don't use tracked uppercase micro-labels.
- **Don't** shift or retint the GitHub palette values; use the standard GitHub dark and light tokens as shipped.
- **Don't** alternate section backgrounds or paint a section in Surface.
- **Don't** nest a bordered box or callout inside another box; use plain text, a divider or a header row instead.
- **Don't** lay gradient scrims or text over photos.
- **Don't** use unicode glyphs (check marks, stars, arrows, bullets) as icons; use the SVG set.
- **Don't** add a second shadowed box to a view, and don't add shadow on hover.
- **Don't** use purple for anything but private group climbs, coral for anything but the active tab, or amber and red for anything but scarcity, ratings, full dates and errors.
- **Don't** introduce a radius other than 6px, full, or the 2px slot segment.
