'use client';

import { useState, useEffect } from 'react';
import { Mail, DollarSign, ArrowRight, Inbox, TrendingUp, Zap, Download, Play, Loader2, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Email {
    id: number;
    subject: string;
    sender: string;
    date: string;
    category: string;
    processing_status: string;
}

interface Transaction {
    id: number;
    date: string;
    vendor: string;
    amount: number;
    status: string;
}

interface Stats {
    pendingEmails: number;
    processedEmails: number;
    transactions: number;
    totalSpent: number;
}

export default function Home() {
    const [stats, setStats] = useState<Stats>({
        pendingEmails: 0,
        processedEmails: 0,
        transactions: 0,
        totalSpent: 0,
    });
    const [recentEmails, setRecentEmails] = useState<Email[]>([]);
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const emailRes = await fetch('http://localhost:8000/api/email/list?limit=100');
            const emails = await emailRes.json();

            const pending = emails.filter((e: Email) => e.processing_status === 'pending').length;
            const processed = emails.filter((e: Email) => e.processing_status === 'processed').length;

            // Get recent processed emails for activity feed
            const recentProcessed = emails
                .filter((e: Email) => e.processing_status === 'processed')
                .slice(0, 3);
            setRecentEmails(recentProcessed);

            const txnRes = await fetch('http://localhost:8000/api/finance/transactions?limit=100');
            const transactions = await txnRes.json();

            const totalSpent = transactions.reduce((sum: number, t: Transaction) =>
                t.status === 'debit' ? sum + t.amount : sum, 0
            );

            setRecentTransactions(transactions.slice(0, 3));

            setStats({
                pendingEmails: pending,
                processedEmails: processed,
                transactions: transactions.length,
                totalSpent,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            await fetch('http://localhost:8000/api/email/sync?days=30', { method: 'POST' });
            await fetchStats();
        } catch (error) {
            console.error('Error syncing:', error);
        } finally {
            setSyncing(false);
        }
    };

    const handleRunAgent = async () => {
        setProcessing(true);
        try {
            await fetch('http://localhost:8000/api/email/analyze-pending?limit=5', { method: 'POST' });
            await fetchStats();
        } catch (error) {
            console.error('Error processing:', error);
        } finally {
            setProcessing(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="min-h-screen w-full bg-[#0f0716] text-slate-200 p-6">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-end justify-between pb-4 border-b border-white/5">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
                        <p className="text-xs text-slate-500 mt-1">Your AI assistant overview</p>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="h-9 px-3 flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-all disabled:opacity-50 border border-white/5"
                        >
                            <Download className={cn("w-3.5 h-3.5", syncing && "animate-bounce")} />
                            {syncing ? 'Syncing...' : 'Sync Inbox'}
                        </button>

                        <button
                            onClick={handleRunAgent}
                            disabled={processing || stats.pendingEmails === 0}
                            className="h-9 px-3 flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-all disabled:opacity-50 disabled:bg-white/10 disabled:text-slate-500"
                        >
                            {processing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Play className="w-3.5 h-3.5 fill-current" />
                            )}
                            {processing ? 'Processing...' : 'Run Agent'}
                        </button>
                    </div>
                </div>

                {/* Task Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Pending Emails */}
                    <Link href="/email" className="group">
                        <div className={cn(
                            "p-5 rounded-xl border transition-all",
                            stats.pendingEmails > 0
                                ? "bg-violet-600/10 border-violet-500/30 hover:border-violet-500/50"
                                : "bg-[#130b1c]/60 border-white/5 hover:border-white/10"
                        )}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                                    <Inbox className="w-5 h-5 text-violet-400" />
                                </div>
                                {stats.pendingEmails > 0 && (
                                    <span className="flex items-center gap-1 text-xs text-violet-400 font-medium">
                                        Action needed
                                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                )}
                            </div>

                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-[10px] uppercase text-slate-500 tracking-wider mb-1">Pending Emails</p>
                                    <p className={cn(
                                        "text-3xl font-bold",
                                        stats.pendingEmails > 0 ? "text-violet-400" : "text-white"
                                    )}>
                                        {loading ? '—' : stats.pendingEmails}
                                    </p>
                                </div>
                                <p className="text-xs text-slate-500">
                                    {stats.processedEmails} processed
                                </p>
                            </div>
                        </div>
                    </Link>

                    {/* Transactions */}
                    <Link href="/finance" className="group">
                        <div className="p-5 rounded-xl bg-[#130b1c]/60 border border-white/5 hover:border-white/10 transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-emerald-400" />
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
                            </div>

                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-[10px] uppercase text-slate-500 tracking-wider mb-1">Transactions</p>
                                    <p className="text-3xl font-bold text-white">
                                        {loading ? '—' : stats.transactions}
                                    </p>
                                </div>
                                <p className="text-xs text-red-400">
                                    {formatCurrency(stats.totalSpent)} spent
                                </p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Recent Emails */}
                    <div className="p-4 rounded-xl bg-[#130b1c]/40 border border-white/5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-white">Recent Emails</h3>
                            <Link href="/email" className="text-[10px] text-violet-400 hover:underline">View all</Link>
                        </div>

                        <div className="space-y-2">
                            {recentEmails.length === 0 ? (
                                <p className="text-xs text-slate-500 py-2">No processed emails yet</p>
                            ) : (
                                recentEmails.map((email) => (
                                    <div key={email.id} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02]">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-white truncate">{email.subject}</p>
                                            <p className="text-[10px] text-slate-500 truncate">{email.sender.replace(/<.*>/, '').trim()}</p>
                                        </div>
                                        <span className="text-[9px] text-slate-600 px-1.5 py-0.5 rounded bg-white/5">{email.category}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="p-4 rounded-xl bg-[#130b1c]/40 border border-white/5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-white">Recent Transactions</h3>
                            <Link href="/finance" className="text-[10px] text-violet-400 hover:underline">View all</Link>
                        </div>

                        <div className="space-y-2">
                            {recentTransactions.length === 0 ? (
                                <p className="text-xs text-slate-500 py-2">No transactions yet</p>
                            ) : (
                                recentTransactions.map((txn) => (
                                    <div key={txn.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
                                        <DollarSign className={cn(
                                            "w-3.5 h-3.5 flex-shrink-0",
                                            txn.status === 'debit' ? 'text-red-400' : 'text-emerald-400'
                                        )} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-white truncate">{txn.vendor}</p>
                                            <p className="text-[10px] text-slate-500">{txn.date}</p>
                                        </div>
                                        <span className={cn(
                                            "text-xs font-medium",
                                            txn.status === 'debit' ? 'text-red-400' : 'text-emerald-400'
                                        )}>
                                            {txn.status === 'debit' ? '-' : '+'}{formatCurrency(txn.amount)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Agents */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-lg bg-[#130b1c]/40 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                <Mail className="w-4 h-4 text-violet-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Email Agent</p>
                                <p className="text-[10px] text-slate-500">Triage + Categorize</p>
                            </div>
                            <div className="ml-auto flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <span className="text-[10px] text-green-400">Active</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-lg bg-[#130b1c]/40 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Finance Agent</p>
                                <p className="text-[10px] text-slate-500">Extract + Categorize</p>
                            </div>
                            <div className="ml-auto flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <span className="text-[10px] text-green-400">Active</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-violet-500" />
                        <span className="text-[10px] text-slate-500">Powered by LiteLLM + Groq</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-[10px] text-slate-500">All systems operational</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
