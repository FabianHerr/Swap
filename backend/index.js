require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const UserModel = require('./models/User'); // Adjust the path as necessary
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());

// Add startup logging
console.log('Starting server...');

// Add MongoDB connection logging
mongoose.connect(process.env.MONGO_URI, { dbName: "swap" })
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => console.error('MongoDB Connection Error:', err));

app.post("/login", async (req,res) => {

    const { email, password } = req.body;

    const user =  await UserModel.findOne({email});
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Login failed" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' } // Token expires in 1 hour
      );

      res.json({
        success: true,
        message: "Login successful",
        token, // Send the token to the client
        user
      });
})

app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists"
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const user = await UserModel.create({email, password: hashedPassword});
    res.json({
      success: true,
      message: "User registered successfully",
      user
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || "Registration failed"
    });
  }
});

const server = app.listen(3001, () => {
  console.log(`Server is running on port 3001`);
});



