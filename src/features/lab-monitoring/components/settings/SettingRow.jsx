import React from "react";

export default function SettingRow({ label, description, children }) {
    return (
        <div className="flex items-center justify-between p-4 bg-[#0f172a] border border-[#1e293b] rounded-xl group relative overflow-hidden hover:border-slate-700 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
            <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-200">{label}</p>
                <p className="text-[11px] text-slate-500 uppercase tracking-wide">{description}</p>
            </div>
            <div>{children}</div>
        </div>
    );
}