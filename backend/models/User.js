const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    // Stored normalized so "Test@X.com " and "test@x.com" are the same account
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Never returned by queries unless explicitly asked for with .select("+password")
    password: { type: String, required: true, select: false },
}, { timestamps: true });

const UserModel = mongoose.model("Users", UserSchema);
module.exports = UserModel;
