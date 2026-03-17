import React, { useState } from "react";
import { ThesisArchivingHeader } from "../components/ThesisArchivingHeader";
import {
    ShieldAlert, ShieldCheck, AlertCircle,
    FileText, Download, RefreshCw, ArrowLeft,
    History, FileCheck, AlertTriangle, Loader2,
    Info, BookOpen, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SimilarityDropzone } from "../components/SimilarityDropzone";
import { SimilarityAnalysisLoading } from "../components/SimilarityAnalysisLoading";
import { SimilarityScoreBadge } from "../components/SimilarityScoreBadge";
import { SimilarityReportModal } from "../components/SimilarityReportModal";
import { Badge } from "@/components/ui/badge";
import { useSimilarityCheck } from "../hooks/useSimilarityCheck";
import { similarityService } from "../services/similarityService";
import { useToast } from "@/components/ui/toast/toaster";
import { cn } from "@/lib/utils";

export default function SimilarityCheckPage() {
    const {
        viewState,
        analyzedFile,
        scanResult,
        recentScans,
        recentScansLoading,
        threshold,
        error,
        isRerunning,
        handleFileSelect,
        handleRerunDeepScan,
        handleExportPDF,
        handleMarkAsReviewed,
        handleSaveThreshold,
        resetAnalysis,
    } = useSimilarityCheck();

    const { addToast } = useToast();
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [downloadStatus, setDownloadStatus] = useState("idle"); // 'idle' | 'downloading' | 'done'
    const [exportStatus, setExportStatus] = useState("idle"); // 'idle' | 'exporting' | 'done'

    const handleDownloadTemplate = async () => {
        setDownloadStatus("downloading");

        try {
            const url = similarityService.getTemplateDownloadUrl();
            if (!url) throw new Error("Could not get public URL");
            
            const link = document.createElement("a");
            link.href = url;
            link.download = "thesis_template.docx";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setDownloadStatus("done");
            addToast("success", "Template downloaded", "Fill it out and upload for similarity checking");

            // Reset back to idle after a delay
            setTimeout(() => {
                setDownloadStatus("idle");
            }, 3000);
        } catch (err) {
            console.error("Download failed:", err);
            setDownloadStatus("idle");
            addToast("error", "Download Failed", "Could not retrieve the thesis template from storage");
        }
    };

    const handleExportWithLoading = async () => {
        setExportStatus("exporting");
        try {
            await handleExportPDF();
            setExportStatus("done");
            addToast("success", "Report Exported", "The similarity check report has been generated successfully");

            // Reset back to idle after a delay
            setTimeout(() => {
                setExportStatus("idle");
            }, 3000);
        } catch (err) {
            setExportStatus("idle");
            addToast("error", "Export Failed", "There was an error generating the PDF report");
        }
    };

    // Derive display data from scanResult
    const fieldScores = scanResult?.field_scores ?? [];
    const topMatches = scanResult?.top_matches ?? [];
    const overallScore = scanResult?.overall_score ?? 0;
    const integrityStatus = scanResult?.integrity_status ?? "safe";
    const isFlagged = integrityStatus !== "safe";

    return (
        <div className="flex flex-col min-h-screen w-full bg-gray-50 text-gray-900">
            <ThesisArchivingHeader
                title="Similarity Check"
                variant="light"
            />

            <main className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-7xl mx-auto h-full flex flex-col">

                    {/* Progress Header (Visible when not idle) */}
                    {viewState !== "idle" && viewState !== "error" && (
                        <div className="mb-8">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetAnalysis}
                                className="text-gray-500 hover:bg-green-50 hover:text-green-700 mb-4"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Start New Analysis
                            </Button>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-green-600/10 border border-green-500/20 text-green-700">
                                        <ShieldAlert className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                            Similarity Deep Analysis
                                        </h1>
                                        <p className="text-gray-500 text-sm font-medium">
                                            {viewState === "processing"
                                                ? "Real-time semantic comparison active…"
                                                : "Analysis complete. Integrity report generated."}
                                        </p>
                                    </div>
                                </div>
                                {viewState === "result" && (
                                    <div className="flex items-center gap-3">
                                        <Button
                                            onClick={handleExportWithLoading}
                                            disabled={exportStatus !== "idle"}
                                            className={cn(
                                                "font-bold px-6 border-none shadow-lg transition-all",
                                                exportStatus === "exporting" ? "bg-green-600 cursor-wait" :
                                                    exportStatus === "done" ? "bg-green-500" :
                                                        "bg-green-700 hover:bg-green-800 text-white"
                                            )}
                                        >
                                            {exportStatus === "exporting" ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Exporting...
                                                </>
                                            ) : exportStatus === "done" ? (
                                                <>
                                                    <Check className="h-4 w-4 mr-2" />
                                                    Exported
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Export PDF Report
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 flex flex-col items-center justify-center">
                        {/* ─── IDLE ─────────────────────────────────────────── */}
                        {viewState === "idle" && (
                            <div className="w-full max-w-5xl space-y-10">
                                <div className="space-y-3">
                                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                                        Smart Research Topic Similarity Detection
                                    </h2>
                                    <p className="text-gray-500 max-w-3xl text-sm leading-relaxed">
                                        Cross-reference your thesis softcopy against the complete digital repository instantly.
                                        Upload your document to receive a detailed breakdown of semantic matches and NLP-generated integrity scores.
                                    </p>
                                </div>

                                {/* Format Guidance Banner */}
                                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex gap-4 items-start">
                                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600 shrink-0">
                                        <Info className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <p className="text-sm font-bold text-blue-800">Document Format Guide</p>
                                        <p className="text-xs text-blue-700 leading-relaxed">
                                            For the most accurate scan, ensure your document has clearly labeled sections:
                                            <strong> ABSTRACT</strong>, <strong> KEYWORDS</strong>, and a visible title on the first page.
                                            The NLP engine extracts these fields automatically for per-section scoring.
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {["Title (Page 1)", "ABSTRACT section", "Keywords: line", "Body content"].map(s => (
                                                <span key={s} className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase tracking-wide">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={cn(
                                            "shrink-0 border-blue-300 font-bold text-xs transition-all",
                                            downloadStatus === "downloading" ? "bg-blue-100 text-blue-700" :
                                                downloadStatus === "done" ? "bg-green-100 border-green-300 text-green-700" :
                                                    "text-blue-700 hover:bg-blue-100"
                                        )}
                                        onClick={handleDownloadTemplate}
                                        disabled={downloadStatus !== "idle"}
                                    >
                                        {downloadStatus === "downloading" ? (
                                            <>
                                                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                                                Downloading...
                                            </>
                                        ) : downloadStatus === "done" ? (
                                            <>
                                                <Check className="h-3 w-3 mr-1.5" />
                                                Downloaded
                                            </>
                                        ) : (
                                            <>
                                                <BookOpen className="h-3 w-3 mr-1.5" />
                                                Download Template
                                            </>
                                        )}
                                    </Button>
                                </div>

                                <SimilarityDropzone onFileSelect={handleFileSelect} />

                                {/* Recent Scans */}
                                <div className="space-y-4 pt-2">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                        Recent Scans
                                    </h3>
                                    {recentScansLoading ? (
                                        <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span className="text-sm">Loading scan history…</span>
                                        </div>
                                    ) : recentScans.length === 0 ? (
                                        <div className="text-center py-10 text-gray-400 text-sm">
                                            No scans yet. Upload a document to get started.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {recentScans.map((scan) => {
                                                const result = Array.isArray(scan.result) ? scan.result[0] : scan.result;
                                                const score = result?.overall_score ?? null;
                                                const status = result?.integrity_status ?? scan.status;
                                                const borderColor =
                                                    status === "high_similarity" ? "border-l-red-500"
                                                        : status === "flagged" ? "border-l-amber-500"
                                                            : status === "completed" || status === "safe" ? "border-l-green-500"
                                                                : "border-l-gray-300";
                                                return (
                                                    <div
                                                        key={scan.id}
                                                        className={cn(
                                                            "p-5 rounded-xl bg-white border border-gray-200 border-l-4 flex justify-between items-center group hover:bg-green-50/50 transition-all shadow-sm",
                                                            borderColor
                                                        )}
                                                    >
                                                        <div className="space-y-1 min-w-0 flex-1 mr-4">
                                                            <p className="text-sm font-bold text-gray-700 truncate">
                                                                {scan.proposed_title
                                                                    ? <>Proposed Title: <span className="text-gray-900">"{scan.proposed_title}"</span></>
                                                                    : <span className="text-gray-600">{scan.original_filename}</span>
                                                                }
                                                            </p>
                                                            <p className="text-xs text-gray-400 font-medium">
                                                                {new Date(scan.submitted_at).toLocaleDateString("en-PH", {
                                                                    year: "numeric", month: "short", day: "numeric",
                                                                    hour: "2-digit", minute: "2-digit"
                                                                })}
                                                                {result?.top_match_title && (
                                                                    <> · Top match: <span className="text-gray-500 italic">"{result.top_match_title}"</span></>
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            {score !== null ? (
                                                                <span className={cn(
                                                                    "text-lg font-black",
                                                                    status === "high_similarity" ? "text-red-500"
                                                                        : status === "flagged" ? "text-amber-500"
                                                                            : "text-green-600"
                                                                )}>
                                                                    {score}% Match
                                                                </span>
                                                            ) : (
                                                                <Badge variant="outline" className="text-xs capitalize">
                                                                    {scan.status}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ─── PROCESSING ───────────────────────────────────── */}
                        {viewState === "processing" && (
                            <div className="w-full max-w-md">
                                <p className="text-center text-sm font-medium text-gray-500 mb-2">
                                    Analyzing <span className="text-green-700 font-bold">{analyzedFile?.name}</span>
                                </p>
                                <SimilarityAnalysisLoading onComplete={() => { }} />
                            </div>
                        )}

                        {/* ─── ERROR ────────────────────────────────────────── */}
                        {viewState === "error" && (
                            <div className="w-full max-w-lg text-center space-y-6">
                                <div className="p-6 rounded-2xl bg-red-50 border border-red-200">
                                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                                    <h3 className="text-lg font-bold text-red-700 mb-2">Analysis Failed</h3>
                                    <p className="text-sm text-red-600 leading-relaxed">{error}</p>
                                </div>
                                <Button onClick={resetAnalysis} className="bg-green-700 hover:bg-green-800 text-white font-bold">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Try Again
                                </Button>
                            </div>
                        )}

                        {/* ─── RESULT ───────────────────────────────────────── */}
                        {viewState === "result" && scanResult && (
                            <div className="w-full">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Main result card */}
                                    <div className="lg:col-span-2 space-y-8">
                                        <Card className="bg-white border-gray-200 shadow-lg">
                                            <CardContent className="p-8 space-y-8">
                                                {/* Title + score */}
                                                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                                    <div className="space-y-2 flex-1 min-w-0">
                                                        <h3 className="text-xl font-bold tracking-tight text-green-700">
                                                            Primary Submission Evaluated
                                                        </h3>
                                                        <p className="text-2xl font-black text-gray-900 leading-tight truncate">
                                                            {analyzedFile?.name}
                                                        </p>
                                                        <p className="text-xs text-gray-400 font-medium">
                                                            Analysis Time: {(scanResult.analysis_duration_ms / 1000).toFixed(2)}s
                                                            {scanResult.repository_size > 0 && ` · ${scanResult.repository_size} records in repository`}
                                                        </p>
                                                    </div>
                                                    <SimilarityScoreBadge score={overallScore} threshold={threshold} className="p-4 rounded-2xl scale-110 shrink-0" />
                                                </div>

                                                {/* Field breakdown */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {[...fieldScores]
                                                        .sort((a, b) => a.display_order - b.display_order)
                                                        .map((item) => {
                                                            const barColor =
                                                                item.severity === "high" ? "bg-red-500"
                                                                    : item.severity === "moderate" ? "bg-amber-500"
                                                                        : "bg-green-600";
                                                            const textColor =
                                                                item.severity === "high" ? "text-red-600"
                                                                    : item.severity === "moderate" ? "text-amber-600"
                                                                        : "text-green-700";
                                                            return (
                                                                <div key={item.field_name} className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                                                                    <div className="flex justify-between items-end mb-2">
                                                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                                                            {item.display_label || item.field_name}
                                                                        </span>
                                                                        <span className={cn("text-sm font-black", textColor)}>
                                                                            {item.score}%
                                                                        </span>
                                                                    </div>
                                                                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                                                        <div
                                                                            className={cn("h-full rounded-full transition-all duration-700", barColor)}
                                                                            style={{ width: `${Math.min(100, item.score)}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                </div>

                                                {/* Top matches */}
                                                {topMatches.length > 0 && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm font-bold uppercase tracking-widest text-gray-500">
                                                                Top Competitive Matches
                                                            </h4>
                                                            <div className="h-px flex-1 bg-gray-200 ml-4" />
                                                        </div>
                                                        <div className="space-y-3">
                                                            {topMatches.map((match, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="group p-5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-green-400/50 hover:bg-green-50/30 transition-all duration-300"
                                                                >
                                                                    <div className="flex justify-between items-start gap-4">
                                                                        <div className="space-y-1 min-w-0 flex-1">
                                                                            <h5 className="font-bold text-gray-800 group-hover:text-green-700 transition-colors truncate">
                                                                                {match.matched_title}
                                                                            </h5>
                                                                            <p className="text-xs text-gray-500 font-medium">
                                                                                {Array.isArray(match.matched_authors)
                                                                                    ? match.matched_authors.join(", ")
                                                                                    : match.matched_authors}
                                                                                {match.matched_year && ` • ${match.matched_year}`}
                                                                            </p>
                                                                        </div>
                                                                        <Badge variant="outline" className="bg-white border-gray-300 text-gray-700 font-bold px-3 py-1 shrink-0">
                                                                            {match.match_score}% MATCH
                                                                        </Badge>
                                                                    </div>
                                                                    {match.match_type && (
                                                                        <div className="mt-2">
                                                                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase font-bold">
                                                                                Matched in: {match.match_type}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {topMatches.length === 0 && (
                                                    <div className="text-center py-6 text-gray-400">
                                                        <FileCheck className="h-10 w-10 mx-auto mb-2 text-green-300" />
                                                        <p className="text-sm font-medium">No significant matches found in the repository.</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Sidebar */}
                                    <div className="space-y-6">
                                        <Card className="bg-white border-gray-200 shadow-lg sticky top-6 overflow-hidden">
                                            <CardContent className="p-6 space-y-6">
                                                {/* Integrity Summary */}
                                                <div>
                                                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Integrity Summary</h4>
                                                    <div className={cn(
                                                        "p-4 rounded-xl border space-y-2",
                                                        integrityStatus === "high_similarity" ? "bg-red-50 border-red-200"
                                                            : integrityStatus === "flagged" ? "bg-amber-50 border-amber-200"
                                                                : "bg-green-50 border-green-200"
                                                    )}>
                                                        <div className={cn(
                                                            "flex items-center gap-2",
                                                            integrityStatus === "high_similarity" ? "text-red-600"
                                                                : integrityStatus === "flagged" ? "text-amber-600"
                                                                    : "text-green-700"
                                                        )}>
                                                            {integrityStatus === "high_similarity" ? <AlertCircle className="h-4 w-4" />
                                                                : integrityStatus === "flagged" ? <ShieldAlert className="h-4 w-4" />
                                                                    : <ShieldCheck className="h-4 w-4" />}
                                                            <span className="text-xs font-black uppercase tracking-tight">
                                                                {scanResult.integrity_label || integrityStatus}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-600 leading-relaxed">
                                                            {scanResult.integrity_detail}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Action buttons */}
                                                <div className="space-y-3">
                                                    <Button
                                                        onClick={handleRerunDeepScan}
                                                        disabled={isRerunning}
                                                        className="w-full bg-green-700 hover:bg-green-800 text-white border-none font-bold py-6"
                                                    >
                                                        {isRerunning
                                                            ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            : <RefreshCw className="h-4 w-4 mr-2" />}
                                                        Rerun
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setReportModalOpen(true)}
                                                        className="w-full bg-white hover:bg-green-50 border-gray-300 text-gray-700 font-bold py-6"
                                                    >
                                                        <History className="h-4 w-4 mr-2" />
                                                        Full Report & History
                                                    </Button>
                                                </div>

                                                {/* Engine info */}
                                                <div className="pt-6 border-t border-gray-200">
                                                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase">
                                                        <span>Analysis Core</span>
                                                        <span className="text-gray-600">{scanResult.engine_version || "ISAMS-NLP v1.0"}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase mt-1">
                                                        <span>Method</span>
                                                        <span className="text-gray-600">{scanResult.analysis_method || "TF-IDF"}</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Modals */}
            <SimilarityReportModal
                open={reportModalOpen}
                onOpenChange={setReportModalOpen}
                scanResult={scanResult}
                fieldScores={fieldScores}
                topMatches={topMatches}
                analyzedFileName={analyzedFile?.name}
                threshold={threshold}
                onMarkAsReviewed={handleMarkAsReviewed}
                onExportPDF={handleExportPDF}
            />
        </div>
    );
}