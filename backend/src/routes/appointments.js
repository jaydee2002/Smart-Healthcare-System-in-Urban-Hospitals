// src/routes/appointments.js
import express from "express";
import {
  searchDoctors,
  getAvailableSlots,
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  createPaymentIntent,
} from "../controllers/appointmentController.js";
import protect from "../middleware/auth.js";
import authorize from "../middleware/roleAuth.js";

const router = express.Router();

router.use(protect);

// Patient-only for booking
router.use(authorize("patient"));

router.get("/doctors/search", searchDoctors);
router.get("/:doctorId/slots", getAvailableSlots);
router.post("/book", bookAppointment);
router.get("/my", getMyAppointments);
router.delete("/:id", cancelAppointment);
router.post("/payment/intent", createPaymentIntent);

export default router;
