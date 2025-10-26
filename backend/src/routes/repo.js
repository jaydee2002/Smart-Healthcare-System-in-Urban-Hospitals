// routes/reportRoutes.js (ES Module)
import express from "express";
import {
  createReport,
  getAllReports,
  getReportById,
  updateReport,
  deleteReport,
} from "../controllers/repoController.js";

const router = express.Router();

// POST /api/reports - Create a new report
router.post("/", createReport);

// GET /api/reports - Get all reports
router.get("/", getAllReports);

// GET /api/reports/:id - Get report by ID
router.get("/:id", getReportById);

// PUT /api/reports/:id - Update report by ID
router.put("/:id", updateReport);

// DELETE /api/reports/:id - Delete report by ID
router.delete("/:id", deleteReport);

export default router;
