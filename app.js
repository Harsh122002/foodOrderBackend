import express, { static as s } from "express";
import connectDB from "./config/db.js"
import authRoutes from "./routes/authRoutes.js";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import cluster from "cluster";

const { isMaster, fork } = cluster;
import { cpus } from "os";
const numCPUs = cpus().length;

if (isMaster) {
  console.log(`Master process ${process.pid} is running`);
  for (let i = 0; i < numCPUs; i++) {
    fork();
  }
  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    fork();
  });
} else {
  const app = express();
  connectDB();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cors());
  app.use("/groups", s("groups"));
  app.use("/api/auth", authRoutes);
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} running on port ${PORT}`);
  });
}
