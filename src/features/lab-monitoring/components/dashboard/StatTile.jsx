import React from "react";

export default function StatTile({ label, value, sub, color, icon }) {
    const accentColor = { blue: "bg-sky-500", purple: "bg-purple-500", amber: "bg-amber-500" }[color];
    
    return (
        <div className="bg-[#1E293B] border border-[#334155] p-6 rounded-2xl relative overflow-hidden group hover:border-slate-400 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentColor}`}></div>
            <div className="flex justify-between items-start mb-2 text-slate-100">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{label}</p>
                <span className="text-slate-600 group-hover:text-slate-400 transition-colors">{icon}</span>
            </div>
            <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
                <p className="text-slate-500 text-[10px] font-medium italic">{sub}</p>
            </div>
        </div>
    );
}