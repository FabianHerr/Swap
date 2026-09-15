# Design System: Swap

Swap lets people swap leftover foreign cash with each other. The interface reads as a calm, precise,
product-grade tool: a fixed left sidebar, hairline borders doing the structure (not shadows), monospace
type for eyebrows/tabs/tags/meta, one accent (Swap pink), and small radii throughout. It should feel
honest and unhurried, never a trading screen or a bank dashboard, and it must stay honest that Swap
never holds cash or sets rates. Source of truth for the values below: `frontend/src/styles.css` (look)
and `frontend/src/motion.js` (movement).

## 1. Visual Theme & Atmosphere

Light, precise, information-dense but generous. A left sidebar (fixed, 240px) separates navigation from
a centered content column (max 1120px). Section tabs sit at the top of each page in uppercase monospace
with a sliding pink underline. Master-detail is the default page shape for lists: a 420px column of
compact cards on the left, a sticky bordered panel on the right. Structure comes from 1px hairline
borders and whitespace, not shadows or gradients; the one shadow in the system is a near-invisible
hairline.

- **Density:** Information-dense but calm (5). Lists are compact; detail panels breathe with 24px padding.
- **Variance:** Very calm (2). One card shape, one panel shape, one button shape used everywhere.
- **Motion:** Quiet and quick (3). Nothing over 250ms, no bounce, no celebratory springs.

## 2. Color Palette & Roles

