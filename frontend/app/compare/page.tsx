'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BarChart3, Bot, LineChart, Plus, RefreshCw, Send, Sparkles, Square, TrendingDown, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createGeminiInsight } from '@/lib/geminiApi';
import { getStockCompanyInfo, getStockFinancialRatios, getStockPriceHistory, getStockQuote } from '@/lib/stockApi';
import { ColorType, createChart, LineSeries, type IChartApi, type LineData, type Time } from 'lightweight-charts';

type QuoteData = {
    symbol: string;
    shortName?: string;
    regularMarketPrice?: number;
    regularMarketChangePercent?: number;
    marketCap?: number;
    trailingPE?: number;
    priceToBook?: number;
    dividendYield?: number;
    currency?: string;
};

type CompanyData = {
    sector?: string;
    industry?: string;
    longBusinessSummary?: string;
};

type RatiosData = {
    returnOnEquity: number | null;
    operatingMargins: number | null;
    profitMargins: number | null;
    currentRatio: number | null;
    debtToEquity: number | null;
    revenueGrowth: number | null;
    earningsGrowth: number | null;
    freeCashflow: number | null;
    operatingCashflow: number | null;
    totalRevenue: number | null;
    grossProfits: number | null;
};

type PricePoint = {
    date?: string;
    close?: number;
};

type StockData = {
    symbol: string;
    quote: QuoteData | null;
    company: CompanyData | null;
    ratios: RatiosData | null;
    history: PricePoint[];
    loading: boolean;
    error: string | null;
};

type ChatMessage = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
};

const recommendationPattern = /\b(buy|sell|hold|accumulate|reduce|target price|rating|recommendation)\b/i;

function asNumber(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function formatCurrency(value: number | null | undefined, currency = 'USD') {
    if (value == null || Number.isNaN(value)) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0, notation: Math.abs(value) >= 1000000000 ? 'compact' : 'standard' }).format(value);
}

function formatPercent(value: number | null | undefined) {
    if (value == null || Number.isNaN(value)) return '-';
    return `${(value * 100).toFixed(2)}%`;
}

function formatDecimal(value: number | null | undefined) {
    if (value == null || Number.isNaN(value)) return '-';
    return value.toFixed(2);
}

function toChartTime(value: string | undefined): Time | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

function ComparisonChart({ series }: { series: Array<{ symbol: string; data: LineData[]; color: string }> }) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<IChartApi | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const chart = createChart(container, {
            autoSize: true,
            height: 360,
            layout: {
                background: { type: ColorType.Solid, color: '#020617' },
                textColor: '#cbd5e1',
            },
            grid: {
                vertLines: { color: 'rgba(51, 65, 85, 0.45)' },
                horzLines: { color: 'rgba(51, 65, 85, 0.45)' },
            },
            rightPriceScale: { borderColor: '#1e293b' },
            timeScale: { borderColor: '#1e293b', timeVisible: true, secondsVisible: false },
            crosshair: { mode: 0 },
        });

        chartRef.current = chart;

        series.forEach((s) => {
            if (s.data.length > 0) {
                chart.addSeries(LineSeries, {
                    color: s.color,
                    lineWidth: 2,
                    priceLineVisible: false,
                    lastValueVisible: true,
                    title: s.symbol,
                }).setData(s.data);
            }
        });

        chart.timeScale().fitContent();

        const observer = new ResizeObserver(() => {
            chart.applyOptions({ height: container.clientHeight });
            chart.timeScale().fitContent();
        });
        observer.observe(container);

        return () => {
            observer.disconnect();
            chart.remove();
            chartRef.current = null;
        };
    }, [series]);

    const hasData = series.some((s) => s.data.length > 0);

    return (
        <div className="h-[320px] min-h-[320px] w-full sm:h-[360px] sm:min-h-[360px]" ref={containerRef}>
            {!hasData && <div className="flex h-full items-center justify-center text-sm text-slate-400">Add stocks to see comparison chart</div>}
        </div>
    );
}

function MetricRow({ label, values }: { label: string; values: string[] }) {
    return (
        <div className="grid grid-cols-4 gap-3 border-t border-slate-800 px-4 py-3 text-sm">
            <div className="font-medium text-slate-400">{label}</div>
            {values.map((v, i) => (
                <div key={i} className={`text-right ${v.startsWith('+') ? 'text-emerald-400' : v.startsWith('-') ? 'text-rose-400' : 'text-white'}`}>{v}</div>
            ))}
        </div>
    );
}

