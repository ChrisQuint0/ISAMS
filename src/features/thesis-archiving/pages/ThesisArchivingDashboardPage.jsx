import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Settings, LayoutDashboard } from "lucide-react";

export default function ThesisArchivingDashboardPage() {
    return (
        <div className="flex flex-col min-h-screen w-full bg-slate-950">
            {/* Header */}
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 px-4">
                <div className="flex items-center gap-2 flex-1">
                    <SidebarTrigger className="text-slate-400 hover:text-slate-300 hover:bg-slate-800" />
                    <div className="h-6 w-px bg-slate-800" />
                    <h1 className="text-xl font-semibold text-slate-100">Dashboard</h1>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                >
                    <Settings className="h-5 w-5" />
                </Button>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-8 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="p-4 bg-blue-600/10 rounded-full">
                                <LayoutDashboard className="h-12 w-12 text-blue-400" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-semibold text-slate-100 mb-3">
                            Thesis Archiving Dashboard
                        </h2>
                        <p className="text-slate-400">
                            Overview and statistics for thesis archiving will be displayed here.
                        </p>
                        <p className="text-slate-500 text-sm mt-2">Coming soon...</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
