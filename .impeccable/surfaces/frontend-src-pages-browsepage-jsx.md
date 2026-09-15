---
version: 2
slug: "frontend-src-pages-browsepage-jsx"
primary_target: "frontend/src/pages/BrowsePage.jsx"
related_targets: ["frontend/src/pages/OfferPage.jsx","frontend/src/pages/RequestsPage.jsx","frontend/src/Login.jsx","frontend/src/Signup.jsx","frontend/src/TopMenu.jsx","frontend/src/ui.jsx"]
---

# Swap app surfaces (Offers, Post an offer, Requests, Log in / Sign up, sidebar shell)

Mode: Operate. Audience: locals with leftover foreign cash deciding whether to swap with a stranger. Task: scan open offers, post one, request one, accept one, get contact. Also recorded in split-screen for a 5-minute demo video, so state changes must read on camera. Constraints: logo is binding; EN now, FR must fit; no chat, market rates, ratings, or distance implied. Avoid: childish or scrappy, generic template, anything that reads as AI-generated ("vibe coded"), a finance/stock-market look, or crowded.

## Direction contract

THESIS: Swap is a calm, precise, product-grade tool for trading leftover cash with real people — closer
to a well-made productivity app than a marketplace. Every offer still reads like a simple quote, "You get
250 EUR, you give 370 CAD", at the rate the poster set; the interface's job is to get out of the way of
that sentence.

OWN-WORLD: A light system built around a fixed left sidebar, a centered 1120px content column, and
master-detail lists everywhere there's a collection to browse. Hairline borders (`--line` / `--line-strong`)
and whitespace do the structural work that used to belong to shadows and pill shapes; the only shadow left
is a near-invisible hairline. Geist for all UI text, Geist Mono for eyebrows/tabs/tags/meta/numbers.
Swap Pink `#FB64B2` is the only accent, used as a fill (with ink text) for exactly one primary button per
view; `#C2267A` is the only color used for pink *text* and links, so it passes contrast. Radii are 8px for
buttons/inputs/tags/cards, 10-12px for panels — no pills, no circles except flags and avatars. Full tokens,
shape rule and anti-patterns in DESIGN.md; shared motion in `frontend/src/motion.js`.

STORY: A visitor lands on Offers under two mono section tabs (Market / Your offers), reads a one-sentence
headline and a real offer count, filters by currency pair or searches, then scans a column of compact
list cards. Selecting one opens a sticky detail panel with the full quote, the poster's honest member
fact, and either a pink "Request swap" button or (if already asked) a plain status line with a quiet
"View in Requests" link — never both, so a live action and a settled outcome never look alike. The note
composer opens inline inside the detail panel, not a floating popover. Requests mirrors the same
master-detail shape with Received/Sent tabs, real stat tiles, and Accept/Decline/Cancel in the same
action-row slot; accepting reveals the counterpart's email as a plain mailto link under a "CONTACT" eyebrow.

FIRST VIEWPORT: A 240px sidebar (logo, three nav items with a pink-tint sliding fill on the active one,
user + Log out pinned to the bottom) beside a centered column: a big headline ending in a period, a muted
two-line sub, a mono offer count, section tabs with a sliding pink underline, a search field plus a
bordered currency-pair filter, then the 420px list / sticky detail-panel split. Below 900px the sidebar
collapses into a 60px top bar with a hamburger drawer; below 760px the list and detail panel become
mutually exclusive with a "Back to list" affordance, and the currency filter stacks.

FORM: 2026-09-14 to 2026-09-15. Revisions 1-5 (recorded previously) built and then corrected a warm,
blush-and-pill "friendly consumer app" look (Bricolage/Figtree, soft cards, pink pills, a fit-to-screen
offer grid) after early feedback that it read as a finance/trading screen. Sixth revision (this one): the
user rejected that entire direction on sight — "blush canvas, soft 26px cards, pill buttons" — and asked
for a from-scratch rebuild in the structure and style of a reference dark-theme career app ("resumax"),
translated to light, keeping only Swap's logo, name and pink accent. This replaced the frosted top bar
with a fixed left sidebar (`TopMenu.jsx` now renders `<aside class="sidebar">`, with a mobile drawer);
replaced the fit-to-screen offer grid and `OfferCard` board with a master-detail list (`ListCard` +
sticky detail panel) shared by Offers and Requests; introduced mono/uppercase section tabs
(`SectionTabs`), a `Hero` page header (big headline + muted sub + mono meta + hairline divider), mono
eyebrows ("ABOUT THIS SWAP", "NOTE", "CONTACT"), bordered mono tags for status/counts, an inline request
composer inside the detail panel (replacing the popover-over-the-card), and real stat tiles on Requests
(Pending/Accepted/Declined/Cancelled, computed from the loaded list, never invented). Swapped
Bricolage Grotesque + Figtree for Geist + Geist Mono; deleted `useFitGrid.js` (no longer needed once
lists stopped being a self-sizing grid). Kept: viewer-side "You get / You give" vs "You have / You want"
labeling, flags (now paired in a `FlagPair` tile), the currency pair filter (restyled as bordered selects),
the sealed/open contact slot, the honest `memberFact` line, the example offer on Log in (now explicitly
labeled "EXAMPLE" in a non-interactive split-screen intro with no sidebar). Two real layout bugs were
found and fixed during mobile QA: a margin-collapse between `.app` and `.content-area` that pushed the
mobile top bar's logo out of view (fixed with `display: flow-root` on `.app`), and `.filters-search`'s
`flex: 1 1 260px` becoming a *height* basis once `.filters` switches to `flex-direction: column` below
760px, ballooning the search field to 260px tall (fixed with `flex: none` on that breakpoint).

Motion: nothing exceeds 250ms and nothing uses spring bounce (down from the previous system's bouncy
"just-posted" celebration and 300ms ceiling). The sidebar's active-item fill and the section tabs'
underline slide via `layoutId` on a critically-damped spring (0.35s, bounce 0); list cards fade up 6px
over 200ms staggered 25ms (capped at 8); the detail panel crossfades 150ms on selection change and never
animates on hover or keyboard-arrow moves; the inline composer opens with a 4px lift over 150ms; buttons
scale to 0.98 on press; pages fade only. Reduced motion drops all of the above to opacity/color fades.
