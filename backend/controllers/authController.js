const UserModel = require('../models/User');
const bcrypt = require("bcryptjs"); // bcryptjs is the one in package.json; "bcrypt" only resolved from a stray ~/repos/node_modules
const jwt = require("jsonwebtoken");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email) => String(email ?? "").trim().toLowerCase();

// The only user fields that ever leave the server (never the password hash)
const toPublicUser = (user) => ({ _id: user._id, name: user.name, email: user.email });

const signToken = (user) => jwt.sign(
    { userId: user._id, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
);

// Register a new user and log them in right away
exports.register = async (req, res) => {
  const { name, email, password } = req.body ?? {};
  const cleanName = String(name ?? "").trim();
  const cleanEmail = normalizeEmail(email);

  if (!cleanName) return res.status(400).json({ success: false, message: "Name is required" });
  if (!EMAIL_PATTERN.test(cleanEmail)) return res.status(400).json({ success: false, message: "Enter a valid email" });
  if (String(password ?? "").length < 8) return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });

  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await UserModel.create({ name: cleanName, email: cleanEmail, password: hashedPassword });
    res.status(201).json({ success: true, message: "User registered successfully", token: signToken(user), user: toPublicUser(user) });
  } catch (err) {
    // Unique index on email: also covers two signups racing each other
    if (err.code === 11000) return res.status(409).json({ success: false, message: "An account with this email already exists" });
    throw err;
  }
};

// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body ?? {};

  const user = await UserModel.findOne({ email: normalizeEmail(email) }).select("+password");
  const isMatch = user && await bcrypt.compare(String(password ?? ""), user.password);
  // Same answer for unknown email and wrong password, so the API doesn't reveal which emails have accounts
  if (!isMatch) return res.status(401).json({ success: false, message: "Invalid email or password" });

  res.json({ success: true, message: "Login successful", token: signToken(user), user: toPublicUser(user) });
};

// Current user from the token; lets the frontend restore a session after a refresh
exports.me = async (req, res) => {
  const user = await UserModel.findById(req.user.userId);
  if (!user) return res.status(401).json({ success: false, message: "Account not found" });

  res.json({ success: true, user: toPublicUser(user) });
};
