import { Router } from 'express';
import { portfolioController } from '../controllers/portfolio.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/portfolio', authMiddleware, portfolioController.getPortfolios);
router.post('/portfolio', authMiddleware, portfolioController.createPortfolio);
router.post('/portfolio/holding', authMiddleware, portfolioController.addHolding);
router.put('/portfolio/holding/:id', authMiddleware, portfolioController.updateHolding);
router.delete('/portfolio/holding/:id', authMiddleware, portfolioController.removeHolding);

export default router;