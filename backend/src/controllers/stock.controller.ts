import { NextFunction, Request, Response } from 'express';
import { asyncWrapper } from '../utils/asyncWrapper';
import { stockService } from '../services/stock.service';

export const stockController = {
    searchStocks: asyncWrapper(async (req: Request, res: Response, _next: NextFunction) => {
        const query = typeof req.query.q === 'string' ? req.query.q : '';
        if (!query.trim()) {
            res.status(400).json({ success: false, message: 'Query parameter "q" is required.' });
            return;
        }

        const payload = await stockService.searchStocks(query);
        res.status(200).json({ success: true, data: payload });
    }),

    getQuote: asyncWrapper(async (req: Request, res: Response, _next: NextFunction) => {
        const symbol = typeof req.params.symbol === 'string' ? req.params.symbol : '';
        if (!symbol.trim()) {
            res.status(400).json({ success: false, message: 'Symbol is required.' });
            return;
        }

        const payload = await stockService.getQuote(symbol);
        res.status(200).json({ success: true, data: payload });
    }),

    getCompanyInfo: asyncWrapper(async (req: Request, res: Response, _next: NextFunction) => {
        const symbol = typeof req.params.symbol === 'string' ? req.params.symbol : '';
        if (!symbol.trim()) {
            res.status(400).json({ success: false, message: 'Symbol is required.' });
            return;
        }

        const payload = await stockService.getCompanyInfo(symbol);
        res.status(200).json({ success: true, data: payload });
    }),

    getFinancialRatios: asyncWrapper(async (req: Request, res: Response, _next: NextFunction) => {
        const symbol = typeof req.params.symbol === 'string' ? req.params.symbol : '';
        if (!symbol.trim()) {
            res.status(400).json({ success: false, message: 'Symbol is required.' });
            return;
        }

        const payload = await stockService.getFinancialRatios(symbol);
        res.status(200).json({ success: true, data: payload });
    }),

    getFinancialStatements: asyncWrapper(async (req: Request, res: Response, _next: NextFunction) => {
        const symbol = typeof req.params.symbol === 'string' ? req.params.symbol : '';
        if (!symbol.trim()) {
            res.status(400).json({ success: false, message: 'Symbol is required.' });
            return;
        }

        const payload = await stockService.getFinancialStatements(symbol);
        res.status(200).json({ success: true, data: payload });
    }),

    getPriceHistory: asyncWrapper(async (req: Request, res: Response, _next: NextFunction) => {
        const symbol = typeof req.params.symbol === 'string' ? req.params.symbol : '';
        if (!symbol.trim()) {
            res.status(400).json({ success: false, message: 'Symbol is required.' });
            return;
        }

        const payload = await stockService.getPriceHistory(symbol);
        res.status(200).json({ success: true, data: payload });
    }),
};
