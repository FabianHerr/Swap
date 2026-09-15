// Demo data for a walkthrough: a handful of people with open offers, and two pending requests.
//
//   SEED_CONFIRM=yes node scripts/seed.js
//   SEED_CONFIRM=yes MONGO_URI=mongodb://127.0.0.1:27017 node scripts/seed.js
//
// It prints the database host and refuses to run without SEED_CONFIRM, because the same command
// pointed at the wrong MONGO_URI would rewrite demo data in production.
// It only ever touches the accounts below: their offers and requests are replaced, and anything
// belonging to real users is left alone.
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const UserModel = require("../models/User");
const OfferModel = require("../models/Offer");
const SwapRequestModel = require("../models/SwapRequest");

const PASSWORD = process.env.SEED_PASSWORD || "swapdemo123";

const PEOPLE = [
  { name: "Leo Martins", email: "leo@example.com" },
  { name: "Amara Thiam", email: "amara@example.com" },
  { name: "Priya Raghunathan", email: "priya@example.com" },
  { name: "Mateo Restrepo", email: "mateo@example.com" },
];

// Amounts and rates are each poster's own terms. Swap looks up no exchange rate, so none of these
// pretend to be one.
const OFFERS = [
  ["amara@example.com", 250, "EUR", 370, "CAD"],
  ["amara@example.com", 5000, "JPY", 45, "USD"],
  ["priya@example.com", 3000000, "COP", 1050, "CAD"],
  ["priya@example.com", 20000, "INR", 330, "AUD"],
  ["mateo@example.com", 4500, "MXN", 240, "USD"],
  ["mateo@example.com", 1150000, "COP", 400, "CAD"],
  ["mateo@example.com", 800, "BRL", 140, "EUR"],
  ["leo@example.com", 95, "CHF", 150, "CAD"],
  ["leo@example.com", 120, "GBP", 205, "CAD"],
  ["amara@example.com", 500, "PEN", 130, "USD"],
];

// [offer owner, requester, note]
const REQUESTS = [
  ["priya@example.com", "leo@example.com", "I'm near Jarry station most evenings this week, would Thursday work?"],
  ["amara@example.com", "mateo@example.com", "Happy to meet at the cafe on Saint-Denis, any afternoon."],
];

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not set");
  // Log the host only: the URI carries the password
  const host = new URL(uri.replace("mongodb+srv://", "https://").replace("mongodb://", "http://")).host;
  console.log(`Seeding ${host}`);

  if (process.env.SEED_CONFIRM !== "yes") {
    console.error("Refusing to run without SEED_CONFIRM=yes. Check the host above first.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const password = await bcrypt.hash(PASSWORD, 10);

  const users = {};
  for (const person of PEOPLE) {
    users[person.email] = await UserModel.findOneAndUpdate(
      { email: person.email },
      { $set: { name: person.name, password } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }
  const ids = Object.values(users).map((u) => u._id);

  // Replace only the demo accounts' data, so a real account's offers survive a reseed
  await SwapRequestModel.deleteMany({ $or: [{ owner: { $in: ids } }, { requester: { $in: ids } }] });
  await OfferModel.deleteMany({ owner: { $in: ids } });

  const offers = {};
  for (const [email, giveAmount, giveCurrency, wantAmount, wantCurrency] of OFFERS) {
    const owner = users[email];
    const offer = await OfferModel.create({
      owner: owner._id, ownerName: owner.name, giveAmount, giveCurrency, wantAmount, wantCurrency,
    });
    (offers[email] ??= []).push(offer);
  }

  for (const [ownerEmail, requesterEmail, message] of REQUESTS) {
    const offer = offers[ownerEmail][0];
    await SwapRequestModel.create({
      offer: offer._id, owner: users[ownerEmail]._id, requester: users[requesterEmail]._id, message,
    });
  }

  console.log(`${PEOPLE.length} people, ${OFFERS.length} open offers, ${REQUESTS.length} pending requests`);
  console.log(`Log in as any of: ${PEOPLE.map((p) => p.email).join(", ")} (password: ${PASSWORD})`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
