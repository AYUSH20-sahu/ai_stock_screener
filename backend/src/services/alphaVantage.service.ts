import { env } from '../config/env';

const BASE_URL = 'https://www.alphavantage.co/query';

function getAlphaVantageApiKey(): string {
    if (!env.alphaVantageApiKey) {
        throw new Error(
            'Missing required environment variable: ALPHA_VANTAGE_API_KEY. Set this in Render dashboard or backend .env.local before using stock data routes.'
        );
    }
    return env.alphaVantageApiKey;
}

function buildUrl(params: Record<string, string>): string {
    const searchParams = new URLSearchParams({ apikey: getAlphaVantageApiKey(), ...params });
    return `${BASE_URL}?${searchParams.toString()}`;
}

async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Alpha Vantage request failed with status ${response.status}`);
    }
    const data = (await response.json()) as Record<string, unknown>;

    if (typeof data === 'object' && data !== null) {
        if ('Error Message' in data && typeof data['Error Message'] === 'string') {
            throw new Error(`Alpha Vantage error: ${data['Error Message']}`);
        }
        if ('Note' in data && typeof data['Note'] === 'string') {
            throw new Error(`Alpha Vantage rate limit: ${data['Note']}`);
        }
    }

    return data as T;
}

export async function getQuoteData(symbol: string) {
    const url = buildUrl({ function: 'GLOBAL_QUOTE', symbol });
    return fetchJson<Record<string, Record<string, string>>>(url);
}

export async function getSymbolSearch(query: string) {
    const url = buildUrl({ function: 'SYMBOL_SEARCH', keywords: query });
    return fetchJson<Record<string, Array<Record<string, string>>>>(url);
}

export async function getOverview(symbol: string) {
    const url = buildUrl({ function: 'OVERVIEW', symbol });
    return fetchJson<Record<string, string>>(url);
}

export async function getIncomeStatement(symbol: string) {
    const url = buildUrl({ function: 'INCOME_STATEMENT', symbol });
    return fetchJson<Record<string, unknown>>(url);
}

export async function getBalanceSheet(symbol: string) {
    const url = buildUrl({ function: 'BALANCE_SHEET', symbol });
    return fetchJson<Record<string, unknown>>(url);
}

export async function getCashFlow(symbol: string) {
    const url = buildUrl({ function: 'CASH_FLOW', symbol });
    return fetchJson<Record<string, unknown>>(url);
}

export async function getEarnings(symbol: string) {
    const url = buildUrl({ function: 'EARNINGS', symbol });
    return fetchJson<Record<string, unknown>>(url);
}

export async function getTimeSeriesWeekly(symbol: string) {
    const url = buildUrl({ function: 'TIME_SERIES_WEEKLY', symbol });
    return fetchJson<Record<string, Record<string, Record<string, string>>>>(url);
}
