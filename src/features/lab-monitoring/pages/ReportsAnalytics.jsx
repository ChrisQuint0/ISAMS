import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
    Users,
    Wrench,
    Clock,
    AlertTriangle,
    FileText,
    FileSpreadsheet,
    Calendar,
    TrendingUp,
    Zap,
    BarChart3,
    Laptop,
    Monitor,
    Download,
    Brain,
    Sun,
    Activity,
    CalendarDays,
    GitCompareArrows,
    ArrowLeftRight,
    X,
} from "lucide-react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import SummaryCard from "../components/analytics/SummaryCard";
import ChartBox from "../components/analytics/ChartBox";
import ExportCard from "../components/analytics/ExportCard";
import UsageChart from "../components/analytics/UsageChart";
import SessionDurationChart from "../components/analytics/SessionDurationChart";
import SectionUsageChart from "../components/analytics/SectionUsageChart";
import ForecastChart from "../components/analytics/ForecastChart";
import PCUsageHistoryChart from "../components/analytics/PCUsageHistoryChart";
import PCHealthChart from "../components/analytics/PCHealthChart";
import HighTrafficDays from "../components/analytics/HighTrafficDays";
import SectionAttendanceTable from "../components/analytics/SectionAttendanceTable";

export default function ReportsAnalytics() {
    const { labName } = useOutletContext();

    const [semester, setSemester] = useState("current");

    const [dateFrom, setDateFrom] = useState("2026-01-06");
    const [dateTo, setDateTo] = useState("2026-02-16");

    const [compareActive, setCompareActive] = useState(false);
    const [compareType, setCompareType] = useState("lab"); 
    const [compareLab, setCompareLab] = useState("lab-2");
    const [comparePeriod, setComparePeriod] = useState("last-month");

    return (
        <div className="p-8 space-y-8 bg-[#020617] min-h-screen text-slate-100">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">{labName} — Reports & Analytics</h1>
                    <p className="text-slate-400 text-sm italic">Analytics, Forecasting, Predictions & Overall Reports</p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <Select value={semester} onValueChange={setSemester}>
                        <SelectTrigger className="w-fit min-w-[200px] h-10 bg-[#0f172a] border-[#1e293b] hover:bg-[#1e293b] text-slate-300 font-bold focus:ring-sky-500 rounded-lg px-3 transition-all flex items-center justify-start gap-0">
                            <Calendar size={16} className="text-sky-500 shrink-0" />
                            <div className="flex-1 text-left whitespace-nowrap pr-4">
                                <SelectValue placeholder="Select Semester" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-[#0f172a] border-[#1e293b] text-slate-300 font-medium min-w-[var(--radix-select-trigger-width)]">
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

                    <div className="flex items-center gap-2 bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-2 hover:border-slate-600 transition-colors">
                        <CalendarDays size={13} className="text-slate-500 shrink-0" />
                        <input 
                            type="date" 
                            value={dateFrom} 
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="bg-transparent text-xs text-slate-300 outline-none border-none [color-scheme:dark] w-[120px]"
                        />
                        <span className="text-[9px] text-slate-600 font-bold uppercase">to</span>
                        <input 
                            type="date" 
                            value={dateTo} 
                            onChange={(e) => setDateTo(e.target.value)}
                            className="bg-transparent text-xs text-slate-300 outline-none border-none [color-scheme:dark] w-[120px]"
                        />
                    </div>

                    <button
                        onClick={() => setCompareActive(!compareActive)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all group/btn relative overflow-hidden ${
                            compareActive
                                ? "bg-purple-500/15 border border-purple-500/30 text-purple-400"
                                : "bg-[#0f172a] border border-[#1e293b] hover:border-slate-600 text-slate-400 hover:text-slate-300"
                        }`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover/btn:from-slate-400/5 group-hover/btn:via-slate-400/0 group-hover/btn:to-slate-400/0 transition-all duration-500 pointer-events-none" />
                        <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                        <GitCompareArrows size={13} /> Compare
                    </button>
                </div>
            </div>

            {compareActive && (
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4 group relative overflow-hidden hover:border-purple-500/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 via-purple-400/0 to-purple-400/0 group-hover:from-purple-400/3 group-hover:via-purple-400/0 group-hover:to-purple-400/0 transition-all duration-500 pointer-events-none" />
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/3 to-transparent pointer-events-none" />
                    <div className="flex items-center gap-4 flex-wrap relative z-10">
                        <div className="flex items-center gap-2">
                            <ArrowLeftRight size={14} className="text-purple-400" />
                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.15em]">Comparison Mode</span>
                        </div>

                        <div className="flex items-center bg-[#0f172a] border border-[#1e293b] rounded-lg p-0.5">
                            <button
                                onClick={() => setCompareType("lab")}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${
                                    compareType === "lab"
                                        ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                                        : "text-slate-500 hover:text-slate-300 border border-transparent"
                                }`}
                            >
                                Lab vs Lab
                            </button>
                            <button
                                onClick={() => setCompareType("period")}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${
                                    compareType === "period"
                                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                        : "text-slate-500 hover:text-slate-300 border border-transparent"
                                }`}
                            >
                                Period vs Period
                            </button>
                        </div>

                        {compareType === "lab" ? (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-sky-400 font-bold px-2.5 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-lg">{labName}</span>
                                <span className="text-[9px] text-slate-600 font-bold">vs</span>
                                <Select value={compareLab} onValueChange={setCompareLab}>
                                    <SelectTrigger className="w-fit min-w-[180px] h-8 bg-[#0f172a] border-[#1e293b] hover:bg-[#1e293b] text-slate-300 text-xs font-bold focus:ring-purple-500 rounded-lg px-3 transition-all">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0f172a] border-[#1e293b] text-slate-300 font-medium">
                                        <SelectItem value="lab-2" className="focus:bg-[#1e293b] focus:text-white cursor-pointer py-2">Computer Laboratory 2</SelectItem>
                                        <SelectItem value="lab-3" className="focus:bg-[#1e293b] focus:text-white cursor-pointer py-2">Computer Laboratory 3</SelectItem>
                                        <SelectItem value="lab-4" className="focus:bg-[#1e293b] focus:text-white cursor-pointer py-2">Computer Laboratory 4</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-amber-400 font-bold px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">Current Range</span>
                                <span className="text-[9px] text-slate-600 font-bold">vs</span>
                                <Select value={comparePeriod} onValueChange={setComparePeriod}>
                                    <SelectTrigger className="w-fit min-w-[160px] h-8 bg-[#0f172a] border-[#1e293b] hover:bg-[#1e293b] text-slate-300 text-xs font-bold focus:ring-purple-500 rounded-lg px-3 transition-all">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0f172a] border-[#1e293b] text-slate-300 font-medium">
                                        <SelectItem value="last-month" className="focus:bg-[#1e293b] focus:text-white cursor-pointer py-2">Last Month</SelectItem>
                                        <SelectItem value="last-semester" className="focus:bg-[#1e293b] focus:text-white cursor-pointer py-2">Last Semester</SelectItem>
                                        <SelectItem value="last-year" className="focus:bg-[#1e293b] focus:text-white cursor-pointer py-2">Same Period Last Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <button
                            onClick={() => setCompareActive(false)}
                            className="ml-auto p-1.5 text-slate-500 hover:text-slate-300 bg-[#1e293b] hover:bg-[#334155] rounded-lg transition-all"
                        >
                            <X size={12} />
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <SummaryCard title="Peak Hour" value="1–2 PM" icon={<Clock size={22} />} trend="Consistent" trendUp={true} />
                <SummaryCard title="Peak Day" value="Wed" icon={<Sun size={22} />} trend="This week" trendUp={true} />
                <SummaryCard title="Avg. Session Duration" value="2h 15m" icon={<Activity size={22} />} trend="+8min" trendUp={true} />
                <SummaryCard title="Top Section (Usage)" value="BSIT-3A" icon={<Users size={22} />} trend="692 sessions" trendUp={true} />
                <SummaryCard title="Forecasted Attendance" value="1,050" icon={<Brain size={22} />} trend="+9%" trendUp={true} />
                <SummaryCard title="Predicted Laptop Users" value="~128" icon={<Laptop size={22} />} trend="+15%" trendUp={true} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ChartBox title="Session Duration Statistics" subtitle="Distribution of session lengths this month">
                        <SessionDurationChart />
                    </ChartBox>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-xl flex flex-col h-full group relative overflow-hidden hover:border-slate-600 transition-colors">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                        <div className="mb-6 border-b border-[#1e293b] pb-4">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Laptop vs. PC Usage</h3>
                            <p className="text-[11px] text-slate-500 mt-1">Distribution (Last 30 Days)</p>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                            <div
                                className="relative w-44 h-44 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(14,165,233,0.15)]"
                                style={{ background: "conic-gradient(#38bdf8 0% 76%, #a855f7 76% 100%)" }}
                            >
                                <div className="absolute w-[80%] h-[80%] bg-[#0f172a] rounded-full" />
                                <div className="relative text-center z-10 flex flex-col items-center mt-1">
                                    <span className="block text-3xl font-bold text-white tracking-tight">76%</span>
                                    <span className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">Lab PCs</span>
                                </div>
                            </div>
                            <div className="flex gap-6 text-[11px] font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-2 text-sky-400">
                                    <div className="w-3 h-3 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]" /> PC Mode
                                </span>
                                <span className="flex items-center gap-2 text-purple-400">
                                    <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" /> Laptop
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ChartBox title="Usage by Section" subtitle="Session counts per section — filterable by time range">
                        <SectionUsageChart />
                    </ChartBox>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-xl flex flex-col h-full group relative overflow-hidden hover:border-slate-600 transition-colors">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                        <div className="mb-4 border-b border-[#1e293b] pb-4">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Section Attendance Reports</h3>
                            <p className="text-[11px] text-slate-500 mt-1">Monthly totals, rates & trends</p>
                        </div>
                        <div className="flex-1">
                            <SectionAttendanceTable />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartBox title="Peak Laboratory Usage" subtitle="Daily student logins trend (this week)">
                    <UsageChart />
                </ChartBox>

                <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-xl flex flex-col h-full group relative overflow-hidden hover:border-slate-600 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                    <div className="mb-4 border-b border-[#1e293b] pb-4">
                        <div className="flex items-center gap-2">
                            <Brain size={16} className="text-amber-400" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Predicted High-Traffic Days</h3>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">AI-forecasted surge periods (next 3 weeks)</p>
                    </div>
                    <div className="flex-1">
                        <HighTrafficDays />
                    </div>
                </div>
            </div>

            <ChartBox title="Forecasted Attendance Levels" subtitle="Actual vs predicted weekly attendance — dashed line = forecast">
                <ForecastChart />
            </ChartBox>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ChartBox title="PC Usage History" subtitle="Total cumulative hours per month across all stations">
                        <PCUsageHistoryChart />
                    </ChartBox>
                </div>
                <div className="lg:col-span-1">
                    <ChartBox title="PC Health Score Trends" subtitle="Average hardware health score (%) over time">
                        <PCHealthChart />
                    </ChartBox>
                </div>
            </div>

            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-xl group relative overflow-hidden hover:border-slate-600 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Generate Official Reports</h3>
                    <p className="text-[11px] text-slate-500 mt-1">Export filtered data for administrative submission (PDF / Excel)</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ExportCard title="End-of-Month Attendance" description="CSV export of all student time-in/out logs" icon={<FileSpreadsheet size={24} />} />
                    <ExportCard title="Hardware Health Status" description="Current hour counters and maintenance alerts" icon={<Wrench size={24} />} />
                    <ExportCard title="Anti-Cutting Audit" description="PDF Report of all early exits and overrides" icon={<FileText size={24} />} />
                    <ExportCard title="Section Attendance Summary" description="Per-section attendance rates and trends" icon={<Users size={24} />} />
                    <ExportCard title="Forecasting Report" description="Predicted traffic and resource allocation" icon={<Brain size={24} />} />
                    <ExportCard title="PC Lifecycle Report" description="Health scores, usage hours and service history" icon={<Monitor size={24} />} />
                </div>
            </div>

        </div>
    );
}