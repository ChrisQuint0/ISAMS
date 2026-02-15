import React, { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { Search, Download, Monitor, Laptop } from "lucide-react";
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeBalham } from 'ag-grid-community';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Uses the AG Grid v33+ Theming API.
const accessLogTheme = themeBalham.withParams({
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

export default function AccessLogs() {
    const { labName } = useOutletContext();
    const [gridApi, setGridApi] = useState(null);

    // Anonymized Dummy Data for testing
    const [rowData] = useState([
        { student_no: "2023-0001", student_name: "STUDENT A", pc_number: "PC-01", session_mode: "PC", time_in: "01:00 PM", time_out: "04:00 PM", status: "Present" },
        { student_no: "2023-0002", student_name: "STUDENT B", pc_number: "PC-02", session_mode: "Laptop", time_in: "01:05 PM", time_out: "---", status: "Present" },
        { student_no: "2023-0003", student_name: "STUDENT C", pc_number: "PC-03", session_mode: "PC", time_in: "01:10 PM", time_out: "03:30 PM", status: "Early Exit" },
        { student_no: "2023-0004", student_name: "STUDENT D", pc_number: "OVERFLOW", session_mode: "Laptop", time_in: "01:15 PM", time_out: "---", status: "Overflow" },
        { student_no: "2023-0005", student_name: "STUDENT E", pc_number: "PC-04", session_mode: "PC", time_in: "01:00 PM", time_out: "04:05 PM", status: "Present" },
    ]);

    const columnDefs = useMemo(() => [
        { 
            headerName: "Student Info", 
            field: "student_name", 
            flex: 2,
            cellRenderer: (params) => (
                <div className="flex flex-col justify-center h-full leading-tight">
                    <span className="font-bold text-slate-100">{params.value}</span>
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">{params.data.student_no}</span>
                </div>
            )
        },
        { 
            headerName: "Station", 
            field: "pc_number", 
            flex: 1,
            cellRenderer: (params) => (
                <span className={`font-bold ${params.value === "OVERFLOW" ? "text-rose-400" : "text-sky-400"}`}>
                    {params.value}
                </span>
            )
        },
        { 
            headerName: "Mode", 
            field: "session_mode", 
            flex: 1,
            cellRenderer: (params) => (
                <div className="flex items-center gap-2 text-slate-300 h-full">
                    {params.value === "Laptop" ? <Laptop size={14} className="text-purple-400" /> : <Monitor size={14} className="text-sky-400" />}
                    <span className="text-xs">{params.value}</span>
                </div>
            )
        },
        { 
            headerName: "Log Times", 
            children: [
                { headerName: "In", field: "time_in", width: 100, cellClass: "font-mono text-slate-400 text-xs" },
                { headerName: "Out", field: "time_out", width: 100, cellClass: "font-mono text-slate-400 text-xs" },
            ]
        },
        { 
            headerName: "Status", 
            field: "status", 
            width: 120,
            cellRenderer: (params) => (
                <div className="flex items-center h-full">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter border ${
                        params.value === "Present" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                        params.value === "Early Exit" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                        params.value === "Overflow" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                        "bg-slate-800 text-slate-400 border-slate-700"
                    }`}>
                        {params.value}
                    </span>
                </div>
            )
        },
    ], []);

    return (
        <div className="p-8 space-y-6 bg-[#020617] min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">{labName} — Access Logs</h1>
                    <p className="text-slate-400 text-sm italic">Audit Trail & Peripheral Accountability</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-2.5 px-6 rounded-lg uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all">
                    <Download size={14} /> Export Logs
                </button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                    type="text"
                    placeholder="Search logs..."
                    className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    onChange={(e) => gridApi?.setGridOption("quickFilterText", e.target.value)}
                />
            </div>

            <div className="h-[550px] w-full rounded-xl overflow-hidden border border-[#1e293b] shadow-2xl">
                <AgGridReact
                    theme={accessLogTheme}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    onGridReady={(params) => setGridApi(params.api)}
                    pagination={true}
                    paginationPageSize={10}
                    defaultColDef={{
                        sortable: true,
                        filter: true,
                        resizable: true
                    }}
                />
            </div>
        </div>
    );
}