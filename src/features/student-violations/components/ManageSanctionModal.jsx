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
            <DialogContent className="sm:max-w-[500px] bg-white border-neutral-200 text-neutral-900 p-0 overflow-hidden shadow-lg rounded-xl">
                <div className="p-6 border-b border-neutral-100">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-neutral-900 tracking-tight">Manage Sanction</DialogTitle>
                        <DialogDescription className="text-neutral-500 font-medium">
                            Update the status and progress of this disciplinary action.
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

                <div className="p-6 space-y-6">
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-3 text-sm shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider">Student</p>
                                <p className="text-neutral-900 font-bold">{sanctionData.student_name}</p>
                            </div>
                            <div>
                                <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider">Action</p>
                                <p className="text-neutral-900 font-bold">{sanctionData.sanction_name}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-neutral-500 text-xs uppercase font-bold tracking-wider mt-1">Conditions</p>
                                <p className="text-neutral-600 italic text-sm">{sanctionData.original_data?.description || 'None'}</p>
                            </div>
                        </div>
                    </div>

                    <form id="manage-sanction-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="status" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Sanction Status</Label>
                            <Select value={status} onValueChange={handleStatusChange}>
                                <SelectTrigger className="w-full bg-white border-neutral-200 h-9 text-sm text-neutral-900 focus:ring-primary-500">
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
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                <Label htmlFor="completionDate" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Date Completed *</Label>
                                <Input
                                    id="completionDate"
                                    type="date"
                                    value={completionDate}
                                    onChange={(e) => setCompletionDate(e.target.value)}
                                    className="bg-white border-neutral-200 h-9 text-sm text-neutral-900 focus-visible:ring-primary-500"
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="remarks" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Remarks / Notes</Label>
                            <Textarea
                                id="remarks"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Any additional notes about the student's compliance..."
                                className="bg-white border-neutral-200 min-h-[80px] text-sm text-neutral-900 resize-none focus-visible:ring-primary-500 placeholder:text-neutral-400"
                            />
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-neutral-100 bg-neutral-50 rounded-b-xl">
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="ghost" className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 font-bold" onClick={() => handleOpenChange(false)}>Close</Button>
                        <Button form="manage-sanction-form" type="submit" className="bg-warning hover:bg-amber-600 text-white font-bold shadow-md" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Update Status
                        </Button>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}
