import React, { useState } from "react";
import { Monitor, Laptop, User, Wrench, RotateCcw, ShieldCheck, AlertTriangle, Clock, GraduationCap } from "lucide-react";
import StationMaintenanceModal from "./StationMaintenanceModal";

export default function StationInspector({ selectedPC, onFlagMaintenance, onClearMaintenance, onResetTimer }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!selectedPC) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50 space-y-4">
                <Monitor size={48} strokeWidth={1} />
                <p className="text-xs uppercase tracking-widest text-center">Select a station<br/>to view details</p>
            </div>
        );
    }

    const isMaintenance = selectedPC.status === "Maintenance";
    const isLaptop = selectedPC.status === "Laptop";
    
    // Formatting the numeric hours for a clean display
    const displayHours = Number(selectedPC.hours || 0).toFixed(1);
    const healthPercentage = Math.min((selectedPC.hours / 500) * 100, 100);

    const handleConfirmMaintenance = (note) => {
        onFlagMaintenance(selectedPC.id, note);
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-5 flex-1 flex flex-col h-full">
            {/* Header: Station ID & Mode */}
            <div className="flex items-center gap-4 border-b border-[#1e293b] pb-4">
                <div className={`p-3 rounded-xl transition-colors duration-500 ${
                    isMaintenance ? 'bg-amber-500/20 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                    : isLaptop ? 'bg-purple-500/20 text-purple-500'
                    : 'bg-sky-500/20 text-sky-500'
                }`}>
                    {isLaptop ? <Laptop size={28} /> : <Monitor size={28} />}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">{selectedPC.id}</h2>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                        isMaintenance ? 'text-amber-500'
                        : isLaptop ? 'text-purple-400'
                        : 'text-slate-400'
                    }`}>
                        {selectedPC.status}
                    </span>
                </div>
            </div>

            {/* User Details Section */}
            <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Current Occupant</span>
                {selectedPC.user ? (
                    <div className="bg-[#020617] p-4 rounded-lg border border-[#1e293b] mt-1 space-y-3 shadow-inner">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center shrink-0 border border-sky-500/10">
                                <User size={18} className="text-sky-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-base font-bold text-white truncate leading-tight">{selectedPC.user.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono tracking-wider">{selectedPC.user.studentId}</p>
                            </div>
                        </div>
                        <div className="flex gap-4 pt-1 border-t border-[#1e293b]/50">
                            <div className="flex items-center gap-1.5">
                                <GraduationCap size={12} className="text-slate-600" />
                                <span className="text-[11px] text-slate-400 font-medium">{selectedPC.user.section}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock size={12} className="text-slate-600" />
                                <span className="text-[11px] text-slate-400 font-medium">In: {selectedPC.user.timeIn}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 mt-1 text-xs bg-[#020617] p-3 rounded-lg border border-[#1e293b] border-dashed">
                        <User size={14} className="text-slate-700" />
                        <span className="text-slate-600 italic">No active session detected</span>
                    </div>
                )}
            </div>

            {/* Hardware Pulse: The Health Bar */}
            <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Hardware Pulse</span>
                <div className="bg-[#020617] p-3 rounded-lg border border-[#1e293b] mt-1 space-y-2">
                    <div className="flex justify-between text-[10px] font-mono tracking-tighter">
                        <span className={selectedPC.hours >= 500 ? "text-rose-500 font-bold animate-pulse" : "text-sky-400 font-bold"}>
                            {displayHours} HRS
                        </span>
                        <span className="text-slate-700">500.0 MAX</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div 
                            className={`h-full transition-all duration-1000 ease-out ${
                                selectedPC.hours >= 500 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' 
                                : selectedPC.hours >= 400 ? 'bg-amber-500'
                                : 'bg-sky-500'
                            }`} 
                            style={{ width: `${healthPercentage}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Maintenance Description (Conditional) */}
            {isMaintenance && selectedPC.maintenanceNote && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <span className="text-[10px] text-amber-500 uppercase tracking-widest font-black flex items-center gap-1.5">
                        <AlertTriangle size={10} /> Maintenance Log
                    </span>
                    <div className="bg-amber-500/5 p-3 rounded-lg border border-amber-500/20 mt-1 space-y-1.5">
                        <p className="text-[11px] text-slate-300 leading-relaxed font-medium">{selectedPC.maintenanceNote}</p>
                        <p className="text-[9px] text-slate-600 font-mono uppercase tracking-wider">Flagged: {selectedPC.maintenanceDate}</p>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="mt-auto pt-4 space-y-2">
                {isMaintenance ? (
                    <button 
                        onClick={() => onClearMaintenance(selectedPC.id)}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 text-[11px] font-bold py-3 rounded-xl uppercase tracking-widest transition-all group/btn relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/0 via-emerald-400/0 to-emerald-400/0 group-hover/btn:from-emerald-400/5 group-hover/btn:via-emerald-400/0 group-hover/btn:to-emerald-400/0 transition-all duration-500 pointer-events-none" />
                        <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                        <ShieldCheck size={14} /> Mark as Resolved
                    </button>
                ) : (
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 bg-[#1e293b] hover:bg-[#334155] text-slate-300 text-[11px] font-bold py-3 rounded-xl uppercase tracking-widest transition-all group/btn relative overflow-hidden border border-slate-800"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover/btn:from-slate-400/5 group-hover/btn:via-slate-400/0 group-hover/btn:to-slate-400/0 transition-all duration-500 pointer-events-none" />
                        <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                        <Wrench size={14} /> Flag Maintenance
                    </button>
                )}

                <button 
                    onClick={() => onResetTimer(selectedPC.id)}
                    disabled={selectedPC.hours === 0}
                    className={`w-full flex items-center justify-center gap-2 text-[11px] font-bold py-3 rounded-xl uppercase tracking-widest transition-all relative overflow-hidden group/btn2 ${
                        selectedPC.hours > 0 
                        ? "bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-lg shadow-amber-500/20" 
                        : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                    }`}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover/btn2:from-white/10 group-hover/btn2:via-white/0 group-hover/btn2:to-white/0 transition-all duration-500 pointer-events-none" />
                    <div className="absolute inset-0 -translate-x-full group-hover/btn2:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                    <RotateCcw size={14} /> Reset Usage Hours
                </button>
            </div>

            <StationMaintenanceModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmMaintenance}
                pcId={selectedPC.id}
            />
        </div>
    );
}