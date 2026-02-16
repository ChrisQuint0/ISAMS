import React from "react";

export default function ChartBox({ title, subtitle, children }) {
    return (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-xl flex flex-col h-full group relative overflow-hidden hover:border-slate-600 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
            <div className="mb-6 border-b border-[#1e293b] pb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
                {subtitle && <p className="text-[11px] text-slate-500 mt-1">{subtitle}</p>}
            </div>
            <div className="flex-1 min-h-[200px] flex items-end justify-center">
                {children}
            </div>
        </div>
    );
}