import React from "react";
import { Monitor, Laptop, AlertTriangle, Check } from "lucide-react";

export default function PCGridLayout({ stations, selectedPC, onSelectPC, selectMode = false, checkedPCs = [], onToggleCheck }) {
    return (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-8 shadow-2xl relative overflow-hidden group hover:border-slate-600 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none z-10" />
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none z-10" />
            <div className="w-2/3 max-w-md mx-auto h-4 bg-slate-800 rounded-b-xl mb-12 flex items-center justify-center relative shadow-md">
                <span className="absolute -bottom-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                    Whiteboard / Professor
                </span>
            </div>

            <div className="grid grid-cols-5 md:grid-cols-8 gap-4 max-w-5xl mx-auto">
                {stations.map((station) => {
                    const isChecked = checkedPCs.includes(station.id);
                    return (
                        <button
                            key={station.id}
                            onClick={() => selectMode ? onToggleCheck(station.id) : onSelectPC(station)}
                            className={`aspect-square rounded-xl border flex flex-col items-center justify-center p-2 transition-all duration-300 relative group
                                ${station.status === 'Occupied' ? 'bg-sky-500/10 border-sky-500/30 hover:border-sky-400 hover:bg-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.1)]' : ''}
                                ${station.status === 'Laptop' ? 'bg-purple-500/10 border-purple-500/30 hover:border-purple-400 hover:bg-purple-500/20' : ''}
                                ${station.status === 'Maintenance' ? 'bg-amber-500/10 border-amber-500/50 hover:bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse' : ''}
                                ${station.status === 'Available' ? 'bg-[#1e293b] border-slate-700/50 hover:border-slate-500 opacity-60' : ''}
                                ${selectedPC?.id === station.id && !selectMode ? 'ring-2 ring-white scale-105' : 'hover:scale-105'}
                                ${selectMode && isChecked ? 'ring-2 ring-purple-500 scale-105 bg-purple-500/15' : ''}
                            `}
                        >
                            {selectMode && (
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded border flex items-center justify-center transition-all z-20 ${
                                    isChecked
                                        ? 'bg-purple-500 border-purple-400'
                                        : 'bg-slate-800/80 border-slate-600 group-hover:border-slate-400'
                                }`}>
                                    {isChecked && <Check size={10} className="text-white" strokeWidth={3} />}
                                </div>
                            )}

                            {station.status === 'Laptop' ? (
                                <Laptop size={24} className={`mb-1 ${station.status === 'Laptop' ? 'text-purple-400' : ''}`} />
                            ) : (
                                <Monitor size={24} className={`mb-1 
                                    ${station.status === 'Occupied' ? 'text-sky-400' : ''}
                                    ${station.status === 'Maintenance' ? 'text-amber-500' : ''}
                                    ${station.status === 'Available' ? 'text-slate-500' : ''}
                                `} />
                            )}

                            <span className={`text-[10px] font-black tracking-widest ${
                                station.status === 'Maintenance' ? 'text-amber-400' : 'text-slate-300'
                            }`}>
                                {station.id}
                            </span>

                            {station.status === 'Maintenance' && (
                                <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-900 p-0.5 rounded-full shadow-lg">
                                    <AlertTriangle size={12} fill="currentColor" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}