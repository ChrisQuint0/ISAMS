import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Loader2, ShieldAlert, CheckCircle2, Edit, Trash2, AlertCircle } from "lucide-react";
import { ThesisArchivingHeader } from "../components/ThesisArchivingHeader";
import { Badge } from "@/components/ui/badge";
import { thesisService } from "../services/thesisService";
import { useToast } from "@/components/ui/toast/toaster";
import EditThesisEntryModal from "../components/EditThesisEntryModal";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";

export default function ThesisDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [paper, setPaper] = useState(null);
    const [rawData, setRawData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloadSuccess, setDownloadSuccess] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { addToast } = useToast();
    const { user } = useAuth();

    const actorInfo = {
        actorUserId: user?.id,
        actorName: user?.user_metadata?.first_name 
            ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim()
            : user?.email || "System User"
    };

    const fetchPaper = useCallback(async () => {
        try {
            setLoading(true);
            const data = await thesisService.getThesisById(id);
            setRawData(data);

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
            addToast({
                title: "Error",
                description: "Failed to load research details.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [id, addToast]);

    useEffect(() => {
        if (id) fetchPaper();
    }, [id, fetchPaper]);

    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        if (!paper?.downloadUrl) return;

        try {
            setIsDownloading(true);
            const response = await fetch(paper.downloadUrl);
            if (!response.ok) throw new Error("Download failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            
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

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            await thesisService.deleteThesisEntry(id, actorInfo);
            addToast({
                title: "Research Deleted",
                description: "The research and its associated files have been permanently removed.",
                variant: "success"
            });
            setIsDeleteModalOpen(false);
            navigate("/thesis-archiving/digital-repository");
        } catch (error) {
            console.error("Delete error:", error);
            addToast({
                title: "Deletion Failed",
                description: error.message || "Failed to delete research entry.",
                variant: "destructive"
            });
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen w-full bg-white relative overflow-hidden">
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

                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <Badge className="bg-[#008A45] hover:bg-[#008A45] text-white px-4 py-1.5 rounded-full font-semibold tracking-wider text-xs border-none shadow-sm capitalize">
                                    {paper.category}
                                </Badge>
                                <span className="text-gray-300">|</span>
                                <span className="text-gray-500 font-bold tracking-widest text-xs uppercase bg-white/50 px-3 py-1.5 rounded-lg border border-gray-100">
                                    Class OF {paper.year}
                                </span>
                            </div>

                            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-[1.2] tracking-tight">
                                {paper.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#008A45]/60 mb-1">Lead Authors</p>
                                    <p className="text-gray-900 font-bold text-lg">
                                        {paper.authors.join(", ")}
                                    </p>
                                </div>
                                <div className="w-px h-10 bg-gray-200 hidden sm:block" />
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#008A45]/60 mb-1">Faculty Adviser</p>
                                    <p className="text-gray-900 font-bold text-lg">
                                        {paper.adviser}
                                    </p>
                                </div>
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

                            <Button
                                onClick={() => setIsEditModalOpen(true)}
                                variant="outline"
                                className="h-11 px-6 rounded-lg font-bold border-gray-200 text-gray-700 hover:bg-gray-50 bg-white/50 backdrop-blur-sm shadow-sm transition-all gap-2"
                            >
                                <Edit className="h-4 w-4" />
                                Edit Research
                            </Button>

                            <Button
                                onClick={() => setIsDeleteModalOpen(true)}
                                variant="outline"
                                className="h-11 px-6 rounded-lg font-bold border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 bg-white/50 backdrop-blur-sm shadow-sm transition-all gap-2"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete Research
                            </Button>
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

            {/* Modals */}
            <EditThesisEntryModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                thesisData={rawData}
                onSuccess={fetchPaper}
            />

            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden bg-white border-neutral-200 shadow-2xl">
                    <div className="p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-12 w-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                                <Trash2 className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-neutral-900">Delete Research?</h3>
                                <p className="text-sm text-neutral-500 mt-1">This action cannot be undone.</p>
                            </div>
                        </div>

                        <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-200 mb-8">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-neutral-400 mt-0.5" />
                                <div className="space-y-3">
                                    <p className="text-sm text-neutral-600 leading-relaxed">
                                        Deleting <span className="font-bold text-neutral-900">"{paper.title}"</span> will permanently remove:
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-2 text-xs font-medium text-neutral-500">
                                            <div className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
                                            All database records and meta-data
                                        </li>
                                        <li className="flex items-center gap-2 text-xs font-medium text-neutral-500">
                                            <div className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
                                            Primary research file from Google Drive
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={isDeleting}
                                className="flex-1 h-11 font-semibold border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 h-11 font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Deleting...
                                    </>
                                ) : "Delete Permanently"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
