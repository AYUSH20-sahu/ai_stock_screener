import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
    const { userId } = auth();
    if (!userId) {
        redirect('/');
    }

    const user = await currentUser();

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
            <div className="w-full max-w-xl rounded-lg border border-slate-800 bg-slate-900/70 p-8 shadow-2xl">
                <h1 className="text-3xl font-semibold text-white">Profile</h1>
                <p className="mt-3 text-slate-300">This page is protected by Clerk authentication.</p>
                <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                    <p><span className="font-semibold text-white">User ID:</span> {userId}</p>
                    <p><span className="font-semibold text-white">Email:</span> {user?.emailAddresses[0]?.emailAddress || 'Not available'}</p>
                </div>
            </div>
        </main>
    );
}
