import React from "react";

const sections = [
    { section: "BSIT-3A", total: 692, avg: 34.6, rate: "94%", trend: "+3%" },
    { section: "BSIT-1C", total: 625, avg: 31.3, rate: "91%", trend: "+1%" },
    { section: "BSCS-1A", total: 580, avg: 29.0, rate: "88%", trend: "-2%" },
    { section: "BSCS-2B", total: 478, avg: 23.9, rate: "82%", trend: "+5%" },
    { section: "BSIT-4A", total: 410, avg: 20.5, rate: "78%", trend: "-1%" },
];

export default function SectionAttendanceTable() {
    return (
        <div className="overflow-hidden">
            <div className="grid grid-cols-5 gap-2 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-600 border-b border-[#1e293b]">
                <span>Section</span>
                <span className="text-right">Total</span>
                <span className="text-right">Avg/Day</span>
                <span className="text-right">Rate</span>
                <span className="text-right">Trend</span>
            </div>
            {sections.map((s, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 px-3 py-2.5 text-xs border-b border-[#1e293b]/50 last:border-b-0 hover:bg-slate-800/30 transition-colors">
                    <span className="font-bold text-slate-100">{s.section}</span>
                    <span className="text-right text-slate-400 font-mono">{s.total}</span>
                    <span className="text-right text-slate-400 font-mono">{s.avg}</span>
                    <span className="text-right text-slate-300 font-bold">{s.rate}</span>
                    <span className={`text-right font-bold ${s.trend.startsWith("+") ? "text-emerald-400" : "text-rose-400"}`}>{s.trend}</span>
                </div>
            ))}
        </div>
    );
}
