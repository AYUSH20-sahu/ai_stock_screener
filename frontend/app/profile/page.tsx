'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfilePage() {
    const [user, setUser] = useState<{ id: string; email: string; fullName?: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const response = await fetch('/api/auth/me');
            if (!response.ok) {
                router.push('/login');
                return;
            }
            const data = await response.json();
            setUser(data.data.user);
        } catch (error) {
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/');
            router.refresh();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
                <p className="text-slate-300">Loading...</p>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
            <Card className="w-full max-w-xl">
                <CardHeader>
                    <CardTitle className="text-3xl text-white">Profile</CardTitle>
                    <CardDescription>Manage your account settings</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                            <p><span className="font-semibold text-white">User ID:</span> {user?.id}</p>
                            <p><span className="font-semibold text-white">Email:</span> {user?.email || 'Not available'}</p>
                            <p><span className="font-semibold text-white">Name:</span> {user?.fullName || 'Not set'}</p>
                        </div>
                        <Button
                            onClick={handleLogout}
                            variant="outline"
                            className="w-full border-slate-700 text-slate-200 hover:bg-slate-800"
                        >
                            Sign Out
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
