import React from "react";
import { TrendingUp, AlertTriangle } from "lucide-react";

const predictions = [
    { day: "Monday", date: "Feb 23", level: "high", students: "~210", reason: "CC101 + IT305 overlap" },
    { day: "Wednesday", date: "Feb 25", level: "critical", students: "~245", reason: "Midterm week — all sections" },
    { day: "Thursday", date: "Feb 26", level: "high", students: "~195", reason: "Capstone submissions due" },
    { day: "Monday", date: "Mar 02", level: "moderate", students: "~175", reason: "Post-midterm catch-up" },
    { day: "Friday", date: "Mar 06", level: "high", students: "~200", reason: "Project deadline clusters" },
];

const levelConfig = {
    critical: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", dot: "bg-rose-500" },
    high: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", dot: "bg-amber-500" },
    moderate: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20", dot: "bg-sky-500" },
};

export default function HighTrafficDays() {
    return (
        <div className="space-y-2">
            {predictions.map((p, i) => {
                const cfg = levelConfig[p.level];
                return (
                    <div key={i} className="flex items-center gap-3 p-3 bg-[#020617] border border-[#1e293b] rounded-lg hover:border-slate-600 transition-colors">
                        <div className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0`} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-100">{p.day}, {p.date}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                    {p.level}
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">{p.reason}</p>
                        </div>
                        <div className="text-right shrink-0">
                            <span className="text-sm font-bold text-white">{p.students}</span>
                            <p className="text-[9px] text-slate-600 uppercase">predicted</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
