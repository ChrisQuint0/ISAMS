import React from "react";

export default function SettingRow({ label, description, children }) {
    return (
        <div className="flex items-center justify-between p-4 bg-[#0f172a] border border-[#1e293b] rounded-xl hover:border-slate-700 transition-colors">
            <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-200">{label}</p>
                <p className="text-[11px] text-slate-500 uppercase tracking-wide">{description}</p>
            </div>
            <div>{children}</div>
        </div>
    );
}