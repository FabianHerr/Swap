# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Locals holding leftover foreign cash: students, newcomers, and people back from a trip who want to swap it in person with someone who needs it, instead of losing money to bank or exchange-kiosk fees. They use Swap to post what they have, find someone with the currency they want, and get in touch safely.

## Product Purpose

Swap connects two people who each hold the cash the other wants. Someone posts an offer ("I have 250 EUR, I want 370 CAD"), others browse open offers and send a swap request with a short note, and the owner accepts or declines. On accept, both people see each other's email and arrange the meet-up themselves. Success is a matched swap: an offer that goes from open to matched with both sides able to contact each other.

## Positioning

- Peer to peer, cash, in person: Swap never holds money, sets rates, or processes payments. Each person names both amounts on their own terms.
- Contact details are earned, not listed: an email is shown only after the offer owner explicitly accepts a request, and the server enforces it.
- Messy input becomes a structured draft (planned): a pasted sentence like "j'ai 250 euros, je veux 370 dollars canadiens" is parsed by rules first, AI only for ambiguity, and the person always confirms before anything is posted.

## Operating Context

- Flow: sign up → post an offer or browse → request swap (optional note, ≤280 chars) → owner accepts/declines, or requester cancels → contact revealed → meet offline.
- Statuses are the product's vocabulary. Offers: open, matched. Requests: pending, accepted, declined, cancelled.
- Current milestone: a 5-minute demo video for an internship application (LevelOps, due 2026-09-17), recorded with two browser windows logged in as different users.

## Capabilities and Constraints

- Stack: React 19 + Vite, plain CSS (Bricolage Grotesque and Figtree variable fonts, country-flag-icons), Motion for React (animation), react-icons (Phosphor); Express + MongoDB API; deployed on Vercel and Render.
- 20 supported currencies (USD, CAD, EUR, GBP, CHF, MXN, COP, ARS, CLP, PEN, BRL, DOP, HTG, MAD, XOF, JPY, CNY, INR, PHP, AUD), served by `GET /offer/currencies`. Every offer states both amounts (what you have and what you want); each is > 0 and ≤ 100,000,000, a junk guard sized for low-value currencies like COP and XOF.
- One accepted request per offer; accepting declines the other pending requests.
- Not built, and must not be implied: in-app chat, geolocation or distance, market exchange rates, reputation or ratings, identity verification, payments. The rate shown on a notice is the poster's own (want ÷ have), never a market rate.
- Languages: English and French. UI copy is English today; layouts must leave room for French strings. Translation is not built yet.

## Brand Commitments

- Name: Swap.
- Logo: `frontend/src/assets/logo.svg` (pink bubble lettering with a dark outline) is binding.
- Colors, typography, and layout are open beyond the logo. The current look (a friendly consumer app: soft cards and pill buttons in the logo's pink and plum, big round flags, animated feedback; explicitly not a finance or trading screen) is recorded in DESIGN.md.

## Evidence on Hand

- The working product itself: real flows, statuses, and validation messages.
- No real users, trade volumes, ratings, testimonials, savings figures, or exchange-rate data exist. Never fabricate them; demo data must read as demo data.

## Product Principles

1. Money details are never guessed silently: parsed or typed offers are shown for confirmation, and invalid fields are named, not hidden.
2. Contact is consent: personal details appear only after an explicit accept.
3. Every step is a visible status, so both people always know where a swap stands.
4. Scannable at a glance: what is offered, for what, by whom, and how recent.
