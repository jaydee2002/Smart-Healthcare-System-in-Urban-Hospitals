import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import doctorRoutes from "./routes/doctors.js";
import appointmentRoutes from "./routes/appointments.js";
import patientRoutes from "./routes/patients.js";
import hospitalRoutes from "./routes/hospitals.js";
import reportRoutes from "./routes/reports.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/reports", reportRoutes);

const PORT = process.env.PORT || 5002;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

    // Handle server errors
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(
          `❌ Port ${PORT} is already in use. Please use a different port.`
        );
      } else if (err.code === "EACCES") {
        console.error(
          `❌ Permission denied. Try running with elevated privileges or a different port.`
        );
      } else {
        console.error("❌ Server failed to start:", err);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error("❌ Failed to connect to DB or start server:", err);
    process.exit(1);
  }
};

startServer();

// Handle unexpected runtime errors
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
