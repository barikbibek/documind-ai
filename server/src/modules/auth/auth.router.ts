import { Router } from 'express';
import { register, login, me } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authMiddleware } from '../../middleware/auth';
import { registerSchema, loginSchema } from './auth.schema';
import { authLimiter } from '../../middleware/rateLimiter';

const router = Router()

router.post('/register', authLimiter, validate(registerSchema), register)
router.post('/login', authLimiter, validate(loginSchema), login)
router.get('/me', authMiddleware, me)

export default router;