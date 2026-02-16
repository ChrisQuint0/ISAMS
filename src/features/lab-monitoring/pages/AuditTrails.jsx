import React, { useState, useMemo, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { 
    Search, Download, Filter, Shield, ShieldAlert, ShieldCheck, 
    User, Clock, CalendarDays, ChevronLeft, ChevronRight, 
    Settings, Monitor, LogIn, LogOut, Trash2, PenLine, 
    AlertTriangle, KeyRound, Eye, X, UserCog, RefreshCw,
    FileText, FileSpreadsheet
} from "lucide-react";
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeBalham } from 'ag-grid-community';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// AG Grid v33+ Theming API — consistent with ThesisSettingsModal.jsx
const auditTheme = themeBalham.withParams({
    accentColor: '#3b82f6',
    backgroundColor: '#020617',
    foregroundColor: '#e2e8f0',
    borderColor: '#1e293b',
    headerBackgroundColor: '#0f172a',
    headerTextColor: '#94a3b8',
    oddRowBackgroundColor: '#020617',
    rowHeight: 48,
    headerHeight: 40,
});

// Category configuration
const categoryConfig = {
    "Authentication": { icon: KeyRound, color: "sky", bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20" },
    "PC Management":  { icon: Monitor, color: "purple", bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
    "Settings":       { icon: Settings, color: "amber", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
    "Student Logs":   { icon: User, color: "emerald", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
    "Schedule":       { icon: CalendarDays, color: "cyan", bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
    "Override":       { icon: ShieldAlert, color: "rose", bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
};

// Severity configuration
const severityConfig = {
    "Info":     { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20", dot: "bg-sky-400" },
    "Warning":  { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", dot: "bg-amber-400" },
    "Critical": { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", dot: "bg-rose-400" },
    "Success":  { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-400" },
};

export default function AuditTrails() {
    const { labName } = useOutletContext();
    const [gridApi, setGridApi] = useState(null);

    // Filters
    const [dateFrom, setDateFrom] = useState("2026-02-10");
    const [dateTo, setDateTo] = useState("2026-02-16");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [severityFilter, setSeverityFilter] = useState("all");

    // Detail drawer
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Export format
    const [exportFormat, setExportFormat] = useState("csv"); // "csv" | "pdf"

    // Dummy audit trail data
    const [rowData] = useState([
        { id: "AUD-001", timestamp: "2026-02-16 03:45:12 PM", user: "Admin — Prof. Garcia", category: "Override", action: "Dismiss Class Override", description: "Triggered anti-cutting override — dismissed class for Lab Schedule IT305", severity: "Critical", ip: "192.168.1.101" },
        { id: "AUD-002", timestamp: "2026-02-16 03:30:05 PM", user: "Admin — Prof. Garcia", category: "PC Management", action: "Flag Maintenance", description: "Flagged PC-12 for maintenance — Monitor flickering intermittently", severity: "Warning", ip: "192.168.1.101" },
        { id: "AUD-003", timestamp: "2026-02-16 02:15:30 PM", user: "Admin — Prof. Garcia", category: "PC Management", action: "Clear Maintenance", description: "Cleared maintenance flag on PC-07 — Replaced faulty RAM module", severity: "Success", ip: "192.168.1.101" },
        { id: "AUD-004", timestamp: "2026-02-16 01:00:00 PM", user: "System", category: "Student Logs", action: "Student Time-In", description: "Juan Dela Cruz (2023-0001) timed in at PC-01 — BSIT-3A", severity: "Info", ip: "—" },
        { id: "AUD-005", timestamp: "2026-02-16 12:55:00 PM", user: "Admin — Prof. Garcia", category: "Settings", action: "Updated Lab Settings", description: "Changed session timeout from 30min to 45min", severity: "Warning", ip: "192.168.1.101" },
        { id: "AUD-006", timestamp: "2026-02-16 12:30:00 PM", user: "System", category: "Authentication", action: "Admin Login", description: "Prof. Garcia authenticated via Supabase — session started", severity: "Info", ip: "192.168.1.101" },
        { id: "AUD-007", timestamp: "2026-02-16 11:00:00 AM", user: "Admin — Prof. Garcia", category: "PC Management", action: "Bulk Convert to Laptop", description: "Converted 5 stations (PC-31 to PC-35) to Laptop mode", severity: "Warning", ip: "192.168.1.101" },
        { id: "AUD-008", timestamp: "2026-02-16 10:45:00 AM", user: "Admin — Prof. Garcia", category: "Schedule", action: "Added Schedule", description: "Created recurring schedule: CC101 — Mon/Wed 8:00 AM–10:00 AM — Prof. Santos", severity: "Info", ip: "192.168.1.101" },
        { id: "AUD-009", timestamp: "2026-02-16 10:30:00 AM", user: "System", category: "Student Logs", action: "Student Time-Out", description: "Jose Rizal Jr. (2023-0003) timed out from PC-03 — Early Exit flagged", severity: "Warning", ip: "—" },
        { id: "AUD-010", timestamp: "2026-02-15 04:00:00 PM", user: "System", category: "Student Logs", action: "Bulk Time-Out", description: "Auto timed-out 28 students at end of lab session — IT305 BSIT-3A", severity: "Info", ip: "—" },
        { id: "AUD-011", timestamp: "2026-02-15 03:50:00 PM", user: "Admin — Prof. Garcia", category: "Override", action: "Dismiss Class Override", description: "Triggered anti-cutting override — dismissed class for Lab Schedule CC101", severity: "Critical", ip: "192.168.1.101" },
        { id: "AUD-012", timestamp: "2026-02-15 02:00:00 PM", user: "Admin — Prof. Garcia", category: "PC Management", action: "Reset Timer", description: "Reset usage timer on PC-19 after OS reinstall", severity: "Info", ip: "192.168.1.101" },
        { id: "AUD-013", timestamp: "2026-02-15 08:00:00 AM", user: "System", category: "Authentication", action: "Admin Login", description: "Prof. Garcia authenticated via Supabase — session started", severity: "Info", ip: "192.168.1.101" },
        { id: "AUD-014", timestamp: "2026-02-14 04:30:00 PM", user: "Admin — Prof. Garcia", category: "Settings", action: "Updated Anti-Cutting Policy", description: "Changed early-exit threshold from 15min to 10min before class end", severity: "Warning", ip: "192.168.1.101" },
        { id: "AUD-015", timestamp: "2026-02-14 01:00:00 PM", user: "System", category: "Student Logs", action: "Overflow Detected", description: "Ana Reyes (2023-0004) logged in as OVERFLOW — no available PCs", severity: "Warning", ip: "—" },
        { id: "AUD-016", timestamp: "2026-02-13 09:00:00 AM", user: "Admin — Prof. Garcia", category: "Schedule", action: "Deleted Schedule", description: "Removed one-time schedule: Makeup Class — Feb 13, 2026 9:00 AM–12:00 PM", severity: "Warning", ip: "192.168.1.101" },
        { id: "AUD-017", timestamp: "2026-02-12 03:00:00 PM", user: "Admin — Prof. Garcia", category: "PC Management", action: "Bulk Maintenance", description: "Flagged 3 stations (PC-28, PC-33, PC-40) for maintenance — scheduled hardware audit", severity: "Warning", ip: "192.168.1.101" },
        { id: "AUD-018", timestamp: "2026-02-12 08:15:00 AM", user: "System", category: "Authentication", action: "Failed Login Attempt", description: "Unknown user attempted login — invalid credentials (3rd attempt)", severity: "Critical", ip: "192.168.1.205" },
        { id: "AUD-019", timestamp: "2026-02-11 02:00:00 PM", user: "Admin — Prof. Garcia", category: "PC Management", action: "Convert to PC", description: "Converted stations PC-31 to PC-35 back to PC mode", severity: "Info", ip: "192.168.1.101" },
        { id: "AUD-020", timestamp: "2026-02-10 10:00:00 AM", user: "System", category: "Authentication", action: "Admin Login", description: "Prof. Garcia authenticated via Supabase — session started", severity: "Info", ip: "192.168.1.101" },
    ]);

    // Filtered data
    const filteredData = useMemo(() => {
        return rowData.filter(row => {
            if (categoryFilter !== "all" && row.category !== categoryFilter) return false;
            if (severityFilter !== "all" && row.severity !== severityFilter) return false;
            return true;
        });
    }, [rowData, categoryFilter, severityFilter]);

    // Summary stats
    const stats = useMemo(() => {
        const total = filteredData.length;
        const critical = filteredData.filter(r => r.severity === "Critical").length;
        const warnings = filteredData.filter(r => r.severity === "Warning").length;
        const today = filteredData.filter(r => r.timestamp.startsWith("2026-02-16")).length;
        return { total, critical, warnings, today };
    }, [filteredData]);

    // Column definitions
    const columnDefs = useMemo(() => [
        {
            headerName: "Severity",
            field: "severity",
            width: 150,
            cellStyle: { display: 'flex', alignItems: 'center', padding: '6px' },
            cellRenderer: (params) => {
                const cfg = severityConfig[params.value] || severityConfig["Info"];
                return (
                    <span className={`inline-flex items-center justify-center w-full h-full rounded text-[10px] font-black uppercase tracking-tighter border text-center ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        {params.value}
                    </span>
                );
            },
        },
        {
            headerName: "Timestamp",
            field: "timestamp",
            width: 200,
            cellRenderer: (params) => (
                <div className="flex items-center gap-2 h-full">
                    <Clock size={12} className="text-slate-600 shrink-0" />
                    <span className="text-xs text-slate-300 font-mono">{params.value}</span>
                </div>
            ),
        },
        {
            headerName: "Category",
            field: "category",
            width: 160,
            cellRenderer: (params) => {
                const cfg = categoryConfig[params.value];
                if (!cfg) return <span className="text-xs text-slate-400">{params.value}</span>;
                const Icon = cfg.icon;
                return (
                    <div className="flex items-center gap-2 h-full">
                        <div className={`p-1 rounded-md ${cfg.bg} border ${cfg.border}`}>
                            <Icon size={12} className={cfg.text} />
                        </div>
                        <span className={`text-xs font-bold ${cfg.text}`}>{params.value}</span>
                    </div>
                );
            },
        },
        {
            headerName: "Action",
            field: "action",
            width: 220,
            cellRenderer: (params) => (
                <div className="flex items-center h-full">
                    <span className="text-xs font-semibold text-slate-100">{params.value}</span>
                </div>
            ),
        },
        {
            headerName: "Performed By",
            field: "user",
            width: 200,
            cellRenderer: (params) => {
                const isSystem = params.value === "System";
                return (
                    <div className="flex items-center gap-2 h-full">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isSystem ? "bg-slate-800 border border-slate-700" : "bg-sky-500/15 border border-sky-500/20"}`}>
                            {isSystem ? <RefreshCw size={10} className="text-slate-500" /> : <UserCog size={10} className="text-sky-400" />}
                        </div>
                        <span className={`text-xs ${isSystem ? "text-slate-500 italic" : "text-slate-200 font-medium"}`}>{params.value}</span>
                    </div>
                );
            },
        },
        {
            headerName: "Description",
            field: "description",
            flex: 1,
            minWidth: 300,
            cellRenderer: (params) => (
                <div className="flex items-center h-full">
                    <span className="text-xs text-slate-400 truncate">{params.value}</span>
                </div>
            ),
        },
    ], []);

    const defaultColDef = useMemo(() => ({
        sortable: true,
        resizable: true,
        suppressMovable: true,
    }), []);

    const onGridReady = useCallback((params) => {
        setGridApi(params.api);
    }, []);

    const onRowClicked = useCallback((params) => {
        setSelectedEvent(params.data);
        setDrawerOpen(true);
    }, []);

    const handleExport = useCallback(() => {
        if (exportFormat === "csv" && gridApi) {
            gridApi.exportDataAsCsv({ fileName: `audit-trail-${labName}.csv` });
        } else {
            // PDF export placeholder
            console.log(`Exporting audit trail as PDF for ${labName}`);
        }
    }, [gridApi, labName, exportFormat]);

    return (
        <div className="p-8 space-y-6 bg-[#020617] min-h-screen text-slate-100">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">{labName} — Audit Trails</h1>
                    <p className="text-slate-400 text-sm italic">Complete activity log of all system events, admin actions & overrides</p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Date Range */}
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

                    {/* Export Format Toggle + Download */}
                    <div className="flex items-center gap-0">
                        <div className="flex items-center bg-[#0f172a] border border-[#1e293b] rounded-l-lg p-0.5">
                            <button
                                onClick={() => setExportFormat("csv")}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${
                                    exportFormat === "csv"
                                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                        : "text-slate-500 hover:text-slate-300 border border-transparent"
                                }`}
                            >
                                <FileSpreadsheet size={11} /> CSV
                            </button>
                            <button
                                onClick={() => setExportFormat("pdf")}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${
                                    exportFormat === "pdf"
                                        ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                        : "text-slate-500 hover:text-slate-300 border border-transparent"
                                }`}
                            >
                                <FileText size={11} /> PDF
                            </button>
                        </div>
                        <button 
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-r-lg bg-blue-500/10 border border-blue-500/20 border-l-0 hover:border-blue-500/40 text-blue-400 transition-all group/btn relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover/btn:from-slate-400/5 group-hover/btn:via-slate-400/0 group-hover/btn:to-slate-400/0 transition-all duration-500 pointer-events-none" />
                            <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                            <Download size={13} /> Export .{exportFormat}
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Events", value: stats.total, icon: <Shield size={18} />, color: "sky" },
                    { label: "Critical", value: stats.critical, icon: <ShieldAlert size={18} />, color: "rose" },
                    { label: "Warnings", value: stats.warnings, icon: <AlertTriangle size={18} />, color: "amber" },
                    { label: "Today", value: stats.today, icon: <Clock size={18} />, color: "emerald" },
                ].map((stat, i) => {
                    const accentMap = { sky: "bg-sky-500", rose: "bg-rose-500", amber: "bg-amber-500", emerald: "bg-emerald-500" };
                    return (
                        <div key={i} className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 relative overflow-hidden group hover:border-slate-600 transition-colors">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentMap[stat.color]}`} />
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                                <span className="text-slate-600 group-hover:text-slate-400 transition-colors">{stat.icon}</span>
                            </div>
                            <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-slate-500">
                    <Filter size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-1 bg-[#0f172a] border border-[#1e293b] rounded-lg p-0.5">
                    <button
                        onClick={() => setCategoryFilter("all")}
                        className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${
                            categoryFilter === "all"
                                ? "bg-slate-800 text-slate-200 border border-slate-700"
                                : "text-slate-500 hover:text-slate-300 border border-transparent"
                        }`}
                    >
                        All
                    </button>
                    {Object.entries(categoryConfig).map(([key, cfg]) => {
                        const Icon = cfg.icon;
                        return (
                            <button
                                key={key}
                                onClick={() => setCategoryFilter(categoryFilter === key ? "all" : key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${
                                    categoryFilter === key
                                        ? `${cfg.bg} ${cfg.text} border ${cfg.border}`
                                        : "text-slate-500 hover:text-slate-300 border border-transparent"
                                }`}
                            >
                                <Icon size={10} />
                                {key}
                            </button>
                        );
                    })}
                </div>

                {/* Severity Filter */}
                <div className="flex items-center gap-1 bg-[#0f172a] border border-[#1e293b] rounded-lg p-0.5 ml-auto">
                    <button
                        onClick={() => setSeverityFilter("all")}
                        className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${
                            severityFilter === "all"
                                ? "bg-slate-800 text-slate-200 border border-slate-700"
                                : "text-slate-500 hover:text-slate-300 border border-transparent"
                        }`}
                    >
                        All
                    </button>
                    {Object.entries(severityConfig).map(([key, cfg]) => (
                        <button
                            key={key}
                            onClick={() => setSeverityFilter(severityFilter === key ? "all" : key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${
                                severityFilter === key
                                    ? `${cfg.bg} ${cfg.text} border ${cfg.border}`
                                    : "text-slate-500 hover:text-slate-300 border border-transparent"
                            }`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {key}
                        </button>
                    ))}
                </div>
            </div>

            {/* AG Grid */}
            <div className="rounded-2xl border border-[#1e293b] overflow-hidden shadow-2xl" style={{ height: "calc(100vh - 420px)" }}>
                <AgGridReact
                    theme={auditTheme}
                    rowData={filteredData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    onGridReady={onGridReady}
                    onRowClicked={onRowClicked}
                    animateRows={true}
                    rowSelection="single"
                    suppressCellFocus={true}
                    overlayNoRowsTemplate='<span class="text-slate-500 text-sm">No audit events found for the selected filters</span>'
                />
            </div>

            {/* Event Detail Drawer */}
            <div className={`fixed inset-y-0 right-0 w-[420px] bg-[#0f172a] border-l border-[#1e293b] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}>
                {selectedEvent && (
                    <div className="flex flex-col h-full">
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between p-6 border-b border-[#1e293b]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#1e293b] rounded-xl flex items-center justify-center">
                                    <Eye size={18} className="text-slate-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">Event Details</h3>
                                    <p className="text-[10px] text-slate-500 font-mono">{selectedEvent.id}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setDrawerOpen(false)} 
                                className="p-2 text-slate-500 hover:text-slate-200 bg-[#1e293b] hover:bg-[#334155] rounded-lg transition-all"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {/* Severity Badge */}
                            {(() => {
                                const cfg = severityConfig[selectedEvent.severity] || severityConfig["Info"];
                                return (
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                                        <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                        {selectedEvent.severity}
                                    </div>
                                );
                            })()}

                            {/* Info Grid */}
                            <div className="space-y-3">
                                {[
                                    { label: "Timestamp", value: selectedEvent.timestamp, icon: <Clock size={13} className="text-slate-600" /> },
                                    { label: "Category", value: selectedEvent.category, icon: (() => {
                                        const cfg = categoryConfig[selectedEvent.category];
                                        const Icon = cfg?.icon || Shield;
                                        return <Icon size={13} className={cfg?.text || "text-slate-600"} />;
                                    })() },
                                    { label: "Action", value: selectedEvent.action, icon: <PenLine size={13} className="text-slate-600" /> },
                                    { label: "Performed By", value: selectedEvent.user, icon: <User size={13} className="text-slate-600" /> },
                                    { label: "IP Address", value: selectedEvent.ip, icon: <KeyRound size={13} className="text-slate-600" /> },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-[#020617] border border-[#1e293b] rounded-xl">
                                        <div className="mt-0.5 shrink-0">{item.icon}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-0.5">{item.label}</p>
                                            <p className="text-xs text-slate-200 font-medium">{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Description */}
                            <div className="p-4 bg-[#020617] border border-[#1e293b] rounded-xl">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2">Full Description</p>
                                <p className="text-xs text-slate-300 leading-relaxed">{selectedEvent.description}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Drawer Backdrop */}
            {drawerOpen && (
                <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setDrawerOpen(false)} />
            )}
        </div>
    );
}
