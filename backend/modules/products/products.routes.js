import express from 'express';
import { productController } from "./product.controller.js";

const router = express.Router();

// Get all products with optional filtering
router.get('/', productController.list);

router.post("/availability", productController.availability);

// Create new product
router.post('/', productController.create);

// Update product
router.put('/:id', productController.update);

// Delete product
router.delete('/:id', productController.remove);

// Get single product
router.get('/:id', productController.getOne);

export default router;

