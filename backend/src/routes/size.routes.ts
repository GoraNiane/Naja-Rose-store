import { Router } from 'express';
import { SizeController } from '../controllers/size.controller.js';

const router = Router();

router.get('/', SizeController.getAll);

export default router;
