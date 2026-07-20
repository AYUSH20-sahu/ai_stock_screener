import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export default function HomePage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
            <div className="w-full max-w-xl rounded-lg border border-slate-800 bg-slate-900/70 p-8 shadow-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="mb-3 text-sm uppercase tracking-[0.35em] text-slate-400">Milestone 1</p>
                        <h1 className="text-3xl font-semibold text-white">AI Stock Screener</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <SignedOut>
                            <a href="/sign-in" className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800">
                                Sign In
                            </a>
                        </SignedOut>
                        <SignedIn>
                            <UserButton afterSignOutUrl="/" />
                        </SignedIn>
                    </div>
                </div>
                <p className="mt-4 text-base text-slate-300">
                    Auth orchestration is now wired into the app shell. Use the protected profile route once signed in.
                </p>
                <div className="mt-6">
                    <Link href="/profile" className="text-sm font-medium text-cyan-400 hover:text-cyan-300">
                        Open protected profile page
                    </Link>
                </div>
            </div>
        </main>
    );
}
