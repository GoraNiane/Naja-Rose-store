import { Router } from 'express';
import { ColorController } from '../controllers/color.controller.js';

const router = Router();

router.get('/', ColorController.getAll);

export default router;