function filterAdvisoryLanguage(text: string) {
    if (recommendationPattern.test(text)) {
        return 'The AI response was filtered because it included investment action language. Try asking for a comparison of metrics, business models, or financial drivers.';
    }
    return text.trim();
}

export default function ComparePage() {
    const [symbolInputs, setSymbolInputs] = useState(['AAPL', 'MSFT', 'NVDA']);
    const [stocks, setStocks] = useState<StockData[]>([
        { symbol: 'AAPL', quote: null, company: null, ratios: null, history: [], loading: true, error: null },
        { symbol: 'MSFT', quote: null, company: null, ratios: null, history: [], loading: true, error: null },
        { symbol: 'NVDA', quote: null, company: null, ratios: null, history: [], loading: true, error: null },
    ]);
    const [loading, setLoading] = useState(true);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { id: 'welcome', role: 'assistant', content: 'Compare these three stocks. Ask me for an AI summary of the comparison.' },
    ]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchStock = useCallback(async (symbol: string, index: number) => {
        setStocks((prev) => prev.map((s, i) => i === index ? { ...s, loading: true, error: null } : s));
        try {
            const [quoteRes, companyRes, ratiosRes, historyRes] = await Promise.all([
                getStockQuote(symbol),
                getStockCompanyInfo(symbol),
                getStockFinancialRatios(symbol),
                getStockPriceHistory(symbol),
            ]);
            const quote = quoteRes?.data as QuoteData | undefined;
            const company = companyRes?.data as CompanyData | undefined;
            const rawRatios = ratiosRes?.data as Record<string, unknown> | undefined;
            const financialData = rawRatios?.financialData as Record<string, unknown> | undefined;
            const historyData = historyRes?.data as { prices?: PricePoint[] } | undefined;

            const ratios: RatiosData = {
                returnOnEquity: asNumber(financialData?.returnOnEquity),
                operatingMargins: asNumber(financialData?.operatingMargins),
                profitMargins: asNumber(financialData?.profitMargins),
                currentRatio: asNumber(financialData?.currentRatio),
                debtToEquity: asNumber(financialData?.debtToEquity),
                revenueGrowth: asNumber(financialData?.revenueGrowth),
                earningsGrowth: asNumber(financialData?.earningsGrowth),
                freeCashflow: asNumber(financialData?.freeCashflow),
                operatingCashflow: asNumber(financialData?.operatingCashflow),
                totalRevenue: asNumber(financialData?.totalRevenue),
                grossProfits: asNumber(financialData?.grossProfits),
            };

            const history = Array.isArray(historyData?.prices) ? historyData.prices : [];

            setStocks((prev) => prev.map((s, i) =>
                i === index ? { ...s, symbol: symbol.toUpperCase(), quote: quote || null, company: company || null, ratios, history, loading: false, error: null } : s
            ));
        } catch (err) {
            setStocks((prev) => prev.map((s, i) =>
                i === index ? { ...s, loading: false, error: err instanceof Error ? err.message : 'Failed to load' } : s
            ));
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        Promise.all(symbolInputs.map((sym, i) => fetchStock(sym, i))).finally(() => setLoading(false));
    }, []);

    const chartSeries = useMemo(() => {
        return stocks.map((stock, i) => {
            const data: LineData[] = stock.history
                .map((p) => {
                    const time = toChartTime(p.date);
                    const close = asNumber(p.close);
                    if (!time || close == null) return null;
                    return { time, value: close };
                })
                .filter((p): p is LineData => p != null)
                .sort((a, b) => String(a.time).localeCompare(String(b.time)));

            // Normalize to percentage change from first value
            if (data.length > 0) {
                const firstClose = data[0].value;
                if (firstClose > 0) {
                    return {
                        symbol: stock.symbol,
                        color: CHART_COLORS[i % CHART_COLORS.length],
                        data: data.map((p) => ({ time: p.time, value: ((p.value - firstClose) / firstClose) * 100 })),
                    };
                }
            }
            return { symbol: stock.symbol, color: CHART_COLORS[i % CHART_COLORS.length], data: [] };
        });
    }, [stocks]);

    const currency = stocks.find((s) => s.quote?.currency)?.quote?.currency || 'USD';

    const buildComparePrompt = () => {
        const lines = [
            'You are a financial analyst comparing three stocks for an educational stock screener.',
            'Never generate investment advice. Do not use buy, sell, hold, accumulate, reduce, target price, rating, or recommendation language.',
            'Compare the companies across business model, financial health, valuation, growth, and risk factors.',
            'Keep the answer concise: 3-5 short paragraphs. Do not include markdown tables.',
            '',
        ];
        stocks.forEach((stock) => {
            if (stock.error) return;
            lines.push(`--- ${stock.symbol} ---`);
            lines.push(`Company: ${stock.quote?.shortName || stock.symbol}`);
            lines.push(`Sector: ${stock.company?.sector || 'N/A'}`);
            lines.push(`Industry: ${stock.company?.industry || 'N/A'}`);
            lines.push(`Price: ${stock.quote?.regularMarketPrice ?? 'N/A'}`);
            lines.push(`Market Cap: ${stock.quote?.marketCap ?? 'N/A'}`);
            lines.push(`P/E: ${stock.quote?.trailingPE ?? 'N/A'}`);
            lines.push(`P/B: ${stock.quote?.priceToBook ?? 'N/A'}`);
            lines.push(`ROE: ${stock.ratios?.returnOnEquity != null ? formatPercent(stock.ratios.returnOnEquity) : 'N/A'}`);
            lines.push(`Operating Margin: ${stock.ratios?.operatingMargins != null ? formatPercent(stock.ratios.operatingMargins) : 'N/A'}`);
            lines.push(`Revenue Growth: ${stock.ratios?.revenueGrowth != null ? formatPercent(stock.ratios.revenueGrowth) : 'N/A'}`);
            lines.push(`Free Cash Flow: ${stock.ratios?.freeCashflow != null ? formatCurrency(stock.ratios.freeCashflow) : 'N/A'}`);
            lines.push(`Business: ${stock.company?.longBusinessSummary?.slice(0, 200) || 'N/A'}`);
            lines.push('');
        });
        lines.push('Provide a neutral, educational comparison of these three stocks based on the data above.');
        return lines.join('\n');
    };

    const stopChat = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setChatLoading(false);
        }
    };

    const sendChatMessage = async (question: string) => {
        const trimmed = question.trim();
        if (!trimmed || chatLoading) return;

        const userMessage: ChatMessage = { id: `${Date.now()}-user`, role: 'user', content: trimmed };
        setChatMessages((msgs) => [...msgs, userMessage]);
        setChatInput('');
        setChatLoading(true);
        setChatError(null);

        abortControllerRef.current = new AbortController();

        try {
            const prompt = [
                buildComparePrompt(),
                `User question: ${trimmed}`,
            ].join('\n');

            const response = await createGeminiInsight(prompt, abortControllerRef.current.signal);
            if (response?.success === false) {
                setChatError(response?.message || 'AI chat is unavailable.');
                return;
            }
            const answer = typeof response?.insight === 'string' ? filterAdvisoryLanguage(response.insight) : 'No comparison returned.';
            setChatMessages((msgs) => [...msgs, { id: `${Date.now()}-assistant`, role: 'assistant', content: answer }]);
        } catch (err) {
            if ((err as Error).name === 'AbortError') {
                setChatMessages((msgs) => [...msgs, { id: `${Date.now()}-assistant`, role: 'assistant', content: 'Generation stopped.' }]);
                return;
            }
            setChatError(err instanceof Error ? err.message : 'Unable to generate comparison.');
        } finally {
            abortControllerRef.current = null;
            setChatLoading(false);
        }
    };

    const updateSymbol = (index: number, value: string) => {
        const newInputs = [...symbolInputs];
        newInputs[index] = value.toUpperCase();
        setSymbolInputs(newInputs);
    };

    const refreshStock = (index: number) => {
        const sym = symbolInputs[index].trim().toUpperCase();
        if (sym) fetchStock(sym, index);
    };

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.10),_transparent_30%),linear-gradient(135deg,_#020617_0%,_#050816_55%,_#071014_100%)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-6 flex flex-col gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.25em] text-amber-300">Stock Comparison</p>
                        <h1 className="mt-2 text-3xl font-semibold text-white">Compare up to three stocks</h1>
                    </div>
                    <Button asChild variant="outline" className="w-fit rounded-lg border-slate-700 text-slate-100 hover:bg-slate-800">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" /> Dashboard
                        </Link>
                    </Button>
                </header>

                {/* Symbol Inputs */}
                <section className="mb-6 grid gap-3 md:grid-cols-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-sm font-bold text-amber-300">
                                {i + 1}
                            </div>
                            <input
                                value={symbolInputs[i]}
                                onChange={(e) => updateSymbol(i, e.target.value)}
                                placeholder={`Stock ${i + 1} symbol`}
                                className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none"
                            />
                            <button
                                onClick={() => refreshStock(i)}
                                disabled={!symbolInputs[i].trim()}
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white disabled:opacity-30"
                                title="Refresh"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </section>

                {/* Comparison Chart */}
                <section className="mb-6">
                    <Card className="border-slate-800/80 bg-slate-900/70">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <LineChart className="h-5 w-5 text-amber-300" />
                                <CardTitle>Price Performance (Normalized)</CardTitle>
                            </div>
                            <CardDescription className="text-slate-400">Percentage change from start — overlaid for direct comparison</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-3 flex flex-wrap gap-4">
                                {stocks.map((stock, i) => (
                                    <div key={stock.symbol} className="flex items-center gap-2 text-sm">
                                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                                        <span className="text-slate-300">{stock.symbol}</span>
                                        {stock.quote?.regularMarketPrice != null && (
                                            <span className="text-white">{formatCurrency(stock.quote.regularMarketPrice, currency)}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <ComparisonChart series={chartSeries} />
                        </CardContent>
                    </Card>
                </section>

                {/* Side-by-Side Metrics Table */}
                <section className="mb-6">
                    <Card className="border-slate-800/80 bg-slate-900/70">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-amber-300" />
                                <CardTitle>Side-by-Side Comparison</CardTitle>
                            </div>
                            <CardDescription className="text-slate-400">Key financial metrics across all three stocks</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-hidden rounded-2xl border border-slate-800">
                                <div className="grid grid-cols-4 gap-3 bg-slate-950/80 px-4 py-3 text-sm font-medium text-slate-300">
                                    <div>Metric</div>
                                    {stocks.map((s) => (
                                        <div key={s.symbol} className="text-right">{s.symbol}</div>
                                    ))}
                                </div>

                                <MetricRow label="Price" values={stocks.map((s) => s.quote?.regularMarketPrice != null ? formatCurrency(s.quote.regularMarketPrice, currency) : s.loading ? '...' : s.error ? 'Err' : '-')} />
                                <MetricRow label="Market Cap" values={stocks.map((s) => s.quote?.marketCap != null ? formatCurrency(s.quote.marketCap, currency) : s.loading ? '...' : s.error ? 'Err' : '-')} />
                                <MetricRow label="P/E" values={stocks.map((s) => s.quote?.trailingPE != null ? formatDecimal(s.quote.trailingPE) : s.loading ? '...' : s.error ? 'Err' : '-')} />
                                <MetricRow label="P/B" values={stocks.map((s) => s.quote?.priceToBook != null ? formatDecimal(s.quote.priceToBook) : s.loading ? '...' : s.error ? 'Err' : '-')} />
                                <MetricRow label="Dividend Yield" values={stocks.map((s) => s.quote?.dividendYield != null ? formatPercent(s.quote.dividendYield) : s.loading ? '...' : s.error ? 'Err' : '-')} />
                                <MetricRow label="ROE" values={stocks.map((s) => s.ratios?.returnOnEquity != null ? formatPercent(s.ratios.returnOnEquity) : s.loading ? '...' : s.error ? 'Err' : '-')} />
                                <MetricRow label="Operating Margin" values={stocks.map((s) => s.ratios?.operatingMargins != null ? formatPercent(s.ratios.operatingMargins) : s.loading ? '...' : s.error ? 'Err' : '-')} />
                                <MetricRow label="Profit Margin" values={stocks.map((s) => s.ratios?.profitMargins != null ? formatPercent(s.ratios.profitMargins) : s.loading ? '...' : s.error ? 'Err' : '-')} />
                                <MetricRow label="Revenue Growth" values={stocks.map((s) => s.ratios?.revenueGrowth != null ? formatPercent(s.ratios.revenueGrowth) : s.loading ? '...' : s.error ? 'Err' : '-')} />
                                <MetricRow label="Earnings Growth" values={stocks.map((s) => s.ratios?.earningsGrowth != null ? formatPercent(s.ratios.earningsGrowth) : s.loading ? '...' : s.error ? 'Err' : '-')} />
                                <MetricRow label="Current Ratio" values={stocks.map((s) => s.ratios?.currentRatio != null ? formatDecimal(s.ratios.currentRatio) : s.loading ? '...' : s.error ? 'Err' : '-')} />
                                <MetricRow label="Free Cash Flow" values={stocks.map((s) => s.ratios?.freeCashflow != null ? formatCurrency(s.ratios.freeCashflow, currency) : s.loading ? '...' : s.error ? 'Err' : '-')} />
                                <MetricRow label="Sector" values={stocks.map((s) => s.company?.sector || (s.loading ? '...' : s.error ? 'Err' : '-'))} />
                                <MetricRow label="Industry" values={stocks.map((s) => s.company?.industry || (s.loading ? '...' : s.error ? 'Err' : '-'))} />
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* AI Summary Chat */}
                <section className="mb-6">
                    <Card className="border-slate-800/80 bg-slate-900/70">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-amber-300" />
                                <CardTitle>AI Comparison Summary</CardTitle>
                            </div>
                            <CardDescription className="text-slate-400">Ask for an AI-generated comparison or summary of these stocks</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 flex flex-wrap gap-2">
                                <Button variant="outline" size="sm" className="rounded-full border-slate-700 text-xs text-slate-200 hover:bg-slate-800" onClick={() => sendChatMessage('Give me a detailed comparison summary of these three stocks based on the data.')}>
                                    <Sparkles className="mr-1 h-3 w-3" /> AI Summary
                                </Button>
                                <Button variant="outline" size="sm" className="rounded-full border-slate-700 text-xs text-slate-200 hover:bg-slate-800" onClick={() => sendChatMessage('Compare the valuation metrics (P/E, P/B, market cap) of these three stocks.')}>
                                    Valuation
                                </Button>
                                <Button variant="outline" size="sm" className="rounded-full border-slate-700 text-xs text-slate-200 hover:bg-slate-800" onClick={() => sendChatMessage('Compare the profitability (ROE, margins, free cash flow) of these three stocks.')}>
                                    Profitability
                                </Button>
                                <Button variant="outline" size="sm" className="rounded-full border-slate-700 text-xs text-slate-200 hover:bg-slate-800" onClick={() => sendChatMessage('Compare the growth (revenue growth, earnings growth) of these three stocks.')}>
                                    Growth
                                </Button>
                                <Button variant="outline" size="sm" className="rounded-full border-slate-700 text-xs text-slate-200 hover:bg-slate-800" onClick={() => sendChatMessage('Compare the business models, sectors, and competitive positions of these three companies.')}>
                                    Business Model
                                </Button>
                                {chatLoading && (
                                    <Button variant="outline" size="sm" className="rounded-full border-rose-700 text-xs text-rose-300 hover:bg-rose-950" onClick={stopChat}>
                                        <Square className="mr-1 h-3 w-3" /> Stop
                                    </Button>
                                )}
                            </div>

                            <div className="mb-3 max-h-80 space-y-3 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                                {chatMessages.map((message) => (
                                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user'
                                            ? 'bg-amber-600/20 text-amber-100'
                                            : 'bg-slate-800/60 text-slate-200'
                                            }`}>
                                            {message.content}
                                        </div>
                                    </div>
                                ))}
                                {chatLoading && (
                                    <div className="flex justify-start">
                                        <div className="max-w-[85%] rounded-2xl bg-slate-800/60 px-4 py-3 text-sm italic text-slate-400">Thinking...</div>
                                    </div>
                                )}
                            </div>

                            {chatError && (
                                <div className="mb-3 rounded-lg border border-amber-900/60 bg-amber-950/30 px-4 py-2 text-sm text-amber-200">{chatError}</div>
                            )}

                            <form onSubmit={(e) => { e.preventDefault(); sendChatMessage(chatInput); }} className="flex gap-2">
                                <input
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Ask about the comparison..."
                                    disabled={chatLoading}
                                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 disabled:opacity-50"
                                />
                                <Button type="submit" disabled={chatLoading || !chatInput.trim()} className="rounded-xl bg-amber-600 px-4 text-white hover:bg-amber-500 disabled:opacity-50">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </main>
    );
}