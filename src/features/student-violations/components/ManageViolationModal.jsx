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
import { supabase } from "@/lib/supabaseClient";
import { CheckCircle2, AlertCircle, Loader2, FileText, ExternalLink, ShieldCheck } from "lucide-react";
import { ImposeSanctionModal } from "./ImposeSanctionModal";

export function ManageViolationModal({ isOpen, onClose, onSuccess, violationData }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const [status, setStatus] = useState("Pending");

    const [evidenceList, setEvidenceList] = useState([]);
    const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);

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
            const { error } = await supabase
                .from('violations_sv')
                .update({ status })
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
            setIsSubmitting(false);
        }
    };

    if (!violationData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-hidden flex flex-col bg-white border-neutral-200 text-neutral-900 p-0 shadow-lg rounded-xl">
                <div className="p-6 border-b border-neutral-100">
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

                <div className="flex-1 overflow-y-auto p-6 pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
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
                                {violationData.incident_date ? new Date(violationData.incident_date).toLocaleDateString() : 'N/A'}
                                {violationData.incident_time ? ` at ${violationData.incident_time}` : ''}
                            </p>
                        </div>

                        <div className="col-span-2 space-y-1 border-t border-neutral-100 pt-3 mt-2">
                            <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider">Description / Remarks</p>
                            <p className="text-neutral-700 italic">{violationData.description || 'No additional description provided.'}</p>
                        </div>

                        <div className="col-span-2 space-y-1 border-t border-neutral-100 pt-3">
                            <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider">Location</p>
                            <p className="text-neutral-700">{violationData.location || 'N/A'}</p>
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
                                        <a
                                            key={file.evidence_id}
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
                                            {existingSanction.start_date || 'N/A'} {existingSanction.deadline_date ? ` to ${existingSanction.deadline_date}` : ''}
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
                            <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-md" disabled={isSubmitting || status === violationData.status}>
                                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Save Changes
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
