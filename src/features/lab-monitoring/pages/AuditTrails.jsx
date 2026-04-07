import React, { useState, useMemo, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
    Download, Filter, Shield, ShieldAlert, User, Clock,
    CalendarDays, Settings, Monitor, PenLine,
    AlertTriangle, KeyRound, Eye, X, UserCog, RefreshCw,
    FileText, FileSpreadsheet, Download as DownloadIcon
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { handleAuditTrailExcel, handleAuditTrailPDF } from "../utils/exportUtils";
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeBalham } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

const auditTheme = themeBalham.withParams({
    accentColor: '#008a45',
    backgroundColor: '#ffffff',
    foregroundColor: '#111827',
    borderColor: '#e5e7eb',
    headerBackgroundColor: '#f9fafb',
    headerTextColor: '#374151',
    oddRowBackgroundColor: '#ffffff',
    rowHeight: 48,
    headerHeight: 40,
});

const categoryConfig = {
    "Authentication": { icon: KeyRound, bg: "bg-primary-500", text: "text-neutral-900", border: "border-primary-500" },
    "PC Management": { icon: Monitor, bg: "bg-gold-500", text: "text-neutral-900", border: "border-gold-500" },
    "Settings": { icon: Settings, bg: "bg-primary-600", text: "text-neutral-900", border: "border-primary-600" },
    "Student Logs": { icon: User, bg: "bg-success", text: "text-neutral-900", border: "border-success" },
    "Schedule": { icon: CalendarDays, bg: "bg-primary-700", text: "text-neutral-900", border: "border-primary-700" },
    "Override": { icon: ShieldAlert, bg: "bg-destructive-semantic", text: "text-neutral-900", border: "border-destructive-semantic" },
};

const severityConfig = {
    "Info": { bg: "bg-info", text: "text-white", border: "border-info", dot: "bg-info" },
    "Warning": { bg: "bg-warning", text: "text-white", border: "border-warning", dot: "bg-warning" },
    "Critical": { bg: "bg-destructive-semantic", text: "text-white", border: "border-destructive-semantic", dot: "bg-destructive-semantic" },
    "Success": { bg: "bg-success", text: "text-white", border: "border-success", dot: "bg-success" },
};

