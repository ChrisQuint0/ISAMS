import React from "react";

export default function ActivityItem({ time, text, detail, alert }) {
    const dotColor = alert ? "#f59e0b" : "#008a45";     
    const textColor = alert ? "#f59e0b" : "#111827";   
    const timeColor = "#008a45";                        
    
    return (
        <div className="flex gap-4 relative pb-3 pt-1 group border-b border-neutral-200 last:border-0 last:pb-0">
            <div className="flex flex-col items-center shrink-0">
                <div className="w-2.5 h-2.5 rounded-full mt-1.5 z-10" style={{backgroundColor: dotColor}}></div>
                <div className="w-[1px] h-full bg-neutral-200 absolute top-5 group-last:hidden"></div>
            </div>
            
            <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-bold uppercase tracking-wider" style={{color: textColor}}>
                        {text}
                    </span>
                    <span className="text-[15px] font-mono font-bold" style={{color: timeColor, opacity: 0.8}}>{time}</span>
                </div>
                <p className="text-[11px] text-neutral-600 font-medium leading-tight">
                    {detail}
                </p>
            </div>
        </div>
    );
}