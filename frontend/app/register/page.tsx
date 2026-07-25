'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, LockKeyhole, Mail, Sparkles, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegisterPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/?endpoint=register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, fullName }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            router.push('/profile');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.16),_transparent_24%),linear-gradient(135deg,_#020617_0%,_#030712_45%,_#07111f_100%)] px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(129,140,248,0.16),_transparent_25%)]" />
            <div className="absolute -left-8 bottom-8 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute right-10 top-10 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />

            <div className="relative w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/70 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
                <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
                    <section className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(135deg,_rgba(129,140,248,0.2),_rgba(15,23,42,0.96))] p-8 lg:flex">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_30%)]" />
                        <div className="relative space-y-6">
                            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-white/20">
                                <ArrowLeft className="h-4 w-4" />
                                Back to home
                            </Link>
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-200">
                                    <Sparkles className="h-4 w-4" />
                                    Build your edge
                                </div>
                                <h1 className="max-w-md text-4xl font-semibold leading-tight text-white">
                                    Start tracking smarter ideas in minutes.
                                </h1>
                                <p className="max-w-md text-base leading-7 text-slate-300">
                                    Create your workspace to access market dashboards, portfolio tools, and AI-guided research in one place.
                                </p>
                            </div>
                        </div>
                        <div className="relative rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
                            <p className="font-medium text-white">What you get</p>
                            <ul className="mt-3 space-y-2">
                                <li>• Personalized portfolio tracking</li>
                                <li>• Fast stock screener and comparison tools</li>
                                <li>• A clean, distraction-free research workflow</li>
                            </ul>
                        </div>
                    </section>

                    <section className="bg-slate-950/80 p-8 sm:p-10">
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Create account</p>
                                <h2 className="mt-2 text-3xl font-semibold text-white">Join the experience</h2>
                            </div>
                        </div>

                        <Card className="border-slate-800 bg-slate-900/70 shadow-none">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-2xl text-white">Create your account</CardTitle>
                                <CardDescription>Start with a few details and unlock your dashboard.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {error && (
                                        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
                                            {error}
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <label htmlFor="fullName" className="text-sm text-slate-300">
                                            Full Name
                                        </label>
                                        <div className="relative">
                                            <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                            <Input
                                                id="fullName"
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                required
                                                placeholder="Alex Morgan"
                                                className="h-12 border-slate-700 bg-slate-950/70 pl-10 text-white placeholder:text-slate-500"
                                            />
                                        </div>
                                    </div>
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
                                    <div className="space-y-2">
                                        <label htmlFor="confirmPassword" className="text-sm text-slate-300">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                placeholder="Repeat password"
                                                className="h-12 border-slate-700 bg-slate-950/70 pl-10 text-white placeholder:text-slate-500"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="h-12 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-semibold shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
                                        disabled={loading}
                                    >
                                        {loading ? 'Creating account...' : 'Sign Up'}
                                    </Button>
                                    <p className="text-center text-sm text-slate-400">
                                        Already have an account?{' '}
                                        <Link href="/login" className="font-medium text-cyan-300 transition hover:text-cyan-200 hover:underline">
                                            Sign in
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