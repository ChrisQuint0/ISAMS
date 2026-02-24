import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
    ShieldAlert,
    CheckCircle,
    Users,
    Activity,
    Laptop,
    Monitor,
    Clock,
    Zap,
    BarChart3,
    Wrench,
    ScanBarcode,
} from "lucide-react";

// Dashboard components
import SystemOverviewCard from "../components/dashboard/SystemOverviewCard";
import ActivityItem from "../components/dashboard/ActivityItem";
import OccupancyChart from "../components/dashboard/OccupancyChart";

export default function LabDashboard() {
    const { labName } = useOutletContext();

    const [isDismissed, setIsDismissed] = useState(false);
    const [sessionStart, setSessionStart] = useState(null);
    const [sessionEnd, setSessionEnd] = useState(null);

    const [clock, setClock] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setClock(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!isDismissed && !sessionStart) {
            setSessionStart(new Date());
            setSessionEnd(null);
        } else if (isDismissed && sessionStart && !sessionEnd) {
            setSessionEnd(new Date());
        }
        if (!isDismissed && sessionStart && sessionEnd) {
            setSessionStart(new Date());
            setSessionEnd(null);
        }
    }, [isDismissed]);

    function getUptimeString() {
        let diff = 0;
        if (sessionStart && !isDismissed) {
            diff = Math.floor((clock - sessionStart) / 1000);
        } else if (sessionStart && sessionEnd) {
            diff = Math.floor((sessionEnd - sessionStart) / 1000);
        }
        const h = String(Math.floor(diff / 3600)).padStart(2, '0');
        const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
        const s = String(diff % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    const formattedDate = clock.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit"
    });

    const fleetOverview = {
        totalScheduledClasses: 5,
        totalLabEntries: 142,
        totalLabExits: 137,
        totalPCUsers: 98,
        totalLaptopUsers: 44,
        totalFlaggedMaintenance: 6,
        avgHours: 210,
        totalOccupancy: 142,
    };

    const scheduleDetails = {
        dayType: clock.toLocaleDateString("en-US", { weekday: "long" }),
        course: "IT Elective 3",
        subject: "Web Systems & Technologies",
        professor: "Prof. Juan Dela Cruz",
        timeStart: "1:00 PM",
        timeEnd: "4:00 PM",
    };

    return (
        <div className="p-8 bg-[#020617] min-h-screen text-slate-100 font-sans transition-colors duration-500">

            {/* Header Section */}
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
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-slate-400 text-sm italic">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-semibold text-slate-300">Active Session: BSIT-3A</span>
                            <span className="mx-1 text-slate-500">|</span>
                            <span className="font-semibold text-slate-300">{scheduleDetails.course}: {scheduleDetails.subject}</span>
                            <span className="mx-1 text-slate-500">|</span>
                            <span className="font-semibold text-slate-300">{scheduleDetails.professor}</span>
                            <span className="mx-1 text-slate-500">|</span>
                            <span className="font-semibold text-slate-300">{scheduleDetails.dayType}</span>
                            <span className="mx-1 text-slate-500">|</span>
                            <span className="font-semibold text-slate-300">{scheduleDetails.timeStart} - {scheduleDetails.timeEnd}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg min-w-[200px]">
                        <span className="text-sm font-mono text-white tracking-widest tabular-nums">
                            {clock.toLocaleTimeString("en-US", { hour12: true, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                        <span className="text-sm font-mono text-white tracking-widest tabular-nums ml-3">{formattedDate}</span>
                    </div>

                    <button
                        onClick={() => setIsDismissed(!isDismissed)}
                        className={`flex items-center gap-3 text-[11px] font-black py-3 px-8 rounded-xl uppercase tracking-[0.15em] transition-all duration-500 relative overflow-hidden group/btn shadow-2xl ${
                            isDismissed
                                ? "bg-emerald-600 border border-emerald-500 text-white hover:bg-emerald-500 hover:scale-105 active:scale-95"
                                : "bg-rose-600 border border-rose-500 text-white hover:bg-rose-500 hover:scale-105 active:scale-95 animate-pulse"
                        }`}
                        style={{
                            boxShadow: isDismissed 
                                ? '0 0 20px rgba(16, 185, 129, 0.4)' 
                                : '0 0 20px rgba(225, 29, 72, 0.4)'
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
                        <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
                        <div className="relative z-10 flex items-center gap-2">
                            {isDismissed ? <CheckCircle size={16} className="text-white" /> : <ShieldAlert size={16} className="text-white" />}
                            <span>{isDismissed ? "Class Dismissed" : "Dismiss Class"}</span>
                        </div>
                        <div className={`absolute inset-0 rounded-xl border-2 animate-[ping_2s_linear_infinite] pointer-events-none ${
                            isDismissed ? "border-emerald-400/50" : "border-rose-400/50"
                        }`} />
                    </button>
                </div>
            </div>

            {/* Session Overview Section */}
            <section className="mb-6">
                <div className="mb-3">
                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Monitor size={12} className="text-sky-500" /> Session Overview
                    </h2>
                </div>

                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 lg:col-span-7 grid grid-cols-2 gap-3">
                        <SystemOverviewCard
                            label="Occupancy"
                            value="38/40"
                            sub="95% Capacity"
                            color="sky"
                            icon={<Users size={16} />}
                            live
                            trend="+5%"
                            trendUp
                        />
                        <SystemOverviewCard 
                            label="Total Scans Today" 
                            value="142" 
                            sub="Lab entries" 
                            color="rose" 
                            icon={<ScanBarcode className="w-5 h-5 text-cyan-400" />}
                            trend="+8%" 
                            trendUp 
                        />
                        <SystemOverviewCard
                            label="Uptime"
                            value={getUptimeString()}
                            sub="Session"
                            color="emerald"
                            icon={<Zap size={16} />}
                            live={!isDismissed}
                        />
                        <SystemOverviewCard 
                            label="Lab Traffic" 
                            value="High" 
                            sub="Today" 
                            color="rose" 
                            icon={<BarChart3 size={16} />} 
                            trend="+12%" 
                            trendUp 
                        />
                    </div>

                    <div className="col-span-12 lg:col-span-5">
                        <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6 h-full shadow-xl relative overflow-hidden group hover:border-slate-500 transition-colors flex flex-col">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">
                                Device Distribution
                            </h3>
                            <div className="flex flex-1 items-center justify-between gap-6">
                                <div className="relative w-48 h-48 sm:w-56 sm:h-50 flex items-center justify-center flex-shrink-0">
                                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#020617" strokeWidth="4.5" />
                                        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#7C3AED" strokeWidth="4.5" strokeDasharray="17.5 82.5" strokeDashoffset="0" />
                                        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#0EA5E9" strokeWidth="4.5" strokeDasharray="82.5 17.5" strokeDashoffset="-17.5" />
                                    </svg>
                                    <div className="absolute text-center">
                                        <span className="text-3xl font-bold text-white tracking-tight">40</span>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total</p>
                                    </div>
                                </div>
                                <div className="flex flex-col justify-center flex-1 space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between group/item">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.4)]" />
                                                <span className="text-sm font-medium text-slate-300">PC Users</span>
                                            </div>
                                            <span className="text-sm font-mono font-bold text-white">33</span>
                                        </div>
                                        <div className="flex items-center justify-between group/item">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(124,58,237,0.4)]" />
                                                <span className="text-sm font-medium text-slate-300">Laptop Users</span>
                                            </div>
                                            <span className="text-sm font-mono font-bold text-white">07</span>
                                        </div>
                                    </div>
                                    <div className="bg-[#020617]/80 border border-amber-500/20 rounded-xl p-4 flex items-center gap-4 hover:bg-[#020617] transition-colors">
                                        <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-500">
                                            <Wrench size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold text-amber-500 leading-none">03</p>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1"> PC Flagged</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Overall Session Overview Section */}
            <section className="mb-6">
                <div className="mb-3">
                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Activity size={12} className="text-sky-500" /> Overall Session Overview
                    </h2>
                </div>

                <div className="w-full bg-[#1E293B] border border-[#334155] rounded-2xl p-4 shadow-xl group relative overflow-hidden hover:border-slate-500 transition-colors">
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Live Fleet Metrics</span>
                                <span className="text-[10px] font-mono text-slate-500">{fleetOverview.totalScheduledClasses} scheduled classes</span>
                            </div>
                            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex mt-2">
                                <div className="bg-sky-500" style={{ width: '40%' }} />
                                <div className="bg-sky-400" style={{ width: '20%' }} />
                                <div className="bg-purple-500" style={{ width: '20%' }} />
                                <div className="bg-purple-400" style={{ width: '15%' }} />
                                <div className="bg-amber-500 animate-pulse" style={{ width: '5%' }} />
                            </div>
                            <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest mt-1">
                                <span className="flex items-center gap-1.5 text-sky-400"><div className="w-2 h-2 rounded-full bg-sky-500" />Lab Entries: {fleetOverview.totalLabEntries}</span>
                                <span className="flex items-center gap-1.5 text-sky-300"><div className="w-2 h-2 rounded-full bg-sky-400" />Lab Exits: {fleetOverview.totalLabExits}</span>
                                <span className="flex items-center gap-1.5 text-purple-400"><div className="w-2 h-2 rounded-full bg-purple-500" />PC Users: {fleetOverview.totalPCUsers}</span>
                                <span className="flex items-center gap-1.5 text-purple-300"><div className="w-2 h-2 rounded-full bg-purple-400" />Laptop Users: {fleetOverview.totalLaptopUsers}</span>
                                <span className="flex items-center gap-1.5 text-amber-400"><div className="w-2 h-2 rounded-full bg-amber-500" />Flagged Maintenance: {fleetOverview.totalFlaggedMaintenance}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="bg-[#020617] border border-[#1E293B] rounded-lg px-4 py-3 text-center min-w-[90px]">
                                <p className="text-lg font-bold text-white">{fleetOverview.avgHours}</p>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Avg Hours</p>
                            </div>
                            <div className="border rounded-lg px-4 py-3 text-center min-w-[90px] bg-sky-500/10 border-sky-500/20">
                                <p className="text-lg font-bold text-sky-400">{fleetOverview.totalOccupancy}</p>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Occupancy</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

{/* Bottom Grid: Trend & Recent Activities (REDUCED SIZE) */}
<div className="grid grid-cols-12 gap-5 h-[40vh] min-h-[300px]">
    {/* Occupancy Trend Card */}
    <div className="col-span-12 lg:col-span-8 flex flex-col h-full">
        <div className="mb-3">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <BarChart3 size={12} className="text-sky-500" /> Occupancy Trend
            </h2>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
            <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-4 shadow-xl shadow-black/20 group relative overflow-hidden hover:border-slate-500 transition-colors flex flex-col h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

                <div className="flex justify-between items-center mb-2 relative z-10 shrink-0">
                    <p className="text-[10px] text-slate-500 italic">Today's hourly student count</p>
                    <span className="text-[9px] text-slate-600 font-mono tracking-wider flex items-center gap-1.5">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                        </span>
                        LIVE
                    </span>
                </div>
                <div className="flex-1 min-h-0 w-full overflow-hidden">
                    <OccupancyChart />
                </div>
            </div>
        </div>
    </div>

    {/* Recent Activities Card */}
    <div className="col-span-12 lg:col-span-4 flex flex-col h-full">
        <div className="mb-3">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Clock size={12} className="text-sky-500" /> Recent Activities
            </h2>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-4 shadow-xl shadow-black/20 group relative overflow-hidden hover:border-slate-500 transition-colors flex flex-col h-full min-h-0">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

            {/* Scrollable Container with Hidden Scrollbar */}
            <div 
                className="flex-1 overflow-y-auto relative z-10 pr-1"
                style={{
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                }}
            >
                <style>
                    {`div::-webkit-scrollbar { display: none; }`}
                </style>

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