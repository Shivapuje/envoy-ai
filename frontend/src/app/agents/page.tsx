'use client';

import { useState, useEffect } from 'react';
import {
    X, RefreshCw, Clock, Check, AlertCircle, Mail, DollarSign,
    CreditCard, Zap, ChevronRight, Code, ArrowRight, Bot
} from 'lucide-react';

// Types
interface AgentLog {
    id: number;
    run_id: string;
    agent_name: string;
    model_used: string;
    input_summary: string | null;
    output_summary: string | null;
    started_at: string | null;
    completed_at: string | null;
    duration_ms: number | null;
    status: string;
    error_message: string | null;
}

interface AgentConfig {
    id: string;
    name: string;
    icon: typeof Mail;
    model: string;
    provider: string;
    expertise: string;
    description: string;
    triggers: string[];
    canTrigger: string[];
    prompt: string;
    status: 'active' | 'inactive' | 'coming_soon';
}

// Agent configurations with prompts
const AGENT_CONFIGS: AgentConfig[] = [
    {
        id: 'email',
        name: 'Email Agent',
        icon: Mail,
        model: 'llama-3.3-70b-versatile',
        provider: 'Groq',
        expertise: 'Email Triage & Classification',
        description: 'Analyzes incoming emails, categorizes by urgency and type, and routes to appropriate agents.',
        triggers: ['Manual', 'Inbox Sync'],
        canTrigger: ['finance', 'calendar'],
        status: 'active',
        prompt: `You are an Executive Assistant triaging emails.

Analyze the email and return a JSON response with:
- category: One of "Urgent", "Finance", "Work", "Newsletter", "Spam", "Personal", "Other"
- urgency_score: 1-10 (10 being most urgent)
- summary: One sentence summary
- action_required: true/false

Focus on identifying:
1. Financial transactions (bills, receipts, statements)
2. Calendar events (meetings, appointments)
3. Urgent matters requiring immediate attention
4. Newsletters and promotional content`
    },
    {
        id: 'finance',
        name: 'Finance Agent',
        icon: DollarSign,
        model: 'llama-3.3-70b-versatile',
        provider: 'Groq',
        expertise: 'Transaction Extraction & Categorization',
        description: 'Extracts transaction details from emails, categorizes spending, and tracks financial data.',
        triggers: ['Email Agent', 'Manual'],
        canTrigger: [],
        status: 'active',
        prompt: `You are a Financial Analyst. Extract transaction details from the provided text.

Return a JSON response with:
- amount: Numeric value (float)
- currency: "INR" or "USD"
- vendor: Merchant/company name
- category: "Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"
- transaction_type: "debit" or "credit"
- date: "YYYY-MM-DD" format or null
- is_subscription: true/false

Be precise with amounts and always identify the merchant name.`
    },
    {
        id: 'credit_card',
        name: 'Credit Card Agent',
        icon: CreditCard,
        model: 'gpt-4o',
        provider: 'OpenAI',
        expertise: 'Statement Analysis & EMI Tracking',
        description: 'Processes credit card statements, extracts all transactions, and breaks down EMI payments with interest and GST.',
        triggers: ['Manual', 'PDF Upload'],
        canTrigger: ['finance'],
        status: 'active',
        prompt: `You are a Credit Card Statement Analyst. Extract all transactions from the statement.

For each transaction, extract:
- date: Transaction date (YYYY-MM-DD)
- description: Merchant/description
- amount: Amount (positive for credits, negative for debits)
- transaction_type: "debit" or "credit"
- category: Shopping/Dining/Travel/Bills/Entertainment/Fuel/EMI/Other

For EMI transactions, also extract:
- is_emi: true
- emi_principal: Principal amount
- emi_interest: Interest amount  
- emi_gst: GST on interest (18%)
- emi_remaining_months: Remaining EMI count

Return JSON with:
- statement_date, card_last_4, total_due, min_due, due_date
- transactions: Array of transaction objects
- summary: { total_debits, total_credits, emi_count, emi_total }`
    },
    {
        id: 'calendar',
        name: 'Calendar Agent',
        icon: Zap,
        model: 'llama-3.3-70b-versatile',
        provider: 'Groq',
        expertise: 'Event Extraction & Scheduling',
        description: 'Identifies calendar events from emails and creates schedule entries.',
        triggers: ['Email Agent'],
        canTrigger: [],
        status: 'coming_soon',
        prompt: `You are a Calendar Assistant. Extract event details from emails.

Return a JSON response with:
- event_title: Short descriptive title
- event_date: "YYYY-MM-DD" format
- event_time: "HH:MM" 24-hour format or null
- duration_minutes: Estimated duration
- location: Physical or virtual location
- attendees: List of participant names/emails
- is_recurring: true/false
- reminder_minutes: Suggested reminder time before event`
    }
];

