// src/routes/patients.js
import express from "express";
import {
  registerPatient,
  recordConsultation,
  getPatientById,
  getDoctorPatients,
  updatePatient,
} from "../controllers/patientController.js";
import protect from "../middleware/auth.js";
import authorize from "../middleware/roleAuth.js";

const router = express.Router();

router.use(protect);
router.use(authorize("doctor")); // All patient routes doctor-only

router.route("/").get(getDoctorPatients).post(registerPatient);
router.route("/:id").get(getPatientById).put(updatePatient);
router.route("/:id/consultation").post(recordConsultation);

export default router;
