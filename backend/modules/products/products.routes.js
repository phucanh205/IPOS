import express from 'express';
import { productController } from "./product.controller.js";
import { authenticateAndCheckRole } from "../../shared/middleware/auth.js";

const router = express.Router();

const allowAdminAndCashier = authenticateAndCheckRole("admin", "cashier");

// Get all products with optional filtering
router.get('/', productController.list);

router.post("/availability", ...allowAdminAndCashier, productController.availability);

// Create new product
router.post('/', ...allowAdminAndCashier, productController.create);

// Update product
router.put('/:id', ...allowAdminAndCashier, productController.update);

// Delete product
router.delete('/:id', ...allowAdminAndCashier, productController.remove);

// Get single product
router.get('/:id', productController.getOne);

export default router;

