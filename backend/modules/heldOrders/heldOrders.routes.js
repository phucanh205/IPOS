import express from "express";
import { heldOrderController } from "./heldOrders.controller.js";

const router = express.Router();

// Get all held orders
router.get("/", heldOrderController.list);

// Get single held order
router.get("/:id", heldOrderController.getOne);

// Create new held order
router.post("/", heldOrderController.create);

// Delete held order
router.delete("/:id", heldOrderController.remove);

export default router;
