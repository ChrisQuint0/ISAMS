import React from "react";
import { ThesisArchivingHeader } from "../components/ThesisArchivingHeader";
import { History } from "lucide-react";

export default function AuditTrailPage() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-950">
            <ThesisArchivingHeader title="Audit Trail" />
            <main className="flex-1 px-8 py-10 lg:px-12 lg:py-12">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex items-end justify-between gap-6 pb-5 border-b border-slate-700/40">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Security & Monitoring</p>
                            <h1 className="text-4xl font-bold text-slate-50 tracking-tight leading-none text-blue-400">Audit Trail</h1>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 border border-slate-800 rounded-2xl border-dashed">
                        <div className="bg-slate-800/50 p-6 rounded-full mb-6">
                            <History className="h-12 w-12 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-100 mb-2">Audit Trail records will appear here</h2>
                        <p className="text-slate-400 max-w-md text-center">
                            This module is currently under development. Soon you'll be able to track all activities and changes made within the Thesis Archiving system.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
