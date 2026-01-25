const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const offerRoutes = require("./routes/offerRoutes");

const connectDB = require("./config/db");

const app = express();
app.use(express.json());
app.use(cors());
app.use("/auth", authRoutes);

app.use("/chat", chatRoutes);

app.use("/offer", offerRoutes);


// Add startup logging
console.log('Starting server...');

// Connect to MongoDB
connectDB();

  
const server = app.listen(3001, () => {
  console.log(`Server is running on port 3001`);
});



