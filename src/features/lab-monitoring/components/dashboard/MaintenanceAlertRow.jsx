import React from "react";
import { Wrench } from "lucide-react";

export default function MaintenanceAlertRow({ unit, message, time }) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-[#1e293b] last:border-b-0 group/row hover:bg-slate-800/30 px-2 -mx-2 rounded-lg transition-colors">
            <div className="flex flex-col items-center pt-1">
                <div className="w-2 h-2 rounded-full bg-amber-500/60" />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
                <span className="text-xs font-bold text-slate-100 tracking-wide">{unit}</span>
                <p className="text-[11px] text-slate-500 leading-relaxed truncate">{message}</p>
            </div>

            <div className="flex items-center gap-1.5 pt-0.5 shrink-0">
                <span className="text-amber-500"><Wrench size={14} /></span>
                <span className="text-[10px] font-mono text-slate-600">{time}</span>
            </div>
        </div>
    );
}
