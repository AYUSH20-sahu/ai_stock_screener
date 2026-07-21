const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers || {}),
        },
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(errorBody || `API request failed with status ${response.status}`);
    }

    return response.json() as Promise<T>;
}

export type FavoriteStockItem = {
    id: string;
    symbol: string;
    name: string;
    addedAt: string;
};

export async function getFavorites(): Promise<{ success: boolean; data: FavoriteStockItem[] }> {
    return requestJson('/api/favorites');
}

export async function addFavorite(symbol: string, name?: string): Promise<{ success: boolean; data: FavoriteStockItem; message?: string }> {
    return requestJson('/api/favorites', {
        method: 'POST',
        body: JSON.stringify({ symbol, name }),
    });
}

export async function removeFavorite(symbol: string): Promise<{ success: boolean; message?: string }> {
    return requestJson(`/api/favorites/${encodeURIComponent(symbol)}`, {
        method: 'DELETE',
    });
}