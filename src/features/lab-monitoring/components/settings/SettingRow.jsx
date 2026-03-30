import React from "react";

export default function SettingRow({ label, description, children }) {
    return (
        <div className="flex items-center justify-between p-4 bg-white border border-neutral-200 rounded-xl shadow-sm hover:border-neutral-300 transition-colors min-h-[80px]">
            <div className="space-y-0.5 flex-1">
                <p className="text-sm font-bold text-neutral-900">{label}</p>
                <p className="text-[11px] text-neutral-600 uppercase tracking-wide">{description}</p>
            </div>
            <div className="ml-4">{children}</div>
        </div>
    );
}