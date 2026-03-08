import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Loader2, ShieldAlert, CheckCircle2 } from "lucide-react";
import { ThesisArchivingHeader } from "../components/ThesisArchivingHeader";
import { Badge } from "@/components/ui/badge";
import { thesisService } from "../services/thesisService";
import { useToast } from "@/components/ui/toast/toaster";

export default function ThesisDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

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
            <div className="flex flex-col min-h-screen w-full bg-white relative overflow-hidden">
                {/* ── Decorative background blobs ── */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full"
                        style={{ background: "radial-gradient(circle, #bbf7d0 0%, transparent 70%)", filter: "blur(60px)", opacity: 0.7 }} />
                    <div className="absolute -top-20 right-0 w-[380px] h-[380px] rounded-full"
                        style={{ background: "radial-gradient(circle, #BFDBFE 0%, transparent 70%)", filter: "blur(55px)", opacity: 0.65 }} />
                </div>

                <ThesisArchivingHeader title="Digital Repository" variant="light" />
                <div className="flex-1 flex items-center justify-center relative z-10">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 text-[#008A45] animate-spin" />
                        <p className="text-gray-500 font-medium">Loading research details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!paper) {
        return (
            <div className="flex flex-col min-h-screen w-full bg-white">
                <ThesisArchivingHeader title="Digital Repository" variant="light" />
                <div className="flex-1 flex flex-col items-center justify-center gap-6 relative z-10">
                    <div className="p-4 rounded-full bg-gray-50 border border-gray-100">
                        <ShieldAlert className="h-12 w-12 text-gray-400" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Research Not Found</h2>
                        <p className="text-gray-500">The document you are looking for does not exist or has been removed.</p>
                    </div>
                    <Button variant="outline" onClick={() => navigate(-1)} className="border-gray-200 text-gray-700 hover:bg-gray-50">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Repository
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen w-full bg-white relative overflow-x-hidden">
            {/* ── Decorative background blobs ── */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full"
                    style={{ background: "radial-gradient(circle, #bbf7d0 0%, transparent 70%)", filter: "blur(60px)", opacity: 0.7 }} />
                <div className="absolute -top-20 right-0 w-[380px] h-[380px] rounded-full"
                    style={{ background: "radial-gradient(circle, #BFDBFE 0%, transparent 70%)", filter: "blur(55px)", opacity: 0.65 }} />
                <div className="absolute top-[45%] -left-24 w-[320px] h-[320px] rounded-full"
                    style={{ background: "radial-gradient(circle, #FDE68A 0%, transparent 70%)", filter: "blur(50px)", opacity: 0.55 }} />
                <div className="absolute top-[35%] right-[-60px] w-[360px] h-[360px] rounded-full"
                    style={{ background: "radial-gradient(circle, #FBCFE8 0%, transparent 70%)", filter: "blur(55px)", opacity: 0.55 }} />
                <div className="absolute -bottom-24 left-[30%] w-[400px] h-[400px] rounded-full"
                    style={{ background: "radial-gradient(circle, #99F6E4 0%, transparent 70%)", filter: "blur(60px)", opacity: 0.5 }} />
            </div>

            <ThesisArchivingHeader title="Digital Repository" variant="light" />

            <main className="flex-1 p-0 relative z-10">
                {/* Institutional Header Section */}
                <div className="relative border-b border-gray-100 px-8 py-12 md:px-12 md:py-16 overflow-hidden">
                    <div className="relative max-w-5xl mx-auto space-y-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 -ml-2 mb-4 transition-colors"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>

                        <div className="space-y-4">
                            <p className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: "#008A45" }}>
                                {paper.category}
                            </p>
                            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
                                {paper.title}
                            </h1>
                        </div>

                        <div className="space-y-4 text-gray-600">
                            <div className="flex flex-wrap items-center gap-2 text-lg font-medium text-gray-800">
                                {paper.authors.map((author, index) => (
                                    <React.Fragment key={index}>
                                        <span>{author}</span>
                                        {index < paper.authors.length - 1 && <span className="text-gray-300">•</span>}
                                    </React.Fragment>
                                ))}
                            </div>

                            <div className="flex flex-col gap-2 text-sm md:text-base border-l-2 border-[#008A45]/20 pl-4 py-1">
                                <p><span className="text-gray-400 font-medium">Publication Year:</span> <span className="text-gray-700 font-semibold">{paper.year}</span></p>
                                <p><span className="text-gray-400 font-medium">Adviser:</span> <span className="text-gray-700 font-semibold">{paper.adviser}</span></p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 pt-6">
                            {paper.downloadUrl ? (
                                <Button
                                    onClick={handleDownload}
                                    disabled={isDownloading || downloadSuccess}
                                    className={`h-11 px-8 rounded-lg font-bold shadow-lg shadow-[#008A45]/20 transition-all duration-300 gap-2 border-none ${downloadSuccess
                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                        : 'bg-[#008A45] hover:bg-[#006B35] text-white'}`}
                                >
                                    {isDownloading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Downloading...
                                        </>
                                    ) : downloadSuccess ? (
                                        <>
                                            <CheckCircle2 className="h-4 w-4" />
                                            Success
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4" />
                                            Download Research Paper
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <Button disabled className="h-11 px-8 rounded-lg bg-gray-100 text-gray-400 font-semibold gap-2 border-none cursor-not-allowed">
                                    <Download className="h-4 w-4" />
                                    PDF Unavailable
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Abstract Section */}
                <div className="p-8 md:p-12">
                    <div className="max-w-5xl mx-auto">
                        <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/80 p-8 md:p-10 shadow-sm">
                            <div className="flex flex-col gap-2 mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                    <span className="w-8 h-1 rounded-full bg-[#FFCE00]" />
                                    Abstract
                                </h2>
                            </div>

                            <div className="text-gray-600 leading-relaxed text-lg tracking-wide abstract-content"
                                dangerouslySetInnerHTML={{ __html: paper.abstract || "No abstract provided." }}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
