import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function SystemOverviewCard({ label, value, sub, color = "sky", icon, live, trend, trendUp }) {
    const accentMap = {
        sky:     "bg-sky-500",
        emerald: "bg-emerald-500",
        purple:  "bg-purple-500",
        amber:   "bg-amber-500",
        rose:    "bg-rose-500",
    };
    const accent = accentMap[color] || accentMap.sky;

    return (
        <div className="bg-[#1E293B] border border-[#334155] p-5 rounded-2xl relative overflow-hidden group hover:border-slate-400 transition-colors">
            {/* Gloss */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
            {/* Shimmer */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
            {/* Left accent stripe */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${accent}`} />

            <div className="flex justify-between items-start mb-2">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                    {label}
                    {live && (
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                        </span>
                    )}
                </p>
                <span className="text-slate-600 group-hover:text-slate-400 transition-colors">{icon}</span>
            </div>
            <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
                <p className="text-slate-500 text-[10px] font-medium italic">{sub}</p>
            </div>

            {/* trend badge */}
            {trend && (
                <div className={`mt-3 inline-flex items-center gap-1 text-[10px] font-black tracking-widest px-2 py-0.5 rounded-md ${
                    trendUp ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                }`}>
                    {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {trend} vs last week
                </div>
            )}
        </div>
    );
}
