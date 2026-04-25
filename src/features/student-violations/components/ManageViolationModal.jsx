import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { CheckCircle2, AlertCircle, Loader2, FileText, ExternalLink, ShieldCheck, X, Trash2 } from "lucide-react";
import { ImposeSanctionModal } from "./ImposeSanctionModal";
import { uploadEvidenceToGDrive, deleteEvidenceFromGDrive } from "../services/gdriveEvidenceUpload";

const getFileIdFromUrl = (url) => {
    if (!url) return null;
    const matchD = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (matchD) return matchD[1];
    const matchId = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (matchId) return matchId[1];
    return null;
};

const formatLongDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const formatLongDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
};

export function ManageViolationModal({ isOpen, onClose, onSuccess, violationData }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const [status, setStatus] = useState("Pending");

    const [evidenceList, setEvidenceList] = useState([]);
    const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);
    const [newEvidenceFiles, setNewEvidenceFiles] = useState([]);
    const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);

    const [isImposeSanctionOpen, setIsImposeSanctionOpen] = useState(false);
    const [existingSanction, setExistingSanction] = useState(null);

    useEffect(() => {
        if (isOpen && violationData) {
            setStatus(violationData.status || "Pending");
            fetchEvidence(violationData.violation_id);
            fetchExistingSanction(violationData.violation_id);
        }
    }, [isOpen, violationData]);

    const fetchExistingSanction = async (violationId) => {
        try {
            const { data, error } = await supabase
                .from('student_sanctions_sv')
                .select('*')
                .eq('violation_id', violationId)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // ignore no rows found error
            setExistingSanction(data || null);
        } catch (error) {
            console.error("Error fetching existing sanction:", error);
        }
    };

    const fetchEvidence = async (violationId) => {
        setIsLoadingEvidence(true);
        try {
            const { data, error } = await supabase
                .from('violation_evidence_sv')
                .select('evidence_id, file_name, file_url, file_type')
                .eq('violation_id', violationId)
                .order('uploaded_at', { ascending: true });

            if (error) throw error;
            setEvidenceList(data || []);
        } catch (error) {
            console.error("Error fetching evidence:", error);
        } finally {
            setIsLoadingEvidence(false);
        }
    };

    const resetState = () => {
        setErrorMsg(null);
        setSuccessMsg(null);
        setIsSubmitting(false);
        setEvidenceList([]);
        setNewEvidenceFiles([]);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setNewEvidenceFiles(prev => [...prev, ...Array.from(e.target.files)]);
        }
        e.target.value = null; // reset
    };

    const removeNewFile = (indexToRemove) => {
        setNewEvidenceFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleDeleteEvidence = async (evidenceId) => {
        const file = evidenceList.find(e => e.evidence_id === evidenceId);
        if (!file) return;

        if (!window.confirm("Are you sure you want to delete this evidence?")) return;
        
        try {
            // Delete from GDrive
            const fileId = getFileIdFromUrl(file.file_url);
            if (fileId) {
                try {
                    await deleteEvidenceFromGDrive(fileId);
                } catch (gdriveErr) {
                    console.warn("Could not delete from GDrive or already deleted:", gdriveErr);
                    // Do not block database deletion if GDrive deletion fails (e.g. already deleted manually)
                }
            }

            const { error } = await supabase
                .from('violation_evidence_sv')
                .delete()
                .eq('evidence_id', evidenceId);

            if (error) throw error;
            
            setEvidenceList(prev => prev.filter(e => e.evidence_id !== evidenceId));
            setSuccessMsg("Evidence removed successfully.");
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err) {
            console.error("Error deleting evidence:", err);
            setErrorMsg("Failed to remove evidence.");
            setTimeout(() => setErrorMsg(null), 3000);
        }
    };

    const handleOpenChange = (open) => {
        if (!open) {
            resetState();
            onClose();
        }
    };

    const handleStatusChange = (newStatus) => {
        if (newStatus === "Sanctioned" && (!existingSanction)) {
            // Open sanction modal instead of just changing dropdown if no sanction exists
            setIsImposeSanctionOpen(true);
            return;
        }
        setStatus(newStatus);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsSubmitting(true);
        setSuccessMsg(null);
        setErrorMsg(null);

        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw new Error("Authentication error. Please log in again.");

            if (newEvidenceFiles.length > 0) {
                setIsUploadingEvidence(true);
                const evidenceInsertData = [];
                for (const file of newEvidenceFiles) {
                    try {
                        const folderId = "1G2uqwZBMuwdoZg5-Ic7K0ODZNip3LxqN"; // Violation evidence folder
                        const uploadResult = await uploadEvidenceToGDrive(file, folderId);
                        evidenceInsertData.push({
                            violation_id: violationData.violation_id,
                            file_name: file.name,
                            file_url: uploadResult.webViewLink || uploadResult.webContentLink,
                            file_type: file.type || 'application/octet-stream',
                            uploaded_by: user.id
                        });
                    } catch (uploadError) {
                        console.error(`Error uploading ${file.name}:`, uploadError);
                        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
                    }
                }

                if (evidenceInsertData.length > 0) {
                    const { error: evidenceError } = await supabase
                        .from('violation_evidence_sv')
                        .insert(evidenceInsertData);

                    if (evidenceError) {
                        throw new Error("Failed to link new evidence to violation.");
                    }
                }
                setIsUploadingEvidence(false);
            }

            const { error } = await supabase
                .from('violations_sv')
                .update({ status, updated_by: user.id })
                .eq('violation_id', violationData.violation_id);

            if (error) throw error;

            setSuccessMsg("Violation status updated successfully!");
            setTimeout(() => {
                handleOpenChange(false);
                if (onSuccess) onSuccess();
            }, 1500);
        } catch (error) {
            console.error("Error updating violation:", error);
            setErrorMsg(`Failed to update violation: ${error.message || 'Unknown error'}`);
        } finally {
            setIsUploadingEvidence(false);
        }
    };

    if (!violationData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-hidden flex flex-col bg-white border-neutral-200 text-neutral-900 p-0 shadow-lg rounded-xl">
                <div className="px-6 py-3 border-b border-neutral-100">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-neutral-900 tracking-tight">Manage Violation</DialogTitle>
                        <DialogDescription className="text-neutral-500 font-medium">
                            View details and update the status for this violation record.
                        </DialogDescription>
                    </DialogHeader>

                    {errorMsg && (
                        <div className="bg-red-50 border border-red-200 text-destructive-semantic p-3 rounded-md flex items-start gap-3 mt-4 text-sm font-medium">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p>{errorMsg}</p>
                        </div>
                    )}

                    {successMsg && (
                        <div className="bg-emerald-50 border border-emerald-200 text-success p-3 rounded-md flex items-center gap-3 mt-4 text-sm font-medium">
                            <CheckCircle2 className="w-5 h-5" />
                            <p>{successMsg}</p>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-0 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                        <div className="space-y-1">
                            <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider">Student Name</p>
                            <p className="font-bold text-neutral-900">{violationData.name}</p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider">Section/Course</p>
                            <p className="font-bold text-neutral-900">{violationData.section}</p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider">Violation Type</p>
                            <p className="font-bold text-neutral-900">{violationData.violation}</p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider">Incident Date/Time</p>
                            <p className="font-bold text-neutral-900">
                                {formatLongDate(violationData.incident_date)}
                                {violationData.incident_time ? ` at ${violationData.incident_time}` : ''}
                            </p>
                        </div>

                        <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-3 mt-2">
                            <div className="space-y-1">
                                <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider">Description / Remarks</p>
                                <p className="text-neutral-700 italic">{violationData.description || 'No additional description provided.'}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider">Location</p>
                                <p className="text-neutral-700">{violationData.location || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Read-only Audit Block */}
                        <div className="col-span-2 bg-white border border-neutral-200 rounded-md p-3 grid grid-cols-2 gap-3 text-xs mt-1">
                            <div>
                                <p className="text-neutral-500 uppercase tracking-wider font-bold mb-0.5">Violation Reported</p>
                                <p className="text-neutral-900 font-bold">
                                    {formatLongDateTime(violationData.created_at)}
                                </p>
                                <p className="text-neutral-500 font-medium">by {violationData.reported_by_name}</p>
                            </div>
                            <div>
                                <p className="text-neutral-500 uppercase tracking-wider font-bold mb-0.5">Last Modified</p>
                                <p className="text-neutral-900 font-bold">
                                    {formatLongDateTime(violationData.updated_at)}
                                </p>
                                <p className="text-neutral-500 font-medium">by {violationData.updated_by_name}</p>
                            </div>
                        </div>

                        <div className="col-span-2 space-y-2 border-t border-neutral-100 pt-3 mt-1">
                            <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider">Attached Evidence</p>
                            {isLoadingEvidence ? (
                                <div className="flex items-center gap-2 text-neutral-500 font-medium">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Loading evidence...</span>
                                </div>
                            ) : evidenceList.length > 0 ? (
                                <div className="space-y-2 mt-2">
                                    {evidenceList.map((file) => (
                                        <div key={file.evidence_id} className="flex items-center gap-2">
                                            <a
                                                href={file.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 flex items-center justify-between p-2.5 rounded-md bg-neutral-50 border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="p-1.5 bg-white shadow-sm border border-neutral-100 rounded text-primary-500 shrink-0">
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-neutral-700 font-medium truncate text-xs group-hover:text-primary-700 transition-colors">
                                                        {file.file_name}
                                                    </span>
                                                </div>
                                                <ExternalLink className="w-4 h-4 shrink-0 text-neutral-400 group-hover:text-primary-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm" />
                                            </a>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteEvidence(file.evidence_id)}
                                                className="h-10 w-10 text-neutral-400 hover:text-destructive-semantic hover:bg-red-50 shrink-0"
                                                title="Delete evidence"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-3 rounded-md border border-neutral-200 border-dashed bg-neutral-50/50 text-neutral-500 text-center text-xs italic font-medium">
                                    No evidence files attached to this violation.
                                </div>
                            )}
                        </div>

                        {existingSanction && (
                            <div className="col-span-2 space-y-2 border-t border-neutral-100 pt-4 mt-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                    <p className="font-bold text-neutral-900">Active Sanction</p>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-100 rounded-md p-4 grid grid-cols-2 gap-3 text-sm shadow-sm">
                                    <div>
                                        <p className="text-neutral-500 text-xs uppercase tracking-wider font-bold mb-1">Action</p>
                                        <p className="text-emerald-700 font-bold">{existingSanction.penalty_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-500 text-xs uppercase tracking-wider font-bold mb-1">Status</p>
                                        <p className="text-neutral-700 font-medium">{existingSanction.status}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-neutral-500 text-xs uppercase tracking-wider font-bold mb-1">Duration / Deadline</p>
                                        <p className="text-neutral-700 font-medium">
                                            {formatLongDate(existingSanction.start_date)} {existingSanction.deadline_date ? ` to ${formatLongDate(existingSanction.deadline_date)}` : ''}
                                        </p>
                                    </div>
                                    {existingSanction.description && (
                                        <div className="col-span-2 mt-1">
                                            <p className="text-neutral-500 text-xs uppercase tracking-wider font-bold mb-1">Conditions</p>
                                            <p className="text-neutral-600 italic text-xs font-medium">{existingSanction.description}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="col-span-2 space-y-3 border-t border-neutral-100 pt-3 mt-4">
                            <Label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Add Additional Evidence</Label>
                            <div className="flex flex-col gap-3">
                                <Input
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    className="bg-white border-neutral-200 text-neutral-600 file:bg-primary-50 hover:file:bg-primary-100 file:text-primary-700 file:font-bold file:border-0 file:mr-4 file:px-4 file:py-2 file:rounded-md transition-all cursor-pointer h-11 pt-[6px]"
                                    accept="image/*,video/*,.pdf,.doc,.docx"
                                />

                                {newEvidenceFiles.length > 0 && (
                                    <div className="space-y-2 mt-2">
                                        <p className="text-xs text-neutral-500 font-bold">New files to upload ({newEvidenceFiles.length}):</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {newEvidenceFiles.map((file, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2 rounded-md border border-neutral-200 bg-neutral-50">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <FileText className="w-4 h-4 text-primary-500 shrink-0" />
                                                        <span className="text-xs font-medium text-neutral-700 truncate" title={file.name}>
                                                            {file.name}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeNewFile(idx)}
                                                        className="p-1 rounded text-neutral-400 hover:bg-neutral-200 hover:text-destructive-semantic transition-colors shrink-0"
                                                        title="Remove file"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-neutral-100 bg-neutral-50 shrink-0 rounded-b-xl">
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-2 mb-6">
                            <Label htmlFor="status" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Update Status</Label>
                            <Select value={status} onValueChange={handleStatusChange}>
                                <SelectTrigger className="w-full bg-white border-neutral-200 h-9 text-sm text-neutral-900 focus:ring-primary-500 shadow-sm">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-neutral-200 text-neutral-900 shadow-lg">
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Under Investigation">Under Investigation</SelectItem>
                                    <SelectItem value="Sanctioned">Sanctioned</SelectItem>
                                    <SelectItem value="Resolved">Resolved</SelectItem>
                                    <SelectItem value="Dismissed">Dismissed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="ghost" className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 font-bold" onClick={() => handleOpenChange(false)}>Close</Button>
                            <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-md" disabled={isSubmitting || (status === violationData.status && newEvidenceFiles.length === 0)}>
                                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                {isUploadingEvidence ? 'Uploading...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </div>

            </DialogContent>

            {/* Nested Modal for imposing sanctions */}
            <ImposeSanctionModal
                isOpen={isImposeSanctionOpen}
                onClose={() => setIsImposeSanctionOpen(false)}
                onSuccess={() => {
                    // Refresh data after sanction is added
                    handleOpenChange(false);
                    if (onSuccess) onSuccess();
                }}
                violationData={violationData}
            />
        </Dialog>
    );
}
