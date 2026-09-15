// End-to-end checks against a running API, over HTTP, the way the frontend talks to it.
//
//   API_URL=http://localhost:3002 node scripts/smoke.js
//
// It walks the flows that matter: register and log in, post an offer, request it, accept it, and the
// rule that contact details are released only after an accept. It creates its own throwaway accounts
// (swap-smoke-<timestamp>@example.com), so it is safe to run against a development database. Don't
// point it at production: it posts offers and requests as those accounts.
//
// Exits non-zero on the first failure, with the check that failed. CI runs this against a scratch
// MongoDB, so a pull request that breaks auth, ownership or the contact rule fails before review.
const API = process.env.API_URL || "http://localhost:3001";

let passed = 0;
const failures = [];

function check(name, ok, detail) {
  if (ok) {
    passed += 1;
    console.log(`  ok  ${name}`);
  } else {
    failures.push(name);
    console.log(`FAIL  ${name}${detail ? `\n      ${detail}` : ""}`);
  }
}

async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return { status: res.status, data };
}

const stamp = Date.now();
const person = (role) => ({
  name: `Smoke ${role}`,
  email: `swap-smoke-${stamp}-${role}@example.com`,
  password: "smoke-test-password",
});

async function main() {
  console.log(`Smoke testing ${API}\n`);

  const health = await call("GET", "/health");
  check("health reports the database is connected", health.status === 200 && health.data.mongo === 1, JSON.stringify(health.data));

  // --- Accounts
  const owner = person("owner");
  const requester = person("requester");
  const ownerReg = await call("POST", "/auth/register", { body: owner });
  check("register returns a token and the user", ownerReg.status === 201 && Boolean(ownerReg.data.token), `status ${ownerReg.status}`);
  check("register never returns the password hash", !JSON.stringify(ownerReg.data).includes("password"), JSON.stringify(ownerReg.data.user));
  const ownerToken = ownerReg.data.token;

  const dupe = await call("POST", "/auth/register", { body: owner });
  check("registering the same email again is a 409", dupe.status === 409, `status ${dupe.status}`);

  const wrongPass = await call("POST", "/auth/login", { body: { email: owner.email, password: "not-the-password" } });
  const unknown = await call("POST", "/auth/login", { body: { email: `nobody-${stamp}@example.com`, password: "whatever" } });
  check("wrong password and unknown email answer the same 401",
    wrongPass.status === 401 && unknown.status === 401 && wrongPass.data.message === unknown.data.message,
    `${wrongPass.status}/${unknown.status}`);

  const requesterReg = await call("POST", "/auth/register", { body: requester });
  const requesterToken = requesterReg.data.token;
  check("second account registers", requesterReg.status === 201 && Boolean(requesterToken));

  const me = await call("GET", "/auth/me", { token: ownerToken });
  check("the session can be restored from a token", me.status === 200 && me.data.user?.email === owner.email);
  check("a garbage token is rejected", (await call("GET", "/auth/me", { token: "not-a-token" })).status === 401);

  // --- Offers
  check("posting an offer without a token is rejected",
    (await call("POST", "/offer", { body: { giveAmount: 10, giveCurrency: "EUR", wantAmount: 15, wantCurrency: "CAD" } })).status === 401);

  const bad = await call("POST", "/offer", { token: ownerToken, body: { giveAmount: 0, giveCurrency: "XXX", wantAmount: 15, wantCurrency: "CAD" } });
  check("an invalid amount or currency is a 400", bad.status === 400, `status ${bad.status}`);

  const same = await call("POST", "/offer", { token: ownerToken, body: { giveAmount: 10, giveCurrency: "EUR", wantAmount: 15, wantCurrency: "EUR" } });
  check("swapping a currency for itself is a 400", same.status === 400, `status ${same.status}`);

  const created = await call("POST", "/offer", { token: ownerToken, body: { giveAmount: 250, giveCurrency: "EUR", wantAmount: 370, wantCurrency: "CAD" } });
  check("an offer is created", created.status === 201 && Boolean(created.data.offer?._id), `status ${created.status}`);
  const offerId = created.data.offer?._id;
  check("the offer records who owns it", created.data.offer?.ownerName === owner.name);

  const listed = await call("GET", "/offer?give=EUR&want=CAD");
  check("the new offer is listed under its currency pair", listed.data.offers?.some((o) => o._id === offerId));
  check("an unsupported currency filter is a 400", (await call("GET", "/offer?give=XXX")).status === 400);

  check("someone else cannot delete this offer",
    (await call("DELETE", `/offer/${offerId}`, { token: requesterToken })).status === 403);

  // --- Parsing (rules only: CI has no AI key, and the rules must carry it)
  const parsed = await call("POST", "/offer/parse", { token: ownerToken, body: { text: "j'ai 250 euros, je cherche 370 dollars canadiens" } });
  check("the parser reads a clear offer with rules alone",
    parsed.status === 200 && parsed.data.source === "rules" && parsed.data.complete
    && parsed.data.fields?.giveCurrency === "EUR" && parsed.data.fields?.wantAmount === 370,
    JSON.stringify(parsed.data));
  check("text with no amount is a 422", (await call("POST", "/offer/parse", { token: ownerToken, body: { text: "hello" } })).status === 422);
  const noRate = await call("POST", "/offer/parse", { token: ownerToken, body: { text: "I have 400 CAD, want pesos colombianos" } });
  check("a missing amount is flagged, never invented",
    noRate.data.complete === false && noRate.data.fields?.wantAmount === undefined
    && noRate.data.warnings?.some((w) => w.field === "wantAmount"),
    JSON.stringify(noRate.data.fields));

  // --- Assistant
  const matches = await call("POST", "/assistant", { token: requesterToken, body: { message: "I have 370 CAD and want 250 EUR" } });
  check("the assistant finds the offer as a match",
    matches.data.action === "find_matches" && matches.data.matches?.some((m) => m._id === offerId),
    JSON.stringify({ action: matches.data.action, total: matches.data.total }));
  check("a match carries its reasons", matches.data.matches?.[0]?.reasons?.length > 0);
  const ownerAsks = await call("POST", "/assistant", { token: ownerToken, body: { message: "I have 370 CAD and want 250 EUR" } });
  check("the assistant never matches you with your own offer", !ownerAsks.data.matches?.some((m) => m._id === offerId));
  check("an empty message is a 422", (await call("POST", "/assistant", { token: ownerToken, body: { message: "" } })).status === 422);

  // --- Requests and the contact rule
  check("you cannot request your own offer",
    (await call("POST", "/requests", { token: ownerToken, body: { offerId, message: "mine" } })).status === 400);

  const requested = await call("POST", "/requests", { token: requesterToken, body: { offerId, message: "Could meet near Jarry station." } });
  check("a request is sent", requested.status === 201, `status ${requested.status}`);
  const requestId = requested.data.request?._id;
  check("requesting the same offer twice is a 409",
    (await call("POST", "/requests", { token: requesterToken, body: { offerId, message: "again" } })).status === 409);

  const incoming = await call("GET", "/requests/incoming", { token: ownerToken });
  const pending = incoming.data.requests?.find((r) => r._id === requestId);
  check("the owner sees the request with its note", pending?.message === "Could meet near Jarry station.");
  check("no email is shared while the request is pending", !pending?.counterpart?.email, JSON.stringify(pending?.counterpart));

  const requesterAccepts = await call("PATCH", `/requests/${requestId}`, { token: requesterToken, body: { status: "accepted" } });
  check("the requester may cancel but not accept their own request",
    requesterAccepts.status === 400, `status ${requesterAccepts.status}: ${requesterAccepts.data.message}`);

  const stranger = person("stranger");
  const strangerToken = (await call("POST", "/auth/register", { body: stranger })).data.token;
  const strangerAccepts = await call("PATCH", `/requests/${requestId}`, { token: strangerToken, body: { status: "accepted" } });
  check("someone not involved cannot touch the request at all",
    strangerAccepts.status === 403, `status ${strangerAccepts.status}`);

  const accepted = await call("PATCH", `/requests/${requestId}`, { token: ownerToken, body: { status: "accepted" } });
  check("the owner accepts", accepted.status === 200 && accepted.data.request?.status === "accepted", `status ${accepted.status}`);
  check("the requester's email is released on accept", accepted.data.request?.counterpart?.email === requester.email);

  const outgoing = await call("GET", "/requests/outgoing", { token: requesterToken });
  check("the requester now sees the owner's email",
    outgoing.data.requests?.find((r) => r._id === requestId)?.counterpart?.email === owner.email);

  const afterMatch = await call("GET", "/offer?give=EUR&want=CAD");
  check("a matched offer leaves the open list", !afterMatch.data.offers?.some((o) => o._id === offerId));

  console.log(`\n${passed}/${passed + failures.length} checks passed`);
  if (failures.length) {
    console.log(`failed: ${failures.join(", ")}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`\nsmoke run failed: ${err.message}`);
  process.exit(1);
});
