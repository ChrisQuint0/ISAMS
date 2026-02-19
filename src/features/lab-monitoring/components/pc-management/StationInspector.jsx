import React, { useState, useEffect } from "react";
import { Monitor, Laptop, User, Wrench, RotateCcw, ShieldCheck, AlertTriangle, Send, Clock, GraduationCap } from "lucide-react";

export default function StationInspector({ selectedPC, onFlagMaintenance, onClearMaintenance, onResetTimer }) {
    const [showNoteInput, setShowNoteInput] = useState(false);
    const [maintenanceNote, setMaintenanceNote] = useState("");

    useEffect(() => {
        setShowNoteInput(false);
        setMaintenanceNote("");
    }, [selectedPC?.id]);

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

    const handleSubmitFlag = () => {
        if (!maintenanceNote.trim()) return;
        onFlagMaintenance(selectedPC.id, maintenanceNote.trim());
        setMaintenanceNote("");
        setShowNoteInput(false);
    };

    return (
        <div className="space-y-5 flex-1 flex flex-col h-full">
            <div className="flex items-center gap-4 border-b border-[#1e293b] pb-4">
                <div className={`p-3 rounded-xl ${
                    isMaintenance ? 'bg-amber-500/20 text-amber-500'
                    : isLaptop ? 'bg-purple-500/20 text-purple-500'
                    : 'bg-sky-500/20 text-sky-500'
                }`}>
                    {isLaptop ? <Laptop size={28} /> : <Monitor size={28} />}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">{selectedPC.id}</h2>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                        isMaintenance ? 'text-amber-500'
                        : isLaptop ? 'text-purple-400'
                        : 'text-slate-400'
                    }`}>
                        {selectedPC.status}
                    </span>
                </div>
            </div>

            <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Current User</span>
                {selectedPC.user ? (
                    <div className="bg-[#020617] p-4 rounded-lg border border-[#1e293b] mt-1 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center shrink-0">
                                <User size={18} className="text-sky-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-base font-bold text-white truncate">{selectedPC.user.name}</p>
                                <p className="text-xs text-slate-500 font-mono">{selectedPC.user.studentId}</p>
                            </div>
                        </div>
                        <div className="flex gap-4 pt-1 border-t border-[#1e293b]">
                            <div className="flex items-center gap-1.5">
                                <GraduationCap size={12} className="text-slate-500" />
                                <span className="text-xs text-slate-400">{selectedPC.user.section}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock size={12} className="text-slate-500" />
                                <span className="text-xs text-slate-400">In: {selectedPC.user.timeIn}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 mt-1 text-sm bg-[#020617] p-2 rounded-lg border border-[#1e293b]">
                        <User size={14} className="text-slate-500" />
                        <span className="text-slate-500 italic">Empty Station</span>
                    </div>
                )}
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

            {isMaintenance && selectedPC.maintenanceNote && (
                <div>
                    <span className="text-[10px] text-amber-500 uppercase tracking-widest font-black flex items-center gap-1.5">
                        <AlertTriangle size={10} /> Maintenance Description
                    </span>
                    <div className="bg-amber-500/5 p-3 rounded-lg border border-amber-500/20 mt-1 space-y-1.5">
                        <p className="text-[11px] text-slate-300 leading-relaxed">{selectedPC.maintenanceNote}</p>
                        <p className="text-[9px] text-slate-600 font-mono uppercase tracking-wider">Flagged: {selectedPC.maintenanceDate}</p>
                    </div>
                </div>
            )}

            {showNoteInput && !isMaintenance && (
                <div className="space-y-2">
                    <span className="text-[10px] text-amber-400 uppercase tracking-widest font-black">Describe the Issue</span>
                    <textarea
                        value={maintenanceNote}
                        onChange={(e) => setMaintenanceNote(e.target.value)}
                        placeholder="e.g. Keyboard not responding, monitor flickering..."
                        rows={3}
                        className="w-full bg-[#020617] border border-amber-500/30 rounded-lg p-2.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 resize-none transition-all"
                    />
                    <div className="flex gap-2">
                        <button 
                            onClick={handleSubmitFlag}
                            disabled={!maintenanceNote.trim()}
                            className={`flex-1 flex items-center justify-center gap-2 text-[10px] font-bold py-2.5 rounded-lg uppercase tracking-widest transition-all ${
                                maintenanceNote.trim() 
                                    ? "bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-lg shadow-amber-500/20" 
                                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                            }`}
                        >
                            <Send size={12} /> Confirm Flag
                        </button>
                        <button 
                            onClick={() => { setShowNoteInput(false); setMaintenanceNote(""); }}
                            className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 bg-[#020617] border border-[#1e293b] hover:border-slate-600 rounded-lg transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="mt-auto pt-4 space-y-2">
                {isMaintenance ? (
                    <button 
                        onClick={() => onClearMaintenance(selectedPC.id)}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 text-[11px] font-bold py-3 rounded-xl uppercase tracking-widest transition-all group/btn relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/0 via-emerald-400/0 to-emerald-400/0 group-hover/btn:from-emerald-400/5 group-hover/btn:via-emerald-400/0 group-hover/btn:to-emerald-400/0 transition-all duration-500 pointer-events-none" />
                        <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                        <ShieldCheck size={14} /> Clear Maintenance
                    </button>
                ) : (
                    <button 
                        onClick={() => setShowNoteInput(true)}
                        disabled={showNoteInput}
                        className={`w-full flex items-center justify-center gap-2 text-[11px] font-bold py-3 rounded-xl uppercase tracking-widest transition-all group/btn relative overflow-hidden ${
                            showNoteInput 
                                ? "bg-amber-500/10 border border-amber-500/30 text-amber-400" 
                                : "bg-[#1e293b] hover:bg-[#334155] text-slate-300"
                        }`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover/btn:from-slate-400/5 group-hover/btn:via-slate-400/0 group-hover/btn:to-slate-400/0 transition-all duration-500 pointer-events-none" />
                        <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                        <Wrench size={14} /> {showNoteInput ? "Describe Issue Below" : "Flag as Maintenance"}
                    </button>
                )}

                <button 
                    onClick={() => onResetTimer(selectedPC.id)}
                    disabled={selectedPC.hours === 0}
                    className={`w-full flex items-center justify-center gap-2 text-[11px] font-bold py-3 rounded-xl uppercase tracking-widest transition-all relative overflow-hidden group/btn2 ${
                        selectedPC.hours > 0 
                        ? "bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-lg shadow-amber-500/20" 
                        : "bg-slate-800 text-slate-500 cursor-not-allowed"
                    }`}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover/btn2:from-white/10 group-hover/btn2:via-white/0 group-hover/btn2:to-white/0 transition-all duration-500 pointer-events-none" />
                    <div className="absolute inset-0 -translate-x-full group-hover/btn2:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                    <RotateCcw size={14} /> Reset Health Timer
                </button>
            </div>
        </div>
    );
}