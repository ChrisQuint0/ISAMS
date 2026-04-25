import React, { useState, useMemo, useCallback, useRef } from "react";
import { ThesisArchivingHeader } from "../components/ThesisArchivingHeader";
import {
    Search, Filter,
    Calendar, Activity, User, Clock,
    FileSpreadsheet, Loader2, AlertCircle
} from "lucide-react";
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeBalham } from 'ag-grid-community';
import { useAuditLogs } from "../hooks/useAuditLogs";
import { supabase } from "@/lib/supabaseClient";
import { useSettings } from "../../settings/hooks/useSettings";

ModuleRegistry.registerModules([AllCommunityModule]);

const auditTheme = themeBalham.withParams({
    accentColor: "#059669", // emerald-600
    backgroundColor: "#ffffff",
    foregroundColor: "#374151",
    borderColor: "#e5e5e5",
    headerBackgroundColor: "#f9fafb",
    headerTextColor: "#374151",
    oddRowBackgroundColor: "#ffffff",
    rowHeight: 48,
    headerHeight: 40,
});

export default function AuditTrailPage() {
    const gridRef = useRef();
    const { settings } = useSettings();
    const { logs, availableActions, loading, error, filters, updateFilters, refresh } = useAuditLogs();
    const [dateBounds, setDateBounds] = useState({ min: "", max: "" });

    React.useEffect(() => {
        let active = true;

        async function loadDateBounds() {
            try {
                const { data } = await supabase
                    .from("vw_audit_trail")
                    .select("time")
                    .not("time", "is", null)
                    .order("time", { ascending: true })
                    .limit(1);

                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                const maxDate = `${year}-${month}-${day}`;

                let minDate = maxDate;
                if (active && data && data.length > 0) {
                    const earliestYear = new Date(data[0].time).getFullYear();
                    minDate = `${earliestYear}-01-01`;
                }

                if (active) {
                    setDateBounds({ min: minDate, max: maxDate });
                }
            } catch (err) {
                console.error("Failed to load audit date bounds:", err);
            }
        }
        loadDateBounds();

        return () => { active = false; };
    }, []);

    const columnDefs = useMemo(() => [
        {
            headerName: "Name",
            field: "name",
            flex: 1.5,
            cellRenderer: (p) => (
                <div className="flex items-center gap-2 h-full">
                    <div className="w-7 h-7 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0">
                        <User size={12} className="text-gray-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{p.value}</span>
                </div>
            )
        },
        {
            headerName: "Action",
            field: "action",
            width: 120,
            cellRenderer: (p) => {
                const badgeStyles = {
                    Add: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    Edit: "bg-blue-50 text-blue-700 border-blue-200",
                    Delete: "bg-rose-50 text-rose-700 border-rose-200",
                    Archive: "bg-violet-50 text-violet-700 border-violet-200",
                    Restore: "bg-cyan-50 text-cyan-700 border-cyan-200",
                    Upload: "bg-indigo-50 text-indigo-700 border-indigo-200",
                    Similarity_Run: "bg-amber-50 text-amber-700 border-amber-200",
                    Export: "bg-orange-50 text-orange-700 border-orange-200",
                    Notify: "bg-sky-50 text-sky-700 border-sky-200",
                    Settings: "bg-slate-50 text-slate-700 border-slate-200",
                    Login: "bg-gray-50 text-gray-700 border-gray-200"
                };
                const defaultStyle = "bg-gray-50 text-gray-700 border-gray-200";
                const style = badgeStyles[p.value] || defaultStyle;
                return (
                    <div className="flex items-center h-full">
                        <span className={`border text-xs font-semibold px-2.5 py-0.5 rounded-lg ${style}`}>
                            {p.value}
                        </span>
                    </div>
                );
            }
        },
        {
            headerName: "Description",
            field: "description",
            flex: 2.5,
            cellRenderer: (p) => <div className="flex items-center h-full"><span className="text-sm text-gray-600">{p.value}</span></div>
        },
        {
            headerName: "Module Affected",
            field: "module_affected",
            flex: 1.5,
            cellRenderer: (p) => <div className="flex items-center h-full"><span className="text-[13px] text-gray-700 font-medium">{p.value}</span></div>
        },
        {
            headerName: "Record ID",
            field: "record_id",
            width: 110,
            cellRenderer: (p) => <div className="flex items-center h-full"><span className="text-[13px] text-gray-500 font-mono">{p.value}</span></div>
        },
        {
            headerName: "User Agent",
            field: "user_agent",
            flex: 2,
            cellRenderer: (p) => <div className="flex items-center h-full"><span className="text-[11px] text-gray-400 truncate block max-w-full">{p.value}</span></div>
        },
        {
            headerName: "Time",
            field: "time_display",
            width: 180,
            cellRenderer: (p) => (
                <div className="flex items-center gap-2 h-full text-gray-500">
                    <Clock size={12} className="shrink-0 opacity-70" />
                    <span className="text-xs font-mono">{p.value}</span>
                </div>
            )
        }
    ], []);

    const defaultColDef = useMemo(() => ({
        sortable: true,
        resizable: true,
        filter: true,
        suppressMovable: true,
    }), []);

    const onExportClick = useCallback(() => {
        if (gridRef.current?.api) {
            const now = new Date();
            const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
            const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
            const collegeName = settings?.college_name || "College of Computing and Information Sciences";
            
            const commas = ",,,,,,"; 
            const customHeader = [
              `"Pamantasan ng Lungsod ng Pasig"${commas}`,
              `"${collegeName}"${commas}`,
              `"Thesis Archiving Module  //  ISAMS"${commas}`,
              `""${commas}`,
              `"AUDIT TRAIL"${commas}`,
              `"Date Generated: ${dateStr} ${timeStr}  ·  Total Records: ${logs.length}"${commas}`,
              `""${commas}\r\n`
            ].join("\r\n");

            gridRef.current.api.exportDataAsCsv({
                fileName: `AuditTrail_${new Date().toISOString().split('T')[0]}.csv`,
                customHeader: customHeader
            });
        }
    }, [logs.length, settings]);

    const onSearchChange = (e) => {
        updateFilters({ search: e.target.value });
    };

    return (
        <div className="min-h-screen bg-neutral-100 flex flex-col">
            <ThesisArchivingHeader title="Audit Trail" variant="light" />
            <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full flex flex-col gap-6">

                {/* Header Section */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">
                                Audit Trail
                            </h1>
                            <p className="text-sm text-gray-600 mt-0.5">
                                System security & monitoring activity logs
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div className="relative group w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={filters.search}
                                onChange={onSearchChange}
                                className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="flex items-center justify-between gap-4 p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 border border-gray-200 rounded-lg">
                            <Activity size={14} className="text-gray-500" />
                            <select
                                className="bg-transparent text-sm text-gray-700 outline-none cursor-pointer pr-5"
                                value={filters.action}
                                onChange={(e) => updateFilters({ action: e.target.value })}
                            >
                                <option value="all">All actions</option>
                                {(availableActions || []).map(action => (
                                    <option key={action} value={action}>{action}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 border border-gray-200 rounded-lg">
                            <Calendar size={14} className="text-gray-500" />
                            <input
                                type="date"
                                value={filters.date}
                                onChange={(e) => updateFilters({ date: e.target.value })}
                                className="bg-transparent text-sm text-gray-700 outline-none cursor-pointer"
                                min={dateBounds.min || undefined}
                                max={dateBounds.max || undefined}
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-rose-600 text-sm font-medium animate-in fade-in slide-in-from-left-2">
                                <AlertCircle size={14} />
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {loading && <Loader2 size={16} className="text-emerald-600 animate-spin mr-2" />}
                        <button
                            onClick={onExportClick}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FileSpreadsheet size={16} />
                            Generate CSV
                        </button>
                    </div>
                </div>

                {/* Table Section */}
                <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm relative" style={{ height: "600px" }}>
                    {loading && logs.length === 0 ? (
                        <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 size={32} className="text-emerald-600 animate-spin" />
                                <span className="text-sm font-medium text-gray-500">Loading activity logs...</span>
                            </div>
                        </div>
                    ) : null}
                    <div style={{ height: "100%", width: "100%" }}>
                        <AgGridReact
                            ref={gridRef}
                            theme={auditTheme}
                            rowData={logs}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            animateRows={true}
                            pagination={true}
                            paginationPageSize={20}
                            paginationPageSizeSelector={[20, 50, 100]}
                            rowSelection="single"
                            suppressCellFocus={true}
                            overlayNoRowsTemplate='<span class="text-gray-500">No activity logs found matching your filters</span>'
                        />
                    </div>
                </div>

                {/* Navigation/Footer Space Replacement */}
                <footer className="border-t border-neutral-200 bg-white shadow-sm rounded-xl mt-2 overflow-hidden flex justify-between items-center px-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs text-gray-600 font-medium">System Status: Monitoring</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">
                        ISAMS - Integrated Smart Academic Management System • Security Framework
                    </p>
                </footer>
            </main>
        </div>
    );
}

