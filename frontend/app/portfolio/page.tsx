'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BarChart3, DollarSign, Edit2, PieChart, Plus, RefreshCw, Target, Trash2, TrendingDown, TrendingUp, Wallet2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { addHolding as apiAddHolding, createPortfolio as apiCreatePortfolio, getPortfolios, Portfolio, PortfolioHolding, removeHolding as apiRemoveHolding, updateHolding as apiUpdateHolding } from '@/lib/portfolioApi';
import { getStockCompanyInfo, getStockQuote } from '@/lib/stockApi';

type QuoteCache = Record<string, { price: number | null; sector: string | null }>;

const SECTOR_COLORS: Record<string, string> = {
    'Technology': '#3b82f6',
    'Financials': '#10b981',
    'Energy': '#f59e0b',
    'Health Care': '#ef4444',
    'Consumer Cyclical': '#8b5cf6',
    'Consumer Defensive': '#ec4899',
    'Communication Services': '#06b6d4',
    'Industrials': '#f97316',
    'Basic Materials': '#84cc16',
    'Real Estate': '#14b8a6',
    'Utilities': '#64748b',
    'Unknown': '#475569',
};

function formatCurrency(value: number | null | undefined) {
    if (value == null || Number.isNaN(value)) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
}

function formatPercent(value: number | null | undefined) {
    if (value == null || Number.isNaN(value)) return '-';
    return `${value.toFixed(2)}%`;
}

function formatCompact(value: number | null | undefined) {
    if (value == null || Number.isNaN(value)) return '-';
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value);
}

type PieSlice = { label: string; value: number; color: string; percentage: number };

