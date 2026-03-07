import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileText, Loader2, ShieldAlert, CheckCircle2, RefreshCw } from "lucide-react";
import { ThesisArchivingHeader } from "../components/ThesisArchivingHeader";
import { Badge } from "@/components/ui/badge";
import { SimilarityScoreBadge } from "../components/SimilarityScoreBadge";
import { SimilarityReportModal } from "../components/SimilarityReportModal";
import { thesisService } from "../services/thesisService";
import { useToast } from "@/components/ui/toast/toaster";

export default function ThesisDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [paper, setPaper] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloadSuccess, setDownloadSuccess] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        const fetchPaper = async () => {
            try {
                setLoading(true);
                const data = await thesisService.getThesisById(id);

                // Map DB structure to UI structure
                const mappedPaper = {
                    id: data.id,
                    title: data.title,
                    authors: data.authors
                        ? data.authors
                            .sort((a, b) => a.display_order - b.display_order)
                            .map(a => `${a.first_name} ${a.last_name}`)
                        : [],
                    year: data.publication_year,
                    adviser: data.adviser
                        ? `${data.adviser.title ? data.adviser.title + '. ' : ''}${data.adviser.first_name || ''} ${data.adviser.last_name || ''}${data.adviser.credentials ? ', ' + data.adviser.credentials : ''}`.trim() || "Unspecified"
                        : "N/A",
                    category: data.category?.name || "Uncategorized",
                    abstract: data.abstract,
                    similarityScore: 0, // Placeholder for now
                    downloadUrl: data.files?.[0]?.storage_path
                        ? thesisService.getDownloadUrl(data.files[0].storage_path)
                        : null
                };

                setPaper(mappedPaper);
            } catch (error) {
                console.error("Error fetching thesis details:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchPaper();
    }, [id]);

    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        if (!paper.downloadUrl) return;

        try {
            setIsDownloading(true);
            const response = await fetch(paper.downloadUrl);
            if (!response.ok) throw new Error("Download failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            // Extract filename from response headers or use title
            const contentDisposition = response.headers.get('Content-Disposition');
            let fileName = `${paper.title.substring(0, 30)}.pdf`;
            if (contentDisposition && contentDisposition.includes('filename=')) {
                fileName = contentDisposition.split('filename=')[1].replace(/"/g, '');
            }

            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);

            setDownloadSuccess(true);
            setTimeout(() => setDownloadSuccess(false), 3000);

            addToast({
                title: "Success",
                description: "Research paper downloaded successfully.",
                variant: "success"
            });
        } catch (error) {
            console.error("Download error:", error);
            addToast({
                title: "Download Failed",
                description: "Could not download the PDF. Please try again later.",
                variant: "destructive"
            });
        } finally {
            setIsDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen w-full bg-slate-950">
                <ThesisArchivingHeader title="Digital Repository" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                        <p className="text-slate-400 font-medium">Loading research details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!paper) {
        return (
            <div className="flex flex-col min-h-screen w-full bg-slate-950 text-slate-100">
                <ThesisArchivingHeader title="Digital Repository" />
                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                    <div className="p-4 rounded-full bg-slate-900 border border-slate-800">
                        <ShieldAlert className="h-12 w-12 text-slate-500" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">Research Not Found</h2>
                        <p className="text-slate-400">The document you are looking for does not exist or has been removed.</p>
                    </div>
                    <Button variant="outline" onClick={() => navigate(-1)} className="border-slate-800 bg-slate-950 hover:bg-slate-900">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Repository
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen w-full bg-slate-950">
            <ThesisArchivingHeader title="Digital Repository" />

            <main className="flex-1 p-0">
                {/* Beautiful Static Multi-Gradient Header */}
                <div className="relative border-b border-slate-800 bg-slate-950 px-8 py-12 md:px-12 md:py-16 overflow-hidden">
                    {/* Static Gradient Mesh Background */}
                    <div className="absolute inset-0 opacity-40">
                        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-600 via-cyan-500 to-transparent blur-[130px] rounded-full -translate-x-1/4 -translate-y-1/4" />
                        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-purple-600 via-indigo-500 to-transparent blur-[120px] rounded-full translate-x-1/4" />
                        <div className="absolute bottom-0 left-1/3 w-[450px] h-[450px] bg-gradient-to-tr from-teal-500 via-blue-500 to-transparent blur-[140px] rounded-full translate-y-1/4" />
                    </div>

                    {/* Subtle Grid Overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />

                    <div className="relative max-w-5xl mx-auto space-y-6 z-10">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 -ml-2 mb-4 transition-colors backdrop-blur-sm"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>

                        <h1 className="text-3xl md:text-4xl font-bold text-slate-100 tracking-tight leading-tight drop-shadow-lg">
                            {paper.title}
                        </h1>

                        <div className="space-y-3 text-slate-300">
                            <div className="flex flex-wrap items-center gap-2 text-lg">
                                {paper.authors.map((author, index) => (
                                    <React.Fragment key={index}>
                                        <span>{author}</span>
                                        {index < paper.authors.length - 1 && <span className="text-slate-600">•</span>}
                                    </React.Fragment>
                                ))}
                            </div>

                            <div className="flex flex-col gap-1 text-sm md:text-base">
                                <p><span className="text-slate-500">Year:</span> {paper.year}</p>
                                <p><span className="text-slate-500">Adviser:</span> {paper.adviser}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 pt-4">
                            <Badge variant="outline" className="bg-slate-800/50 border-slate-700 text-slate-200 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
                                {paper.category}
                            </Badge>

                            {paper.downloadUrl ? (
                                <Button
                                    onClick={handleDownload}
                                    disabled={isDownloading || downloadSuccess}
                                    className={`${downloadSuccess ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'} font-semibold gap-2 border-none shadow-lg min-w-[160px] transition-all duration-300`}
                                >
                                    {isDownloading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Downloading...
                                        </>
                                    ) : downloadSuccess ? (
                                        <>
                                            <CheckCircle2 className="h-4 w-4" />
                                            Downloaded
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4" />
                                            Download PDF
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <Button disabled className="bg-slate-800 text-slate-500 font-semibold gap-2 border-none cursor-not-allowed">
                                    <Download className="h-4 w-4" />
                                    No PDF Available
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Abstract Section */}
                <div className="p-8 md:p-12">
                    <div className="max-w-5xl mx-auto">
                        <div className="space-y-6">
                            <div className="flex flex-col gap-2">
                                <h2 className="text-2xl font-semibold text-slate-100">Abstract</h2>
                                <div className="h-0.5 w-full bg-slate-800 mt-2" />
                            </div>

                            <div className="text-slate-300 leading-relaxed text-lg tracking-wide abstract-content"
                                dangerouslySetInnerHTML={{ __html: paper.abstract || "No abstract provided." }}
                            />
                        </div>

                        {/* Research Integrity & Similarity Section */}
                        <div className="mt-16 space-y-6">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-semibold text-slate-100 flex items-center gap-2">
                                        <ShieldAlert className="h-6 w-6 text-blue-400" />
                                        Research Integrity
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <SimilarityScoreBadge score={paper.similarityScore || 18} />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                                            onClick={() => setReportModalOpen(true)}
                                        >
                                            <FileText className="h-4 w-4 mr-2" />
                                            Full Report
                                        </Button>
                                    </div>
                                </div>
                                <div className="h-0.5 w-full bg-slate-800 mt-2" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 space-y-4">
                                    <p className="text-slate-400 text-sm italic">
                                        Automated similarity analysis compares this submission against the full digital repository using NLP-based semantic matching.
                                    </p>
                                    <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Analysis Breakdown</h3>
                                        <div className="space-y-3">
                                            {[
                                                { label: "Title Similarity", value: 5 },
                                                { label: "Abstract Similarity", value: 22 },
                                                { label: "Keywords Similarity", value: 12 },
                                            ].map((item) => (
                                                <div key={item.label} className="space-y-1.5">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-slate-300">{item.label}</span>
                                                        <span className="text-slate-500">{item.value}%</span>
                                                    </div>
                                                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500 rounded-full"
                                                            style={{ width: `${item.value}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                        <h4 className="text-xs font-bold text-emerald-400 uppercase mb-2">Integrity Status</h4>
                                        <div className="flex items-start gap-3">
                                            <div className="p-1.5 rounded-full bg-emerald-500/10 mt-0.5">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-slate-200">Below Threshold</p>
                                                <p className="text-[10px] text-slate-500 mt-0.5">No significant duplications detected. Verification cleared.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                                        onClick={() => console.log("Retriggering...")}
                                    >
                                        <RefreshCw className="h-3.5 w-3.5 mr-2" />
                                        Re-run Analysis
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <SimilarityReportModal
                    open={reportModalOpen}
                    onOpenChange={setReportModalOpen}
                    submission={{ ...paper, similarityScore: paper.similarityScore || 18 }}
                />
            </main>
        </div>
    );
}