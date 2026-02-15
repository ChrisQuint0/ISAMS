import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { 
    Users, 
    Wrench, 
    Clock, 
    AlertTriangle, 
    FileText, 
    FileSpreadsheet, 
    Calendar 
} from "lucide-react";

// Shadcn Select Dropdown Imports
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Import Separated Components
import SummaryCard from "../components/analytics/SummaryCard";
import ChartBox from "../components/analytics/ChartBox";
import ExportCard from "../components/analytics/ExportCard";
import UsageChart from "../components/analytics/UsageChart";

export default function ReportsAnalytics() {
    const { labName } = useOutletContext();
    
    // State to track the currently selected semester filter
    const [semester, setSemester] = useState("current");

    return (
        <div className="p-8 space-y-8 bg-[#020617] min-h-screen text-slate-100">
            
            {/* Header & Date Filter Dropdown */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">{labName} — Reports & Analytics</h1>
                    <p className="text-slate-400 text-sm italic">Historical Data, Attendance, and Hardware Metrics</p>
                </div>
                
                {/* Flexible Width Dropdown */}
                <Select value={semester} onValueChange={setSemester}>
                    <SelectTrigger className="w-fit min-w-[200px] h-10 bg-[#0f172a] border-[#1e293b] hover:bg-[#1e293b]
                     text-slate-300 font-bold focus:ring-sky-500 rounded-lg px-3 transition-all flex items-center 
                     justify-start gap-0">

                        <Calendar size={16} className="text-sky-500 shrink-0" />
                        <div className="flex-1 text-left whitespace-nowrap pr-4">
                            <SelectValue placeholder="Select Semester" />
                        </div>
                    </SelectTrigger>
                    
                    <SelectContent className="bg-[#0f172a] border-[#1e293b] text-slate-300 font-medium 
                    min-w-[var(--radix-select-trigger-width)]">
                        <SelectItem value="current" className="focus:bg-[#1e293b] focus:text-white cursor-pointer py-2.5">
                            <div className="flex items-center gap-0">
                                <Calendar size={16} className="opacity-0 shrink-0" />
                                <span>Current Semester (Jan - May 2026)</span>
                            </div>
                        </SelectItem>
                        
                        <SelectItem value="fall-2025" className="focus:bg-[#1e293b] focus:text-white cursor-pointer py-2.5">
                            <div className="flex items-center gap-0">
                                <Calendar size={16} className="opacity-0 shrink-0" />
                                <span>Fall Semester (Aug - Dec 2025)</span>
                            </div>
                        </SelectItem>
                        
                        <SelectItem value="spring-2025" className="focus:bg-[#1e293b] focus:text-white cursor-pointer py-2.5">
                            <div className="flex items-center gap-0">
                                <Calendar size={16} className="opacity-0 shrink-0" />
                                <span>Spring Semester (Jan - May 2025)</span>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Top KPI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard title="Total Scans (This Month)" value="1,248" icon={<Users size={24} />} trend="+12%" trendUp={true} />
                <SummaryCard title="Avg. Occupancy Rate" value="88%" icon={<Clock size={24} />} trend="+4%" trendUp={true} />
                <SummaryCard title="Early Exits (Anti-Cutting)" value="42" icon={<AlertTriangle size={24} />} trend="-2%" trendUp={true} />
                <SummaryCard title="Hardware Services" value="08" icon={<Wrench size={24} />} trend="+2 units" trendUp={false} />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Chart: Line Chart */}
                <div className="lg:col-span-2">
                    <ChartBox 
                        title="Peak Laboratory Usage" 
                        subtitle="Daily student logins (Lab PCs vs Laptops)"
                    >
                        <UsageChart />
                    </ChartBox>
                </div>

                {/* Right Chart: Hardware Mode Distribution */}
                <div className="lg:col-span-1">
                    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-xl flex flex-col h-full">
                        
                        {/* Header */}
                        <div className="mb-6 border-b border-[#1e293b] pb-4">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Session Modes</h3>
                            <p className="text-[11px] text-slate-500 mt-1">Total Ratio (Last 30 Days)</p>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                            <div 
                                className="relative w-48 h-48 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(14,165,233,0.15)]"
                                style={{
                                    background: "conic-gradient(#38bdf8 0% 76%, #a855f7 76% 100%)"
                                }}
                            >
                                {/* Inner circle to "hollow out" the donut */}
                                <div className="absolute w-[80%] h-[80%] bg-[#0f172a] rounded-full"></div>
                                
                                {/* Centered Text */}
                                <div className="relative text-center z-10 flex flex-col items-center mt-1">
                                    <span className="block text-4xl font-bold text-white tracking-tight">76%</span>
                                    <span className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">Lab PCs</span>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="flex gap-6 text-[11px] font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-2 text-sky-400">
                                    <div className="w-3 h-3 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]"></div> 
                                    PC Mode
                                </span>
                                <span className="flex items-center gap-2 text-purple-400">
                                    <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div> 
                                    Laptop
                                </span>
                            </div>
                            
                        </div>
                    </div>
                </div>
            </div>

            {/* Export & Document Generation Section */}
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-xl">
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Generate Official Reports</h3>
                    <p className="text-[11px] text-slate-500 mt-1">Export filtered data for administrative submission.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ExportCard title="End-of-Month Attendance" description="CSV export of all student time-in/out logs" icon={<FileSpreadsheet size={24} />} />
                    <ExportCard title="Hardware Health Status" description="Current hour counters and maintenance alerts" icon={<Wrench size={24} />} />
                    <ExportCard title="Anti-Cutting Audit" description="PDF Report of all early exits and overrides" icon={<FileText size={24} />} />
                </div>
            </div>

        </div>
    );
}