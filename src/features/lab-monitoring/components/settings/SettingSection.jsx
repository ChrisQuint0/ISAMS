import React from "react";

export default function SettingSection({ title, description, children }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8 border-b border-[#1e293b] last:border-0">
            <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
            </div>
            <div className="lg:col-span-2 space-y-4">
                {children}
            </div>
        </div>
    );
}