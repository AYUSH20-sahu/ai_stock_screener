import { NextFunction, Request, Response } from 'express';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Missing bearer token' });
        return;
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
        res.status(401).json({ success: false, message: 'Invalid or expired session' });
        return;
    }

    (req as Request & { auth?: { userId?: string } }).auth = { userId: 'clerk-session' };
    next();
};
