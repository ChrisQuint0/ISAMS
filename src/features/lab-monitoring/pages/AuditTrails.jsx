import React, { useState, useMemo, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
    Download, Filter, Shield, ShieldAlert, User, Clock,
    CalendarDays, Settings, Monitor, PenLine,
    AlertTriangle, KeyRound, Eye, X, UserCog, RefreshCw,
    FileText, FileSpreadsheet
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { handleAuditTrailExcel, handleAuditTrailPDF } from "../utils/exportUtils";
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeBalham } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

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

const categoryConfig = {
    "Authentication": { icon: KeyRound, color: "sky", bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20" },
    "PC Management": { icon: Monitor, color: "purple", bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
    "Settings": { icon: Settings, color: "amber", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
    "Student Logs": { icon: User, color: "emerald", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
    "Schedule": { icon: CalendarDays, color: "cyan", bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
    "Override": { icon: ShieldAlert, color: "rose", bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
};

const severityConfig = {
    "Info": { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20", dot: "bg-sky-400" },
    "Warning": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", dot: "bg-amber-400" },
    "Critical": { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", dot: "bg-rose-400" },
    "Success": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-400" },
};

const getInitialManilaDates = () => {
    const d = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' });
    const parts = formatter.formatToParts(d);

    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;

    const lastDay = new Date(year, parseInt(month, 10), 0).getDate();
    return {
        firstDay: `${year}-${month}-01`,
        lastDay: `${year}-${month}-${String(lastDay).padStart(2, '0')}`
    };
};

export default function AuditTrails() {
    const { labName } = useOutletContext();
    const [gridApi, setGridApi] = useState(null);

    const [dateFrom, setDateFrom] = useState(() => getInitialManilaDates().firstDay);
    const [dateTo, setDateTo] = useState(() => getInitialManilaDates().lastDay);
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [severityFilter, setSeverityFilter] = useState("all");

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const [exportFormat, setExportFormat] = useState("excel");

    const [rowData, setRowData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    React.useEffect(() => {
        const fetchAuditLogs = async () => {
            console.log('Current Manila Query:', { dateFrom, dateTo, labName });
            if (!labName) return;
            setIsLoading(true);

            let query = supabase
                .from("audit_logs_lm")
                .select("*")
                .eq("lab_name", labName)
                .gte("timestamp", `${dateFrom}T00:00:00+08:00`)
                .lte("timestamp", `${dateTo}T23:59:59+08:00`)
                .order("timestamp", { ascending: false });

            if (categoryFilter !== "all") {
                query = query.eq("category", categoryFilter);
            }
            if (severityFilter !== "all") {
                query = query.eq("severity", severityFilter);
            }

            const { data, error } = await query;
            if (error) {
                console.error("Error fetching audit logs:", error);
            } else {
                setRowData(data || []);
            }
            setIsLoading(false);
        };

        fetchAuditLogs();
    }, [labName, dateFrom, dateTo, categoryFilter, severityFilter]);

    const formattedData = useMemo(() => {
        const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Manila",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });

        return rowData.map(row => {
            const d = new Date(row.timestamp);
            const parts = formatter.formatToParts(d);
            const yyyy = parts.find(p => p.type === 'year')?.value;
            const mm = parts.find(p => p.type === 'month')?.value;
            const dd = parts.find(p => p.type === 'day')?.value;
            const hh = parts.find(p => p.type === 'hour')?.value;
            const min = parts.find(p => p.type === 'minute')?.value;
            const ss = parts.find(p => p.type === 'second')?.value;
            const dayPeriod = parts.find(p => p.type === 'dayPeriod')?.value;

            const dateStr = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss} ${dayPeriod}`;

            return {
                id: row.id,
                timestamp: dateStr,
                user: row.actor,
                category: row.category,
                action: row.action,
                description: row.description,
                severity: row.severity,
                ip: row.ip_address || "—"
            };
        });
    }, [rowData]);

    const stats = useMemo(() => {
        const total = formattedData.length;
        const critical = formattedData.filter(r => r.severity === "Critical").length;
        const warnings = formattedData.filter(r => r.severity === "Warning").length;

        const todayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' });
        const parts = todayFormatter.formatToParts(new Date());
        const yyyy = parts.find(p => p.type === 'year')?.value;
        const mm = parts.find(p => p.type === 'month')?.value;
        const dd = parts.find(p => p.type === 'day')?.value;
        const manilaTodayStr = `${yyyy}-${mm}-${dd}`;

        const today = formattedData.filter(r => r.timestamp.startsWith(manilaTodayStr)).length;
        return { total, critical, warnings, today };
    }, [formattedData]);

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
        if (!formattedData.length) return;

        if (exportFormat === "excel") {
            handleAuditTrailExcel(formattedData, labName, dateFrom, dateTo);
        } else if (exportFormat === "pdf") {
            handleAuditTrailPDF(formattedData, labName, dateFrom, dateTo);
        }
    }, [formattedData, labName, dateFrom, dateTo, exportFormat]);

    return (
        <div className="p-8 space-y-6 bg-[#020617] min-h-screen text-slate-100">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">{labName} — Audit Trails</h1>
                    <p className="text-slate-400 text-sm italic">Complete activity log of all system events, admin actions & overrides</p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
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

                    <div className="flex items-center gap-0">
                        <div className="flex items-center bg-[#0f172a] border border-[#1e293b] rounded-l-lg p-0.5">
                            <button
                                onClick={() => setExportFormat("excel")}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${exportFormat === "excel"
                                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                    : "text-slate-500 hover:text-slate-300 border border-transparent"
                                    }`}
                            >
                                <FileSpreadsheet size={11} /> Excel
                            </button>
                            <button
                                onClick={() => setExportFormat("pdf")}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${exportFormat === "pdf"
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

            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-slate-500">
                    <Filter size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
                </div>

                <div className="flex items-center gap-1 bg-[#0f172a] border border-[#1e293b] rounded-lg p-0.5">
                    <button
                        onClick={() => setCategoryFilter("all")}
                        className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${categoryFilter === "all"
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
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${categoryFilter === key
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

                <div className="flex items-center gap-1 bg-[#0f172a] border border-[#1e293b] rounded-lg p-0.5 ml-auto">
                    <button
                        onClick={() => setSeverityFilter("all")}
                        className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${severityFilter === "all"
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
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${severityFilter === key
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

            <div className="rounded-2xl border border-[#1e293b] overflow-hidden shadow-2xl" style={{ height: "calc(100vh - 420px)" }}>
                <AgGridReact
                    theme={auditTheme}
                    rowData={formattedData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    onGridReady={onGridReady}
                    onRowClicked={onRowClicked}
                    animateRows={true}
                    rowSelection={{ mode: 'singleRow' }}
                    suppressCellFocus={true}
                    overlayNoRowsTemplate='<span class="text-slate-500 text-sm">No audit events found for the selected filters</span>'
                />
            </div>

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

                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {(() => {
                                const cfg = severityConfig[selectedEvent.severity] || severityConfig["Info"];
                                return (
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                                        <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                        {selectedEvent.severity}
                                    </div>
                                );
                            })()}

                            <div className="space-y-3">
                                {[
                                    { label: "Timestamp", value: selectedEvent.timestamp, icon: <Clock size={13} className="text-slate-600" /> },
                                    {
                                        label: "Category", value: selectedEvent.category, icon: (() => {
                                            const cfg = categoryConfig[selectedEvent.category];
                                            const Icon = cfg?.icon || Shield;
                                            return <Icon size={13} className={cfg?.text || "text-slate-600"} />;
                                        })()
                                    },
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

                            <div className="p-4 bg-[#020617] border border-[#1e293b] rounded-xl">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2">Full Description</p>
                                <p className="text-xs text-slate-300 leading-relaxed">{selectedEvent.description}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {drawerOpen && (
                <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setDrawerOpen(false)} />
            )}
        </div>
    );
}
