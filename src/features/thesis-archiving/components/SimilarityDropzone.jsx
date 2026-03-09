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
        <div className="w-full max-w-5xl mx-auto">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !selectedFile && fileInputRef.current?.click()}
                className={cn(
                    "relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-500 min-h-[300px] flex flex-col items-center justify-center p-8 text-center",
                    isDragging
                        ? "border-green-500 bg-green-50 scale-[1.01]"
                        : "border-gray-300 bg-white hover:border-green-400 hover:bg-green-50/30",
                    selectedFile && "border-green-500/50 bg-green-50/20 cursor-default"
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
                        <h3 className="text-xl font-bold text-gray-800 tracking-tight">
                            Drag & Drop Thesis Document Here
                        </h3>

                        <Button
                            variant="outline"
                            className="bg-green-700 hover:bg-green-800 text-white hover:text-white font-bold border-none px-8 py-6 rounded-xl shadow-lg transition-transform active:scale-95"
                        >
                            Browse Files
                        </Button>
                    </div>
                ) : (
                    <div className="w-full animate-in fade-in zoom-in duration-300">
                        <div className="flex flex-col items-center">
                            <div className="mb-6 relative">
                                <div className="p-6 rounded-2xl bg-green-600/10 border border-green-500/30 text-green-700 font-bold">
                                    <FileText className="h-16 w-16" />
                                </div>
                                <button
                                    onClick={removeFile}
                                    className="absolute -top-2 -right-2 p-1.5 rounded-full bg-white border border-gray-300 text-gray-500 hover:text-gray-800 transition-colors shadow-lg"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-1 truncate max-w-md">
                                {selectedFile.name}
                            </h3>
                            <p className="text-sm text-gray-500 mb-8 font-medium">
                                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for analysis
                            </p>

                            <Button
                                onClick={startAnalysis}
                                className="h-12 px-10 bg-green-700 hover:bg-green-800 text-white border-none shadow-[0_0_20px_rgba(22,101,52,0.25)] font-bold text-base"
                            >
                                <FileUp className="h-5 w-5 mr-3" />
                                Run Similarity Analysis
                            </Button>
                        </div>
                    </div>
                )}

                {/* Decorative corners */}
                <div className="absolute top-4 left-4 w-2 h-2 border-t-2 border-l-2 border-gray-300 group-hover:border-green-500/50 transition-colors" />
                <div className="absolute top-4 right-4 w-2 h-2 border-t-2 border-r-2 border-gray-300 group-hover:border-green-500/50 transition-colors" />
                <div className="absolute bottom-4 left-4 w-2 h-2 border-b-2 border-l-2 border-gray-300 group-hover:border-green-500/50 transition-colors" />
                <div className="absolute bottom-4 right-4 w-2 h-2 border-b-2 border-r-2 border-gray-300 group-hover:border-green-500/50 transition-colors" />
            </div>
        </div>
    );
}