import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const endpoint = request.nextUrl.searchParams.get('endpoint') || 'login';

        const response = await fetch(`${BACKEND_URL}/api/auth/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            credentials: 'include',
        });

        const data = await response.json();

        // Forward cookies from backend to frontend
        const cookies = response.headers.get('set-cookie');
        if (cookies) {
            const cookieArray = cookies.split(', ');
            cookieArray.forEach(cookie => {
                const [nameValue] = cookie.split(';');
                const [name, value] = nameValue.split('=');
                if (name && value) {
                    NextResponse.next().cookies.set(name, value, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'strict',
                    });
                }
            });
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Auth API error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const endpoint = request.nextUrl.searchParams.get('endpoint') || 'me';

        const response = await fetch(`${BACKEND_URL}/api/auth/${endpoint}`, {
            method: 'GET',
            headers: {
                'Cookie': request.headers.get('cookie') || '',
            },
            credentials: 'include',
        });

        const data = await response.json();

        // Forward cookies
        const cookies = response.headers.get('set-cookie');
        if (cookies) {
            const cookieArray = cookies.split(', ');
            cookieArray.forEach(cookie => {
                const [nameValue] = cookie.split(';');
                const [name, value] = nameValue.split('=');
                if (name && value) {
                    NextResponse.next().cookies.set(name, value, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'strict',
                    });
                }
            });
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Auth API error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}