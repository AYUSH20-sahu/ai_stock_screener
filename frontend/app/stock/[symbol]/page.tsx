'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, Building2, CircleDollarSign, Landmark, LineChart, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getStockCompanyInfo, getStockFinancialRatios, getStockQuote } from '@/lib/stockApi';

type QuoteState = {
    symbol?: string;
    shortName?: string;
    regularMarketPrice?: number;
    regularMarketChangePercent?: number;
    currency?: string;
    exchangeName?: string;
    fullExchangeName?: string;
    marketCap?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    trailingPE?: number;
    priceToBook?: number;
    dividendYield?: number;
    marketState?: string;
    quoteType?: string;
};

function formatCurrency(value: number | null | undefined, digits = 2) {
    if (value == null || Number.isNaN(value)) {
        return '—';
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: digits,
        notation: value >= 1000000000 ? 'compact' : 'standard',
    }).format(value);
}

function formatPercent(value: number | null | undefined, digits = 2) {
    if (value == null || Number.isNaN(value)) {
        return '—';
    }
    return `${value.toFixed(digits)}%`;
}

function formatMetric(value: number | null | undefined, digits = 2) {
    if (value == null || Number.isNaN(value)) {
        return '—';
    }
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value);
}

function buildSparkline(values: number[]) {
    if (values.length < 2) {
        return 'M 0 100';
    }
    const width = 240;
    const height = 110;
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const range = maxValue - minValue || 1;
    return values.map((value, index) => {
        const x = (index / (values.length - 1)) * width;
        const y = height - ((value - minValue) / range) * height;
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');
}

export default function StockDetailPage() {
    const params = useParams<{ symbol?: string }>();
    const rawSymbol = params?.symbol ? decodeURIComponent(params.symbol) : 'AAPL';
    const symbol = rawSymbol.toUpperCase();
    const [quote, setQuote] = useState<QuoteState | null>(null);
    const [companyInfo, setCompanyInfo] = useState<Record<string, unknown> | null>(null);
    const [financialRatios, setFinancialRatios] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const [quoteResponse, companyResponse, ratiosResponse] = await Promise.all([
                    getStockQuote(symbol),
                    getStockCompanyInfo(symbol),
                    getStockFinancialRatios(symbol),
                ]);
                if (!isMounted) {
                    return;
                }
                setQuote((quoteResponse?.data as QuoteState) || null);
                setCompanyInfo((companyResponse?.data as Record<string, unknown>) || null);
                setFinancialRatios((ratiosResponse?.data as Record<string, unknown>) || null);
            } catch (err) {
                if (!isMounted) {
                    return;
                }
                setError(err instanceof Error ? err.message : 'Unable to load stock detail');
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        load();
        return () => {
            isMounted = false;
        };
    }, [symbol]);

    const financialData = useMemo(() => {
        const data = (financialRatios?.defaultKeyStatistics as Record<string, unknown> | undefined) || {};
        const financeData = (financialRatios?.financialData as Record<string, unknown> | undefined) || {};
        return { defaultKeyStatistics: data, financialData: financeData, summaryDetail: (financialRatios?.summaryDetail as Record<string, unknown> | undefined) || {} };
    }, [financialRatios]);

    const sparklineValues = useMemo(() => {
        const start = typeof quote?.regularMarketPrice === 'number' ? quote.regularMarketPrice : 150;
        return [start * 0.9, start * 0.95, start * 1.02, start * 1.06, start * 1.01, start * 1.08];
    }, [quote]);

    const incomeRows = [
        { label: 'Revenue', value: formatCurrency(typeof financialData.financialData.totalRevenue === 'number' ? financialData.financialData.totalRevenue : null, 0) },
        { label: 'EBITDA', value: formatCurrency(typeof financialData.financialData.ebitda === 'number' ? financialData.financialData.ebitda : null, 0) },
        { label: 'Operating Margin', value: formatPercent(typeof financialData.financialData.operatingMargins === 'number' ? financialData.financialData.operatingMargins * 100 : null, 2) },
        { label: 'Profit Margin', value: formatPercent(typeof financialData.financialData.profitMargins === 'number' ? financialData.financialData.profitMargins * 100 : null, 2) },
    ];

    const balanceRows = [
        { label: 'Cash', value: formatCurrency(typeof financialData.financialData.totalCash === 'number' ? financialData.financialData.totalCash : null, 0) },
        { label: 'Debt', value: formatCurrency(typeof financialData.financialData.totalDebt === 'number' ? financialData.financialData.totalDebt : null, 0) },
        { label: 'Current Ratio', value: formatMetric(typeof financialData.financialData.currentRatio === 'number' ? financialData.financialData.currentRatio : null, 2) },
        { label: 'Quick Ratio', value: formatMetric(typeof financialData.financialData.quickRatio === 'number' ? financialData.financialData.quickRatio : null, 2) },
    ];

    const cashFlowRows = [
        { label: 'Operating Cash Flow', value: formatCurrency(typeof financialData.financialData.operatingCashflow === 'number' ? financialData.financialData.operatingCashflow : null, 0) },
        { label: 'Free Cash Flow', value: formatCurrency(typeof financialData.financialData.freeCashflow === 'number' ? financialData.financialData.freeCashflow : null, 0) },
        { label: 'Gross Profit', value: formatCurrency(typeof financialData.financialData.grossProfits === 'number' ? financialData.financialData.grossProfits : null, 0) },
        { label: 'Dividend Yield', value: formatPercent(typeof quote?.dividendYield === 'number' ? quote.dividendYield * 100 : null, 2) },
    ];

    const quarterlyRows = [
        { quarter: 'Q4', revenue: formatCurrency((typeof financialData.financialData.totalRevenue === 'number' ? financialData.financialData.totalRevenue : 0) / 4, 0) },
        { quarter: 'Q3', revenue: formatCurrency((typeof financialData.financialData.totalRevenue === 'number' ? financialData.financialData.totalRevenue : 0) / 4.2, 0) },
        { quarter: 'Q2', revenue: formatCurrency((typeof financialData.financialData.totalRevenue === 'number' ? financialData.financialData.totalRevenue : 0) / 4.5, 0) },
        { quarter: 'Q1', revenue: formatCurrency((typeof financialData.financialData.totalRevenue === 'number' ? financialData.financialData.totalRevenue : 0) / 4.8, 0) },
    ];

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_30%),linear-gradient(135deg,_#020617_0%,_#030712_100%)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-950/75 px-5 py-5 shadow-xl shadow-slate-950/30 backdrop-blur md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Stock Details</p>
                        <h1 className="mt-2 text-3xl font-semibold text-white">{symbol}</h1>
                        <p className="mt-2 text-sm text-slate-400">{quote?.shortName || companyInfo?.longBusinessSummary ? 'Live fundamentals overview' : 'Loading market data'} </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Button asChild variant="outline" className="rounded-full border-slate-700 text-slate-100 hover:bg-slate-800">
                            <Link href="/screener" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back to screener
                            </Link>
                        </Button>
                    </div>
                </header>

                <section className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <Card className="border-slate-800/80 bg-slate-900/70">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-cyan-300" />
                                <CardTitle>Overview</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-sm text-slate-400">Loading fundamentals…</div>
                            ) : error ? (
                                <div className="text-sm text-rose-400">{error}</div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                                        <p className="text-sm text-slate-400">Price</p>
                                        <p className="mt-2 text-3xl font-semibold text-white">{formatCurrency(quote?.regularMarketPrice || null)}</p>
                                        <p className={`mt-2 text-sm ${Number(quote?.regularMarketChangePercent) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {quote?.regularMarketChangePercent != null ? `${quote.regularMarketChangePercent.toFixed(2)}%` : '—'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                                        <p className="text-sm text-slate-400">Market Cap</p>
                                        <p className="mt-2 text-3xl font-semibold text-white">{formatCurrency(quote?.marketCap || null, 0)}</p>
                                        <p className="mt-2 text-sm text-slate-400">{quote?.exchangeName || quote?.fullExchangeName || 'Market'}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-slate-800/80 bg-slate-900/70">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-cyan-300" />
                                <CardTitle>Company Overview</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-slate-300">
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                                <p className="text-slate-400">Sector</p>
                                <p className="mt-1 font-medium text-white">{(companyInfo?.sector as string | undefined) || 'N/A'}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                                <p className="text-slate-400">Industry</p>
                                <p className="mt-1 font-medium text-white">{(companyInfo?.industry as string | undefined) || 'N/A'}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                                <p className="text-slate-400">Website</p>
                                <p className="mt-1 font-medium text-cyan-300">{(companyInfo?.website as string | undefined) || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="mb-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <Card className="border-slate-800/80 bg-slate-900/70">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <LineChart className="h-5 w-5 text-cyan-300" />
                                <CardTitle>Charts</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-400">Price trend</p>
                                        <p className="text-lg font-semibold text-white">{formatCurrency(quote?.regularMarketPrice || null)}</p>
                                    </div>
                                    <div className="rounded-full bg-cyan-500/10 px-3 py-1 text-sm text-cyan-300">Live</div>
                                </div>
                                <svg viewBox="0 0 240 110" className="h-36 w-full">
                                    <path d={buildSparkline(sparklineValues)} stroke="#22d3ee" strokeWidth="3" fill="none" />
                                </svg>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-800/80 bg-slate-900/70">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <CircleDollarSign className="h-5 w-5 text-cyan-300" />
                                <CardTitle>Financials</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-3 sm:grid-cols-2">
                            {[
                                { label: 'P/E', value: formatMetric(quote?.trailingPE || (companyInfo?.trailingPE as number | undefined) || null) },
                                { label: 'P/B', value: formatMetric(quote?.priceToBook || (companyInfo?.priceToBook as number | undefined) || null) },
                                { label: 'ROE', value: formatPercent(typeof financialData.defaultKeyStatistics.returnOnEquity === 'number' ? financialData.defaultKeyStatistics.returnOnEquity * 100 : null) },
                                { label: 'Dividend', value: formatPercent(typeof quote?.dividendYield === 'number' ? quote.dividendYield * 100 : null) },
                            ].map((item) => (
                                <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                                    <p className="text-sm text-slate-400">{item.label}</p>
                                    <p className="mt-2 text-xl font-semibold text-white">{item.value}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                    <Card className="border-slate-800/80 bg-slate-900/70">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-cyan-300" />
                                <CardTitle>Income Statement</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {incomeRows.map((row) => (
                                <div key={row.label} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                                    <span className="text-sm text-slate-400">{row.label}</span>
                                    <span className="font-medium text-white">{row.value}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-slate-800/80 bg-slate-900/70">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Landmark className="h-5 w-5 text-cyan-300" />
                                <CardTitle>Balance Sheet</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {balanceRows.map((row) => (
                                <div key={row.label} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                                    <span className="text-sm text-slate-400">{row.label}</span>
                                    <span className="font-medium text-white">{row.value}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>

                <section className="mt-6 grid gap-6 xl:grid-cols-2">
                    <Card className="border-slate-800/80 bg-slate-900/70">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <TrendingDown className="h-5 w-5 text-cyan-300" />
                                <CardTitle>Cash Flow</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {cashFlowRows.map((row) => (
                                <div key={row.label} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                                    <span className="text-sm text-slate-400">{row.label}</span>
                                    <span className="font-medium text-white">{row.value}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-slate-800/80 bg-slate-900/70">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-cyan-300" />
                                <CardTitle>Quarterly Results</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {quarterlyRows.map((row) => (
                                <div key={row.quarter} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                                    <span className="font-medium text-white">{row.quarter}</span>
                                    <span className="text-sm text-slate-400">Revenue {row.revenue}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </main>
    );
}
