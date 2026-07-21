import { NextFunction, Request, Response } from 'express';
import { asyncWrapper } from '../utils/asyncWrapper';
import { prisma } from '../services/prisma.service';

export const portfolioController = {
    getPortfolios: asyncWrapper(async (req: Request, res: Response, _next: NextFunction) => {
        const auth = (req as Request & { auth?: { userId?: string } }).auth;
        const userId = auth?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const portfolios = await prisma.portfolio.findMany({
            where: { userId },
            include: { holdings: true },
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json({ success: true, data: portfolios });
    }),

    createPortfolio: asyncWrapper(async (req: Request, res: Response, _next: NextFunction) => {
        const auth = (req as Request & { auth?: { userId?: string } }).auth;
        const userId = auth?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { name, description } = req.body;
        if (!name || typeof name !== 'string') {
            res.status(400).json({ success: false, message: 'Portfolio name is required.' });
            return;
        }

        const portfolio = await prisma.portfolio.create({
            data: {
                name: name.trim(),
                description: typeof description === 'string' ? description.trim() : null,
                userId,
            },
        });

        res.status(201).json({ success: true, data: portfolio });
    }),

    addHolding: asyncWrapper(async (req: Request, res: Response, _next: NextFunction) => {
        const auth = (req as Request & { auth?: { userId?: string } }).auth;
        const userId = auth?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { portfolioId, symbol, exchange, quantity, averagePrice } = req.body;
        if (!symbol || typeof symbol !== 'string') {
            res.status(400).json({ success: false, message: 'Symbol is required.' });
            return;
        }
        if (!portfolioId || typeof portfolioId !== 'string') {
            res.status(400).json({ success: false, message: 'Portfolio ID is required.' });
            return;
        }

        const portfolio = await prisma.portfolio.findFirst({
            where: { id: portfolioId, userId },
        });
        if (!portfolio) {
            res.status(404).json({ success: false, message: 'Portfolio not found.' });
            return;
        }

        const normalizedSymbol = symbol.trim().toUpperCase();
        const qty = typeof quantity === 'number' ? quantity : 0;
        const avgPrice = typeof averagePrice === 'number' ? averagePrice : 0;

        const holding = await prisma.holding.create({
            data: {
                symbol: normalizedSymbol,
                exchange: typeof exchange === 'string' ? exchange.trim() : 'N/A',
                quantity: qty,
                averagePrice: avgPrice,
                investedAmount: qty * avgPrice,
                userId,
                portfolioId,
            },
        });

        res.status(201).json({ success: true, data: holding });
    }),

    updateHolding: asyncWrapper(async (req: Request, res: Response, _next: NextFunction) => {
        const auth = (req as Request & { auth?: { userId?: string } }).auth;
        const userId = auth?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const id = typeof req.params.id === 'string' ? req.params.id : '';
        const { quantity, averagePrice } = req.body;

        const existing = await prisma.holding.findFirst({
            where: { id, userId },
        });
        if (!existing) {
            res.status(404).json({ success: false, message: 'Holding not found.' });
            return;
        }

        const qty = typeof quantity === 'number' ? quantity : existing.quantity;
        const avgPrice = typeof averagePrice === 'number' ? averagePrice : existing.averagePrice;

        const holding = await prisma.holding.update({
            where: { id },
            data: {
                quantity: qty,
                averagePrice: avgPrice,
                investedAmount: qty * avgPrice,
            },
        });

        res.status(200).json({ success: true, data: holding });
    }),

    removeHolding: asyncWrapper(async (req: Request, res: Response, _next: NextFunction) => {
        const auth = (req as Request & { auth?: { userId?: string } }).auth;
        const userId = auth?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const id = typeof req.params.id === 'string' ? req.params.id : '';
        const existing = await prisma.holding.findFirst({
            where: { id, userId },
        });
        if (!existing) {
            res.status(404).json({ success: false, message: 'Holding not found.' });
            return;
        }

        await prisma.holding.delete({ where: { id } });
        res.status(200).json({ success: true, message: 'Holding removed.' });
    }),
};