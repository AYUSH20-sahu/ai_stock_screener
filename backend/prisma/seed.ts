import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.upsert({
        where: { email: 'demo@example.com' },
        update: {},
        create: {
            clerkId: 'demo-clerk-id',
            email: 'demo@example.com',
            fullName: 'Demo User',
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
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
