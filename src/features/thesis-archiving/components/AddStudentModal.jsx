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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    UserPlus,
    Users,
    ChevronRight,
    FileSpreadsheet,
    User,
    Mail,
    Lock,
    GraduationCap,
    School,
    ShieldCheck,
    Upload,
    X,
    CheckCircle2,
    Loader2
} from "lucide-react";
import { thesisService } from "../services/thesisService";
import { useToast } from "@/components/ui/toast/toaster";

const PROGRAMS = [
    { value: "Computer Science", label: "Computer Science" },
    { value: "Information Technology", label: "Information Technology" }
];

const SECTIONS = ["4A", "4B", "4C", "4D"];

export default function AddStudentModal({ open, onOpenChange }) {
    const [view, setView] = useState("selection"); // "selection" | "single" | "batch"
    const [loading, setLoading] = useState(false);
    const [advisers, setAdvisers] = useState([]);
    const [fetchingAdvisers, setFetchingAdvisers] = useState(false);
    const { addToast } = useToast();

    // Single Entry States
    const [formData, setFormData] = useState({
        studentId: "",
        firstName: "",
        middleName: "",
        lastName: "",
        adviser: "",
        section: "",
        program: "",
        email: "",
        password: ""
    });

    // Batch Entry States
    const [batchFile, setBatchFile] = useState(null);

    useEffect(() => {
        if (open) {
            fetchAdvisers();
        } else {
            // Reset modal state on close
            setView("selection");
            setFormData({
                studentId: "",
                firstName: "",
                middleName: "",
                lastName: "",
                adviser: "",
                section: "",
                program: "",
                email: "",
                password: ""
            });
            setBatchFile(null);
        }
    }, [open]);

    const fetchAdvisers = async () => {
        setFetchingAdvisers(true);
        try {
            const data = await thesisService.getAdvisers();
            setAdvisers(data);
        } catch (error) {
            console.error("Failed to fetch advisers:", error);
        } finally {
            setFetchingAdvisers(false);
        }
    };

    const handleSingleSubmit = async (e) => {
        e.preventDefault();

        // Simple validation for Student ID format (e.g., 23-00163)
        const idRegex = /^\d{2}-\d{5}$/;
        if (!idRegex.test(formData.studentId)) {
            addToast({
                title: "Invalid Format",
                description: "Student ID must be in the format XX-XXXXX (e.g., 23-00163)",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            addToast({
                title: "Student Account Created",
                description: `Successfully created account for ${formData.firstName} ${formData.lastName}.`,
                variant: "success"
            });
            onOpenChange(false);
        }, 1500);
    };

    const handleBatchSubmit = (e) => {
        e.preventDefault();
        if (!batchFile) return;

        setLoading(true);
        // Simulate Batch Processing
        setTimeout(() => {
            setLoading(false);
            addToast({
                title: "Batch Processing Complete",
                description: `Successfully imported students from ${batchFile.name}.`,
                variant: "success"
            });
            onOpenChange(false);
        }, 2000);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setBatchFile(e.target.files[0]);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white text-neutral-900 border border-neutral-200">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-500 p-6 text-white">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                                {view === "selection" ? <UserPlus className="h-5 w-5" /> :
                                    view === "single" ? <User className="h-5 w-5" /> :
                                        <FileSpreadsheet className="h-5 w-5" />}
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">
                                    {view === "selection" ? "Add New Student" :
                                        view === "single" ? "Single Entry Registration" :
                                            "Batch Student Import"}
                                </DialogTitle>
                                <DialogDescription className="text-white/80 text-sm mt-0.5">
                                    {view === "selection" ? "Choose how you want to add students to the system" :
                                        view === "single" ? "Register a single student account" :
                                            "Upload a CSV or Excel file to add multiple students"}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                {/* Breadcrumbs (only if not in selection view) */}
                {view !== "selection" && (
                    <div className="px-6 py-3 border-b border-neutral-100 flex items-center gap-2 text-xs font-medium text-neutral-500 bg-neutral-50/50">
                        <button
                            onClick={() => setView("selection")}
                            className="hover:text-primary-600 transition-colors"
                        >
                            Add Student
                        </button>
                        <ChevronRight className="h-3 w-3" />
                        <span className="text-primary-600">{view === "single" ? "Single Entry" : "Batch Entry"}</span>
                    </div>
                )}

                <div className="p-6">
                    {view === "selection" && (
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setView("single")}
                                className="flex flex-col items-center justify-center p-8 rounded-xl border border-neutral-200 bg-white hover:border-primary-500 hover:bg-primary-50/50 transition-all group"
                            >
                                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <User className="h-6 w-6 text-primary-600" />
                                </div>
                                <span className="font-bold text-neutral-900">Single Entry</span>
                                <span className="text-xs text-neutral-500 mt-2 text-center">Add a student one by one via form</span>
                            </button>

                            <button
                                onClick={() => setView("batch")}
                                className="flex flex-col items-center justify-center p-8 rounded-xl border border-neutral-200 bg-white hover:border-primary-500 hover:bg-primary-50/50 transition-all group"
                            >
                                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Users className="h-6 w-6 text-primary-600" />
                                </div>
                                <span className="font-bold text-neutral-900">Batch Entry</span>
                                <span className="text-xs text-neutral-500 mt-2 text-center">Import multiple students from CSV/XLSX</span>
                            </button>
                        </div>
                    )}

                    {view === "single" && (
                        <form onSubmit={handleSingleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-px flex-1 bg-neutral-200" />
                                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Student Information</span>
                                    <div className="h-px flex-1 bg-neutral-200" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="studentId" className="text-xs font-semibold">Student ID <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="studentId"
                                            placeholder="23-00163"
                                            required
                                            value={formData.studentId}
                                            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                            className="h-9 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="program" className="text-xs font-semibold">Program <span className="text-red-500">*</span></Label>
                                        <Select
                                            value={formData.program}
                                            onValueChange={(v) => setFormData({ ...formData, program: v })}
                                            required
                                        >
                                            <SelectTrigger className="h-9 text-sm">
                                                <SelectValue placeholder="Select Program" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PROGRAMS.map(p => (
                                                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="firstName" className="text-xs font-semibold">First Name</Label>
                                        <Input
                                            id="firstName"
                                            required
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            className="h-9 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="middleName" className="text-xs font-semibold">Middle Name</Label>
                                        <Input
                                            id="middleName"
                                            value={formData.middleName}
                                            onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                                            className="h-9 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="lastName" className="text-xs font-semibold">Last Name</Label>
                                        <Input
                                            id="lastName"
                                            required
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            className="h-9 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="adviser" className="text-xs font-semibold">Adviser</Label>
                                        <Select
                                            value={formData.adviser}
                                            onValueChange={(v) => setFormData({ ...formData, adviser: v })}
                                            required
                                        >
                                            <SelectTrigger className="h-9 text-sm">
                                                <SelectValue placeholder={fetchingAdvisers ? "Loading..." : "Select Adviser"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {advisers.map(a => (
                                                    <SelectItem key={a.id} value={a.id}>{a.display_name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="section" className="text-xs font-semibold">Section</Label>
                                        <Select
                                            value={formData.section}
                                            onValueChange={(v) => setFormData({ ...formData, section: v })}
                                            required
                                        >
                                            <SelectTrigger className="h-9 text-sm">
                                                <SelectValue placeholder="Select Section" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SECTIONS.map(s => (
                                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-px flex-1 bg-neutral-200" />
                                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Account Credentials</span>
                                    <div className="h-px flex-1 bg-neutral-200" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-xs font-semibold">Email Address <span className="text-red-500">*</span></Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                            <Input
                                                id="email"
                                                type="email"
                                                required
                                                placeholder="quinto_christopher@plpasig.edu.ph"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="h-9 pl-9 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="password" className="text-xs font-semibold">Initial Password <span className="text-red-500">*</span></Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                            <Input
                                                id="password"
                                                type="password"
                                                required
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="h-9 pl-9 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 flex items-start gap-3">
                                <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-blue-900">Privilege Notice</p>
                                    <p className="text-[10px] text-blue-700 mt-0.5 leading-relaxed">
                                        This will create a student account with <strong>Thesis Archiving</strong> privilege and <strong>Student</strong> role.
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setView("selection")}
                                    disabled={loading}
                                    className="h-9"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="h-9 bg-primary-600 hover:bg-primary-700 min-w-[140px]"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Register Student"
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}

                    {view === "batch" && (
                        <div className="space-y-6">
                            <div className="p-6 border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50/50 flex flex-col items-center justify-center text-center group hover:border-primary-400 transition-colors">
                                <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Upload className="h-8 w-8 text-primary-500" />
                                </div>
                                <h4 className="text-sm font-bold text-neutral-900">Drop your file here or click to upload</h4>
                                <p className="text-xs text-neutral-500 mt-1 max-w-[240px]">
                                    Only .csv, .xlsx, or .xls files are supported for student batch import.
                                </p>
                                <input
                                    type="file"
                                    id="batch-file"
                                    className="hidden"
                                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                    onChange={handleFileChange}
                                />
                                <Button
                                    variant="outline"
                                    className="mt-6 h-9"
                                    onClick={() => document.getElementById('batch-file').click()}
                                >
                                    Select File
                                </Button>
                            </div>

                            {batchFile && (
                                <div className="p-4 rounded-lg border border-primary-200 bg-primary-50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded bg-white flex items-center justify-center border border-primary-100">
                                            <FileSpreadsheet className="h-6 w-6 text-primary-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-neutral-900">{batchFile.name}</p>
                                            <p className="text-xs text-neutral-500">{(batchFile.size / 1024).toFixed(2)} KB</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setBatchFile(null)}
                                        className="p-1 hover:bg-primary-100 rounded text-neutral-500"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            )}

                            <div className="space-y-4">
                                <h5 className="text-xs font-bold text-neutral-700 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    Required Format Columns
                                </h5>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 px-6">
                                    {["Student ID", "First Name", "Middle Name", "Last Name", "Adviser", "Section", "Program", "Email", "Password"].map(col => (
                                        <div key={col} className="flex items-center gap-2 text-[10px] text-neutral-600">
                                            <div className="h-1 w-1 rounded-full bg-neutral-400" />
                                            {col}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setView("selection")}
                                    disabled={loading}
                                    className="h-9"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleBatchSubmit}
                                    disabled={loading || !batchFile}
                                    className="h-9 bg-primary-600 hover:bg-primary-700 min-w-[140px]"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        "Start Import"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
