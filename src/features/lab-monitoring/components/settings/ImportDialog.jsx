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
                <DialogContent className="bg-neutral-50 border-neutral-200 text-neutral-900 w-full max-w-4xl md:max-w-6xl h-[90vh] md:h-[85vh] flex flex-col p-0 gap-0">
                    <DialogHeader>
                        <div className="px-6 pt-6 pb-3 border-b border-neutral-200">
                            <DialogTitle className="text-neutral-900">{title}</DialogTitle>
                            <DialogDescription className="text-neutral-600 mt-1">
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
                                isDragActive ? "border-primary-600 bg-primary-600/10" : "border-neutral-200 bg-neutral-100/40"
                            }`}
                        >
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-primary-600/10">
                                <Upload size={20} className="text-primary-600" />
                            </div>
                            <p className="text-sm font-semibold text-neutral-900">Drag and drop your CSV file here</p>
                            <p className="text-xs text-neutral-600 mt-1">or choose a file from your device</p>
                            <button
                                type="button"
                                disabled={isImporting}
                                onClick={handleBrowseFile}
                                className="mt-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-bold py-2 px-4 rounded-lg border border-neutral-200 transition-colors disabled:opacity-50"
                            >
                                Browse File
                            </button>
                        </div>

                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest">
                            Only .csv files are accepted. <br /> Maximum file size: 5MB.
                        </p>

                        <div className="pt-2 border-t border-neutral-200">
                            <p className="text-xs font-semibold text-neutral-700">Required CSV Format:</p>
                            <button
                                type="button"
                                disabled={isImporting}
                                onClick={handleDownloadTemplate}
                                className="mt-2 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors underline underline-offset-4 disabled:opacity-50"
                            >
                                Download CSV Template
                            </button>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-neutral-200">
                            <p className="text-xs text-neutral-700">
                                Selected file: <span className="font-semibold text-neutral-900">{selectedFileName || "None"}</span>
                            </p>
                            {selectedFileName && (
                                <div className="rounded-xl border border-neutral-200 bg-neutral-100/40 px-3 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <FileText size={14} className="text-primary-600 shrink-0" />
                                        <p className="text-xs text-neutral-900 truncate">
                                            {selectedFileName}
                                            <span className="text-neutral-500 ml-2">({formatBytes(selectedFileSize)})</span>
                                        </p>
                                    </div>
                                    <div className="flex gap-2 sm:ml-auto">
                                        <button
                                            type="button"
                                            onClick={() => onPreviewOpenChange(true)}
                                            disabled={previewHeaders.length === 0 || previewRows.length === 0 || isImporting}
                                            className="flex items-center gap-2 bg-neutral-100 border border-neutral-200 hover:border-neutral-300 text-neutral-900 text-[10px] font-bold py-2 px-4 rounded-lg uppercase tracking-widest transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span>Preview Records</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={clearSelectedFile}
                                            disabled={isImporting}
                                            className="flex items-center gap-1 bg-destructive-semantic/10 border border-destructive-semantic/20 hover:border-destructive-semantic/40 text-destructive-semantic text-[10px] font-bold py-2 px-4 rounded-lg uppercase tracking-widest transition-all shrink-0 disabled:opacity-50"
                                        >
                                            <Trash2 size={13} />
                                            <span>Remove File</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        {importFileError && <p className="text-xs text-destructive-semantic">{importFileError}</p>}
                    </div>

                    <DialogFooter className="gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isImporting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleUpload}
                            disabled={isImporting || !selectedFileName || !!importFileError}
                            variant="default"
                            className="min-w-[120px]"
                        >
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
                <DialogContent className="bg-neutral-50 border-neutral-200 text-neutral-900 w-full max-w-4xl md:max-w-6xl h-[90vh] md:h-[85vh] flex flex-col p-0 gap-0">
                    <DialogHeader>
                        <div className="px-6 pt-6 pb-3 border-b border-neutral-200">
                            <DialogTitle className="text-neutral-900">Preview (First 10 Records)</DialogTitle>
                            <DialogDescription className="text-neutral-600 mt-1">
                                Reviewing parsed CSV rows before upload.
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto px-6 py-4">
                        <div className="rounded-xl border border-neutral-200 bg-neutral-50 overflow-x-auto">
                            <table className="w-full border-collapse text-xs">
                                <thead>
                                    <tr className="bg-neutral-100">
                                        {previewHeaders.map((header) => (
                                            <th key={header} className="text-left p-2 border-b border-r border-neutral-200 last:border-r-0 text-neutral-700 font-black uppercase tracking-wider">
                                                {/* Applied formatHeaderLabel here */}
                                                {formatHeaderLabel(header)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewRows.map((row, rowIndex) => (
                                        <tr key={`${selectedFileName}-${rowIndex}`} className="hover:bg-neutral-100/50">
                                            {previewHeaders.map((header) => (
                                                <td key={`${header}-${rowIndex}`} className="p-2 border-b border-r border-neutral-200 last:border-r-0 text-neutral-900">
                                                    {String(row?.[header] ?? "-")}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <DialogFooter className="gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50">
                        <Button
                            variant="outline"
                            onClick={() => onPreviewOpenChange(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}