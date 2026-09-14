require("dotenv").config(); // Load env vars before any module reads process.env
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const offerRoutes = require("./routes/offerRoutes");

const connectDB = require("./config/db");

const app = express();
app.use(express.json());
app.use(cors());
app.use("/auth", authRoutes);

app.use("/offer", offerRoutes);


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



