import express from "express";
import { authenticate } from "../../shared/middleware/auth.js";
import { authController } from "./auth.controller.js";

const router = express.Router();

router.post("/login", authController.login);

router.get("/me", authenticate, authController.me);

router.post("/logout", authenticate, authController.logout);

export default router;
