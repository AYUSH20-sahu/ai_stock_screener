const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

export async function getMarketOverview() {
    return requestJson<{ success: boolean; data: Array<{ label: string; value: string; change: string; up: boolean }> }>(`/api/stocks/market-overview`);
}

export async function getMarketMovers() {
    return requestJson<{ success: boolean; data: { topGainers: Array<{ symbol: string; price: string; change: string }>; topLosers: Array<{ symbol: string; price: string; change: string }>; trending: Array<{ symbol: string; price: string; change: string }> } }>(`/api/stocks/market-movers`);
}

export async function getMarketNews() {
    return requestJson<{ success: boolean; data: Array<{ title: string; summary: string; url: string; publishedAt: string; source: string }> }>(`/api/stocks/market-news`);
}

type ScreenerStock = {
    symbol: string;
    name: string;
    sector: string;
    marketCap: number;
    pe: number | null;
    pb: number | null;
    roe: number | null;
    roce: number | null;
    revenue: number;
    dividend: number | null;
    price: number;
    change: number;
};

type ScreenerQueryParams = {
    query: string;
    sector: string;
    marketCapMin: string;
    marketCapMax: string;
    peMin: string;
    peMax: string;
    pbMin: string;
    pbMax: string;
    roeMin: string;
    roeMax: string;
    roceMin: string;
    roceMax: string;
    revenueMin: string;
    revenueMax: string;
    dividendMin: string;
    dividendMax: string;
    sortKey: string;
    sortDirection: 'asc' | 'desc';
    page: number;
    pageSize: number;
};

export async function getScreener(params: ScreenerQueryParams) {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.append('query', params.query);
    if (params.sector && params.sector !== 'All') searchParams.append('sector', params.sector);
    if (params.marketCapMin) searchParams.append('marketCapMin', params.marketCapMin);
    if (params.marketCapMax) searchParams.append('marketCapMax', params.marketCapMax);
    if (params.peMin) searchParams.append('peMin', params.peMin);
    if (params.peMax) searchParams.append('peMax', params.peMax);
    if (params.pbMin) searchParams.append('pbMin', params.pbMin);
    if (params.pbMax) searchParams.append('pbMax', params.pbMax);
    if (params.roeMin) searchParams.append('roeMin', params.roeMin);
    if (params.roeMax) searchParams.append('roeMax', params.roeMax);
    if (params.roceMin) searchParams.append('roceMin', params.roceMin);
    if (params.roceMax) searchParams.append('roceMax', params.roceMax);
    if (params.revenueMin) searchParams.append('revenueMin', params.revenueMin);
    if (params.revenueMax) searchParams.append('revenueMax', params.revenueMax);
    if (params.dividendMin) searchParams.append('dividendMin', params.dividendMin);
    if (params.dividendMax) searchParams.append('dividendMax', params.dividendMax);
    if (params.sortKey) searchParams.append('sortKey', params.sortKey);
    if (params.sortDirection) searchParams.append('sortDirection', params.sortDirection);
    searchParams.append('page', String(params.page));
    searchParams.append('pageSize', String(params.pageSize));

    return requestJson<{ success: boolean; data: { items: Array<ScreenerStock>; total: number; page: number; pageSize: number } }>(`/api/stocks/screener?${searchParams.toString()}`);
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

export async function getStockNews(symbol: string) {
    return requestJson<{ success: boolean; data: Array<{ title: string; summary: string; url: string; publishedAt: string; source: string }> }>(`/api/stocks/${encodeURIComponent(symbol)}/news`);
}

export async function getRelatedStocks(symbol: string) {
    return requestJson<{ success: boolean; data: Array<{ symbol: string; name: string; exchange: string }> }>(`/api/stocks/${encodeURIComponent(symbol)}/related`);
}
