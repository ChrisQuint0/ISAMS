import React, { useState } from "react";
import { Download, FileText, FileSpreadsheet } from "lucide-react";

export default function ExportCard({ title, description, icon, onExport }) {
    const [format, setFormat] = useState("pdf");

    return (
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 shadow-sm hover:border-primary-500/50 transition-all">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="text-primary-500 hover:text-primary-600 transition-colors">
                        {icon}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-neutral-900">{title}</h4>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5">{description}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-200">
                <div className="flex items-center bg-white border border-neutral-200 rounded-lg p-0.5">
                    <button
                        onClick={() => setFormat("pdf")}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${
                            format === "pdf"
                                ? "bg-gold-500 text-neutral-900 border border-gold-600"
                                : "text-neutral-500 hover:text-neutral-700"
                        }`}
                    >
                        <FileText size={11} /> PDF
                    </button>
                    <button
                        onClick={() => setFormat("excel")}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${
                            format === "excel"
                                ? "bg-primary-500 text-white border border-primary-600"
                                : "text-neutral-500 hover:text-neutral-700"
                        }`}
                    >
                        <FileSpreadsheet size={11} /> Excel
                    </button>
                </div>

                <button 
                    onClick={() => onExport(format)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                        format === "pdf"
                            ? "bg-gold-500 border border-gold-600 text-neutral-900"
                            : "bg-primary-500 border border-primary-600 text-white"
                    }`}
                >
                    <Download size={12} /> Export {format === "pdf" ? ".pdf" : ".xlsx"}
                </button>
            </div>
        </div>
    );
}