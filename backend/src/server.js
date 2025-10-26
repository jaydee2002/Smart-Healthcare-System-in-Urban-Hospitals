import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import doctorRoutes from "./routes/doctors.js";
import appointmentRoutes from "./routes/appointments.js";
import patientRoutes from "./routes/patients.js";
import hospitalRoutes from "./routes/hospitals.js";
import reportRoutes from "./routes/repo.js";
import { generateMockData } from "./services/generateMockData.js";
import reportScheduleRoutes from "./routes/reportScheduleRoutes.js";
import Report from "./models/Report.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running");
});

// Serve uploaded images statically - ADDED
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/hospitals", hospitalRoutes);
// app.use("/api/reports", reportRoutes);

app.post("/api/reports/generate", (req, res) => {
  try {
    const payload = req.body;
    const data = generateMockData(payload);

    console.log("Generated mock report data:", data);

    // Store in database
    const newReport = new Report({
      reportData: data,
      payload: payload, // Optional: store the input payload for reference
    });

    newReport.save();
    console.log("Report saved to database with ID:", newReport._id);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/reports/export", async (req, res) => {
  const { format } = req.query;
  // Implement export logic (e.g., using pdfkit for PDF, exceljs for XLSX)
  // For now, mock response
  if (format === "pdf") {
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=report.pdf",
    });
    res.send(Buffer.from("Mock PDF content"));
  } else if (format === "excel") {
    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=report.xlsx",
    });
    res.send(Buffer.from("Mock Excel content"));
  } else {
    res.status(400).json({ error: "Invalid format" });
  }
});

app.use("/api/reports", reportScheduleRoutes);

// Routes
app.use("/api/oapi/reports", reportRoutes);

const PORT = process.env.PORT || 5002;

// Ensure uploads folder exists - ADDED
const uploadsDir = path.join(process.cwd(), "uploads/doctors");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("📁 Created uploads/doctors directory");
}

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
