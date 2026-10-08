import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import categoryRoutes from './category.routes.js';
import colorRoutes from './color.routes.js';
import sizeRoutes from './size.routes.js';
import deliveryZoneRoutes from './deliveryZone.routes.js';
import orderRoutes from './order.routes.js';
import paymentRoutes from './payment.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

// Public & Customer Routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/colors', colorRoutes);
router.use('/sizes', sizeRoutes);
router.use('/delivery-zones', deliveryZoneRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);

// Protected Admin Back-Office Routes
router.use('/admin', adminRoutes);

export default router;
