'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

const stockUniverse: ScreenerStock[] = [
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', marketCap: 3090, pe: 33.4, pb: 47.2, roe: 142.6, roce: 31.4, revenue: 391.0, dividend: 0.52, price: 208.4, change: 1.28 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', marketCap: 3180, pe: 38.2, pb: 13.2, roe: 34.5, roce: 29.4, revenue: 245.1, dividend: 0.73, price: 428.2, change: 0.91 },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', marketCap: 3000, pe: 57.1, pb: 46.8, roe: 81.9, roce: 34.2, revenue: 130.5, dividend: 0.04, price: 126.7, change: 2.02 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary', marketCap: 2200, pe: 53.7, pb: 6.8, roe: 12.6, roce: 13.8, revenue: 620.0, dividend: 0.0, price: 198.6, change: 0.75 },
    { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Communication Services', marketCap: 1580, pe: 27.3, pb: 8.2, roe: 30.9, roce: 26.3, revenue: 164.5, dividend: 0.5, price: 548.9, change: -0.28 },
    { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary', marketCap: 660, pe: 63.6, pb: 10.1, roe: 16.1, roce: 15.2, revenue: 97.7, dividend: 0.0, price: 248.4, change: -1.84 },
    { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financials', marketCap: 760, pe: 12.7, pb: 1.4, roe: 11.2, roce: 10.7, revenue: 160.0, dividend: 2.1, price: 222.1, change: 0.44 },
    { symbol: 'XOM', name: 'Exxon Mobil Corp.', sector: 'Energy', marketCap: 470, pe: 13.8, pb: 1.9, roe: 13.8, roce: 16.1, revenue: 344.6, dividend: 3.4, price: 116.3, change: 0.44 },
    { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Health Care', marketCap: 400, pe: 16.4, pb: 4.4, roe: 26.9, roce: 20.8, revenue: 88.8, dividend: 3.3, price: 154.7, change: 0.16 },
    { symbol: 'PG', name: 'Procter & Gamble', sector: 'Consumer Staples', marketCap: 380, pe: 26.4, pb: 4.9, roe: 18.7, roce: 17.4, revenue: 84.0, dividend: 2.4, price: 166.1, change: 0.31 },
    { symbol: 'V', name: 'Visa Inc.', sector: 'Financials', marketCap: 620, pe: 31.4, pb: 7.6, roe: 24.4, roce: 20.1, revenue: 35.8, dividend: 0.79, price: 279.8, change: 0.41 },
    { symbol: 'MA', name: 'Mastercard Inc.', sector: 'Financials', marketCap: 530, pe: 37.2, pb: 8.4, roe: 22.7, roce: 19.8, revenue: 28.4, dividend: 0.5, price: 495.8, change: 0.74 },
];

const pageSize = 8;
const sectors = ['All', ...Array.from(new Set(stockUniverse.map((stock) => stock.sector))).sort()];

type SortKey = 'marketCap' | 'pe' | 'pb' | 'roe' | 'roce' | 'revenue' | 'dividend' | 'symbol' | 'price';

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

    useEffect(() => {
        setPage(1);
    }, [query, sector, marketCapMin, marketCapMax, peMin, peMax, pbMin, pbMax, roeMin, roeMax, roceMin, roceMax, revenueMin, revenueMax, dividendMin, dividendMax]);

    const filteredStocks = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        const filtered = stockUniverse.filter((stock) => {
            const matchesQuery = !normalizedQuery || `${stock.symbol} ${stock.name} ${stock.sector}`.toLowerCase().includes(normalizedQuery);
            const matchesSector = sector === 'All' || stock.sector === sector;
            const matchesMarketCap = (!marketCapMin || stock.marketCap >= Number(marketCapMin)) && (!marketCapMax || stock.marketCap <= Number(marketCapMax));
            const matchesPe = (!peMin || (stock.pe != null && stock.pe >= Number(peMin))) && (!peMax || (stock.pe != null && stock.pe <= Number(peMax)));
            const matchesPb = (!pbMin || (stock.pb != null && stock.pb >= Number(pbMin))) && (!pbMax || (stock.pb != null && stock.pb <= Number(pbMax)));
            const matchesRoe = (!roeMin || (stock.roe != null && stock.roe >= Number(roeMin))) && (!roeMax || (stock.roe != null && stock.roe <= Number(roeMax)));
            const matchesRoce = (!roceMin || (stock.roce != null && stock.roce >= Number(roceMin))) && (!roceMax || (stock.roce != null && stock.roce <= Number(roceMax)));
            const matchesRevenue = (!revenueMin || stock.revenue >= Number(revenueMin)) && (!revenueMax || stock.revenue <= Number(revenueMax));
            const matchesDividend = (!dividendMin || (stock.dividend != null && stock.dividend >= Number(dividendMin))) && (!dividendMax || (stock.dividend != null && stock.dividend <= Number(dividendMax)));
            return matchesQuery && matchesSector && matchesMarketCap && matchesPe && matchesPb && matchesRoe && matchesRoce && matchesRevenue && matchesDividend;
        });

        const sorted = [...filtered].sort((left, right) => {
            const leftValue = left[sortKey] ?? 0;
            const rightValue = right[sortKey] ?? 0;
            const factor = sortDirection === 'asc' ? 1 : -1;
            if (typeof leftValue === 'string' && typeof rightValue === 'string') {
                return leftValue.localeCompare(rightValue) * factor;
            }
            return (Number(leftValue) - Number(rightValue)) * factor;
        });
        return sorted;
    }, [query, sector, marketCapMin, marketCapMax, peMin, peMax, pbMin, pbMax, roeMin, roeMax, roceMin, roceMax, revenueMin, revenueMax, dividendMin, dividendMax, sortDirection, sortKey]);

    const pagedStocks = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredStocks.slice(start, start + pageSize);
    }, [filteredStocks, page]);

    const totalPages = Math.max(1, Math.ceil(filteredStocks.length / pageSize));
    const startIndex = filteredStocks.length === 0 ? 0 : (page - 1) * pageSize + 1;
    const endIndex = Math.min(page * pageSize, filteredStocks.length);

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
                                    {filteredStocks.length} matches
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
                                Showing {filteredStocks.length === 0 ? 0 : startIndex}–{endIndex} of {filteredStocks.length}
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
                            {pagedStocks.length === 0 ? (
                                <div className="px-4 py-6 text-center text-sm text-slate-400">No stocks match those filters yet.</div>
                            ) : (
                                pagedStocks.map((stock) => (
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
                                Page {page} of {totalPages}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button variant="outline" className="rounded-full border-slate-700 text-slate-100 hover:bg-slate-800" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                                </Button>
                                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                                    <button key={pageNumber} onClick={() => setPage(pageNumber)} className={`h-9 w-9 rounded-full border text-sm ${page === pageNumber ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300' : 'border-slate-700 bg-slate-950/70 text-slate-300'}`}>
                                        {pageNumber}
                                    </button>
                                ))}
                                <Button variant="outline" className="rounded-full border-slate-700 text-slate-100 hover:bg-slate-800" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                                    Next <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
