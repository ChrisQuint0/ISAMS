import React, { useState } from "react";
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
import {
    FileText, Download, ExternalLink, History, AlertTriangle,
    ShieldCheck, AlertCircle, CheckCircle2, Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SimilarityReportModal({
    open,
    onOpenChange,
    // Legacy prop for reports page compatibility
    submission,
    // New real-data props
    scanResult,
    fieldScores = [],
    topMatches = [],
    analyzedFileName,
    threshold = 20,
    onMarkAsReviewed,
    onExportPDF,
}) {
    const [isExporting, setIsExporting] = useState(false);
    const [exportDone, setExportDone] = useState(false);

    // Support both legacy submission prop and new scanResult prop
    const score = scanResult?.overall_score ?? submission?.similarityScore ?? 32;
    const intStatus = scanResult?.integrity_status ?? "safe";
    const intLabel = scanResult?.integrity_label ?? "Analysis Result";
    const intDetail = scanResult?.integrity_detail ?? "";
    const method = scanResult?.analysis_method ?? "NLP Transformer";
    const repoSize = scanResult?.repository_size ?? null;
    const durationMs = scanResult?.analysis_duration_ms ?? null;
    const engineVer = scanResult?.engine_version ?? "ISAMS-NLP v1.0";
    const docTitle = analyzedFileName ?? submission?.title ?? "Document";

    // Field scores — use real data or fall back to mock
    const displayFieldScores = fieldScores.length > 0 ? fieldScores : [
        { field_name: "title", score: 15, severity: "low", display_label: "Title", display_order: 1 },
        { field_name: "abstract", score: 45, severity: "moderate", display_label: "Abstract", display_order: 2 },
        { field_name: "keywords", score: 22, severity: "low", display_label: "Keywords", display_order: 3 },
    ];

    // Top matches — use real data or fall back to empty
    const displayMatches = topMatches.length > 0 ? topMatches : (submission ? [
        { matched_title: "Smart Traffic Control System using ML", matched_authors: ["Alice Green", "Bob White"], matched_year: 2023, match_score: 42, match_type: "Abstract & Keywords" },
        { matched_title: "IoT Based Urban Traffic Management", matched_authors: ["Mark Spencer"], matched_year: 2022, match_score: 28, match_type: "Title & Keywords" },
    ] : []);

    const handleExport = async () => {
        if (!onExportPDF) return;
        setIsExporting(true);
        setExportDone(false);
        try {
            await onExportPDF();
            setExportDone(true);
            setTimeout(() => setExportDone(false), 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setIsExporting(false);
        }
    };

    const isFlagged = intStatus !== "safe";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl bg-white border-gray-200 text-gray-900 p-0 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
                            <FileText className="h-5 w-5 text-green-700" />
                            Similarity Report
                        </DialogTitle>
                        <SimilarityScoreBadge score={score} threshold={threshold} />
                    </div>
                    <DialogDescription className="text-gray-500 text-sm">
                        Analysis details for "{docTitle}"
                    </DialogDescription>
                </div>

                <ScrollArea className="max-h-[65vh]">
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left: field breakdown + matches */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Field-Level Breakdown */}
                            <section>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
                                    Field-Level Breakdown
                                </h3>
                                <div className="space-y-2">
                                    {[...displayFieldScores]
                                        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                                        .map((item) => {
                                            const barColor =
                                                item.severity === "high" ? "bg-red-500"
                                                    : item.severity === "moderate" ? "bg-amber-500"
                                                        : "bg-green-600";
                                            return (
                                                <div key={item.field_name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                                                    <span className="text-sm font-medium text-gray-700 w-24 shrink-0">
                                                        {item.display_label || item.field_name}
                                                    </span>
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                className={cn("h-full rounded-full transition-all", barColor)}
                                                                style={{ width: `${Math.min(100, item.score)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-mono text-gray-500 w-10 text-right">{item.score}%</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </section>

                            {/* Integrity Detail */}
                            {intDetail && (
                                <section className={cn(
                                    "p-4 rounded-xl border text-xs leading-relaxed",
                                    intStatus === "high_similarity" ? "bg-red-50 border-red-200 text-red-700"
                                        : intStatus === "flagged" ? "bg-amber-50 border-amber-200 text-amber-700"
                                            : "bg-green-50 border-green-200 text-green-700"
                                )}>
                                    <div className="flex items-center gap-2 font-bold mb-1">
                                        {intStatus === "high_similarity" ? <AlertCircle className="h-4 w-4" />
                                            : intStatus === "flagged" ? <AlertTriangle className="h-4 w-4" />
                                                : <ShieldCheck className="h-4 w-4" />}
                                        {intLabel}
                                    </div>
                                    {intDetail}
                                </section>
                            )}

                            {/* Top Matching Records */}
                            <section>
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
                                    Top Matching Records
                                </h3>
                                {displayMatches.length === 0 ? (
                                    <div className="text-center py-6 text-gray-400 text-sm">
                                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-300" />
                                        No significant matches in the repository.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {displayMatches.slice(0, 5).map((match, i) => (
                                            <div key={i} className="p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-green-400/40 hover:bg-green-50/30 transition-colors group">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="space-y-1 min-w-0 flex-1">
                                                        <h4 className="text-sm font-semibold text-gray-800 group-hover:text-green-700 transition-colors truncate">
                                                            {match.matched_title}
                                                        </h4>
                                                        <p className="text-xs text-gray-500">
                                                            {Array.isArray(match.matched_authors) ? match.matched_authors.join(", ") : match.matched_authors}
                                                            {match.matched_year && ` • ${match.matched_year}`}
                                                        </p>
                                                    </div>
                                                    <Badge variant="outline" className="bg-white border-gray-300 text-gray-700 shrink-0">
                                                        {match.match_score}% match
                                                    </Badge>
                                                </div>
                                                <div className="mt-2 flex items-center gap-2">
                                                    {match.match_type && (
                                                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase font-bold">
                                                            Matched in: {match.match_type}
                                                        </span>
                                                    )}
                                                    {match.matched_thesis_id && (
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto text-gray-400 hover:text-green-700">
                                                            <ExternalLink className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* Right sidebar */}
                        <div className="space-y-4">
                            {/* Analysis Info */}
                            <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                                <h4 className="text-xs font-bold text-green-700 uppercase mb-3">Analysis Info</h4>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between text-gray-500">
                                        <span>Method</span>
                                        <span className="text-gray-800 font-medium">{method}</span>
                                    </div>
                                    {repoSize !== null && (
                                        <div className="flex justify-between text-gray-500">
                                            <span>Repository Size</span>
                                            <span className="text-gray-800 font-medium">{repoSize.toLocaleString()} Records</span>
                                        </div>
                                    )}
                                    {durationMs !== null && (
                                        <div className="flex justify-between text-gray-500">
                                            <span>Analysis Time</span>
                                            <span className="text-gray-800 font-medium">{(durationMs / 1000).toFixed(2)}s</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-gray-500">
                                        <span>Engine</span>
                                        <span className="text-gray-800 font-medium">{engineVer}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <Button
                                className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold"
                                onClick={handleExport}
                                disabled={isExporting || exportDone}
                            >
                                {isExporting ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : exportDone ? (
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                ) : (
                                    <Download className="h-4 w-4 mr-2" />
                                )}
                                {exportDone ? "Downloaded" : "Export as PDF"}
                            </Button>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="p-4 border-t border-gray-200 bg-gray-50">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-300 text-gray-600 hover:bg-gray-50">
                        Close Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}