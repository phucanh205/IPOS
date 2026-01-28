import express from "express";
import { orderController } from "../controllers/orderController.js";

const router = express.Router();

// Get all orders
router.get("/", orderController.list);

// Get single order
router.get("/:id", orderController.getOne);

// Create new order
router.post("/", orderController.create);

export default router;
