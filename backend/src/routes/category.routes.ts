import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller.js';

const router = Router();

// Public routes
router.get('/', CategoryController.getAll);
router.get('/:slug', CategoryController.getBySlug);

export default router;
