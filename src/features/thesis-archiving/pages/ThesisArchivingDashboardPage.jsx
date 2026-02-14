import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";
import { ThesisArchivingHeader } from "../components/ThesisArchivingHeader";

export default function ThesisArchivingDashboardPage() {
    return (
        <div className="flex flex-col min-h-screen w-full bg-slate-950">
            <ThesisArchivingHeader title="Dashboard" />

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
