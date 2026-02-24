import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import Papa from "papaparse";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, Download } from "lucide-react";

export function AddStudentModal({ isOpen, onClose, onSuccess }) {
    const [activeTab, setActiveTab] = useState("single");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // Single Entry State
    const [formData, setFormData] = useState({
        student_number: "",
        first_name: "",
        last_name: "",
        email: "",
        course_year_section: "",
        guardian_name: "",
        guardian_contact: "",
    });

    // Bulk Upload State
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState(null);

    const resetState = () => {
        setFormData({
            student_number: "",
            first_name: "",
            last_name: "",
            email: "",
            course_year_section: "",
            guardian_name: "",
            guardian_contact: "",
        });
        setFile(null);
        setParsedData(null);
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

    const validateSingleForm = () => {
        if (!formData.student_number || !formData.first_name || !formData.last_name || !formData.course_year_section) {
            setErrorMsg("Please fill in all required fields (Student Number, First Name, Last Name, Course/Year/Section).");
            return false;
        }
        setErrorMsg(null);
        return true;
    };

    const submitSingle = async (e) => {
        e.preventDefault();
        if (!validateSingleForm()) return;

        setIsSubmitting(true);
        setSuccessMsg(null);

        try {
            const { error } = await supabase.from('students_sv').insert([{
                ...formData,
                status: 'Enrolled' // Default status
            }]);

            if (error) throw error;

            setSuccessMsg("Student added successfully!");
            setTimeout(() => {
                handleOpenChange(false);
                if (onSuccess) onSuccess();
            }, 1500);
        } catch (error) {
            console.error("Error adding student:", error);
            setErrorMsg(`Failed to add student: ${error.message || 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = (e) => {
        const selectedFile = e.target.files[0];
        setErrorMsg(null);
        setSuccessMsg(null);
        setParsedData(null);

        if (selectedFile) {
            if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith('.csv')) {
                setErrorMsg("Please upload a valid CSV file.");
                setFile(null);
                return;
            }
            setFile(selectedFile);

            Papa.parse(selectedFile, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const data = results.data;
                    if (data.length === 0) {
                        setErrorMsg("The CSV file is empty.");
                        return;
                    }

                    // Validate headers
                    const requiredHeaders = ['student_number', 'first_name', 'last_name', 'course_year_section'];
                    const headers = Object.keys(data[0]);
                    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

                    if (missingHeaders.length > 0) {
                        setErrorMsg(`Missing required headers: ${missingHeaders.join(', ')}`);
                        return;
                    }

                    setParsedData(data);
                },
                error: (error) => {
                    setErrorMsg(`Error parsing CSV: ${error.message}`);
                }
            });
        }
    };

    const submitBulk = async () => {
        if (!parsedData || parsedData.length === 0) return;

        setIsSubmitting(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            const insertData = parsedData.map(row => ({
                student_number: row.student_number?.trim(),
                first_name: row.first_name?.trim(),
                last_name: row.last_name?.trim(),
                email: row.email?.trim() || null,
                course_year_section: row.course_year_section?.trim(),
                guardian_name: row.guardian_name?.trim() || null,
                guardian_contact: row.guardian_contact?.trim() || null,
                status: row.status?.trim() || 'Enrolled'
            })).filter(row => row.student_number && row.first_name && row.last_name && row.course_year_section);

            if (insertData.length === 0) {
                throw new Error("No valid rows found to insert. Ensure required fields are not empty.");
            }

            const { error } = await supabase.from('students_sv').insert(insertData);

            if (error) throw error;

            setSuccessMsg(`Successfully imported ${insertData.length} students!`);
            setTimeout(() => {
                handleOpenChange(false);
                if (onSuccess) onSuccess();
            }, 1500);
        } catch (error) {
            console.error("Error bulk inserting students:", error);
            setErrorMsg(`Bulk import failed: ${error.message || 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const downloadTemplate = () => {
        const templateHeaders = [
            "student_number",
            "first_name",
            "last_name",
            "course_year_section",
            "email",
            "guardian_name",
            "guardian_contact",
            "status"
        ];

        const mockData = [
            ["23-00201", "Juan", "dela Cruz", "BSIT-3A", "juan@example.edu.ph", "Maria dela Cruz", "09123456789", "Enrolled"]
        ];

        const csvContent = Papa.unparse({
            fields: templateHeaders,
            data: mockData
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "student_import_template.csv");
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[550px] bg-slate-900 border-slate-800 text-slate-200">
                <DialogHeader>
                    <DialogTitle className="text-xl text-white">Add new student</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Add a student to the registry manually or upload a CSV file for multiple entries.
                    </DialogDescription> 
                </DialogHeader>

                {errorMsg && (
                    <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-3 rounded-md flex items-start gap-3 mt-4 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>{errorMsg}</p>
                    </div>
                )}

                {successMsg && (
                    <div className="bg-emereald-500/10 border border-emerald-500/50 justify-center text-emerald-400 p-3 rounded-md flex items-center gap-3 mt-4 text-sm">
                        <CheckCircle2 className="w-5 h-5" />
                        <p>{successMsg}</p>
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-950 border border-slate-800 p-1">
                        <TabsTrigger value="single" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white transition-all">Single Entry</TabsTrigger>
                        <TabsTrigger value="bulk" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white transition-all">Bulk CSV Upload</TabsTrigger>
                    </TabsList>

                    <TabsContent value="single" className="mt-4 space-y-4">
                        <form onSubmit={submitSingle} className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="student_number" className="text-slate-300">Student Number *</Label>
                                <Input id="student_number" name="student_number" value={formData.student_number} onChange={handleInputChange} className="bg-slate-950 border-slate-700" placeholder="e.g. 23-00201" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="first_name" className="text-slate-300">First Name *</Label>
                                <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleInputChange} className="bg-slate-950 border-slate-700" placeholder="Juan" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="last_name" className="text-slate-300">Last Name *</Label>
                                <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleInputChange} className="bg-slate-950 border-slate-700" placeholder="dela Cruz" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="course_year_section" className="text-slate-300">Course & Section *</Label>
                                <Input id="course_year_section" name="course_year_section" value={formData.course_year_section} onChange={handleInputChange} className="bg-slate-950 border-slate-700" placeholder="BSIT-3A" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                                <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} className="bg-slate-950 border-slate-700" placeholder="juan@student.edu.ph" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="guardian_name" className="text-slate-300">Guardian Name</Label>
                                <Input id="guardian_name" name="guardian_name" value={formData.guardian_name} onChange={handleInputChange} className="bg-slate-950 border-slate-700" placeholder="Maria dela Cruz" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="guardian_contact" className="text-slate-300">Guardian Contact</Label>
                                <Input id="guardian_contact" name="guardian_contact" value={formData.guardian_contact} onChange={handleInputChange} className="bg-slate-950 border-slate-700" placeholder="09123456789" />
                            </div>

                            <div className="col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-800">
                                <Button type="button" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => handleOpenChange(false)}>Cancel</Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    Save Student
                                </Button>
                            </div>
                        </form>
                    </TabsContent>

                    <TabsContent value="bulk" className="mt-4">
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 flex flex-col items-center justify-center bg-slate-950/50 hover:bg-slate-800/50 transition-colors">
                                <UploadCloud className="w-10 h-10 text-slate-500 mb-4" />
                                <Label htmlFor="csv_upload" className="cursor-pointer text-slate-300 text-center font-medium">
                                    Click to browse CSV file
                                    <Input id="csv_upload" type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                                </Label>
                                <p className="text-xs text-slate-500 mt-2">Maximum file size 5MB</p>

                                {file && (
                                    <div className="mt-4 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-blue-400 text-sm flex items-center justify-between w-full max-w-xs">
                                        <span className="truncate pr-4">{file.name}</span>
                                        {parsedData && <span className="shrink-0 text-xs bg-blue-500/20 px-2 py-0.5 rounded">{parsedData.length} valid rows</span>}
                                    </div>
                                )}
                            </div>

                            <div className="bg-slate-950 p-4 rounded border border-slate-800 flex justify-between items-start gap-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-300 mb-2">CSV Format Requirements:</h4>
                                    <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                                        <li>Must include headers: <code className="text-blue-400">student_number</code>, <code className="text-blue-400">first_name</code>, <code className="text-blue-400">last_name</code>, <code className="text-blue-400">course_year_section</code></li>
                                        <li>Optional headers: <code className="text-slate-500">email</code>, <code className="text-slate-500">guardian_name</code>, <code className="text-slate-500">guardian_contact</code>, <code className="text-slate-500">status</code></li>
                                    </ul>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={downloadTemplate}
                                    className="shrink-0 bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Template
                                </Button>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
                                <Button type="button" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => handleOpenChange(false)}>Cancel</Button>
                                <Button type="button" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={!parsedData || isSubmitting} onClick={submitBulk}>
                                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    Import Students
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

            </DialogContent>
        </Dialog>
    );
}
