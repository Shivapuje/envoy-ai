'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/glass/GlassCard';
import { GlassInput } from '@/components/ui/glass/GlassInput';
import { Loader2, Plus, X, TrendingUp, TrendingDown, CreditCard, Filter, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Transaction {
    id: number;
    date: string;
    vendor: string;
    amount: number;
    category: string;
    status: string;
}

const CATEGORIES = ['All', 'Shopping', 'Food', 'Transport', 'Bills', 'Entertainment', 'Other'];

export default function FinancePage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [inputText, setInputText] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/finance/transactions');
            const data = await response.json();
            setTransactions(data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async () => {
        if (!inputText.trim()) return;

        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/finance/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: inputText }),
            });

            if (response.ok) {
                const newTransaction = await response.json();
                setTransactions([newTransaction, ...transactions]);
                setInputText('');
                setShowManualEntry(false);
            }
        } catch (error) {
            console.error('Error analyzing transaction:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getCategoryColor = (category: string) => {
        switch (category.toLowerCase()) {
            case 'shopping': return 'text-pink-400 bg-pink-400/10';
            case 'food': return 'text-orange-400 bg-orange-400/10';
            case 'transport': return 'text-blue-400 bg-blue-400/10';
            case 'bills': return 'text-yellow-400 bg-yellow-400/10';
            case 'entertainment': return 'text-purple-400 bg-purple-400/10';
            default: return 'text-slate-400 bg-slate-400/10';
        }
    };

    const filteredTransactions = activeCategory === 'All'
        ? transactions
        : transactions.filter(t => t.category.toLowerCase() === activeCategory.toLowerCase());

    // Calculate stats
    const totalSpent = transactions.reduce((sum, t) => t.status === 'debit' ? sum + t.amount : sum, 0);
    const totalReceived = transactions.reduce((sum, t) => t.status === 'credit' ? sum + t.amount : sum, 0);

    return (
        <div className="min-h-screen w-full bg-[#0f0716] text-slate-200 relative overflow-hidden font-sans p-6">
            <div className="max-w-7xl mx-auto space-y-4">

                {/* Compact Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/5">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Finance</h1>
                        <p className="text-xs text-slate-500">Auto-extracted from Inbox</p>
                    </div>

                    <button
                        onClick={() => setShowManualEntry(!showManualEntry)}
                        className={cn(
                            "h-8 px-3 flex items-center gap-1.5 rounded-full transition-all text-xs font-medium",
                            showManualEntry
                                ? "bg-red-500/20 text-red-400"
                                : "bg-violet-600 hover:bg-violet-500 text-white"
                        )}
                    >
                        {showManualEntry ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        {showManualEntry ? 'Cancel' : 'Add'}
                    </button>
                </div>

                {/* Compact Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#130b1c]/60 rounded-lg px-4 py-3 border border-white/5 flex items-center gap-3">
                        <TrendingDown className="w-4 h-4 text-red-400" />
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase">Spent</p>
                            <p className="text-sm font-semibold text-red-400">{formatCurrency(totalSpent)}</p>
                        </div>
                    </div>
                    <div className="bg-[#130b1c]/60 rounded-lg px-4 py-3 border border-white/5 flex items-center gap-3">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase">Received</p>
                            <p className="text-sm font-semibold text-emerald-400">{formatCurrency(totalReceived)}</p>
                        </div>
                    </div>
                    <div className="bg-[#130b1c]/60 rounded-lg px-4 py-3 border border-white/5 flex items-center gap-3">
                        <CreditCard className="w-4 h-4 text-violet-400" />
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase">Count</p>
                            <p className="text-sm font-semibold text-white">{transactions.length}</p>
                        </div>
                    </div>
                </div>

                {/* Manual Entry */}
                <AnimatePresence>
                    {showManualEntry && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-[#130b1c]/80 border border-violet-500/20 rounded-lg p-4">
                                <GlassInput
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Paste transaction SMS/email..."
                                    className="!bg-white/5 text-sm"
                                />
                                <div className="flex justify-end mt-3">
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={loading || !inputText.trim()}
                                        className="px-3 py-1.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                        Add
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Category Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                    <Filter className="w-3 h-3 text-slate-500 flex-shrink-0" />
                    {CATEGORIES.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={cn(
                                "px-2.5 py-1 rounded-full text-[10px] font-medium transition-all whitespace-nowrap",
                                activeCategory === category
                                    ? "bg-violet-600 text-white"
                                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                            )}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Transactions Table - Compact */}
                <div className="bg-[#130b1c]/60 rounded-lg border border-white/5 overflow-hidden">
                    {filteredTransactions.length === 0 ? (
                        <div className="text-center py-12">
                            <DollarSign className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">No transactions</p>
                            <p className="text-xs text-slate-600">Finance emails are auto-extracted from Inbox</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-white/5 text-[10px] uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium">Date</th>
                                    <th className="px-4 py-2 text-left font-medium">Merchant</th>
                                    <th className="px-4 py-2 text-left font-medium">Category</th>
                                    <th className="px-4 py-2 text-right font-medium">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredTransactions.map((txn) => (
                                    <tr key={txn.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-2.5 text-slate-400 text-xs">{txn.date}</td>
                                        <td className="px-4 py-2.5 text-white font-medium">{txn.vendor}</td>
                                        <td className="px-4 py-2.5">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-medium",
                                                getCategoryColor(txn.category)
                                            )}>
                                                {txn.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <span className={cn(
                                                "font-semibold",
                                                txn.status === 'debit' ? 'text-red-400' : 'text-emerald-400'
                                            )}>
                                                {txn.status === 'debit' ? '-' : '+'}{formatCurrency(txn.amount)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
