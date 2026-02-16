import React, { useState } from "react";
import { Download, FileText, FileSpreadsheet } from "lucide-react";

export default function ExportCard({ title, description, icon }) {
    const [format, setFormat] = useState("pdf"); // "pdf" | "excel"

    return (
        <div className="bg-[#020617] border border-[#1e293b] rounded-xl p-5 group relative overflow-hidden hover:border-sky-500/50 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                    <div className="text-slate-400 group-hover:text-sky-400 transition-colors">
                        {icon}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-200">{title}</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{description}</p>
                    </div>
                </div>
            </div>
            {/* Format selector + Download */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#1e293b] relative z-10">
                <div className="flex items-center bg-[#0f172a] border border-[#1e293b] rounded-lg p-0.5">
                    <button
                        onClick={() => setFormat("pdf")}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${
                            format === "pdf"
                                ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                : "text-slate-500 hover:text-slate-300 border border-transparent"
                        }`}
                    >
                        <FileText size={11} /> PDF
                    </button>
                    <button
                        onClick={() => setFormat("excel")}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${
                            format === "excel"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : "text-slate-500 hover:text-slate-300 border border-transparent"
                        }`}
                    >
                        <FileSpreadsheet size={11} /> Excel
                    </button>
                </div>
                <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all relative overflow-hidden group/dl ${
                    format === "pdf"
                        ? "bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 text-rose-400"
                        : "bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400"
                }`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover/dl:from-white/10 group-hover/dl:via-white/0 group-hover/dl:to-white/0 transition-all duration-500 pointer-events-none" />
                    <div className="absolute inset-0 -translate-x-full group-hover/dl:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                    <Download size={12} /> Export {format === "pdf" ? ".pdf" : ".xlsx"}
                </button>
            </div>
        </div>
    );
}