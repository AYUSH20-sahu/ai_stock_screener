import { NextRequest } from 'next/server';
import { proxyAuthRequest } from '@/lib/authProxy';

/**
 * Handles the base /api/auth/ path.
 *
 * The frontend calls this with an ?endpoint= query parameter, e.g.:
 *   POST /api/auth/?endpoint=register
 *   POST /api/auth/?endpoint=login
 *
 * Without this file Next.js returns a 404 HTML page for /api/auth/ (the
 * [...nextauth] catch-all only matches paths with at least one segment
 * after /api/auth/), which caused the "Unexpected token '<', \"<!DOCTYPE\"..."
 * JSON parse error on the client.
 */
export async function POST(request: NextRequest) {
    const endpoint = request.nextUrl.searchParams.get('endpoint') || 'login';
    return proxyAuthRequest(request, endpoint);
}

export async function GET(request: NextRequest) {
    const endpoint = request.nextUrl.searchParams.get('endpoint') || 'me';
    return proxyAuthRequest(request, endpoint);
}
