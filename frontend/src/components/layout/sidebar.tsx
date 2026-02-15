"use client";

import { Home, Mail, DollarSign, Calendar, Bot } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/email", label: "Inbox", icon: Mail },
    { href: "/finance", label: "Finance", icon: DollarSign },
    { href: "/agents", label: "Agents", icon: Bot },
    { href: "/planner", label: "Planner", icon: Calendar },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <nav className="fixed left-0 top-0 h-screen w-16 bg-[#0a0510]/90 backdrop-blur-xl border-r border-white/5 flex flex-col items-center py-6 z-50">
            {/* Logo */}
            <div className="mb-8">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">E</span>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 flex flex-col gap-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={item.label}
                            className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                                isActive
                                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30"
                                    : "text-slate-500 hover:text-white hover:bg-white/10"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                        </Link>
                    );
                })}
            </div>

            {/* Status indicator */}
            <div className="mt-auto">
                <div className="w-2 h-2 rounded-full bg-green-500" title="Connected" />
            </div>
        </nav>
    );
}
