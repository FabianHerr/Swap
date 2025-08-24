require('dotenv').config();
const UserModel = require('../models/User'); // Adjust the path as necessary
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user =  await UserModel.findOne({email});
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ success: false, message: "Login failed" });

  const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
  );

  res.json({ success: true, message: "Login successful", token, user });
};

// Register a new user
exports.register = async (req, res) => {
  const { email, password } = req.body;

  const existingUser = await UserModel.findOne({ email });
  if (existingUser) return res.status(409).json({ success: false, message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await UserModel.create({ email, password: hashedPassword });

  res.json({ success: true, message: "User registered successfully", user });
};