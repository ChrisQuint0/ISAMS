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
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
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
        status: "",
    });

    // Validation Helpers
    const validateStudentNumber = (val) => /^\d{2}-\d{5}$/.test(val);
    const validateName = (val) => /^[a-zA-Z\s\-\.\u00C0-\u017F]+$/.test(val);
    const validateContact = (val) => /^09\d{9}$/.test(val);
    const validateEmail = (val) => /^[^\s@]+@plpasig\.edu\.ph$/.test(val);
    
    const standardizeStatus = (val) => {
        if (!val) return null;
        const allowed = ["Enrolled", "LOA", "Graduated", "Dropped", "Expelled"];
        return allowed.find(a => a.toLowerCase() === val.trim().toLowerCase()) || null;
    };

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
            status: "",
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
        const { student_number, first_name, last_name, email, course_year_section, guardian_name, guardian_contact, status } = formData;
        
        if (!student_number || !first_name || !last_name || !email || !course_year_section || !guardian_name || !guardian_contact || !status) {
            setErrorMsg("Please fill in all required fields.");
            return false;
        }

        if (!validateStudentNumber(student_number)) {
            setErrorMsg("Student Number must be exactly in 'xx-xxxxx' format (numbers only).");
            return false;
        }
        if (!validateEmail(email)) {
            setErrorMsg("Email Address must be a valid institutional account ending with '@plpasig.edu.ph'.");
            return false;
        }
        if (!validateName(first_name)) {
            setErrorMsg("First Name must only contain letters, spaces, hyphens, and diacritics.");
            return false;
        }
        if (!validateName(last_name)) {
            setErrorMsg("Last Name must only contain letters, spaces, hyphens, and diacritics.");
            return false;
        }
        if (!validateName(guardian_name)) {
            setErrorMsg("Guardian Name must only contain letters, spaces, hyphens, and diacritics.");
            return false;
        }
        if (!validateContact(guardian_contact)) {
            setErrorMsg("Guardian Contact must start with '09' and be exactly 11 digits.");
            return false;
        }
        if (!standardizeStatus(status)) {
            setErrorMsg("Status must be Enrolled, LOA, Graduated, Dropped, or Expelled.");
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
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw new Error("Authentication error. Please log in again.");

            const insertPayload = {
                student_number: formData.student_number.trim(),
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                email: formData.email.trim(),
                course_year_section: formData.course_year_section.trim(),
                guardian_name: formData.guardian_name.trim(),
                guardian_contact: formData.guardian_contact.trim(),
                status: standardizeStatus(formData.status),
                created_by: user.id
            };

            const { error } = await supabase.from('students_sv').insert([insertPayload]);

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

    const handleFileUpload = async (e) => {
        const selectedFile = e.target.files[0];
        setErrorMsg(null);
        setSuccessMsg(null);
        setParsedData(null);

        if (selectedFile) {
            const fileName = selectedFile.name.toLowerCase();
            const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
            const isCSV = fileName.endsWith('.csv');

            if (!isExcel && !isCSV) {
                setErrorMsg("Please upload a valid Excel or CSV file.");
                setFile(null);
                return;
            }
            setFile(selectedFile);

            if (isCSV) {
                Papa.parse(selectedFile, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const data = results.data;
                        validateAndSetData(data);
                    },
                    error: (error) => {
                        setErrorMsg(`Error parsing CSV: ${error.message}`);
                    }
                });
            } else {
                try {
                    const workbook = new ExcelJS.Workbook();
                    const arrayBuffer = await selectedFile.arrayBuffer();
                    await workbook.xlsx.load(arrayBuffer);
                    const worksheet = workbook.getWorksheet(1);
                    const data = [];
                    const headers = [];

                    worksheet.getRow(1).eachCell((cell) => {
                        headers.push(cell.value);
                    });

                    worksheet.eachRow((row, rowNumber) => {
                        if (rowNumber === 1) return;
                        const rowData = {};
                        row.eachCell((cell, colNumber) => {
                            rowData[headers[colNumber - 1]] = cell.value;
                        });
                        data.push(rowData);
                    });

                    validateAndSetData(data);
                } catch (error) {
                    console.error("Excel parse error:", error);
                    setErrorMsg("Error parsing Excel file. Please ensure it's a valid .xlsx file.");
                }
            }
        }
    };

    const validateAndSetData = (data) => {
        if (data.length === 0) {
            setErrorMsg("The file is empty.");
            return;
        }

        const errors = [];

        // Validate headers
        const requiredHeaders = ['Student Number', 'First Name', 'Last Name', 'Course/Year/Section', 'Email', 'Guardian Name', 'Guardian Contact', 'Status'];
        const headers = Object.keys(data[0]);
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
            setErrorMsg(`Missing required headers: ${missingHeaders.join(', ')}`);
            return;
        }

        // Validate rows
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 1;
            
            for (const h of requiredHeaders) {
                if (!row[h] || String(row[h]).trim() === '') {
                    errors.push(`Row ${rowNum}: Missing value for '${h}'.`);
                }
            }

            const studentNum = String(row['Student Number'] || '').trim();
            if (studentNum && !validateStudentNumber(studentNum)) {
                errors.push(`Row ${rowNum}: Student Number must be exactly in 'xx-xxxxx' format (numbers only).`);
            }

            const email = String(row['Email'] || '').trim();
            if (email && !validateEmail(email)) {
                errors.push(`Row ${rowNum}: Email Address must be a valid institutional account ending with '@plpasig.edu.ph'.`);
            }

            const firstName = String(row['First Name'] || '').trim();
            if (firstName && !validateName(firstName)) {
                errors.push(`Row ${rowNum}: First Name must only contain letters, spaces, hyphens, and diacritics.`);
            }

            const lastName = String(row['Last Name'] || '').trim();
            if (lastName && !validateName(lastName)) {
                errors.push(`Row ${rowNum}: Last Name must only contain letters, spaces, hyphens, and diacritics.`);
            }

            const guardianName = String(row['Guardian Name'] || '').trim();
            if (guardianName && !validateName(guardianName)) {
                errors.push(`Row ${rowNum}: Guardian Name must only contain letters, spaces, hyphens, and diacritics.`);
            }

            const guardianContact = String(row['Guardian Contact'] || '').trim();
            if (guardianContact && !validateContact(guardianContact)) {
                errors.push(`Row ${rowNum}: Guardian Contact must start with '09' and be exactly 11 digits.`);
            }

            const status = String(row['Status'] || '').trim();
            if (status && !standardizeStatus(status)) {
                errors.push(`Row ${rowNum}: Status must be Enrolled, LOA, Graduated, Dropped, or Expelled.`);
            }
        }

        if (errors.length > 0) {
            setErrorMsg(errors);
            setParsedData(null);
            return;
        }

        setParsedData(data);
    };

    const submitBulk = async () => {
        if (!parsedData || parsedData.length === 0) return;

        setIsSubmitting(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw new Error("Authentication error. Please log in again.");

            const insertData = parsedData.map(row => ({
                student_number: String(row['Student Number']).trim(),
                first_name: String(row['First Name']).trim(),
                last_name: String(row['Last Name']).trim(),
                email: String(row['Email']).trim(),
                course_year_section: String(row['Course/Year/Section']).trim(),
                guardian_name: String(row['Guardian Name']).trim(),
                guardian_contact: String(row['Guardian Contact']).trim(),
                status: standardizeStatus(String(row['Status'])),
                created_by: user.id
            }));

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

    const downloadTemplate = async () => {
        const templateHeaders = [
            "Student Number",
            "First Name",
            "Last Name",
            "Course/Year/Section",
            "Email",
            "Guardian Name",
            "Guardian Contact",
            "Status"
        ];

        const mockData = ["23-00201", "Juan", "dela Cruz", "BSIT-3A", "juan@plpasig.edu.ph", "Maria dela Cruz", "09123456789", "Enrolled"];

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Student Template");

            // Add headers with styling
            const headerRow = worksheet.addRow(templateHeaders);
            headerRow.eachCell((cell) => {
                cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FF4F46E5" } // Indigo-600 to match theme
                };
                cell.alignment = { horizontal: "center" };
            });

            // Add mock data row
            worksheet.addRow(mockData);

            // Auto-width columns
            worksheet.columns.forEach((column, i) => {
                let maxLen = templateHeaders[i].length + 5;
                column.width = maxLen;
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const defaultFilename = "student_import_template.xlsx";

            if (window.__TAURI_INTERNALS__) {
                const { save } = await import("@tauri-apps/plugin-dialog");
                const { invoke } = await import("@tauri-apps/api/core");

                const filePath = await save({
                    defaultPath: defaultFilename,
                    filters: [{ name: "Excel Spreadsheet", extensions: ["xlsx"] }]
                });

                if (filePath) {
                    const uint8Array = new Uint8Array(buffer);
                    await invoke("save_file_binary", { path: filePath, content: Array.from(uint8Array) });
                    setSuccessMsg("Template downloaded successfully.");
                }
            } else {
                const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                saveAs(blob, defaultFilename);
            }
        } catch (err) {
            console.error("Failed to download template:", err);
            setErrorMsg("Failed to generate template file.");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto bg-white border-neutral-200 text-neutral-900 shadow-lg rounded-xl scrollbar-hide">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-neutral-900 tracking-tight">Add new student</DialogTitle>
                    <DialogDescription className="text-neutral-500 font-medium">
                        Add a student to the registry manually or upload an Excel/CSV file for multiple entries.
                    </DialogDescription> 
                </DialogHeader>

                {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-destructive-semantic p-3 rounded-md flex items-start gap-3 mt-4 text-sm font-medium">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            {Array.isArray(errorMsg) ? (
                                <div className="space-y-1">
                                    <p className="font-bold underline mb-1">Upload Errors Found ({errorMsg.length}):</p>
                                    <ul className="list-disc list-inside space-y-0.5 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                        {errorMsg.map((msg, idx) => (
                                            <li key={idx} className="text-[12px]">{msg}</li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p>{errorMsg}</p>
                            )}
                        </div>
                    </div>
                )}

                {successMsg && (
                    <div className="bg-emerald-50 border border-emerald-200 justify-center text-success p-3 rounded-md flex items-center gap-3 mt-4 text-sm font-medium">
                        <CheckCircle2 className="w-5 h-5" />
                        <p>{successMsg}</p>
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                    <TabsList className="grid w-full grid-cols-2 bg-neutral-100 border border-neutral-200 h-11 p-1 rounded-lg">
                        <TabsTrigger value="single" className="data-[state=active]:bg-white data-[state=active]:text-primary-600 data-[state=active]:shadow-sm text-neutral-500 hover:text-neutral-900 rounded-md transition-all font-bold">Single Entry</TabsTrigger>
                        <TabsTrigger value="bulk" className="data-[state=active]:bg-white data-[state=active]:text-primary-600 data-[state=active]:shadow-sm text-neutral-500 hover:text-neutral-900 rounded-md transition-all font-bold">Bulk Upload</TabsTrigger>
                    </TabsList>

                    <TabsContent value="single" className="mt-6 space-y-4">
                        <form onSubmit={submitSingle} className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="student_number" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Student Number <span className="text-destructive-semantic">*</span></Label>
                                <Input id="student_number" name="student_number" value={formData.student_number} onChange={handleInputChange} className="bg-white border-neutral-200 focus-visible:ring-primary-500 h-9 text-sm text-neutral-900 placeholder:text-neutral-400" placeholder="e.g. 23-00201" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="first_name" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">First Name <span className="text-destructive-semantic">*</span></Label>
                                <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleInputChange} className="bg-white border-neutral-200 focus-visible:ring-primary-500 h-9 text-sm text-neutral-900 placeholder:text-neutral-400" placeholder="Juan" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="last_name" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Last Name <span className="text-destructive-semantic">*</span></Label>
                                <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleInputChange} className="bg-white border-neutral-200 focus-visible:ring-primary-500 h-9 text-sm text-neutral-900 placeholder:text-neutral-400" placeholder="dela Cruz" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="course_year_section" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Course & Section <span className="text-destructive-semantic">*</span></Label>
                                <Input id="course_year_section" name="course_year_section" value={formData.course_year_section} onChange={handleInputChange} className="bg-white border-neutral-200 focus-visible:ring-primary-500 h-9 text-sm text-neutral-900 placeholder:text-neutral-400" placeholder="BSIT-3A" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Email Address <span className="text-destructive-semantic">*</span></Label>
                                <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} className="bg-white border-neutral-200 focus-visible:ring-primary-500 h-9 text-sm text-neutral-900 placeholder:text-neutral-400" placeholder="juan@student.edu.ph" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="guardian_name" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Guardian Name <span className="text-destructive-semantic">*</span></Label>
                                <Input id="guardian_name" name="guardian_name" value={formData.guardian_name} onChange={handleInputChange} className="bg-white border-neutral-200 focus-visible:ring-primary-500 h-9 text-sm text-neutral-900 placeholder:text-neutral-400" placeholder="Maria dela Cruz" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="guardian_contact" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Guardian Contact <span className="text-destructive-semantic">*</span></Label>
                                <Input id="guardian_contact" name="guardian_contact" value={formData.guardian_contact} onChange={handleInputChange} className="bg-white border-neutral-200 focus-visible:ring-primary-500 h-9 text-sm text-neutral-900 placeholder:text-neutral-400" placeholder="09123456789" />
                            </div>

                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="status" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Status <span className="text-destructive-semantic">*</span></Label>
                                <select id="status" name="status" value={formData.status} onChange={handleInputChange} className="w-full flex h-9 rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500">
                                    <option value="" disabled>Select Status</option>
                                    <option value="Enrolled">Enrolled</option>
                                    <option value="LOA">LOA</option>
                                    <option value="Graduated">Graduated</option>
                                    <option value="Dropped">Dropped</option>
                                    <option value="Expelled">Expelled</option>
                                </select>
                            </div>

                            <div className="col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-neutral-100">
                                <Button type="button" variant="ghost" className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 font-bold" onClick={() => handleOpenChange(false)}>Cancel</Button>
                                <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-md" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    Save Student
                                </Button>
                            </div>
                        </form>
                    </TabsContent>

                    <TabsContent value="bulk" className="mt-6">
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 flex flex-col items-center justify-center bg-neutral-50 hover:bg-neutral-100 transition-colors">
                                <UploadCloud className="w-10 h-10 text-neutral-400 mb-4" />
                                <Label htmlFor="file_upload" className="cursor-pointer text-primary-600 hover:text-primary-700 hover:underline text-center font-bold">
                                    Click to browse Excel or CSV file
                                    <Input id="file_upload" type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                                </Label>
                                <p className="text-xs font-medium text-neutral-500 mt-2">Maximum file size 5MB</p>

                                {file && (
                                    <div className="mt-4 p-2 bg-primary-50 border border-primary-200 rounded text-primary-700 font-medium text-sm flex items-center justify-between w-full max-w-xs">
                                        <span className="truncate pr-4">{file.name}</span>
                                        {parsedData && <span className="shrink-0 text-xs bg-primary-100 px-2 py-0.5 rounded font-bold">{parsedData.length} valid rows</span>}
                                    </div>
                                )}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={downloadTemplate}
                                className="w-full bg-white border-neutral-200 text-neutral-600 hover:text-primary-700 hover:bg-primary-50 font-bold"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download Template
                            </Button>

                            <div className="bg-neutral-50 p-5 rounded-xl border border-neutral-200">
                                <h4 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-4 bg-primary-600 rounded-full" />
                                    Data Formatting Guide
                                </h4>
                                <div className="space-y-3">
                                    {/* <div className="flex flex-col gap-1">
                                        <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Required Headers</span>
                                        <p className="text-[11px] text-neutral-600 leading-relaxed">
                                            <code className="bg-white border px-1.5 py-0.5 rounded text-primary-700">Student Number</code>, 
                                            <code className="bg-white border px-1.5 py-0.5 rounded text-primary-700">First Name</code>, 
                                            <code className="bg-white border px-1.5 py-0.5 rounded text-primary-700">Last Name</code>, 
                                            <code className="bg-white border px-1.5 py-0.5 rounded text-primary-700">Course/Year/Section</code>, 
                                            <code className="bg-white border px-1.5 py-0.5 rounded text-primary-700">Email</code>, 
                                            <code className="bg-white border px-1.5 py-0.5 rounded text-primary-700">Guardian Name</code>, 
                                            <code className="bg-white border px-1.5 py-0.5 rounded text-primary-700">Guardian Contact</code>, 
                                            <code className="bg-white border px-1.5 py-0.5 rounded text-primary-700">Status</code>
                                        </p>
                                    </div> */}
                                    <div className="grid grid-cols-2 gap-4 pt-1">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Student Number</span>
                                            <p className="text-[11px] font-medium text-neutral-600 italic">Format: 23-00001 (Digits only)</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Email</span>
                                            <p className="text-[11px] font-medium text-neutral-600 italic">Must end with @plpasig.edu.ph</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Names & Guardians</span>
                                            <p className="text-[11px] font-medium text-neutral-600 italic">Letters, spaces, & hyphens only</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Guardian Contact</span>
                                            <p className="text-[11px] font-medium text-neutral-600 italic">Format: 09XXXXXXXXX (11 digits)</p>
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Acceptable Statuses</span>
                                            <p className="text-[11px] font-medium text-neutral-600 italic">Enrolled, LOA, Graduated, Dropped, Expelled</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                                <Button type="button" variant="ghost" className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 font-bold" onClick={() => handleOpenChange(false)}>Cancel</Button>
                                <Button type="button" className="bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-md" disabled={!parsedData || isSubmitting} onClick={submitBulk}>
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
