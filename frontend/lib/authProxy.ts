import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

/**
 * Proxies an auth API request to the backend Express server.
 *
 * - Forwards the HTTP method, body, and cookies.
 * - Reads the backend JSON response and returns it as a NextResponse.
 * - Properly forwards Set-Cookie headers from the backend onto the response
 *   that is actually returned (the original code set cookies on a throwaway
 *   NextResponse.next() which was never returned, causing auth tokens to be lost).
 */
export async function proxyAuthRequest(request: NextRequest, endpoint: string) {
    try {
        const url = `${BACKEND_URL}/api/auth/${endpoint}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Forward cookies so the backend can read refresh/access tokens
        const cookie = request.headers.get('cookie');
        if (cookie) {
            headers['Cookie'] = cookie;
        }

        const options: RequestInit = {
            method: request.method,
            headers,
            credentials: 'include',
        };

        // Forward body for non-GET/HEAD requests
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            try {
                const body = await request.json();
                options.body = JSON.stringify(body);
            } catch {
                // No JSON body to forward — that's OK
            }
        }

        const response = await fetch(url, options);

        // Guard against non-JSON responses (e.g. HTML 404 pages)
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error(
                `Backend returned non-JSON response (status ${response.status}, content-type: ${contentType})`
            );
            return NextResponse.json(
                { success: false, message: 'Backend returned an invalid response' },
                { status: 502 }
            );
        }

        const data = await response.json();

        // Build the response that will actually be returned to the client
        const nextResponse = NextResponse.json(data, { status: response.status });

        // Forward Set-Cookie headers from the backend onto the real response.
        // getSetCookie() returns an array of individual cookie strings (reliable),
        // unlike get('set-cookie') which joins them with ", " and can break
        // when cookie values contain commas.
        const setCookieHeaders = response.headers.getSetCookie();
        if (setCookieHeaders && setCookieHeaders.length > 0) {
            setCookieHeaders.forEach((cookie) => {
                const parts = cookie.split(';');
                const [name, value] = parts[0].trim().split('=');

                // Parse max-age so cookie expiry is preserved
                let maxAge: number | undefined;
                const maxAgePart = parts.find((p) =>
                    p.trim().toLowerCase().startsWith('max-age')
                );
                if (maxAgePart) {
                    maxAge = parseInt(maxAgePart.split('=')[1].trim(), 10);
                }

                if (name && value) {
                    nextResponse.cookies.set(name, value, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'strict',
                        path: '/',
                        maxAge,
                    });
                }
            });
        }

        return nextResponse;
    } catch (error) {
        console.error('Auth API proxy error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
