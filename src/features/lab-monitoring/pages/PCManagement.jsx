import React, { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { Laptop, Monitor, X, Wrench, RotateCcw, History, AlertTriangle, Clock, ShieldCheck, Activity } from "lucide-react";

import PCGridLayout from "../layouts/PCGridLayout"; 
import StationInspector from "../components/pc-management/StationInspector";

export default function PCManagement() {
    const { labName } = useOutletContext();
    
    const [selectedPC, setSelectedPC] = useState(null);

    const [selectMode, setSelectMode] = useState(null);
    const [checkedPCs, setCheckedPCs] = useState([]);

    const [maintenanceHistory, setMaintenanceHistory] = useState([
        { id: 1, pcId: "PC-12", action: "Flagged", note: "Monitor flickering intermittently", date: "Feb 14, 2026", time: "09:20 AM" },
        { id: 2, pcId: "PC-28", action: "Flagged", note: "Keyboard keys unresponsive (F-row)", date: "Feb 15, 2026", time: "02:15 PM" },
        { id: 3, pcId: "PC-07", action: "Cleared", note: "Replaced faulty RAM module", date: "Feb 15, 2026", time: "04:30 PM" },
        { id: 4, pcId: "PC-19", action: "Cleared", note: "Reinstalled OS — cleaned up malware", date: "Feb 13, 2026", time: "11:45 AM" },
        { id: 5, pcId: "PC-33", action: "Flagged", note: "USB ports not recognizing devices", date: "Feb 12, 2026", time: "08:55 AM" },
        { id: 6, pcId: "PC-33", action: "Cleared", note: "Replaced USB hub controller", date: "Feb 13, 2026", time: "10:00 AM" },
    ]);
    

    const [bulkMode, setBulkMode] = useState(null); 
    const [bulkChecked, setBulkChecked] = useState([]);

    const studentNames = [
        "Juan Dela Cruz", "Maria Santos", "Jose Rizal Jr.", "Ana Reyes", "Carlo Mendoza",
        "Bea Garcia", "Mark Villanueva", "Ella Torres", "Luis Ramos", "Sofia Cruz",
        "Daniel Aquino", "Rina Bautista", "Kevin Lim", "Jasmine Tan", "Paolo Rivera",
        "Chloe Navarro", "Angelo Pascual", "Trisha Flores", "Ryan De Leon", "Nicole Castillo",
        "James Soriano", "Bianca Morales", "Miguel Fernandez", "Alyssa Domingo", "Chris Salazar",
        "Hannah Valdez", "Adrian Mercado", "Camille Aguilar", "Ethan Dizon", "Samantha Perez",
        "Nathan Gutierrez", "Pauline Herrera", "Jeric Santos", "Mika Evangelista", "Ralph Manalo",
        "Diane Cordero", "Bryan Ignacio", "Katrina Medina", "Ivan Ocampo", "Lea Santiago"
    ];
    const studentIds = studentNames.map((_, i) => `2024-${String(1000 + i)}`);

    const [stations, setStations] = useState(Array.from({ length: 40 }, (_, i) => {
        const num = i + 1;
        const id = `PC-${num.toString().padStart(2, '0')}`;
        
        if (num === 12 || num === 28) return { id, status: "Maintenance", user: null, hours: 505, maintenanceNote: num === 12 ? "Monitor flickering intermittently" : "Keyboard keys unresponsive (F-row)", maintenanceDate: num === 12 ? "Feb 14, 2026" : "Feb 15, 2026" };
        if (num === 5 || num === 14) return { id, status: "Laptop", user: { name: studentNames[i], studentId: studentIds[i], section: "BSIT-3A", timeIn: "14:05" }, hours: 120 };
        if (num % 3 === 0) return { id, status: "Available", user: null, hours: 250 };
        return { id, status: "Occupied", user: { name: studentNames[i], studentId: studentIds[i], section: "BSIT-3A", timeIn: "14:05" }, hours: 340 };
    }));

    const healthStats = useMemo(() => {
        const total = stations.length;
        const avgHours = Math.round(stations.reduce((sum, s) => sum + s.hours, 0) / total);
        const atRisk = stations.filter(s => s.hours >= 400).length;
        const inMaintenance = stations.filter(s => s.status === "Maintenance").length;
        const occupied = stations.filter(s => s.status === "Occupied").length;
        const laptops = stations.filter(s => s.status === "Laptop").length;
        const available = stations.filter(s => s.status === "Available").length;
        return { total, avgHours, atRisk, inMaintenance, occupied, laptops, available, atRiskPct: Math.round((atRisk / total) * 100) };
    }, [stations]);

    const handleToggleCheck = (pcId) => {
        setCheckedPCs(prev => 
            prev.includes(pcId) ? prev.filter(id => id !== pcId) : [...prev, pcId]
        );
    };

    const handleConvertToLaptop = () => {
        setStations(prev => prev.map(s => 
            checkedPCs.includes(s.id) ? { ...s, status: "Laptop" } : s
        ));
        setCheckedPCs([]);
        setSelectMode(null);
    };

    const handleConvertToPC = () => {
        setStations(prev => prev.map(s => 
            checkedPCs.includes(s.id) && s.status === "Laptop" ? { ...s, status: "Available" } : s
        ));
        setCheckedPCs([]);
        setSelectMode(null);
    };

    const handleCancelSelect = () => {
        setCheckedPCs([]);
        setSelectMode(null);
    };

    const handleFlagMaintenance = (pcId, note) => {
        const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const timeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        setStations(prev => prev.map(s => 
            s.id === pcId 
                ? { ...s, status: "Maintenance", maintenanceNote: note, maintenanceDate: dateStr, user: null }
                : s
        ));
        setSelectedPC(prev => prev?.id === pcId 
            ? { ...prev, status: "Maintenance", maintenanceNote: note, maintenanceDate: dateStr, user: null }
            : prev
        );
        setMaintenanceHistory(prev => [{ id: Date.now(), pcId, action: "Flagged", note, date: dateStr, time: timeStr }, ...prev]);
    };

    const handleClearMaintenance = (pcId) => {
        const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const timeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        const station = stations.find(s => s.id === pcId);
        setStations(prev => prev.map(s => 
            s.id === pcId 
                ? { ...s, status: "Available", maintenanceNote: null, maintenanceDate: null, hours: 0 }
                : s
        ));
        setSelectedPC(prev => prev?.id === pcId 
            ? { ...prev, status: "Available", maintenanceNote: null, maintenanceDate: null, hours: 0 }
            : prev
        );
        setMaintenanceHistory(prev => [{ id: Date.now(), pcId, action: "Cleared", note: station?.maintenanceNote || "Maintenance resolved", date: dateStr, time: timeStr }, ...prev]);
    };

    const handleResetTimer = (pcId) => {
        setStations(prev => prev.map(s => 
            s.id === pcId ? { ...s, hours: 0 } : s
        ));
        setSelectedPC(prev => prev?.id === pcId ? { ...prev, hours: 0 } : prev);
    };

    const handleBulkToggle = (pcId) => {
        setBulkChecked(prev =>
            prev.includes(pcId) ? prev.filter(id => id !== pcId) : [...prev, pcId]
        );
    };

    const handleBulkMaintenance = () => {
        const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const timeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        setStations(prev => prev.map(s =>
            bulkChecked.includes(s.id)
                ? { ...s, status: "Maintenance", maintenanceNote: "Bulk flagged for maintenance", maintenanceDate: dateStr, user: null }
                : s
        ));
        bulkChecked.forEach(pcId => {
            setMaintenanceHistory(prev => [{ id: Date.now() + Math.random(), pcId, action: "Flagged", note: "Bulk flagged for maintenance", date: dateStr, time: timeStr }, ...prev]);
        });
        setBulkChecked([]);
        setBulkMode(null);
    };

    const handleBulkResetTimers = () => {
        setStations(prev => prev.map(s =>
            bulkChecked.includes(s.id) ? { ...s, hours: 0 } : s
        ));
        setBulkChecked([]);
        setBulkMode(null);
    };

    const handleCancelBulk = () => {
        setBulkChecked([]);
        setBulkMode(null);
    };

    const isInAnySelectMode = !!selectMode || !!bulkMode;

    return (
        <div className="p-8 space-y-5 bg-[#020617] min-h-screen text-slate-100">
            
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{labName} — Station Map</h1>
                    <p className="text-slate-400 text-sm italic">Visual Capacity & Hardware Management</p>
                </div>
            </div>
            
            
            <div className="flex items-center gap-2">
                {!bulkMode && !selectMode && (
                    <>
                        <button
                            onClick={() => { setBulkMode("maintenance"); setBulkChecked([]); }}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all group/btn relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/0 via-amber-400/0 to-amber-400/0 group-hover/btn:from-amber-400/5 group-hover/btn:via-amber-400/0 group-hover/btn:to-amber-400/0 transition-all duration-500 pointer-events-none" />
                            <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                            <Wrench size={12} /> Bulk Maintenance
                        </button>
                        <button
                            onClick={() => { setBulkMode("reset"); setBulkChecked([]); }}
                            className="flex items-center gap-2 px-4 py-2 bg-sky-500/10 border border-sky-500/20 hover:border-sky-500/40 text-sky-400 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all group/btn relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-sky-400/0 via-sky-400/0 to-sky-400/0 group-hover/btn:from-sky-400/5 group-hover/btn:via-sky-400/0 group-hover/btn:to-sky-400/0 transition-all duration-500 pointer-events-none" />
                            <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                            <RotateCcw size={12} /> Bulk Reset Timers
                        </button>
                        <div className="border-l border-[#1e293b] h-6 mx-1" />
                        <button
                            onClick={() => setSelectMode("laptop")}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 text-purple-400 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all group/btn relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 via-purple-400/0 to-purple-400/0 group-hover/btn:from-purple-400/5 group-hover/btn:via-purple-400/0 group-hover/btn:to-purple-400/0 transition-all duration-500 pointer-events-none" />
                            <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                            <Laptop size={12} /> To Laptop
                        </button>
                        <button
                            onClick={() => setSelectMode("pc")}
                            className="flex items-center gap-2 px-4 py-2 bg-sky-500/10 border border-sky-500/20 hover:border-sky-500/40 text-sky-400 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all group/btn relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-sky-400/0 via-sky-400/0 to-sky-400/0 group-hover/btn:from-sky-400/5 group-hover/btn:via-sky-400/0 group-hover/btn:to-sky-400/0 transition-all duration-500 pointer-events-none" />
                            <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                            <Monitor size={12} /> To PC
                        </button>
                    </>
                )}
        

                {selectMode && (
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg border ${
                            selectMode === "laptop"
                                ? "text-purple-400 bg-purple-500/10 border-purple-500/20"
                                : "text-sky-400 bg-sky-500/10 border-sky-500/20"
                        }`}>
                            {checkedPCs.length} Selected
                        </span>
                        <button
                            onClick={selectMode === "laptop" ? handleConvertToLaptop : handleConvertToPC}
                            disabled={checkedPCs.length === 0}
                            className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                                checkedPCs.length > 0
                                    ? selectMode === "laptop"
                                        ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                        : 'bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            {selectMode === "laptop" ? <Laptop size={12} /> : <Monitor size={12} />}
                            Confirm
                        </button>
                        <button onClick={handleCancelSelect} className="p-2 text-slate-500 hover:text-slate-300 bg-[#1e293b] hover:bg-[#334155] rounded-lg transition-all">
                            <X size={13} />
                        </button>
                    </div>
                )}

                {bulkMode && (
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg border ${
                            bulkMode === "maintenance"
                                ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                                : "text-sky-400 bg-sky-500/10 border-sky-500/20"
                        }`}>
                            {bulkChecked.length} Selected — {bulkMode === "maintenance" ? "Mark Maintenance" : "Reset Timers"}
                        </span>
                        <button
                            onClick={bulkMode === "maintenance" ? handleBulkMaintenance : handleBulkResetTimers}
                            disabled={bulkChecked.length === 0}
                            className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                                bulkChecked.length > 0
                                    ? bulkMode === "maintenance"
                                        ? "bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-lg shadow-amber-500/20"
                                        : "bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20"
                                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                            }`}
                        >
                            {bulkMode === "maintenance" ? <Wrench size={12} /> : <RotateCcw size={12} />}
                            Confirm
                        </button>
                        <button onClick={handleCancelBulk} className="p-2 text-slate-500 hover:text-slate-300 bg-[#1e293b] hover:bg-[#334155] rounded-lg transition-all">
                            <X size={13} />
                        </button>
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
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6">
                                    Station Inspector
                                </h3>
                                <div className="min-h-0 flex-1">
                                    <StationInspector 
                                    selectedPC={selectedPC}
                                    onFlagMaintenance={handleFlagMaintenance}
                                    onClearMaintenance={handleClearMaintenance}
                                    onResetTimer={handleResetTimer}
                                    />
                                </div>
                            </div>
                </div>
            </div>

            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 shadow-2xl group relative overflow-hidden hover:border-slate-600 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <History size={12} className="text-amber-500" /> Maintenance History
                    </h3>
                </div>
                <div className="space-y-2 overflow-y-auto pr-1 relative z-10 max-h-64">
                    {maintenanceHistory.length === 0 ? (
                        <p className="text-xs text-slate-600 italic text-center py-6">No maintenance events recorded</p>
                    ) : (
                        maintenanceHistory.map((entry) => (
                            <div key={entry.id} className={`border rounded-lg p-3 transition-colors hover:border-slate-600 ${
                                entry.action === "Flagged"
                                    ? "bg-amber-500/5 border-amber-500/15"
                                    : "bg-emerald-500/5 border-emerald-500/15"
                            }`}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-white">{entry.pcId}</span>
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                                            entry.action === "Flagged"
                                                ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                                                : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                        }`}>
                                            {entry.action === "Flagged" ? <span className="flex items-center gap-1"><AlertTriangle size={8} /> Flagged</span> : <span className="flex items-center gap-1"><ShieldCheck size={8} /> Cleared</span>}
                                        </span>
                                    </div>
                                    <span className="text-[9px] font-mono text-slate-600">{entry.time}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed truncate">{entry.note}</p>
                                <p className="text-[9px] text-slate-600 font-mono mt-1">{entry.date}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
            
        </div>
    );
}