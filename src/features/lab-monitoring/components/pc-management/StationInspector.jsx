import React from "react";
import { Monitor, User, Wrench, RotateCcw } from "lucide-react";

export default function StationInspector({ selectedPC }) {
    if (!selectedPC) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50 space-y-4">
                <Monitor size={48} strokeWidth={1} />
                <p className="text-xs uppercase tracking-widest text-center">Select a station<br/>to view details</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 flex-1 flex flex-col h-full">
            <div className="flex items-center gap-4 border-b border-[#1e293b] pb-4">
                <div className={`p-3 rounded-xl ${
                    selectedPC.status === 'Maintenance' ? 'bg-amber-500/20 text-amber-500' : 'bg-sky-500/20 text-sky-500'
                }`}>
                    <Monitor size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">{selectedPC.id}</h2>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                        selectedPC.status === 'Maintenance' ? 'text-amber-500' : 'text-slate-400'
                    }`}>
                        {selectedPC.status}
                    </span>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Current User</span>
                    <div className="flex items-center gap-2 mt-1 text-slate-300 text-sm bg-[#020617] p-2 rounded-lg border border-[#1e293b]">
                        <User size={14} className="text-slate-500" />
                        {selectedPC.user ? "Assigned (See Access Logs)" : "Empty Station"}
                    </div>
                </div>

                <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Hardware Pulse</span>
                    <div className="bg-[#020617] p-3 rounded-lg border border-[#1e293b] mt-1 space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                            <span className={selectedPC.hours >= 500 ? "text-amber-500 font-bold" : "text-slate-400"}>
                                {selectedPC.hours} HRS
                            </span>
                            <span className="text-slate-600">500 MAX</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${selectedPC.hours >= 500 ? 'bg-amber-500 animate-pulse' : 'bg-sky-500'}`} 
                                style={{ width: `${Math.min((selectedPC.hours / 500) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-auto pt-4 space-y-2">
                <button className="w-full flex items-center justify-center gap-2 bg-[#1e293b] hover:bg-[#334155] text-slate-300 text-[11px] font-bold py-3 rounded-xl uppercase tracking-widest transition-all">
                    <Wrench size={14} /> Log Maintenance
                </button>
                <button className={`w-full flex items-center justify-center gap-2 text-[11px] font-bold py-3 rounded-xl uppercase tracking-widest transition-all ${
                    selectedPC.hours >= 500 
                    ? "bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-lg shadow-amber-500/20" 
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                }`}>
                    <RotateCcw size={14} /> Reset Health Timer
                </button>
            </div>
        </div>
    );
}