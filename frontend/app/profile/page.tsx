import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { ArrowRight, BadgeCheck, CircleUserRound, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogoutButton } from '@/components/profile/logout-button';
import type { AuthUser } from '@/lib/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://ai-stock-screener-4fc5.onrender.com';

async function loadProfile(): Promise<AuthUser> {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    if (!cookieHeader.includes('accessToken=')) {
        redirect('/login');
    }

    const response = await fetch(`${BACKEND_URL}/api/me`, {
        headers: {
            cookie: cookieHeader,
        },
        cache: 'no-store',
    });

    if (!response.ok) {
        redirect('/login');
    }

    const data = await response.json().catch(() => null);
    const user = data?.data?.user as AuthUser | undefined;

    if (!user) {
        redirect('/login');
    }

    return user;
}

function DetailRow({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon?: ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="flex items-center gap-2 text-slate-500">
                {icon}
                {label}
            </p>
            <p className="mt-1 font-medium text-white">{value}</p>
        </div>
    );
}

export default async function ProfilePage() {
    const user = await loadProfile();

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_24%),linear-gradient(135deg,_#020617_0%,_#030712_48%,_#020617_100%)] px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-screen max-w-4xl items-center">
                <Card className="w-full overflow-hidden border-white/10 bg-white/[0.04] shadow-2xl shadow-cyan-950/25 backdrop-blur-xl">
                    <div className="h-1 bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-400" />
                    <CardHeader className="space-y-4 sm:space-y-5">
                        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-cyan-200">
                            <BadgeCheck className="h-3.5 w-3.5" />
                            Account
                        </div>
                        <CardTitle className="text-3xl text-white sm:text-4xl">Profile</CardTitle>
                        <CardDescription className="max-w-2xl text-base text-slate-400">
                            Manage your account settings and review the identity currently connected to your workspace.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-[1fr_0.9fr]">
                            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20">
                                        <CircleUserRound className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-400">Signed in as</p>
                                        <p className="text-lg font-semibold text-white">{user.fullName || 'User'}</p>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-3 text-sm text-slate-300">
                                    <DetailRow label="User ID" value={user.id} />
                                    <DetailRow label="Email" value={user.email} icon={<Mail className="h-4 w-4" />} />
                                    <DetailRow label="Display name" value={user.fullName || 'Not set'} />
                                </div>
                            </div>

                            <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-[linear-gradient(135deg,_rgba(8,145,178,0.18),_rgba(15,23,42,0.8))] p-5">
                                <div>
                                    <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">Workspace status</p>
                                    <h3 className="mt-2 text-2xl font-semibold text-white">Account verified and ready.</h3>
                                    <p className="mt-3 text-sm leading-7 text-slate-300">
                                        Your session is active, your data is private, and the dashboard is ready whenever you want to continue.
                                    </p>
                                </div>

                                <div className="mt-6 flex flex-col gap-3">
                                    <LogoutButton />
                                    <Button asChild className="w-full justify-center rounded-full bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                                        <Link href="/dashboard">
                                            Go to dashboard <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
