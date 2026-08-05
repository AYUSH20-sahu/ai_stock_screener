import { getQuoteData, getSymbolSearch, getOverview, getIncomeStatement, getBalanceSheet, getCashFlow, getEarnings, getTimeSeriesWeekly } from './alphaVantage.service';

interface NewsItem {
    title: string;
    summary: string;
    url: string;
    publishedAt: string;
    source: string;
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

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

export type ScreenerStock = {
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

export type ScreenerSortKey = 'marketCap' | 'pe' | 'pb' | 'roe' | 'roce' | 'revenue' | 'dividend' | 'price' | 'symbol';

export type ScreenerFilters = {
    query?: string;
    sector?: string;
    marketCapMin?: number;
    marketCapMax?: number;
    peMin?: number;
    peMax?: number;
    pbMin?: number;
    pbMax?: number;
    roeMin?: number;
    roeMax?: number;
    roceMin?: number;
    roceMax?: number;
    revenueMin?: number;
    revenueMax?: number;
    dividendMin?: number;
    dividendMax?: number;
    sortKey?: ScreenerSortKey;
    sortDirection?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
};

const SCREENER_UNIVERSE: Array<{ symbol: string; name: string; sector: string }> = [
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries Limited', sector: 'Energy' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services Ltd.', sector: 'Information Technology' },
    { symbol: 'INFY.NS', name: 'Infosys Ltd.', sector: 'Information Technology' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd.', sector: 'Financials' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd.', sector: 'Financials' },
    { symbol: 'HDFC.NS', name: 'HDFC Ltd.', sector: 'Financials' },
    { symbol: 'LT.NS', name: 'Larsen & Toubro Ltd.', sector: 'Industrials' },
    { symbol: 'ADANIENT.NS', name: 'Adani Enterprises Ltd.', sector: 'Energy' },
    { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Financials' },
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd.', sector: 'Communication Services' },
    { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever Ltd.', sector: 'Consumer Staples' },
    { symbol: 'ITC.NS', name: 'ITC Ltd.', sector: 'Consumer Staples' },
    { symbol: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto Ltd.', sector: 'Consumer Discretionary' },
    { symbol: 'MARUTI.NS', name: 'Maruti Suzuki India Ltd.', sector: 'Consumer Discretionary' },
    { symbol: 'ASIANPAINT.NS', name: 'Asian Paints Ltd.', sector: 'Materials' },
    { symbol: 'AXISBANK.NS', name: 'Axis Bank Ltd.', sector: 'Financials' },
    { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank Ltd.', sector: 'Financials' },
    { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Industries Ltd.', sector: 'Health Care' },
    { symbol: 'DRREDDY.NS', name: 'Dr. Reddy’s Laboratories Ltd.', sector: 'Health Care' },
    { symbol: 'TITAN.NS', name: 'Titan Company Ltd.', sector: 'Consumer Discretionary' },
    { symbol: 'WIPRO.NS', name: 'Wipro Ltd.', sector: 'Information Technology' },
    { symbol: 'TECHM.NS', name: 'Tech Mahindra Ltd.', sector: 'Information Technology' },
    { symbol: 'HCLTECH.NS', name: 'HCL Technologies Ltd.', sector: 'Information Technology' },
    { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement Ltd.', sector: 'Materials' },
    { symbol: 'NESTLEIND.NS', name: 'Nestle India Ltd.', sector: 'Consumer Staples' },
    { symbol: 'M&M.NS', name: 'Mahindra & Mahindra Ltd.', sector: 'Consumer Discretionary' },
    { symbol: 'SBILIFE.NS', name: 'SBI Life Insurance Company Ltd.', sector: 'Financials' },
    { symbol: 'EICHERMOT.NS', name: 'Eicher Motors Ltd.', sector: 'Consumer Discretionary' },
    { symbol: 'TATAMOTORS.NS', name: 'Tata Motors Ltd.', sector: 'Consumer Discretionary' },
    { symbol: 'BPCL.NS', name: 'BPCL Ltd.', sector: 'Energy' },
    { symbol: 'IOC.NS', name: 'Indian Oil Corporation Ltd.', sector: 'Energy' },
    { symbol: 'ONGC.NS', name: 'Oil and Natural Gas Corporation Ltd.', sector: 'Energy' },
    { symbol: 'POWERGRID.NS', name: 'Power Grid Corporation of India Ltd.', sector: 'Utilities' },
    { symbol: 'NTPC.NS', name: 'NTPC Ltd.', sector: 'Utilities' },
    { symbol: 'JSWSTEEL.NS', name: 'JSW Steel Ltd.', sector: 'Materials' },
    { symbol: 'COALINDIA.NS', name: 'Coal India Ltd.', sector: 'Materials' },
    { symbol: 'ADANIPORTS.NS', name: 'Adani Ports and Special Economic Zone Ltd.', sector: 'Industrials' },
    { symbol: 'HINDALCO.NS', name: 'Hindalco Industries Ltd.', sector: 'Materials' },
    { symbol: 'GRASIM.NS', name: 'Grasim Industries Ltd.', sector: 'Materials' },
];

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

    private parseRawNumber(value: unknown): number | null {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }

        if (typeof value === 'object' && value !== null && 'raw' in value && typeof (value as any).raw === 'number') {
            return (value as any).raw;
        }

        return null;
    }

    private async getScreenerSymbolData(symbol: string, name: string, sector: string): Promise<ScreenerStock> {
        const cacheKey = this.getCacheKey('screener', symbol);
        const cached = this.getCached<ScreenerStock>(cacheKey);
        if (cached) {
            return cached;
        }

        const quoteData = await getQuoteData(symbol);
        const quote = quoteData['Global Quote'] || {};

        const rawPrice = Number(quote['05. price'] ?? NaN);
        const rawChangePercent = Number(quote['10. change percent']?.replace('%', '') ?? NaN);
        const rawMarketCap = Number(quote['06. volume'] ?? NaN);

        const overview = await getOverview(symbol);
        const rawPe = Number(overview.PERatio ?? NaN);
        const rawPb = Number(overview.PriceToBookRatio ?? NaN);
        const rawRoe = Number(overview.ReturnOnEquityTTM ?? NaN);
        const rawRoce = Number(overview.ReturnOnAssetsTTM ?? NaN);
        const rawRevenue = Number(overview.RevenueTTM ?? NaN);
        const rawDividendYield = Number(overview.DividendYield ?? NaN);

        const stock: ScreenerStock = {
            symbol,
            name,
            sector,
            price: Number.isFinite(rawPrice) ? rawPrice : 0,
            change: Number.isFinite(rawChangePercent) ? rawChangePercent : 0,
            marketCap: Number.isFinite(rawMarketCap) ? rawMarketCap : 0,
            pe: Number.isFinite(rawPe) ? rawPe : null,
            pb: Number.isFinite(rawPb) ? rawPb : null,
            roe: Number.isFinite(rawRoe) ? Math.round(rawRoe * 100) / 100 : null,
            roce: Number.isFinite(rawRoce) ? Math.round(rawRoce * 100) / 100 : null,
            revenue: Number.isFinite(rawRevenue) ? rawRevenue : 0,
            dividend: Number.isFinite(rawDividendYield) ? Math.round(rawDividendYield * 10000) / 100 : null,
        };

        this.setCache(cacheKey, stock, 15 * 60 * 1000);
        return stock;
    }

    async getScreenerStocks(filters: ScreenerFilters) {
        const {
            query,
            sector,
            marketCapMin,
            marketCapMax,
            peMin,
            peMax,
            pbMin,
            pbMax,
            roeMin,
            roeMax,
            roceMin,
            roceMax,
            revenueMin,
            revenueMax,
            dividendMin,
            dividendMax,
            sortKey = 'marketCap',
            sortDirection = 'desc',
            page = 1,
            pageSize = 20,
        } = filters;

        const normalizedQuery = query?.trim().toLowerCase() || '';
        const sectorFilter = sector && sector !== 'All' ? sector : undefined;

        const candidates = SCREENER_UNIVERSE.filter((item) => {
            const matchesQuery =
                !normalizedQuery ||
                `${item.symbol} ${item.name} ${item.sector}`.toLowerCase().includes(normalizedQuery);
            const matchesSector = !sectorFilter || item.sector === sectorFilter;
            return matchesQuery && matchesSector;
        });

        const stockData = await Promise.allSettled(
            candidates.map((item) => this.getScreenerSymbolData(item.symbol, item.name, item.sector))
        );

        const stocks: ScreenerStock[] = stockData
            .filter((result): result is PromiseFulfilledResult<ScreenerStock> => result.status === 'fulfilled')
            .map((result) => result.value)
            .filter((stock) => {
                const matchesMarketCap =
                    (!marketCapMin || stock.marketCap >= marketCapMin) &&
                    (!marketCapMax || stock.marketCap <= marketCapMax);
                const matchesPe =
                    (!peMin || (stock.pe != null && stock.pe >= peMin)) &&
                    (!peMax || (stock.pe != null && stock.pe <= peMax));
                const matchesPb =
                    (!pbMin || (stock.pb != null && stock.pb >= pbMin)) &&
                    (!pbMax || (stock.pb != null && stock.pb <= pbMax));
                const matchesRoe =
                    (!roeMin || (stock.roe != null && stock.roe >= roeMin)) &&
                    (!roeMax || (stock.roe != null && stock.roe <= roeMax));
                const matchesRoce =
                    (!roceMin || (stock.roce != null && stock.roce >= roceMin)) &&
                    (!roceMax || (stock.roce != null && stock.roce <= roceMax));
                const matchesRevenue =
                    (!revenueMin || stock.revenue >= revenueMin) &&
                    (!revenueMax || stock.revenue <= revenueMax);
                const matchesDividend =
                    (!dividendMin || (stock.dividend != null && stock.dividend >= dividendMin)) &&
                    (!dividendMax || (stock.dividend != null && stock.dividend <= dividendMax));
                return matchesMarketCap && matchesPe && matchesPb && matchesRoe && matchesRoce && matchesRevenue && matchesDividend;
            });

        const sorted = [...stocks].sort((left, right) => {
            const leftValue = left[sortKey] ?? 0;
            const rightValue = right[sortKey] ?? 0;
            const factor = sortDirection === 'asc' ? 1 : -1;
            if (typeof leftValue === 'string' && typeof rightValue === 'string') {
                return leftValue.localeCompare(rightValue) * factor;
            }
            return (Number(leftValue) - Number(rightValue)) * factor;
        });

        const total = sorted.length;
        const start = (page - 1) * pageSize;
        const items = sorted.slice(start, start + pageSize);

        return {
            items,
            total,
            page,
            pageSize,
        };
    }

    async searchStocks(query: string) {
        const normalized = query.trim().toUpperCase();
        const cacheKey = this.getCacheKey('search', normalized);
        const cached = this.getCached<{ items: Array<{ symbol: string; name: string; exchange: string; type: string }> }>(cacheKey);
        if (cached) {
            return cached;
        }

        const payload = await getSymbolSearch(query);
        const items = (payload.bestMatches || [])
            .slice(0, 8)
            .map((item: Record<string, string>) => ({
                symbol: item['1. symbol'] || 'N/A',
                name: item['2. name'] || 'Unknown',
                exchange: item['4. region'] || 'N/A',
                type: item['3. type'] || 'Equity',
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

        const payload = await getQuoteData(normalized);
        const quote = payload['Global Quote'] || {};
        const payloadResult = {
            symbol: quote['01. symbol'] || normalized,
            shortName: normalized,
            regularMarketPrice: Number(quote['05. price'] ?? null),
            regularMarketChangePercent: Number(quote['10. change percent']?.replace('%', '') ?? 0),
            currency: 'INR',
            exchangeName: 'NSE',
            fullExchangeName: 'NSE',
            marketCap: null,
            fiftyTwoWeekHigh: null,
            fiftyTwoWeekLow: null,
            trailingPE: null,
            priceToBook: null,
            dividendYield: null,
            marketState: 'CLOSED',
            quoteType: 'EQUITY',
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

        const overview = await getOverview(normalized);

        const companyInfo = {
            symbol: normalized,
            sector: overview.Sector || 'N/A',
            industry: overview.Industry || 'N/A',
            website: overview.Website || null,
            longBusinessSummary: overview.Description || null,
            regularMarketPrice: null,
            currency: overview.Currency || 'INR',
            exchangeName: overview.Exchange || 'NSE',
            marketCap: overview.MarketCapitalization ? Number(overview.MarketCapitalization) : null,
            enterpriseValue: null,
            trailingPE: overview.PERatio ? Number(overview.PERatio) : null,
            priceToBook: overview.PriceToBookRatio ? Number(overview.PriceToBookRatio) : null,
            dividendYield: overview.DividendYield ? Number(overview.DividendYield) : null,
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

        const overview = await getOverview(normalized);

        const ratios = {
            symbol: normalized,
            defaultKeyStatistics: {
                trailingPE: overview.PERatio ? Number(overview.PERatio) : null,
                priceToBook: overview.PriceToBookRatio ? Number(overview.PriceToBookRatio) : null,
                marketCap: overview.MarketCapitalization ? Number(overview.MarketCapitalization) : null,
            },
            financialData: {
                returnOnEquity: overview.ReturnOnEquityTTM ? Number(overview.ReturnOnEquityTTM) : null,
                returnOnAssets: overview.ReturnOnAssetsTTM ? Number(overview.ReturnOnAssetsTTM) : null,
                revenueTTM: overview.RevenueTTM ? Number(overview.RevenueTTM) : null,
                dividendYield: overview.DividendYield ? Number(overview.DividendYield) : null,
            },
            summaryDetail: {
                currency: overview.Currency || 'INR',
            },
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

        const [incomeRes, balanceRes, cashflowRes, earningsRes] = await Promise.all([
            getIncomeStatement(normalized),
            getBalanceSheet(normalized),
            getCashFlow(normalized),
            getEarnings(normalized),
        ]);

        const incomeAnnual = incomeRes.annualReports || [];
        const incomeQuarterly = incomeRes.quarterlyReports || [];
        const balanceAnnual = balanceRes.annualReports || [];
        const balanceQuarterly = balanceRes.quarterlyReports || [];
        const cashflowAnnual = cashflowRes.annualReports || [];
        const cashflowQuarterly = cashflowRes.quarterlyReports || [];
        const earningsAnnual = earningsRes.annualEarnings || [];
        const earningsQuarterly = earningsRes.quarterlyEarnings || [];

        const statements = {
            symbol: normalized,
            incomeAnnual,
            incomeQuarterly,
            balanceAnnual,
            balanceQuarterly,
            cashflowAnnual,
            cashflowQuarterly,
            earningsAnnual,
            earningsQuarterly,
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

        const history = await getTimeSeriesWeekly(normalized);
        const series = history['Weekly Time Series'] || {};

        const prices = Object.entries(series)
            .map(([date, values]) => ({
                date,
                open: Number(values['1. open'] ?? NaN),
                high: Number(values['2. high'] ?? NaN),
                low: Number(values['3. low'] ?? NaN),
                close: Number(values['4. close'] ?? NaN),
                volume: Number(values['5. volume'] ?? NaN),
            }))
            .filter((item) => Number.isFinite(item.close))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const result = { symbol: normalized, prices };
        this.setCache(cacheKey, result);
        return result;
    }

    async getMarketOverview() {
        const cacheKey = 'market:overview';
        const cached = this.getCached<Array<{ label: string; value: string; change: string; up: boolean }>>(cacheKey);
        if (cached) {
            return cached;
        }

        const marketSymbols = [
            { label: 'NIFTY 50', symbol: 'NSEI' },
            { label: 'SENSEX', symbol: 'BSESN' },
            { label: 'INDIA VIX', symbol: 'INDIAVIX' },
        ];

        const overview = await Promise.all(
            marketSymbols.map(async ({ label, symbol }) => {
                try {
                    const payload = await getQuoteData(symbol);
                    const quote = payload['Global Quote'] || {};
                    const price = Number(quote['05. price'] ?? NaN);
                    const changePercent = Number(quote['10. change percent']?.replace('%', '') ?? NaN);

                    return {
                        label,
                        value: Number.isFinite(price) ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(price) : 'N/A',
                        change: Number.isFinite(changePercent) ? `${changePercent.toFixed(2)}%` : '0.00%',
                        up: !Number.isFinite(changePercent) || changePercent >= 0,
                    };
                } catch {
                    return {
                        label,
                        value: 'N/A',
                        change: '0.00%',
                        up: true,
                    };
                }
            })
        );

        this.setCache(cacheKey, overview, 30 * 60 * 1000);
        return overview;
    }

    async getMarketMovers() {
        const cacheKey = 'market:movers';
        const cached = this.getCached<{ topGainers: Array<{ symbol: string; price: string; change: string }>; topLosers: Array<{ symbol: string; price: string; change: string }>; trending: Array<{ symbol: string; price: string; change: string }> }>(cacheKey);
        if (cached) {
            return cached;
        }

        const symbols = [
            'RELIANCE.NS',
            'TCS.NS',
            'INFY.NS',
            'HDFCBANK.NS',
            'ICICIBANK.NS',
            'ADANIENT.NS',
            'SBIN.NS',
            'BHARTIARTL.NS',
            'LT.NS',
            'JSWSTEEL.NS',
        ];

        const results = await Promise.allSettled(
            symbols.map(async (symbol) => {
                const payload = await getQuoteData(symbol);
                const quote = payload['Global Quote'] || {};
                const price = Number(quote['05. price'] ?? NaN);
                const changePercent = Number(quote['10. change percent']?.replace('%', '') ?? NaN);
                return {
                    symbol,
                    price: Number.isFinite(price) ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(price) : 'N/A',
                    change: Number.isFinite(changePercent) ? `${changePercent.toFixed(2)}%` : '0.00%',
                    changePercent: Number.isFinite(changePercent) ? changePercent : 0,
                };
            })
        );

        const quotes = results
            .filter((result): result is PromiseFulfilledResult<{ symbol: string; price: string; change: string; changePercent: number }> => result.status === 'fulfilled')
            .map((result) => result.value)
            .filter((item) => item.symbol);

        const sortedByChange = [...quotes].sort((a, b) => b.changePercent - a.changePercent);
        const topGainers = sortedByChange.slice(0, 3).map(({ symbol, price, change }) => ({ symbol, price, change }));
        const topLosers = [...sortedByChange]
            .reverse()
            .slice(0, 3)
            .map(({ symbol, price, change }) => ({ symbol, price, change }));
        const trending = sortedByChange.slice(0, 6).map(({ symbol, price, change }) => ({ symbol, price, change }));

        const payload = { topGainers, topLosers, trending };
        this.setCache(cacheKey, payload, 30 * 60 * 1000);
        return payload;
    }

    async getMarketNewsFeed() {
        const cacheKey = 'market:news';
        const cached = this.getCached<NewsItem[]>(cacheKey);
        if (cached) {
            return cached;
        }

        // Alpha Vantage does not provide market news. Return an empty list for now.
        const news: NewsItem[] = [];
        this.setCache(cacheKey, news, 30 * 60 * 1000);
        return news;
    }

    async getStockNews(symbol: string) {
        const normalized = symbol.trim().toUpperCase();
        const cacheKey = this.getCacheKey('news', normalized);
        const cached = this.getCached<NewsItem[]>(cacheKey);
        if (cached) {
            return cached;
        }

        // Alpha Vantage does not provide news feeds for individual symbols.
        const news: NewsItem[] = [];
        this.setCache(cacheKey, news, 10 * 60 * 1000); // Cache for 10 minutes
        return news;
    }

    async getRelatedStocks(symbol: string) {
        const normalized = symbol.trim().toUpperCase();
        const cacheKey = this.getCacheKey('related', normalized);
        const cached = this.getCached<Array<{ symbol: string; name: string; exchange: string }>>(cacheKey);
        if (cached) {
            return cached;
        }

        // Alpha Vantage does not provide industry-related search by sector in a reusable way.
        const relatedStocks: Array<{ symbol: string; name: string; exchange: string }> = [];
        this.setCache(cacheKey, relatedStocks, 30 * 60 * 1000); // Cache for 30 minutes
        return relatedStocks;
    }
}

export const stockService = new StockService();
