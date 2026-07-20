import { Router } from 'express';
import { geminiController } from '../controllers/gemini.controller';

const router = Router();

router.get('/gemini/insight', geminiController.getInsight);

export default router;
