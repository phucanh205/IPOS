import express from "express";
import { adminReceivingController } from "../controllers/adminReceivingController.js";

const router = express.Router();
router.get("/low-stock", adminReceivingController.lowStock);

router.post("/low-stock/:ingredientId/report", adminReceivingController.report);

router.post("/low-stock/:ingredientId/checked", adminReceivingController.checked);

router.post("/low-stock/:ingredientId/resolved", adminReceivingController.resolved);

router.get("/summary", adminReceivingController.summary);

router.get("/logs", adminReceivingController.logs);

export default router;
