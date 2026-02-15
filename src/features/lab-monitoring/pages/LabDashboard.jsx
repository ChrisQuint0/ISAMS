import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { 
  ShieldAlert, 
  CheckCircle, 
  Users, 
  Laptop, 
  Activity, 
  AlertTriangle 
} from "lucide-react";

// Import components
import StatTile from "../components/dashboard/StatTile";
import HealthLine from "../components/dashboard/HealthLine";
import ActivityItem from "../components/dashboard/ActivityItem";

export default function LabDashboard() {
    const { labName } = useOutletContext();
    
    // Master Anti-Cutting Override State
    const [isDismissed, setIsDismissed] = useState(false);

    return (
        <div className="p-8 bg-[#0F172A] min-h-screen text-slate-100 font-sans">
            
            {/* HEADER SECTION */}
            <div className="flex justify-between items-end mb-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight">
                            {labName || "Computer Laboratory 1"} — Command Center
                        </h1>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${
                            isDismissed 
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                            : "bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse"
                        }`}>
                            {isDismissed ? <CheckCircle size={10} /> : <ShieldAlert size={10} />}
                            {isDismissed ? "Unlocked" : "Session Locked"}
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Monitoring Active Session: BSIT-3A</p>
                </div>

                {/* Master Dismissal Button */}
                <button 
                    onClick={() => setIsDismissed(!isDismissed)}
                    className={`text-[11px] font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 transition-all duration-300 shadow-lg uppercase tracking-widest ${
                        isDismissed 
                        ? "bg-slate-700 text-slate-300 cursor-not-allowed" 
                        : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/20 active:scale-95"
                    }`}
                >
                    {isDismissed ? <CheckCircle size={14} /> : <ShieldAlert size={14} />}
                    {isDismissed ? "Class Dismissed" : "Dismiss Class Early"}
                </button>
            </div>

            {/* CONTENT GRID */}
            <div className="grid grid-cols-12 gap-6">
                
                {/* LEFT SECTION: STATS & HEALTH MONITORING */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatTile label="Occupancy" value="38/40" sub="95% Capacity" color="blue" icon={<Users size={18} />} />
                        <StatTile label="Laptop Users" value="05" sub="Hybrid Mode" color="purple" icon={<Laptop size={18} />} />
                        <StatTile label="System Alerts" value="02" sub="Maintenance Required" color="amber" icon={<AlertTriangle size={18} />} />
                    </div>

                    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-7 shadow-xl shadow-black/20">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Activity size={14} className="text-sky-500" /> 
                                Health Monitoring
                            </h3>
                            <span className="text-[10px] text-slate-500 italic">Predictive Threshold: 500 Hours</span>
                        </div>
                        
                        <div className="grid gap-7">
                            <HealthLine id="PC-01" current={492} max={500} />
                            <HealthLine id="PC-05" current={120} max={500} isLaptop />
                            <HealthLine id="PC-12" current={505} max={500} isAlert />
                        </div>
                    </div>
                </div>

                {/* RIGHT SECTION: RECENT ACTIVITY */}
                <div className="col-span-12 lg:col-span-4">
                    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-7 h-full shadow-xl shadow-black/20">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-8">
                            Recent Activities
                        </h3>
                        <div className="space-y-2">
                            <ActivityItem time="14:22" text="Student Timed In" detail="PC-08 assigned alphabetically" />
                            <ActivityItem time="14:15" text="Maintenance Alert" detail="PC-12 reached health threshold" alert />
                            <ActivityItem time="14:10" text="Student Timed In" detail="PC-14 assigned (Laptop Mode)" />
                            <ActivityItem time="14:05" text="Session Init" detail="BSIT-3A session started" />
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    );
}