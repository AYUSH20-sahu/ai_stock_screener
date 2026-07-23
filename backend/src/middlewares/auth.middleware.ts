import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accessToken = req.cookies.accessToken;

        if (!accessToken) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        try {
            const decoded = verifyAccessToken(accessToken);
            (req as Request & { auth?: { userId?: string } }).auth = { userId: decoded.userId };
            next();
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};