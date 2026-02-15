'use client';

import { useState } from 'react';
import { 
  Home, Mail, DollarSign, Calendar, Settings, ChevronDown, ChevronRight,
  Search, Bell, User, Plus, ArrowRight, Check, X, AlertCircle, Info,
  TrendingUp, Clock, FileText, Folder
} from 'lucide-react';

// Design System Colors
const colors = {
  bgPrimary: '#F5F6F8',
  sidebarDark: '#2D3142',
  sidebarLight: '#D4D7DD',
  cardBg: '#FFFFFF',
  borderLight: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  success: '#86EFAC',
  successDark: '#22C55E',
  primary: '#3B82F6',
  warning: '#FCD34D',
  error: '#EF4444',
};

export default function DesignTestPage() {
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [expandedFolder, setExpandedFolder] = useState(true);

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: colors.bgPrimary }}>
      
      {/* Two-Tier Sidebar */}
      <aside className="flex h-screen fixed left-0 top-0">
        {/* Icon Strip (Dark) */}
        <div 
          className="w-12 h-full flex flex-col items-center py-4"
          style={{ backgroundColor: colors.sidebarDark }}
        >
          {/* Logo */}
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center mb-6">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          
          {/* Nav Icons */}
          <div className="flex-1 flex flex-col gap-2">
            {[Home, Mail, DollarSign, Calendar].map((Icon, i) => (
              <button 
                key={i}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <Icon className="w-5 h-5" />
              </button>
            ))}
          </div>
          
          {/* Settings at bottom */}
          <button className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <Settings className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content Area (Light) */}
        <div 
          className="w-[280px] h-full py-6 px-4 border-r"
          style={{ backgroundColor: '#FAFBFC', borderColor: colors.borderLight }}
        >
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search..."
              className="w-full h-10 pl-10 pr-4 rounded-lg text-sm"
              style={{ 
                backgroundColor: '#F3F4F6', 
                border: `1px solid ${colors.borderLight}`,
                color: colors.textPrimary
              }}
            />
          </div>
          
          {/* Section Header */}
          <p className="text-[11px] uppercase tracking-wider font-medium mb-3" style={{ color: colors.textTertiary }}>
            Main Menu
          </p>
          
          {/* Nav Items */}
          <nav className="space-y-1 mb-6">
            {[
              { icon: Home, label: 'Dashboard', active: true },
              { icon: Mail, label: 'Inbox', badge: 12 },
              { icon: DollarSign, label: 'Finance' },
              { icon: Calendar, label: 'Calendar' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => setActiveNav(item.label)}
                className={`w-full h-10 px-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-all ${
                  activeNav === item.label 
                    ? 'bg-white shadow-sm' 
                    : 'hover:bg-white/50'
                }`}
                style={{ color: activeNav === item.label ? colors.textPrimary : colors.textSecondary }}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="h-5 px-2 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
          
          {/* Separator */}
          <div className="h-px my-6" style={{ backgroundColor: colors.borderLight }} />
          
          {/* Section Header */}
          <p className="text-[11px] uppercase tracking-wider font-medium mb-3" style={{ color: colors.textTertiary }}>
            Documents
          </p>
          
          {/* Folder/Nested Items */}
          <div className="space-y-1">
            <button 
              onClick={() => setExpandedFolder(!expandedFolder)}
              className="w-full h-10 px-3 rounded-lg flex items-center gap-3 text-sm font-medium hover:bg-white/50 transition-all"
              style={{ color: colors.textSecondary }}
            >
              {expandedFolder ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <Folder className="w-4 h-4" />
              <span className="flex-1 text-left">Projects</span>
            </button>
            
            {expandedFolder && (
              <div className="pl-5 space-y-1">
                {['Envoy AI', 'Research', 'Archive'].map((folder) => (
                  <button
                    key={folder}
                    className="w-full h-9 px-3 rounded-lg flex items-center gap-3 text-sm hover:bg-white/50 transition-all"
                    style={{ color: colors.textSecondary }}
                  >
                    <FileText className="w-4 h-4" />
                    <span>{folder}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 ml-[328px] p-8">
        <div className="max-w-[1400px] mx-auto">
          
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-semibold" style={{ color: colors.textPrimary }}>
                Design System Test
              </h1>
              <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                Preview the new light theme components
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white transition-all" style={{ backgroundColor: '#F9FAFB' }}>
                <Bell className="w-5 h-5" style={{ color: colors.textSecondary }} />
              </button>
              <button className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white transition-all" style={{ backgroundColor: '#F9FAFB' }}>
                <User className="w-5 h-5" style={{ color: colors.textSecondary }} />
              </button>
            </div>
          </div>
          
          {/* Metric Cards */}
          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4" style={{ color: colors.textPrimary }}>Metric Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Total Revenue', value: '₹2,45,000', trend: '+12.5%', trendUp: true },
                { label: 'Pending Emails', value: '24', trend: '-8', trendUp: false },
                { label: 'Transactions', value: '156', trend: '+23', trendUp: true },
              ].map((metric) => (
                <div 
                  key={metric.label}
                  className="p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                  style={{ backgroundColor: colors.cardBg, border: `1px solid #F3F4F6` }}
                >
                  <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>{metric.label}</p>
                  <p className="text-5xl font-semibold mb-2" style={{ color: colors.textPrimary }}>{metric.value}</p>
                  <div className="flex items-center gap-2">
                    <span 
                      className="text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1"
                      style={{ 
                        backgroundColor: metric.trendUp ? 'rgba(134, 239, 172, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                        color: metric.trendUp ? colors.successDark : colors.error
                      }}
                    >
                      <TrendingUp className={`w-3 h-3 ${!metric.trendUp && 'rotate-180'}`} />
                      {metric.trend}
                    </span>
                    <span className="text-xs" style={{ color: colors.textTertiary }}>vs last month</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
          
          {/* Buttons */}
          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4" style={{ color: colors.textPrimary }}>Buttons</h2>
            <div 
              className="p-6 rounded-xl"
              style={{ backgroundColor: colors.cardBg, border: `1px solid #F3F4F6` }}
            >
              <div className="flex flex-wrap items-center gap-4">
                {/* Primary */}
                <button 
                  className="h-10 px-5 rounded-lg font-medium text-sm text-white hover:opacity-90 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                  style={{ backgroundColor: colors.primary }}
                >
                  Primary Button
                </button>
                
                {/* Secondary */}
                <button 
                  className="h-10 px-5 rounded-lg font-medium text-sm hover:bg-gray-50 transition-all"
                  style={{ border: `1px solid ${colors.borderLight}`, color: colors.textPrimary }}
                >
                  Secondary Button
                </button>
                
                {/* With Icon */}
                <button 
                  className="h-10 px-5 rounded-lg font-medium text-sm text-white hover:opacity-90 hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center gap-2"
                  style={{ backgroundColor: colors.successDark }}
                >
                  <Plus className="w-4 h-4" />
                  Add New
                </button>
                
                {/* Icon Only */}
                <button 
                  className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-all"
                  style={{ border: `1px solid ${colors.borderLight}` }}
                >
                  <Settings className="w-5 h-5" style={{ color: colors.textSecondary }} />
                </button>
                
                {/* Danger */}
                <button 
                  className="h-10 px-5 rounded-lg font-medium text-sm text-white hover:opacity-90 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                  style={{ backgroundColor: colors.error }}
                >
                  Delete
                </button>
              </div>
            </div>
          </section>
          
          {/* Badges & Status */}
          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4" style={{ color: colors.textPrimary }}>Badges & Status</h2>
            <div 
              className="p-6 rounded-xl"
              style={{ backgroundColor: colors.cardBg, border: `1px solid #F3F4F6` }}
            >
              <div className="flex flex-wrap items-center gap-4">
                {/* Badges */}
                <span className="h-6 px-3 rounded-full text-xs font-medium flex items-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: colors.primary }}>
                  Primary
                </span>
                <span className="h-6 px-3 rounded-full text-xs font-medium flex items-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: colors.successDark }}>
                  Success
                </span>
                <span className="h-6 px-3 rounded-full text-xs font-medium flex items-center" style={{ backgroundColor: 'rgba(252, 211, 77, 0.2)', color: '#B45309' }}>
                  Warning
                </span>
                <span className="h-6 px-3 rounded-full text-xs font-medium flex items-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: colors.error }}>
                  Error
                </span>
                
                {/* Counter */}
                <span className="w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center text-white" style={{ backgroundColor: colors.textSecondary }}>
                  5
                </span>
                <span className="w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center text-white" style={{ backgroundColor: colors.primary }}>
                  12
                </span>
              </div>
            </div>
          </section>
          
          {/* Inputs */}
          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4" style={{ color: colors.textPrimary }}>Input Fields</h2>
            <div 
              className="p-6 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6"
              style={{ backgroundColor: colors.cardBg, border: `1px solid #F3F4F6` }}
            >
              {/* Standard Input */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>Standard Input</label>
                <input 
                  type="text"
                  placeholder="Enter text..."
                  className="w-full h-10 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  style={{ border: `1px solid ${colors.borderLight}`, color: colors.textPrimary }}
                />
              </div>
              
              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>Search Input</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.textTertiary }} />
                  <input 
                    type="text"
                    placeholder="Search..."
                    className="w-full h-10 pl-10 pr-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    style={{ backgroundColor: '#F9FAFB', border: `1px solid ${colors.borderLight}`, color: colors.textPrimary }}
                  />
                </div>
              </div>
              
              {/* Input with Icon */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>With Icon</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.textTertiary }} />
                  <input 
                    type="email"
                    placeholder="email@example.com"
                    className="w-full h-10 pl-10 pr-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    style={{ border: `1px solid ${colors.borderLight}`, color: colors.textPrimary }}
                  />
                </div>
              </div>
              
              {/* Disabled Input */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>Disabled</label>
                <input 
                  type="text"
                  placeholder="Disabled input"
                  disabled
                  className="w-full h-10 px-3 rounded-lg text-sm cursor-not-allowed"
                  style={{ backgroundColor: '#F3F4F6', border: `1px solid ${colors.borderLight}`, color: colors.textTertiary }}
                />
              </div>
            </div>
          </section>
          
          {/* List / Table */}
          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4" style={{ color: colors.textPrimary }}>Table</h2>
            <div 
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: colors.cardBg, border: `1px solid #F3F4F6` }}
            >
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB' }}>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.textTertiary }}>Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.textTertiary }}>Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.textTertiary }}>Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: colors.textTertiary }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { date: 'Feb 8, 2026', desc: 'Amazon Purchase', status: 'Completed', amount: '-₹1,299', type: 'debit' },
                    { date: 'Feb 7, 2026', desc: 'Salary Credit', status: 'Completed', amount: '+₹85,000', type: 'credit' },
                    { date: 'Feb 6, 2026', desc: 'Utility Bill', status: 'Pending', amount: '-₹2,450', type: 'debit' },
                  ].map((row, i) => (
                    <tr 
                      key={i}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      style={{ borderTop: `1px solid #F3F4F6` }}
                    >
                      <td className="px-4 py-4 text-sm" style={{ color: colors.textSecondary }}>{row.date}</td>
                      <td className="px-4 py-4 text-sm font-medium" style={{ color: colors.textPrimary }}>{row.desc}</td>
                      <td className="px-4 py-4">
                        <span 
                          className="text-xs font-medium px-2 py-1 rounded-full"
                          style={{ 
                            backgroundColor: row.status === 'Completed' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(252, 211, 77, 0.2)',
                            color: row.status === 'Completed' ? colors.successDark : '#B45309'
                          }}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td 
                        className="px-4 py-4 text-sm font-medium text-right"
                        style={{ color: row.type === 'credit' ? colors.successDark : colors.error }}
                      >
                        {row.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          
          {/* Alerts */}
          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4" style={{ color: colors.textPrimary }}>Alerts / Toasts</h2>
            <div className="space-y-4">
              {[
                { type: 'info', icon: Info, message: 'This is an informational message.', bg: 'rgba(59, 130, 246, 0.1)', color: colors.primary },
                { type: 'success', icon: Check, message: 'Operation completed successfully!', bg: 'rgba(34, 197, 94, 0.1)', color: colors.successDark },
                { type: 'warning', icon: AlertCircle, message: 'Please review before proceeding.', bg: 'rgba(252, 211, 77, 0.2)', color: '#B45309' },
                { type: 'error', icon: X, message: 'An error occurred. Please try again.', bg: 'rgba(239, 68, 68, 0.1)', color: colors.error },
              ].map((alert) => (
                <div 
                  key={alert.type}
                  className="p-4 rounded-xl flex items-center gap-3"
                  style={{ backgroundColor: alert.bg }}
                >
                  <alert.icon className="w-5 h-5" style={{ color: alert.color }} />
                  <span className="text-sm font-medium" style={{ color: alert.color }}>{alert.message}</span>
                </div>
              ))}
            </div>
          </section>
          
          {/* Typography */}
          <section className="mb-8">
            <h2 className="text-xl font-medium mb-4" style={{ color: colors.textPrimary }}>Typography</h2>
            <div 
              className="p-6 rounded-xl space-y-4"
              style={{ backgroundColor: colors.cardBg, border: `1px solid #F3F4F6` }}
            >
              <p className="text-5xl font-semibold" style={{ color: colors.textPrimary }}>Display (48px)</p>
              <p className="text-4xl font-semibold" style={{ color: colors.textPrimary }}>H1 Heading (36px)</p>
              <p className="text-3xl font-semibold" style={{ color: colors.textPrimary }}>H2 Heading (30px)</p>
              <p className="text-2xl font-medium" style={{ color: colors.textPrimary }}>H3 Heading (24px)</p>
              <p className="text-xl font-medium" style={{ color: colors.textPrimary }}>H4 Heading (20px)</p>
              <p className="text-base" style={{ color: colors.textPrimary }}>Body Large (16px) - Primary text content goes here.</p>
              <p className="text-sm" style={{ color: colors.textSecondary }}>Body (14px) - Secondary text content with medium emphasis.</p>
              <p className="text-xs" style={{ color: colors.textTertiary }}>Caption (12px) - Tertiary text with lowest emphasis.</p>
            </div>
          </section>
          
        </div>
      </main>
    </div>
  );
}
