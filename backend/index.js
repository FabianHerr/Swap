const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const offerRoutes = require("./routes/offerRoutes");

const app = express();
app.use(express.json());
app.use(cors());
app.use("/auth", authRoutes);



app.use("/offer", offerRoutes);


// Add startup logging
console.log('Starting server...');

// Add MongoDB connection logging
mongoose.connect(process.env.MONGO_URI, { dbName: "swap" })
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => console.error('MongoDB Connection Error:', err));

  
const server = app.listen(3001, () => {
  console.log(`Server is running on port 3001`);
});



