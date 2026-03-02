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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import { CheckCircle2, AlertCircle, Loader2, FileText, X } from "lucide-react";
import { uploadEvidenceToGDrive } from "../services/gdriveEvidenceUpload";

export function AddViolationModal({ isOpen, onClose, onSuccess }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const [offenseTypes, setOffenseTypes] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const severities = ["Major", "Minor", "Compliance"];
    const [selectedSeverity, setSelectedSeverity] = useState("");

    const [studentValidationStatus, setStudentValidationStatus] = useState('idle');
    const [studentName, setStudentName] = useState("");

    const [formData, setFormData] = useState({
        student_number: "",
        offense_type_id: "",
        incident_date: new Date().toISOString().split('T')[0],
        incident_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        location: "",
        description: "",
        status: "Pending",
    });

    const [evidenceFiles, setEvidenceFiles] = useState([]);

    useEffect(() => {
        if (isOpen) {
            fetchDropdownData();
        }
    }, [isOpen]);

    useEffect(() => {
        const checkStudent = async () => {
            if (!formData.student_number || formData.student_number.length < 3) {
                setStudentValidationStatus('idle');
                setStudentName("");
                return;
            }

            setStudentValidationStatus('loading');
            try {
                const { data, error } = await supabase
                    .from('students_sv')
                    .select('first_name, last_name, course_year_section')
                    .eq('student_number', formData.student_number)
                    .single();

                if (error || !data) {
                    setStudentValidationStatus('invalid');
                    setStudentName("");
                } else {
                    setStudentValidationStatus('valid');
                    setStudentName(`${data.first_name} ${data.last_name} (${data.course_year_section})`);
                }
            } catch (err) {
                setStudentValidationStatus('invalid');
                setStudentName("");
            }
        };

        const timerId = setTimeout(() => {
            checkStudent();
        }, 500); // 500ms debounce

        return () => clearTimeout(timerId);
    }, [formData.student_number]);

    const fetchDropdownData = async () => {
        setIsLoadingData(true);
        try {
            const { data, error } = await supabase.from('offense_types_sv').select('offense_type_id, name, severity, description');

            if (error) throw error;
            setOffenseTypes(data || []);
        } catch (error) {
            console.error("Error fetching offense types:", error);
            setErrorMsg("Failed to load offense types.");
        } finally {
            setIsLoadingData(false);
        }
    };

    const resetState = () => {
        setErrorMsg(null);
        setSuccessMsg(null);
        setIsSubmitting(false);
        setSelectedSeverity("");
        setStudentValidationStatus('idle');
        setStudentName("");
        setFormData({
            student_number: "",
            offense_type_id: "",
            incident_date: new Date().toISOString().split('T')[0],
            incident_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
            location: "",
            description: "",
            status: "Pending",
        });
        setEvidenceFiles([]);
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

    const handleSelectChange = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setEvidenceFiles(prev => [...prev, ...Array.from(e.target.files)]);
        }
        // Reset input value so the same file(s) can be selected again if removed
        e.target.value = null;
    };

    const removeFile = (indexToRemove) => {
        setEvidenceFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const validateForm = () => {
        if (!formData.student_number || !formData.offense_type_id || !formData.incident_date) {
            setErrorMsg("Student, Offense Type, and Incident Date are required.");
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
            // Validate that the student exists
            const { data: studentData, error: studentError } = await supabase
                .from('students_sv')
                .select('course_year_section, status')
                .eq('student_number', formData.student_number)
                .single();

            if (studentError || !studentData) {
                throw new Error("Student number not found in database.");
            }

            const insertData = {
                student_number: formData.student_number,
                offense_type_id: parseInt(formData.offense_type_id),
                incident_date: formData.incident_date,
                incident_time: formData.incident_time ? formData.incident_time + ":00" : null,
                location: formData.location || null,
                description: formData.description || null,
                student_course_year_section: studentData.course_year_section || null,
                status: formData.status
            };

            const { data: newViolation, error: insertError } = await supabase
                .from('violations_sv')
                .insert([insertData])
                .select()
                .single();

            if (insertError) throw insertError;

            // Handle evidence uploads if any files are selected
            if (evidenceFiles.length > 0) {
                const evidenceInsertData = [];

                for (const file of evidenceFiles) {
                    try {
                        // The user provided this specific folder ID in their prompt
                        const folderId = "1G2uqwZBMuwdoZg5-Ic7K0ODZNip3LxqN";

                        const uploadResult = await uploadEvidenceToGDrive(file, folderId);
                        evidenceInsertData.push({
                            violation_id: newViolation.violation_id,
                            file_name: file.name,
                            file_url: uploadResult.webViewLink,
                            file_type: file.type || 'application/octet-stream',
                        });
                    } catch (uploadError) {
                        console.error(`Error uploading ${file.name}:`, uploadError);
                        // Decide if you want to fail the whole process or just ignore this file.
                        // Here, we'll throw an error to notify the user.
                        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
                    }
                }

                if (evidenceInsertData.length > 0) {
                    const { error: evidenceError } = await supabase
                        .from('violation_evidence_sv')
                        .insert(evidenceInsertData);

                    if (evidenceError) {
                        console.error("Error linking multiple evidences:", evidenceError);
                        throw new Error("Violation Reported, but linking some evidence failed.");
                    }
                }
            }

            setSuccessMsg("Violation reported successfully!");
            setTimeout(() => {
                handleOpenChange(false);
                if (onSuccess) onSuccess();
            }, 1500);
        } catch (error) {
            console.error("Error reporting violation:", error);
            setErrorMsg(error.message || 'Failed to report violation.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-hidden flex flex-col bg-slate-900 border-slate-800 text-slate-200 p-0">
                <div className="p-6 border-b border-slate-800 shrink-0">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-white">Report Violation</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            File a new disciplinary violation record.
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
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            <p>{successMsg}</p>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 pt-4">
                    <form id="add-violation-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="student_number" className="text-slate-300">Student Number *</Label>
                            <Input
                                id="student_number"
                                name="student_number"
                                placeholder="e.g. 2023-00123"
                                value={formData.student_number}
                                onChange={handleInputChange}
                                className={`bg-slate-950 border-slate-700 transition-colors ${studentValidationStatus === 'invalid' ? 'border-rose-500 focus-visible:ring-rose-500' : ''} ${studentValidationStatus === 'valid' ? 'border-emerald-500 focus-visible:ring-emerald-500' : ''}`}
                            />
                            {studentValidationStatus === 'loading' && (
                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying student ID...
                                </p>
                            )}
                            {studentValidationStatus === 'valid' && (
                                <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1.5 font-medium">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Student found: {studentName}
                                </p>
                            )}
                            {studentValidationStatus === 'invalid' && (
                                <p className="text-xs text-rose-400 mt-1 flex items-center gap-1.5 font-medium">
                                    <AlertCircle className="w-3.5 h-3.5" /> Student ID not found in records.
                                </p>
                            )}
                        </div>

                        <div className="col-span-2 grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="severity" className="text-slate-300">Severity Group</Label>
                                <Select value={selectedSeverity} onValueChange={(val) => {
                                    setSelectedSeverity(val);
                                    setFormData(prev => ({ ...prev, offense_type_id: "" })); // Reset type when severity changes
                                }} disabled={isLoadingData}>
                                    <SelectTrigger className="w-full bg-slate-950 border-slate-700">
                                        <SelectValue placeholder={isLoadingData ? "Loading..." : "Select Severity"} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                                        {severities.map((sev) => (
                                            <SelectItem key={sev} value={sev}>
                                                {sev}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="offense_type_id" className="text-slate-300">Offense Type *</Label>
                                <Select value={formData.offense_type_id} onValueChange={(val) => handleSelectChange('offense_type_id', val)} disabled={!selectedSeverity || isLoadingData}>
                                    <SelectTrigger className="w-full bg-slate-950 border-slate-700">
                                        <SelectValue placeholder={
                                            isLoadingData ? "Loading offenses..." :
                                                !selectedSeverity ? "Select Severity first" :
                                                    "Select the violation type"
                                        } />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                                        {offenseTypes
                                            .filter(offense => offense.severity === selectedSeverity)
                                            .map((offense) => (
                                                <SelectItem
                                                    key={offense.offense_type_id}
                                                    value={offense.offense_type_id.toString()}
                                                    title={offense.description || "No description available."}
                                                >
                                                    {offense.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="incident_date" className="text-slate-300">Incident Date *</Label>
                            <Input
                                id="incident_date"
                                name="incident_date"
                                type="date"
                                value={formData.incident_date}
                                onChange={handleInputChange}
                                className="bg-slate-950 border-slate-700 [color-scheme:dark]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="incident_time" className="text-slate-300">Incident Time</Label>
                            <Input
                                id="incident_time"
                                name="incident_time"
                                type="time"
                                value={formData.incident_time}
                                onChange={handleInputChange}
                                className="bg-slate-950 border-slate-700 [color-scheme:dark]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status" className="text-slate-300">Initial Status *</Label>
                            <Select value={formData.status} onValueChange={(val) => handleSelectChange('status', val)} disabled={isSubmitting}>
                                <SelectTrigger className="w-full bg-slate-950 border-slate-700">
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Under Investigation">Under Investigation</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location" className="text-slate-300">Location</Label>
                            <Input
                                id="location"
                                name="location"
                                placeholder="Where did the incident occur?"
                                value={formData.location}
                                onChange={handleInputChange}
                                className="bg-slate-950 border-slate-700"
                            />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="description" className="text-slate-300">Description / Remarks</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Provide additional details about the incident..."
                                value={formData.description}
                                onChange={handleInputChange}
                                className="bg-slate-950 border-slate-700 min-h-[80px]"
                            />
                        </div>

                        <div className="col-span-2 space-y-3 mt-2">
                            <Label className="text-slate-300">Evidences (Optional)</Label>
                            <div className="flex flex-col gap-3">
                                <Input
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    className="bg-slate-950 border-slate-700 text-slate-300 file:bg-slate-800 file:text-slate-200 file:border-0 file:mr-4 file:px-4 file:py-2 file:rounded-md hover:file:bg-slate-700 transition-all cursor-pointer"
                                    accept="image/*,video/*,.pdf,.doc,.docx"
                                />

                                {evidenceFiles.length > 0 && (
                                    <div className="space-y-2 mt-2">
                                        <p className="text-xs text-slate-400 font-medium">Selected files ({evidenceFiles.length}):</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {evidenceFiles.map((file, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2 rounded border border-slate-700 bg-slate-800/50">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                                                        <span className="text-xs text-slate-300 truncate" title={file.name}>
                                                            {file.name}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(idx)}
                                                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors shrink-0"
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
                    </form>
                </div>

                <div className="p-6 border-t border-slate-800 bg-slate-900/50 shrink-0">
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800" onClick={() => handleOpenChange(false)}>Cancel</Button>
                        <Button form="add-violation-form" type="submit" className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm" disabled={isSubmitting || isLoadingData || studentValidationStatus !== 'valid'}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Report Violation
                        </Button>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}
