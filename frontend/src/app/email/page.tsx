'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlassButton } from '@/components/ui/glass/GlassButton';
import { Loader2, Download, Play, Sparkles, Zap, Clock, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Email {
    id: number;
    subject: string;
    sender: string;
    date: string;
    category: string;
    summary: string;
    urgency_score: number;
    action_required: boolean;
    processing_status: 'pending' | 'processed' | 'skipped' | 'failed';
    processed_by_agent?: string;
}

const CATEGORIES = ['Pending', 'All', 'Urgent', 'Finance', 'Work', 'Personal', 'Newsletter', 'Other'];

export default function InboxPage() {
    const [emails, setEmails] = useState<Email[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [activeCategory, setActiveCategory] = useState('Pending');

    useEffect(() => {
        fetchEmails();
    }, []);

    const fetchEmails = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/email/list?limit=50');
            const data = await response.json();
            setEmails(data);
        } catch (error) {
            console.error('Error fetching emails:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const response = await fetch('http://localhost:8000/api/email/sync?days=30', { method: 'POST' });
            const result = await response.json();
            if (result.status === 'success') {
                setLastSync(new Date());
                await fetchEmails();
            }
        } catch (error) {
            console.error('Error syncing:', error);
        } finally {
            setSyncing(false);
        }
    };

    const handleAnalyzePending = async () => {
        setProcessing(true);
        try {
            const response = await fetch('http://localhost:8000/api/email/analyze-pending?limit=5', { method: 'POST' });
            const result = await response.json();
            if (result.status === 'success') {
                await fetchEmails();
            }
        } catch (error) {
            console.error('Error analyzing:', error);
        } finally {
            setProcessing(false);
        }
    };

    const handleAnalyzeSingle = async (id: number) => {
        setProcessingId(id);
        try {
            const response = await fetch(`http://localhost:8000/api/email/analyze/${id}`, { method: 'POST' });
            const result = await response.json();
            if (result.status === 'success') {
                await fetchEmails();
            }
        } catch (error) {
            console.error('Error analyzing single:', error);
        } finally {
            setProcessingId(null);
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category.toLowerCase()) {
            case 'urgent': return 'text-red-400 bg-red-400/10 border-red-400/20';
            case 'finance': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
            case 'work': return 'text-violet-400 bg-violet-400/10 border-violet-400/20';
            case 'personal': return 'text-pink-400 bg-pink-400/10 border-pink-400/20';
            case 'newsletter': return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
            default: return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
        }
    };

    const pendingCount = emails.filter(e => e.processing_status === 'pending').length;

    const filteredEmails = activeCategory === 'Pending'
        ? emails.filter(e => e.processing_status === 'pending')
        : activeCategory === 'All'
            ? emails
            : emails.filter(e => e.category.toLowerCase() === activeCategory.toLowerCase());

    return (
        <div className="min-h-screen w-full bg-[#0f0716] text-slate-200 relative overflow-hidden font-sans p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">Inbox</h1>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                            <Clock className="w-3 h-3" />
                            Last sync: {lastSync ? lastSync.toLocaleTimeString() : 'Just now'}
                            <span className="text-slate-700">•</span>
                            <span className={pendingCount > 0 ? "text-violet-400" : ""}>
                                {pendingCount} pending analysis
                            </span>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex items-center gap-3">
                        {/* Sync Button with progress bar */}
                        <div className="relative">
                            <button
                                onClick={handleSync}
                                disabled={syncing}
                                className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-all disabled:opacity-50 border border-white/5 hover:border-violet-500/30"
                                title="Sync IMAP"
                            >
                                <Download className={cn("w-4 h-4", syncing && "animate-bounce")} />
                            </button>
                            {/* Progress bar */}
                            {syncing && (
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-violet-500 rounded-full animate-pulse" style={{ width: '100%' }} />
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleAnalyzePending}
                            disabled={processing || pendingCount === 0}
                            className="relative h-10 w-10 flex items-center justify-center rounded-full bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-50 disabled:bg-white/5 disabled:text-slate-500 shadow-[0_0_15px_-3px_rgba(124,58,237,0.4)]"
                            title="Run Agent on Pending"
                        >
                            {processing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Play className="w-4 h-4 ml-0.5 fill-current" />
                            )}
                            {!processing && pendingCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center border border-[#0f0716]">
                                    {pendingCount > 9 ? '9+' : pendingCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Category Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    {CATEGORIES.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                                activeCategory === category
                                    ? "bg-violet-600 text-white"
                                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5"
                            )}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                        {filteredEmails.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-16">
                                <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center mb-4">
                                    <Sparkles className="w-7 h-7 text-violet-400" />
                                </div>
                                <h3 className="text-lg font-medium text-white mb-1">All caught up!</h3>
                                <p className="text-sm text-slate-500 text-center max-w-xs">
                                    {activeCategory === 'Pending'
                                        ? 'No emails pending analysis. Sync to fetch new emails.'
                                        : `No emails in ${activeCategory} category.`}
                                </p>
                            </div>
                        ) : filteredEmails.map((email) => (
                            <motion.div
                                key={email.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                            >
                                <GlassCard
                                    className={cn(
                                        "h-full flex flex-col transition-all duration-300 group relative",
                                        email.processing_status === 'pending'
                                            ? "!bg-white/[0.02] border-white/5 hover:!border-white/10"
                                            : "!bg-[#130b1c]/80 !border-white/5 hover:!border-violet-500/30 hover:!bg-[#1a0f26]",
                                        email.urgency_score >= 8 ? "!border-red-500/20" : ""
                                    )}
                                >
                                    {/* PENDING STATE */}
                                    {email.processing_status === 'pending' && (
                                        <div className="flex flex-col h-full">
                                            <div className="flex justify-between items-start mb-3 opacity-50">
                                                <span className="text-[10px] font-mono text-slate-500">RAW</span>
                                                <span className="text-[10px] text-slate-500">{new Date(email.date).toLocaleDateString()}</span>
                                            </div>
                                            <h3 className="text-slate-300 font-medium mb-1 line-clamp-2 leading-snug">
                                                {email.subject}
                                            </h3>
                                            <p className="text-xs text-slate-600 truncate mb-4">
                                                {email.sender.replace(/<.*>/, '').trim()}
                                            </p>
                                            <div className="mt-auto flex justify-end">
                                                <button
                                                    onClick={() => handleAnalyzeSingle(email.id)}
                                                    disabled={processingId === email.id}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-400 text-xs font-medium hover:bg-violet-500/20 transition-colors"
                                                >
                                                    {processingId === email.id ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <Sparkles className="w-3 h-3" />
                                                    )}
                                                    Run Agent
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* PROCESSED STATE */}
                                    {email.processing_status === 'processed' && (
                                        <div className="flex flex-col h-full">
                                            <div className="flex justify-between items-start mb-4">
                                                <span className={cn(
                                                    "inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border",
                                                    getCategoryColor(email.category)
                                                )}>
                                                    {email.category}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {email.urgency_score >= 8 && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                                                    <span className="text-[10px] text-slate-500 font-mono">
                                                        {new Date(email.date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <h3 className="text-white font-medium mb-1 line-clamp-2 leading-snug group-hover:text-violet-200 transition-colors">
                                                    {email.subject}
                                                </h3>
                                                <p className="text-xs text-slate-500 truncate">
                                                    {email.sender.replace(/<.*>/, '').trim()}
                                                </p>
                                            </div>

                                            <div className="mt-auto pt-4 border-t border-white/5">
                                                <div className="flex items-start gap-2">
                                                    <Zap className="w-3 h-3 text-violet-500 mt-0.5 flex-shrink-0" />
                                                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                                                        {email.summary}
                                                    </p>
                                                </div>
                                                <div className="mt-3 flex justify-end">
                                                    <span className="text-[9px] text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">
                                                        via {email.processed_by_agent === 'email_triage' ? 'Triage Agent' : 'Manual Trigger'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Status Overlay for FAILED or SKIPPED */}
                                    {(email.processing_status === 'failed' || email.processing_status === 'skipped') && (
                                        <div className="flex flex-col h-full opacity-50">
                                            <h3 className="text-slate-400 font-medium mb-1 line-clamp-2">
                                                {email.subject}
                                            </h3>
                                            <div className="mt-auto text-xs text-red-500 font-mono text-right">
                                                {email.processing_status.toUpperCase()}
                                            </div>
                                        </div>
                                    )}
                                </GlassCard>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
