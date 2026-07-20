import { Router } from 'express';
import { profileController } from '../controllers/profile.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/profile', authMiddleware, profileController.getProfile);

export default router;
