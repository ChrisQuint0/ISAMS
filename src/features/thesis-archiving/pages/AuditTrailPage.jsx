import React, { useState, useMemo, useCallback, useRef } from "react";
import { ThesisArchivingHeader } from "../components/ThesisArchivingHeader";
import {
    Search, Filter,
    Calendar, Activity, User, Clock,
    FileSpreadsheet
} from "lucide-react";
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeBalham } from 'ag-grid-community';

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
                    Edit: "bg-amber-50 text-amber-700 border-amber-200",
                    Add: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    Delete: "bg-rose-50 text-rose-700 border-rose-200",
                    Login: "bg-blue-50 text-blue-700 border-blue-200",
                    Export: "bg-purple-50 text-purple-700 border-purple-200"
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
            field: "time",
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
                                value={searchText}
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
                                value={actionFilter}
                                onChange={(e) => setActionFilter(e.target.value)}
                            >
                                <option value="all">Filter by actions</option>
                                <option value="Add">Add</option>
                                <option value="Edit">Edit</option>
                                <option value="Delete">Delete</option>
                                <option value="Login">Login</option>
                                <option value="Export">Export</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 border border-gray-200 rounded-lg">
                            <Calendar size={14} className="text-gray-500" />
                            <input
                                type="date"
                                value={dateValue}
                                onChange={(e) => setDateValue(e.target.value)}
                                className="bg-transparent text-sm text-gray-700 outline-none cursor-pointer"
                            />
                        </div>
                    </div>

                    <button
                        onClick={onExportClick}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        <FileSpreadsheet size={16} />
                        Generate CSV
                    </button>
                </div>

                {/* Table Section */}
                <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm" style={{ height: "600px" }}>
                    <div style={{ height: "100%", width: "100%" }}>
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

