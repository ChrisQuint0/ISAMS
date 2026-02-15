import React from "react";

export default function HealthLine({ id, current, max, isAlert, isLaptop }) {
    const percentage = Math.min((current / max) * 100, 100);
    
    return (
        <div className="group cursor-default">
            <div className="flex justify-between items-end mb-2">
                <span className={`text-xs font-bold tracking-wide ${isAlert ? "text-amber-500" : "text-slate-300"}`}>
                    {id} {isAlert && "⚠"} {isLaptop && "💻"}
                </span>
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                    {isLaptop ? "Health Tracking Paused" : `${current} / ${max} Hours`}
                </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-700 rounded-full ${
                        isLaptop ? "bg-slate-600 w-0" : isAlert ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse" : "bg-sky-500"
                    }`}
                    style={{ width: isLaptop ? '0%' : `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
}