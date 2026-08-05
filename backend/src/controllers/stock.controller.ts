import { NextFunction, Request, Response } from 'express';
import { asyncWrapper } from '../utils/asyncWrapper';
import { ScreenerSortKey, ScreenerFilters } from '../services/stock.service';
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

    getMarketOverview: asyncWrapper(async (_req: Request, res: Response, _next: NextFunction) => {
        const payload = await stockService.getMarketOverview();
        res.status(200).json({ success: true, data: payload });
    }),

    getMarketMovers: asyncWrapper(async (_req: Request, res: Response, _next: NextFunction) => {
        const payload = await stockService.getMarketMovers();
        res.status(200).json({ success: true, data: payload });
    }),

    getMarketNewsFeed: asyncWrapper(async (_req: Request, res: Response, _next: NextFunction) => {
        const payload = await stockService.getMarketNewsFeed();
        res.status(200).json({ success: true, data: payload });
    }),

    getScreener: asyncWrapper(async (req: Request, res: Response, _next: NextFunction) => {
        const filters = {
            query: typeof req.query.query === 'string' ? req.query.query : undefined,
            sector: typeof req.query.sector === 'string' ? req.query.sector : undefined,
            marketCapMin: req.query.marketCapMin ? Number(req.query.marketCapMin) : undefined,
            marketCapMax: req.query.marketCapMax ? Number(req.query.marketCapMax) : undefined,
            peMin: req.query.peMin ? Number(req.query.peMin) : undefined,
            peMax: req.query.peMax ? Number(req.query.peMax) : undefined,
            pbMin: req.query.pbMin ? Number(req.query.pbMin) : undefined,
            pbMax: req.query.pbMax ? Number(req.query.pbMax) : undefined,
            roeMin: req.query.roeMin ? Number(req.query.roeMin) : undefined,
            roeMax: req.query.roeMax ? Number(req.query.roeMax) : undefined,
            roceMin: req.query.roceMin ? Number(req.query.roceMin) : undefined,
            roceMax: req.query.roceMax ? Number(req.query.roceMax) : undefined,
            revenueMin: req.query.revenueMin ? Number(req.query.revenueMin) : undefined,
            revenueMax: req.query.revenueMax ? Number(req.query.revenueMax) : undefined,
            dividendMin: req.query.dividendMin ? Number(req.query.dividendMin) : undefined,
            dividendMax: req.query.dividendMax ? Number(req.query.dividendMax) : undefined,
            sortKey: typeof req.query.sortKey === 'string' && ['marketCap', 'pe', 'pb', 'roe', 'roce', 'revenue', 'dividend', 'symbol', 'price'].includes(req.query.sortKey)
                ? (req.query.sortKey as ScreenerSortKey)
                : undefined,
            sortDirection: req.query.sortDirection === 'asc' || req.query.sortDirection === 'desc'
                ? (req.query.sortDirection as 'asc' | 'desc')
                : undefined,
            page: req.query.page ? Number(req.query.page) : 1,
            pageSize: req.query.pageSize ? Number(req.query.pageSize) : 20,
        } as ScreenerFilters;

        const payload = await stockService.getScreenerStocks(filters);
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

    getStockNews: asyncWrapper(async (req: Request, res: Response, _next: NextFunction) => {
        const symbol = typeof req.params.symbol === 'string' ? req.params.symbol : '';
        if (!symbol.trim()) {
            res.status(400).json({ success: false, message: 'Symbol is required.' });
            return;
        }

        const payload = await stockService.getStockNews(symbol);
        res.status(200).json({ success: true, data: payload });
    }),

    getRelatedStocks: asyncWrapper(async (req: Request, res: Response, _next: NextFunction) => {
        const symbol = typeof req.params.symbol === 'string' ? req.params.symbol : '';
        if (!symbol.trim()) {
            res.status(400).json({ success: false, message: 'Symbol is required.' });
            return;
        }

        const payload = await stockService.getRelatedStocks(symbol);
        res.status(200).json({ success: true, data: payload });
    }),
};
