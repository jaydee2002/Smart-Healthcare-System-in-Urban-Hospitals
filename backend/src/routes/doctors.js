// src/routes/doctors.js
import express from "express";
import {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  setAvailability,
  getAvailability,
  updateAvailability,
  deleteAvailability,
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
router.route("/:id/availability").post(setAvailability).get(getAvailability);
router
  .route("/:id/availability/:availId")
  .put(updateAvailability)
  .delete(deleteAvailability);
router.route("/:id/appointments").get(getDoctorAppointments);
router.route("/:id/appointments/:appointmentId").put(updateAppointment);

export default router;
