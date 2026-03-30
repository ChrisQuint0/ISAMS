import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function SummaryCard({ title, value, icon, trend, trendUp }) {
    return (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm hover:border-neutral-300 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-primary-500 hover:text-primary-600 transition-colors">
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5 px-2 py-1 rounded-md ${
                        trendUp ? "bg-success/10 text-success" : "bg-destructive-semantic/10 text-destructive-semantic"
                    }`}>
                        {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {trend}
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-3xl font-bold text-neutral-900 tracking-tight mb-1">{value}</h3>
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mt-0.5">{title}</p>
            </div>
        </div>
    );
}