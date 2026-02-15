import React from "react";
import { Download } from "lucide-react";

export default function ExportCard({ title, description, icon }) {
    return (
        <div className="bg-[#020617] border border-[#1e293b] rounded-xl p-5 flex items-center justify-between group hover:border-sky-500/50 transition-all">
            <div className="flex items-center gap-4">
                <div className="text-slate-400 group-hover:text-sky-400 transition-colors">
                    {icon}
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-200">{title}</h4>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{description}</p>
                </div>
            </div>
            <button className="p-2 bg-[#0f172a] border border-[#1e293b] rounded-lg text-slate-400 hover:text-white hover:bg-sky-600 hover:border-sky-500 transition-all">
                <Download size={16} />
            </button>
        </div>
    );
}