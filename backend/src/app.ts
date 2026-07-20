import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import healthRoutes from './routes/health.routes';
import profileRoutes from './routes/profile.routes';
import { notFoundHandler } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';
import { logger } from './utils/logger';

export const createApp = () => {
    const app = express();

    app.use(helmet());
    app.use(cors());
    app.use(morgan('dev'));
    app.use(compression());
    app.use(express.json());

    app.use('/api', healthRoutes);
    app.use('/api', profileRoutes);

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
};

export const registerStartupLogging = (port: number) => {
    logger.info('Backend architecture initialized', { port });
};
