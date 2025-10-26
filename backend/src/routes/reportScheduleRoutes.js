import express from "express";
import { scheduleReport } from "../controllers/reportController.js";
import {
  getAllReportSchedules,
  deleteReportScheduleById,
} from "../controllers/scheduleController.js";

const router = express.Router();

router.post("/schedule", scheduleReport);

// GET → get all schedules
router.get("/schedules", getAllReportSchedules);

// DELETE → delete by ID
router.delete("/schedule/:id", deleteReportScheduleById);

export default router;
