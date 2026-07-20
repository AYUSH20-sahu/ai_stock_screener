import { createHash } from 'crypto';

interface YahooFinanceQuoteResponse {
    quoteResponse?: {
        result?: Array<{
            symbol?: string;
            shortName?: string;
            longName?: string;
            regularMarketPrice?: number;
            regularMarketChangePercent?: number;
            marketCap?: number;
            currency?: string;
            exchangeName?: string;
            fullExchangeName?: string;
            fiftyTwoWeekHigh?: number;
            fiftyTwoWeekLow?: number;
            trailingPE?: number;
            priceToBook?: number;
            dividendYield?: number;
            marketState?: string;
            quoteType?: string;
        }>;
    };
}

interface YahooFinanceSearchResponse {
    quotes?: Array<{
        symbol?: string;
        shortname?: string;
        longname?: string;
        exchDisp?: string;
        typeDisp?: string;
    }>;
}

interface YahooFinanceCompanyResponse {
    summaryProfile?: {
        sector?: string;
        industry?: string;
        website?: string;
        longBusinessSummary?: string;
    };
    price?: {
        regularMarketPrice?: number;
        currency?: string;
        exchangeName?: string;
    };
    defaultKeyStatistics?: {
        marketCap?: number;
        enterpriseValue?: number;
        trailingPE?: number;
        priceToBook?: number;
        dividendYield?: number;
    };
}

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

class StockService {
    private cache = new Map<string, CacheEntry<unknown>>();

    private getCacheKey(prefix: string, symbol: string) {
        return `${prefix}:${symbol.toUpperCase()}`;
    }

    private getCached<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.value as T;
    }

    private setCache<T>(key: string, value: T, ttlMs = 5 * 60 * 1000) {
        this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
    }

    private async fetchJson<T>(url: string): Promise<T> {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(`Yahoo Finance request failed with status ${response.status}`);
        }
        return (await response.json()) as T;
    }

    async searchStocks(query: string) {
        const normalized = query.trim().toUpperCase();
        const cacheKey = this.getCacheKey('search', normalized);
        const cached = this.getCached<{ items: Array<{ symbol: string; name: string; exchange: string; type: string }> }>(cacheKey);
        if (cached) {
            return cached;
        }

        const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}`;
        const payload = await this.fetchJson<YahooFinanceSearchResponse>(url);
        const items = (payload.quotes || [])
            .slice(0, 8)
            .map((item) => ({
                symbol: item.symbol || 'N/A',
                name: item.longname || item.shortname || 'Unknown',
                exchange: item.exchDisp || 'N/A',
                type: item.typeDisp || 'Equity',
            }));

        const result = { items };
        this.setCache(cacheKey, result);
        return result;
    }

    async getQuote(symbol: string) {
        const normalized = symbol.trim().toUpperCase();
        const cacheKey = this.getCacheKey('quote', normalized);
        const cached = this.getCached<unknown>(cacheKey);
        if (cached) {
            return cached;
        }

        const url = `https://query1.finance.yahoo.com/v2/finance/quote?symbols=${encodeURIComponent(normalized)}`;
        const payload = await this.fetchJson<YahooFinanceQuoteResponse>(url);
        const result = payload.quoteResponse?.result?.[0];
        if (!result) {
            throw new Error(`No quote data found for ${normalized}`);
        }

        const payloadResult = {
            symbol: result.symbol || normalized,
            shortName: result.shortName || result.longName || normalized,
            regularMarketPrice: result.regularMarketPrice || null,
            regularMarketChangePercent: result.regularMarketChangePercent || 0,
            currency: result.currency || 'USD',
            exchangeName: result.exchangeName || 'N/A',
            fullExchangeName: result.fullExchangeName || 'N/A',
            marketCap: result.marketCap || null,
            fiftyTwoWeekHigh: result.fiftyTwoWeekHigh || null,
            fiftyTwoWeekLow: result.fiftyTwoWeekLow || null,
            trailingPE: result.trailingPE || null,
            priceToBook: result.priceToBook || null,
            dividendYield: result.dividendYield || null,
            marketState: result.marketState || 'CLOSED',
            quoteType: result.quoteType || 'EQUITY',
        };
        this.setCache(cacheKey, payloadResult);
        return payloadResult;
    }

    async getCompanyInfo(symbol: string) {
        const normalized = symbol.trim().toUpperCase();
        const cacheKey = this.getCacheKey('company', normalized);
        const cached = this.getCached<unknown>(cacheKey);
        if (cached) {
            return cached;
        }

        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(normalized)}?interval=1d&range=1d`;
        const payload = await this.fetchJson<{ chart?: { result?: Array<{ meta?: { symbol?: string } }> } }>(url);
        const companySymbol = payload.chart?.result?.[0]?.meta?.symbol || normalized;

        const profileUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(companySymbol)}?modules=assetProfile,price,defaultKeyStatistics`;
        const profilePayload = await this.fetchJson<{ quoteSummary?: { result?: Array<YahooFinanceCompanyResponse> } }>(profileUrl);
        const result = profilePayload.quoteSummary?.result?.[0];
        if (!result) {
            throw new Error(`No company data found for ${normalized}`);
        }

        const companyInfo = {
            symbol: companySymbol,
            sector: result.summaryProfile?.sector || 'N/A',
            industry: result.summaryProfile?.industry || 'N/A',
            website: result.summaryProfile?.website || null,
            longBusinessSummary: result.summaryProfile?.longBusinessSummary || null,
            regularMarketPrice: result.price?.regularMarketPrice || null,
            currency: result.price?.currency || 'USD',
            exchangeName: result.price?.exchangeName || 'N/A',
            marketCap: result.defaultKeyStatistics?.marketCap || null,
            enterpriseValue: result.defaultKeyStatistics?.enterpriseValue || null,
            trailingPE: result.defaultKeyStatistics?.trailingPE || null,
            priceToBook: result.defaultKeyStatistics?.priceToBook || null,
            dividendYield: result.defaultKeyStatistics?.dividendYield || null,
        };
        this.setCache(cacheKey, companyInfo);
        return companyInfo;
    }

    async getFinancialRatios(symbol: string) {
        const normalized = symbol.trim().toUpperCase();
        const cacheKey = this.getCacheKey('ratios', normalized);
        const cached = this.getCached<unknown>(cacheKey);
        if (cached) {
            return cached;
        }

        const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(normalized)}?modules=defaultKeyStatistics,financialData,summaryDetail`;
        const payload = await this.fetchJson<{ quoteSummary?: { result?: Array<{ defaultKeyStatistics?: Record<string, unknown>; financialData?: Record<string, unknown>; summaryDetail?: Record<string, unknown> }> } }>(url);
        const result = payload.quoteSummary?.result?.[0];
        if (!result) {
            throw new Error(`No financial ratio data found for ${normalized}`);
        }

        const ratios = {
            symbol: normalized,
            defaultKeyStatistics: result.defaultKeyStatistics || {},
            financialData: result.financialData || {},
            summaryDetail: result.summaryDetail || {},
        };
        this.setCache(cacheKey, ratios);
        return ratios;
    }
}

export const stockService = new StockService();
