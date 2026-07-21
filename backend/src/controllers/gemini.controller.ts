import { NextFunction, Request, Response } from 'express';
import { asyncWrapper } from '../utils/asyncWrapper';
import { geminiService } from '../services/gemini.service';

export const geminiController = {
    getInsight: asyncWrapper(async (req: Request, res: Response, _next: NextFunction) => {
        const prompt = typeof req.query.prompt === 'string' ? req.query.prompt : '';
        if (!prompt.trim()) {
            res.status(400).json({ success: false, message: 'Prompt is required.' });
            return;
        }

        const result = await geminiService.getInsight(prompt);
        res.status(200).json(result);
    }),

    createInsight: asyncWrapper(async (req: Request, res: Response, _next: NextFunction) => {
        const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt : '';
        if (!prompt.trim()) {
            res.status(400).json({ success: false, message: 'Prompt is required.' });
            return;
        }

        const result = await geminiService.getInsight(prompt);
        res.status(200).json(result);
    }),
};
