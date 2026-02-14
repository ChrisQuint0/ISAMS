import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThesisArchivingHeader } from "../components/ThesisArchivingHeader";

export default function SimilarityCheckPage() {
    return (
        <div className="flex flex-col min-h-screen w-full bg-slate-950">
            <ThesisArchivingHeader title="Similarity Check" />

            {/* Main Content */}
            <main className="flex-1 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-8 text-center">
                        <h2 className="text-2xl font-semibold text-slate-100 mb-3">
                            Similarity Check
                        </h2>
                        <p className="text-slate-400">
                            This feature will allow you to check thesis documents for plagiarism and similarity.
                        </p>
                        <p className="text-slate-500 text-sm mt-2">Coming soon...</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
