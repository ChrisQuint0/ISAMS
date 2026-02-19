import React from "react";
import { ThesisArchivingHeader } from "../components/ThesisArchivingHeader";

export default function ReportsAnalyticsPage() {
    return (
        <div className="flex flex-col min-h-screen w-full bg-slate-950">
            <ThesisArchivingHeader title="Reports and Analytics" />

            {/* Main Content */}
            <main className="flex-1 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-8 text-center">
                        <h2 className="text-2xl font-semibold text-slate-100 mb-3">
                            Insights - Reports and Analytics
                        </h2>
                        <p className="text-slate-400">
                            This section will provide detailed reports and analytics for the archiving module.
                        </p>
                        <p className="text-slate-500 text-sm mt-2">Coming soon...</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
