import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
    ShieldAlert,
    CheckCircle,
    Users,
    Laptop,
    AlertTriangle,
    Monitor,
    Clock,
    Zap,
    BarChart3,
    Wrench,
} from "lucide-react";

// Dashboard components
import SystemOverviewCard from "../components/dashboard/SystemOverviewCard";
import ReportHighlightCard from "../components/dashboard/ReportHighlightCard";
import MaintenanceAlertRow from "../components/dashboard/MaintenanceAlertRow";
import ActivityItem from "../components/dashboard/ActivityItem";
import OccupancyChart from "../components/dashboard/OccupancyChart";

export default function LabDashboard() {
    const { labName } = useOutletContext();

    // Master Anti-Cutting Override State
    const [isDismissed, setIsDismissed] = useState(false);

    // Real-time clock
    const [clock, setClock] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setClock(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="p-8 bg-[#0F172A] min-h-screen text-slate-100 font-sans">

            {/* ═══════════════════ HEADER ═══════════════════ */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                            {labName || "Computer Laboratory 1"} — Dashboard
                        </h1>
                        <span
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${
                                isDismissed
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse"
                            }`}
                        >
                            {isDismissed ? <CheckCircle size={10} /> : <ShieldAlert size={10} />}
                            {isDismissed ? "Unlocked" : "Session Locked"}
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm italic">
                        Active Session: <span className="text-slate-300">BSIT-3A</span>
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Live Clock */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] border border-[#334155] rounded-lg">
                        <Clock size={14} className="text-sky-500" />
                        <span className="text-sm font-mono text-white tracking-widest tabular-nums">
                            {clock.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                    </div>

                    <button
                    onClick={() => setIsDismissed(!isDismissed)}
                    className={`text-[10px] font-bold py-2 px-5 rounded-lg flex items-center gap-2 transition-all duration-300 shadow-lg uppercase tracking-widest relative overflow-hidden group/btn ${
                        isDismissed
                            ? "bg-slate-800 text-slate-400 border border-slate-700"
                            : "bg-rose-500/80 hover:bg-rose-500 text-white shadow-rose-900/20 active:scale-95"
                    }`}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover/btn:from-white/10 group-hover/btn:via-white/0 group-hover/btn:to-white/0 transition-all duration-500 pointer-events-none" />
                    <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                    {isDismissed ? <CheckCircle size={13} /> : <ShieldAlert size={13} />}
                    {isDismissed ? "Class Dismissed" : "Dismiss Class"}
                </button>
                </div>
            </div>

            {/* ═══════════════════ UNIFIED STATS ROW ═══════════════════ */}
            <section className="mb-6">
                <div className="mb-3">
                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Monitor size={12} className="text-sky-500" /> Overview
                    </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <SystemOverviewCard label="Occupancy" value="38/40" sub="95% Capacity" color="sky" icon={<Users size={16} />} live trend="+5%" trendUp />
                    <SystemOverviewCard label="PC Users" value="33" sub="Desktop" color="purple" icon={<Monitor size={16} />} />
                    <SystemOverviewCard label="Laptop Users" value="05" sub="Hybrid" color="sky" icon={<Laptop size={16} />} />
                    <SystemOverviewCard label="Available" value="04" sub="Ready" color="emerald" icon={<Monitor size={16} />} />
                    <SystemOverviewCard label="Maintenance" value="03" sub="Flagged" color="amber" icon={<Wrench size={16} />} />
                    <SystemOverviewCard label="Uptime" value="03:22:15" sub="Session" color="sky" icon={<Zap size={16} />} live />
                </div>
            </section>

            {/* ═══════════════════ MAIN GRID ═══════════════════ */}
            <div className="grid grid-cols-12 gap-5">

                {/* ── LEFT COLUMN (8 cols) ── */}
                <div className="col-span-12 lg:col-span-8 space-y-5">

                    {/* Occupancy Trend Chart */}
                    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6 shadow-xl shadow-black/20 group relative overflow-hidden hover:border-slate-500 transition-colors">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Occupancy Trend</h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">Today's hourly student count</p>
                            </div>
                            <span className="text-[9px] text-slate-600 font-mono tracking-wider flex items-center gap-1.5">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                                </span>
                                LIVE
                            </span>
                        </div>
                        <OccupancyChart />
                    </div>

                    {/* Report Highlights + Maintenance — side by side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* Report Highlights */}
                        <div className="space-y-3">
                            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <BarChart3 size={12} className="text-sky-500" /> Report Highlights
                            </h2>
                            <div className="space-y-3">
                                <ReportHighlightCard title="Total Scans Today" value="142" icon={<Users size={18} />} trend="+8%" trendUp />
                                <ReportHighlightCard title="Lab Traffic" value="High" valueColor="text-rose-400" icon={<BarChart3 size={18} />} trend="+12%" trendUp />
                            </div>
                        </div>

                        {/* PCs Flagged for Maintenance */}
                        <div className="space-y-3">
                            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Wrench size={12} className="text-amber-500" /> Maintenance
                            </h2>
                            <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5 shadow-xl shadow-black/20 group relative overflow-hidden hover:border-slate-500 transition-colors h-[calc(100%-28px)]">
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

                                <div>
                                    <MaintenanceAlertRow unit="PC-12" message="Hardware malfunction reported." time="14:15" />
                                    <MaintenanceAlertRow unit="PC-01" message="Monitor display flickering." time="13:40" />
                                    <MaintenanceAlertRow unit="PC-22" message="Mouse peripheral unresponsive." time="12:05" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT COLUMN (4 cols) ── */}
                <div className="col-span-12 lg:col-span-4">

                    {/* Recent Activities */}
                    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6 shadow-xl shadow-black/20 group relative overflow-hidden hover:border-slate-500 transition-colors h-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Clock size={12} className="text-sky-500" /> Recent Activities
                        </h3>
                        <div className="space-y-1">
                            <ActivityItem time="14:22" text="Student Timed In" detail="PC-08 assigned alphabetically" />
                            <ActivityItem time="14:15" text="Maintenance Alert" detail="PC-12 reached health threshold" alert />
                            <ActivityItem time="14:10" text="Student Timed In" detail="PC-14 assigned (Laptop Mode)" />
                            <ActivityItem time="14:05" text="Session Init" detail="BSIT-3A session started" />
                            <ActivityItem time="13:58" text="Class Unlocked" detail="Faculty override applied" />
                            <ActivityItem time="13:50" text="System Boot" detail="All 40 stations initialized" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}