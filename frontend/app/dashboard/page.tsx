"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BarChart3, Bot, CircleDollarSign, Newspaper, PieChart, Search, SlidersHorizontal, Sparkles, TrendingDown, TrendingUp, Trophy, Wallet2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { searchStocks, getStockCompanyInfo, getStockFinancialRatios, getStockQuote } from '@/lib/stockApi';
import { getGeminiInsight } from '@/lib/geminiApi';

const marketOverview = [
    { label: 'NIFTY 50', value: '24,650', change: '+0.78%', up: true },
    { label: 'SENSEX', value: '80,950', change: '+0.54%', up: true },
    { label: 'VIX', value: '14.2', change: '-2.10%', up: false },
];

const topGainers = [
    { symbol: 'INFY', price: '1,864.50', change: '+4.12%' },
    { symbol: 'TCS', price: '4,008.20', change: '+3.88%' },
    { symbol: 'HCLTECH', price: '1,620.30', change: '+3.41%' },
];

const topLosers = [
    { symbol: 'EICHER', price: '6,860.10', change: '-2.35%' },
    { symbol: 'ASIANPAINT', price: '2,490.60', change: '-1.97%' },
    { symbol: 'BPCL', price: '328.15', change: '-1.81%' },
];

const trendingStocks = [
    'RELIANCE', 'LIC', 'TATAMOTORS', 'ZOMATO', 'ADANIENT', 'SBIN',
];

const newsItems = [
    { title: 'RBI signals stable policy tone', time: '12m ago' },
    { title: 'Auto sector sees fresh momentum', time: '38m ago' },
    { title: 'Institutional flows turn positive', time: '1h ago' },
];

const portfolioSummary = [
    { label: 'Portfolio Value', value: '₹12,48,000' },
    { label: 'Day Change', value: '+₹18,250' },
    { label: 'Win Rate', value: '68%' },
];

const watchlist = [
    { symbol: 'AAPL', price: '$199.40', change: '+1.24%' },
    { symbol: 'MSFT', price: '$428.50', change: '+0.91%' },
    { symbol: 'NVDA', price: '$126.80', change: '+2.09%' },
];

function Skeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse rounded-xl bg-slate-800/70 ${className ?? ''}`} />;
}

export default function DashboardPage() {
    const [query, setQuery] = useState('AAPL');
    const [searchResults, setSearchResults] = useState<Array<{ symbol: string; name: string; exchange: string; type: string }>>([]);
    const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
    const [quote, setQuote] = useState<any>(null);
    const [companyInfo, setCompanyInfo] = useState<any>(null);
    const [financialRatios, setFinancialRatios] = useState<any>(null);
    const [aiInsight, setAiInsight] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [searchResponse, quoteResponse, companyResponse, ratiosResponse, geminiResponse] = await Promise.all([
                    searchStocks(query || 'AAPL'),
                    getStockQuote(selectedSymbol || 'AAPL'),
                    getStockCompanyInfo(selectedSymbol || 'AAPL'),
                    getStockFinancialRatios(selectedSymbol || 'AAPL'),
                    getGeminiInsight(`Give a concise market insight for ${selectedSymbol || 'AAPL'} in 1-2 sentences.`),
                ]);
                if (!isMounted) {
                    return;
                }
                setSearchResults(searchResponse.data.items || []);
                setQuote(quoteResponse.data);
                setCompanyInfo(companyResponse.data);
                setFinancialRatios(ratiosResponse.data);
                setAiInsight(geminiResponse?.insight || geminiResponse?.message || 'No insight available.');
            } catch (err) {
                if (!isMounted) {
                    return;
                }
                setError(err instanceof Error ? err.message : 'Unable to load stock data.');
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadData();
        return () => {
            isMounted = false;
        };
    }, [query, selectedSymbol]);

    const marketSummary = useMemo(() => {
        const currentPrice = quote?.regularMarketPrice ?? '—';
        const change = quote?.regularMarketChangePercent != null ? `${quote.regularMarketChangePercent.toFixed(2)}%` : '—';
        return [{ label: 'Selected Symbol', value: selectedSymbol.toUpperCase(), change: 'Live', up: true }, { label: 'Current Price', value: typeof currentPrice === 'number' ? `$${currentPrice.toFixed(2)}` : currentPrice, change, up: true }, { label: 'Exchange', value: quote?.exchangeName || '—', change: 'Updated', up: true }];
    }, [quote, selectedSymbol]);

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_30%),linear-gradient(135deg,_#020617_0%,_#030712_100%)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-950/75 px-5 py-5 shadow-xl shadow-slate-950/30 backdrop-blur md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Dashboard</p>
                        <h1 className="mt-2 text-3xl font-semibold text-white">Market pulse at a glance</h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Button asChild variant="outline" className="rounded-full border-slate-700 text-slate-100 hover:bg-slate-800">
                            <Link href="/">Back home</Link>
                        </Button>
                        <Button asChild className="rounded-full bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                            <Link href="/screener" className="flex items-center gap-2">
                                <SlidersHorizontal className="h-4 w-4" /> Open screener
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-full border-slate-700 text-slate-100 hover:bg-slate-800">
                            <Link href="/compare" className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" /> Compare
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-full border-slate-700 text-slate-100 hover:bg-slate-800">
                            <Link href="/portfolio" className="flex items-center gap-2">
                                <PieChart className="h-4 w-4" /> Portfolio
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-full border-slate-700 text-slate-100 hover:bg-slate-800">
                            <Link href="/profile">View profile</Link>
                        </Button>
                    </div>
                </header>

                <section className="mb-6 rounded-3xl border border-slate-800 bg-slate-950/70 p-4 shadow-xl shadow-slate-950/20">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <Search className="h-4 w-4 text-cyan-300" />
                                <span>Stock search</span>
                            </div>
                            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                <input
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Search ticker or company"
                                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-0"
                                />
                                <Button onClick={() => setSelectedSymbol(query.trim().toUpperCase() || 'AAPL')} className="rounded-full bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                                    Search
                                </Button>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {searchResults.slice(0, 4).map((result) => (
                                <button
                                    key={result.symbol}
                                    onClick={() => setSelectedSymbol(result.symbol)}
                                    className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-500/50 hover:text-white"
                                >
                                    {result.symbol}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    {marketSummary.map((item) => (
                        <Card key={item.label} className="border-slate-800/80 bg-slate-900/70">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base text-slate-300">{item.label}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-end justify-between">
                                <div>
                                    <p className="text-2xl font-semibold text-white">{item.value}</p>
                                    <p className={`mt-2 text-sm ${item.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {item.change}
                                    </p>
                                </div>
                                {item.up ? <TrendingUp className="h-5 w-5 text-emerald-400" /> : <TrendingDown className="h-5 w-5 text-rose-400" />}
                            </CardContent>
                        </Card>
                    ))}
                </section>

                <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="grid gap-6">
                        <Card className="border-slate-800/80 bg-slate-900/70">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-cyan-300" />
                                    <CardTitle>Company info</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {isLoading ? (
                                    <>
                                        <Skeleton className="h-8" />
                                        <Skeleton className="h-8" />
                                        <Skeleton className="h-8" />
                                    </>
                                ) : error ? (
                                    <p className="text-sm text-rose-400">{error}</p>
                                ) : (
                                    <>
                                        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                                            <p className="text-sm text-slate-400">Company</p>
                                            <p className="mt-2 font-medium text-white">{companyInfo?.sector || 'N/A'}</p>
                                            <p className="mt-1 text-sm text-slate-400">{companyInfo?.industry || 'N/A'}</p>
                                        </div>
                                        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                                            <p className="text-sm text-slate-400">Business summary</p>
                                            <p className="mt-2 text-sm leading-6 text-slate-300">{companyInfo?.longBusinessSummary || 'No summary available yet.'}</p>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-slate-800/80 bg-slate-900/70">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <TrendingDown className="h-5 w-5 text-rose-400" />
                                    <CardTitle>Financial ratios</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {isLoading ? (
                                    <>
                                        <Skeleton className="h-8" />
                                        <Skeleton className="h-8" />
                                        <Skeleton className="h-8" />
                                    </>
                                ) : error ? (
                                    <p className="text-sm text-rose-400">{error}</p>
                                ) : (
                                    <>
                                        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                                            <p className="text-sm text-slate-400">P/E</p>
                                            <p className="mt-2 text-xl font-semibold text-white">{financialRatios?.defaultKeyStatistics?.trailingPE ?? 'N/A'}</p>
                                        </div>
                                        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                                            <p className="text-sm text-slate-400">P/B</p>
                                            <p className="mt-2 text-xl font-semibold text-white">{financialRatios?.defaultKeyStatistics?.priceToBook ?? 'N/A'}</p>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="border-slate-800/80 bg-slate-900/70">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-cyan-300" />
                                    <CardTitle>Trending stocks</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                {trendingStocks.map((stock) => (
                                    <span key={stock} className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">
                                        {stock}
                                    </span>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border-slate-800/80 bg-slate-900/70">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Newspaper className="h-5 w-5 text-cyan-300" />
                                    <CardTitle>Latest news</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {newsItems.map((item) => (
                                    <div key={item.title} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                                        <p className="text-sm font-medium text-white">{item.title}</p>
                                        <p className="mt-1 text-xs text-slate-400">{item.time}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <Card className="border-slate-800/80 bg-slate-900/70">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Wallet2 className="h-5 w-5 text-cyan-300" />
                                <CardTitle>Portfolio summary</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {portfolioSummary.map((item) => (
                                <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                                    <p className="text-sm text-slate-400">{item.label}</p>
                                    <p className="mt-2 text-xl font-semibold text-white">{item.value}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-slate-800/80 bg-slate-900/70">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <CircleDollarSign className="h-5 w-5 text-cyan-300" />
                                <CardTitle>Watchlist</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {watchlist.map((item) => (
                                <div key={item.symbol} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                                    <div>
                                        <p className="font-medium text-white">{item.symbol}</p>
                                        <p className="text-sm text-slate-400">{item.price}</p>
                                    </div>
                                    <span className="text-sm font-medium text-emerald-400">{item.change}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>

                <section className="mt-6 grid gap-4 lg:grid-cols-3">
                    <Card className="border-slate-800/80 bg-slate-900/70">
                        <CardHeader>
                            <CardTitle>Loading skeletons</CardTitle>
                            <CardDescription>Placeholder states while data is streaming in</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Skeleton className="h-12" />
                            <Skeleton className="h-12" />
                            <Skeleton className="h-12" />
                        </CardContent>
                    </Card>
                    <Card className="border-slate-800/80 bg-slate-900/70">
                        <CardHeader>
                            <CardTitle>AI insight</CardTitle>
                            <CardDescription>Signals prepared for your next move</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-300">
                                <Bot className="h-5 w-5" />
                            </div>
                            <p className="text-sm text-slate-300">{aiInsight || 'Momentum is accelerating across quality large caps with improving breadth.'}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-800/80 bg-slate-900/70">
                        <CardHeader>
                            <CardTitle>Quick actions</CardTitle>
                            <CardDescription>Move from insight to action</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button asChild className="w-full justify-start rounded-full bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                                <Link href="/profile" className="flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4" /> Open profile
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="w-full justify-start rounded-full border-slate-700 text-slate-100 hover:bg-slate-800">
                                <Link href="/" className="flex items-center gap-2">
                                    <ArrowRight className="h-4 w-4" /> Back to home
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </main>
    );
}
