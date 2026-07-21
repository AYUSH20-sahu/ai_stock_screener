import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

interface YahooFinanceSearchResponse {
    quotes?: Array<{
        symbol?: string;
        shortname?: string;
        longname?: string;
        exchDisp?: string;
        typeDisp?: string;
    }>;
}

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

function getRecordArray(container: Record<string, unknown> | undefined, key: string) {
    const value = container?.[key];
    return Array.isArray(value) ? value : [];
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

    async searchStocks(query: string) {
        const normalized = query.trim().toUpperCase();
        const cacheKey = this.getCacheKey('search', normalized);
        const cached = this.getCached<{ items: Array<{ symbol: string; name: string; exchange: string; type: string }> }>(cacheKey);
        if (cached) {
            return cached;
        }

        const payload = await yahooFinance.search(query, { quotesCount: 8, newsCount: 0 }) as { quotes?: Array<Record<string, unknown>> };
        const items = ((payload.quotes || []) as Array<Record<string, unknown>>)
            .slice(0, 8)
            .map((item: Record<string, unknown>) => ({
                symbol: typeof item.symbol === 'string' ? item.symbol : 'N/A',
                name: typeof item.shortname === 'string' ? item.shortname : (typeof item.longname === 'string' ? item.longname : 'Unknown'),
                exchange: typeof item.exchDisp === 'string' ? item.exchDisp : 'N/A',
                type: typeof item.typeDisp === 'string' ? item.typeDisp : 'Equity',
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

        const payload = await yahooFinance.quote(normalized) as Record<string, unknown>;
        const payloadResult = {
            symbol: typeof payload.symbol === 'string' ? payload.symbol : normalized,
            shortName: typeof payload.shortName === 'string' ? payload.shortName : (typeof payload.longName === 'string' ? payload.longName : normalized),
            regularMarketPrice: typeof payload.regularMarketPrice === 'number' ? payload.regularMarketPrice : null,
            regularMarketChangePercent: typeof payload.regularMarketChangePercent === 'number' ? payload.regularMarketChangePercent : 0,
            currency: typeof payload.currency === 'string' ? payload.currency : 'USD',
            exchangeName: typeof payload.exchangeName === 'string' ? payload.exchangeName : 'N/A',
            fullExchangeName: typeof payload.fullExchangeName === 'string' ? payload.fullExchangeName : 'N/A',
            marketCap: typeof payload.marketCap === 'number' ? payload.marketCap : null,
            fiftyTwoWeekHigh: typeof payload.fiftyTwoWeekHigh === 'number' ? payload.fiftyTwoWeekHigh : null,
            fiftyTwoWeekLow: typeof payload.fiftyTwoWeekLow === 'number' ? payload.fiftyTwoWeekLow : null,
            trailingPE: typeof payload.trailingPE === 'number' ? payload.trailingPE : null,
            priceToBook: typeof payload.priceToBook === 'number' ? payload.priceToBook : null,
            dividendYield: typeof payload.dividendYield === 'number' ? payload.dividendYield : null,
            marketState: typeof payload.marketState === 'string' ? payload.marketState : 'CLOSED',
            quoteType: typeof payload.quoteType === 'string' ? payload.quoteType : 'EQUITY',
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

        const payload = await yahooFinance.quoteSummary(normalized, {
            modules: ['assetProfile', 'price', 'defaultKeyStatistics'],
        }) as Record<string, unknown>;
        const assetProfile = payload.assetProfile as Record<string, unknown> | undefined;
        const price = payload.price as Record<string, unknown> | undefined;
        const defaultKeyStatistics = payload.defaultKeyStatistics as Record<string, unknown> | undefined;

        const companyInfo = {
            symbol: normalized,
            sector: typeof assetProfile?.sector === 'string' ? assetProfile.sector : 'N/A',
            industry: typeof assetProfile?.industry === 'string' ? assetProfile.industry : 'N/A',
            website: typeof assetProfile?.website === 'string' ? assetProfile.website : null,
            longBusinessSummary: typeof assetProfile?.longBusinessSummary === 'string' ? assetProfile.longBusinessSummary : null,
            regularMarketPrice: typeof price?.regularMarketPrice === 'number' ? price.regularMarketPrice : null,
            currency: typeof price?.currency === 'string' ? price.currency : 'USD',
            exchangeName: typeof price?.exchangeName === 'string' ? price.exchangeName : 'N/A',
            marketCap: typeof defaultKeyStatistics?.marketCap === 'number' ? defaultKeyStatistics.marketCap : null,
            enterpriseValue: typeof defaultKeyStatistics?.enterpriseValue === 'number' ? defaultKeyStatistics.enterpriseValue : null,
            trailingPE: typeof defaultKeyStatistics?.trailingPE === 'number' ? defaultKeyStatistics.trailingPE : null,
            priceToBook: typeof defaultKeyStatistics?.priceToBook === 'number' ? defaultKeyStatistics.priceToBook : null,
            dividendYield: typeof defaultKeyStatistics?.dividendYield === 'number' ? defaultKeyStatistics.dividendYield : null,
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

        const payload = await yahooFinance.quoteSummary(normalized, {
            modules: ['defaultKeyStatistics', 'financialData', 'summaryDetail'],
        }) as Record<string, unknown>;
        const defaultKeyStatistics = payload.defaultKeyStatistics as Record<string, unknown> | undefined;
        const financialData = payload.financialData as Record<string, unknown> | undefined;
        const summaryDetail = payload.summaryDetail as Record<string, unknown> | undefined;

        const ratios = {
            symbol: normalized,
            defaultKeyStatistics: defaultKeyStatistics || {},
            financialData: financialData || {},
            summaryDetail: summaryDetail || {},
        };
        this.setCache(cacheKey, ratios);
        return ratios;
    }

    async getFinancialStatements(symbol: string) {
        const normalized = symbol.trim().toUpperCase();
        const cacheKey = this.getCacheKey('statements', normalized);
        const cached = this.getCached<unknown>(cacheKey);
        if (cached) {
            return cached;
        }

        const payload = await yahooFinance.quoteSummary(normalized, {
            modules: [
                'incomeStatementHistory',
                'incomeStatementHistoryQuarterly',
                'balanceSheetHistory',
                'balanceSheetHistoryQuarterly',
                'cashflowStatementHistory',
                'cashflowStatementHistoryQuarterly',
                'earnings',
            ],
        }) as Record<string, unknown>;

        const incomeAnnual = payload.incomeStatementHistory as Record<string, unknown> | undefined;
        const incomeQuarterly = payload.incomeStatementHistoryQuarterly as Record<string, unknown> | undefined;
        const balanceAnnual = payload.balanceSheetHistory as Record<string, unknown> | undefined;
        const balanceQuarterly = payload.balanceSheetHistoryQuarterly as Record<string, unknown> | undefined;
        const cashflowAnnual = payload.cashflowStatementHistory as Record<string, unknown> | undefined;
        const cashflowQuarterly = payload.cashflowStatementHistoryQuarterly as Record<string, unknown> | undefined;
        const earnings = payload.earnings as Record<string, unknown> | undefined;
        const earningsChart = earnings?.earningsChart as Record<string, unknown> | undefined;
        const financialsChart = earnings?.financialsChart as Record<string, unknown> | undefined;

        const statements = {
            symbol: normalized,
            incomeAnnual: getRecordArray(incomeAnnual, 'incomeStatementHistory'),
            incomeQuarterly: getRecordArray(incomeQuarterly, 'incomeStatementHistory'),
            balanceAnnual: getRecordArray(balanceAnnual, 'balanceSheetStatements'),
            balanceQuarterly: getRecordArray(balanceQuarterly, 'balanceSheetStatements'),
            cashflowAnnual: getRecordArray(cashflowAnnual, 'cashflowStatements'),
            cashflowQuarterly: getRecordArray(cashflowQuarterly, 'cashflowStatements'),
            earningsQuarterly: getRecordArray(earningsChart, 'quarterly'),
            revenueAnnual: getRecordArray(financialsChart, 'yearly'),
        };
        this.setCache(cacheKey, statements);
        return statements;
    }

    async getPriceHistory(symbol: string) {
        const normalized = symbol.trim().toUpperCase();
        const cacheKey = this.getCacheKey('history', normalized);
        const cached = this.getCached<unknown>(cacheKey);
        if (cached) {
            return cached;
        }

        const period1 = new Date();
        period1.setMonth(period1.getMonth() - 6);
        const history = await yahooFinance.chart(normalized, {
            period1,
            interval: '1wk',
        });
        const prices = history.quotes
            .filter((item) => typeof item.close === 'number')
            .map((item) => ({
                date: item.date,
                open: typeof item.open === 'number' ? item.open : item.close,
                high: typeof item.high === 'number' ? item.high : item.close,
                low: typeof item.low === 'number' ? item.low : item.close,
                close: item.close,
                volume: typeof item.volume === 'number' ? item.volume : null,
            }));

        const result = { symbol: normalized, prices };
        this.setCache(cacheKey, result);
        return result;
    }
}

export const stockService = new StockService();
