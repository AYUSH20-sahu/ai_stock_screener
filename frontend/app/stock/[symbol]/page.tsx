'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CandlestickSeries, ColorType, createChart, HistogramSeries, LineSeries, type CandlestickData, type HistogramData, type IChartApi, type LineData, type Time } from 'lightweight-charts';
import { ArrowLeft, BarChart3, Building2, CircleDollarSign, Landmark, LineChart, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createGeminiInsight } from '@/lib/geminiApi';
import { getStockCompanyInfo, getStockFinancialRatios, getStockFinancialStatements, getStockPriceHistory, getStockQuote } from '@/lib/stockApi';

type DataRecord = Record<string, unknown>;

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

type PricePoint = {
    date?: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number | null;
};

type FinancialStatements = {
    incomeAnnual?: DataRecord[];
    incomeQuarterly?: DataRecord[];
    balanceAnnual?: DataRecord[];
    balanceQuarterly?: DataRecord[];
    cashflowAnnual?: DataRecord[];
    cashflowQuarterly?: DataRecord[];
    earningsQuarterly?: DataRecord[];
    revenueAnnual?: DataRecord[];
};

type GeminiAnalysis = {
    businessSummary: string;
    swot: string;
    strengths: string[];
    weaknesses: string[];
    growth: string[];
    risks: string[];
    valuation: string[];
};

const emptyGeminiAnalysis: GeminiAnalysis = {
    businessSummary: '',
    swot: '',
    strengths: [],
    weaknesses: [],
    growth: [],
    risks: [],
    valuation: [],
};

const recommendationPattern = /\b(buy|sell|hold|accumulate|reduce|target price|rating|recommendation)\b/i;

function asNumber(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asText(value: unknown) {
    return typeof value === 'string' && value.trim() ? value : null;
}

function firstRecord(records: DataRecord[] | undefined) {
    return records?.[0] || {};
}

function field(record: DataRecord, keys: string[]) {
    for (const key of keys) {
        const value = asNumber(record[key]);
        if (value != null) {
            return value;
        }
    }
    return null;
}

function formatCurrency(value: number | null | undefined, currency = 'USD', digits = 2) {
    if (value == null || Number.isNaN(value)) {
        return '-';
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: digits,
        notation: Math.abs(value) >= 1000000000 ? 'compact' : 'standard',
    }).format(value);
}

function formatPercent(value: number | null | undefined, digits = 2) {
    if (value == null || Number.isNaN(value)) {
        return '-';
    }
    return `${value.toFixed(digits)}%`;
}

function formatMetric(value: number | null | undefined, digits = 2) {
    if (value == null || Number.isNaN(value)) {
        return '-';
    }
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value);
}

function formatDate(value: unknown) {
    if (!value) {
        return '-';
    }
    const date = new Date(value as string);
    if (Number.isNaN(date.getTime())) {
        return '-';
    }
    return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
}

function MetricTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-2 text-xl font-semibold text-white">{value}</p>
        </div>
    );
}

function StatementRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex min-h-12 items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3">
            <span className="text-sm text-slate-400">{label}</span>
            <span className="text-right font-medium text-white">{value}</span>
        </div>
    );
}

function parseGeminiAnalysis(text: string): GeminiAnalysis {
    const cleaned = text.replace(/```json|```/g, '').trim();
    if (recommendationPattern.test(cleaned)) {
        return {
            ...emptyGeminiAnalysis,
            businessSummary: 'Gemini returned content that was filtered because it included investment action language.',
        };
    }
    try {
        const parsed = JSON.parse(cleaned) as Partial<GeminiAnalysis>;
        return {
            businessSummary: typeof parsed.businessSummary === 'string' ? parsed.businessSummary : '',
            swot: typeof parsed.swot === 'string' ? parsed.swot : '',
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths.filter((item): item is string => typeof item === 'string') : [],
            weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.filter((item): item is string => typeof item === 'string') : [],
            growth: Array.isArray(parsed.growth) ? parsed.growth.filter((item): item is string => typeof item === 'string') : [],
            risks: Array.isArray(parsed.risks) ? parsed.risks.filter((item): item is string => typeof item === 'string') : [],
            valuation: Array.isArray(parsed.valuation) ? parsed.valuation.filter((item): item is string => typeof item === 'string') : [],
        };
    } catch {
        return {
            ...emptyGeminiAnalysis,
            businessSummary: cleaned || 'Gemini returned an analysis, but it could not be parsed into sections.',
        };
    }
}

