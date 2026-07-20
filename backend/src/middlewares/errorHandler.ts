import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

export const errorHandler: ErrorRequestHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const statusCode = (err as { statusCode?: number }).statusCode || 500;
    const message = (err as { message?: string }).message || 'Internal Server Error';

    logger.error('Unhandled error', { statusCode, message });

    res.status(statusCode).json({
        success: false,
        message,
    });
};
