import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClient;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        datasources: {
            db: {
                url: env.databaseUrl,
            },
        },
    });

if (env.nodeEnv !== 'production') {
    globalForPrisma.prisma = prisma;
}
