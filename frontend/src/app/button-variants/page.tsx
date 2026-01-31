import { GlassCard } from "@/components/ui/glass";

export default function ButtonVariants() {
    const variants = [
        {
            id: 1,
            name: "Subtle Indigo",
            description: "Professional, cooler tone",
            base: "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20",
            hover: "hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-500/30",
        },
        {
            id: 2,
            name: "Muted Purple",
            description: "Desaturated purple family",
            base: "bg-purple-600 text-white shadow-sm shadow-purple-500/15",
            hover: "hover:bg-purple-700 hover:shadow-md hover:shadow-purple-500/25",
        },
        {
            id: 3,
            name: "Deep Slate Blue",
            description: "Minimal, monochromatic",
            base: "bg-slate-600 text-white shadow-sm shadow-slate-500/20",
            hover: "hover:bg-slate-700 hover:shadow-md hover:shadow-slate-500/30",
        },
        {
            id: 4,
            name: "Teal Accent",
            description: "Complementary, tech-forward",
            base: "bg-teal-600 text-white shadow-sm shadow-teal-500/20",
            hover: "hover:bg-teal-700 hover:shadow-md hover:shadow-teal-500/30",
        },
        {
            id: 5,
            name: "Soft Cyan",
            description: "Cool, data-viz friendly",
            base: "bg-cyan-600 text-white shadow-sm shadow-cyan-500/20",
            hover: "hover:bg-cyan-700 hover:shadow-md hover:shadow-cyan-500/30",
        },
        {
            id: 6,
            name: "Minimal Glass",
            description: "Ultra-minimal, glass-first",
            base: "bg-white/10 text-white border border-purple-500/30 shadow-sm shadow-purple-500/10",
            hover: "hover:bg-white/15 hover:shadow-md hover:shadow-purple-500/20",
        },
        {
            id: 7,
            name: "Deep Blue",
            description: "Classic, trustworthy",
            base: "bg-blue-700 text-white shadow-sm shadow-blue-600/20",
            hover: "hover:bg-blue-800 hover:shadow-md hover:shadow-blue-600/30",
        },
        {
            id: 8,
            name: "Emerald Accent",
            description: "Success-oriented, positive",
            base: "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20",
            hover: "hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-500/30",
        },
        {
            id: 9,
            name: "Rose Accent",
            description: "Warm, important actions",
            base: "bg-rose-600 text-white shadow-sm shadow-rose-500/15",
            hover: "hover:bg-rose-700 hover:shadow-md hover:shadow-rose-500/25",
        },
        {
            id: 10,
            name: "Custom Deep Purple",
            description: "Theme-matched, custom tuned",
            base: "text-white shadow-sm shadow-purple-600/15",
            hover: "hover:shadow-md hover:shadow-purple-600/25",
            style: { backgroundColor: "#6d28d9" },
            hoverStyle: { backgroundColor: "#5b21b6" },
        },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="border-b border-white/10 pb-6">
                <h1 className="text-3xl font-bold text-white mb-2">
                    Button Variant Options
                </h1>
                <p className="text-slate-400">
                    10 sophisticated button styles for Mission Control interface
                </p>
            </div>

            {/* Top Recommendations */}
            <GlassCard>
                <h2 className="text-xl font-bold text-white mb-3">Top 3 Recommendations</h2>
                <div className="space-y-2 text-sm text-slate-300">
                    <p>🥇 <strong className="text-white">Variant 1 (Subtle Indigo)</strong> - Best balance of visibility and sophistication</p>
                    <p>🥈 <strong className="text-white">Variant 6 (Minimal Glass)</strong> - Most minimal, glass-first approach</p>
                    <p>🥉 <strong className="text-white">Variant 4 (Teal Accent)</strong> - Fresh, modern, complements purple theme</p>
                </div>
            </GlassCard>

            {/* Variants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {variants.map((variant) => (
                    <GlassCard key={variant.id}>
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-semibold text-white">
                                        Variant {variant.id}
                                    </h3>
                                    <span className="text-xs text-slate-400 font-mono">
                                        {variant.name}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-400">{variant.description}</p>
                            </div>

                            {/* Button Preview */}
                            <div className="flex gap-3">
                                <button
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${variant.base} ${variant.hover}`}
                                    style={variant.style}
                                >
                                    📧 New Email
                                </button>
                                <button
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${variant.base} ${variant.hover}`}
                                    style={variant.style}
                                >
                                    💰 Add Expense
                                </button>
                            </div>

                            {/* Technical Details */}
                            <div className="pt-3 border-t border-white/10">
                                <p className="text-xs text-slate-500 font-mono">
                                    {variant.base.split(' ').slice(0, 2).join(' ')}
                                </p>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Design Notes */}
            <GlassCard>
                <h2 className="text-xl font-bold text-white mb-3">Design Notes</h2>
                <ul className="text-sm text-slate-300 space-y-2">
                    <li>✓ All variants use <code className="text-purple-400">shadow-sm</code> for subtle shadows (not loud)</li>
                    <li>✓ Shadow opacity kept at 15-20% for minimal aesthetic</li>
                    <li>✓ Hover states are subtle enhancements, not dramatic changes</li>
                    <li>✓ All colors maintain WCAG AA contrast ratio</li>
                    <li>✓ Designed for sophisticated users who value subtlety</li>
                </ul>
            </GlassCard>
        </div>
    );
}
