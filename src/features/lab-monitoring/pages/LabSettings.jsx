import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { 
    ShieldCheck, 
    Monitor, 
    Save, 
    Database, 
    RefreshCcw 
} from "lucide-react";
import SettingRow from "../components/settings/SettingRow";

export default function LabSettings() {
    const { labName } = useOutletContext();
    const [isSaving, setIsSaving] = useState(false);

    return (
        <div className="p-8 space-y-10 bg-[#020617] min-h-screen text-slate-100">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#1e293b] pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        {labName} — System Settings
                    </h1>
                    <p className="text-slate-400 text-sm italic">
                        Manage core attendance protocols and hardware maintenance thresholds.
                    </p>
                </div>
                
                <button 
                    onClick={() => setIsSaving(true)}
                    className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2.5 px-6 rounded-lg transition-all shadow-lg shadow-sky-900/20 active:scale-95 group/btn relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover/btn:from-white/10 group-hover/btn:via-white/0 group-hover/btn:to-white/0 transition-all duration-500 pointer-events-none" />
                    <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                    <Save size={16} /> 
                    <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-7 gap-8 items-stretch">
                
                <section className="xl:col-span-4 flex flex-col gap-6">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={18} className="text-sky-500" />
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                            Attendance Protocols
                        </h2>
                    </div>
                    
                    <div className="grid gap-4 flex-1">
                        <SettingRow 
                            label="Anti-Cutting Protocol" 
                            description="Enforce session locking based on official schedule. Prevents unauthorized early exits."
                        >
                            <div className="w-10 h-5 bg-sky-600 rounded-full flex items-center justify-end px-1 cursor-pointer ring-2 ring-sky-500/10">
                                <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
                            </div>
                        </SettingRow>

                        <SettingRow 
                            label="Hard Capacity Enforcer" 
                            description="Block Time-In if current occupancy reaches laboratory limit (e.g., 40/40)."
                        >
                            <div className="w-10 h-5 bg-sky-600 rounded-full flex items-center justify-end px-1 cursor-pointer ring-2 ring-sky-500/10">
                                <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
                            </div>
                        </SettingRow>

                        <SettingRow 
                            label="Automated Alphabetical Assignment" 
                            description="Auto-assign seats based on student surname rank upon scanning."
                        >
                            <div className="w-10 h-5 bg-sky-600 rounded-full flex items-center justify-end px-1 cursor-pointer ring-2 ring-sky-500/10">
                                <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
                            </div>
                        </SettingRow>
                    </div>
                </section>

                <div className="xl:col-span-3 flex flex-col gap-10">
                    
                    <section className="space-y-6">
                        <div className="flex items-center gap-2">
                            <Monitor size={18} className="text-sky-500" />
                            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                                Hardware Maintenance
                            </h2>
                        </div>

                        <div className="p-6 bg-[#0f172a] border border-[#1e293b] rounded-xl flex flex-col gap-6 shadow-sm group relative overflow-hidden hover:border-slate-600 transition-colors">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-200">Predictive Health Threshold</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black leading-relaxed">
                                        Limit for PC proactive alerts.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 bg-[#020617] border border-[#1e293b] rounded-lg px-2 py-1 shadow-inner">
                                    <span className="text-sky-400 font-black text-xs">500</span>
                                    <span className="text-[10px] text-slate-600 font-black">HRS</span>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-[#1e293b] rounded-full overflow-hidden">
                                <div className="h-full w-[80%] bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.3)]"></div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-6 flex-1 flex flex-col">
                        <div className="flex items-center gap-2">
                            <Database size={18} className="text-sky-500" />
                            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                                Data & Audit
                            </h2>
                        </div>

                        <div className="flex flex-col gap-4 flex-1">
                            <button className="flex items-center gap-4 p-5 bg-[#0f172a] border border-[#1e293b] rounded-xl hover:bg-[#1e293b] hover:border-slate-700 transition-all group relative overflow-hidden flex-1">
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                                <div className="p-3 bg-sky-500/10 rounded-lg group-hover:scale-110 transition-transform">
                                    <RefreshCcw size={20} className="text-sky-500" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-white">Refresh Audit Logs</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Sync records</p>
                                </div>
                            </button>

                            <button className="flex items-center gap-4 p-5 bg-[#0f172a] border border-[#1e293b] rounded-xl hover:bg-[#1e293b] hover:border-slate-700 transition-all group relative overflow-hidden flex-1">
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                                <div className="p-3 bg-emerald-500/10 rounded-lg group-hover:scale-110 transition-transform">
                                    <Database size={20} className="text-emerald-500" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-white">Export System Backup</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Download Backup</p>
                                </div>
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}