const getInitialManilaDates = () => {
    const d = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' });
    const parts = formatter.formatToParts(d);

    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;

    const lastDay = new Date(year, parseInt(month, 10), 0).getDate();
    return {
        firstDay: `${year}-01-01`,  // Start of the year
        lastDay: `${year}-${month}-${String(lastDay).padStart(2, '0')}` // End of the current month
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

            let normalizedSeverity = "Info";
            if (row.severity) {
                const s = row.severity.toLowerCase();
                if (s === "critical" || s === "error") normalizedSeverity = "Critical";
                else if (s === "warning") normalizedSeverity = "Warning";
                else if (s === "success") normalizedSeverity = "Success";
            }

            return {
                id: row.id,
                timestamp: dateStr,
                user: row.actor,
                category: row.category,
                action: row.action,
                description: row.description,
                severity: normalizedSeverity,
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
            headerName: "SEVERITY",
            field: "severity",
            width: 150,
            cellStyle: { display: 'flex', alignItems: 'center', padding: '6px' },
            cellRenderer: (params) => {
                const cfg = severityConfig[params.value] || severityConfig["Info"];
                return (
                    <span className={`inline-flex items-center justify-center w-full h-full rounded text-[10px] font-bold uppercase tracking-tighter border text-center ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        {params.value}
                    </span>
                );
            },
        },
        {
            headerName: "TIMESTAMP",
            field: "timestamp",
            width: 200,
            cellRenderer: (params) => (
                <div className="flex items-center gap-2 h-full">
                    <Clock size={12} className="text-neutral-500 shrink-0" />
                    <span className="text-xs text-neutral-700 font-mono">{params.value}</span>
                </div>
            ),
        },
        {
            headerName: "CATEGORY",
            field: "category",
            width: 160,
            cellRenderer: (params) => {
                const cfg = categoryConfig[params.value];
                if (!cfg) return <span className="text-xs text-neutral-600">{params.value}</span>;
                const Icon = cfg.icon;
                return (
                    <div className="flex items-center gap-2 h-full">
                        <div className={`p-1 rounded-md ${cfg.bg} border ${cfg.border}`}>
                            <Icon size={12} className={cfg.text} />
                        </div>
                        <span className={`text-xs font-semibold ${cfg.text}`}>{params.value}</span>
                    </div>
                );
            },
        },
        {
            headerName: "ACTION",
            field: "action",
            width: 220,
            cellRenderer: (params) => (
                <div className="flex items-center h-full">
                    <span className="text-xs font-semibold text-neutral-900">{params.value}</span>
                </div>
            ),
        },
        {
            headerName: "PERFORMED BY",
            field: "user",
            width: 200,
            cellRenderer: (params) => {
                const isSystem = params.value === "System";
                return (
                    <div className="flex items-center gap-2 h-full">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isSystem ? "bg-neutral-200 border border-neutral-300" : "bg-primary-500/15 border border-primary-500/20"}`}>
                            {isSystem ? <RefreshCw size={10} className="text-neutral-500" /> : <UserCog size={10} className="text-primary-600" />}
                        </div>
                        <span className={`text-xs ${isSystem ? "text-neutral-500 italic" : "text-neutral-800 font-medium"}`}>{params.value}</span>
                    </div>
                );
            },
        },
        {
            headerName: "DESCRIPTION",
            field: "description",
            flex: 1,
            minWidth: 300,
            cellRenderer: (params) => (
                <div className="flex items-center h-full">
                    <span className="text-xs text-neutral-600 truncate">{params.value}</span>
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
        <div className="p-6 space-y-6 bg-neutral-100 min-h-screen text-neutral-900">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-[30px] font-bold text-neutral-900 tracking-tight">{labName} — Audit Trails</h1>
                    <p className="text-neutral-500 text-sm italic">Complete activity log of all system events, admin actions & overrides</p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-lg px-3 py-2 hover:border-neutral-300 transition-colors shadow-sm">
                        <CalendarDays size={13} className="text-neutral-500 shrink-0" />
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="bg-transparent text-xs font-bold text-neutral-900 outline-none border-none [color-scheme:light] w-[120px]"
                        />
                        <span className="text-[9px] text-neutral-500 font-bold uppercase">to</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="bg-transparent text-xs font-bold text-neutral-900 outline-none border-none [color-scheme:light] w-[120px]"
                        />
                    </div>

                    <div className="flex items-center gap-0">
                        <div className="flex items-center bg-white border border-neutral-200 rounded-l-lg p-0.5 shadow-sm">
                            <button
                                onClick={() => setExportFormat("excel")}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${exportFormat === "excel"
                                    ? "bg-primary-500 text-white border border-primary-500"
                                    : "text-neutral-500 hover:text-neutral-700 border border-transparent"
                                    }`}
                            >
                                <FileSpreadsheet size={11} className={exportFormat === "excel" ? "text-white" : "text-primary-500"} /> Excel
                            </button>
                            <button
                                onClick={() => setExportFormat("pdf")}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${exportFormat === "pdf"
                                    ? "bg-gold-500 text-neutral-900 border border-gold-500"
                                    : "text-neutral-900 hover:text-neutral-700 border border-transparent"
                                    }`}
                            >
                                <FileText size={11} className="text-neutral-900" /> PDF
                            </button>
                        </div>
                        <button
                            onClick={handleExport}
                            className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-r-lg border border-l-0 transition-all shadow-sm ${exportFormat === "excel"
                                    ? "bg-primary-500 border-primary-500 hover:bg-primary-600 text-white"
                                    : "bg-gold-500 border-gold-500 hover:bg-gold-600 text-neutral-900"
                                }`}
                        >
                            <Download size={13} className={exportFormat === "excel" ? "text-white" : "text-neutral-900"} /> Export .{exportFormat}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Events", value: stats.total, icon: <Shield size={18} className="text-info" />, accent: "bg-info" },
                    { label: "Critical", value: stats.critical, icon: <ShieldAlert size={18} className="text-destructive-semantic" />, accent: "bg-destructive-semantic" },
                    { label: "Warnings", value: stats.warnings, icon: <AlertTriangle size={18} className="text-warning" />, accent: "bg-warning" },
                    { label: "Today", value: stats.today, icon: <Clock size={18} className="text-success" />, accent: "bg-success" },
                ].map((stat, i) => {
                    return (
                        <div key={i} className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${stat.accent}`} />
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-neutral-500 text-[10px] font-semibold uppercase tracking-widest">{stat.label}</p>
                                <span className="text-neutral-600">{stat.icon}</span>
                            </div>
                            <p className="text-3xl font-bold text-neutral-900 tracking-tight">{stat.value}</p>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-neutral-500">
                    <Filter size={14} />
                    <span className="text-[10px] font-semibold uppercase tracking-widest">Filters</span>
                </div>

                <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-lg p-0.5 shadow-sm">
                    <button
                        onClick={() => setCategoryFilter("all")}
                        className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${categoryFilter === "all"
                            ? "bg-primary-500 text-white border border-primary-500"
                            : "text-neutral-900 hover:text-neutral-700 border border-transparent"
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
                                    ? "bg-primary-500 text-white border border-primary-500"
                                    : "text-neutral-900 hover:text-neutral-700 border border-transparent"
                                    }`}
                            >
                                <Icon size={10} />
                                {key}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-lg p-0.5 shadow-sm ml-auto">
                    <button
                        onClick={() => setSeverityFilter("all")}
                        className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${severityFilter === "all"
                            ? "bg-primary-500 text-white border border-primary-500"
                            : "text-neutral-900 hover:text-neutral-700 border border-transparent"
                            }`}
                    >
                        All
                    </button>
                    {Object.entries(severityConfig).map(([key, cfg]) => (
                        <button
                            key={key}
                            onClick={() => setSeverityFilter(severityFilter === key ? "all" : key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${severityFilter === key
                                ? "bg-primary-500 text-white border border-primary-500"
                                : "text-neutral-900 hover:text-neutral-700 border border-transparent"
                                }`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {key}
                        </button>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 overflow-hidden shadow-md" style={{ height: "calc(100vh - 420px)" }}>
                <AgGridReact
                    theme={auditTheme}
                    rowData={formattedData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    onGridReady={onGridReady}
                    onRowClicked={onRowClicked}
                    animateRows={true}
                    suppressCellFocus={true}
                    overlayNoRowsTemplate='<span class="w-full h-[250px] mt-4 flex items-center justify-center text-neutral-500 font-mono text-xs uppercase tracking-widest">No audit events found for the selected filters</span>'
                />
            </div>

            <div className={`fixed inset-y-0 right-0 w-[420px] bg-white border-l border-neutral-200 shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}>
                {selectedEvent && (
                    <div className="flex flex-col h-full">
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                                    <Eye size={18} className="text-neutral-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-neutral-900">Event Details</h3>
                                    <p className="text-[10px] text-neutral-500 font-mono">{selectedEvent.id}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setDrawerOpen(false)}
                                className="p-2 text-neutral-500 hover:text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-all"
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
                                    { label: "Timestamp", value: selectedEvent.timestamp, icon: <Clock size={13} className="text-neutral-500" /> },
                                    {
                                        label: "Category", value: selectedEvent.category, icon: (() => {
                                            const cfg = categoryConfig[selectedEvent.category];
                                            const Icon = cfg?.icon || Shield;
                                            return <Icon size={13} className={cfg?.text || "text-neutral-500"} />;
                                        })()
                                    },
                                    { label: "Action", value: selectedEvent.action, icon: <PenLine size={13} className="text-neutral-500" /> },
                                    { label: "Performed By", value: selectedEvent.user, icon: <User size={13} className="text-neutral-500" /> },
                                    { label: "IP Address", value: selectedEvent.ip, icon: <KeyRound size={13} className="text-neutral-500" /> },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-xl shadow-sm">
                                        <div className="mt-0.5 shrink-0">{item.icon}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] font-semibold uppercase tracking-widest text-neutral-500 mb-0.5">{item.label}</p>
                                            <p className="text-xs text-neutral-800 font-medium">{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl shadow-sm">
                                <p className="text-[9px] font-semibold uppercase tracking-widest text-neutral-500 mb-2">Full Description</p>
                                <p className="text-xs text-neutral-700 leading-relaxed">{selectedEvent.description}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {drawerOpen && (
                <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setDrawerOpen(false)} />
            )}
        </div>
    );
}
