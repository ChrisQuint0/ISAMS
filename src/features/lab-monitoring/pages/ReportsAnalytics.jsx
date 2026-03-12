import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
    Users, Wrench, Clock, AlertTriangle, FileText, FileSpreadsheet,
    Calendar, TrendingUp, Zap, BarChart3, Laptop, Monitor, Download,
    Brain, Sun, Activity, CalendarDays, GitCompareArrows, ArrowLeftRight,
    X, Loader2
} from "lucide-react";

import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
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
import ExportMonthModal from "../components/analytics/ExportMonthModal";

import { useLabAnalytics } from "../hooks/useLabAnalytics"; 
import { exportAttendanceExcel, handleAttendancePDF, handleHardwareHealthPDF, 
    exportHardwareHealthExcel, exportEarlyDismissalExcel, handleEarlyDismissalPDF,
    handleSectionSummaryPDF, exportSectionSummaryExcel, exportForecastingExcel,
    handleForecastingPDF, exportPCLifecycleExcel, handlePCLifecyclePDF } from "../utils/exportUtils";

// Manila-locked date formatting
const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
};

export default function ReportsAnalytics() {
    const { labName } = useOutletContext();
    
    const [semester, setSemester] = useState("spring-2026");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [compareActive, setCompareActive] = useState(false);
    const [compareType, setCompareType] = useState("lab"); 

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeReport, setActiveReport] = useState({ title: "", type: "", format: "" });

    // Fetch analytics and data bounds (first/last logs)
    const { loading, metrics, rawLogs, dataBounds } = useLabAnalytics(labName, dateFrom, dateTo);

    // Sync dates dynamically based on semester and available data
    useEffect(() => {
        const nowManila = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" });
        const today = new Date(nowManila);

        if (semester === "spring-2026") {
            // Future-proof: Use first log found in DB, fallback to Jan 1st
            setDateFrom(dataBounds.first || "2026-01-01");
            setDateTo(formatDate(today)); 
        } else if (semester === "fall-2025") {
            setDateFrom("2025-08-01");
            setDateTo("2025-12-20");
        }
    }, [semester, dataBounds]);

    const handleInitiateExport = (title, type, format) => {
        setActiveReport({ title, type, format });
        setIsModalOpen(true);
    };

    const processExport = (selectedMonth) => {
        const filteredLogs = rawLogs.filter(log => new Date(log.time_in).getMonth() === selectedMonth);

        if (activeReport.type === "attendance") {
            activeReport.format === "excel" ? exportAttendanceExcel(filteredLogs, labName) : handleAttendancePDF(filteredLogs, labName);
        } else if (activeReport.type === "hardware") {
            activeReport.format === "excel" ? exportHardwareHealthExcel(filteredLogs, labName) : handleHardwareHealthPDF(filteredLogs, labName);
        } else if (activeReport.type === "early-dismissal") {
            activeReport.format === "excel" ? exportEarlyDismissalExcel(filteredLogs, labName) : handleEarlyDismissalPDF(filteredLogs, labName);
        } else if (activeReport.type === "section-summary") {
            activeReport.format === "excel" ? exportSectionSummaryExcel(filteredLogs, labName) : handleSectionSummaryPDF(filteredLogs, labName);
        } else if (activeReport.type === "forecasting") {
            activeReport.format === "excel" ? exportForecastingExcel(filteredLogs, labName) : handleForecastingPDF(filteredLogs, labName);
        } else if (activeReport.type === "pc-lifecycle") {
            activeReport.format === "excel" ? exportPCLifecycleExcel(filteredLogs, labName) : handlePCLifecyclePDF(filteredLogs, labName);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="p-8 space-y-8 bg-[#020617] min-h-screen text-slate-100 font-sans">
            <ExportMonthModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onConfirm={processExport}
                reportTitle={activeReport.title}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">{labName} — Reports & Analytics</h1>
                    <p className="text-slate-400 text-sm italic">Analytics, Forecasting, Predictions & Overall Reports</p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <Select value={semester} onValueChange={setSemester}>
                        <SelectTrigger className="w-fit min-w-[200px] h-10 bg-[#0f172a] border-[#1e293b] text-slate-300 font-bold rounded-lg px-3 flex items-center gap-2 hover:bg-[#1e293b]">
                            <Calendar size={16} className="text-sky-500 shrink-0" />
                            <SelectValue placeholder="Select Semester" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0f172a] border-[#1e293b] text-slate-300 font-medium">
                            <SelectItem value="spring-2026" className="py-2.5">Spring Semester (Jan - May 2026)</SelectItem>
                            <SelectItem value="fall-2025" className="py-2.5">Fall Semester (Aug - Dec 2025)</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2 bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-2">
                        <CalendarDays size={13} className="text-slate-500 shrink-0" />
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-transparent text-xs text-slate-300 outline-none border-none [color-scheme:dark] w-[120px]" />
                        <span className="text-[9px] text-slate-600 font-bold uppercase">to</span>
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-transparent text-xs text-slate-300 outline-none border-none [color-scheme:dark] w-[120px]" />
                    </div>

                    <button onClick={() => setCompareActive(!compareActive)} className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${compareActive ? "bg-purple-500/15 border border-purple-500/30 text-purple-400" : "bg-[#0f172a] border border-[#1e293b] text-slate-400"}`}>
                        <GitCompareArrows size={13} /> Compare
                    </button>
                </div>
            </div>

            {/* Comparison Mode Toolbar */}
            {compareActive && (
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2">
                        <ArrowLeftRight size={14} className="text-purple-400" />
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Comparison Mode</span>
                    </div>
                    <div className="flex items-center bg-[#0f172a] border border-[#1e293b] rounded-lg p-0.5">
                        <button onClick={() => setCompareType("lab")} className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase transition-all ${compareType === "lab" ? "bg-sky-500/15 text-sky-400 border border-sky-500/30" : "text-slate-500"}`}>Lab vs Lab</button>
                        <button onClick={() => setCompareType("period")} className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase transition-all ${compareType === "period" ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" : "text-slate-500"}`}>Period vs Period</button>
                    </div>
                    <button onClick={() => setCompareActive(false)} className="ml-auto p-1.5 text-slate-500 bg-[#1e293b] rounded-lg hover:text-white"><X size={12} /></button>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <SummaryCard title="Peak Hour" value={loading ? "..." : metrics.peakHour} icon={<Clock size={22} />} trend="Based on logins" trendUp={true} />
                <SummaryCard title="Peak Day" value={loading ? "..." : metrics.peakDay} icon={<Sun size={22} />} trend="Highest traffic" trendUp={true} />
                <SummaryCard title="Avg. Session Duration" value={loading ? "..." : metrics.avgDurationStr} icon={<Activity size={22} />} trend="From Check-out" trendUp={true} />
                <SummaryCard title="Top Section" value={loading ? "..." : metrics.topSection} icon={<Users size={22} />} trend={`${metrics.topSectionCount} sessions`} trendUp={true} />
                <SummaryCard title="Total Sessions" value={loading ? "..." : metrics.totalSessions.toLocaleString()} icon={<BarChart3 size={22} />} trend="Selected period" trendUp={true} />
                <SummaryCard title="Predicted Laptop Users" value={loading ? "..." : `~${Math.round(metrics.totalSessions * ((metrics.laptopPercentage || 0) / 100))}`} icon={<Laptop size={22} />} trend={`${metrics.laptopPercentage || 0}% of traffic`} trendUp={true} />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ChartBox title="Session Duration Statistics" subtitle="Distribution of session lengths this month">
                        <SessionDurationChart rawLogs={rawLogs} />
                    </ChartBox>
                </div>
                <div className="lg:col-span-1">
                    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-xl h-full flex flex-col">
                        <h3 className="text-sm font-bold text-white uppercase mb-1">Laptop vs. PC Usage</h3>
                        <p className="text-[11px] text-slate-500 mb-6 border-b border-[#1e293b] pb-4">Distribution (Selected Date Range)</p>
                        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                            {loading ? <Loader2 className="w-10 h-10 animate-spin text-sky-500" /> : (
                                <>
                                    <div className="relative w-44 h-44 rounded-full flex items-center justify-center" style={{ background: `conic-gradient(#38bdf8 0% ${metrics.pcPercentage || 0}%, #a855f7 ${metrics.pcPercentage || 0}% 100%)` }}>
                                        <div className="absolute w-[80%] h-[80%] bg-[#0f172a] rounded-full" />
                                        <div className="relative text-center z-10">
                                            <span className="text-3xl font-bold text-white">{metrics.pcPercentage || 0}%</span><br/>
                                            <span className="text-[10px] uppercase text-slate-500">Lab PCs</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-6 text-[11px] font-bold uppercase tracking-widest">
                                        <span className="flex items-center gap-2 text-sky-400"><div className="w-3 h-3 rounded-full bg-sky-500" /> PC ({metrics.pcPercentage || 0}%)</span>
                                        <span className="flex items-center gap-2 text-purple-400"><div className="w-3 h-3 rounded-full bg-purple-500" /> Laptop ({metrics.laptopPercentage || 0}%)</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Section Usage & Attendance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ChartBox title="Usage by Section" subtitle="Session counts per section">
                        <SectionUsageChart rawLogs={rawLogs} />
                    </ChartBox>
                </div>
                <div className="lg:col-span-1">
                    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 h-full">
                        <h3 className="text-sm font-bold text-white uppercase mb-1">Section Attendance Reports</h3>
                        <p className="text-[11px] text-slate-500 mb-4 border-b border-[#1e293b] pb-4">Monthly totals & rates</p>
                        <SectionAttendanceTable rawLogs={rawLogs} />
                    </div>
                </div>
            </div>

            {/* Peak Usage & Traffic Days */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartBox title="Peak Laboratory Usage" subtitle="Daily student logins trend (this week)">
                    <UsageChart rawLogs={rawLogs} />
                </ChartBox>
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-xl">
                    <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2"><Brain size={16} className="text-amber-400" /> Predicted High-Traffic Days</h3>
                    <p className="text-[11px] text-slate-500 mb-4 border-b border-[#1e293b] pb-4">System-forecasted surge periods (next 3 weeks)</p>
                    <HighTrafficDays rawLogs={rawLogs} />
                </div>
            </div>

            {/* History & Forecasting Charts */}
            <ChartBox title="Forecasted Attendance Levels" subtitle="Actual vs predicted weekly attendance">
                <ForecastChart rawLogs={rawLogs} />
            </ChartBox>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ChartBox title="PC Usage History" subtitle="Top workstations by cumulative usage hours">
                        <PCUsageHistoryChart rawLogs={rawLogs} />
                    </ChartBox>
                </div>
                <div className="lg:col-span-1">
                    <ChartBox title="PC Health Score Trends" subtitle="Average hardware health score (%) over time">
                        <PCHealthChart rawLogs={rawLogs} />
                    </ChartBox>
                </div>
            </div>

            {/* Export Section */}
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 shadow-xl">
                <h3 className="text-sm font-bold text-white uppercase mb-1 font-mono tracking-tighter">Generate Official Reports</h3>
                <p className="text-[11px] text-slate-500 mb-6 border-b border-[#1e293b] pb-4">Export filtered data for administrative submission</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ExportCard 
                        title="End-of-Month Attendance" 
                        description="Export logs filtered by month" 
                        icon={<FileSpreadsheet size={24} />} 
                        onExport={(format) => handleInitiateExport("End-of-Month Attendance", "attendance", format)}
                    />
                    <ExportCard 
                        title="Hardware Health Status" 
                        description="Current hour counters" 
                        icon={<Wrench size={24} />} 
                        onExport={(format) => handleInitiateExport("Hardware Health Status", "hardware", format)} 
                    />
                    <ExportCard 
                        title="Early Dismissal Report" 
                        description="PDF/Excel Report of all early exits" 
                        icon={<FileText size={24} />} 
                        onExport={(format) => handleInitiateExport("Early Dismissal Report", "early-dismissal", format)} 
                    />
                    <ExportCard 
                        title="Section Attendance Summary" 
                        description="Analyze attendance rates per class section." 
                        icon={<Users size={24} className="text-sky-500" />} 
                        onExport={(format) => handleInitiateExport("Section Attendance Summary", "section-summary", format)} 
                    />
                    <ExportCard 
                        title="Forecasting Report" 
                        description="Predicted traffic" 
                        icon={<Brain size={24} />} 
                        onExport={(format) => handleInitiateExport("Forecasting Report", "forecasting", format)} 
                    />
                    <ExportCard 
                        title="PC Lifecycle Report" 
                        description="Health scores and usage history" 
                        icon={<Monitor size={24} />} 
                        onExport={(format) => handleInitiateExport("PC Lifecycle Report", "pc-lifecycle", format)} 
                    />
                </div>
            </div>
        </div>
    );
}