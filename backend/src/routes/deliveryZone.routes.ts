import { Router } from 'express';
import { DeliveryZoneController } from '../controllers/deliveryZone.controller.js';

const router = Router();

router.get('/', DeliveryZoneController.getAll);

export default router;
