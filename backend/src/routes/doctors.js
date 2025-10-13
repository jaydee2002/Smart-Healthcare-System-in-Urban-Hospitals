// src/routes/doctors.js
import express from "express";
import {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  setAvailability,
  getDoctorAppointments,
  updateAppointment,
} from "../controllers/doctorController.js";
import protect from "../middleware/auth.js";
import authorize from "../middleware/roleAuth.js";

const router = express.Router();

router.use(protect);
router.use(authorize("admin")); // All doctor routes admin-only

router.route("/").post(createDoctor).get(getDoctors);
router.route("/:id").get(getDoctorById).put(updateDoctor).delete(deleteDoctor);
router.route("/:id/availability").post(setAvailability);
router
  .route("/:id/appointments")
  .get(getDoctorAppointments)
  .put(updateAppointment); // Expects appointmentId in body or query for update

export default router;
