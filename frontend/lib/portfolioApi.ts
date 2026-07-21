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

export type PortfolioHolding = {
    id: string;
    symbol: string;
    exchange: string;
    quantity: number;
    averagePrice: number;
    investedAmount: number;
    currentValue: number | null;
    createdAt: string;
};

export type Portfolio = {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    holdings: PortfolioHolding[];
};

export async function getPortfolios(): Promise<{ success: boolean; data: Portfolio[] }> {
    return requestJson('/api/portfolio');
}

export async function createPortfolio(name: string, description?: string): Promise<{ success: boolean; data: Portfolio }> {
    return requestJson('/api/portfolio', {
        method: 'POST',
        body: JSON.stringify({ name, description }),
    });
}

export async function addHolding(
    portfolioId: string,
    symbol: string,
    quantity: number,
    averagePrice: number,
    exchange?: string,
): Promise<{ success: boolean; data: PortfolioHolding }> {
    return requestJson('/api/portfolio/holding', {
        method: 'POST',
        body: JSON.stringify({ portfolioId, symbol, quantity, averagePrice, exchange }),
    });
}

export async function updateHolding(
    id: string,
    quantity: number,
    averagePrice: number,
): Promise<{ success: boolean; data: PortfolioHolding }> {
    return requestJson(`/api/portfolio/holding/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity, averagePrice }),
    });
}

export async function removeHolding(id: string): Promise<{ success: boolean; message?: string }> {
    return requestJson(`/api/portfolio/holding/${id}`, {
        method: 'DELETE',
    });
}