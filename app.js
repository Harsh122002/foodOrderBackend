const express = require("express");
const connectDB = require("./config/db");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/authRoutes");
require("dotenv").config();
const cors = require("cors");

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use("/groups", express.static("groups"));

// Log environment variables to ensure they are being read correctly

// Razorpay instance

// Routes
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} `);
});
