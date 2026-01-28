import express from 'express';
import { authenticateAndCheckRole } from '../middleware/auth.js';
import { categoryController } from "../controllers/categoryController.js";

const router = express.Router();

// Get all categories
router.get('/', categoryController.list);

// Create category (admin only)
router.post('/', authenticateAndCheckRole('admin'), categoryController.create);

// Get single category
router.get('/:id', categoryController.getOne);

// Update category (admin only)
router.put('/:id', authenticateAndCheckRole('admin'), categoryController.update);

// Delete category (admin only)
router.delete('/:id', authenticateAndCheckRole('admin'), categoryController.remove);

export default router;



