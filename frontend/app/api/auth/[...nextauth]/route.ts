import { NextRequest } from 'next/server';
import { proxyAuthRequest } from '@/lib/authProxy';

/**
 * Handles /api/auth/{path} sub-paths (e.g. /api/auth/me, /api/auth/logout).
 *
 * The endpoint is extracted from the URL path segment rather than relying
 * solely on the ?endpoint= query parameter. This fixes the logout flow where
 * POST /api/auth/logout was incorrectly forwarded as /api/auth/login.
 */
function extractEndpoint(request: NextRequest): string {
    // pathname looks like /api/auth/me  →  segments = ['api', 'auth', 'me']
    const segments = request.nextUrl.pathname.split('/').filter(Boolean);
    const pathEndpoint = segments[2]; // the segment after /api/auth/

    if (pathEndpoint) {
        return pathEndpoint;
    }

    // Fall back to query param for backward compatibility
    return request.nextUrl.searchParams.get('endpoint') || 'me';
}

export async function POST(request: NextRequest) {
    const endpoint = extractEndpoint(request);
    return proxyAuthRequest(request, endpoint);
}

export async function GET(request: NextRequest) {
    const endpoint = extractEndpoint(request);
    return proxyAuthRequest(request, endpoint);
}