function buildGeminiPrompt(payload: {
    symbol: string;
    quote: QuoteState | null;
    companyInfo: DataRecord | null;
    incomeRows: Array<{ label: string; value: string }>;
    balanceRows: Array<{ label: string; value: string }>;
    cashFlowRows: Array<{ label: string; value: string }>;
    quarterlyRows: Array<{ quarter: string; revenue: string; netIncome: string }>;
}) {
    return [
        'You are a financial research assistant generating neutral company analysis for an educational stock screener.',
        'Never generate investment advice. Do not use buy, sell, hold, accumulate, reduce, target price, rating, or recommendation language.',
        'Keep valuation qualitative and contextual. Discuss metrics and caveats only.',
        'Return only valid JSON with this exact shape:',
        '{"businessSummary":"string","swot":"string","strengths":["string"],"weaknesses":["string"],"growth":["string"],"risks":["string"],"valuation":["string"]}',
        'Use concise bullets. Do not include markdown.',
        `Symbol: ${payload.symbol}`,
        `Company: ${payload.quote?.shortName || payload.symbol}`,
        `Sector: ${asText(payload.companyInfo?.sector) || 'N/A'}`,
        `Industry: ${asText(payload.companyInfo?.industry) || 'N/A'}`,
        `Business profile: ${asText(payload.companyInfo?.longBusinessSummary) || 'N/A'}`,
        `Price: ${payload.quote?.regularMarketPrice ?? 'N/A'} ${payload.quote?.currency || ''}`,
        `Market cap: ${payload.quote?.marketCap ?? 'N/A'}`,
        `P/E: ${payload.quote?.trailingPE ?? 'N/A'}`,
        `P/B: ${payload.quote?.priceToBook ?? 'N/A'}`,
        `Income statement: ${JSON.stringify(payload.incomeRows)}`,
        `Balance sheet: ${JSON.stringify(payload.balanceRows)}`,
        `Cash flow: ${JSON.stringify(payload.cashFlowRows)}`,
        `Quarterly results: ${JSON.stringify(payload.quarterlyRows)}`,
    ].join('\n');
}

function AnalysisList({ items }: { items: string[] }) {
    return (
        <div className="space-y-2">
            {(items.length ? items : ['No generated detail available.']).map((item) => (
                <p key={item} className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm leading-6 text-slate-300">
                    {item}
                </p>
            ))}
        </div>
    );
}

