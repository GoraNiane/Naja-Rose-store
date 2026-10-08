import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

// Controllers
import { ProductController } from '../controllers/product.controller.js';
import { CategoryController } from '../controllers/category.controller.js';
import { ColorController } from '../controllers/color.controller.js';
import { SizeController } from '../controllers/size.controller.js';
import { DeliveryZoneController } from '../controllers/deliveryZone.controller.js';
import { OrderController } from '../controllers/order.controller.js';
import { CustomerController } from '../controllers/customer.controller.js';
import { StockController } from '../controllers/stock.controller.js';
import { MediaController } from '../controllers/media.controller.js';

// Validators
import { createProductSchema, updateProductSchema } from '../validators/product.validator.js';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator.js';
import { createColorSchema, updateColorSchema } from '../validators/color.validator.js';
import { createSizeSchema, updateSizeSchema } from '../validators/size.validator.js';
import { createDeliveryZoneSchema, updateDeliveryZoneSchema } from '../validators/deliveryZone.validator.js';
import { updateOrderStatusSchema } from '../validators/order.validator.js';
import { updateStockSchema } from '../validators/stock.validator.js';

const router = Router();

// Apply requireAuth and requireAdmin across all admin endpoints
router.use(requireAuth, requireAdmin);

// -----------------------------------------------------------------------------
// 1. PRODUCTS MANAGEMENT
// -----------------------------------------------------------------------------
router.post('/products', validateRequest(createProductSchema), ProductController.create);
router.put('/products/:id', validateRequest(updateProductSchema), ProductController.update);
router.delete('/products/:id', ProductController.delete);

// -----------------------------------------------------------------------------
// 2. CATEGORIES MANAGEMENT
// -----------------------------------------------------------------------------
router.post('/categories', validateRequest(createCategorySchema), CategoryController.create);
router.put('/categories/:id', validateRequest(updateCategorySchema), CategoryController.update);
router.delete('/categories/:id', CategoryController.delete);

// -----------------------------------------------------------------------------
// 3. COLORS MANAGEMENT
// -----------------------------------------------------------------------------
router.post('/colors', validateRequest(createColorSchema), ColorController.create);
router.put('/colors/:id', validateRequest(updateColorSchema), ColorController.update);
router.delete('/colors/:id', ColorController.delete);

// -----------------------------------------------------------------------------
// 4. SIZES MANAGEMENT
// -----------------------------------------------------------------------------
router.post('/sizes', validateRequest(createSizeSchema), SizeController.create);
router.put('/sizes/:id', validateRequest(updateSizeSchema), SizeController.update);
router.delete('/sizes/:id', SizeController.delete);

// -----------------------------------------------------------------------------
// 5. DELIVERY ZONES MANAGEMENT
// -----------------------------------------------------------------------------
router.post('/delivery-zones', validateRequest(createDeliveryZoneSchema), DeliveryZoneController.create);
router.put('/delivery-zones/:id', validateRequest(updateDeliveryZoneSchema), DeliveryZoneController.update);
router.delete('/delivery-zones/:id', DeliveryZoneController.delete);

import { AnalyticsController } from '../controllers/analytics.controller.js';

// -----------------------------------------------------------------------------
// 6. ORDERS MANAGEMENT
// -----------------------------------------------------------------------------
router.get('/orders', OrderController.list);
router.put('/orders/:id/status', validateRequest(updateOrderStatusSchema), OrderController.updateStatus);

// -----------------------------------------------------------------------------
// 7. CUSTOMERS MANAGEMENT
// -----------------------------------------------------------------------------
router.get('/customers', CustomerController.getAll);
router.get('/customers/:id', CustomerController.getById);

// -----------------------------------------------------------------------------
// 8. STOCK MANAGEMENT
// -----------------------------------------------------------------------------
router.get('/stock', StockController.getStockList);
router.put('/stock/:variantId', validateRequest(updateStockSchema), StockController.updateStock);
router.get('/stock/movements', StockController.getMovements);

// -----------------------------------------------------------------------------
// 9. MEDIA & CLOUDINARY MANAGEMENT
// -----------------------------------------------------------------------------
router.post('/media/upload', MediaController.upload);
router.delete('/media/:publicId', MediaController.delete);

// -----------------------------------------------------------------------------
// 10. ANALYTICS & DASHBOARD KPI
// -----------------------------------------------------------------------------
router.get('/analytics/dashboard', AnalyticsController.getDashboard);
router.get('/analytics/sales', AnalyticsController.getSalesLog);
router.get('/analytics/customers', AnalyticsController.getCustomerInsights);

export default router;
