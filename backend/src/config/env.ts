import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

function requiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

export const env = {
    port: Number(process.env.PORT || 5000),
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: requiredEnv('DATABASE_URL'),
    alphaVantageApiKey: process.env.ALPHA_VANTAGE_API_KEY || '',
    jwtSecret: requiredEnv('JWT_SECRET'),
    jwtRefreshSecret: requiredEnv('JWT_REFRESH_SECRET'),
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};
