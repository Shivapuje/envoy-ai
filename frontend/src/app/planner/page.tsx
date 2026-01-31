import { GlassCard } from '@/components/ui/glass/GlassCard';
import { NeonButton } from '@/components/ui/glass/NeonButton';
import { Calendar, Plus } from 'lucide-react';

export default function PlannerPage() {
    return (
        <main className="p-8 space-y-6">
            <div className="border-b border-white/10 pb-6">
                <h1 className="text-3xl font-bold text-white mb-2">
                    Strategic Planner
                </h1>
                <p className="text-slate-400">
                    Long-term planning and goal tracking
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Goals & Objectives */}
                <GlassCard className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-white/80">
                            Active Goals
                        </h3>
                        <NeonButton variant="secondary" className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            New Goal
                        </NeonButton>
                    </div>
                    <div className="text-sm text-slate-500 text-center py-20">
                        No active goals
                    </div>
                </GlassCard>

                {/* Calendar View */}
                <GlassCard className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-400" />
                        <h3 className="text-lg font-medium text-white/80">
                            Upcoming Milestones
                        </h3>
                    </div>
                    <div className="text-sm text-slate-500 text-center py-20">
                        No milestones scheduled
                    </div>
                </GlassCard>
            </div>
        </main>
    );
}
