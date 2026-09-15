require("dotenv").config(); // Load env vars before any module reads process.env

// Fail fast with a clear message instead of crashing later on the first login
for (const key of ["MONGO_URI", "JWT_SECRET"]) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

// In production the frontend is on another domain, so a missing allowlist means every browser call is
// blocked by CORS while curl still works (see DEBUG_LOG.md). Warn loudly instead of failing silently.
if (process.env.NODE_ENV === "production" && !process.env.CLIENT_ORIGIN) {
  console.warn("CLIENT_ORIGIN is not set: browser requests from the deployed frontend will be blocked by CORS");
}

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const offerRoutes = require("./routes/offerRoutes");
const requestRoutes = require("./routes/requestRoutes");
const assistantRoutes = require("./routes/assistantRoutes");

const connectDB = require("./config/db");
const { requestLogger, errorHandler } = require("./middleware/requestLogger");

const app = express();
app.use(express.json());
app.use(requestLogger);
// Only the frontend may call the API from a browser. CLIENT_ORIGIN can list several, comma-separated.
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",").map((o) => o.trim());
app.use(cors({ origin: allowedOrigins }));

// Is the server up, and can it reach the database? A server whose DB is down still answers HTTP,
// so this reports the connection state instead of letting requests hang (see DEBUG_LOG.md).
app.get("/health", (req, res) => {
  const mongo = mongoose.connection.readyState; // 1 = connected
  res.status(mongo === 1 ? 200 : 503).json({ ok: mongo === 1, mongo });
});

app.use("/auth", authRoutes);

app.use("/offer", offerRoutes);
app.use("/requests", requestRoutes);
app.use("/assistant", assistantRoutes);

// Express 5 forwards errors from async handlers here; answer with JSON (and the request id) instead
// of the default HTML page
app.use(errorHandler);


// Add startup logging
console.log('Starting server...');

// Connect to MongoDB (non-blocking)
connectDB().catch(err => {
  console.error("Failed to connect to MongoDB:", err);
});

// Render assigns the port through PORT; 3001 locally (5000 is taken by AirPlay on macOS)
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});



