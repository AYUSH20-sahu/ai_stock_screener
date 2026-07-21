import { NextFunction, Request, Response } from 'express';
import { asyncWrapper } from '../utils/asyncWrapper';
import { prisma } from '../services/prisma.service';

export const favoritesController = {
    list: asyncWrapper(async (req: Request, res: Response, _next: NextFunction) => {
        const auth = (req as Request & { auth?: { userId?: string } }).auth;
        const userId = auth?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const favorites = await prisma.favoriteStock.findMany({
            where: { userId },
            orderBy: { addedAt: 'desc' },
        });

        res.status(200).json({ success: true, data: favorites });
    }),

    add: asyncWrapper(async (req: Request, res: Response, _next: NextFunction) => {
        const auth = (req as Request & { auth?: { userId?: string } }).auth;
        const userId = auth?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { symbol, name } = req.body;
        if (!symbol || typeof symbol !== 'string') {
            res.status(400).json({ success: false, message: 'Symbol is required.' });
            return;
        }

        const normalizedSymbol = symbol.trim().toUpperCase();

        const existing = await prisma.favoriteStock.findUnique({
            where: { userId_symbol: { userId, symbol: normalizedSymbol } },
        });

        if (existing) {
            res.status(200).json({ success: true, data: existing, message: 'Already in favorites.' });
            return;
        }

        const favorite = await prisma.favoriteStock.create({
            data: {
                symbol: normalizedSymbol,
                name: typeof name === 'string' ? name.trim() : normalizedSymbol,
                userId,
            },
        });

        res.status(201).json({ success: true, data: favorite });
    }),

    remove: asyncWrapper(async (req: Request, res: Response, _next: NextFunction) => {
        const auth = (req as Request & { auth?: { userId?: string } }).auth;
        const userId = auth?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const rawSymbol = req.params.symbol;
        if (!rawSymbol || typeof rawSymbol !== 'string') {
            res.status(400).json({ success: false, message: 'Symbol is required.' });
            return;
        }

        const normalizedSymbol = rawSymbol.trim().toUpperCase();

        const existing = await prisma.favoriteStock.findUnique({
            where: { userId_symbol: { userId, symbol: normalizedSymbol } },
        });

        if (!existing) {
            res.status(404).json({ success: false, message: 'Favorite not found.' });
            return;
        }

        await prisma.favoriteStock.delete({
            where: { id: existing.id },
        });

        res.status(200).json({ success: true, message: 'Removed from favorites.' });
    }),
};