import { NextFunction, Request, Response } from 'express';
import { asyncWrapper } from '../utils/asyncWrapper';
import { validateHealthQuery } from '../validators/health.validator';
import { healthService } from '../services/health.service';

export const healthController = {
    getHealth: asyncWrapper(async (req: Request, res: Response, _next: NextFunction) => {
        validateHealthQuery(req.query as Record<string, unknown>);
        const payload = healthService.getHealthStatus();
        res.status(200).json(payload);
    }),
};
