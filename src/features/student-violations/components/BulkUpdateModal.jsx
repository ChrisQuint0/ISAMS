import React, { useState, useEffect, useRef } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { CheckCircle2, AlertCircle, Loader2, Users, ArrowRight } from "lucide-react";

export function BulkUpdateModal({ isOpen, onClose, onSuccess, selectedStudents = [] }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const errorRef = useRef(null);

    // Auto-scroll to error message when it appears
    useEffect(() => {
        if (errorMsg && errorRef.current) {
            errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [errorMsg]);

    // Field toggles — the user opts-in to which fields to update
    const [updateStatus, setUpdateStatus] = useState(false);
    const [updateSection, setUpdateSection] = useState(false);

    // Field values
    const [newStatus, setNewStatus] = useState("Enrolled");
    const [newSection, setNewSection] = useState("");

    const resetState = () => {
        setErrorMsg(null);
        setSuccessMsg(null);
        setIsSubmitting(false);
        setUpdateStatus(false);
        setUpdateSection(false);
        setNewStatus("Enrolled");
        setNewSection("");
    };

    const handleOpenChange = (open) => {
        if (!open) {
            resetState();
            onClose();
        }
    };

    const handleSubmit = async () => {
        // Validate at least one field is toggled
        if (!updateStatus && !updateSection) {
            setErrorMsg("Please select at least one field to update.");
            return;
        }

        if (updateSection && !newSection.trim()) {
            setErrorMsg("Please enter a new Course/Year/Section value.");
            return;
        }

        if (selectedStudents.length === 0) {
            setErrorMsg("No students selected.");
            return;
        }

        setIsSubmitting(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw new Error("Authentication error. Please log in again.");

            // Build the update payload with only the toggled fields
            const updatePayload = { updated_by: user.id };
            if (updateStatus) updatePayload.status = newStatus;
            if (updateSection) updatePayload.course_year_section = newSection.trim();

            const studentIds = selectedStudents.map(s => s.id);

            const { error } = await supabase
                .from('students_sv')
                .update(updatePayload)
                .in('student_number', studentIds);

            if (error) throw error;

            const fieldNames = [];
            if (updateStatus) fieldNames.push("status");
            if (updateSection) fieldNames.push("section");

            setSuccessMsg(`Successfully updated ${fieldNames.join(" & ")} for ${studentIds.length} student${studentIds.length > 1 ? 's' : ''}!`);
            setTimeout(() => {
                handleOpenChange(false);
                if (onSuccess) onSuccess();
            }, 1500);
        } catch (error) {
            console.error("Bulk update error:", error);
            setErrorMsg(`Update failed: ${error.message || 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasChanges = updateStatus || updateSection;

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[520px] max-h-[90vh] flex flex-col bg-white border-neutral-200 text-neutral-900 shadow-lg rounded-xl p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-3 shrink-0 border-b border-neutral-100">
                    <DialogTitle className="text-xl font-bold text-neutral-900 tracking-tight">Bulk update students</DialogTitle>
                    <DialogDescription className="text-neutral-500 font-medium">
                        Apply changes to <strong className="text-neutral-900">{selectedStudents.length}</strong> selected student{selectedStudents.length !== 1 ? 's' : ''}.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-5 scrollbar-hide">
                    {/* Error / Success Alerts */}
                    {errorMsg && (
                        <div ref={errorRef} className="bg-red-50 border border-red-200 text-destructive-semantic p-3 rounded-md flex items-start gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <p>{errorMsg}</p>
                        </div>
                    )}

                    {successMsg && (
                        <div className="bg-emerald-50 border border-emerald-200 justify-center text-success p-3 rounded-md flex items-center gap-3 text-sm font-medium">
                            <CheckCircle2 className="w-5 h-5" />
                            <p>{successMsg}</p>
                        </div>
                    )}

                    {/* Selected Students Preview */}
                    <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-3.5 h-3.5 text-neutral-500" />
                            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">Selected Students</span>
                        </div>
                        <div className="max-h-[120px] overflow-y-auto scrollbar-hide space-y-1">
                            {selectedStudents.map((student) => (
                                <div key={student.id} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-neutral-100 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-neutral-400 text-[10px]">{student.id}</span>
                                        <span className="font-semibold text-neutral-800">{student.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-neutral-400 text-[10px] font-medium">{student.course}</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                            student.status === 'Enrolled' ? 'bg-success/10 text-success' :
                                            student.status === 'Graduated' ? 'bg-info/10 text-info' :
                                            student.status === 'LOA' ? 'bg-warning/10 text-warning' :
                                            'bg-destructive-semantic/10 text-destructive-semantic'
                                        }`}>{student.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Update Fields */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-4 bg-primary-600 rounded-full" />
                            <span className="text-sm font-bold text-neutral-900">Choose fields to update</span>
                        </div>

                        {/* Status Field */}
                        <div className={`rounded-lg border p-4 transition-all duration-200 ${updateStatus ? 'border-primary-300 bg-primary-50/50 shadow-sm' : 'border-neutral-200 bg-white'}`}>
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    id="toggle-status"
                                    checked={updateStatus}
                                    onCheckedChange={setUpdateStatus}
                                    className="data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600"
                                />
                                <Label htmlFor="toggle-status" className="text-sm font-bold text-neutral-800 cursor-pointer select-none">
                                    Update Enrollment Status
                                </Label>
                            </div>
                            {updateStatus && (
                                <div className="mt-3 pl-7 animate-in slide-in-from-top-1 fade-in duration-200">
                                    <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 block">New Status</Label>
                                    <Select value={newStatus} onValueChange={setNewStatus}>
                                        <SelectTrigger className="w-full bg-white border-neutral-200 focus:ring-primary-500 h-9 text-sm text-neutral-900">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-neutral-200 text-neutral-900">
                                            <SelectItem value="Enrolled">Enrolled</SelectItem>
                                            <SelectItem value="LOA">LOA</SelectItem>
                                            <SelectItem value="Graduated">Graduated</SelectItem>
                                            <SelectItem value="Dropped">Dropped</SelectItem>
                                            <SelectItem value="Expelled">Expelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] text-neutral-400 mt-1.5 font-medium">
                                        All {selectedStudents.length} selected students will be set to <strong className="text-neutral-600">{newStatus}</strong>.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Section Field */}
                        <div className={`rounded-lg border p-4 transition-all duration-200 ${updateSection ? 'border-primary-300 bg-primary-50/50 shadow-sm' : 'border-neutral-200 bg-white'}`}>
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    id="toggle-section"
                                    checked={updateSection}
                                    onCheckedChange={setUpdateSection}
                                    className="data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600"
                                />
                                <Label htmlFor="toggle-section" className="text-sm font-bold text-neutral-800 cursor-pointer select-none">
                                    Update Course / Year / Section
                                </Label>
                            </div>
                            {updateSection && (
                                <div className="mt-3 pl-7 animate-in slide-in-from-top-1 fade-in duration-200">
                                    <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 block">New Section</Label>
                                    <Input
                                        value={newSection}
                                        onChange={(e) => setNewSection(e.target.value)}
                                        className="bg-white border-neutral-200 focus-visible:ring-primary-500 h-9 text-sm text-neutral-900 placeholder:text-neutral-400"
                                        placeholder="e.g. BSIT-4A"
                                    />
                                    <p className="text-[10px] text-neutral-400 mt-1.5 font-medium">
                                        All {selectedStudents.length} selected students will be moved to this section.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Summary */}
                    {hasChanges && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 animate-in fade-in duration-200">
                            <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Confirm your changes
                            </p>
                            <div className="mt-2 space-y-1">
                                {updateStatus && (
                                    <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1.5">
                                        <ArrowRight className="w-3 h-3 shrink-0" />
                                        Status will change to <strong>{newStatus}</strong> for {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''}
                                    </p>
                                )}
                                {updateSection && newSection.trim() && (
                                    <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1.5">
                                        <ArrowRight className="w-3 h-3 shrink-0" />
                                        Section will change to <strong>{newSection.trim()}</strong> for {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-neutral-100 flex justify-end gap-3 shrink-0 bg-white">
                    <Button
                        type="button"
                        variant="ghost"
                        className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 font-bold"
                        onClick={() => handleOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        className="bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-md"
                        disabled={!hasChanges || isSubmitting}
                        onClick={handleSubmit}
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Update {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
