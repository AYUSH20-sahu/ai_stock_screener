import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // Hash a demo password
    const demoPassword = 'Demo123!';
    const passwordHash = await bcrypt.hash(demoPassword, 10);

    const user = await prisma.user.upsert({
        where: { email: 'demo@example.com' },
        update: {},
        create: {
            email: 'demo@example.com',
            fullName: 'Demo User',
            passwordHash: passwordHash,
        },
    });

    await prisma.watchlist.createMany({
        data: [
            {
                name: 'High Growth',
                description: 'Growth oriented watchlist',
                userId: user.id,
            },
        ],
        skipDuplicates: true,
    });

    await prisma.portfolio.createMany({
        data: [
            {
                name: 'Core Portfolio',
                description: 'Long term picks',
                userId: user.id,
            },
        ],
        skipDuplicates: true,
    });
}

main()
    .catch((error) => {
        console.error('Seed error:', error);
        throw error;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
