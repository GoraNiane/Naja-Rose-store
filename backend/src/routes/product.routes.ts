import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { productQuerySchema } from '../validators/product.validator.js';

const router = Router();

// Public routes
router.get('/', validateRequest(productQuerySchema), ProductController.getAll);
router.get('/:slug', ProductController.getBySlug);
router.get('/id/:id', ProductController.getById);

export default router;
