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
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function ManageViolationModal({ isOpen, onClose, onSuccess, violationData }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const [status, setStatus] = useState("Pending");

    useEffect(() => {
        if (violationData) {
            setStatus(violationData.status || "Pending");
        }
    }, [violationData]);

    const resetState = () => {
        setErrorMsg(null);
        setSuccessMsg(null);
        setIsSubmitting(false);
    };

    const handleOpenChange = (open) => {
        if (!open) {
            resetState();
            onClose();
        }
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
            <DialogContent className="sm:max-w-[550px] bg-slate-900 border-slate-800 text-slate-200">
                <DialogHeader>
                    <DialogTitle className="text-xl text-white">Manage Violation</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        View details and update the status for this violation record.
                    </DialogDescription>
                </DialogHeader>

                {errorMsg && (
                    <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-3 rounded-md flex items-start gap-3 mt-4 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>{errorMsg}</p>
                    </div>
                )}

                {successMsg && (
                    <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-3 rounded-md flex items-center gap-3 mt-4 text-sm">
                        <CheckCircle2 className="w-5 h-5" />
                        <p>{successMsg}</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div className="space-y-1">
                        <p className="text-slate-400">Student Name</p>
                        <p className="font-medium text-slate-200">{violationData.name}</p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-slate-400">Section/Course</p>
                        <p className="font-medium text-slate-200">{violationData.section}</p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-slate-400">Violation Type</p>
                        <p className="font-medium text-slate-200">{violationData.violation}</p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-slate-400">Incident Date/Time</p>
                        <p className="font-medium text-slate-200">
                            {violationData.incident_date ? new Date(violationData.incident_date).toLocaleDateString() : 'N/A'}
                            {violationData.incident_time ? ` at ${violationData.incident_time}` : ''}
                        </p>
                    </div>

                    <div className="col-span-2 space-y-1 border-t border-slate-800 pt-3">
                        <p className="text-slate-400">Description / Remarks</p>
                        <p className="text-slate-300 italic">{violationData.description || 'No additional description provided.'}</p>
                    </div>

                    <div className="col-span-2 space-y-1 border-t border-slate-800 pt-3">
                        <p className="text-slate-400">Location</p>
                        <p className="text-slate-300">{violationData.location || 'N/A'}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 border-t border-slate-800 pt-4">
                    <div className="space-y-2 mb-6">
                        <Label htmlFor="status" className="text-slate-300">Update Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-full bg-slate-950 border-slate-700">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Under Investigation">Under Investigation</SelectItem>
                                <SelectItem value="Sanctioned">Sanctioned</SelectItem>
                                <SelectItem value="Resolved">Resolved</SelectItem>
                                <SelectItem value="Dismissed">Dismissed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800" onClick={() => handleOpenChange(false)}>Close</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting || status === violationData.status}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Save Changes
                        </Button>
                    </div>
                </form>

            </DialogContent>
        </Dialog>
    );
}
