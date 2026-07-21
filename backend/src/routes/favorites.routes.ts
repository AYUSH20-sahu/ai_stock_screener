import { Router } from 'express';
import { favoritesController } from '../controllers/favorites.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/favorites', authMiddleware, favoritesController.list);
router.post('/favorites', authMiddleware, favoritesController.add);
router.delete('/favorites/:symbol', authMiddleware, favoritesController.remove);

export default router;