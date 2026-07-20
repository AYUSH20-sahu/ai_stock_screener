import { NextFunction, Request, Response } from 'express';
import { asyncWrapper } from '../utils/asyncWrapper';

export const profileController = {
    getProfile: asyncWrapper(async (req: Request, res: Response, _next: NextFunction) => {
        const auth = (req as Request & { auth?: { userId?: string } }).auth;
        res.status(200).json({
            success: true,
            message: 'Protected profile route',
            userId: auth?.userId || null,
        });
    }),
};
