# Debug log

Short notes on things that broke while finishing Swap: symptom → what I checked → cause → fix.

## 2026-09-14: Backend "works" locally but would crash on any clean install
- **Symptom:** `authController.js` requires `bcrypt`, but `package.json` only lists `bcryptjs`. Expected a crash on boot, but the server started fine.
- **Checked:** `node -e "console.log(require.resolve('bcrypt'))"` → `/Users/.../repos/node_modules/bcrypt`. `npm ls bcrypt` → not a dependency of this project.
- **Cause:** Node walks up parent folders looking for `node_modules`. A stray `node_modules` in `~/repos` (another project) supplied `bcrypt`, so it only worked on this machine. Render or a teammate's clone would fail with `Cannot find module 'bcrypt'`.
- **Fix:** `require("bcryptjs")`, the package actually declared. Lesson: "it runs" isn't proof the dependency is really there. Check what actually got loaded.

## 2026-09-14: MongoDB won't connect: `querySrv ENOTFOUND`
- **Symptom:** Server starts, then `MongoDB Connection Error: querySrv ENOTFOUND _mongodb._tcp.swap-cluster...mongodb.net`.
- **Checked:** Is it my network? `dig A google.com` and `dig SRV _imaps._tcp.gmail.com` both resolve, so DNS and SRV lookups work. `dig SRV` for the cluster → `NXDOMAIN`, answered by mongodb.net's own nameserver.
- **Cause:** The Atlas cluster was **paused**, not deleted. Atlas pauses free clusters that sit idle (this project had been idle since January), and a paused cluster's SRV records stop resolving, which looks exactly like a deleted one from the client side.
- **Fix:** Resumed the cluster from the Atlas dashboard; the original `MONGO_URI` worked again. (My first reading was "the cluster is gone, make a new one". Worth correcting here: `NXDOMAIN` on an Atlas SRV record means "not reachable right now", not "does not exist" - check the dashboard before rebuilding anything.) Also noted: the server keeps listening even when the DB is down, so requests just hang. That's the reason for a `/health` endpoint that reports DB state.

## 2026-09-14: A normal Colombian peso offer was rejected as "too much"
- **Symptom:** After adding a "want" amount to offers, posting "Have 400 CAD, want 1,150,000 COP" failed with `Amount can't be more than 1,000,000`.
- **Checked:** The request was valid, and 400 CAD really is about 1.15M COP. The limit is one number in `validateOffer.js`, applied to every currency.
- **Cause:** I picked the 1,000,000 cap thinking in dollars. For low-value currencies (COP, CLP, XOF, JPY), ordinary cash amounts run into the millions. It went unnoticed while offers stored only one amount, because nobody typed a COP amount.
- **Fix:** Raised the cap to 100,000,000, which still stops junk like `9999999999`. Lesson: a limit that doesn't know the unit isn't a business rule, it's a guess. Test with the currencies your users actually carry.

## 2026-09-15: The AI fallback failed on every call: `404` from Gemini
- **Symptom:** With a fresh Gemini key, `npm run eval:parser -- --llm` reported all 6 ambiguous cases as `failed`. The logs showed `{"event":"llm_error","model":"gemini-2.5-flash","status":404}`.
- **Checked:** A 404 usually means a wrong URL, so I listed the models the key can use (`GET /v1beta/models`): `gemini-2.5-flash` was still listed. Calling it directly returned the actual reason: "This model is no longer available to new users."
- **Cause:** Model names get retired, and a new key can be refused a model an older key still reaches. The model name was hardcoded, and the parser treated the failure as "AI unavailable". That's correct for users, but it meant the rules fallback quietly hid a broken integration.
- **Fix:** Default to `gemini-3.6-flash`, overridable with `GEMINI_MODEL`, and try `gemini-3.5-flash-lite` once on a 503/429, all within the same 8s budget. Every failure logs the model and status. Lesson: a graceful fallback also hides the failure, so log it where you'll actually look.

## 2026-09-15: The AI "resolved" an ambiguous currency without saying so
- **Symptom:** `100 francs for 90 euros` came back complete, with `giveCurrency: CHF` and no warning. The eval failed it: "ambiguous text came back with no warning".
- **Checked:** The prompt says to return null for a word that could mean several currencies. The rules had correctly flagged "francs" as CHF or XOF. The model picked CHF anyway.
- **Cause:** Instructions to a model are a request, not a guarantee. Nothing after the model checked whether it had followed the rule.
- **Fix:** Validate after the model, using what the rules already know. When the text only contains an ambiguous word and the model returns a specific code for it, the field is kept but carries a warning ("Read "francs" as CHF. Check that's the one you mean."). Amounts the model returns that aren't written in the text are dropped. The eval now checks this on every run.

## 2026-09-15: "find me a match for 300 USD, I want 400 CAD" couldn't tell have from want
- **Symptom:** The new assistant eval failed one case: the rules gave up on direction and asked the LLM, for a sentence that says "I want" outright.
- **Checked:** Printed the cue the parser picked before each currency. Before "300 USD" it was "for", from "a match **for**", which counts as a *want* cue ("250 EUR **for** 370 CAD"). Before "400 CAD" it was "want". Two want cues contradict each other, so the parser flagged it.
- **Cause:** Every cue counted the same. Little connectors like "for", "to" and "=" only hint at a side, but they carried as much weight as "I want" or "I have". Put in front of a new sentence shape (assistant requests start with "find me a match for…"), the hint won. The same bug misread "want 50 USD for my 70 CAD".
- **Fix:** Connectors are weak cues. When the cues contradict, the parser retries with only explicit words (want, need, have, selling…). Both sentences are now fixtures (parser 28/28, assistant 18/18). Lesson: reusing a parser in a new feature is a new input distribution, so rerun the evals with that feature's phrasing.

## 2026-09-15: On phones, nothing in the menu drawer could be tapped
- **Symptom:** While testing the assistant at 390px, the agent found that tapping "Ask Swap" in the mobile menu did nothing. So did "Offers", "Requests" and "Log out". The drawer opened fine, but every tap closed it instead.
- **Checked:** `document.elementFromPoint()` at the center of each link returned `.sidebar-backdrop`, not the link. Both the drawer and the backdrop had `z-index: 40`.
- **Cause:** The drawer is inside `.sidebar`, which is `position: fixed; z-index: 30`, so the sidebar forms its own stacking context. The drawer's 40 only ranks it *inside* the sidebar. The backdrop is a sibling of the sidebar at 40, so it painted above the whole sidebar, drawer included. Equal numbers in different stacking contexts aren't comparable.
- **Fix:** Backdrop at `calc(var(--z-sidebar) - 1)`. It already starts below the 60px top bar, so it still dims the page and still closes the drawer when tapped. Verified that every drawer link is the top element under its own center, and that tapping a link navigates and closes the drawer.
