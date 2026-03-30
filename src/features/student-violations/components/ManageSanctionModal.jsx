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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { CheckCircle2, AlertCircle, Loader2, UploadCloud, X, FileText, ExternalLink, Trash2 } from "lucide-react";
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

export function ManageSanctionModal({ isOpen, onClose, onSuccess, sanctionData }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const [status, setStatus] = useState("In Progress");
    const [remarks, setRemarks] = useState("");
    const [completionDate, setCompletionDate] = useState("");

    // Evidence State
    const [newEvidenceFiles, setNewEvidenceFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    const [evidenceList, setEvidenceList] = useState([]);
    const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);

    // Audit trail names
    const [assignedByName, setAssignedByName] = useState('Unknown');
    const [updatedByName, setUpdatedByName] = useState('Unknown');

    useEffect(() => {
        if (isOpen && sanctionData && sanctionData.original_data) {
            setStatus(sanctionData.original_data.status || "In Progress");
            setRemarks(sanctionData.original_data.remarks || "");
            setCompletionDate(sanctionData.original_data.completion_date || "");
            fetchEvidence(sanctionData.sanction_id);
            resolveAuditNames(sanctionData.original_data);
        }
    }, [isOpen, sanctionData]);

    const resolveAuditNames = async (data) => {
        const uuids = [data.assigned_by, data.updated_by].filter(Boolean);
        if (uuids.length === 0) return;

        try {
            const { data: users, error } = await supabase
                .from('users_with_roles')
                .select('id, first_name, last_name')
                .in('id', uuids);

            if (error || !users) return;

            const map = {};
            users.forEach(u => { map[u.id] = `${u.first_name} ${u.last_name}`; });

            if (data.assigned_by && map[data.assigned_by]) setAssignedByName(map[data.assigned_by]);
            if (data.updated_by && map[data.updated_by]) setUpdatedByName(map[data.updated_by]);
        } catch (err) {
            console.error('Error resolving audit names:', err);
        }
    };

    const fetchEvidence = async (sanctionId) => {
        setIsLoadingEvidence(true);
        try {
            const { data, error } = await supabase
                .from('compliance_evidence_sv')
                .select('compliance_id, file_name, file_url')
                .eq('sanction_id', sanctionId)
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
        setStatus("In Progress");
        setRemarks("");
        setCompletionDate("");
        setNewEvidenceFiles([]);
        setIsUploading(false);
        setEvidenceList([]);
        setAssignedByName('Unknown');
        setUpdatedByName('Unknown');
    };

    const handleOpenChange = (open) => {
        if (!open) {
            resetState();
            onClose();
        }
    };

    const handleStatusChange = (val) => {
        setStatus(val);
        if (val === 'Completed' && !completionDate) {
            setCompletionDate(new Date().toISOString().split('T')[0]);
        } else if (val !== 'Completed') {
            setCompletionDate("");
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setNewEvidenceFiles(prev => [...prev, ...Array.from(e.target.files)]);
        }
        e.target.value = null;
    };

    const removeNewFile = (indexToRemove) => {
        setNewEvidenceFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleDeleteEvidence = async (evidenceId) => {
        const file = evidenceList.find(e => e.compliance_id === evidenceId);
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
                }
            }

            const { error } = await supabase
                .from('compliance_evidence_sv')
                .delete()
                .eq('compliance_id', evidenceId);

            if (error) throw error;
            
            setEvidenceList(prev => prev.filter(e => e.compliance_id !== evidenceId));
            setSuccessMsg("Evidence removed successfully.");
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err) {
            console.error("Error deleting evidence:", err);
            setErrorMsg("Failed to remove evidence.");
            setTimeout(() => setErrorMsg(null), 3000);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (status === 'Completed' && !completionDate) {
            setErrorMsg("Completion date is required when marking as Complete.");
            return;
        }

        setIsSubmitting(true);
        setSuccessMsg(null);
        setErrorMsg(null);

        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw new Error("Authentication error. Please log in again.");

            // Include Upload Step for Multiple Files
            const uploadedEvidences = [];

            if (status === 'Completed' && newEvidenceFiles.length > 0) {
                setIsSubmitting(true);
                setIsUploading(true);
                // The folder ID is specific to compliance evidences
                const FOLDER_ID = "13UiX0iHK_MzubFv_pnnrUJs1p49soA2c";
                
                for (const f of newEvidenceFiles) {
                    try {
                        const uploadResult = await uploadEvidenceToGDrive(f, FOLDER_ID);
                        uploadedEvidences.push({
                            file_name: uploadResult.name,
                            file_url: uploadResult.webViewLink || uploadResult.webContentLink,
                        });
                    } catch (uploadError) {
                        console.error(`Error uploading ${f.name}:`, uploadError);
                        throw new Error(`Failed to upload ${f.name}: ${uploadError.message}`);
                    }
                }
                setIsUploading(false);
            }

            const { error } = await supabase
                .from('student_sanctions_sv')
                .update({
                    status,
                    remarks: remarks || null,
                    completion_date: completionDate || null,
                    updated_by: user.id
                })
                .eq('sanction_id', sanctionData.sanction_id);

            if (error) throw error;

            // If files were uploaded successfully, record them in compliance_evidence_sv
            if (uploadedEvidences.length > 0) {
                const evidenceInsertData = uploadedEvidences.map(ev => ({
                    sanction_id: sanctionData.sanction_id,
                    file_name: ev.file_name,
                    file_url: ev.file_url,
                    notes: remarks || null,
                    uploaded_by: user.id
                }));

                const { error: evidenceError } = await supabase
                    .from('compliance_evidence_sv')
                    .insert(evidenceInsertData);

                if (evidenceError) {
                    throw new Error("Sanction updated but failed to save evidence records: " + evidenceError.message);
                }
            }

            setSuccessMsg("Sanction updated successfully!");
            setTimeout(() => {
                handleOpenChange(false);
                if (onSuccess) onSuccess();
            }, 1500);
        } catch (error) {
            console.error("Error updating sanction:", error);
            setErrorMsg(`Failed to update sanction: ${error.message || 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
            setIsUploading(false);
        }
    };

    if (!sanctionData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-hidden flex flex-col bg-white border-neutral-200 text-neutral-900 p-0 shadow-lg rounded-xl">
                <div className="px-6 py-4 border-b border-neutral-100 shrink-0">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-neutral-900 tracking-tight">Manage Sanction</DialogTitle>
                        <DialogDescription className="text-neutral-500 font-medium">
                            Update the status and progress of this disciplinary action.
                        </DialogDescription>
                    </DialogHeader>

                    {errorMsg && (
                        <div className="bg-red-50 border border-red-200 text-destructive-semantic p-3 rounded-md flex items-start gap-3 mt-4 text-xs font-medium">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <p>{errorMsg}</p>
                        </div>
                    )}

                    {successMsg && (
                        <div className="bg-emerald-50 border border-emerald-200 text-success p-3 rounded-md flex items-center gap-3 mt-4 text-xs font-medium">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <p>{successMsg}</p>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 grid grid-cols-2 gap-3 text-xs shadow-sm mb-4">
                        <div>
                            <p className="text-neutral-500 uppercase tracking-wider font-bold mb-0.5">Student</p>
                            <p className="text-neutral-900 font-bold">{sanctionData.student_name}</p>
                        </div>
                        <div>
                            <p className="text-neutral-500 uppercase tracking-wider font-bold mb-0.5">Action</p>
                            <p className="text-neutral-900 font-bold">{sanctionData.sanction_name}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-neutral-500 uppercase tracking-wider font-bold mb-0.5">Conditions</p>
                            <p className="text-neutral-600 italic font-medium">{sanctionData.original_data?.description || 'None'}</p>
                        </div>
                    </div>

                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 grid grid-cols-2 gap-3 text-xs shadow-sm mb-4">
                        <div>
                            <p className="text-neutral-500 uppercase tracking-wider font-bold mb-0.5">Sanction Assigned</p>
                            <p className="text-neutral-900 font-bold">
                                {formatLongDateTime(sanctionData.original_data?.created_at)}
                            </p>
                            <p className="text-neutral-500 font-medium">by {assignedByName}</p>
                        </div>
                        <div>
                            <p className="text-neutral-500 uppercase tracking-wider font-bold mb-0.5">Last Modified</p>
                            <p className="text-neutral-900 font-bold">
                                {formatLongDateTime(sanctionData.original_data?.updated_at)}
                            </p>
                            <p className="text-neutral-500 font-medium">by {updatedByName}</p>
                        </div>
                    </div>

                    <div className="space-y-2 mb-4">
                        <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider">Attached Evidence</p>
                        {isLoadingEvidence ? (
                            <div className="flex items-center gap-2 text-neutral-500 font-medium text-xs">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Loading evidence...</span>
                            </div>
                        ) : evidenceList.length > 0 ? (
                            <div className="space-y-2">
                                {evidenceList.map((file) => (
                                    <div key={file.compliance_id} className="flex items-center gap-2">
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
                                            onClick={() => handleDeleteEvidence(file.compliance_id)}
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
                                No evidence files attached to this sanction compliance.
                            </div>
                        )}
                    </div>

                    <form id="manage-sanction-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="status" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Sanction Status</Label>
                            <Select value={status} onValueChange={handleStatusChange}>
                                <SelectTrigger className="w-full bg-white border-neutral-200 focus:ring-primary-500 h-9 text-sm text-neutral-900">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-neutral-200 text-neutral-900">
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                    <SelectItem value="Overdue">Overdue</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {status === 'Completed' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                                <div className="space-y-1.5">
                                    <Label htmlFor="completionDate" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Date Completed <span className="text-destructive-semantic">*</span></Label>
                                    <Input
                                        id="completionDate"
                                        type="date"
                                        value={completionDate}
                                        onChange={(e) => setCompletionDate(e.target.value)}
                                        className="bg-white border-neutral-200 h-9 text-sm text-neutral-900 focus-visible:ring-primary-500"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Compliance Evidence (Optional)</Label>
                                    <div className="border border-dashed border-neutral-300 rounded-lg p-4 flex flex-col items-center justify-center bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer group relative">
                                        <input
                                            type="file"
                                            multiple
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <UploadCloud className="w-6 h-6 text-neutral-400 group-hover:text-primary-500 mb-2 transition-colors" />
                                        <p className="text-xs text-neutral-600 font-medium text-center">
                                            <span className="text-primary-600 font-bold">Click to upload</span> or drag and drop multiple files
                                        </p>
                                        <p className="text-[10px] text-neutral-500 mt-1">PDF, JPG, PNG, DOCX</p>
                                    </div>
                                    
                                    {newEvidenceFiles.length > 0 && (
                                        <div className="space-y-2 mt-3 animate-in fade-in slide-in-from-top-1">
                                            {newEvidenceFiles.map((f, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2.5 bg-white border border-neutral-200 rounded-lg shadow-sm">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="bg-primary-50 p-1.5 rounded-md shrink-0 border border-primary-100">
                                                            <FileText className="w-4 h-4 text-primary-600" />
                                                        </div>
                                                        <div className="truncate">
                                                            <p className="text-sm font-bold text-neutral-900 truncate">{f.name}</p>
                                                            <p className="text-[10px] text-neutral-500 font-medium">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-neutral-400 hover:text-destructive-semantic hover:bg-red-50 shrink-0"
                                                        onClick={() => removeNewFile(idx)}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="remarks" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Remarks / Notes</Label>
                            <Textarea
                                id="remarks"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Any additional notes about the student's compliance..."
                                className="bg-white border-neutral-200 min-h-[80px] text-sm text-neutral-900 resize-none focus-visible:ring-primary-500 placeholder:text-neutral-400"
                            />
                        </div>

                        <div className="hidden">
                             {/* Keep the submit handlers associated but move buttons to footer */}
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-neutral-100 bg-neutral-50 shrink-0 rounded-b-xl flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 font-bold">
                        Close
                    </Button>
                    <Button form="manage-sanction-form" type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-md" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        {isUploading ? 'Uploading...' : 'Update Status'}
                    </Button>
                </div>


            </DialogContent>
        </Dialog>
    );
}
