'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/auth';

export function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await logout();
            router.replace('/');
            router.refresh();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-center rounded-full border-white/10 bg-white/[0.03] text-slate-100 hover:border-cyan-400/40 hover:bg-cyan-400/10"
        >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
        </Button>
    );
}
