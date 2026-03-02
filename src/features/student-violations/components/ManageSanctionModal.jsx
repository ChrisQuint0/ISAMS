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
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function ManageSanctionModal({ isOpen, onClose, onSuccess, sanctionData }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const [status, setStatus] = useState("In Progress");
    const [remarks, setRemarks] = useState("");
    const [completionDate, setCompletionDate] = useState("");

    useEffect(() => {
        if (isOpen && sanctionData && sanctionData.original_data) {
            setStatus(sanctionData.original_data.status || "In Progress");
            setRemarks(sanctionData.original_data.remarks || "");
            setCompletionDate(sanctionData.original_data.completion_date || "");
        }
    }, [isOpen, sanctionData]);

    const resetState = () => {
        setErrorMsg(null);
        setSuccessMsg(null);
        setIsSubmitting(false);
        setStatus("In Progress");
        setRemarks("");
        setCompletionDate("");
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
            const { error } = await supabase
                .from('student_sanctions_sv')
                .update({
                    status,
                    remarks: remarks || null,
                    completion_date: completionDate || null
                })
                .eq('sanction_id', sanctionData.sanction_id);

            if (error) throw error;

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
        }
    };

    if (!sanctionData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-slate-200 p-0 overflow-hidden">
                <div className="p-6 border-b border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-white">Manage Sanction</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Update the status and progress of this disciplinary action.
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
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-slate-950 border border-slate-800 rounded-md p-4 space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <p className="text-slate-500 text-xs uppercase font-semibold">Student</p>
                                <p className="text-slate-200 font-medium">{sanctionData.student_name}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs uppercase font-semibold">Action</p>
                                <p className="text-slate-200">{sanctionData.sanction_name}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-slate-500 text-xs uppercase font-semibold mt-1">Conditions</p>
                                <p className="text-slate-400 italic text-xs">{sanctionData.original_data?.description || 'None'}</p>
                            </div>
                        </div>
                    </div>

                    <form id="manage-sanction-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="status" className="text-slate-300">Sanction Status</Label>
                            <Select value={status} onValueChange={handleStatusChange}>
                                <SelectTrigger className="w-full bg-slate-950 border-slate-700">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                    <SelectItem value="Overdue">Overdue</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {status === 'Completed' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                <Label htmlFor="completionDate" className="text-slate-300">Date Completed *</Label>
                                <Input
                                    id="completionDate"
                                    type="date"
                                    value={completionDate}
                                    onChange={(e) => setCompletionDate(e.target.value)}
                                    className="bg-slate-950 border-slate-700 text-slate-200 [color-scheme:dark]"
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="remarks" className="text-slate-300">Remarks / Notes</Label>
                            <Textarea
                                id="remarks"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Any additional notes about the student's compliance..."
                                className="bg-slate-950 border-slate-700 min-h-[80px] text-slate-200 resize-none"
                            />
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-slate-800 bg-slate-900/50">
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800" onClick={() => handleOpenChange(false)}>Close</Button>
                        <Button form="manage-sanction-form" type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Update Status
                        </Button>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}
