const mongoose = require("mongoose");
const SwapRequestModel = require("../models/SwapRequest");
const UserModel = require("../models/User");

// What Swap actually knows about each offer's owner, so a card can say who you'd be meeting:
// when they joined, and how many swap requests they've had accepted (as owner or requester).
// Swap has no ratings or identity checks, so nothing here pretends to be one.
async function ownerProfiles(ownerIds) {
  const ids = [...new Set(ownerIds.map(String))].map((id) => new mongoose.Types.ObjectId(id));
  if (ids.length === 0) return {};
  const acceptedBy = (field) => SwapRequestModel.aggregate([
    { $match: { status: "accepted", [field]: { $in: ids } } },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
  ]);
  const [users, asOwner, asRequester] = await Promise.all([
    UserModel.find({ _id: { $in: ids } }, "createdAt"),
    acceptedBy("owner"),
    acceptedBy("requester"),
  ]);

  const accepted = {};
  for (const { _id, count } of [...asOwner, ...asRequester]) accepted[_id] = (accepted[_id] || 0) + count;
  return Object.fromEntries(users.map((user) => [user._id, {
    // Accounts created before timestamps were added still carry their creation time in the id
    memberSince: user.createdAt ?? user._id.getTimestamp(),
    acceptedSwaps: accepted[user._id] || 0,
  }]));
}

module.exports = { ownerProfiles };
