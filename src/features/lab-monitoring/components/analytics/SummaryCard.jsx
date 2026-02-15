import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function SummaryCard({ title, value, icon, trend, trendUp }) {
    return (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-600 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-[#020617] rounded-xl border border-[#1e293b] text-sky-400 group-hover:text-sky-300 transition-colors">
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
                <h3 className="text-3xl font-bold text-white tracking-tight mb-1">{value}</h3>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{title}</p>
            </div>
        </div>
    );
}