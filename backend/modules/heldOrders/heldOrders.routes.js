import express from "express";
import { heldOrderController } from "./heldOrders.controller.js";
import { authenticateAndCheckRole } from "../../shared/middleware/auth.js";

const router = express.Router();

const allowCashierOnly = authenticateAndCheckRole("cashier");

router.use(...allowCashierOnly);

// Get all held orders
router.get("/", heldOrderController.list);

// Get single held order
router.get("/:id", heldOrderController.getOne);

// Create new held order
router.post("/", heldOrderController.create);

// Delete held order
router.delete("/:id", heldOrderController.remove);

export default router;
