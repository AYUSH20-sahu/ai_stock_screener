import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';

export const dynamic = 'force-dynamic';

const spaceGrotesk = Space_Grotesk({
    subsets: ['latin'],
    variable: '--font-space-grotesk',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'AI Stock Screener',
    description: 'Indian stock screener built with Next.js and Express',
    themeColor: '#050816',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={spaceGrotesk.variable}>
            <body className="min-h-screen bg-[#050816] text-slate-50 antialiased">
                {children}
            </body>
        </html>
    );
}
