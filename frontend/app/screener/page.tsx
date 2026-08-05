'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getScreener } from '@/lib/stockApi';

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

type SortKey = 'marketCap' | 'pe' | 'pb' | 'roe' | 'roce' | 'revenue' | 'dividend' | 'symbol' | 'price';

const pageSize = 8;
const sectors = ['All', 'Energy', 'Information Technology', 'Financials', 'Industrials', 'Communication Services', 'Consumer Staples', 'Consumer Discretionary', 'Materials', 'Health Care', 'Utilities'];

function formatMetric(value: number | null | undefined, digits = 2) {
    if (value == null || Number.isNaN(value)) {
        return '—';
    }
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value);
}

function formatCompact(value: number | null | undefined, digits = 2) {
    if (value == null || Number.isNaN(value)) {
        return '—';
    }
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: digits }).format(value);
}

export default function ScreenerPage() {
    const [query, setQuery] = useState('');
    const [sector, setSector] = useState('All');
    const [marketCapMin, setMarketCapMin] = useState('');
    const [marketCapMax, setMarketCapMax] = useState('');
    const [peMin, setPeMin] = useState('');
    const [peMax, setPeMax] = useState('');
    const [pbMin, setPbMin] = useState('');
    const [pbMax, setPbMax] = useState('');
    const [roeMin, setRoeMin] = useState('');
    const [roeMax, setRoeMax] = useState('');
    const [roceMin, setRoceMin] = useState('');
    const [roceMax, setRoceMax] = useState('');
    const [revenueMin, setRevenueMin] = useState('');
    const [revenueMax, setRevenueMax] = useState('');
    const [dividendMin, setDividendMin] = useState('');
    const [dividendMax, setDividendMax] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('marketCap');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState(1);
    const [stocks, setStocks] = useState<ScreenerStock[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const filterKey = useMemo(
        () => [
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
            sortKey,
            sortDirection,
        ].join('|'),
        [
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
            sortKey,
            sortDirection,
        ]
    );

    useEffect(() => {
        setStocks([]);
        setTotal(0);
        setPage(1);
        setHasMore(true);
        setError(null);
    }, [filterKey]);

    useEffect(() => {
        let isMounted = true;

        async function loadPage() {
            setIsLoading(true);
            setError(null);

            try {
                const result = await getScreener({
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
                    sortKey,
                    sortDirection,
                    page,
                    pageSize,
                });

                if (!isMounted) {
                    return;
                }

                const nextItems = result.data.items ?? [];
                const nextTotal = result.data.total ?? 0;

                setStocks((current) => {
                    const updated = page === 1 ? nextItems : [...current, ...nextItems];
                    setHasMore(nextItems.length === pageSize && updated.length < nextTotal);
                    return updated;
                });
                setTotal(nextTotal);
            } catch (err) {
                if (!isMounted) {
                    return;
                }
                setError(err instanceof Error ? err.message : 'Unable to load screener results.');
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        loadPage();

        return () => {
            isMounted = false;
        };
    }, [
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
        sortKey,
        sortDirection,
        page,
    ]);

    useEffect(() => {
        if (!sentinelRef.current || isLoading || !hasMore || stocks.length === 0) {
            return undefined;
        }

        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) {
                setPage((current) => current + 1);
            }
        }, { rootMargin: '200px' });

        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [isLoading, hasMore, stocks.length]);

    const startIndex = stocks.length === 0 ? 0 : 1;
    const endIndex = Math.min(stocks.length, total);

    const resetFilters = () => {
        setQuery('');
        setSector('All');
        setMarketCapMin('');
        setMarketCapMax('');
        setPeMin('');
        setPeMax('');
        setPbMin('');
        setPbMax('');
        setRoeMin('');
        setRoeMax('');
        setRoceMin('');
        setRoceMax('');
        setRevenueMin('');
        setRevenueMax('');
        setDividendMin('');
        setDividendMax('');
        setSortKey('marketCap');
        setSortDirection('desc');
        setPage(1);
    };

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_30%),linear-gradient(135deg,_#020617_0%,_#030712_100%)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-6 flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-950/75 px-5 py-5 shadow-xl shadow-slate-950/30 backdrop-blur md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Screener</p>
                        <h1 className="mt-2 text-3xl font-semibold text-white">Screen the market fast</h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Button asChild variant="outline" className="rounded-full border-slate-700 text-slate-100 hover:bg-slate-800">
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" /> Dashboard
                            </Link>
                        </Button>
                    </div>
                </header>

                <Card className="mb-6 border-slate-800/80 bg-slate-900/70">
                    <CardHeader>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-2">
                                <Search className="h-5 w-5 text-cyan-300" />
                                <CardTitle>Search & filters</CardTitle>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <div className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">
                                    {total} matches
                                </div>
                                <Button variant="outline" className="rounded-full border-slate-700 text-slate-100 hover:bg-slate-800" onClick={resetFilters}>
                                    Reset filters
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.5fr_0.5fr]">
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                                <label className="mb-2 block text-sm text-slate-400">Search</label>
                                <input
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Ticker, company or sector"
                                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none"
                                />
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                                <label className="mb-2 block text-sm text-slate-400">Sector</label>
                                <select value={sector} onChange={(event) => setSector(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none">
                                    {sectors.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                                <label className="mb-2 block text-sm text-slate-400">Sort by</label>
                                <div className="flex gap-2">
                                    <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)} className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none">
                                        <option value="marketCap">Market Cap</option>
                                        <option value="pe">PE</option>
                                        <option value="pb">PB</option>
                                        <option value="roe">ROE</option>
                                        <option value="roce">ROCE</option>
                                        <option value="revenue">Revenue</option>
                                        <option value="dividend">Dividend</option>
                                        <option value="price">Price</option>
                                        <option value="symbol">Symbol</option>
                                    </select>
                                    <Button variant="outline" className="rounded-xl border-slate-700 text-slate-100 hover:bg-slate-800" onClick={() => setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))}>
                                        {sortDirection === 'asc' ? 'Asc' : 'Desc'}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                                <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
                                    <SlidersHorizontal className="h-4 w-4 text-cyan-300" />
                                    Market Cap (USD B)
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input value={marketCapMin} onChange={(event) => setMarketCapMin(event.target.value)} placeholder="Min" className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none" />
                                    <input value={marketCapMax} onChange={(event) => setMarketCapMax(event.target.value)} placeholder="Max" className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none" />
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                                <div className="mb-2 text-sm text-slate-400">PE</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input value={peMin} onChange={(event) => setPeMin(event.target.value)} placeholder="Min" className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none" />
                                    <input value={peMax} onChange={(event) => setPeMax(event.target.value)} placeholder="Max" className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none" />
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                                <div className="mb-2 text-sm text-slate-400">PB</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input value={pbMin} onChange={(event) => setPbMin(event.target.value)} placeholder="Min" className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none" />
                                    <input value={pbMax} onChange={(event) => setPbMax(event.target.value)} placeholder="Max" className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none" />
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                                <div className="mb-2 text-sm text-slate-400">ROE</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input value={roeMin} onChange={(event) => setRoeMin(event.target.value)} placeholder="Min" className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none" />
                                    <input value={roeMax} onChange={(event) => setRoeMax(event.target.value)} placeholder="Max" className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none" />
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                                <div className="mb-2 text-sm text-slate-400">ROCE</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input value={roceMin} onChange={(event) => setRoceMin(event.target.value)} placeholder="Min" className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none" />
                                    <input value={roceMax} onChange={(event) => setRoceMax(event.target.value)} placeholder="Max" className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none" />
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                                <div className="mb-2 text-sm text-slate-400">Revenue (USD B)</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input value={revenueMin} onChange={(event) => setRevenueMin(event.target.value)} placeholder="Min" className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none" />
                                    <input value={revenueMax} onChange={(event) => setRevenueMax(event.target.value)} placeholder="Max" className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none" />
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                                <div className="mb-2 text-sm text-slate-400">Dividend (%)</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input value={dividendMin} onChange={(event) => setDividendMin(event.target.value)} placeholder="Min" className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none" />
                                    <input value={dividendMax} onChange={(event) => setDividendMax(event.target.value)} placeholder="Max" className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-800/80 bg-slate-900/70">
                    <CardHeader>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <CardTitle>Results</CardTitle>
                            <div className="text-sm text-slate-400">
                                Showing {startIndex}–{endIndex} of {total}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden rounded-2xl border border-slate-800">
                            <div className="hidden grid-cols-[0.8fr_1.2fr_0.7fr_0.7fr_0.7fr_0.7fr_0.7fr_0.7fr_0.7fr] gap-3 bg-slate-950/80 px-4 py-3 text-sm font-medium text-slate-300 md:grid">
                                <div>Symbol</div>
                                <div>Company</div>
                                <div>Market Cap</div>
                                <div>PE</div>
                                <div>PB</div>
                                <div>ROE</div>
                                <div>ROCE</div>
                                <div>Revenue</div>
                                <div>Dividend</div>
                            </div>
                            {stocks.length === 0 && !isLoading ? (
                                <div className="px-4 py-6 text-center text-sm text-slate-400">No stocks match those filters yet.</div>
                            ) : (
                                stocks.map((stock) => (
                                    <div key={stock.symbol} className="grid gap-3 border-t border-slate-800 px-4 py-4 text-sm text-slate-300 md:grid-cols-[0.8fr_1.2fr_0.7fr_0.7fr_0.7fr_0.7fr_0.7fr_0.7fr_0.7fr]">
                                        <div>
                                            <div className="font-semibold text-white">{stock.symbol}</div>
                                            <div className="mt-1 text-xs uppercase tracking-[0.25em] text-cyan-300">{stock.sector}</div>
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">{stock.name}</div>
                                            <div className="mt-1 text-xs text-slate-400">Price {formatMetric(stock.price, 2)} · {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}%</div>
                                        </div>
                                        <div>{formatCompact(stock.marketCap, 2)}B</div>
                                        <div>{formatMetric(stock.pe)}</div>
                                        <div>{formatMetric(stock.pb)}</div>
                                        <div>{formatMetric(stock.roe)}%</div>
                                        <div>{formatMetric(stock.roce)}%</div>
                                        <div>{formatCompact(stock.revenue, 2)}B</div>
                                        <div>{formatMetric(stock.dividend)}%</div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="text-sm text-slate-400">
                                Loaded {stocks.length} of {total}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {error && <div className="text-sm text-rose-300">{error}</div>}
                                {isLoading && <div className="text-sm text-slate-300">Loading more results…</div>}
                                {!isLoading && hasMore && (
                                    <Button variant="outline" className="rounded-full border-slate-700 text-slate-100 hover:bg-slate-800" onClick={() => setPage((current) => current + 1)}>
                                        Load more
                                    </Button>
                                )}
                                {!isLoading && !hasMore && stocks.length > 0 && (
                                    <div className="text-sm text-slate-400">All results loaded.</div>
                                )}
                            </div>
                        </div>
                        <div ref={sentinelRef} className="h-4" />
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
