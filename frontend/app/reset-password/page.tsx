'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { resetPassword } from '@/lib/auth';

export default function ResetPasswordPage() {
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setMessage('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await resetPassword(token, password);
            setMessage('Your password has been reset. You can now sign in.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_24%),linear-gradient(135deg,_#020617_0%,_#030712_45%,_#07111f_100%)] px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(6,182,212,0.18),_transparent_25%)]" />
            <div className="absolute -left-10 top-20 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute bottom-8 right-8 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />

            <div className="relative w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
                <section className="bg-slate-950/80 p-8 sm:p-10">
                    <div className="mb-8">
                        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Reset password</p>
                        <h2 className="mt-2 text-3xl font-semibold text-white">Create a new password</h2>
                        <p className="mt-3 text-sm leading-6 text-slate-400">
                            Paste your reset token and choose a new password for your account.
                        </p>
                    </div>

                    <Card className="border-white/10 bg-white/[0.04] shadow-none">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl text-white">Reset your password</CardTitle>
                            <CardDescription className="text-slate-400">This token expires in one hour.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
                                        {error}
                                    </div>
                                )}
                                {message && (
                                    <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                                        {message}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label htmlFor="token" className="text-sm text-slate-300">
                                        Reset token
                                    </label>
                                    <div className="relative">
                                        <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                        <Input
                                            id="token"
                                            type="text"
                                            value={token}
                                            onChange={(e) => setToken(e.target.value)}
                                            required
                                            placeholder="Reset token"
                                            className="h-12 border-white/10 bg-slate-950/70 pl-10 text-white placeholder:text-slate-500"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="password" className="text-sm text-slate-300">
                                        New password
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
                                            className="h-12 border-white/10 bg-slate-950/70 pl-10 text-white placeholder:text-slate-500"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="confirmPassword" className="text-sm text-slate-300">
                                        Confirm password
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
                                            className="h-12 border-white/10 bg-slate-950/70 pl-10 text-white placeholder:text-slate-500"
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    className="h-12 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-semibold shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
                                    disabled={loading}
                                >
                                    {loading ? 'Resetting...' : 'Reset password'}
                                </Button>
                                <p className="text-center text-sm text-slate-400">
                                    Need help?{' '}
                                    <Link href="/forgot-password" className="font-medium text-cyan-300 transition hover:text-cyan-200 hover:underline">
                                        Request a new token
                                    </Link>
                                </p>
                            </form>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </main>
    );
}
