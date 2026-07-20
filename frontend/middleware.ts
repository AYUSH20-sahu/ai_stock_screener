import { authMiddleware } from '@clerk/nextjs/server';

export default authMiddleware({
    publicRoutes: ['/', '/about'],
});

export const config = {
    matcher: ['/((?!.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)'],
};
