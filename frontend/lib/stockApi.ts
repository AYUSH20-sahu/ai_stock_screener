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

export async function searchStocks(query: string) {
    return requestJson<{ success: boolean; data: { items: Array<{ symbol: string; name: string; exchange: string; type: string }> } }>(`/api/stocks/search?q=${encodeURIComponent(query)}`);
}

export async function getStockQuote(symbol: string) {
    return requestJson<{ success: boolean; data: unknown }>(`/api/stocks/${encodeURIComponent(symbol)}/quote`);
}

export async function getStockCompanyInfo(symbol: string) {
    return requestJson<{ success: boolean; data: unknown }>(`/api/stocks/${encodeURIComponent(symbol)}/company`);
}

export async function getStockFinancialRatios(symbol: string) {
    return requestJson<{ success: boolean; data: unknown }>(`/api/stocks/${encodeURIComponent(symbol)}/ratios`);
}

export async function getStockFinancialStatements(symbol: string) {
    return requestJson<{ success: boolean; data: unknown }>(`/api/stocks/${encodeURIComponent(symbol)}/statements`);
}

export async function getStockPriceHistory(symbol: string) {
    return requestJson<{ success: boolean; data: unknown }>(`/api/stocks/${encodeURIComponent(symbol)}/history`);
}
