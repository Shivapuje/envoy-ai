'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Fingerprint, Loader2, UserPlus } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuth();
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await register(username, displayName);
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0716] via-[#1a0b2e] to-[#0f0716] p-4">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-[#130b1c]/60 backdrop-blur-xl border border-violet-500/20 rounded-2xl p-8 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-600/20 rounded-full mb-4">
                            <UserPlus className="w-8 h-8 text-violet-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-100 mb-2">Create Account</h1>
                        <p className="text-slate-400">Set up your passkey to get started</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleRegister} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-[#1a0b2e]/50 border border-violet-500/20 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                                placeholder="Choose a username"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label htmlFor="displayName" className="block text-sm font-medium text-slate-300 mb-2">
                                Display Name
                            </label>
                            <input
                                id="displayName"
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-[#1a0b2e]/50 border border-violet-500/20 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                                placeholder="Your full name"
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !username || !displayName}
                            className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:from-violet-600/50 disabled:to-purple-600/50 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating Passkey...
                                </>
                            ) : (
                                <>
                                    <Fingerprint className="w-5 h-5" />
                                    Create Passkey
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-slate-400 text-sm">
                            Already have an account?{' '}
                            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Info */}
                <div className="mt-6 text-center space-y-2">
                    <p className="text-slate-500 text-xs">
                        Your passkey will be stored securely on your device
                    </p>
                    <p className="text-slate-500 text-xs">
                        Use fingerprint, face ID, or security key to authenticate
                    </p>
                </div>
            </div>
        </div>
    );
}
