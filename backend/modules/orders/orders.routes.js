import express from "express";
import { orderController } from "./order.controller.js";
import { authenticateAndCheckRole } from "../../shared/middleware/auth.js";

const router = express.Router();

const allowAdminAndCashier = authenticateAndCheckRole("admin", "cashier");
const allowCashierOnly = authenticateAndCheckRole("cashier");

// Get all orders
router.get("/", ...allowAdminAndCashier, orderController.list);

// Get single order
router.get("/:id", ...allowAdminAndCashier, orderController.getOne);

// Create new order
router.post("/", ...allowCashierOnly, orderController.create);

export default router;
