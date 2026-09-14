require("dotenv").config(); // Load env vars before any module reads process.env

// Fail fast with a clear message instead of crashing later on the first login
for (const key of ["MONGO_URI", "JWT_SECRET"]) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const offerRoutes = require("./routes/offerRoutes");
const requestRoutes = require("./routes/requestRoutes");

const connectDB = require("./config/db");

const app = express();
app.use(express.json());
app.use(cors());
app.use("/auth", authRoutes);

app.use("/offer", offerRoutes);
app.use("/requests", requestRoutes);

// Express 5 forwards errors from async handlers here; answer with JSON instead of the default HTML page
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: "Something went wrong" });
});


// Add startup logging
console.log('Starting server...');

// Connect to MongoDB (non-blocking)
connectDB().catch(err => {
  console.error("Failed to connect to MongoDB:", err);
});

// Start the server
const server = app.listen(3001, () => {
  console.log(`🚀 Server is running on port 3001`);
  console.log(`📡 API endpoints available at http://localhost:3001`);
});



