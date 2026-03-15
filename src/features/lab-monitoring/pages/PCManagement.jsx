import React, { useState, useEffect } from "react";
import { Laptop, Monitor, X, Wrench, RotateCcw, History, AlertTriangle, Clock, ShieldCheck, Loader2 } from "lucide-react";

import PCGridLayout from "../layouts/PCGridLayout";
import StationInspector from "../components/pc-management/StationInspector";
import BulkMaintenanceModal from "../components/pc-management/BulkMaintenanceModal";
import ToastNotification from "../components/pc-management/ToastNotification";
import { usePCManagement } from "../hooks/usePCManagement";
import { useAuth } from "../../auth/hooks/useAuth";

export default function PCManagement() {
    const labName = sessionStorage.getItem('active_lab_name') || "Lab 1";
    const displayTitle = labName.replace(/^(Computer\s*)?Lab\s/i, 'Computer Laboratory ');
    const { user } = useAuth();

    const {
        stations, maintenanceHistory, loading,
        convertToLaptop, convertToPC, flagMaintenance, clearMaintenance, resetTimers
    } = usePCManagement(labName);

    const [selectedPC, setSelectedPC] = useState(null);
    const [selectMode, setSelectMode] = useState(null);
    const [checkedPCs, setCheckedPCs] = useState([]);
    const [bulkMode, setBulkMode] = useState(null);
    const [bulkChecked, setBulkChecked] = useState([]);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);

    useEffect(() => {
        if (selectedPC) {
            const updatedPC = stations.find(s => s.id === selectedPC.id);
            if (updatedPC) setSelectedPC(updatedPC);
        }
    }, [stations, selectedPC?.id]);

    useEffect(() => {
        if (alertMessage) {
            const timer = setTimeout(() => setAlertMessage(null), 3500);
            return () => clearTimeout(timer);
        }
    }, [alertMessage]);

    const handleToggleCheck = (pcId) => {
        const targetStation = stations.find(s => s.id === pcId);
        if (!targetStation?.user) {
            setAlertMessage("Device modes can only be changed for occupied stations.");
            return;
        }
        setCheckedPCs(prev => prev.includes(pcId) ? prev.filter(id => id !== pcId) : [...prev, pcId]);
    };

    const handleBulkToggle = (pcId) => setBulkChecked(prev => prev.includes(pcId) ? prev.filter(id => id !== pcId) : [...prev, pcId]);

    const handleConvertToLaptop = async () => {
        await convertToLaptop(checkedPCs);
        setCheckedPCs([]); setSelectMode(null);
    };

    const handleConvertToPC = async () => {
        await convertToPC(checkedPCs);
        setCheckedPCs([]); setSelectMode(null);
    };

    const handleFlagMaintenance = async (pcId, note) => { await flagMaintenance([pcId], note, user?.user_metadata?.full_name); };
    const handleClearMaintenance = async (pcId) => { await clearMaintenance([pcId], user?.user_metadata?.full_name); };
    const handleResetTimer = async (pcId) => { await resetTimers([pcId]); };

    const handleBulkMaintenance = async (customNote) => {
        await flagMaintenance(bulkChecked, customNote, user?.user_metadata?.full_name);
        setBulkChecked([]); setBulkMode(null); setIsBulkModalOpen(false);
    };

    if (loading) {
        return (
            <div className="p-8 bg-[#020617] min-h-screen flex items-center justify-center text-sky-400">
                <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">Scanning {labName} Hardware Fleet...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-5 bg-[#020617] min-h-screen text-slate-100 relative">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{displayTitle} — Station Map</h1>
                    <p className="text-slate-400 text-sm italic">Visual Capacity & Hardware Management</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {!bulkMode && !selectMode && (
                    <>
                        <button onClick={() => { setBulkMode("maintenance"); setBulkChecked([]); }} className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all group/btn relative overflow-hidden">
                            <Wrench size={12} /> Bulk Maintenance
                        </button>
                        <button onClick={() => { setBulkMode("reset"); setBulkChecked([]); }} className="flex items-center gap-2 px-4 py-2 bg-sky-500/10 border border-sky-500/20 hover:border-sky-500/40 text-sky-400 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all group/btn relative overflow-hidden">
                            <RotateCcw size={12} /> Bulk Reset Timers
                        </button>
                        <div className="border-l border-[#1e293b] h-6 mx-1" />
                        <button onClick={() => setSelectMode("laptop")} className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 text-purple-400 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all group/btn relative overflow-hidden">
                            <Laptop size={12} /> To Laptop
                        </button>
                        <button onClick={() => setSelectMode("pc")} className="flex items-center gap-2 px-4 py-2 bg-sky-500/10 border border-sky-500/20 hover:border-sky-500/40 text-sky-400 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all group/btn relative overflow-hidden">
                            <Monitor size={12} /> To PC
                        </button>
                    </>
                )}

                {selectMode && (
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg border ${selectMode === "laptop" ? "text-purple-400 bg-purple-500/10 border-purple-500/20" : "text-sky-400 bg-sky-500/10 border-sky-500/20"}`}>
                            {checkedPCs.length} Selected
                        </span>
                        <button onClick={selectMode === "laptop" ? handleConvertToLaptop : handleConvertToPC} disabled={checkedPCs.length === 0} className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${checkedPCs.length > 0 ? (selectMode === "laptop" ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg' : 'bg-sky-500 hover:bg-sky-600 text-white shadow-lg') : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>
                            Confirm
                        </button>
                        <button onClick={() => { setCheckedPCs([]); setSelectMode(null); }} className="p-2 text-slate-500 hover:text-slate-300 bg-[#1e293b] rounded-lg transition-all"><X size={13} /></button>
                    </div>
                )}

                {bulkMode && (
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg border ${bulkMode === "maintenance" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-sky-400 bg-sky-500/10 border-sky-500/20"}`}>
                            {bulkChecked.length} Selected
                        </span>
                        <button onClick={bulkMode === "maintenance" ? () => setIsBulkModalOpen(true) : async () => { await resetTimers(bulkChecked); setBulkChecked([]); setBulkMode(null); }} disabled={bulkChecked.length === 0} className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${bulkChecked.length > 0 ? (bulkMode === "maintenance" ? "bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-lg" : "bg-sky-500 hover:bg-sky-600 text-white shadow-lg") : "bg-slate-800 text-slate-500 cursor-not-allowed"}`}>
                            Confirm
                        </button>
                        <button onClick={() => { setBulkChecked([]); setBulkMode(null); }} className="p-2 text-slate-500 hover:text-slate-300 bg-[#1e293b] rounded-lg transition-all"><X size={13} /></button>
                    </div>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                <div className="flex-1 space-y-4 min-h-0">
                    <PCGridLayout
                        stations={stations}
                        selectedPC={selectedPC}
                        onSelectPC={setSelectedPC}
                        selectMode={!!selectMode || !!bulkMode}
                        checkedPCs={selectMode ? checkedPCs : bulkChecked}
                        onToggleCheck={selectMode ? handleToggleCheck : handleBulkToggle}
                    />
                </div>

                <div className="w-full lg:w-80 space-y-4 flex flex-col">
                    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-2xl flex-1 min-h-0 flex flex-col group relative overflow-hidden hover:border-slate-600 transition-colors">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Station Inspector</h3>
                        <StationInspector
                            selectedPC={selectedPC}
                            onFlagMaintenance={handleFlagMaintenance}
                            onClearMaintenance={handleClearMaintenance}
                            onResetTimer={handleResetTimer}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 shadow-2xl group relative overflow-hidden hover:border-slate-600 transition-colors">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                    <History size={12} className="text-amber-500" /> Maintenance History
                </h3>
                <div className="space-y-2 overflow-y-auto pr-1 max-h-64 relative z-10">
                    {maintenanceHistory.length === 0 ? (
                        <p className="text-xs text-slate-600 italic text-center py-6">No maintenance events recorded</p>
                    ) : (
                        maintenanceHistory.map((entry) => (
                            <div key={entry.id} className={`border rounded-lg p-3 transition-colors hover:border-slate-600 ${entry.action === "Flagged" ? "bg-amber-500/5 border-amber-500/15" : "bg-emerald-500/5 border-emerald-500/15"}`}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-white">{entry.pcId}</span>
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${entry.action === "Flagged" ? "text-amber-400 border-amber-500/20" : "text-emerald-400 border-emerald-500/20"}`}>
                                            {entry.action === "Flagged" ? "Flagged" : "Cleared"}
                                        </span>
                                    </div>
                                    <span className="text-[9px] font-mono text-slate-600">{entry.time}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 truncate">{entry.note}</p>
                                <p className="text-[9px] text-slate-600 mt-1">{entry.date}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <BulkMaintenanceModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onConfirm={handleBulkMaintenance}
                pcCount={bulkChecked.length}
            />

            <ToastNotification
                message={alertMessage}
                onClose={() => setAlertMessage(null)}
            />
        </div>
    );
}