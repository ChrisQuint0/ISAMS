import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

/**
 * Report highlight card — compact KPI with trend badge.
 */
export default function ReportHighlightCard({ title, value, sub, icon, trend, trendUp, valueColor, color }) {
    const colorMap = {
        rose: {
            bg: "bg-rose-950/30",
            border: "border-rose-500/20",
            hoverBorder: "hover:border-rose-500/40",
            gloss: "group-hover:from-rose-400/5",
            shimmer: "via-rose-200/5",
            iconBg: "bg-rose-950/50",
            iconBorder: "border-rose-500/20",
            iconColor: "text-rose-400 group-hover:text-rose-300",
        },
    };
    const c = color && colorMap[color];

    return (
        <div className={`${c ? `${c.bg} ${c.border} ${c.hoverBorder}` : "bg-[#1E293B] border-[#334155] hover:border-slate-500"} border rounded-2xl p-5 relative overflow-hidden group transition-colors`}>
            {/* Gloss */}
            <div className={`absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 ${c ? c.gloss : "group-hover:from-slate-400/5"} group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none`} />
            {/* Shimmer */}
            <div className={`absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent ${c ? c.shimmer : "via-white/5"} to-transparent pointer-events-none`} />

            <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl border transition-colors ${c ? `${c.iconBg} ${c.iconBorder} ${c.iconColor}` : "bg-[#0F172A] border-[#334155] text-sky-400 group-hover:text-sky-300"}`}>
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-[10px] font-black tracking-widest px-2 py-1 rounded-md ${
                        trendUp ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                    }`}>
                        {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {trend}
                    </div>
                )}
            </div>
            <div>
                <h3 className={`text-2xl font-bold tracking-tight mb-0.5 ${valueColor || "text-white"}`}>{value}</h3>
                {sub && <p className="text-slate-400 text-[11px] font-mono mt-1">{sub}</p>}
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">{title}</p>
            </div>
        </div>
    );
}