// Status colors
const statusColors: Record<string, string> = {
    success: 'text-green-400 border-green-500/50 bg-green-500/10',
    error: 'text-red-400 border-red-500/50 bg-red-500/10',
    running: 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10',
    pending: 'text-slate-400 border-slate-500/50 bg-slate-500/10',
};

const agentStatusColors: Record<string, string> = {
    active: 'bg-green-500',
    inactive: 'bg-slate-500',
    coming_soon: 'bg-yellow-500',
};

export default function AgentsPage() {
    const [logs, setLogs] = useState<AgentLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    const fetchLogs = async (agentName?: string) => {
        try {
            const url = agentName
                ? `http://localhost:8000/api/agents/logs?agent_name=${agentName}&limit=20`
                : 'http://localhost:8000/api/agents/logs?limit=50';
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const openAgentDrawer = (agent: AgentConfig) => {
        setSelectedAgent(agent);
        setDrawerOpen(true);
        setShowPrompt(false);
        fetchLogs(agent.id);
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        setSelectedAgent(null);
        setShowPrompt(false);
    };

    const formatTime = (dateStr: string | null) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    const formatDuration = (ms: number | null) => {
        if (!ms) return '0ms';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const getAgentLogs = (agentId: string) => logs.filter(l => l.agent_name === agentId);

    return (
        <div className="min-h-screen p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-semibold text-white">Agent Configuration</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        View and configure how AI agents interact with your data
                    </p>
                </div>
                <button
                    onClick={() => { setLoading(true); fetchLogs(); }}
                    className="h-10 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium flex items-center gap-2 transition-all"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Agent Interaction Diagram */}
            <div className="mb-8 p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <h3 className="text-sm font-medium text-slate-300 mb-4">Agent Orchestration Flow</h3>
                <div className="flex items-center justify-center gap-3 flex-wrap py-4">
                    {/* Trigger */}
                    <div className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-300 text-sm">
                        📥 Email / Upload
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-500" />

                    {/* Email Agent */}
                    <div className="px-4 py-3 rounded-xl bg-violet-600/20 border border-violet-500/50 text-violet-300">
                        <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span className="text-sm font-medium">Email Agent</span>
                        </div>
                    </div>

                    {/* Branch */}
                    <div className="flex flex-col items-center gap-2">
                        <ArrowRight className="w-5 h-5 text-slate-500" />
                        <div className="h-8 w-px bg-slate-600" />
                        <ArrowRight className="w-5 h-5 text-slate-500 rotate-90" />
                    </div>

                    {/* Finance & Calendar */}
                    <div className="flex flex-col gap-3">
                        <div className="px-4 py-3 rounded-xl bg-green-600/20 border border-green-500/50 text-green-300">
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                <span className="text-sm font-medium">Finance Agent</span>
                            </div>
                        </div>
                        <div className="px-4 py-3 rounded-xl bg-yellow-600/20 border border-yellow-500/50 text-yellow-300 opacity-50">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                <span className="text-sm font-medium">Calendar Agent</span>
                                <span className="text-xs">(Soon)</span>
                            </div>
                        </div>
                    </div>

                    <ArrowRight className="w-5 h-5 text-slate-500" />

                    {/* Result */}
                    <div className="px-4 py-2 rounded-lg bg-green-800/50 border border-green-500/50 text-green-300 text-sm">
                        ✅ Processed
                    </div>
                </div>

                {/* Credit Card Flow */}
                <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-white/5">
                    <div className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-300 text-sm">
                        📄 PDF Statement
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-500" />
                    <div className="px-4 py-3 rounded-xl bg-blue-600/20 border border-blue-500/50 text-blue-300">
                        <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            <span className="text-sm font-medium">Credit Card Agent</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/30">GPT-4o</span>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-500" />
                    <div className="px-4 py-2 rounded-lg bg-green-800/50 border border-green-500/50 text-green-300 text-sm">
                        ✅ Statement Parsed
                    </div>
                </div>
            </div>

            {/* Agent Cards Grid */}
            <h3 className="text-sm font-medium text-slate-300 mb-4">Available Agents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                {AGENT_CONFIGS.map((agent) => {
                    const Icon = agent.icon;
                    const agentLogs = getAgentLogs(agent.id);
                    const successRate = agentLogs.length > 0
                        ? Math.round((agentLogs.filter(l => l.status === 'success').length / agentLogs.length) * 100)
                        : null;

                    return (
                        <button
                            key={agent.id}
                            onClick={() => openAgentDrawer(agent)}
                            className="p-5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-violet-500/50 hover:bg-violet-500/5 transition-all text-left group"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/30 flex items-center justify-center">
                                        <Icon className="w-6 h-6 text-violet-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-white font-medium">{agent.name}</h4>
                                            <div className={`w-2 h-2 rounded-full ${agentStatusColors[agent.status]}`} />
                                        </div>
                                        <p className="text-xs text-slate-400">{agent.expertise}</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-violet-400 transition-colors" />
                            </div>

                            <p className="text-sm text-slate-400 mb-4 line-clamp-2">{agent.description}</p>

                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-3">
                                    <span className="px-2 py-1 rounded bg-white/5 text-slate-300">
                                        {agent.provider}
                                    </span>
                                    <span className="text-slate-500 font-mono">
                                        {agent.model.split('-').slice(0, 2).join('-')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {successRate !== null && (
                                        <span className="text-green-400">{successRate}% success</span>
                                    )}
                                    <span className="text-slate-500">{agentLogs.length} runs</span>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Right Drawer */}
            {drawerOpen && selectedAgent && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-[fadeIn_0.2s_ease-out]"
                        onClick={closeDrawer}
                    />

                    {/* Drawer */}
                    <div className="fixed right-0 top-0 h-screen w-full max-w-md bg-[#0c0612] border-l border-white/10 z-50 overflow-y-auto animate-[slideInRight_0.3s_ease-out]"
                        style={{
                            animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}>
                        {/* Header */}
                        <div className="sticky top-0 bg-[#0c0612] border-b border-white/10 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/30 flex items-center justify-center">
                                    <selectedAgent.icon className="w-5 h-5 text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">{selectedAgent.name}</h2>
                                    <p className="text-xs text-slate-400">{selectedAgent.expertise}</p>
                                </div>
                            </div>
                            <button
                                onClick={closeDrawer}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Model Info */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <h3 className="text-sm font-medium text-slate-300 mb-3">Model Configuration</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-500">Provider</span>
                                        <p className="text-white font-medium">{selectedAgent.provider}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Model</span>
                                        <p className="text-white font-mono text-xs">{selectedAgent.model}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Triggers</span>
                                        <p className="text-slate-300">{selectedAgent.triggers.join(', ')}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Can Trigger</span>
                                        <p className="text-slate-300">
                                            {selectedAgent.canTrigger.length > 0
                                                ? selectedAgent.canTrigger.join(', ')
                                                : 'None (End of chain)'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Prompt Section */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                        <Code className="w-4 h-4" />
                                        System Prompt
                                    </h3>
                                    <button
                                        onClick={() => setShowPrompt(!showPrompt)}
                                        className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                                    >
                                        {showPrompt ? 'Hide' : 'View'} Prompt
                                    </button>
                                </div>

                                {showPrompt && (
                                    <div className="mt-3 p-4 rounded-lg bg-black/50 border border-white/5 overflow-x-auto">
                                        <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                                            {selectedAgent.prompt}
                                        </pre>
                                    </div>
                                )}

                                {!showPrompt && (
                                    <p className="text-xs text-slate-500">
                                        Click "View Prompt" to see the system instructions this agent uses.
                                        <br />
                                        <span className="text-slate-600">(Editing coming soon)</span>
                                    </p>
                                )}
                            </div>

                            {/* Recent Logs */}
                            <div>
                                <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Recent Executions
                                </h3>

                                {logs.filter(l => l.agent_name === selectedAgent.id).length === 0 ? (
                                    <div className="text-center py-8 text-slate-500">
                                        <Bot className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No executions yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {logs
                                            .filter(l => l.agent_name === selectedAgent.id)
                                            .slice(0, 10)
                                            .map((log) => (
                                                <div
                                                    key={log.id}
                                                    className={`p-3 rounded-lg border ${statusColors[log.status]}`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-2">
                                                            {log.status === 'success' && <Check className="w-3 h-3" />}
                                                            {log.status === 'error' && <AlertCircle className="w-3 h-3" />}
                                                            <span className="text-xs font-mono">{log.run_id.slice(0, 8)}</span>
                                                        </div>
                                                        <span className="text-xs opacity-70">{formatTime(log.started_at)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="opacity-70">{formatDuration(log.duration_ms)}</span>
                                                        {log.output_summary && (
                                                            <span className="truncate max-w-[200px] opacity-70">
                                                                {log.output_summary}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {log.error_message && (
                                                        <p className="text-xs mt-1 text-red-400 truncate">
                                                            ⚠️ {log.error_message}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
