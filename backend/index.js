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

app.post("/login", (req,res) => {
    const { email, password } = req.body;
    UserModel.findOne({ email, password })
    .then(user =>{
        if(user){
            if(user.password === password) { 
                res.json({
                    success: true,
                    message: "Login successful",
                    user: user
                });
            } else {
                res.status(401).json({
                    success: false,
                    message: "Invalid email or password"
                });
            }
        }
        else {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
    })
    .catch(err => {
      res.status(500).json({ success: false, message: "Server error" });
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



