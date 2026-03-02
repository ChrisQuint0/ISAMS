import React, { useState, useRef } from "react";
import { Upload, FileText, X, FileUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function SimilarityDropzone({ onFileSelect }) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
    };

    const handleFile = (file) => {
        setSelectedFile(file);
    };

    const removeFile = (e) => {
        e.stopPropagation();
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const startAnalysis = () => {
        if (selectedFile) {
            onFileSelect(selectedFile);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !selectedFile && fileInputRef.current?.click()}
                className={cn(
                    "relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-500 min-h-[300px] flex flex-col items-center justify-center p-8 text-center",
                    isDragging
                        ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
                        : "border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/50",
                    selectedFile && "border-blue-500/40 bg-blue-500/5 cursor-default"
                )}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                />

                {!selectedFile ? (
                    <div className="flex flex-col items-center justify-center space-y-6">
                        <h3 className="text-xl font-bold text-slate-100 tracking-tight">
                            Drag & Drop Thesis Document Here
                        </h3>

                        <Button
                            variant="outline"
                            className="bg-white hover:bg-slate-100 text-slate-900 font-bold border-none px-8 py-6 rounded-xl shadow-lg transition-transform active:scale-95"
                        >
                            Browse Files
                        </Button>
                    </div>
                ) : (
                    <div className="w-full animate-in fade-in zoom-in duration-300">
                        <div className="flex flex-col items-center">
                            <div className="mb-6 relative">
                                <div className="p-6 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold">
                                    <FileText className="h-16 w-16" />
                                </div>
                                <button
                                    onClick={removeFile}
                                    className="absolute -top-2 -right-2 p-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-colors shadow-lg"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <h3 className="text-lg font-bold text-slate-100 mb-1 truncate max-w-md">
                                {selectedFile.name}
                            </h3>
                            <p className="text-sm text-slate-500 mb-8 font-medium">
                                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for analysis
                            </p>

                            <Button
                                onClick={startAnalysis}
                                className="h-12 px-10 bg-blue-600 hover:bg-blue-500 text-white border-none shadow-[0_0_20px_rgba(37,99,235,0.3)] font-bold text-base"
                            >
                                <FileUp className="h-5 w-5 mr-3" />
                                Run Similarity Analysis
                            </Button>
                        </div>
                    </div>
                )}

                {/* Decorative corners */}
                <div className="absolute top-4 left-4 w-2 h-2 border-t-2 border-l-2 border-slate-800 group-hover:border-blue-500/50 transition-colors" />
                <div className="absolute top-4 right-4 w-2 h-2 border-t-2 border-r-2 border-slate-800 group-hover:border-blue-500/50 transition-colors" />
                <div className="absolute bottom-4 left-4 w-2 h-2 border-b-2 border-l-2 border-slate-800 group-hover:border-blue-500/50 transition-colors" />
                <div className="absolute bottom-4 right-4 w-2 h-2 border-b-2 border-r-2 border-slate-800 group-hover:border-blue-500/50 transition-colors" />
            </div>
        </div>
    );
}