function toChartTime(value: string | undefined): Time | null {
    if (!value) {
        return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date.toISOString().slice(0, 10);
}

function movingAverage(data: CandlestickData[], length: number): LineData[] {
    return data.reduce<LineData[]>((items, point, index) => {
        if (index + 1 < length) {
            return items;
        }
        const window = data.slice(index + 1 - length, index + 1);
        const value = window.reduce((total, item) => total + item.close, 0) / length;
        items.push({ time: point.time, value });
        return items;
    }, []);
}

function TradingViewChart({ data }: { data: PricePoint[] }) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const chartRef = useRef<IChartApi | null>(null);

    const chartData = useMemo(() => {
        return data
            .map((point) => {
                const time = toChartTime(point.date);
                const close = asNumber(point.close);
                if (!time || close == null) {
                    return null;
                }
                return {
                    time,
                    open: asNumber(point.open) ?? close,
                    high: asNumber(point.high) ?? close,
                    low: asNumber(point.low) ?? close,
                    close,
                    volume: asNumber(point.volume) ?? 0,
                };
            })
            .filter((point): point is CandlestickData & { volume: number } => point != null)
            .sort((a, b) => String(a.time).localeCompare(String(b.time)));
    }, [data]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

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
            rightPriceScale: {
                borderColor: '#1e293b',
                scaleMargins: { top: 0.08, bottom: 0.26 },
            },
            timeScale: {
                borderColor: '#1e293b',
                timeVisible: true,
                secondsVisible: false,
            },
            crosshair: {
                mode: 0,
            },
        });

        chartRef.current = chart;
        const candles = chart.addSeries(CandlestickSeries, {
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderUpColor: '#22c55e',
            borderDownColor: '#ef4444',
            wickUpColor: '#86efac',
            wickDownColor: '#fca5a5',
        });
        const volume = chart.addSeries(HistogramSeries, {
            priceFormat: { type: 'volume' },
            priceScaleId: '',
            color: '#334155',
        });
        const ma20 = chart.addSeries(LineSeries, {
            color: '#f59e0b',
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
        });

        volume.priceScale().applyOptions({
            scaleMargins: { top: 0.78, bottom: 0 },
        });

        const candleSeries = chartData.map(({ volume: _volume, ...point }) => point);
        const volumeSeries: HistogramData[] = chartData.map((point) => ({
            time: point.time,
            value: point.volume,
            color: point.close >= point.open ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)',
        }));

        candles.setData(candleSeries);
        volume.setData(volumeSeries);
        ma20.setData(movingAverage(candleSeries, 20));
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
    }, [chartData]);

    return (
        <div className="h-[320px] min-h-[320px] w-full sm:h-[360px] sm:min-h-[360px]" ref={containerRef}>
            {chartData.length ? null : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">No chart data available</div>
            )}
        </div>
    );
}

