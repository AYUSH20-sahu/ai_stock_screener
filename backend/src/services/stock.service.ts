import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

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

        const payload = await yahooFinance.quoteSummary(symbol, {
            modules: ['price', 'defaultKeyStatistics', 'financialData', 'summaryDetail'],
        }) as Record<string, unknown>;

        const price = payload.price as Record<string, unknown> | undefined;
        const defaultKeyStatistics = payload.defaultKeyStatistics as Record<string, unknown> | undefined;
        const financialData = payload.financialData as Record<string, unknown> | undefined;
        const summaryDetail = payload.summaryDetail as Record<string, unknown> | undefined;

        const rawRoe = this.parseRawNumber(financialData?.returnOnEquity);
        const rawRoce = this.parseRawNumber(financialData?.returnOnCapital) ?? this.parseRawNumber(financialData?.returnOnAssets);
        const dividendYieldRaw = this.parseRawNumber(summaryDetail?.dividendYield);

        const stock: ScreenerStock = {
            symbol,
            name,
            sector,
            price: this.parseRawNumber(price?.regularMarketPrice) ?? 0,
            change: this.parseRawNumber(price?.regularMarketChangePercent) ?? 0,
            marketCap: this.parseRawNumber(price?.marketCap) ?? 0,
            pe: this.parseRawNumber(defaultKeyStatistics?.trailingPE),
            pb: this.parseRawNumber(defaultKeyStatistics?.priceToBook),
            roe: rawRoe != null ? Math.round(rawRoe * 10000) / 100 : null,
            roce: rawRoce != null ? Math.round(rawRoce * 10000) / 100 : null,
            revenue: this.parseRawNumber(defaultKeyStatistics?.revenue) ?? 0,
            dividend: dividendYieldRaw != null ? Math.round(dividendYieldRaw * 10000) / 100 : null,
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

    async getMarketOverview() {
        const cacheKey = 'market:overview';
        const cached = this.getCached<Array<{ label: string; value: string; change: string; up: boolean }>>(cacheKey);
        if (cached) {
            return cached;
        }

        const marketSymbols = [
            { label: 'NIFTY 50', symbol: '^NSEI' },
            { label: 'SENSEX', symbol: '^BSESN' },
            { label: 'INDIA VIX', symbol: '^INDIAVIX' },
        ];

        const overview = await Promise.all(
            marketSymbols.map(async ({ label, symbol }) => {
                try {
                    const payload = await yahooFinance.quote(symbol) as Record<string, unknown>;
                    const price = typeof payload.regularMarketPrice === 'number' ? payload.regularMarketPrice : null;
                    const changePercent = typeof payload.regularMarketChangePercent === 'number' ? payload.regularMarketChangePercent : null;

                    return {
                        label,
                        value: price != null ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(price) : 'N/A',
                        change: changePercent != null ? `${changePercent.toFixed(2)}%` : '0.00%',
                        up: changePercent == null || changePercent >= 0,
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
                const payload = await yahooFinance.quote(symbol) as Record<string, unknown>;
                const price = typeof payload.regularMarketPrice === 'number' ? payload.regularMarketPrice : null;
                const changePercent = typeof payload.regularMarketChangePercent === 'number' ? payload.regularMarketChangePercent : null;
                return {
                    symbol,
                    price: price != null ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(price) : 'N/A',
                    change: changePercent != null ? `${changePercent.toFixed(2)}%` : '0.00%',
                    changePercent: changePercent ?? 0,
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

        try {
            const result = await yahooFinance.search('Indian stock market', { quotesCount: 0, newsCount: 8 }) as { news?: Array<Record<string, unknown>> };
            const news = (result.news || []).slice(0, 6).map((item) => ({
                title: typeof item.title === 'string' ? item.title : 'Market update',
                summary: typeof item.summary === 'string' ? item.summary : 'No summary available.',
                url: typeof item.link === 'string' ? item.link : '#',
                publishedAt: typeof item.publishedAt === 'string' ? item.publishedAt : new Date().toISOString(),
                source: typeof item.publisher === 'string' ? item.publisher : 'Market News',
            }));
            this.setCache(cacheKey, news, 30 * 60 * 1000);
            return news;
        } catch {
            return [];
        }
    }

    async getStockNews(symbol: string) {
        const normalized = symbol.trim().toUpperCase();
        const cacheKey = this.getCacheKey('news', normalized);
        const cached = this.getCached<NewsItem[]>(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const searchResult = await yahooFinance.search(normalized, { quotesCount: 0, newsCount: 10 }) as { news?: Array<Record<string, unknown>> };
            const news = (searchResult.news || []).slice(0, 10).map((item: Record<string, unknown>) => ({
                title: typeof item.title === 'string' ? item.title : 'No title',
                summary: typeof item.summary === 'string' ? item.summary : 'No summary available.',
                url: typeof item.link === 'string' ? item.link : '#',
                publishedAt: typeof item.publishedAt === 'string' ? item.publishedAt : new Date().toISOString(),
                source: typeof item.publisher === 'string' ? item.publisher : 'Unknown',
            }));

            this.setCache(cacheKey, news, 10 * 60 * 1000); // Cache for 10 minutes
            return news;
        } catch {
            return [];
        }
    }

    async getRelatedStocks(symbol: string) {
        const normalized = symbol.trim().toUpperCase();
        const cacheKey = this.getCacheKey('related', normalized);
        const cached = this.getCached<Array<{ symbol: string; name: string; exchange: string }>>(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            // Search for similar companies based on sector/industry
            const quote = await yahooFinance.quoteSummary(normalized, { modules: ['assetProfile'] }) as Record<string, unknown>;
            const assetProfile = quote.assetProfile as Record<string, unknown> | undefined;
            const sector = typeof assetProfile?.sector === 'string' ? assetProfile.sector : '';
            const industry = typeof assetProfile?.industry === 'string' ? assetProfile.industry : '';

            let relatedSymbols: string[] = [];
            if (sector) {
                const searchResult = await yahooFinance.search(sector, { quotesCount: 6, newsCount: 0 }) as { quotes?: Array<{ symbol?: string }> };
                relatedSymbols = (searchResult.quotes || [])
                    .filter((q) => q.symbol && q.symbol !== normalized)
                    .slice(0, 5)
                    .map((q) => q.symbol!);
            }

            const relatedStocks = [];
            for (const sym of relatedSymbols) {
                try {
                    const q = await yahooFinance.quote(sym) as Record<string, unknown>;
                    relatedStocks.push({
                        symbol: typeof q.symbol === 'string' ? q.symbol : sym,
                        name: typeof q.shortName === 'string' ? q.shortName : (typeof q.longName === 'string' ? q.longName : sym),
                        exchange: typeof q.exchangeName === 'string' ? q.exchangeName : 'N/A',
                    });
                } catch {
                    // Skip if quote fetch fails
                }
            }

            this.setCache(cacheKey, relatedStocks, 30 * 60 * 1000); // Cache for 30 minutes
            return relatedStocks;
        } catch {
            return [];
        }
    }
}

export const stockService = new StockService();
