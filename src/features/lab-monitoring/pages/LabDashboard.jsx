import React, { useState, useEffect } from "react";
import { useOutletContext, useLocation } from "react-router-dom";
import {
    ShieldAlert, CheckCircle, Users, Activity,
    Monitor, Clock, Zap, BarChart3, Wrench, ScanBarcode,
} from "lucide-react";

// Hook & Lib
import { useLabDashboard } from "../hooks/useLabDashboard";
import { supabase } from "../../../lib/supabaseClient";

// Components
import SystemOverviewCard from "../components/dashboard/SystemOverviewCard";
import ActivityItem from "../components/dashboard/ActivityItem";
import OccupancyChart from "../components/dashboard/OccupancyChart";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function LabDashboard() {
    const location = useLocation();
    const context = useOutletContext() || {};
    
    // Retrieve BOTH labId and labName, with Session Storage as the ultimate backup
    const labId = location.state?.labId || context.labId || sessionStorage.getItem('active_lab_id') || "lab-1";
    const labName = location.state?.labName || context.labName || sessionStorage.getItem('active_lab_name') || "Lab 1"; 

    // Keep memory updated
    useEffect(() => {
        sessionStorage.setItem('active_lab_id', labId);
        sessionStorage.setItem('active_lab_name', labName);
    }, [labId, labName]);

    const { clock, currentClass, metrics, activities, loading } = useLabDashboard(labName);
    const [isDismissed, setIsDismissed] = useState(false);
    
    // NEW: State to control the confirmation dialog
    const [dismissDialogOpen, setDismissDialogOpen] = useState(false);

    // Dynamic configuration
    const isDefense = labName?.toLowerCase().includes('defense');
    const CAPACITY = isDefense ? 20 : 40; 

    useEffect(() => {
        if (currentClass) {
            setIsDismissed(!!currentClass.is_early_dismissal_active);
        } else {
            setIsDismissed(false);
        }
    }, [currentClass]);

    // NEW: The actual dismissal logic is now safely wrapped inside this confirmation function
    const confirmDismiss = async () => {
        if (!currentClass) return;

        const nextStatus = !isDismissed;
        
        // Optimistic UI Update & Close Dialog
        setIsDismissed(nextStatus);
        setDismissDialogOpen(false);

        // Update Database
        const { error } = await supabase
            .from('lab_schedules_lm')
            .update({ is_early_dismissal_active: nextStatus })
            .eq('id', currentClass.id);

        if (error) {
            console.error("Dismissal update failed:", error);
            // Rollback UI state if DB update fails
            setIsDismissed(!nextStatus);
        }
    };

    function getUptime() {
        if (!currentClass || isDismissed) return "00:00:00";

        const timeStr = currentClass.time_start;
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        let h = parseInt(hours);

        if (modifier?.toUpperCase() === 'PM' && h < 12) h += 12;
        if (modifier?.toUpperCase() === 'AM' && h === 12) h = 0;

        const sessionStart = new Date(clock);
        sessionStart.setHours(h, parseInt(minutes), 0, 0);

        const diffInSeconds = Math.floor((clock - sessionStart) / 1000);
        if (diffInSeconds < 0) return "00:00:00";

        const h_out = String(Math.floor(diffInSeconds / 3600)).padStart(2, '0');
        const m_out = String(Math.floor((diffInSeconds % 3600) / 60)).padStart(2, '0');
        const s_out = String(diffInSeconds % 60).padStart(2, '0');

        return `${h_out}:${m_out}:${s_out}`;
    }

    const formatToAMPM = (timeStr) => {
        if (!timeStr) return "";
        if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr;
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayHours = h % 12 || 12;
        return `${displayHours}:${minutes} ${ampm}`;
    };

    if (loading) return (
        <div className="p-8 bg-[#020617] min-h-screen flex items-center justify-center text-sky-400">
            <div className="text-center space-y-4">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">
                    Synchronizing {labName} Metrics...
                </p>
            </div>
        </div>
    );

    return (
        <div className="p-8 bg-[#020617] min-h-screen text-slate-100 font-sans transition-colors duration-500">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                            {isDefense ? `${labName} Room` : `Computer ${labName}`} — Dashboard
                        </h1>
                        
                        {/* FIX: Removed the aggressive animate-pulse from the badge */}
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${
                            isDismissed ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        }`}>
                            {isDismissed ? <CheckCircle size={10} /> : <ShieldAlert size={10} />}
                            {isDismissed ? "Unlocked" : "Session Locked"}
                        </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-slate-400 text-sm italic">
                        {currentClass ? (
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="font-semibold text-slate-300">Active: {currentClass.section_block}</span>
                                <span className="mx-1 text-slate-500">|</span>
                                <span className="text-slate-300">{currentClass.subject_name}</span>
                                <span className="mx-1 text-slate-500">|</span>
                                <span className="text-slate-300">{currentClass.professor}</span>
                                <span className="mx-1 text-slate-500">|</span>
                                <span className="text-sky-400 font-mono text-[11px] font-bold">
                                    {formatToAMPM(currentClass.time_start)} - {formatToAMPM(currentClass.time_end)}
                                </span>
                            </div>
                        ) : (
                            <span className="text-slate-500 font-mono text-xs uppercase tracking-widest">System Idle — Waiting for Session...</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg">
                        <Clock size={14} className="text-sky-400" />
                        <span className="text-sm font-mono text-white tabular-nums tracking-widest">
                            {clock.toLocaleTimeString("en-US", { hour12: true, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                    </div>

                    {/* FIX: Opens Dialog instead of instantly dismissing, and removed animate-pulse */}
                    <button
                        onClick={() => setDismissDialogOpen(true)} 
                        disabled={!currentClass}
                        className={`flex items-center gap-3 text-[11px] font-black py-3 px-8 rounded-xl uppercase tracking-widest transition-all duration-500 shadow-2xl disabled:opacity-20 ${
                            isDismissed 
                                ? "bg-emerald-600 border-emerald-500 shadow-emerald-900/20" 
                                : "bg-rose-600 border-rose-500 shadow-rose-900/20"
                        }`}
                    >
                        {isDismissed ? <CheckCircle size={16} /> : <ShieldAlert size={16} />}
                        <span>{isDismissed ? "Class Dismissed" : "Dismiss Class"}</span>
                    </button>
                </div>
            </div>

            {/* Metrics Section */}
            <section className="mb-6">
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 lg:col-span-7 grid grid-cols-2 gap-3">
                        <SystemOverviewCard
                            label="Occupancy"
                            value={`${metrics.activeOccupancy}/${CAPACITY}`}
                            sub={`${Math.round((metrics.activeOccupancy / CAPACITY) * 100)}% Capacity`}
                            color="sky" icon={<Users size={16} />} live
                            trend={`${metrics.isTrendUp ? '+' : '-'}${metrics.occupancyTrend}%`}
                            trendUp={metrics.isTrendUp}
                        />
                        <SystemOverviewCard label="Total Scans" value={metrics.totalScansToday} sub="Today's Activity" color="rose" icon={<ScanBarcode size={16} />} />
                        <SystemOverviewCard label="Uptime" value={getUptime()} sub="Session Elapsed" color="emerald" icon={<Zap size={16} />} live={!!currentClass && !isDismissed} />
                        <SystemOverviewCard label="Maintenance" value={metrics.flaggedPCs} sub="PC Flags" color="rose" icon={<Wrench size={16} />} />
                    </div>

                    <div className="col-span-12 lg:col-span-5 bg-[#1E293B] border border-[#334155] rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col group hover:border-slate-400 transition-colors">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Device Distribution</h3>
                        <div className="flex flex-1 items-center justify-between gap-6">
                            <div className="relative w-48 h-48 flex items-center justify-center flex-shrink-0">
                                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#020617" strokeWidth="4.5" />
                                    <circle 
                                        cx="18" cy="18" r="15.915" fill="transparent" stroke="#7C3AED" strokeWidth="4.5" 
                                        strokeDasharray={`${(metrics.laptopUsers / CAPACITY) * 100} ${100 - (metrics.laptopUsers / CAPACITY) * 100}`} 
                                        strokeDashoffset="0" className="transition-all duration-1000 ease-out"
                                    />
                                    <circle 
                                        cx="18" cy="18" r="15.915" fill="transparent" stroke="#0EA5E9" strokeWidth="4.5" 
                                        strokeDasharray={`${(metrics.pcUsers / CAPACITY) * 100} ${100 - (metrics.pcUsers / CAPACITY) * 100}`} 
                                        strokeDashoffset={`-${(metrics.laptopUsers / CAPACITY) * 100}`} className="transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="absolute text-center">
                                    <span className="text-3xl font-bold text-white tracking-tighter">{metrics.activeOccupancy}</span>
                                    <p className="text-[10px] text-slate-500 font-black uppercase">Total</p>
                                </div>
                            </div>
                            <div className="flex flex-col flex-1 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center"><span className="text-sm text-slate-300">PCs</span><span className="font-mono font-bold text-sky-400">{metrics.pcUsers}</span></div>
                                    <div className="flex justify-between items-center"><span className="text-sm text-slate-300">Laptops</span><span className="font-mono font-bold text-purple-400">{metrics.laptopUsers}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Overall Fleet Status Bar */}
            <section className="mb-6">
                <div className="w-full bg-[#1E293B] border border-[#334155] rounded-2xl p-5 shadow-xl">
                    <div className="flex-1 space-y-3">
                        <div className="flex justify-between text-[9px] uppercase font-black text-slate-500 tracking-[0.2em]">
                            <span>Fleet Context: {labName}</span>
                            <span>{currentClass ? 'Active Session Statistics' : 'Idle Mode'}</span>
                        </div>
                        <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex">
                            <div className="bg-sky-500 transition-all duration-1000" style={{ width: `${(metrics.pcUsers / CAPACITY) * 100}%` }} />
                            <div className="bg-purple-500 transition-all duration-1000" style={{ width: `${(metrics.laptopUsers / CAPACITY) * 100}%` }} />
                        </div>
                        <div className="flex gap-6 text-[10px] font-bold">
                            <span className="flex items-center gap-2 text-sky-400"><div className="w-2 h-2 rounded-full bg-sky-500" /> PC: {metrics.pcUsers}</span>
                            <span className="flex items-center gap-2 text-purple-400"><div className="w-2 h-2 rounded-full bg-purple-500" /> Laptop: {metrics.laptopUsers}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bottom Grid */}
            <div className="grid grid-cols-12 gap-5 h-[40vh]">
                <div className="col-span-12 lg:col-span-8 bg-[#1E293B] border border-[#334155] rounded-2xl p-4 shadow-xl flex flex-col overflow-hidden">
                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex gap-2"><BarChart3 size={12} className="text-sky-500" /> Occupancy Trend Analysis</h2>
                    <div className="flex-1 min-h-0">
                         <OccupancyChart labName={labName} />
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-4 bg-[#1E293B] border border-[#334155] rounded-2xl p-4 shadow-xl flex flex-col overflow-hidden">
                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex gap-2"><Clock size={12} className="text-sky-500" /> Live Audit Trail</h2>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {activities.length > 0 ? activities.map((log) => (
                            <ActivityItem 
                                key={log.id} 
                                time={new Date(log.time_out ? log.time_out : log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                                text={log.time_out ? "Timed Out" : "Timed In"} 
                                detail={`${log.students?.full_name || "Unknown Student"} (${
                                    log.log_type === 'PC' 
                                    ? (log.pc_no ? `PC - ${log.pc_no}` : 'PC Station') 
                                    : 'Laptop'
                                })`} 
                            />
                        )) : (
                            <div className="text-center py-10 text-slate-600 font-mono text-xs italic">No activity recorded for {labName}</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Security Confirmation Dialog */}
            <Dialog open={dismissDialogOpen} onOpenChange={setDismissDialogOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className={isDismissed ? "text-emerald-500" : "text-rose-500"}>
                            {isDismissed ? "Re-lock Session?" : "Dismiss Class Early?"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 italic">
                            {isDismissed 
                                ? "This will re-lock the Kiosk system. Students will be restricted from timing out early until the official schedule ends. Do you want to proceed?" 
                                : "Are you sure you want to dismiss the class early? This will unlock the Kiosk system and allow all students to scan out immediately."}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-3 mt-4">
                        <Button 
                            variant="outline" 
                            onClick={() => setDismissDialogOpen(false)} 
                            className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={confirmDismiss} 
                            className={`text-white font-bold ${
                                isDismissed 
                                    ? "bg-emerald-600 hover:bg-emerald-700" 
                                    : "bg-rose-600 hover:bg-rose-700"
                            }`}
                        >
                            {isDismissed ? "Confirm Lock" : "Confirm Dismissal"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}