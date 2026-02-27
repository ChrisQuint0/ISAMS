import React from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Upload, Trash2, FileText, Loader2, Table } from "lucide-react";

export default function ImportDialog({
    isOpen,
    onOpenChange,
    isPreviewOpen,
    onPreviewOpenChange,
    title,
    fileInputRef,
    handleFileInputChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    isDragActive,
    handleBrowseFile,
    handleDownloadTemplate,
    selectedFileName,
    selectedFileSize,
    formatBytes,
    clearSelectedFile,
    previewHeaders,
    previewRows,
    importFileError,
    handleUpload,
    isImporting
}) {
    /**
     * Helper to transform technical CSV keys into readable labels.
     * Example: 'student_no' -> 'Student ID'
     */
    const formatHeaderLabel = (header) => {
        if (!header) return "";
        
        const customLabels = {
            "student_no": "Student ID",
            "full_name": "Full Name",
            "section_block": "Section / Block",
            "year_level": "Year",
            "course_code": "Course Code",
            "subject_name": "Subject Name",
            "time_start": "Start Time",
            "time_end": "End Time",
        };

        if (customLabels[header.toLowerCase()]) {
            return customLabels[header.toLowerCase()];
        }

        // Fallback: Replace underscores with spaces and capitalize words
        return header
            .replace(/_/g, " ")
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 w-full max-w-4xl md:max-w-6xl h-[90vh] md:h-[85vh] flex flex-col p-0 gap-0">
                    <DialogHeader>
                        <div className="px-6 pt-6 pb-3 border-b border-slate-800">
                            <DialogTitle className="text-slate-100">{title}</DialogTitle>
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
                            <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover/btn:from-white/10 group-hover/btn:via-white/0 group-hover/btn:to-white/0 transition-all duration-500 pointer-events-none" />
                            <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-sky-500/10">
                                <Upload size={20} className="text-sky-500" />
                            </div>
                            <p className="text-sm font-semibold text-slate-200">Drag and drop your CSV file here</p>
                            <p className="text-xs text-slate-400 mt-1">or choose a file from your device</p>
                            <button
                                type="button"
                                disabled={isImporting}
                                onClick={handleBrowseFile}
                                className="mt-4 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold py-2 px-4 rounded-lg border border-slate-700 transition-colors relative overflow-hidden group/btn disabled:opacity-50"
                            >
                                Browse File
                            </button>
                        </div>

                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                            Only .csv files are accepted. <br /> Maximum file size: 5MB.
                        </p>

                        <div className="pt-2 border-t border-slate-800">
                            <p className="text-xs font-semibold text-slate-300">Required CSV Format:</p>
                            <button
                                type="button"
                                disabled={isImporting}
                                onClick={handleDownloadTemplate}
                                className="mt-2 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors underline underline-offset-4 disabled:opacity-50"
                            >
                                Download CSV Template
                            </button>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-slate-800">
                            <p className="text-xs text-slate-300">
                                Selected file: <span className="font-semibold text-slate-100">{selectedFileName || "None"}</span>
                            </p>
                            {selectedFileName && (
                                <div className="rounded-xl border border-slate-700 bg-slate-800/40 px-3 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <FileText size={14} className="text-sky-400 shrink-0" />
                                        <p className="text-xs text-slate-200 truncate">
                                            {selectedFileName}
                                            <span className="text-slate-500 ml-2">({formatBytes(selectedFileSize)})</span>
                                        </p>
                                    </div>
                                    <div className="flex gap-2 sm:ml-auto">
                                        <button
                                            type="button"
                                            onClick={() => onPreviewOpenChange(true)}
                                            disabled={previewHeaders.length === 0 || previewRows.length === 0 || isImporting}
                                            className="flex items-center gap-2 bg-slate-800/20 border border-slate-700 hover:border-slate-500 text-slate-200 text-[10px] font-bold py-2 px-4 rounded-lg uppercase tracking-widest transition-all group/btn relative overflow-hidden shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover/btn:from-white/10 group-hover/btn:via-white/5 group-hover/btn:to-white/10 transition-all duration-500 pointer-events-none" />
                                            <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                                            <span className="relative z-10">Preview Records</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={clearSelectedFile}
                                            disabled={isImporting}
                                            className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 text-[10px] font-bold py-2 px-4 rounded-lg uppercase tracking-widest transition-all group/btn relative overflow-hidden shrink-0 disabled:opacity-50"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover/btn:from-white/20 group-hover/btn:via-white/10 group-hover/btn:to-white/20 transition-all duration-500 pointer-events-none" />
                                            <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                                            <Trash2 size={13} className="relative z-10" />
                                            <span className="relative z-10">Remove File</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        {importFileError && <p className="text-xs text-rose-400">{importFileError}</p>}
                    </div>

                    <DialogFooter className="gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/90">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isImporting}
                            className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-slate-100 relative overflow-hidden group/btn"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover/btn:from-white/10 group-hover/btn:via-white/0 group-hover/btn:to-white/0 transition-all duration-500 pointer-events-none" />
                            <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleUpload}
                            disabled={isImporting || !selectedFileName || !!importFileError}
                            className="bg-sky-600 hover:bg-sky-700 text-white relative overflow-hidden group/btn min-w-[120px]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover/btn:from-white/10 group-hover/btn:via-white/0 group-hover/btn:to-white/0 transition-all duration-500 pointer-events-none" />
                            <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                            {isImporting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                "Upload CSV"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* PREVIEW DIALOG */}
            <Dialog open={isPreviewOpen} onOpenChange={onPreviewOpenChange}>
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
                                            <th key={header} className="text-left p-2 border-b border-r border-[#1e293b] last:border-r-0 text-slate-400 font-black uppercase tracking-wider">
                                                {/* Applied formatHeaderLabel here */}
                                                {formatHeaderLabel(header)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewRows.map((row, rowIndex) => (
                                        <tr key={`${selectedFileName}-${rowIndex}`} className="hover:bg-slate-800/30">
                                            {previewHeaders.map((header) => (
                                                <td key={`${header}-${rowIndex}`} className="p-2 border-b border-r border-[#1e293b] last:border-r-0 text-slate-300">
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
                            onClick={() => onPreviewOpenChange(false)}
                            className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-slate-100"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}