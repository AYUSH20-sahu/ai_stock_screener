'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, LockKeyhole, Mail, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/?endpoint=login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            router.push('/profile');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_24%),linear-gradient(135deg,_#020617_0%,_#030712_45%,_#07111f_100%)] px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(6,182,212,0.18),_transparent_25%)]" />
            <div className="absolute -left-10 top-20 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute bottom-8 right-8 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />

            <div className="relative w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/70 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
                <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
                    <section className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(135deg,_rgba(34,211,238,0.18),_rgba(15,23,42,0.96))] p-8 lg:flex">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_30%)]" />
                        <div className="relative space-y-6">
                            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-white/20">
                                <ArrowLeft className="h-4 w-4" />
                                Back to home
                            </Link>
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-200">
                                    <Sparkles className="h-4 w-4" />
                                    Smart research workspace
                                </div>
                                <h1 className="max-w-md text-4xl font-semibold leading-tight text-white">
                                    Welcome back to your AI-powered investing hub.
                                </h1>
                                <p className="max-w-md text-base leading-7 text-slate-300">
                                    Pick up where you left off with tailored stock insights, watchlists, and portfolio intelligence.
                                </p>
                            </div>
                        </div>
                        <div className="relative rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
                            <p className="font-medium text-white">Why members love it</p>
                            <ul className="mt-3 space-y-2">
                                <li>• Instant access to your portfolio and screener</li>
                                <li>• Secure session handling with modern safeguards</li>
                                <li>• AI summaries for faster decision-making</li>
                            </ul>
                        </div>
                    </section>

                    <section className="bg-slate-950/80 p-8 sm:p-10">
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Sign in</p>
                                <h2 className="mt-2 text-3xl font-semibold text-white">Access your account</h2>
                            </div>
                        </div>

                        <Card className="border-slate-800 bg-slate-900/70 shadow-none">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-2xl text-white">Welcome back</CardTitle>
                                <CardDescription>Enter your credentials to continue securely.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {error && (
                                        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
                                            {error}
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-sm text-slate-300">
                                            Email
                                        </label>
                                        <div className="relative">
                                            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                            <Input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                placeholder="you@example.com"
                                                className="h-12 border-slate-700 bg-slate-950/70 pl-10 text-white placeholder:text-slate-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="password" className="text-sm text-slate-300">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                            <Input
                                                id="password"
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                placeholder="••••••••"
                                                className="h-12 border-slate-700 bg-slate-950/70 pl-10 text-white placeholder:text-slate-500"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="h-12 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-semibold shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
                                        disabled={loading}
                                    >
                                        {loading ? 'Signing in...' : 'Sign In'}
                                    </Button>
                                    <p className="text-center text-sm text-slate-400">
                                        Don&apos;t have an account?{' '}
                                        <Link href="/register" className="font-medium text-cyan-300 transition hover:text-cyan-200 hover:underline">
                                            Create one
                                        </Link>
                                    </p>
                                </form>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </div>
        </main>
    );
}