- **Page** (`--page` #FAFAFA): the canvas behind everything.
- **Sidebar** (`--sidebar` #F5F4F5): the left navigation rail.
- **Surface** (`--surface` #FFFFFF): cards, panels, inputs.
- **Surface tint** (`--surface-tint` / `--pink-tint` #FDEEF6): the selected list card and the active sidebar item's fill.
- **Line** (`--line` #E6E3E6) and **Line strong** (`--line-strong` #D9D5D8): all borders. Hairlines do the
  structural work that shadows and cards used to do.
- **Ink** (`--ink` #1C1419): body text, headlines.
- **Muted** (`--muted` #6B636A): secondary text, sub-lines, tab labels.
- **Faint** (`--faint` #757077, AA-checked at 4.84:1 on white): meta lines, placeholders, disabled icons.
- **Swap Pink** (`--pink` #FB64B2, hover `--pink-hover` #F94EA6): fills only (primary buttons, active tab
  underline, focus rings). Always paired with ink text on top of it, never pink text on pink.
- **Pink text** (`--pink-text` #C2267A): the only color used for pink TEXT and links, chosen to pass AA
  contrast on white and on the pink tint.
- **Status colors** (semantic, not accents): accepted/ok `--ok` #1A7A4C on `--ok-soft` #EAF7F0; pending
  `--pending` #9A6300 on `--pending-soft` #FBF1DE; danger `--danger` #B42318 on `--danger-soft` #FDECEA.
  Declined/cancelled use `--faint` text with no fill.

Shadows are near-zero: `--shadow-hairline: 0 1px 2px rgba(28,20,25,.06)`, used sparingly (e.g. nowhere
load-bearing; borders carry the weight). No card, panel or button uses a drop shadow for depth.

## 3. Typography Rules

- **Sans:** Geist Variable (`@fontsource-variable/geist`). All UI text, headlines, body copy.
- **Mono:** Geist Mono Variable (`@fontsource-variable/geist-mono`). Eyebrows, section tabs, tags, meta
  lines, and numeric values (stat tiles, counts).
- **Headlines:** page heroes are 28-48px (fluid, `clamp(1.75rem, 1.3rem + 1.6vw, 3rem)`), weight 650,
  letter-spacing -0.035em, one sentence ending in a period ("Swap the cash you have left over.").
- **Eyebrows/tabs/tags:** monospace, uppercase, 11-12px, letter-spacing 0.08-0.12em, muted grey; the
  active tab is ink with a 2px pink underline.
- **Body:** 14-15px, line-height 1.5-1.7. Sub-copy under a headline maxes out at ~560px / 1.7 line-height.
- **Sentence case** everywhere in real copy (headings, buttons, body). UPPERCASE monospace is reserved
  for eyebrows, tabs, tags and meta lines — it is a structural signal, not emphasis. No em dashes in UI copy.

## 4. Component Stylings

- **Shape rule:** 8px radius for buttons/inputs/tags/list cards, 10-12px for panels. No pills, no circles
  except flags and avatars (avatars are a 30%-radius squircle, flags are round).
- **Sidebar:** 240px, `--sidebar` background, 1px right border. Top: logo (the logo SVG already contains
  the "Swap" wordmark, so it renders alone with no adjacent text label) plus a mobile-only menu button.
  Nav items: 38px tall, 8px radius, icon + label, muted by default. The active item gets a pink 1px
  border, pink text/icon, and a `layoutId`-animated pink-tint fill that slides between items. A bottom
  group (avatar + name, Log out) sits below a hairline divider. Below 900px the sidebar becomes a 60px
  top bar (logo + hamburger) and the nav/user sections become a slide-in drawer with a dimmed backdrop
  (the backdrop starts below the top bar so the close button stays reachable).
- **Section tabs:** a hairline-bottomed strip; each tab is mono/uppercase/letter-spaced, muted; the active
  tab is ink with a `layoutId`-animated 2px pink underline.
- **Hero/page header:** a `Hero` component (headline + muted sub, optional top-right element, optional
  mono meta line, hairline divider below). Used with a full headline on Offers/Post-offer, and can be
  used without a headline (sub-line only) for a denser header.
- **Master-detail:** `list-col` (420px, compact `ListCard`s 10px apart) + `detail-col` (sticky panel).
  `ListCard`: 1px border, 10px radius, 16px padding, a leading tile (a `FlagPair` — two overlapping round
  flags in a rounded-square tile — or an `Avatar`), a 15px weight-600 title (ellipsis), a muted sub-line,
  and a small muted meta line (rate/status tag/time). Selected: 1.5px pink border + pink-tint fill,
  `aria-current="true"`. Below 760px the list and detail panel are mutually exclusive (`.master-detail`
  gets `.is-showing-detail` from JS); the detail panel gains a "Back to list" link-button.
- **Detail panel:** bordered, 24px padding, sticky. Header: a bigger tile (56px), a ~22px weight-600
  title, a sub-line with a small avatar, an optional meta line. Then an action row (buttons, never a
  status), or — once an action has a real, final outcome — a plain status line with an icon and a quiet
  pink "View" link (an outcome is text, an available action is always a button; the two never look alike).
  Then a hairline divider, a mono eyebrow ("ABOUT THIS SWAP", "NOTE", "CONTACT"), and content.
- **Inline composer:** the note form lives inside the detail panel under the action row (not a floating
  popover), with a hairline divider above it. Escape closes it and returns focus to the trigger button.
- **Buttons:** 8px radius, 36-48px tall, 14px, weight 500, icon + label optional. `.btn-primary` is pink
  fill + ink text — exactly one per view. `.btn-secondary` is a 1px border on white. `.btn-soft` is a
  filled neutral. `.btn-quiet` is text-only. `.btn-danger` is a red-bordered outline button (only to
  confirm a removal).
- **Tags:** mono/uppercase, 1px border, 8px radius (never pills). `tag-pink` for counts/badges tied to
  the viewer's own activity; `status-*` variants color only the text/border (accepted green, pending
  amber, declined/cancelled muted) — never a solid fill.
- **Empty state:** a dashed 1px border panel on the page background, centered content: a 48px bordered
  icon tile, a mono eyebrow, a 17px weight-600 title, a two-line muted sentence, one primary button.
- **Stat tiles:** bordered 10px-radius tiles in a 4-up (2-up, then 1-up on narrow) grid: a large mono
  number (28px) — pink only when it's the "accepted" tile — and a small muted label under it. Numbers are
  always the real count of the currently loaded/filtered list; never invented.
- **Loading:** skeleton `ListCard`s and a skeleton detail panel (bars breathing at 1.6s), shown only if
  the first load takes over 200ms.
- **Auth (Log in / Sign up):** no sidebar. A full-bleed split: a `--sidebar`-tinted left panel (logo,
  headline, muted lead, and a small non-interactive example list card + detail excerpt labeled "EXAMPLE")
  and a white right panel with the form in a bordered card. Below 900px the left panel is hidden and the
  form is centered alone.

## 5. Layout Principles

- Shell: sidebar fixed at 240px; `.content-area` gets `margin-left: 240px` and holds `.main`, which caps
  at 1120px and centers itself in the remaining space (`margin: 0 auto`) so wide monitors don't pin
  content to the sidebar's edge.
- Every page opens with a `Hero` (or a denser header) followed by section tabs where relevant, then
  page-specific content.
- Master-detail pages (Offers, Requests): 420px list + flexible sticky detail, gap 24px.
- Post offer: a bordered form panel (flexible width) beside a 360px sticky "Preview" column showing the
  same `ListCard` + detail-header components the real page uses, so the preview never drifts from reality.
- Below 900px: the sidebar becomes a 60px top bar + drawer; two-column pages (Post offer, Auth) stack.
- Below 760px: filters stack; master-detail becomes list-or-detail (JS-toggled), with a "Back to list"
  affordance in the detail panel.
- No horizontal scrolling at any width — verified at 390px.

## 6. Motion & Interaction

Timings live in `frontend/src/motion.js` and match the CSS tokens `--ease-out` / `--ease-in-out`.
`MotionConfig reducedMotion="user"` turns movement into fades for people who ask for less motion.
Nothing in the system exceeds 250ms, and nothing uses spring bounce.

- **Sidebar and tabs:** the active item's fill / the active tab's underline slide via `layoutId` with a
  critically-damped spring (`duration 0.35, bounce 0`).
- **Lists:** cards fade up 6px over 200ms, staggered 25ms apart, capped at 8 items.
- **Detail panel:** crossfades (`panelSwap`: opacity + 4px y, 150ms) when the selection changes. Never
  animates on a hover or a keyboard arrow move.
- **Composer / popovers:** open with a 4px lift over 150ms, close faster (100ms).
- **Buttons:** scale to 0.98 on press; no hover lift.
- **Pages:** fade only (opacity, 200ms) — pages are visited often.
- **Drawer:** slides in via `transform: translateX()` over 220ms; the backdrop fades in step.

## 7. Anti-Patterns (Banned)

- No pill buttons or circular chips (buttons/tags/inputs are 8px-radius rectangles). Circles are reserved
  for flags and avatars.
- No drop shadows for depth; hairline borders and fills do the structural work.
- No second accent color, no gradients, no neon glows.
- No photo avatars; initials-on-tint squircles only.
- No emojis, including flag emojis; flags are SVG (`country-flag-icons`).
- No spring bounce, no animation over 250ms, no motion on hover-only or keyboard-arrow selection changes.
- No market exchange rates, fees charged by Swap, ratings, distance, or verification badges; none exist.
  The rate shown is always the poster's own.
- No invented users, counts, or activity. Every number on screen (offer counts, stat tiles, tab badges)
  comes from real loaded data.
- Mono/uppercase is now a *structural* signal (eyebrows, tabs, tags, meta) — the old blanket ban on
  eyebrows and uppercase labels no longer applies, but sentence case still governs all real copy
  (headings, buttons, body text, error messages).
