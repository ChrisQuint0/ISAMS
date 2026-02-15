import React from "react";
import { Clock } from "lucide-react";

export default function ActivityItem({ time, text, detail, alert }) {
    return (
        <div className="flex gap-4 relative pb-4 group">
            {/* Timeline dot and connecting line */}
            <div className="flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full mt-1.5 z-10 ${alert ? "bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]" : "bg-sky-500/50 group-hover:bg-sky-400 transition-colors"}`}></div>
                <div className="w-[1px] h-full bg-[#334155] absolute top-4 group-last:hidden"></div>
            </div>
            
            {/* Content */}
            <div className="space-y-1 pb-2">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-sky-500/70 flex items-center">
                        <Clock size={10} className="mr-1" />{time}
                    </span>
                    <span className={`text-[11px] font-bold tracking-wide ${alert ? "text-amber-500" : "text-slate-200"}`}>
                        {text}
                    </span>
                </div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{detail}</p>
            </div>
        </div>
    );
}