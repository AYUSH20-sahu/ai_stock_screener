import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import healthRoutes from './routes/health.routes';
import profileRoutes from './routes/profile.routes';
import stockRoutes from './routes/stock.routes';
import geminiRoutes from './routes/gemini.routes';
import favoritesRoutes from './routes/favorites.routes';
import portfolioRoutes from './routes/portfolio.routes';
import { notFoundHandler } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';
import { logger } from './utils/logger';
import { env } from './config/env';

const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? [process.env.FRONTEND_URL || 'https://ai-stock-screener.vercel.app']
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    optionsSuccessStatus: 200,
};

export const createApp = () => {
    const app = express();

    app.use(helmet());
    app.use(cors(corsOptions));
    app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
    app.use(compression());
    app.use(express.json());

    app.use('/api', healthRoutes);
    app.use('/api', profileRoutes);
    app.use('/api', stockRoutes);
    app.use('/api', geminiRoutes);
    app.use('/api', favoritesRoutes);
    app.use('/api', portfolioRoutes);

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
};

export const registerStartupLogging = (port: number) => {
    logger.info('Backend architecture initialized', { port });
};
