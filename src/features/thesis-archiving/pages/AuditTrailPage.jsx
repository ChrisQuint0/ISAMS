import React, { useState, useMemo, useCallback, useRef } from "react";
import { ThesisArchivingHeader } from "../components/ThesisArchivingHeader";
import {
    History, Search, Download, Filter,
    Calendar, Clock, User, Shield,
    ChevronDown, FileSpreadsheet, Activity
} from "lucide-react";
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

export default function AuditTrailPage() {
    const gridRef = useRef();
    const [searchText, setSearchText] = useState("");
    const [dateValue, setDateValue] = useState("");
    const [actionFilter, setActionFilter] = useState("all");

    const [rowData] = useState([
        {
            id: 1,
            name: "Super Admin",
            action: "Edit",
            description: "Updated employee information for user ID 1052",
            module_affected: "Employee Management",
            record_id: "222",
            user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            time: "2026-02-28 16:28:03"
        },
        {
            id: 2,
            name: "Dr. Reyes",
            action: "Add",
            description: "Uploaded new thesis document: 'Smart Traffic Management'",
            module_affected: "Thesis Archiving",
            record_id: "1056",
            user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            time: "2026-03-01 09:15:22"
        },
        {
            id: 3,
            name: "Prof. Santos",
            action: "Delete",
            description: "Removed duplicate HTE record",
            module_affected: "HTE Archiving",
            record_id: "892",
            user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            time: "2026-03-02 11:45:00"
        },
        {
            id: 4,
            name: "Admin Assistant",
            action: "Login",
            description: "User logged into the system",
            module_affected: "Auth",
            record_id: "77",
            user_agent: "Mozilla/5.0 (X11; Linux x86_64)",
            time: "2026-03-03 08:00:15"
        },
        {
            id: 5,
            name: "Super Admin",
            action: "Export",
            description: "Generated similarity report for CCS Department",
            module_affected: "Reports",
            record_id: "N/A",
            user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            time: "2026-03-04 14:30:10"
        }
    ]);

    const columnDefs = useMemo(() => [
        {
            headerName: "Name",
            field: "name",
            flex: 1.5,
            cellRenderer: (p) => (
                <div className="flex items-center gap-2 h-full">
                    <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <User size={12} className="text-blue-400" />
                    </div>
                    <span className="text-xs font-medium text-slate-200">{p.value}</span>
                </div>
            )
        },
        {
            headerName: "Action",
            field: "action",
            width: 120,
            cellRenderer: (p) => {
                const colors = {
                    Edit: "text-amber-400 font-semibold",
                    Add: "text-emerald-400 font-semibold",
                    Delete: "text-rose-400 font-semibold",
                    Login: "text-blue-400 font-semibold",
                    Export: "text-purple-400 font-semibold"
                };
                return <span className={`text-xs ${colors[p.value] || "text-slate-400"}`}>{p.value}</span>;
            }
        },
        {
            headerName: "Description",
            field: "description",
            flex: 2.5,
            cellRenderer: (p) => <span className="text-xs text-slate-400">{p.value}</span>
        },
        {
            headerName: "Module_Affected",
            field: "module_affected",
            flex: 1.5,
            cellRenderer: (p) => <span className="text-xs text-slate-300 font-medium">{p.value}</span>
        },
        {
            headerName: "Record ID",
            field: "record_id",
            width: 110,
            cellRenderer: (p) => <span className="text-xs text-slate-400 font-mono">{p.value}</span>
        },
        {
            headerName: "User Agent",
            field: "user_agent",
            flex: 2,
            cellRenderer: (p) => <span className="text-[10px] text-slate-500 truncate block max-w-full">{p.value}</span>
        },
        {
            headerName: "Time",
            field: "time",
            width: 180,
            cellRenderer: (p) => (
                <div className="flex items-center gap-2 h-full text-slate-400">
                    <Clock size={12} className="shrink-0 opacity-50" />
                    <span className="text-[11px] font-mono">{p.value}</span>
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
            gridRef.current.api.exportDataAsCsv({
                fileName: `AuditTrail_${new Date().toISOString().split('T')[0]}.csv`
            });
        }
    }, []);

    const onSearchChange = (e) => {
        setSearchText(e.target.value);
        gridRef.current?.api.setGridOption('quickFilterText', e.target.value);
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-950">
            <ThesisArchivingHeader title="Audit Trail" />
            <main className="flex-1 px-8 py-10 lg:px-12 lg:py-12">
                <div className="max-w-[1600px] mx-auto space-y-6">
                    {/* Header Section */}
                    <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500 mb-1">Security & Monitoring</p>
                        <div className="flex items-center justify-between">
                            <h1 className="text-4xl font-bold text-slate-50 tracking-tight">Audit Trail</h1>

                            {/* Search Bar */}
                            <div className="relative group w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search logs..."
                                    value={searchText}
                                    onChange={onSearchChange}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/50 shadow-lg transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filters Bar */}
                    <div className="flex items-center justify-between gap-4 p-2 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl">
                                <Activity size={14} className="text-slate-500" />
                                <select
                                    className="bg-transparent text-xs text-slate-300 outline-none cursor-pointer pr-5"
                                    value={actionFilter}
                                    onChange={(e) => setActionFilter(e.target.value)}
                                >
                                    <option value="all" className="bg-slate-900">Filter by actions</option>
                                    <option value="Add" className="bg-slate-900">Add</option>
                                    <option value="Edit" className="bg-slate-900">Edit</option>
                                    <option value="Delete" className="bg-slate-900">Delete</option>
                                    <option value="Login" className="bg-slate-900">Login</option>
                                    <option value="Export" className="bg-slate-900">Export</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl">
                                <Calendar size={14} className="text-slate-500" />
                                <input
                                    type="date"
                                    value={dateValue}
                                    onChange={(e) => setDateValue(e.target.value)}
                                    className="bg-transparent text-xs text-slate-300 outline-none [color-scheme:dark] cursor-pointer"
                                />
                                <span className="text-[10px] text-slate-600 font-bold ml-1 uppercase">Filter by Date</span>
                            </div>
                        </div>

                        <button
                            onClick={onExportClick}
                            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95"
                        >
                            <FileSpreadsheet size={16} />
                            Generate CSV
                        </button>
                    </div>

                    {/* Table Section */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative" style={{ height: "650px" }}>
                        <AgGridReact
                            ref={gridRef}
                            theme={auditTheme}
                            rowData={rowData}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            animateRows={true}
                            pagination={true}
                            paginationPageSize={20}
                            paginationPageSizeSelector={[20, 50, 100]}
                            rowSelection="single"
                            suppressCellFocus={true}
                            overlayNoRowsTemplate='<span class="text-slate-500">No activity logs found matching your filters</span>'
                        />
                    </div>

                    {/* Bottom Info */}
                    <div className="flex justify-between items-center px-2 py-1">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">System Status: Monitoring</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-600 font-medium tracking-tight">
                            Showing latest activity logs within the PLP-ISAMS Security Framework
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}

