import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function EditStudentModal({ isOpen, onClose, onSuccess, studentData }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        course_year_section: "",
        guardian_name: "",
        guardian_contact: "",
        status: "Enrolled"
    });

    useEffect(() => {
        if (studentData) {
            setFormData({
                first_name: studentData.first_name || "",
                last_name: studentData.last_name || "",
                email: studentData.email || "",
                course_year_section: studentData.course_year_section || studentData.course || "",
                guardian_name: studentData.guardian_name || studentData.guardian || "",
                guardian_contact: studentData.guardian_contact || studentData.guardianContact || "",
                status: studentData.status || "Enrolled"
            });
        }
    }, [studentData]);

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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleStatusChange = (value) => {
        setFormData((prev) => ({ ...prev, status: value }));
    };

    const validateForm = () => {
        if (!formData.first_name || !formData.last_name || !formData.course_year_section) {
            setErrorMsg("First Name, Last Name, and Course/Year/Section are required.");
            return false;
        }
        setErrorMsg(null);
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        setSuccessMsg(null);

        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw new Error("Authentication error. Please log in again.");

            const updatePayload = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email || null,
                course_year_section: formData.course_year_section,
                guardian_name: formData.guardian_name || null,
                guardian_contact: formData.guardian_contact || null,
                status: formData.status,
                updated_by: user.id
            };

            const { error } = await supabase
                .from('students_sv')
                .update(updatePayload)
                .eq('student_number', studentData.id);

            if (error) throw error;

            setSuccessMsg("Student updated successfully!");
            setTimeout(() => {
                handleOpenChange(false);
                if (onSuccess) onSuccess();
            }, 1500);
        } catch (error) {
            console.error("Error updating student:", error);
            setErrorMsg(`Failed to update student: ${error.message || 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[550px] bg-white border-neutral-200 text-neutral-900 shadow-lg rounded-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-neutral-900 tracking-tight">Edit Student Record</DialogTitle>
                    <DialogDescription className="text-neutral-500 font-medium">
                        Update the information for student ID <strong className="text-neutral-900">{studentData?.id}</strong>.
                    </DialogDescription>
                </DialogHeader>

                {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-destructive-semantic p-3 rounded-md flex items-start gap-3 mt-4 text-sm font-medium">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>{errorMsg}</p>
                    </div>
                )}

                {successMsg && (
                    <div className="bg-emerald-50 border border-emerald-200 justify-center text-success p-3 rounded-md flex items-center gap-3 mt-4 text-sm font-medium">
                        <CheckCircle2 className="w-5 h-5" />
                        <p>{successMsg}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="first_name" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">First Name <span className="text-destructive-semantic">*</span></Label>
                        <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleInputChange} className="bg-white border-neutral-200 focus-visible:ring-primary-500 h-9 text-sm text-neutral-900" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="last_name" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Last Name <span className="text-destructive-semantic">*</span></Label>
                        <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleInputChange} className="bg-white border-neutral-200 focus-visible:ring-primary-500 h-9 text-sm text-neutral-900" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="course_year_section" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Course & Section <span className="text-destructive-semantic">*</span></Label>
                        <Input id="course_year_section" name="course_year_section" value={formData.course_year_section} onChange={handleInputChange} className="bg-white border-neutral-200 focus-visible:ring-primary-500 h-9 text-sm text-neutral-900" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Email Address</Label>
                        <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} className="bg-white border-neutral-200 focus-visible:ring-primary-500 h-9 text-sm text-neutral-900" />
                    </div>

                    <div className="col-span-2 space-y-2 mt-2">
                        <Label htmlFor="status" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Enrollment Status</Label>
                        <Select value={formData.status} onValueChange={handleStatusChange}>
                            <SelectTrigger className="w-full bg-white border-neutral-200 focus:ring-primary-500 h-9 text-sm text-neutral-900">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-neutral-200 text-neutral-900">
                                <SelectItem value="Enrolled">Enrolled</SelectItem>
                                <SelectItem value="LOA">LOA</SelectItem>
                                <SelectItem value="Dropped">Dropped</SelectItem>
                                <SelectItem value="Expelled">Expelled</SelectItem>
                                <SelectItem value="Graduated">Graduated</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 mt-2 border-t border-neutral-100 pt-4">
                        <Label htmlFor="guardian_name" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Guardian Name</Label>
                        <Input id="guardian_name" name="guardian_name" value={formData.guardian_name} onChange={handleInputChange} className="bg-white border-neutral-200 focus-visible:ring-primary-500 h-9 text-sm text-neutral-900" />
                    </div>

                    <div className="space-y-2 mt-2 border-t border-neutral-100 pt-4">
                        <Label htmlFor="guardian_contact" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Guardian Contact</Label>
                        <Input id="guardian_contact" name="guardian_contact" value={formData.guardian_contact} onChange={handleInputChange} className="bg-white border-neutral-200 focus-visible:ring-primary-500 h-9 text-sm text-neutral-900" />
                    </div>

                    {studentData && (
                        <div className="col-span-2 bg-neutral-50/80 rounded-lg p-3.5 text-[11px] text-neutral-500 border border-neutral-200 mt-4 space-y-2.5">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-neutral-700 uppercase tracking-widest">Record Created</span>
                                <span>{studentData.created_at ? new Date(studentData.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown'} by <strong className="text-neutral-700">{studentData.created_by_name || 'System'}</strong></span>
                            </div>
                            <div className="flex justify-between items-center pt-2.5 border-t border-neutral-200/60">
                                <span className="font-bold text-neutral-700 uppercase tracking-widest">Last Modified</span>
                                <span>{studentData.updated_at ? new Date(studentData.updated_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Never'} by <strong className="text-neutral-700">{studentData.updated_by_name || 'System'}</strong></span>
                            </div>
                        </div>
                    )}

                    <div className="col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-neutral-100">
                        <Button type="button" variant="ghost" className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 font-bold" onClick={() => handleOpenChange(false)}>Cancel</Button>
                        <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-md" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Save Changes
                        </Button>
                    </div>
                </form>

            </DialogContent>
        </Dialog>
    );
}
