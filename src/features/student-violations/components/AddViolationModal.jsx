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
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

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
            const { data, error } = await supabase.from('offense_types_sv').select('offense_type_id, name, severity');

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

            const { error: insertError } = await supabase
                .from('violations_sv')
                .insert([insertData]);

            if (insertError) throw insertError;

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
            <DialogContent className="sm:max-w-[550px] bg-slate-900 border-slate-800 text-slate-200">
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

                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mt-4">
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
                                            <SelectItem key={offense.offense_type_id} value={offense.offense_type_id.toString()}>
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

                    <div className="col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-800">
                        <Button type="button" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => handleOpenChange(false)}>Cancel</Button>
                        <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm" disabled={isSubmitting || isLoadingData || studentValidationStatus !== 'valid'}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Report Violation
                        </Button>
                    </div>
                </form>

            </DialogContent>
        </Dialog>
    );
}
