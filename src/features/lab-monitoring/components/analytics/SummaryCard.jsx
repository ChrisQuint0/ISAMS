import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function SummaryCard({ title, value, icon, trend, trendUp }) {
    return (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm hover:border-neutral-300 transition-colors">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-primary-500 hover:text-primary-600 transition-colors shrink-0">
                    {icon}
                </div>
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{title}</p>
            </div>
            <div>
                <h3 className="text-3xl font-bold text-neutral-900 tracking-tight mb-1">{value}</h3>
                {trend && (
                    <div className={`flex items-center gap-1 text-[10px] text-neutral-500 uppercase tracking-wider mt-2 px-2 py-1 rounded-md w-fit ${
                        trendUp ? "bg-success/10 text-success" : "bg-destructive-semantic/10 text-destructive-semantic"
                    }`}>
                        {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {trend}
                    </div>
                )}
            </div>
        </div>
    );
}