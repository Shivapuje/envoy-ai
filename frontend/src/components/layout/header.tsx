"use client";

import { Bell, User, Search } from "lucide-react";
import { useState } from "react";

export function Header() {
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update time every second
    useState(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    });

    return (
        <header className="h-12 bg-card border-b border-border flex items-center justify-between px-4">
            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search commands..."
                        className="w-full pl-10 pr-4 py-1.5 bg-muted border border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                </div>
            </div>

            {/* Status Bar Items - Mission Control Style */}
            <div className="flex items-center gap-4 ml-6">
                {/* System Status */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-green-500">●</span>
                    <span className="font-mono">System Online</span>
                </div>

                {/* Time Display */}
                <div className="text-xs text-muted-foreground font-mono">
                    {currentTime.toLocaleTimeString()}
                </div>

                {/* Notifications */}
                <button className="relative p-2 hover:bg-accent rounded-lg transition-colors">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
                </button>

                {/* User Profile */}
                <button className="flex items-center gap-2 p-2 hover:bg-accent rounded-lg transition-colors">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-foreground" />
                    </div>
                </button>
            </div>
        </header>
    );
}
