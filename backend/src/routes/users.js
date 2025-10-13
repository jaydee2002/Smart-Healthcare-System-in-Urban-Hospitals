// src/routes/users.js
import express from "express";
import { getUsers, deleteUser } from "../controllers/userController.js";
import protect from "../middleware/auth.js";
import authorize from "../middleware/roleAuth.js";

const router = express.Router();

router.use(protect); // All routes protected
router.use(authorize("admin")); // Admin only for these
router.route("/").get(getUsers);
router.route("/:id").delete(deleteUser);

export default router;
