// src/routes/auth.js
import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
} from "../controllers/authController.js";
import protect from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.use(protect); // All below routes protected
router.route("/profile").get(getProfile).put(updateProfile);

export default router;
