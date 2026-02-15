'use client';

import { useState, useEffect } from 'react';
import {
    Loader2, Download, Play, Sparkles, Zap, Clock, X,
    Mail, DollarSign, Calendar, CreditCard, Check, ChevronDown,
    ChevronLeft, ChevronRight, Paperclip, Users, Eye
} from 'lucide-react';
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

interface EmailDetail extends Email {
    recipient: string | null;
    cc: string | null;
    body_text: string | null;
    body_html: string | null;
    attachments: { name: string; size: number; mime_type: string }[];
    suggested_agents: string[];
}

const AVAILABLE_AGENTS = [
    { id: 'email', name: 'Email Agent', icon: Mail, color: 'violet', description: 'Triage & categorize' },
    { id: 'finance', name: 'Finance Agent', icon: DollarSign, color: 'emerald', description: 'Extract transactions' },
    { id: 'credit_card', name: 'Credit Card Agent', icon: CreditCard, color: 'blue', description: 'Statement analysis' },
    { id: 'calendar', name: 'Calendar Agent', icon: Calendar, color: 'yellow', description: 'Event extraction', disabled: true },
];

const PAGE_SIZE_OPTIONS = [10, 15, 25, 50];

export default function InboxPage() {
    const [emails, setEmails] = useState<Email[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'processed'>('all');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15);

    // Modal state
    const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Agent picker state
    const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
    const [rememberChoice, setRememberChoice] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchEmails();
    }, []);

    const fetchEmails = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/email/list?limit=200');
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

    const openEmailModal = async (email: Email) => {
        setModalOpen(true);
        setLoadingDetail(true);
        setSelectedAgents([]);
        setRememberChoice(false);

        try {
            const response = await fetch(`http://localhost:8000/api/email/${email.id}`);
            const detail: EmailDetail = await response.json();
            setSelectedEmail(detail);
            if (detail.suggested_agents) {
                setSelectedAgents(detail.suggested_agents);
            }
        } catch (error) {
            console.error('Error fetching email detail:', error);
        } finally {
            setLoadingDetail(false);
        }
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedEmail(null);
    };

    const toggleAgent = (agentId: string) => {
        setSelectedAgents(prev =>
            prev.includes(agentId)
                ? prev.filter(id => id !== agentId)
                : [...prev, agentId]
        );
    };

    const handleAssignAgents = async () => {
        if (!selectedEmail || selectedAgents.length === 0) return;

        setProcessing(true);
        try {
            const response = await fetch(`http://localhost:8000/api/email/${selectedEmail.id}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent_ids: selectedAgents,
                    remember: rememberChoice
                })
            });
            const result = await response.json();
            if (result.status === 'success') {
                await fetchEmails();
                closeModal();
            }
        } catch (error) {
            console.error('Error assigning agents:', error);
        } finally {
            setProcessing(false);
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category.toLowerCase()) {
            case 'urgent': return 'text-red-400 bg-red-500/10';
            case 'finance': return 'text-emerald-400 bg-emerald-500/10';
            case 'work': return 'text-violet-400 bg-violet-500/10';
            case 'personal': return 'text-pink-400 bg-pink-500/10';
            case 'newsletter': return 'text-slate-400 bg-slate-500/10';
            default: return 'text-purple-400 bg-purple-500/10';
        }
    };

    // Filter emails
    const filteredEmails = emails.filter(e => {
        if (activeFilter === 'pending') return e.processing_status === 'pending';
        if (activeFilter === 'processed') return e.processing_status === 'processed';
        return true;
    });

    // Pagination
    const totalPages = Math.ceil(filteredEmails.length / itemsPerPage);
    const paginatedEmails = filteredEmails.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const pendingCount = emails.filter(e => e.processing_status === 'pending').length;

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="min-h-screen w-full bg-[#0f0716] text-slate-200 font-sans p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex justify-between items-end border-b border-white/5 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">Inbox</h1>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                            <Clock className="w-3 h-3" />
                            {lastSync ? lastSync.toLocaleTimeString() : 'Just now'}
                            <span className="text-slate-700">•</span>
                            <span className={pendingCount > 0 ? "text-violet-400" : ""}>
                                {filteredEmails.length} emails
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="h-9 px-4 flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white transition-all disabled:opacity-50 border border-white/5"
                        >
                            <Download className={cn("w-4 h-4", syncing && "animate-bounce")} />
                            Sync
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 w-fit">
                    {(['all', 'pending', 'processed'] as const).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => { setActiveFilter(filter); setCurrentPage(1); }}
                            className={cn(
                                "px-4 py-1.5 rounded-md text-xs font-medium transition-all capitalize",
                                activeFilter === filter
                                    ? "bg-violet-600 text-white"
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            {filter}
                            {filter === 'pending' && pendingCount > 0 && (
                                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px]">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-[#0c0612] border border-white/5 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                                <th className="text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider px-4 py-3">From</th>
                                <th className="text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Subject</th>
                                <th className="text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Category</th>
                                <th className="text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Date</th>
                                <th className="text-right text-[10px] font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center">
                                        <Loader2 className="w-6 h-6 text-violet-400 animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : paginatedEmails.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center">
                                        <Sparkles className="w-6 h-6 text-violet-400 mx-auto mb-2" />
                                        <p className="text-sm text-slate-500">No emails found</p>
                                    </td>
                                </tr>
                            ) : paginatedEmails.map((email) => (
                                <tr
                                    key={email.id}
                                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                                >
                                    <td className="px-4 py-3">
                                        {email.processing_status === 'pending' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-yellow-400 bg-yellow-500/10">
                                                <Clock className="w-3 h-3" />
                                                Pending
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-emerald-400 bg-emerald-500/10">
                                                <Check className="w-3 h-3" />
                                                Done
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm text-slate-300 truncate max-w-[180px]">
                                            {email.sender.replace(/<.*>/, '').trim()}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm text-white truncate max-w-[300px]">
                                            {email.subject}
                                        </p>
                                        {email.summary && email.processing_status === 'processed' && (
                                            <p className="text-xs text-slate-500 truncate max-w-[300px] mt-0.5">
                                                {email.summary}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {email.processing_status === 'processed' && (
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-medium uppercase",
                                                getCategoryColor(email.category)
                                            )}>
                                                {email.category}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs text-slate-500 font-mono">
                                            {new Date(email.date).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => openEmailModal(email)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 text-xs font-medium hover:bg-violet-500/20 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Eye className="w-3 h-3" />
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 0 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                            <div className="flex items-center gap-3">
                                <p className="text-xs text-slate-500">
                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredEmails.length)} of {filteredEmails.length}
                                </p>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    className="h-7 px-2 rounded-md bg-white/5 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
                                >
                                    {PAGE_SIZE_OPTIONS.map(size => (
                                        <option key={size} value={size} className="bg-slate-900">{size} / page</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={cn(
                                                "w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors",
                                                currentPage === pageNum
                                                    ? "bg-violet-600 text-white"
                                                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                                            )}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Email Detail Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                            onClick={closeModal}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", duration: 0.3 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                            onClick={closeModal}
                        >
                            <div
                                className="w-full max-w-2xl max-h-[85vh] bg-[#0c0612] border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {loadingDetail ? (
                                    <div className="flex-1 flex items-center justify-center py-20">
                                        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                                    </div>
                                ) : selectedEmail && (
                                    <>
                                        {/* Header */}
                                        <div className="p-5 border-b border-white/5 flex items-start justify-between">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {selectedEmail.processing_status === 'processed' ? (
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded text-[10px] uppercase font-bold",
                                                            getCategoryColor(selectedEmail.category)
                                                        )}>
                                                            {selectedEmail.category}
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold text-yellow-400 bg-yellow-500/10">
                                                            Pending
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-slate-500 font-mono">
                                                        {new Date(selectedEmail.date).toLocaleString()}
                                                    </span>
                                                </div>
                                                <h2 className="text-lg font-semibold text-white leading-tight">
                                                    {selectedEmail.subject}
                                                </h2>
                                            </div>
                                            <button
                                                onClick={closeModal}
                                                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors flex-shrink-0"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Email Meta */}
                                        <div className="px-5 py-3 border-b border-white/5 space-y-1.5 text-xs">
                                            <div className="flex">
                                                <span className="w-12 text-slate-500">From:</span>
                                                <span className="text-slate-300">{selectedEmail.sender}</span>
                                            </div>
                                            {selectedEmail.recipient && (
                                                <div className="flex">
                                                    <span className="w-12 text-slate-500">To:</span>
                                                    <span className="text-slate-300">{selectedEmail.recipient}</span>
                                                </div>
                                            )}
                                            {selectedEmail.cc && (
                                                <div className="flex">
                                                    <span className="w-12 text-slate-500">Cc:</span>
                                                    <span className="text-slate-400">{selectedEmail.cc}</span>
                                                </div>
                                            )}
                                            {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                                                <div className="flex items-start pt-1">
                                                    <span className="w-12 text-slate-500 flex items-center gap-1">
                                                        <Paperclip className="w-3 h-3" />
                                                    </span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedEmail.attachments.map((att, i) => (
                                                            <span key={i} className="px-2 py-1 rounded bg-white/5 text-slate-400 text-[10px]">
                                                                {att.name} ({formatFileSize(att.size)})
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* AI Summary */}
                                        {selectedEmail.summary && (
                                            <div className="mx-5 mt-4 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <Zap className="w-3 h-3 text-violet-400" />
                                                    <span className="text-[10px] font-medium text-violet-400">AI Summary</span>
                                                </div>
                                                <p className="text-xs text-slate-300 leading-relaxed">{selectedEmail.summary}</p>
                                            </div>
                                        )}

                                        {/* Body */}
                                        <div className="flex-1 overflow-y-auto p-5">
                                            <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                                                {selectedEmail.body_text || '(No content available)'}
                                            </div>
                                        </div>

                                        {/* Footer - Agent Assignment */}
                                        {selectedEmail.processing_status === 'pending' && (
                                            <div className="p-4 border-t border-white/5 bg-[#0a0510]">
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {AVAILABLE_AGENTS.map(agent => {
                                                        const isSelected = selectedAgents.includes(agent.id);
                                                        const isSuggested = selectedEmail.suggested_agents?.includes(agent.id);
                                                        return (
                                                            <button
                                                                key={agent.id}
                                                                disabled={agent.disabled}
                                                                onClick={() => toggleAgent(agent.id)}
                                                                className={cn(
                                                                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                                                    agent.disabled
                                                                        ? "opacity-40 cursor-not-allowed bg-white/5 text-slate-500"
                                                                        : isSelected
                                                                            ? "bg-violet-500 text-white shadow-[0_0_12px_-2px_rgba(124,58,237,0.5)]"
                                                                            : isSuggested
                                                                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30"
                                                                                : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"
                                                                )}
                                                            >
                                                                <agent.icon className="w-3.5 h-3.5" />
                                                                {agent.name.replace(' Agent', '')}
                                                                {isSelected && <Check className="w-3 h-3" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={handleAssignAgents}
                                                        disabled={processing || selectedAgents.length === 0}
                                                        className="flex-1 h-10 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                    >
                                                        {processing ? (
                                                            <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                                                        ) : (
                                                            <><Play className="w-3.5 h-3.5 fill-current" /> Process{selectedAgents.length > 0 ? ` (${selectedAgents.length})` : ''}</>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => setRememberChoice(!rememberChoice)}
                                                        className={cn(
                                                            "flex items-center gap-2 px-3 h-10 rounded-lg text-xs transition-all",
                                                            rememberChoice
                                                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                                                : "bg-white/5 text-slate-400 border border-white/10 hover:border-white/20"
                                                        )}
                                                    >
                                                        {rememberChoice ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                                                        Remember
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
