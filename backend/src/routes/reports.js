// src/routes/reports.js
import express from "express";
import {
  generateReport,
  getReports,
  getReportById,
} from "../controllers/reportController.js";
import protect from "../middleware/auth.js";
import authorize from "../middleware/roleAuth.js";

const router = express.Router();

router.use(protect);
router.use(authorize("manager")); // All reports manager-only

router.route("/").get(getReports);
router.route("/:type").get(generateReport); // e.g., /daily
router.route("/:id").get(getReportById);

export default router;
