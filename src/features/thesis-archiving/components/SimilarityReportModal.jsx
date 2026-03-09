import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SimilarityScoreBadge } from "./SimilarityScoreBadge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Download, ExternalLink, History, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function SimilarityReportModal({ open, onOpenChange, submission }) {
    if (!submission) return null;

    // Mock matching records for UI demonstration
    const topMatches = [
        {
            title: "Smart Traffic Control System using ML",
            authors: ["Alice Green", "Bob White"],
            year: "2023",
            score: 42,
            matchType: "Abstract & Keywords",
        },
        {
            title: "IoT Based Urban Traffic Management",
            authors: ["Mark Spencer"],
            year: "2022",
            score: 28,
            matchType: "Title & Keywords",
        },
        {
            title: "Deep Learning for Traffic Flow Optimization",
            authors: ["Dr. Sarah Connor"],
            year: "2024",
            score: 15,
            matchType: "Abstract",
        }
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl bg-white border-gray-200 text-gray-900">
                <DialogHeader>
                    <div className="flex items-center justify-between mb-2">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
                            <FileText className="h-5 w-5 text-green-700" />
                            Similarity Report
                        </DialogTitle>
                        <SimilarityScoreBadge score={submission.similarityScore || 32} />
                    </div>
                    <DialogDescription className="text-gray-500">
                        Analysis details for "{submission.title}"
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="md:col-span-2 space-y-6">
                        <section>
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                                Field-Level Breakdown
                            </h3>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { field: "Title", score: 15, status: "Low" },
                                    { field: "Abstract", score: 45, status: "Moderate" },
                                    { field: "Keywords", score: 22, status: "Low" },
                                ].map((item) => (
                                    <div key={item.field} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                                        <span className="text-sm font-medium text-gray-700">{item.field}</span>
                                        <div className="flex items-center gap-4">
                                            <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all",
                                                        item.score > 40 ? "bg-amber-500" : "bg-green-600"
                                                    )}
                                                    style={{ width: `${item.score}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-mono text-gray-500">{item.score}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
                                Top Matching Records
                            </h3>
                            <div className="space-y-3">
                                {topMatches.map((match, i) => (
                                    <div key={i} className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-green-400/40 hover:bg-green-50/30 transition-colors group">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-semibold text-gray-800 group-hover:text-green-700 transition-colors">
                                                    {match.title}
                                                </h4>
                                                <p className="text-xs text-gray-500">
                                                    {match.authors.join(", ")} • {match.year}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="bg-white border-gray-300 text-gray-700">
                                                {match.score}% match
                                            </Badge>
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Matched in:</span>
                                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase font-bold">
                                                {match.matchType}
                                            </span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto text-gray-400 hover:text-green-700">
                                                <ExternalLink className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                            <h4 className="text-xs font-bold text-green-700 uppercase mb-2">Analysis Info</h4>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between text-gray-500">
                                    <span>Method</span>
                                    <span className="text-gray-800">NLP Transformer</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>Repository Size</span>
                                    <span className="text-gray-800">1,248 Records</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>Analysis Time</span>
                                    <span className="text-gray-800">1.2s</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>Last Updated</span>
                                    <span className="text-gray-800">Feb 28, 2025</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                            <h4 className="text-xs font-bold text-amber-600 uppercase mb-2">System Alert</h4>
                            <p className="text-[11px] text-gray-600 leading-tight flex gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                                Similarity exceeds the 20% threshold. Coordination review recommended.
                            </p>
                        </div>

                        <Button
                            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold"
                            onClick={() => console.log("Exporting PDF...")}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export as PDF
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-400"
                        >
                            <History className="h-4 w-4 mr-2" />
                            View History
                        </Button>
                    </div>
                </div>

                <DialogFooter className="mt-6 border-t border-gray-200 pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-300 text-gray-600 hover:bg-gray-50">
                        Close Report
                    </Button>
                    <Button className="bg-green-700 hover:bg-green-800 text-white border-none">
                        Mark as Reviewed
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Utility function duplicated for standalone file component
function cn(...inputs) {
    return inputs.filter(Boolean).join(" ");
}