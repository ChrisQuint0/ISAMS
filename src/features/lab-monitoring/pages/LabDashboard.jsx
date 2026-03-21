import React, { useState, useEffect } from "react";
import {
    ShieldAlert, CheckCircle, Users, Activity,
    Monitor, Clock, Zap, BarChart3, Wrench, ScanBarcode, CalendarDays,
} from "lucide-react";

// Hook & Lib
import { useLabDashboard } from "../hooks/useLabDashboard";
import { supabase } from "../../../lib/supabaseClient";
import { useGlobalSettings } from "../context/LabSettingsContext";

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
    const labId = sessionStorage.getItem('active_lab_id') || "lab-1";
    const labName = sessionStorage.getItem('active_lab_name') || "Lab 1";

    const isDefense = labName?.toLowerCase().includes('defense');
    const CAPACITY = isDefense ? 20 : 40;

    // Formatter converts "Lab 2" to "Computer Laboratory 2"
    const displayTitle = isDefense
        ? `${labName} Room`
        : labName.replace(/^(Computer\s*)?Lab\s/i, 'Computer Laboratory ');

    const { clock, currentClass, metrics, activities, loading } = useLabDashboard(labName);
    const { settings } = useGlobalSettings();

    const [isDismissed, setIsDismissed] = useState(false);
    const [dismissDialogOpen, setDismissDialogOpen] = useState(false);

    useEffect(() => {
        if (currentClass) {
            setIsDismissed(!!currentClass.is_early_dismissal_active);
        } else {
            setIsDismissed(false);
        }
    }, [currentClass]);

    const confirmDismiss = async () => {
        if (!currentClass) return;

        const nextStatus = !isDismissed;

        setIsDismissed(nextStatus);
        setDismissDialogOpen(false);

        const { error } = await supabase
            .from('lab_schedules_lm')
            .update({ is_early_dismissal_active: nextStatus })
            .eq('id', currentClass.id);

        if (error) {
            console.error("Dismissal update failed:", error);
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
        <div className="p-8 bg-neutral-100 min-h-screen flex items-center justify-center text-primary-600">
            <div className="text-center space-y-4">
                <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest animate-pulse">
                    Synchronizing {labName} Metrics...
                </p>
            </div>
        </div>
    );

    return (
        <div className="p-6 bg-neutral-100 min-h-screen text-neutral-900 font-sans transition-colors duration-500">

            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-[30px] font-bold text-neutral-900 tracking-tight">
                            {displayTitle} — Dashboard
                        </h1>

                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${isDismissed ? "bg-success/10 text-success border-success/20" : "bg-destructive-semantic/10 text-destructive-semantic border-destructive-semantic/20"
                            }`}>
                            {isDismissed ? <CheckCircle size={10} /> : <ShieldAlert size={10} />}
                            {isDismissed ? "Unlocked" : "Session Locked"}
                        </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-neutral-600 text-sm italic">
                        {currentClass ? (
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="font-semibold text-neutral-700">Active: {currentClass.section_block}</span>
                                <span className="mx-1 text-neutral-500">|</span>
                                <span className="text-neutral-700">{currentClass.subject_name}</span>
                                <span className="mx-1 text-neutral-500">|</span>
                                <span className="text-neutral-700">{currentClass.professor}</span>
                                <span className="mx-1 text-neutral-500">|</span>
                                <span className="text-primary-600 font-mono text-[11px] font-bold">
                                    {formatToAMPM(currentClass.time_start)} - {formatToAMPM(currentClass.time_end)}
                                </span>
                            </div>
                        ) : (
                            <span className="text-neutral-600 text-sm italic">System Idle — Waiting for Session...</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-neutral-50 border border-neutral-200 rounded-lg shadow-sm h-9">
                        <CalendarDays size={14} className="text-primary-600" />
                        <span className="text-xs font-mono text-neutral-900 tabular-nums tracking-widest font-semibold">
                            {clock.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-neutral-50 border border-neutral-200 rounded-lg shadow-sm h-9">
                        <Clock size={14} className="text-primary-600" />
                        <span className="text-xs font-mono text-neutral-900 tabular-nums tracking-widest font-semibold">
                            {clock.toLocaleTimeString("en-US", { hour12: true, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                    </div>

                    {settings?.anti_cutting && (
                        <Button
                            onClick={() => setDismissDialogOpen(true)}
                            disabled={!currentClass}
                            variant={isDismissed ? "default" : "destructive"}
                            className="flex items-center gap-2 text-sm font-semibold h-9"
                            size="sm"
                        >
                            {isDismissed ? <CheckCircle size={14} /> : <ShieldAlert size={14} />}
                            <span>{isDismissed ? "Class Dismissed" : "Dismiss Class"}</span>
                        </Button>
                    )}
                </div>
            </div>

            <section className="mb-6">
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 lg:col-span-7 grid grid-cols-2 gap-3">
                        <SystemOverviewCard
                            label="Occupancy"
                            value={`${metrics.activeOccupancy}/${CAPACITY}`}
                            sub={`${Math.round((metrics.activeOccupancy / CAPACITY) * 100)}% Capacity`}
                            color="info" icon={<Users size={16} />} live
                            trend={`${metrics.isTrendUp ? '+' : '-'}${metrics.occupancyTrend}%`}
                            trendUp={metrics.isTrendUp}
                        />
                        <SystemOverviewCard label="Total Scans" value={metrics.totalScansToday} sub="Today's Activity" color="warning" icon={<ScanBarcode size={16} />} />
                        <SystemOverviewCard label="Uptime" value={getUptime()} sub="Session Elapsed" color="success" icon={<Zap size={16} />} live={!!currentClass && !isDismissed} />
                        <SystemOverviewCard label="Maintenance" value={metrics.flaggedPCs} sub="PC Flags" color="destructive-semantic" icon={<Wrench size={16} />} />
                    </div>

                    <div className="col-span-12 lg:col-span-5 bg-white border border-neutral-200 rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col group hover:border-neutral-300 transition-colors">
                        <h3 className="text-[10px] font-black text-neutral-900 uppercase tracking-widest mb-4 flex gap-2"><Monitor size={12} className="text-primary-600" /> Device Distribution</h3>
                        <div className="flex flex-1 items-center justify-between gap-6">
                            <div className="relative w-48 h-48 flex items-center justify-center flex-shrink-0">
                                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="var(--neutral-200)" strokeWidth="4.5" />
                                    <circle
                                        cx="18" cy="18" r="15.915" fill="transparent" stroke="var(--gold-500)" strokeWidth="4.5"
                                        strokeDasharray={`${(metrics.laptopUsers / CAPACITY) * 100} ${100 - (metrics.laptopUsers / CAPACITY) * 100}`}
                                        strokeDashoffset="0" className="transition-all duration-1000 ease-out"
                                    />
                                    <circle
                                        cx="18" cy="18" r="15.915" fill="transparent" stroke="var(--primary-600)" strokeWidth="4.5"
                                        strokeDasharray={`${(metrics.pcUsers / CAPACITY) * 100} ${100 - (metrics.pcUsers / CAPACITY) * 100}`}
                                        strokeDashoffset={`-${(metrics.laptopUsers / CAPACITY) * 100}`} className="transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="absolute text-center">
                                    <span className="text-3xl font-bold text-neutral-900 tracking-tighter">{metrics.activeOccupancy}</span>
                                    <p className="text-[10px] text-neutral-500 font-black uppercase">Total</p>
                                </div>
                            </div>
                            <div className="flex flex-col flex-1 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center"><span className="text-sm text-neutral-700">PCs</span><span className="font-mono font-bold text-primary-600">{metrics.pcUsers}</span></div>
                                    <div className="flex justify-between items-center"><span className="text-sm text-neutral-700">Laptops</span><span className="font-mono font-bold" style={{color: 'var(--gold-500)'}}>{metrics.laptopUsers}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-12 gap-5 h-[45vh]">
                <div className="col-span-12 lg:col-span-8 bg-white border border-neutral-200 rounded-2xl p-4 shadow-md flex flex-col overflow-hidden">
                    <h2 className="text-[10px] font-black text-neutral-900 uppercase tracking-widest mb-4 flex gap-2"><BarChart3 size={12} className="text-primary-600" /> Occupancy Trend Analysis</h2>
                    <div className="flex-1 min-h-0">
                        <OccupancyChart labName={labName} />
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-4 bg-white border border-neutral-200 rounded-2xl p-4 shadow-md flex flex-col overflow-hidden">
                    <h2 className="text-[10px] font-black text-neutral-900 uppercase tracking-widest mb-4 flex gap-2"><Clock size={12} className="text-success" /> Live Audit Trail</h2>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {activities.length > 0 ? activities.map((log) => (
                            <ActivityItem
                                key={log.id}
                                time={new Date(log.time_out ? log.time_out : log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                text={log.time_out ? "Timed Out" : "Timed In"}
                                detail={`${log.students?.full_name || "Unknown Student"} (${log.log_type === 'Laptop'
                                        ? 'Laptop'
                                        : (log.pc_no ? `PC - ${log.pc_no}` : 'PC Station')
                                    })`}
                            />
                        )) : (
                            <div className="text-center py-10 text-neutral-600 font-mono text-xs italic">No activity recorded for {labName}</div>
                        )}
                    </div>
                </div>
            </div>

            <Dialog open={dismissDialogOpen} onOpenChange={setDismissDialogOpen}>
                <DialogContent className="bg-neutral-50 border-neutral-200 text-neutral-900 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className={isDismissed ? "text-success" : "text-destructive-semantic"}>
                            {isDismissed ? "Re-lock Session?" : "Dismiss Class Early?"}
                        </DialogTitle>
                        <DialogDescription className="text-neutral-600 italic">
                            {isDismissed
                                ? "This will re-lock the Kiosk system. Students will be restricted from timing out early until the official schedule ends. Do you want to proceed?"
                                : "Are you sure you want to dismiss the class early? This will unlock the Kiosk system and allow all students to scan out immediately."}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-3 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setDismissDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmDismiss}
                            variant={isDismissed ? "default" : "destructive"}
                        >
                            {isDismissed ? "Confirm Lock" : "Confirm Dismissal"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}