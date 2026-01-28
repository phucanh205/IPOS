import express from "express";
import { authenticate } from "../middleware/auth.js";
import { authController } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", authController.login);

router.get("/me", authenticate, authController.me);

router.post("/logout", authenticate, authController.logout);

export default router;