function SimplePieChart({ slices, size = 200 }: { slices: PieSlice[]; size?: number }) {
    const total = slices.reduce((s, slice) => s + slice.value, 0);
    if (total === 0) return <div className="flex h-[200px] items-center justify-center text-sm text-slate-500">No data</div>;

    const radius = size / 2 - 20;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
        <div className="flex flex-col items-center gap-4 sm:flex-row">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <g transform={`translate(${size / 2}, ${size / 2})`}>
                    {slices.map((slice, index) => {
                        const length = (slice.value / total) * circumference;
                        const dashArray = `${length} ${circumference - length}`;
                        const dashOffset = -offset;
                        offset += length;

                        return (
                            <circle
                                key={slice.label}
                                r={radius}
                                fill="none"
                                stroke={slice.color}
                                strokeWidth={24}
                                strokeDasharray={dashArray}
                                strokeDashoffset={dashOffset}
                                transform="rotate(-90)"
                                className="transition-all duration-300"
                            />
                        );
                    })}
                    <circle r={radius - 16} fill="#020617" />
                </g>
            </svg>
            <div className="space-y-1.5 text-sm">
                {slices.map((slice) => (
                    <div key={slice.label} className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: slice.color }} />
                        <span className="text-slate-300">{slice.label}</span>
                        <span className="ml-auto font-medium text-white">{slice.percentage.toFixed(1)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function HoldingRow({
    holding,
    currentPrice,
    sector,
    onEdit,
    onDelete,
}: {
    holding: PortfolioHolding;
    currentPrice: number | null;
    sector?: string;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const currentValue = currentPrice != null ? currentPrice * holding.quantity : null;
    const returnAmount = currentValue != null ? currentValue - holding.investedAmount : null;
    const returnPercent = returnAmount != null && holding.investedAmount > 0 ? (returnAmount / holding.investedAmount) * 100 : null;
    const allocation = holding.investedAmount;

    return (
        <div className="grid gap-3 border-t border-slate-800 px-4 py-4 text-sm md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]">
            <div>
                <div className="font-semibold text-white">{holding.symbol}</div>
                <div className="mt-0.5 text-xs text-slate-500">{sector || 'N/A'}</div>
            </div>
            <div>
                <div className="text-slate-400">Qty {holding.quantity}</div>
                <div className="text-slate-400">Avg {formatCurrency(holding.averagePrice)}</div>
            </div>
            <div>
                <div className="text-slate-400">Invested</div>
                <div className="font-medium text-white">{formatCurrency(holding.investedAmount)}</div>
            </div>
            <div>
                <div className="text-slate-400">Current</div>
                <div className="font-medium text-white">{currentPrice ? formatCurrency(currentPrice) : '—'}</div>
            </div>
            <div>
                <div className="text-slate-400">Return</div>
                {returnAmount != null ? (
                    <div className={`font-medium ${returnAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(returnAmount)} ({formatPercent(returnPercent)})
                    </div>
                ) : (
                    <div className="text-slate-500">—</div>
                )}
            </div>
            <div className="flex items-center gap-2">
                <button onClick={onEdit} className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white" title="Edit">
                    <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={onDelete} className="rounded-lg p-2 text-slate-500 hover:bg-rose-950/50 hover:text-rose-400" title="Remove">
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

export default function PortfolioPage() {
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [activePortfolioId, setActivePortfolioId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quoteCache, setQuoteCache] = useState<QuoteCache>({});
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [showAddHolding, setShowAddHolding] = useState(false);
    const [editHoldingId, setEditHoldingId] = useState<string | null>(null);
    const [formSymbol, setFormSymbol] = useState('');
    const [formQty, setFormQty] = useState('');
    const [formPrice, setFormPrice] = useState('');
    const [formExchange, setFormExchange] = useState('');
    const [saving, setSaving] = useState(false);

    const loadPortfolios = useCallback(async () => {
        try {
            const response = await getPortfolios();
            setPortfolios(response.data);
            if (response.data.length > 0 && !activePortfolioId) {
                setActivePortfolioId(response.data[0].id);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load portfolios.');
        } finally {
            setLoading(false);
        }
    }, [activePortfolioId]);

    useEffect(() => {
        loadPortfolios();
    }, []);

    const activePortfolio = useMemo(() => portfolios.find((p) => p.id === activePortfolioId), [portfolios, activePortfolioId]);
    const allHoldings = useMemo(() => activePortfolio?.holdings || [], [activePortfolio]);

    useEffect(() => {
        if (allHoldings.length === 0) return;
        const symbols = allHoldings.map((h) => h.symbol);
        const uncached = symbols.filter((s) => !quoteCache[s]);
        if (uncached.length === 0) return;

        let isMounted = true;
        const fetchQuotes = async () => {
            const newCache = { ...quoteCache };
            for (const symbol of uncached) {
                try {
                    const [quoteRes, companyRes] = await Promise.allSettled([
                        getStockQuote(symbol),
                        getStockCompanyInfo(symbol),
                    ]);
                    if (!isMounted) return;
                    const price = quoteRes.status === 'fulfilled' ? (quoteRes.value.data as any)?.regularMarketPrice ?? null : null;
                    const sector = companyRes.status === 'fulfilled' ? (companyRes.value.data as any)?.sector ?? null : null;
                    newCache[symbol] = { price, sector };
                } catch {
                    newCache[symbol] = { price: null, sector: null };
                }
            }
            if (isMounted) setQuoteCache(newCache);
        };
        fetchQuotes();
        return () => { isMounted = false; };
    }, [allHoldings.length > 0 ? allHoldings.map((h) => h.symbol).join(',') : '']);

    const totalInvested = useMemo(() => allHoldings.reduce((s, h) => s + h.investedAmount, 0), [allHoldings]);
    const totalCurrent = useMemo(() => allHoldings.reduce((s, h) => {
        const price = quoteCache[h.symbol]?.price;
        return s + (price != null ? price * h.quantity : 0);
    }, 0), [allHoldings, quoteCache]);
    const totalReturn = totalCurrent - totalInvested;
    const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    const allocationSlices = useMemo(() => {
        if (totalInvested === 0) return [];
        return allHoldings
            .map((h) => ({
                label: h.symbol,
                value: h.investedAmount,
                color: SECTOR_COLORS[quoteCache[h.symbol]?.sector || 'Unknown'] || SECTOR_COLORS.Unknown,
                percentage: (h.investedAmount / totalInvested) * 100,
            }))
            .sort((a, b) => b.value - a.value);
    }, [allHoldings, totalInvested, quoteCache]);

    const sectorAllocation = useMemo(() => {
        const map: Record<string, number> = {};
        allHoldings.forEach((h) => {
            const sector = quoteCache[h.symbol]?.sector || 'Unknown';
            map[sector] = (map[sector] || 0) + h.investedAmount;
        });
        const total = Object.values(map).reduce((s, v) => s + v, 0);
        if (total === 0) return [];
        return Object.entries(map)
            .map(([label, value]) => ({
                label,
                value,
                color: SECTOR_COLORS[label] || SECTOR_COLORS.Unknown,
                percentage: (value / total) * 100,
            }))
            .sort((a, b) => b.value - a.value);
    }, [allHoldings, quoteCache]);

    const createPortfolio = async () => {
        if (!newName.trim() || saving) return;
        setSaving(true);
        try {
            await apiCreatePortfolio(newName.trim(), newDesc.trim() || undefined);
            setNewName('');
            setNewDesc('');
            setShowCreateForm(false);
            await loadPortfolios();
        } catch { } finally {
            setSaving(false);
        }
    };

    const saveHolding = async () => {
        if (!formSymbol.trim() || !formQty || !formPrice || saving) return;
        setSaving(true);
        const qty = Number(formQty);
        const price = Number(formPrice);
        if (qty <= 0 || price <= 0) { setSaving(false); return; }

        try {
            if (editHoldingId) {
                await apiUpdateHolding(editHoldingId, qty, price);
            } else if (activePortfolioId) {
                await apiAddHolding(activePortfolioId, formSymbol.trim(), qty, price, formExchange.trim() || undefined);
            }
            setShowAddHolding(false);
            setEditHoldingId(null);
            setFormSymbol('');
            setFormQty('');
            setFormPrice('');
            setFormExchange('');
            // Clear cache for this symbol so it re-fetches
            const sym = formSymbol.trim().toUpperCase();
            setQuoteCache((prev) => {
                const next = { ...prev };
                delete next[sym];
                return next;
            });
            await loadPortfolios();
        } catch { } finally {
            setSaving(false);
        }
    };

    const deleteHolding = async (id: string) => {
        try {
            await apiRemoveHolding(id);
            await loadPortfolios();
        } catch { }
    };

    const editHolding = (holding: PortfolioHolding) => {
        setEditHoldingId(holding.id);
        setFormSymbol(holding.symbol);
        setFormQty(String(holding.quantity));
        setFormPrice(String(holding.averagePrice));
        setFormExchange(holding.exchange);
        setShowAddHolding(true);
    };

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.10),_transparent_30%),linear-gradient(135deg,_#020617_0%,_#050816_55%,_#071014_100%)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-6 flex flex-col gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.25em] text-violet-300">Portfolio Tracker</p>
                        <h1 className="mt-2 text-3xl font-semibold text-white">Track your investments</h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Button asChild variant="outline" className="rounded-full border-slate-700 text-slate-100 hover:bg-slate-800">
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" /> Dashboard
                            </Link>
                        </Button>
                        <Button onClick={() => { setShowAddHolding(true); setEditHoldingId(null); setFormSymbol(''); setFormQty(''); setFormPrice(''); setFormExchange(''); }} className="rounded-full bg-violet-600 text-white hover:bg-violet-500">
                            <Plus className="mr-1 h-4 w-4" /> Add Holding
                        </Button>
                        <Button onClick={() => setShowCreateForm(true)} variant="outline" className="rounded-full border-slate-700 text-slate-100 hover:bg-slate-800">
                            <Wallet2 className="mr-1 h-4 w-4" /> New Portfolio
                        </Button>
                    </div>
                </header>

                {error && (
                    <div className="mb-6 rounded-lg border border-rose-900/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">{error}</div>
                )}

                {/* Portfolio selector */}
                {portfolios.length > 0 && (
                    <div className="mb-6 flex flex-wrap gap-2">
                        {portfolios.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setActivePortfolioId(p.id)}
                                className={`rounded-full border px-4 py-2 text-sm transition ${activePortfolioId === p.id
                                    ? 'border-violet-600 bg-violet-600/20 text-violet-200'
                                    : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                                    }`}
                            >
                                {p.name}
                                {p.description && <span className="ml-2 text-xs text-slate-500">{p.description}</span>}
                            </button>
                        ))}
                    </div>
                )}

                {/* Create Portfolio Form */}
                {showCreateForm && (
                    <Card className="mb-6 border-slate-800/80 bg-slate-900/70">
                        <CardContent className="pt-6">
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Portfolio name" className="flex-1 rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 outline-none" />
                                <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)" className="flex-1 rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 outline-none" />
                                <Button onClick={createPortfolio} disabled={saving || !newName.trim()} className="rounded-xl bg-violet-600 text-white hover:bg-violet-500">Create</Button>
                                <Button onClick={() => setShowCreateForm(false)} variant="outline" className="rounded-xl border-slate-700 text-slate-100">Cancel</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Add/Edit Holding Form */}
                {showAddHolding && activePortfolioId && (
                    <Card className="mb-6 border-slate-800/80 bg-slate-900/70">
                        <CardContent className="pt-6">
                            <div className="flex flex-wrap items-end gap-3">
                                <div className="flex-1 min-w-[120px]">
                                    <label className="mb-1 block text-xs text-slate-400">Symbol</label>
                                    <input value={formSymbol} onChange={(e) => setFormSymbol(e.target.value.toUpperCase())} placeholder="AAPL" className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 outline-none" disabled={!!editHoldingId} />
                                </div>
                                <div className="w-24">
                                    <label className="mb-1 block text-xs text-slate-400">Quantity</label>
                                    <input value={formQty} onChange={(e) => setFormQty(e.target.value)} placeholder="10" type="number" step="any" className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 outline-none" />
                                </div>
                                <div className="w-28">
                                    <label className="mb-1 block text-xs text-slate-400">Avg Price ($)</label>
                                    <input value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="150.00" type="number" step="any" className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 outline-none" />
                                </div>
                                <div className="flex-1 min-w-[100px]">
                                    <label className="mb-1 block text-xs text-slate-400">Exchange</label>
                                    <input value={formExchange} onChange={(e) => setFormExchange(e.target.value)} placeholder="NASDAQ" className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 outline-none" />
                                </div>
                                <Button onClick={saveHolding} disabled={saving || !formSymbol.trim() || !formQty || !formPrice} className="rounded-xl bg-violet-600 text-white hover:bg-violet-500">
                                    {editHoldingId ? 'Update' : 'Add'}
                                </Button>
                                <Button onClick={() => { setShowAddHolding(false); setEditHoldingId(null); }} variant="outline" className="rounded-xl border-slate-700 text-slate-100">
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {loading ? (
                    <div className="text-sm text-slate-400">Loading portfolios...</div>
                ) : portfolios.length === 0 ? (
                    <Card className="border-slate-800/80 bg-slate-900/70">
                        <CardContent className="py-12 text-center">
                            <Wallet2 className="mx-auto mb-4 h-12 w-12 text-slate-600" />
                            <p className="text-lg font-medium text-white">No portfolios yet</p>
                            <p className="mt-2 text-sm text-slate-400">Create your first portfolio to start tracking investments.</p>
                            <Button onClick={() => setShowCreateForm(true)} className="mt-4 rounded-full bg-violet-600 text-white hover:bg-violet-500">
                                <Plus className="mr-1 h-4 w-4" /> Create Portfolio
                            </Button>
                        </CardContent>
                    </Card>
                ) : activePortfolio ? (
                    <>
                        {/* Summary Cards */}
                        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Card className="border-slate-800/80 bg-slate-900/70">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <DollarSign className="h-4 w-4 text-violet-300" />
                                        Total Invested
                                    </div>
                                    <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(totalInvested)}</p>
                                </CardContent>
                            </Card>
                            <Card className="border-slate-800/80 bg-slate-900/70">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <Target className="h-4 w-4 text-violet-300" />
                                        Current Value
                                    </div>
                                    <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(totalCurrent)}</p>
                                </CardContent>
                            </Card>
                            <Card className="border-slate-800/80 bg-slate-900/70">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        {totalReturn >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-400" /> : <TrendingDown className="h-4 w-4 text-rose-400" />}
                                        Total Return
                                    </div>
                                    <p className={`mt-2 text-2xl font-semibold ${totalReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {formatCurrency(totalReturn)} ({formatPercent(totalReturnPercent)})
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="border-slate-800/80 bg-slate-900/70">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <BarChart3 className="h-4 w-4 text-violet-300" />
                                        Holdings
                                    </div>
                                    <p className="mt-2 text-2xl font-semibold text-white">{allHoldings.length}</p>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Allocation & Sector Charts */}
                        <section className="mb-6 grid gap-6 md:grid-cols-2">
                            <Card className="border-slate-800/80 bg-slate-900/70">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <PieChart className="h-5 w-5 text-violet-300" />
                                        <CardTitle>Allocation by Holding</CardTitle>
                                    </div>
                                    <CardDescription>Investment distribution across holdings</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {allocationSlices.length > 0 ? (
                                        <SimplePieChart slices={allocationSlices} />
                                    ) : (
                                        <p className="py-8 text-center text-sm text-slate-500">Add holdings to see allocation.</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-slate-800/80 bg-slate-900/70">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <PieChart className="h-5 w-5 text-violet-300" />
                                        <CardTitle>Sector Allocation</CardTitle>
                                    </div>
                                    <CardDescription>Investment distribution by sector</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {sectorAllocation.length > 0 ? (
                                        <SimplePieChart slices={sectorAllocation} />
                                    ) : (
                                        <p className="py-8 text-center text-sm text-slate-500">Add holdings to see sector allocation.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </section>

                        {/* Holdings Table */}
                        <Card className="border-slate-800/80 bg-slate-900/70">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Wallet2 className="h-5 w-5 text-violet-300" />
                                        <CardTitle>Holdings — {activePortfolio.name}</CardTitle>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <RefreshCw className="h-3 w-3" />
                                        Live prices
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-hidden rounded-2xl border border-slate-800">
                                    {allHoldings.length === 0 ? (
                                        <div className="px-4 py-6 text-center text-sm text-slate-400">No holdings yet. Add your first holding above.</div>
                                    ) : (
                                        <>
                                            <div className="hidden text-sm font-medium text-slate-300 md:grid md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] md:gap-3 md:bg-slate-950/80 md:px-4 md:py-3">
                                                <div>Symbol</div>
                                                <div>Quantity</div>
                                                <div>Invested</div>
                                                <div>Current Price</div>
                                                <div>Return</div>
                                                <div>Actions</div>
                                            </div>
                                            {allHoldings.map((holding) => (
                                                <HoldingRow
                                                    key={holding.id}
                                                    holding={holding}
                                                    currentPrice={quoteCache[holding.symbol]?.price ?? null}
                                                    sector={quoteCache[holding.symbol]?.sector || undefined}
                                                    onEdit={() => editHolding(holding)}
                                                    onDelete={() => deleteHolding(holding.id)}
                                                />
                                            ))}
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <div className="text-sm text-slate-400">Select a portfolio to view holdings.</div>
                )}
            </div>
        </main>
    );
}