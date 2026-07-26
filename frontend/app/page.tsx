'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BarChart3, Bot, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getCurrentUser } from '@/lib/auth';

const features = [
    {
        title: 'AI-powered scans',
        description: 'Discover high-conviction setups with smart filters, momentum cues, and volatility-aware scoring.',
        icon: Sparkles,
    },
    {
        title: 'Live watchlists',
        description: 'Track favorite symbols with live snapshots, trend direction, and signal history.',
        icon: TrendingUp,
    },
    {
        title: 'Secure by design',
        description: 'Protected dashboards and encrypted session handling keep your research workflow private.',
        icon: ShieldCheck,
    },
];

const highlights = [
    { label: 'Accuracy score', value: '91 / 100' },
    { label: 'Signals tracked', value: '128' },
    { label: 'Watchlist uptime', value: '99.9%' },
];

const faqs = [
    {
        question: 'Who is this built for?',
        answer: 'The experience is tailored for active traders, long-term investors, and anyone who wants fast, readable market insights.',
    },
    {
        question: 'Can I customize the screening logic?',
        answer: 'Yes. You can refine filters around momentum, liquidity, valuation, and market regime to suit your style.',
    },
    {
        question: 'Is the data real-time?',
        answer: 'The platform is designed for fast market feedback, with live updates and a smooth interface for monitoring ideas.',
    },
];

export default function HomePage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<{ email?: string } | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await getCurrentUser();
                setIsAuthenticated(true);
                setUser(response.data?.user || null);
            } catch {
                setIsAuthenticated(false);
            }
        };

        checkAuth();
    }, []);

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.2),_transparent_30%),radial-gradient(circle_at_80%_10%,_rgba(59,130,246,0.18),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#030712_45%,_#020617_100%)] text-slate-100">
            <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
                <header className="sticky top-4 z-20 rounded-full border border-white/10 bg-slate-950/60 px-4 py-3 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20">
                                <BarChart3 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.38em] text-cyan-300">AI STOCK SCREENER</p>
                                <p className="text-sm text-slate-400">Premium signal intelligence</p>
                            </div>
                        </div>
                        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
                            <a href="#features" className="transition hover:text-white">Features</a>
                            <a href="#faq" className="transition hover:text-white">FAQ</a>
                            <a href="#launch" className="transition hover:text-white">Launch</a>
                        </nav>
                        <div className="flex items-center gap-2">
                            {!isAuthenticated ? (
                                <Link
                                    href="/login"
                                    className="hidden rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-100 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 sm:inline-flex"
                                >
                                    Sign in
                                </Link>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <span className="hidden text-sm text-slate-300 md:inline">{user?.email}</span>
                                    <Button asChild size="sm" className="rounded-full bg-cyan-400 px-4 text-slate-950 hover:bg-cyan-300">
                                        <Link href="/dashboard">
                                            Open dashboard <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <section className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:py-24">
                    <div className="max-w-2xl">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200 shadow-lg shadow-cyan-950/10">
                            <Bot className="h-4 w-4" />
                            Smart screening for modern traders
                        </div>
                        <h1 className="max-w-xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
                            See the market earlier with AI-crafted stock intelligence.
                        </h1>
                        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                            Streamline your research, monitor momentum shifts, and build conviction with a premium interface designed for speed, clarity, and focus.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button asChild size="lg" className="rounded-full bg-cyan-400 px-6 text-slate-950 hover:bg-cyan-300">
                                <Link href="/register">Start free</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="rounded-full border-white/10 bg-white/[0.03] px-6 text-slate-100 hover:border-cyan-400/40 hover:bg-cyan-400/10">
                                <Link href="#features">Explore features</Link>
                            </Button>
                        </div>

                        <div className="mt-10 grid gap-3 sm:grid-cols-3">
                            {highlights.map((item) => (
                                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.label}</p>
                                    <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-400">
                            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-300" /> Secure sessions</span>
                            <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-cyan-300" /> Built-in momentum signals</span>
                            <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-cyan-300" /> Dark first interface</span>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
                        <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full bg-fuchsia-400/10 blur-3xl" />
                        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
                            <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5">
                                <div className="mb-5 flex items-start justify-between">
                                    <div>
                                        <p className="text-sm text-slate-400">Signal score</p>
                                        <p className="mt-1 text-4xl font-semibold text-white">91 / 100</p>
                                    </div>
                                    <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
                                        Bullish
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        'Momentum breakout',
                                        'Relative strength',
                                        'Risk-adjusted trend',
                                    ].map((item) => (
                                        <div
                                            key={item}
                                            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300"
                                        >
                                            <span>{item}</span>
                                            <span className="font-medium text-cyan-300">Strong</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="features" className="grid gap-4 pb-16 md:grid-cols-3">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <Card
                                key={feature.title}
                                className="relative overflow-hidden border-white/10 bg-white/[0.04] transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30"
                            >
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
                                <CardHeader>
                                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <CardTitle>{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-base leading-7">{feature.description}</CardDescription>
                                    <p className="mt-5 text-xs uppercase tracking-[0.28em] text-slate-500">0{index + 1}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </section>

                <section id="launch" className="rounded-[32px] border border-cyan-400/20 bg-[linear-gradient(135deg,_rgba(8,145,178,0.18),_rgba(15,23,42,0.8))] p-8 shadow-2xl shadow-cyan-950/20 sm:p-10">
                    <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-2xl">
                            <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Launch your workflow</p>
                            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Join the new era of stock research.</h2>
                            <p className="mt-4 max-w-xl text-slate-300">
                                A focused dark workspace for screening, comparing, tracking, and acting on ideas without visual noise.
                            </p>
                        </div>
                        <Button asChild size="lg" className="rounded-full bg-white px-6 text-slate-950 hover:bg-slate-200">
                            <Link href="/register">Create account</Link>
                        </Button>
                    </div>
                </section>

                <section id="faq" className="py-16">
                    <div className="mx-auto max-w-3xl rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl sm:p-8">
                        <div className="mb-6">
                            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">FAQ</p>
                            <h2 className="mt-3 text-3xl font-semibold text-white">Frequently asked questions</h2>
                        </div>
                        <Accordion type="single" collapsible className="w-full">
                            {faqs.map((faq, index) => (
                                <AccordionItem key={faq.question} value={`item-${index}`}>
                                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                                    <AccordionContent>{faq.answer}</AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </section>
            </div>

            <footer className="border-t border-white/10 bg-slate-950/70 py-8">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                    <p>© 2026 AI Stock Screener</p>
                    <div className="flex gap-4">
                        <a href="#features" className="transition hover:text-white">Features</a>
                        <a href="#faq" className="transition hover:text-white">FAQ</a>
                        <a href="/dashboard" className="transition hover:text-white">Dashboard</a>
                    </div>
                </div>
            </footer>
        </main>
    );
}
