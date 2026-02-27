import React, { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {
    ShieldCheck,
    Monitor,
    Save,
    Database,
    RefreshCcw,
    Upload,
    Trash2,
    FileText
} from "lucide-react";
import SettingRow from "../components/settings/SettingRow";
import { readFile } from "@tauri-apps/plugin-fs";

export default function LabSettings() {
    const { labName } = useOutletContext();
    const [isSaving, setIsSaving] = useState(false);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
    const [selectedImportType, setSelectedImportType] = useState(null);
    const [selectedFileName, setSelectedFileName] = useState("");
    const [selectedFileSize, setSelectedFileSize] = useState(null);
    const [isDragActive, setIsDragActive] = useState(false);
    const [importFileError, setImportFileError] = useState("");
    const [previewHeaders, setPreviewHeaders] = useState([]);
    const [previewRows, setPreviewRows] = useState([]);
    const fileInputRef = useRef(null);
    const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

    const getFileNameFromPath = (filePath) => {
        if (!filePath) return "";
        return filePath.split(/[/\\]/).pop() || filePath;
    };

    const validateFileName = (fileName) => fileName.toLowerCase().endsWith(".csv");

    const openImportDialog = (importType) => {
        setSelectedImportType(importType);
        setSelectedFileName("");
        setSelectedFileSize(null);
        setImportFileError("");
        setIsDragActive(false);
        setPreviewHeaders([]);
        setPreviewRows([]);
        setIsPreviewDialogOpen(false);
        setIsImportDialogOpen(true);
    };

    const handleImportDialogOpenChange = (open) => {
        setIsImportDialogOpen(open);
        if (!open) {
            setSelectedImportType(null);
            setSelectedFileName("");
            setSelectedFileSize(null);
            setIsDragActive(false);
            setImportFileError("");
            setPreviewHeaders([]);
            setPreviewRows([]);
            setIsPreviewDialogOpen(false);
        }
    };

    const parseCsvPreview = (file) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const headers = results.meta?.fields || [];
                const rows = Array.isArray(results.data) ? results.data.slice(0, 10) : [];

                if (headers.length === 0 || rows.length === 0) {
                    setPreviewHeaders([]);
                    setPreviewRows([]);
                    setImportFileError("Unable to preview CSV. Make sure the file includes a header row and data.");
                    return;
                }

                setPreviewHeaders(headers);
                setPreviewRows(rows);
            },
            error: () => {
                setPreviewHeaders([]);
                setPreviewRows([]);
                setImportFileError("Unable to parse CSV file. Please check the file format.");
            }
        });
    };

    const handleFileSelection = (file) => {
        if (!file) return;
        if (!validateFileName(file.name)) {
            setImportFileError("Invalid file type. Only .csv files are accepted.");
            return;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
            setImportFileError("File is too large. Maximum allowed size is 5MB.");
            return;
        }
        setImportFileError("");
        setSelectedFileName(file.name);
        setSelectedFileSize(file.size);
        parseCsvPreview(file);
    };

    const handleFilePathSelection = async (filePath) => {
        if (!filePath) return;

        const fileName = getFileNameFromPath(filePath);

        if (!validateFileName(fileName)) {
            setImportFileError("Invalid file type. Only .csv files are accepted.");
            return;
        }

        try {
            const fileBytes = await readFile(filePath);

            if (fileBytes.length > MAX_FILE_SIZE_BYTES) {
                setImportFileError("File is too large. Maximum allowed size is 5MB.");
                return;
            }

            const decoder = new TextDecoder("utf-8");
            const csvText = decoder.decode(fileBytes);

            setSelectedFileName(fileName);
            setSelectedFileSize(fileBytes.length);
            setImportFileError("");

            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const headers = results.meta?.fields || [];
                    const rows = Array.isArray(results.data)
                        ? results.data.slice(0, 10)
                        : [];

                    if (headers.length === 0 || rows.length === 0) {
                        setPreviewHeaders([]);
                        setPreviewRows([]);
                        setImportFileError(
                            "Unable to preview CSV. Make sure the file includes a header row and data."
                        );
                        return;
                    }

                    setPreviewHeaders(headers);
                    setPreviewRows(rows);
                },
                error: () => {
                    setPreviewHeaders([]);
                    setPreviewRows([]);
                    setImportFileError(
                        "Unable to parse CSV file. Please check the file format."
                    );
                }
            });

        } catch (error) {
            console.error(error);
            setImportFileError("Failed to read file.");
            setSelectedFileSize(null);
        }
    };

    const formatBytes = (bytes) => {
        if (bytes === null || bytes === undefined) return "Unknown size";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const handleBrowseFile = () => {
        fileInputRef.current?.click();
    };

    const handleFileInputChange = (event) => {
        handleFileSelection(event.target.files?.[0]);
    };

    const clearSelectedFile = () => {
        setSelectedFileName("");
        setSelectedFileSize(null);
        setPreviewHeaders([]);
        setPreviewRows([]);
        setImportFileError("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        setIsDragActive(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        setIsDragActive(false);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragActive(false);
        handleFileSelection(event.dataTransfer.files?.[0]);
    };

    useEffect(() => {
        if (!isImportDialogOpen) return;

        let unlisten = null;

        const bindTauriDragDrop = async () => {
            const isTauriRuntime = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
            if (!isTauriRuntime) return;

            const { getCurrentWebview } = await import("@tauri-apps/api/webview");
            unlisten = await getCurrentWebview().onDragDropEvent((event) => {
                if (event.payload.type === "enter" || event.payload.type === "over") {
                    setIsDragActive(true);
                    return;
                }
                if (event.payload.type === "leave") {
                    setIsDragActive(false);
                    return;
                }
                if (event.payload.type === "drop") {
                    setIsDragActive(false);
                    handleFilePathSelection(event.payload.paths?.[0]);
                }
            });
        };

        void bindTauriDragDrop();

        return () => {
            if (unlisten) {
                void unlisten();
            }
        };
    }, [isImportDialogOpen]);

    const importDialogTitle = selectedImportType === "classlist"
        ? "Import Classlist CSV"
        : selectedImportType === "schedule"
            ? "Import Laboratory Schedule CSV"
            : "Import CSV";
    const templateFileName = selectedImportType === "classlist"
        ? "classlist-template.csv"
        : "laboratory-schedule-template.csv";
    const templateCsvContent = selectedImportType === "classlist"
        ? "student_number,last_name,first_name,middle_name,year_level,section\n2026-0001,Dela Cruz,Juan,Santos,2,BSCS-2A\n"
        : "course_code,subject_name,section,day,start_time,end_time,laboratory,faculty\nCS101,Introduction to Computing,BSCS-1A,Monday,08:00,10:00,Computer Laboratory 4,Prof. Reyes\n";

    const actionCardClass = "w-full flex items-center gap-4 p-4 bg-[#0f172a] border border-[#1e293b] rounded-xl hover:bg-[#131f36] hover:border-slate-600 hover:shadow-lg hover:shadow-slate-950/40 transition-all group relative overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-0";

    const handleDownloadTemplate = () => {
        const templateBlob = new Blob([templateCsvContent], { type: "text/csv;charset=utf-8;" });
        const templateUrl = URL.createObjectURL(templateBlob);
        const downloadLink = document.createElement("a");
        downloadLink.href = templateUrl;
        downloadLink.setAttribute("download", templateFileName);
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(templateUrl);
    };

    return (
        <div className="p-8 space-y-10 bg-[#020617] min-h-screen text-slate-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#1e293b] pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        {labName} - System Settings
                    </h1>
                    <p className="text-slate-400 text-sm italic">
                        Manage core attendance protocols and hardware maintenance thresholds.
                    </p>
                </div>

                <button
                    onClick={() => setIsSaving(true)}
                    className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2.5 px-6 rounded-lg transition-all shadow-lg shadow-sky-900/20 active:scale-95 group/btn relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover/btn:from-white/10 group-hover/btn:via-white/0 group-hover/btn:to-white/0 transition-all duration-500 pointer-events-none" />
                    <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                    <Save size={16} />
                    <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-7 gap-8 items-stretch">
                <section className="xl:col-span-4 h-full flex flex-col gap-6">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={18} className="text-sky-500" />
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                            Attendance Protocols
                        </h2>
                    </div>

                    <div className="grid gap-4">
                        <SettingRow
                            label="Anti-Cutting Protocol"
                            description="Enforce session locking based on official schedule. Prevents unauthorized early exits."
                        >
                            <div className="w-10 h-5 bg-sky-600 rounded-full flex items-center justify-end px-1 cursor-pointer ring-2 ring-sky-500/10">
                                <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
                            </div>
                        </SettingRow>

                        <SettingRow
                            label="Hard Capacity Enforcer"
                            description="Block Time-In if current occupancy reaches laboratory limit (e.g., 40/40)."
                        >
                            <div className="w-10 h-5 bg-sky-600 rounded-full flex items-center justify-end px-1 cursor-pointer ring-2 ring-sky-500/10">
                                <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
                            </div>
                        </SettingRow>

                        <SettingRow
                            label="Automated Alphabetical Assignment"
                            description="Auto-assign seats based on student surname rank upon scanning."
                        >
                            <div className="w-10 h-5 bg-sky-600 rounded-full flex items-center justify-end px-1 cursor-pointer ring-2 ring-sky-500/10">
                                <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
                            </div>
                        </SettingRow>
                    </div>

                    <section className="space-y-6">
                        <div className="flex items-center gap-2">
                            <Monitor size={18} className="text-sky-500" />
                            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                                Hardware Maintenance
                            </h2>
                        </div>

                        <div className="p-6 bg-[#0f172a] border border-[#1e293b] rounded-xl flex flex-col gap-6 shadow-sm group relative overflow-hidden hover:border-slate-600 transition-colors">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-200">Predictive Health Threshold</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black leading-relaxed">
                                        Limit for PC proactive alerts.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 bg-[#020617] border border-[#1e293b] rounded-lg px-2 py-1 shadow-inner">
                                    <span className="text-sky-400 font-black text-xs">500</span>
                                    <span className="text-[10px] text-slate-600 font-black">HRS</span>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-[#1e293b] rounded-full overflow-hidden">
                                <div className="h-full w-[80%] bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.3)]"></div>
                            </div>
                        </div>
                    </section>
                </section>

                <div className="xl:col-span-3 h-full flex flex-col gap-8">
                    <section className="space-y-5">
                        <div className="flex items-center gap-2">
                            <Database size={18} className="text-sky-500" />
                            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                                Data & Audit
                            </h2>
                        </div>

                        <div className="space-y-3">
                            <button className={actionCardClass}>
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                                <div className="p-3 bg-sky-500/10 rounded-lg group-hover:scale-110 transition-transform">
                                    <RefreshCcw size={20} className="text-sky-500" />
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white">Refresh Audit Logs</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Sync records</p>
                                </div>
                            </button>

                            <button className={actionCardClass}>
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                                <div className="p-3 bg-emerald-500/10 rounded-lg group-hover:scale-110 transition-transform">
                                    <Database size={20} className="text-emerald-500" />
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white">Export System Backup</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Download Backup</p>
                                </div>
                            </button>
                        </div>
                    </section>

                    <section className="space-y-5">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Upload size={18} className="text-sky-500" />
                                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                                    Data Import
                                </h2>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Use this section to bulk upload class lists and laboratory schedules.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => openImportDialog("classlist")}
                                className={actionCardClass}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-sky-500/10 rounded-lg group-hover:scale-110 transition-transform">
                                        <Upload size={20} className="text-sky-500" />
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white">Import Classlist</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
                                            Upload a CSV file containing student records.
                                        </p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => openImportDialog("schedule")}
                                className={actionCardClass}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-500/10 rounded-lg group-hover:scale-110 transition-transform">
                                        <Database size={20} className="text-emerald-500" />
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white">Import Laboratory Schedule</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
                                            Upload a CSV file containing laboratory schedule details.
                                        </p>
                                    </div>
                                </div>
                            </button>
                            
                        </div>
                    </section>
                </div>
            </div>

            <Dialog open={isImportDialogOpen} onOpenChange={handleImportDialogOpenChange}>
                <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 w-full max-w-4xl md:max-w-6xl h-[90vh] md:h-[85vh] flex flex-col p-0 gap-0">                    
                    <DialogHeader>
                        <div className="px-6 pt-6 pb-3 border-b border-slate-800">
                            <DialogTitle className="text-slate-100">{importDialogTitle}</DialogTitle>
                            <DialogDescription className="text-slate-400 mt-1">
                            Select a CSV file to continue.
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileInputChange}
                            className="hidden"
                        />

                    <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`rounded-xl border border-dashed p-25 min-h-[220px] text-center transition-colors relative overflow-hidden group/btn ${
                        isDragActive ? "border-sky-500 bg-sky-500/10" : "border-slate-700 bg-slate-800/40"
                    }`}
                    >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 
                                    group-hover/btn:from-white/10 group-hover/btn:via-white/0 group-hover/btn:to-white/0 
                                    transition-all duration-500 pointer-events-none" />

                    <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full 
                                    transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                                    pointer-events-none" />

                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-sky-500/10">
                        <Upload size={20} className="text-sky-500" />
                    </div>

                    <p className="text-sm font-semibold text-slate-200">
                        Drag and drop your CSV file here
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        or choose a file from your device
                    </p>

                    <button
                        type="button"
                        onClick={handleBrowseFile}
                        className="mt-4 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold py-2 px-4 rounded-lg border border-slate-700 transition-colors relative overflow-hidden group/btn"
                    >
                        Browse File
                    </button>
                    </div>

                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                            Only .csv files are accepted. <br /> Maximum file size: 5MB.
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                        </p>
                        
                        <div className="pt-2 border-t border-slate-800">
                            <p className="text-xs font-semibold text-slate-300">Required CSV Format:</p>
                            <button
                                type="button"
                                onClick={handleDownloadTemplate}
                                className="mt-2 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors underline underline-offset-4"
                            >
                                Download CSV Template
                            </button>
                        </div>


                        <div className="space-y-2 pt-4 border-t border-slate-800">
                            <p className="text-xs text-slate-300">
                                Selected file:{" "}
                                <span className="font-semibold text-slate-100">
                                    {selectedFileName || "None"}
                                </span>
                            </p>
                            {selectedFileName ? (
                        <div className="rounded-xl border border-slate-700 bg-slate-800/40 px-3 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <FileText size={14} className="text-sky-400 shrink-0" />
                            <p className="text-xs text-slate-200 truncate">
                            {selectedFileName}
                            <span className="text-slate-500 ml-2">({formatBytes(selectedFileSize)})</span>
                            </p>
                        </div>

                        <div className="flex gap-2 sm:ml-auto">

                            <div className="flex gap-2 sm:ml-auto">
                            <button
                                type="button"
                                onClick={() => setIsPreviewDialogOpen(true)}
                                disabled={previewHeaders.length === 0 || previewRows.length === 0}
                                className="flex items-center gap-2 bg-slate-800/20 border border-slate-700 hover:border-slate-500 text-slate-200 text-[10px] font-bold py-2 px-4 rounded-lg uppercase tracking-widest transition-all group/btn relative overflow-hidden shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover/btn:from-white/10 group-hover/btn:via-white/5 group-hover/btn:to-white/10 transition-all duration-500 pointer-events-none" />
                                <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                                <span className="relative z-10">Preview Records</span>
                            </button>

                            <button
                                type="button"
                                onClick={clearSelectedFile}
                                className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 text-[10px] font-bold py-2 px-4 rounded-lg uppercase tracking-widest transition-all group/btn relative overflow-hidden shrink-0"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover/btn:from-white/20 group-hover/btn:via-white/10 group-hover/btn:to-white/20 transition-all duration-500 pointer-events-none" />
                                <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                                <Trash2 size={13} className="relative z-10" />
                                <span className="relative z-10">Remove File</span>
                            </button>
                            </div>
                        
                        </div>
                        </div>
                            ) : null}
                        </div>
                        {importFileError ? (
                            <p className="text-xs text-rose-400">{importFileError}</p>
                        ) : null}
                    </div>

                    <DialogFooter className="gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/90">
                        <Button
                        variant="outline"
                        onClick={() => setIsImportDialogOpen(false)}
                        className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-slate-100 relative overflow-hidden group/btn"
                        >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover/btn:from-white/10 group-hover/btn:via-white/0 group-hover/btn:to-white/0 transition-all duration-500 pointer-events-none" />
                        <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                        Cancel
                        </Button>
                        <Button
                        className="bg-sky-600 hover:bg-sky-700 text-white relative overflow-hidden group/btn"
                        >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover/btn:from-white/10 group-hover/btn:via-white/0 group-hover/btn:to-white/0 transition-all duration-500 pointer-events-none" />
                        <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                        Upload CSV
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 w-full max-w-4xl md:max-w-6xl h-[90vh] md:h-[85vh] flex flex-col p-0 gap-0">
                    <DialogHeader>
                        <div className="px-6 pt-6 pb-3 border-b border-slate-800">
                            <DialogTitle className="text-slate-100">Preview (First 10 Records)</DialogTitle>
                            <DialogDescription className="text-slate-400 mt-1">
                                Reviewing parsed CSV rows before upload.
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-auto px-6 py-4">
                        <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] overflow-x-auto">
                            <table className="w-full border-collapse text-xs">
                                <thead>
                                    <tr className="bg-[#0b1222]">
                                        {previewHeaders.map((header) => (
                                            <th
                                                key={header}
                                                className="text-left p-2 border-b border-r border-[#1e293b] last:border-r-0 text-slate-400 font-black uppercase tracking-wider"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewRows.map((row, rowIndex) => (
                                        <tr key={`${selectedFileName}-${rowIndex}`} className="hover:bg-slate-800/30">
                                            {previewHeaders.map((header) => (
                                                <td
                                                    key={`${header}-${rowIndex}`}
                                                    className="p-2 border-b border-r border-[#1e293b] last:border-r-0 text-slate-300"
                                                >
                                                    {String(row?.[header] ?? "-")}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <DialogFooter className="gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/90">
                        <Button
                            variant="outline"
                            onClick={() => setIsPreviewDialogOpen(false)}
                            className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-slate-100"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
