import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { registerSchema, loginSchema, adminLoginSchema } from '../validators/auth.validator.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/login', authLimiter, validateRequest(loginSchema), AuthController.login);
router.post('/admin-login', authLimiter, validateRequest(adminLoginSchema), AuthController.adminLogin);
router.post('/register', authLimiter, validateRequest(registerSchema), AuthController.register);
router.get('/me', requireAuth, AuthController.getMe);

export default router;
