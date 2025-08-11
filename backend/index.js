require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const UserModel = require('./models/User'); // Adjust the path as necessary

const app = express();
app.use(express.json());
app.use(cors());

// Add startup logging
console.log('Starting server...');

// Add MongoDB connection logging
mongoose.connect(process.env.MONGO_URI, { dbName: "swap" })
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => console.error('MongoDB Connection Error:', err));

app.post("/register", (req, res) => {
  UserModel.create(req.body)
    .then(user => {
      res.json({
        success: true,
        message: "User registered successfully",
        user: user
      });
    })
    .catch(err => {
      res.status(400).json({
        success: false,
        message: err.message || "Registration failed"
      });
    });
});

const server = app.listen(3001, () => {
  console.log(`Server is running on port 3001`);
});



