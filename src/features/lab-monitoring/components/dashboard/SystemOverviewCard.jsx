import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function SystemOverviewCard({ label, value, sub, color = "info", icon, live, trend, trendUp }) {
    // GSDS Semantic Color Mapping
    const colorMap = {
        info:     { hex: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" },            // info token
        success:  { hex: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },          // success token
        warning:  { hex: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },          // warning token
        "destructive-semantic": { hex: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" }, // destructive-semantic
    };
    const colors = colorMap[color] || colorMap.info;

    return (
        <div className="bg-white border border-neutral-200 p-5 rounded-2xl relative overflow-hidden group hover:border-neutral-300 transition-colors shadow-md">
            <div className="flex justify-between items-start mb-2">
                <p className="text-neutral-900 text-[10px] font-black uppercase tracking-normal flex items-center gap-1.5">
                    {label}
                    {live && (
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{backgroundColor: "#10b981"}} />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{backgroundColor: "#10b981"}} />
                        </span>
                    )}
                </p>
                <span className="text-xl transition-colors" style={{color: colors.hex}}>{icon}</span>
            </div>
            <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-neutral-900 tracking-normal">{value}</p>
                <p className="text-neutral-500 text-[10px] font-medium italic">{sub}</p>
            </div>

            {trend && (
                <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-black tracking-normal px-2 py-0.5 rounded-md" style={{
                    backgroundColor: trendUp ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                    color: trendUp ? "#10b981" : "#ef4444"
                }}>
                    {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {trend} vs last week
                </div>
            )}
        </div>
    );
}
