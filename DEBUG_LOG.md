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
