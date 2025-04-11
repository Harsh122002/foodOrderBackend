import express from "express";
import { Server } from "socket.io";
import http from "http";
import { cpus } from "os";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import cluster from "cluster";
import User from "./models/userModal.js";

dotenv.config();

const numCPUs = cpus().length;

let io; // Declare io here outside of any block

if (cluster.isMaster) {
  console.log(`Master process ${process.pid} is running`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Restart the worker
  });
} else {
  const app = express();
  connectDB();

  // Create an HTTP server to support WebSocket
  const server = http.createServer(app);

  // Initialize Socket.io with the server
  io = new Server(server, {
    cors: {
      origin: "*", // Allow frontend requests
      methods: ["GET", "POST"]
    }
  });

  // Middleware setup
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cors());

  // Static file serving
  app.use("/groups", express.static("groups"));

  // API Routes
  app.use("/api/auth", authRoutes);

  // Listen on the port
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Worker ${process.pid} running on port ${PORT}`);
  });

  // Socket.io handling - single connection block
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Listen for location updates from delivery boys
    socket.on("updateLocation", async ({ userId, latitude, longitude }) => {
      try {
        await User.findByIdAndUpdate(userId, { latitude, longitude });
        console.log(`Location updated for user ${userId}: ${latitude}, ${longitude}`);
      } catch (error) {
        console.error("Error updating location:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}

// Export the io instance at the top level, outside any block or condition
export { io };