export default function StockDetailPage() {
    const params = useParams<{ symbol?: string }>();
    const rawSymbol = params?.symbol ? decodeURIComponent(params.symbol) : 'AAPL';
    const symbol = rawSymbol.toUpperCase();
    const [quote, setQuote] = useState<QuoteState | null>(null);
    const [companyInfo, setCompanyInfo] = useState<DataRecord | null>(null);
    const [financialRatios, setFinancialRatios] = useState<DataRecord | null>(null);
    const [statements, setStatements] = useState<FinancialStatements | null>(null);
    const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
    const [geminiAnalysis, setGeminiAnalysis] = useState<GeminiAnalysis>(emptyGeminiAnalysis);
    const [geminiLoading, setGeminiLoading] = useState(false);
    const [geminiError, setGeminiError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const [quoteResponse, companyResponse, ratiosResponse, statementsResponse, historyResponse] = await Promise.all([
                    getStockQuote(symbol),
                    getStockCompanyInfo(symbol),
                    getStockFinancialRatios(symbol),
                    getStockFinancialStatements(symbol),
                    getStockPriceHistory(symbol),
                ]);
                if (!isMounted) {
                    return;
                }
                setQuote((quoteResponse?.data as QuoteState) || null);
                setCompanyInfo((companyResponse?.data as DataRecord) || null);
                setFinancialRatios((ratiosResponse?.data as DataRecord) || null);
                setStatements((statementsResponse?.data as FinancialStatements) || null);
                const historyData = historyResponse?.data as { prices?: PricePoint[] };
                setPriceHistory(Array.isArray(historyData?.prices) ? historyData.prices : []);
            } catch (err) {
                if (!isMounted) {
                    return;
                }
                setError(err instanceof Error ? err.message : 'Unable to load stock detail.');
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
        const defaultKeyStatistics = (financialRatios?.defaultKeyStatistics as DataRecord | undefined) || {};
        const ratiosData = (financialRatios?.financialData as DataRecord | undefined) || {};
        return { defaultKeyStatistics, ratiosData };
    }, [financialRatios]);

    const currency = quote?.currency || asText(companyInfo?.currency) || 'USD';
    const latestIncome = firstRecord(statements?.incomeAnnual);
    const latestBalance = firstRecord(statements?.balanceAnnual);
    const latestCashflow = firstRecord(statements?.cashflowAnnual);
    const chartValues = priceHistory.map((point) => asNumber(point.close)).filter((value): value is number => value != null);
    const latestClose = chartValues[chartValues.length - 1] ?? quote?.regularMarketPrice ?? null;
    const previousClose = chartValues[chartValues.length - 2] ?? null;
    const trendChange = latestClose != null && previousClose ? ((latestClose - previousClose) / previousClose) * 100 : quote?.regularMarketChangePercent;

    const incomeRows = useMemo(() => [
        { label: 'Revenue', value: formatCurrency(field(latestIncome, ['totalRevenue']), currency, 0) },
        { label: 'Gross Profit', value: formatCurrency(field(latestIncome, ['grossProfit']), currency, 0) },
        { label: 'Operating Income', value: formatCurrency(field(latestIncome, ['operatingIncome']), currency, 0) },
        { label: 'Net Income', value: formatCurrency(field(latestIncome, ['netIncome']), currency, 0) },
    ], [latestIncome, currency]);

    const balanceRows = useMemo(() => [
        { label: 'Total Assets', value: formatCurrency(field(latestBalance, ['totalAssets']), currency, 0) },
        { label: 'Total Liabilities', value: formatCurrency(field(latestBalance, ['totalLiab', 'totalLiabilitiesNetMinorityInterest']), currency, 0) },
        { label: 'Total Cash', value: formatCurrency(field(latestBalance, ['cash', 'cashAndCashEquivalents', 'cashCashEquivalentsAndShortTermInvestments']) ?? asNumber(financialData.ratiosData.totalCash), currency, 0) },
        { label: 'Total Debt', value: formatCurrency(field(latestBalance, ['shortLongTermDebtTotal', 'totalDebt']) ?? asNumber(financialData.ratiosData.totalDebt), currency, 0) },
    ], [latestBalance, financialData.ratiosData, currency]);

    const cashFlowRows = useMemo(() => [
        { label: 'Operating Cash Flow', value: formatCurrency(field(latestCashflow, ['totalCashFromOperatingActivities', 'operatingCashFlow']) ?? asNumber(financialData.ratiosData.operatingCashflow), currency, 0) },
        { label: 'Capital Expenditure', value: formatCurrency(field(latestCashflow, ['capitalExpenditures', 'capitalExpenditure']), currency, 0) },
        { label: 'Free Cash Flow', value: formatCurrency(asNumber(financialData.ratiosData.freeCashflow), currency, 0) },
        { label: 'Dividends Paid', value: formatCurrency(field(latestCashflow, ['dividendsPaid', 'cashDividendsPaid']), currency, 0) },
    ], [latestCashflow, financialData.ratiosData, currency]);

    const quarterlyRows = useMemo(() => (statements?.incomeQuarterly || []).slice(0, 4).map((row, index) => ({
        quarter: formatDate(row.endDate) === '-' ? `Q${index + 1}` : formatDate(row.endDate),
        revenue: formatCurrency(field(row, ['totalRevenue']), currency, 0),
        netIncome: formatCurrency(field(row, ['netIncome']), currency, 0),
    })), [statements?.incomeQuarterly, currency]);

    useEffect(() => {
        if (loading || error) {
            return;
        }

        let isMounted = true;
        const loadGeminiAnalysis = async () => {
            setGeminiLoading(true);
            setGeminiError(null);
            try {
                const response = await createGeminiInsight(buildGeminiPrompt({
                    symbol,
                    quote,
                    companyInfo,
                    incomeRows,
                    balanceRows,
                    cashFlowRows,
                    quarterlyRows,
                }));
                if (!isMounted) {
                    return;
                }
                if (response?.success === false) {
                    setGeminiError(response?.message || 'Gemini analysis is unavailable.');
                    setGeminiAnalysis(emptyGeminiAnalysis);
                    return;
                }
                const text = typeof response?.insight === 'string' ? response.insight : '';
                setGeminiAnalysis(parseGeminiAnalysis(text));
            } catch (err) {
                if (!isMounted) {
                    return;
                }
                setGeminiError(err instanceof Error ? err.message : 'Unable to generate Gemini analysis.');
                setGeminiAnalysis(emptyGeminiAnalysis);
            } finally {
                if (isMounted) {
                    setGeminiLoading(false);
                }
            }
        };

        loadGeminiAnalysis();
        return () => {
            isMounted = false;
        };
    }, [loading, error, symbol, quote, companyInfo, incomeRows, balanceRows, cashFlowRows, quarterlyRows]);

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.10),_transparent_30%),linear-gradient(135deg,_#020617_0%,_#050816_55%,_#071014_100%)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-6 flex flex-col gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.25em] text-teal-300">Stock Details</p>
                        <h1 className="mt-2 text-3xl font-semibold text-white">{quote?.shortName || symbol}</h1>
                        <p className="mt-2 text-sm text-slate-400">{symbol} on {quote?.fullExchangeName || quote?.exchangeName || 'market data'}</p>
                    </div>
                    <Button asChild variant="outline" className="w-fit rounded-lg border-slate-700 text-slate-100 hover:bg-slate-800">
                        <Link href="/screener" className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" /> Back to screener
                        </Link>
                    </Button>
                </header>

                {error ? (
                    <div className="mb-6 rounded-lg border border-rose-900/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">{error}</div>
                ) : null}

                <section className="mb-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                    <Card className="border-slate-800/80 bg-slate-900/70">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <CircleDollarSign className="h-5 w-5 text-teal-300" />
                                <CardTitle>Financials</CardTitle>
                            </div>
                            <CardDescription className="text-slate-400">Market value and valuation snapshot</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-sm text-slate-400">Loading financials...</div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <MetricTile label="Price" value={formatCurrency(quote?.regularMarketPrice, currency)} />
                                    <MetricTile label="Market Cap" value={formatCurrency(quote?.marketCap, currency, 0)} />
                                    <MetricTile label="P/E" value={formatMetric(quote?.trailingPE ?? asNumber(companyInfo?.trailingPE))} />
                                    <MetricTile label="P/B" value={formatMetric(quote?.priceToBook ?? asNumber(companyInfo?.priceToBook))} />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-slate-800/80 bg-slate-900/70">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-teal-300" />
                                <CardTitle>Company Overview</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-slate-300">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <MetricTile label="Sector" value={asText(companyInfo?.sector) || 'N/A'} />
                                <MetricTile label="Industry" value={asText(companyInfo?.industry) || 'N/A'} />
                            </div>
                            <p className="line-clamp-5 leading-6 text-slate-300">{asText(companyInfo?.longBusinessSummary) || 'Company profile is not available for this symbol.'}</p>
                            {asText(companyInfo?.website) ? (
                                <a className="inline-flex text-sm font-medium text-teal-300 hover:text-teal-200" href={asText(companyInfo?.website) || '#'} target="_blank" rel="noreferrer">
                                    Company website
                                </a>
                            ) : null}
                        </CardContent>
                    </Card>
                </section>

                <section className="mb-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <Card className="border-slate-800/80 bg-slate-900/70">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <LineChart className="h-5 w-5 text-teal-300" />
                                <CardTitle>Charts</CardTitle>
                            </div>
                            <CardDescription className="text-slate-400">TradingView candlestick chart with volume and MA20</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                                <div className="mb-3 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm text-slate-400">Latest close</p>
                                        <p className="text-2xl font-semibold text-white">{formatCurrency(latestClose, currency)}</p>
                                    </div>
                                    <div className={`rounded-lg px-3 py-2 text-sm font-medium ${Number(trendChange) >= 0 ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                                        {formatPercent(trendChange)}
                                    </div>
                                </div>
                                <TradingViewChart data={priceHistory} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-800/80 bg-slate-900/70">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-teal-300" />
                                <CardTitle>Quarterly Results</CardTitle>
                            </div>
                            <CardDescription className="text-slate-400">Recent reported quarters</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {(quarterlyRows.length ? quarterlyRows : [{ quarter: '-', revenue: '-', netIncome: '-' }]).map((row) => (
                                <div key={`${row.quarter}-${row.revenue}`} className="grid min-h-14 grid-cols-[0.8fr_1fr_1fr] items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm">
                                    <span className="font-medium text-white">{row.quarter}</span>
                                    <span className="text-slate-400">Revenue {row.revenue}</span>
                                    <span className="text-right text-slate-400">Net {row.netIncome}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                    <Card className="border-slate-800/80 bg-slate-900/70">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-teal-300" />
                                <CardTitle>Income Statement</CardTitle>
                            </div>
                            <CardDescription className="text-slate-400">Latest annual statement</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {incomeRows.map((row) => <StatementRow key={row.label} label={row.label} value={row.value} />)}
                        </CardContent>
                    </Card>

                    <Card className="border-slate-800/80 bg-slate-900/70">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Landmark className="h-5 w-5 text-teal-300" />
                                <CardTitle>Balance Sheet</CardTitle>
                            </div>
                            <CardDescription className="text-slate-400">Latest annual position</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {balanceRows.map((row) => <StatementRow key={row.label} label={row.label} value={row.value} />)}
                        </CardContent>
                    </Card>
                </section>

                <section className="mt-6 grid gap-6 xl:grid-cols-2">
                    <Card className="border-slate-800/80 bg-slate-900/70">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <TrendingDown className="h-5 w-5 text-teal-300" />
                                <CardTitle>Cash Flow</CardTitle>
                            </div>
                            <CardDescription className="text-slate-400">Cash generation and distribution</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {cashFlowRows.map((row) => <StatementRow key={row.label} label={row.label} value={row.value} />)}
                        </CardContent>
                    </Card>

                    <Card className="border-slate-800/80 bg-slate-900/70">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <CircleDollarSign className="h-5 w-5 text-teal-300" />
                                <CardTitle>Ratios</CardTitle>
                            </div>
                            <CardDescription className="text-slate-400">Profitability and shareholder yield</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3 sm:grid-cols-2">
                            <MetricTile label="Operating Margin" value={formatPercent(asNumber(financialData.ratiosData.operatingMargins) != null ? Number(financialData.ratiosData.operatingMargins) * 100 : null)} />
                            <MetricTile label="Profit Margin" value={formatPercent(asNumber(financialData.ratiosData.profitMargins) != null ? Number(financialData.ratiosData.profitMargins) * 100 : null)} />
                            <MetricTile label="Current Ratio" value={formatMetric(asNumber(financialData.ratiosData.currentRatio))} />
                            <MetricTile label="Dividend Yield" value={formatPercent(typeof quote?.dividendYield === 'number' ? quote.dividendYield * 100 : null)} />
                        </CardContent>
                    </Card>
                </section>

                <section className="mt-6">
                    <Card className="border-slate-800/80 bg-slate-900/70">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-teal-300" />
                                <CardTitle>Google Gemini Analysis</CardTitle>
                            </div>
                            <CardDescription className="text-slate-400">Business summary, SWOT, growth, risks, and valuation context only</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {geminiLoading ? (
                                <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">Generating Gemini analysis...</div>
                            ) : geminiError ? (
                                <div className="rounded-lg border border-amber-900/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">{geminiError}</div>
                            ) : (
                                <div className="grid gap-4 xl:grid-cols-2">
                                    <div className="space-y-4">
                                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                                            <p className="text-sm font-medium text-white">Business Summary</p>
                                            <p className="mt-2 text-sm leading-6 text-slate-300">{geminiAnalysis.businessSummary || 'No generated summary available.'}</p>
                                        </div>
                                        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                                            <p className="text-sm font-medium text-white">SWOT</p>
                                            <p className="mt-2 text-sm leading-6 text-slate-300">{geminiAnalysis.swot || 'No generated SWOT available.'}</p>
                                        </div>
                                        <div>
                                            <p className="mb-2 text-sm font-medium text-white">Strengths</p>
                                            <AnalysisList items={geminiAnalysis.strengths} />
                                        </div>
                                        <div>
                                            <p className="mb-2 text-sm font-medium text-white">Weaknesses</p>
                                            <AnalysisList items={geminiAnalysis.weaknesses} />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="mb-2 text-sm font-medium text-white">Growth</p>
                                            <AnalysisList items={geminiAnalysis.growth} />
                                        </div>
                                        <div>
                                            <p className="mb-2 text-sm font-medium text-white">Risks</p>
                                            <AnalysisList items={geminiAnalysis.risks} />
                                        </div>
                                        <div>
                                            <p className="mb-2 text-sm font-medium text-white">Valuation</p>
                                            <AnalysisList items={geminiAnalysis.valuation} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </main>
    );
}
