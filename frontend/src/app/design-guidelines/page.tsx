import { GlassCard, NeonButton, GlassInput } from "@/components/ui/glass";

export default function DesignGuidelines() {
    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="border-b border-white/10 pb-6">
                <h1 className="text-3xl font-bold text-white mb-2">
                    Envoy AI Design Guidelines
                </h1>
                <p className="text-slate-400">
                    Component library and design system reference for contributors
                </p>
            </div>

            {/* Design Philosophy */}
            <GlassCard>
                <h2 className="text-xl font-bold text-white mb-4">Design Philosophy</h2>
                <div className="space-y-3 text-slate-300">
                    <p>
                        <strong className="text-white">Aesthetic:</strong> "Nebula Glass" - A combination of deep, matte void spaces and premium, translucent glass surfaces.
                    </p>
                    <p>
                        <strong className="text-white">Inspiration:</strong> Apple visionOS (depth, blur) mixed with a Cyberpunk/Deep Purple palette.
                    </p>
                    <p>
                        <strong className="text-white">Feel:</strong> Futuristic, calm, fluid.
                    </p>
                </div>
            </GlassCard>

            {/* UX Philosophy */}
            <GlassCard>
                <h2 className="text-xl font-bold text-white mb-4">UX Philosophy</h2>

                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">For Sophisticated Users</h3>
                        <p className="text-slate-300 text-sm mb-2">
                            This application is designed for power users who value efficiency over hand-holding.
                        </p>
                        <ul className="text-slate-400 text-sm space-y-1 list-disc list-inside">
                            <li>Prioritize information density over large, attention-grabbing elements</li>
                            <li>Use subtle visual cues rather than loud call-to-actions</li>
                            <li>Assume users understand the interface quickly</li>
                            <li>Minimize unnecessary animations and transitions</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Information Hierarchy</h3>
                        <ul className="text-slate-400 text-sm space-y-1 list-disc list-inside">
                            <li><strong className="text-slate-300">Primary:</strong> Critical status, real-time data, system health</li>
                            <li><strong className="text-slate-300">Secondary:</strong> Recent activity, contextual information</li>
                            <li><strong className="text-slate-300">Tertiary:</strong> Quick actions, navigation, settings</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Component Placement</h3>
                        <ul className="text-slate-400 text-sm space-y-1 list-disc list-inside">
                            <li><strong className="text-slate-300">Top-left to bottom-right:</strong> Follow natural reading flow</li>
                            <li><strong className="text-slate-300">Above the fold:</strong> Most critical information and status indicators</li>
                            <li><strong className="text-slate-300">Grouped by context:</strong> Related information stays together</li>
                            <li><strong className="text-slate-300">Actions near data:</strong> Place controls close to the data they affect</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Data Density</h3>
                        <p className="text-slate-300 text-sm mb-2">
                            Mission Control aesthetic means maximizing information per screen real estate:
                        </p>
                        <ul className="text-slate-400 text-sm space-y-1 list-disc list-inside">
                            <li>Compact spacing (use p-3, p-4 instead of p-6, p-8)</li>
                            <li>Smaller text sizes (text-sm, text-xs for secondary info)</li>
                            <li>Grid layouts for parallel information</li>
                            <li>Monospace fonts for numerical data</li>
                        </ul>
                    </div>
                </div>
            </GlassCard>

            {/* Color Palette */}
            <GlassCard>
                <h2 className="text-xl font-bold text-white mb-4">Color Palette</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-sm font-bold text-neon-purple mb-3">Background</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-nebula-bg border border-white/10" />
                                <div>
                                    <p className="text-sm font-mono text-white">nebula-bg</p>
                                    <p className="text-xs text-slate-400">#0f0716</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-nebula-sidebar border border-white/10" />
                                <div>
                                    <p className="text-sm font-mono text-white">nebula-sidebar</p>
                                    <p className="text-xs text-slate-400">#150a20</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-neon-purple mb-3">Accents</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-neon-purple border border-white/10" />
                                <div>
                                    <p className="text-sm font-mono text-white">neon-purple</p>
                                    <p className="text-xs text-slate-400">#8b5cf6</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-neon-purple-hover border border-white/10" />
                                <div>
                                    <p className="text-sm font-mono text-white">neon-purple-hover</p>
                                    <p className="text-xs text-slate-400">#7c3aed</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Components */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Components</h2>

                {/* GlassCard */}
                <GlassCard>
                    <h3 className="text-lg font-bold text-white mb-3">GlassCard</h3>
                    <p className="text-slate-300 text-sm mb-4">
                        A premium glass container with rounded-3xl borders, backdrop blur, and optional hover glow.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-slate-400 mb-2">Example:</p>
                            <GlassCard className="max-w-sm">
                                <p className="text-white text-sm">This is a GlassCard component</p>
                            </GlassCard>
                        </div>

                        <div>
                            <p className="text-xs text-slate-400 mb-2">Usage:</p>
                            <pre className="bg-black/30 p-3 rounded-xl text-xs text-slate-300 overflow-x-auto">
                                {`import { GlassCard } from "@/components/ui/glass";

<GlassCard>
  <h3>Card Title</h3>
  <p>Card content...</p>
</GlassCard>`}
                            </pre>
                        </div>

                        <div>
                            <p className="text-xs text-slate-400 mb-2">Props:</p>
                            <ul className="text-xs text-slate-300 space-y-1">
                                <li>• <code className="text-neon-purple">hover?</code>: boolean (default: true)</li>
                                <li>• <code className="text-neon-purple">className?</code>: string</li>
                                <li>• All standard div HTML attributes</li>
                            </ul>
                        </div>
                    </div>
                </GlassCard>

                {/* NeonButton */}
                <GlassCard>
                    <h3 className="text-lg font-bold text-white mb-3">NeonButton</h3>
                    <p className="text-slate-300 text-sm mb-4">
                        A compact button with primary/secondary variants. Sized for sophisticated users (px-4 py-2).
                    </p>

                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-slate-400 mb-2">Examples:</p>
                            <div className="flex gap-3">
                                <NeonButton variant="primary">Primary</NeonButton>
                                <NeonButton variant="secondary">Secondary</NeonButton>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-slate-400 mb-2">Usage:</p>
                            <pre className="bg-black/30 p-3 rounded-xl text-xs text-slate-300 overflow-x-auto">
                                {`import { NeonButton } from "@/components/ui/glass";

<NeonButton variant="primary" onClick={handleClick}>
  Save Changes
</NeonButton>

<NeonButton variant="secondary">
  Cancel
</NeonButton>`}
                            </pre>
                        </div>

                        <div>
                            <p className="text-xs text-slate-400 mb-2">Props:</p>
                            <ul className="text-xs text-slate-300 space-y-1">
                                <li>• <code className="text-neon-purple">variant?</code>: "primary" | "secondary" (default: "primary")</li>
                                <li>• <code className="text-neon-purple">className?</code>: string</li>
                                <li>• <code className="text-neon-purple">disabled?</code>: boolean</li>
                                <li>• All standard button HTML attributes</li>
                            </ul>
                        </div>
                    </div>
                </GlassCard>

                {/* GlassInput */}
                <GlassCard>
                    <h3 className="text-lg font-bold text-white mb-3">GlassInput</h3>
                    <p className="text-slate-300 text-sm mb-4">
                        A transparent glass input with purple glow on focus state.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-slate-400 mb-2">Example:</p>
                            <GlassInput placeholder="Enter text..." className="max-w-sm" />
                        </div>

                        <div>
                            <p className="text-xs text-slate-400 mb-2">Usage:</p>
                            <pre className="bg-black/30 p-3 rounded-xl text-xs text-slate-300 overflow-x-auto">
                                {`import { GlassInput } from "@/components/ui/glass";

<GlassInput 
  placeholder="Enter your name"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>

<GlassInput 
  type="email"
  placeholder="you@example.com"
/>`}
                            </pre>
                        </div>

                        <div>
                            <p className="text-xs text-slate-400 mb-2">Props:</p>
                            <ul className="text-xs text-slate-300 space-y-1">
                                <li>• <code className="text-neon-purple">type?</code>: string (default: "text")</li>
                                <li>• <code className="text-neon-purple">className?</code>: string</li>
                                <li>• <code className="text-neon-purple">disabled?</code>: boolean</li>
                                <li>• All standard input HTML attributes</li>
                                <li>• Supports ref forwarding</li>
                            </ul>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Design Rules */}
            <GlassCard>
                <h2 className="text-xl font-bold text-white mb-4">Design Rules</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-sm font-bold text-neon-purple mb-3">Shapes & Borders</h3>
                        <ul className="text-sm text-slate-300 space-y-2">
                            <li>✓ No sharp corners</li>
                            <li>✓ Cards/Containers: <code className="text-white">rounded-3xl</code> (24px)</li>
                            <li>✓ Buttons/Inputs: <code className="text-white">rounded-xl</code> (12px)</li>
                            <li>✓ Use subtle borders: <code className="text-white">border-white/10</code></li>
                            <li>✗ Never use solid, thick borders</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-neon-purple mb-3">Glass Effects</h3>
                        <ul className="text-sm text-slate-300 space-y-2">
                            <li>✓ Base: <code className="text-white">bg-white/5</code></li>
                            <li>✓ Hover: <code className="text-white">bg-white/10</code></li>
                            <li>✓ Blur: <code className="text-white">backdrop-blur-xl</code></li>
                            <li>✓ Transitions: <code className="text-white">duration-200</code> to <code className="text-white">duration-300</code></li>
                            <li>✓ Glow: <code className="text-white">shadow-purple-500/10</code></li>
                        </ul>
                    </div>
                </div>
            </GlassCard>

            {/* Typography */}
            <GlassCard>
                <h2 className="text-xl font-bold text-white mb-4">Typography</h2>
                <div className="space-y-3">
                    <div>
                        <p className="text-xs text-slate-400 mb-1">Primary Text</p>
                        <p className="text-white">Use <code className="text-neon-purple">text-white</code> for headings and important content</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 mb-1">Secondary Text</p>
                        <p className="text-slate-200">Use <code className="text-neon-purple">text-slate-200</code> for body text (softer contrast)</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 mb-1">Muted Text</p>
                        <p className="text-slate-400">Use <code className="text-neon-purple">text-slate-400</code> for labels and hints</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 mb-1">Font Family</p>
                        <p className="text-slate-200">Inter (configured globally in layout.tsx)</p>
                    </div>
                </div>
            </GlassCard>

            {/* Footer */}
            <div className="text-center text-slate-400 text-sm py-8">
                <p>For more details, see <code className="text-neon-purple">DESIGN_SYSTEM.md</code> and <code className="text-neon-purple">PROJECT_CONTEXT.md</code></p>
            </div>
        </div>
    );
}
