import { NextFunction, Request, Response } from 'express';

export const notFoundHandler = (_req: Request, res: Response, _next: NextFunction) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
};
