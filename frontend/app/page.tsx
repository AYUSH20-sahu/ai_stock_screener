import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { ArrowRight, BarChart3, Bot, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const features = [
    {
        title: 'AI-powered scans',
        description: 'Discover high-conviction setups with smart filters, momentum cues, and volatility-aware scoring.',
        icon: Sparkles,
    },
    {
        title: 'Live watchlists',
        description: 'Track your favorite symbols with live price snapshots, trend direction, and signal history.',
        icon: TrendingUp,
    },
    {
        title: 'Secure by design',
        description: 'Protected dashboards and encrypted session handling keep your research workflow private.',
        icon: ShieldCheck,
    },
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
    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#030712_100%)] text-slate-100">
            <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
                <header className="sticky top-4 z-20 rounded-full border border-slate-800/80 bg-slate-950/70 px-4 py-3 shadow-lg shadow-cyan-950/20 backdrop-blur">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-300">
                                <BarChart3 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold tracking-[0.28em] text-cyan-300">AI STOCK SCREENER</p>
                                <p className="text-xs text-slate-400">Premium signal intelligence</p>
                            </div>
                        </div>
                        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
                            <a href="#features" className="transition hover:text-white">Features</a>
                            <a href="#faq" className="transition hover:text-white">FAQ</a>
                            <a href="#cta" className="transition hover:text-white">Launch</a>
                        </nav>
                        <div className="flex items-center gap-2">
                            <SignedOut>
                                <Link href="/sign-in" className="hidden rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-800 sm:inline-flex">
                                    Sign in
                                </Link>
                            </SignedOut>
                            <SignedIn>
                                <UserButton afterSignOutUrl="/" />
                            </SignedIn>
                            <Button asChild size="sm" className="rounded-full bg-cyan-400 px-4 text-slate-950 hover:bg-cyan-300">
                                <Link href="/profile">
                                    Open app <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </header>

                <section className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
                    <div className="max-w-2xl">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-300">
                            <Bot className="h-4 w-4" />
                            Smart screening for modern traders
                        </div>
                        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                            See the market earlier with AI-crafted stock insights.
                        </h1>
                        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                            Streamline your research, monitor high-momentum ideas, and build conviction with a premium experience designed for speed.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button asChild size="lg" className="rounded-full bg-cyan-400 px-6 text-slate-950 hover:bg-cyan-300">
                                <Link href="/sign-up">Start free</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="rounded-full border-slate-700 px-6 text-slate-100 hover:bg-slate-800">
                                <Link href="#features">Explore features</Link>
                            </Button>
                        </div>
                        <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-400">
                            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-300" /> Secure sessions</span>
                            <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-cyan-300" /> Built-in momentum signals</span>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur">
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-400">Signal score</p>
                                    <p className="text-3xl font-semibold text-white">91 / 100</p>
                                </div>
                                <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">Bullish</div>
                            </div>
                            <div className="space-y-3">
                                {['Momentum breakout', 'Relative strength', 'Risk-adjusted trend'].map((item) => (
                                    <div key={item} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
                                        <span>{item}</span>
                                        <span className="font-medium text-cyan-300">Strong</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section id="features" className="grid gap-4 pb-16 md:grid-cols-3">
                    {features.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <Card key={feature.title} className="transition duration-300 hover:-translate-y-1 hover:border-cyan-500/40">
                                <CardHeader>
                                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-300">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <CardTitle>{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription>{feature.description}</CardDescription>
                                </CardContent>
                            </Card>
                        );
                    })}
                </section>

                <section id="cta" className="rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-8 shadow-xl shadow-cyan-950/20 sm:p-10">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Launch your workflow</p>
                            <h2 className="mt-2 text-3xl font-semibold text-white">Join the new era of stock research.</h2>
                        </div>
                        <Button asChild size="lg" className="rounded-full bg-white px-6 text-slate-950 hover:bg-slate-200">
                            <Link href="/sign-up">Create account</Link>
                        </Button>
                    </div>
                </section>

                <section id="faq" className="py-16">
                    <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-slate-950/20">
                        <h2 className="mb-6 text-2xl font-semibold text-white">Frequently asked questions</h2>
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

            <footer className="border-t border-slate-800 bg-slate-950/70 py-8">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                    <p>© 2026 AI Stock Screener</p>
                    <div className="flex gap-4">
                        <a href="#features" className="transition hover:text-white">Features</a>
                        <a href="#faq" className="transition hover:text-white">FAQ</a>
                        <a href="/profile" className="transition hover:text-white">Profile</a>
                    </div>
                </div>
            </footer>
        </main>
    );
}
