import { createClerkClient } from '@clerk/backend';

const clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY || '',
});

export const syncUserToDb = async (userId: string, email: string, name?: string) => {
    const user = await clerk.users.getUser(userId);
    return {
        clerkUserId: user.id,
        email: user.emailAddresses[0]?.emailAddress || email,
        name: user.firstName || name || 'User',
    };
};
