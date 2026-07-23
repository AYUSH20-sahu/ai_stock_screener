import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const accessToken = req.cookies.get('accessToken');

    // Public routes that don't require authentication
    const publicRoutes = ['/', '/sign-in', '/sign-up', '/login', '/register'];
    const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname === route);

    if (isPublicRoute) {
        return NextResponse.next();
    }

    // If no token and trying to access protected route, redirect to login
    if (!accessToken && !isPublicRoute) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)'],
};