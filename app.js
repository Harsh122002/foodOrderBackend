import express from "express";
import http from "http"; // Optional: If you plan to use http.createServer for some reason
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

// Connect to DB
connectDB();

const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Static file serving
app.use("/groups", express.static("groups"));

// API Routes
app.use("/api/auth", authRoutes);



// Start the server
app.listen(5000, () => {
  console.log(`Server running on port 5000`);
});
