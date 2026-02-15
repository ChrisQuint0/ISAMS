import React from "react";

export default function ChartBox({ title, subtitle, children }) {
    return (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-xl flex flex-col h-full">
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