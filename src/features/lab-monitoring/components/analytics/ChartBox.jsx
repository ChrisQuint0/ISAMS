import React from "react";

export default function ChartBox({ title, subtitle, children }) {
    return (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col h-full hover:border-neutral-300 transition-colors">
            <div className="mb-6 border-b border-neutral-200 pb-4">
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">{title}</h3>
                {subtitle && <p className="text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5">{subtitle}</p>}
            </div>
            <div className="flex-1 min-h-[200px] flex items-end justify-center">
                {children}
            </div>
        </div>
    );
}