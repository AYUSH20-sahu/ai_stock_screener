import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'AI Stock Screener',
    description: 'Indian stock screener built with Next.js and Express',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
