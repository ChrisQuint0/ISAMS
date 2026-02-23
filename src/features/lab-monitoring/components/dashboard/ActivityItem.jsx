import React from "react";
import { Clock } from "lucide-react";

export default function ActivityItem({ time, text, detail, alert }) {
    return (
        /* Reduced pb-6 to pb-3, pt-2 to pt-1 */
        <div className="flex gap-4 relative pb-3 pt-1 group border-b border-slate-700/30 last:border-0 last:pb-0">
            <div className="flex flex-col items-center shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 z-10 ${alert ? "bg-amber-500" : "bg-sky-500"}`}></div>
                <div className="w-[1px] h-full bg-[#334155] absolute top-5 group-last:hidden"></div>
            </div>
            
            <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex justify-between items-center">
                    <span className={`text-[12px] font-black tracking-tight uppercase ${alert ? "text-amber-500" : "text-slate-100"}`}>
                        {text}
                    </span>
                    <span className="text-[9px] font-mono text-sky-500/80 font-bold">{time}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium leading-tight">
                    {detail}
                </p>
            </div>
        </div>
    );
}