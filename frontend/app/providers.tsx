"use client";

import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

    if (!publishableKey || publishableKey.includes('your_clerk')) {
        return <>{children}</>;
    }

    return <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>;
}
