export type AuthUser = {
    id: string;
    email: string;
    fullName?: string | null;
    imageUrl?: string | null;
    createdAt?: string;
};

type AuthResponse<T> = {
    success?: boolean;
    message?: string;
    data?: T;
};

async function readJson<T>(response: Response): Promise<T | null> {
    const text = await response.text();
    if (!text) {
        return null;
    }

    try {
        return JSON.parse(text) as T;
    } catch {
        return null;
    }
}

async function authRequest<T>(path: string, init: RequestInit = {}, didRetry = false) {
    const response = await fetch(`/api/auth${path}`, {
        credentials: 'include',
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(init.headers || {}),
        },
    });

    const body = await readJson<AuthResponse<T>>(response);

    if ((!response.ok || body?.success === false) && !didRetry && response.status === 401 && path !== '/refresh' && path !== '/login' && path !== '/register') {
        const refreshResponse = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (refreshResponse.ok) {
            return authRequest<T>(path, init, true);
        }
    }

    if (!response.ok || body?.success === false) {
        throw new Error(body?.message || 'Request failed');
    }

    return body as AuthResponse<T>;
}

export function login(email: string, password: string) {
    return authRequest<{ user: AuthUser; accessToken: string }>('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

export function register(email: string, password: string, fullName: string) {
    return authRequest<{ user: AuthUser; accessToken: string }>('/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName }),
    });
}

export function forgotPassword(email: string) {
    return authRequest<{ resetToken?: string }>('/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
}

export function resetPassword(token: string, password: string) {
    return authRequest<null>('/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
    });
}

export function getCurrentUser() {
    return authRequest<{ user: AuthUser }>('/me', {
        method: 'GET',
    });
}

export function logout() {
    return authRequest<null>('/logout', {
        method: 'POST',
    });
}
