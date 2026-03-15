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
import { CheckCircle2, AlertCircle, Loader2, UploadCloud, X, FileText, ExternalLink } from "lucide-react";
import { uploadEvidenceToGDrive } from "../services/gdriveEvidenceUpload";

export function ManageSanctionModal({ isOpen, onClose, onSuccess, sanctionData }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const [status, setStatus] = useState("In Progress");
    const [remarks, setRemarks] = useState("");
    const [completionDate, setCompletionDate] = useState("");

    // Evidence State
    const [file, setFile] = useState(null);
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
        setFile(null);
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

            // Include Upload Step if File Exists & Completed
            let fileUploadLink = null;
            let fileName = null;

            if (status === 'Completed' && file) {
                setIsSubmitting(true);
                setIsUploading(true);
                // The folder ID is specific to compliance evidences
                const FOLDER_ID = "13UiX0iHK_MzubFv_pnnrUJs1p49soA2c";
                const uploadResult = await uploadEvidenceToGDrive(file, FOLDER_ID);
                fileUploadLink = uploadResult.webViewLink || uploadResult.webContentLink;
                fileName = uploadResult.name;
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

            // If a file was uploaded successfully, record it in compliance_evidence_sv
            if (fileUploadLink) {
                const { error: evidenceError } = await supabase
                    .from('compliance_evidence_sv')
                    .insert([{
                        sanction_id: sanctionData.sanction_id,
                        file_name: fileName,
                        file_url: fileUploadLink,
                        notes: remarks || null,
                        uploaded_by: user.id
                    }]);

                if (evidenceError) {
                    throw new Error("Sanction updated but failed to save evidence record: " + evidenceError.message);
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
            <DialogContent className="max-w-md bg-white border-neutral-200 text-neutral-900 p-0 overflow-hidden shadow-lg rounded-xl" style={{ maxWidth: "500px" }}>
                <div className="p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl font-bold text-neutral-900 tracking-tight">Manage Sanction</DialogTitle>
                        <DialogDescription className="text-neutral-500 font-medium">
                            Update the status and progress of this disciplinary action.
                        </DialogDescription>
                    </DialogHeader>

                    {errorMsg && (
                        <div className="bg-red-50 border border-red-200 text-destructive-semantic p-3 rounded-md flex items-start gap-3 mb-4 text-xs font-medium">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <p>{errorMsg}</p>
                        </div>
                    )}

                    {successMsg && (
                        <div className="bg-emerald-50 border border-emerald-200 text-success p-3 rounded-md flex items-center gap-3 mb-4 text-xs font-medium">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <p>{successMsg}</p>
                        </div>
                    )}

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
                                {sanctionData.original_data?.created_at
                                    ? new Date(sanctionData.original_data.created_at).toLocaleString()
                                    : 'N/A'}
                            </p>
                            <p className="text-neutral-500 font-medium">by {assignedByName}</p>
                        </div>
                        <div>
                            <p className="text-neutral-500 uppercase tracking-wider font-bold mb-0.5">Last Modified</p>
                            <p className="text-neutral-900 font-bold">
                                {sanctionData.original_data?.updated_at
                                    ? new Date(sanctionData.original_data.updated_at).toLocaleString()
                                    : 'N/A'}
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
                                    <a
                                        key={file.compliance_id}
                                        href={file.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-2.5 rounded-md bg-neutral-50 border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
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
                                    {!file ? (
                                        <div className="border border-dashed border-neutral-300 rounded-lg p-4 flex flex-col items-center justify-center bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer group relative">
                                            <input
                                                type="file"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={(e) => setFile(e.target.files[0])}
                                            />
                                            <UploadCloud className="w-6 h-6 text-neutral-400 group-hover:text-primary-500 mb-2 transition-colors" />
                                            <p className="text-xs text-neutral-600 font-medium text-center">
                                                <span className="text-primary-600 font-bold">Click to upload</span> or drag and drop
                                            </p>
                                            <p className="text-[10px] text-neutral-500 mt-1">PDF, JPG, PNG, DOCX</p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-lg shadow-sm">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="bg-primary-50 p-2 rounded-md shrink-0">
                                                    <FileText className="w-4 h-4 text-primary-600" />
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-sm font-bold text-neutral-900 truncate">{file.name}</p>
                                                    <p className="text-xs text-neutral-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-neutral-500 hover:text-destructive-semantic hover:bg-red-50 shrink-0"
                                                onClick={() => setFile(null)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
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

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-100">
                            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 h-9 px-4 text-sm font-bold">
                                Close
                            </Button>
                            <Button form="manage-sanction-form" type="submit" className="bg-primary-600 hover:bg-primary-700 text-white h-9 px-6 text-sm font-bold shadow-md shadow-primary-900/10" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                {isUploading ? 'Uploading...' : 'Update Status'}
                            </Button>
                        </div>
                    </form>
                </div>


            </DialogContent>
        </Dialog>
    );
}
