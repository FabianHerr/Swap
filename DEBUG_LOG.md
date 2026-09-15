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
- **Cause:** The Atlas cluster no longer exists (the project sat idle since January), so the connection string in `.env` points at nothing.
- **Fix:** New free Atlas cluster + new `MONGO_URI`. Also noted: the server keeps listening even when the DB is down, so requests just hang. That's the reason for a `/health` endpoint that reports DB state.

## 2026-09-14: A normal Colombian peso offer was rejected as "too much"
- **Symptom:** After adding a "want" amount to offers, posting "Have 400 CAD, want 1,150,000 COP" failed with `Amount can't be more than 1,000,000`.
- **Checked:** The request was valid, and 400 CAD really is about 1.15M COP. The limit is one number in `validateOffer.js`, applied to every currency.
- **Cause:** I picked the 1,000,000 cap thinking in dollars. For low-value currencies (COP, CLP, XOF, JPY), ordinary cash amounts run into the millions. It went unnoticed while offers stored only one amount, because nobody typed a COP amount.
- **Fix:** Raised the cap to 100,000,000, which still stops junk like `9999999999`. Lesson: a limit that doesn't know the unit isn't a business rule, it's a guess. Test with the currencies your users actually carry.
