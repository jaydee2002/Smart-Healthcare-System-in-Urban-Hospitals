import express from "express";
import multer from "multer";
import path from "path";
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

// Multer setup for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/doctors"); // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

router.use(protect);
router.use(authorize("admin")); // All doctor routes admin-only

// Global multer error handler - ADDED
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File too large (max 5MB)" });
    }
    return res.status(400).json({ message: error.message });
  } else if (error) {
    return res.status(400).json({ message: "File upload error" });
  }
  next();
});

router.route("/").post(upload.single("image"), createDoctor).get(getDoctors);
router
  .route("/:id")
  .get(getDoctorById)
  .put(upload.single("image"), updateDoctor)
  .delete(deleteDoctor);
router.route("/:id/availability").post(setAvailability).get(getAvailability);
router
  .route("/:id/availability/:availId")
  .put(updateAvailability)
  .delete(deleteAvailability);
router.route("/:id/appointments").get(getDoctorAppointments);
router.route("/:id/appointments/:appointmentId").put(updateAppointment);

export default router;
