import React, { useState } from "react";
import { ThesisArchivingHeader } from "../components/ThesisArchivingHeader";
import {
    ShieldAlert,
    FileText,
    Download,
    RefreshCw,
    ArrowLeft,
    CheckCircle2,
    BarChart3,
    Search,
    History,
    FileCheck,
    Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SimilarityDropzone } from "../components/SimilarityDropzone";
import { SimilarityAnalysisLoading } from "../components/SimilarityAnalysisLoading";
import { SimilarityScoreBadge } from "../components/SimilarityScoreBadge";
import { Badge } from "@/components/ui/badge";

export default function SimilarityCheckPage() {
    const [viewState, setViewState] = useState("idle"); // idle, processing, result
    const [analyzedFile, setAnalyzedFile] = useState(null);

    const handleFileSelect = (file) => {
        setAnalyzedFile(file);
        setViewState("processing");
    };

    const handleAnalysisComplete = () => {
        setViewState("result");
    };

    const resetAnalysis = () => {
        setAnalyzedFile(null);
        setViewState("idle");
    };

    // Mock result data
    const mockResult = {
        title: analyzedFile?.name || "Evaluating Thesis Document",
        score: 34,
        matches: [
            { title: "Smart Traffic Control System using ML", authors: ["Alice Green", "Bob White"], year: "2023", score: 42 },
            { title: "IoT Based Urban Traffic Management", authors: ["Mark Spencer"], year: "2022", score: 28 },
            { title: "Deep Learning for Traffic Flow Optimization", authors: ["Dr. Sarah Connor"], year: "2024", score: 15 }
        ]
    };

    return (
        <div className="flex flex-col min-h-screen w-full bg-gray-50 text-gray-900">
            <ThesisArchivingHeader title="Similarity Check" variant="light" />

            <main className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-7xl mx-auto h-full flex flex-col">

                    {/* Progress Header (Visible when not idle) */}
                    {viewState !== "idle" && (
                        <div className="mb-8 animate-in slide-in-from-top-4 duration-500">
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
                                            {viewState === "processing" ? "Real-time semantic comparison active" : "Analysis complete. Integrity report generated."}
                                        </p>
                                    </div>
                                </div>
                                {viewState === "result" && (
                                    <Button className="bg-green-700 hover:bg-green-800 text-white font-bold px-6 border-none shadow-lg">
                                        <Download className="h-4 w-4 mr-2" />
                                        Export PDF Report
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 flex flex-col items-center justify-center">
                        {viewState === "idle" && (
                            <div className="w-full max-w-5xl animate-in fade-in zoom-in duration-700 space-y-12">
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                                        Smart Research Topic Similarity Detection
                                    </h2>
                                    <p className="text-gray-500 max-w-3xl text-sm leading-relaxed">
                                        Cross-reference your thesis softcopy against the complete digital repository of 1,200+ papers instantly. Upload your document to receive a detailed breakdown of semantic matches and NLP-generated integrity scores.
                                    </p>
                                </div>

                                <SimilarityDropzone onFileSelect={handleFileSelect} />

                                <div className="space-y-6 pt-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                        Recent Scans
                                    </h3>
                                    <div className="space-y-4">
                                        {[
                                            { title: "Smart Inventory for Poultry", match: "Automated Poultry Inventory System (2022)", score: 87, color: "border-l-red-500" },
                                            { title: "Enrollment System for CCS", match: "Multiple minor keyword matches", score: 12, color: "border-l-green-500" }
                                        ].map((scan, i) => (
                                            <div key={i} className={cn(
                                                "p-5 rounded-xl bg-white border border-gray-200 border-l-4 flex justify-between items-center group hover:bg-green-50/50 transition-all shadow-sm",
                                                scan.color
                                            )}>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-gray-700">
                                                        Proposed Title: <span className="text-gray-900">"{scan.title}"</span>
                                                    </p>
                                                    <p className="text-xs text-gray-500 font-medium">
                                                        {scan.match}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={cn(
                                                        "text-lg font-black",
                                                        scan.score > 50 ? "text-red-500" : "text-green-600"
                                                    )}>
                                                        {scan.score}% Match
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {viewState === "processing" && (
                            <SimilarityAnalysisLoading onComplete={handleAnalysisComplete} />
                        )}

                        {viewState === "result" && (
                            <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-8">
                                        <Card className="bg-white border-gray-200 shadow-lg backdrop-blur-xl">
                                            <CardContent className="p-8 space-y-8">
                                                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                                    <div className="space-y-2">
                                                        <h3 className="text-xl font-bold tracking-tight text-green-700 lowercase variant-small-caps">
                                                            Primary Submission Evaluated
                                                        </h3>
                                                        <p className="text-2xl font-black text-gray-900 leading-tight">
                                                            {mockResult.title}
                                                        </p>
                                                    </div>
                                                    <SimilarityScoreBadge score={mockResult.score} className="p-4 rounded-2xl scale-110" />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {[
                                                        { label: "Title match", value: 12 },
                                                        { label: "Abstract match", value: 48 },
                                                        { label: "Content match", value: 25 },
                                                    ].map((item, i) => (
                                                        <div key={i} className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                                                            <div className="flex justify-between items-end mb-2">
                                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{item.label}</span>
                                                                <span className="text-sm font-black text-green-700">{item.value}%</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-green-600 rounded-full"
                                                                    style={{ width: `${item.value}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-sm font-bold uppercase tracking-widest text-gray-500">
                                                            Top Competitive Matches
                                                        </h4>
                                                        <div className="h-px flex-1 bg-gray-200 ml-4" />
                                                    </div>
                                                    <div className="space-y-3">
                                                        {mockResult.matches.map((match, i) => (
                                                            <div key={i} className="group p-5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-green-400/50 hover:bg-green-50/30 transition-all duration-300">
                                                                <div className="flex justify-between items-start gap-4">
                                                                    <div className="space-y-1">
                                                                        <h5 className="font-bold text-gray-800 group-hover:text-green-700 transition-colors">
                                                                            {match.title}
                                                                        </h5>
                                                                        <p className="text-xs text-gray-500 font-medium">
                                                                            {match.authors.join(", ")} • {match.year}
                                                                        </p>
                                                                    </div>
                                                                    <Badge variant="outline" className="bg-white border-gray-300 text-gray-700 font-bold px-3 py-1 scale-90">
                                                                        {match.score}% MATCH
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div className="space-y-6">
                                        <Card className="bg-white border-gray-200 shadow-lg sticky top-6 overflow-hidden">
                                            <CardContent className="p-6 space-y-6">
                                                <div>
                                                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Integrity Summary</h4>
                                                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                                                        <div className="flex items-center gap-2 text-amber-600">
                                                            <ShieldAlert className="h-4 w-4" />
                                                            <span className="text-xs font-black uppercase tracking-tight">Requires Review</span>
                                                        </div>
                                                        <p className="text-xs text-gray-600 leading-relaxed">
                                                            This paper exceeded the 20% similarity threshold. A high correlation was found in the Abstract section with previous 2023 publications.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <Button className="w-full bg-green-700 hover:bg-green-800 text-white border-none font-bold py-6">
                                                        <RefreshCw className="h-4 w-4 mr-2" />
                                                        Re-run with Deep Scan
                                                    </Button>
                                                    <Button variant="outline" className="w-full bg-white hover:bg-green-50 border-gray-300 text-gray-700 font-bold py-6">
                                                        <History className="h-4 w-4 mr-2" />
                                                        Comparison History
                                                    </Button>
                                                </div>

                                                <div className="pt-6 border-t border-gray-200">
                                                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase">
                                                        <span>Analysis Core</span>
                                                        <span className="text-gray-600">ISAMS-NLP v2.4</span>
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
        </div>
    );
}

// Utility to merge classes
function cn(...inputs) {
    return inputs.filter(Boolean).join(" ");
}