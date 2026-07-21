import { Router } from 'express';
import { stockController } from '../controllers/stock.controller';

const router = Router();

router.get('/stocks/search', stockController.searchStocks);
router.get('/stocks/:symbol/quote', stockController.getQuote);
router.get('/stocks/:symbol/company', stockController.getCompanyInfo);
router.get('/stocks/:symbol/ratios', stockController.getFinancialRatios);
router.get('/stocks/:symbol/statements', stockController.getFinancialStatements);
router.get('/stocks/:symbol/history', stockController.getPriceHistory);

export default router;
