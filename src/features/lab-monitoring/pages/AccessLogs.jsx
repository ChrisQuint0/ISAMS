import React, { useState, useMemo, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { Search, Download, Monitor, Laptop, X, User, Clock, GraduationCap, CalendarDays, History, LogOut, CheckSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeBalham } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

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

    const [dateFrom, setDateFrom] = useState("2026-02-16");
    const [dateTo, setDateTo] = useState("2026-02-16");

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const [selectedRows, setSelectedRows] = useState([]);

    const [rowData] = useState([
        { student_no: "2023-0001", student_name: "Juan Dela Cruz", section: "BSIT-3A", pc_number: "PC-01", session_mode: "PC", date: "2026-02-16", time_in: "01:00 PM", time_out: "04:00 PM", status: "Present" },
        { student_no: "2023-0002", student_name: "Maria Santos", section: "BSIT-3A", pc_number: "PC-02", session_mode: "Laptop", date: "2026-02-16", time_in: "01:05 PM", time_out: "---", status: "Present" },
        { student_no: "2023-0003", student_name: "Jose Rizal Jr.", section: "BSIT-3A", pc_number: "PC-03", session_mode: "PC", date: "2026-02-16", time_in: "01:10 PM", time_out: "03:30 PM", status: "Early Exit" },
        { student_no: "2023-0004", student_name: "Ana Reyes", section: "BSIT-3B", pc_number: "OVERFLOW", session_mode: "Laptop", date: "2026-02-16", time_in: "01:15 PM", time_out: "---", status: "Overflow" },
        { student_no: "2023-0005", student_name: "Carlo Mendoza", section: "BSIT-3A", pc_number: "PC-04", session_mode: "PC", date: "2026-02-16", time_in: "01:00 PM", time_out: "04:05 PM", status: "Present" },
        { student_no: "2023-0006", student_name: "Bea Garcia", section: "BSIT-3A", pc_number: "PC-05", session_mode: "PC", date: "2026-02-15", time_in: "08:00 AM", time_out: "11:00 AM", status: "Present" },
        { student_no: "2023-0007", student_name: "Mark Villanueva", section: "BSIT-3B", pc_number: "PC-06", session_mode: "PC", date: "2026-02-15", time_in: "08:05 AM", time_out: "10:50 AM", status: "Early Exit" },
        { student_no: "2023-0008", student_name: "Ella Torres", section: "BSIT-3A", pc_number: "PC-07", session_mode: "Laptop", date: "2026-02-14", time_in: "01:00 PM", time_out: "04:00 PM", status: "Present" },
        { student_no: "2023-0009", student_name: "Luis Ramos", section: "BSIT-3A", pc_number: "PC-08", session_mode: "PC", date: "2026-02-14", time_in: "01:10 PM", time_out: "04:00 PM", status: "Present" },
        { student_no: "2023-0010", student_name: "Sofia Cruz", section: "BSIT-3B", pc_number: "PC-09", session_mode: "PC", date: "2026-02-13", time_in: "08:00 AM", time_out: "11:00 AM", status: "Present" },
    ]);

    const filteredData = useMemo(() => {
        return rowData.filter(r => {
            if (dateFrom && r.date < dateFrom) return false;
            if (dateTo && r.date > dateTo) return false;
            return true;
        });
    }, [rowData, dateFrom, dateTo]);

    const studentHistory = useMemo(() => {
        if (!selectedStudent) return [];
        return rowData
            .filter(r => r.student_no === selectedStudent.student_no)
            .sort((a, b) => b.date.localeCompare(a.date));
    }, [selectedStudent, rowData]);

    const onRowClicked = useCallback((e) => {
        setSelectedStudent(e.data);
        setDrawerOpen(true);
    }, []);

    const onSelectionChanged = useCallback(() => {
        if (!gridApi) return;
        setSelectedRows(gridApi.getSelectedRows());
    }, [gridApi]);

    const handleBulkTimeOut = () => {
        alert(`Timed out ${selectedRows.length} student(s)`);
        gridApi?.deselectAll();
        setSelectedRows([]);
    };

    const handleBulkExport = () => {
        if (!gridApi) return;
        gridApi.exportDataAsCsv({
            onlySelected: true,
            fileName: `access-logs-${dateFrom}-to-${dateTo}.csv`
        });
    };

    const columnDefs = useMemo(() => [
        {
            headerCheckboxSelection: true,
            checkboxSelection: true,
            width: 50,
            maxWidth: 50,
            suppressHeaderMenuButton: true,
            sortable: false,
            filter: false,
            resizable: false,
        },
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
            headerName: "Section",
            field: "section",
            width: 110,
            cellClass: "text-xs text-slate-400",
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
            headerName: "Date",
            field: "date",
            width: 110,
            cellClass: "font-mono text-slate-400 text-xs",
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
            width: 150,
            cellStyle: { display: 'flex', alignItems: 'center', padding: '6px' },
            cellRenderer: (params) => (
                <span className={`inline-flex items-center justify-center w-full h-full rounded text-[10px] font-black uppercase tracking-tighter border text-center ${
                    params.value === "Present" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                    params.value === "Early Exit" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                    params.value === "Overflow" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                    "bg-slate-800 text-slate-400 border-slate-700"
                }`}>
                    {params.value}
                </span>
            )
        },
    ], []);

    return (
        <div className="p-8 space-y-5 bg-[#020617] min-h-screen relative">

            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">{labName} — Access Logs</h1>
                <p className="text-slate-400 text-sm italic">Audit Trail & Peripheral Accountability</p>
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative max-w-xs flex-1 group/search" style={{ minWidth: 200 }}>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 z-10" size={14} />
                        <input 
                            type="text"
                            placeholder="Search logs..."
                            className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg py-2 pl-9 pr-4 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all hover:border-slate-600 placeholder:text-slate-600"
                            onChange={(e) => gridApi?.setGridOption("quickFilterText", e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-1.5 hover:border-slate-600 transition-colors">
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
                </div>

                <div className="flex items-center gap-2">
                    {selectedRows.length > 0 && (
                        <>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg border text-sky-400 bg-sky-500/10 border-sky-500/20">
                                {selectedRows.length} Selected
                            </span>
                            <button 
                                onClick={handleBulkTimeOut}
                                className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 text-[10px] font-bold py-2 px-4 rounded-lg uppercase tracking-widest transition-all group/btn relative overflow-hidden shrink-0"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/0 via-amber-400/0 to-amber-400/0 group-hover/btn:from-amber-400/5 group-hover/btn:via-amber-400/0 group-hover/btn:to-amber-400/0 transition-all duration-500 pointer-events-none" />
                                <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                                <LogOut size={13} /> Bulk Time-Out
                            </button>
                            <button 
                                onClick={handleBulkExport}
                                className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 text-purple-400 text-[10px] font-bold py-2 px-4 rounded-lg uppercase tracking-widest transition-all group/btn relative overflow-hidden shrink-0"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 via-purple-400/0 to-purple-400/0 group-hover/btn:from-purple-400/5 group-hover/btn:via-purple-400/0 group-hover/btn:to-purple-400/0 transition-all duration-500 pointer-events-none" />
                                <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
                                <Download size={13} /> Export Selected
                            </button>
                        </>
                    )}
                    <button 
                        onClick={() => gridApi?.exportDataAsCsv({ fileName: `access-logs-${dateFrom}-to-${dateTo}.csv` })}
                        className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 text-blue-400 hover:text-blue-300 text-[10px] font-bold py-2 px-5 rounded-lg uppercase tracking-widest transition-all group/btn relative overflow-hidden shrink-0"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover/btn:from-white/10 group-hover/btn:via-white/0 group-hover/btn:to-white/0 transition-all duration-500 pointer-events-none" />
                        <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                        <Download size={13} /> Export All
                    </button>
                </div>
            </div>

            <div className="h-[calc(100vh-240px)] w-full rounded-xl overflow-hidden border border-[#1e293b] shadow-2xl group relative hover:border-slate-600 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none z-10" />
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none z-10" />
                <AgGridReact
                    theme={accessLogTheme}
                    rowData={filteredData}
                    columnDefs={columnDefs}
                    onGridReady={(params) => setGridApi(params.api)}
                    onRowClicked={onRowClicked}
                    rowSelection="multiple"
                    onSelectionChanged={onSelectionChanged}
                    pagination={true}
                    paginationPageSize={10}
                    defaultColDef={{
                        sortable: true,
                        filter: true,
                        resizable: true
                    }}
                />
            </div>

            {drawerOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setDrawerOpen(false)}
                />
            )}

            <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#0f172a] border-l border-[#1e293b] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
                drawerOpen ? "translate-x-0" : "translate-x-full"
            }`}>
                {selectedStudent && (
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between p-6 border-b border-[#1e293b]">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Student Details</h3>
                            <button 
                                onClick={() => setDrawerOpen(false)}
                                className="p-2 text-slate-500 hover:text-slate-300 bg-[#1e293b] hover:bg-[#334155] rounded-lg transition-all"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            
                            <div className="bg-[#020617] border border-[#1e293b] rounded-2xl p-5 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-sky-500/20 flex items-center justify-center shrink-0">
                                        <User size={24} className="text-sky-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-lg font-bold text-white truncate">{selectedStudent.student_name}</p>
                                        <p className="text-xs text-slate-500 font-mono">{selectedStudent.student_no}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#1e293b]">
                                    <div className="flex items-center gap-2">
                                        <GraduationCap size={13} className="text-slate-500" />
                                        <span className="text-xs text-slate-400">{selectedStudent.section}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {selectedStudent.session_mode === "Laptop" 
                                            ? <Laptop size={13} className="text-purple-400" /> 
                                            : <Monitor size={13} className="text-sky-400" />}
                                        <span className="text-xs text-slate-400">{selectedStudent.session_mode}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Clock size={11} className="text-sky-500" /> Current Session
                                </h4>
                                <div className="bg-[#020617] border border-[#1e293b] rounded-xl p-4 space-y-3">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">Station</p>
                                            <p className={`text-sm font-bold mt-0.5 ${selectedStudent.pc_number === "OVERFLOW" ? "text-rose-400" : "text-sky-400"}`}>
                                                {selectedStudent.pc_number}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">Time In</p>
                                            <p className="text-sm font-mono text-slate-300 mt-0.5">{selectedStudent.time_in}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">Time Out</p>
                                            <p className="text-sm font-mono text-slate-300 mt-0.5">{selectedStudent.time_out}</p>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-[#1e293b]">
                                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded text-[10px] font-black uppercase tracking-tighter border ${
                                            selectedStudent.status === "Present" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                                            selectedStudent.status === "Early Exit" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                                            selectedStudent.status === "Overflow" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                                            "bg-slate-800 text-slate-400 border-slate-700"
                                        }`}>
                                            {selectedStudent.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <History size={11} className="text-purple-500" /> Visit History
                                    <span className="ml-auto px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-500 border border-[#334155]">
                                        {studentHistory.length} visits
                                    </span>
                                </h4>
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                    {studentHistory.map((visit, idx) => (
                                        <div key={idx} className={`bg-[#020617] border rounded-lg p-3 transition-colors ${
                                            visit.date === selectedStudent.date && visit.time_in === selectedStudent.time_in
                                                ? "border-sky-500/30 bg-sky-500/5"
                                                : "border-[#1e293b] hover:border-slate-600"
                                        }`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays size={11} className="text-slate-600" />
                                                    <span className="text-xs text-slate-300 font-mono">{visit.date}</span>
                                                </div>
                                                <span className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded border ${
                                                    visit.status === "Present" ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : 
                                                    visit.status === "Early Exit" ? "text-amber-500 bg-amber-500/10 border-amber-500/20" : 
                                                    "text-rose-500 bg-rose-500/10 border-rose-500/20"
                                                }`}>
                                                    {visit.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1.5 text-[10px] text-slate-500">
                                                <span>{visit.pc_number}</span>
                                                <span className="font-mono">{visit.time_in} → {visit.time_out}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-[#1e293b] space-y-2">
                            {selectedStudent.time_out === "---" && (
                                <button className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 text-[11px] font-bold py-3 rounded-xl uppercase tracking-widest transition-all group/btn relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover/btn:from-white/10 group-hover/btn:via-white/0 group-hover/btn:to-white/0 transition-all duration-500 pointer-events-none" />
                                    <LogOut size={14} /> Time Out Student
                                </button>
                            )}
                            <button 
                                onClick={() => setDrawerOpen(false)}
                                className="w-full flex items-center justify-center gap-2 bg-[#1e293b] hover:bg-[#334155] text-slate-300 text-[11px] font-bold py-3 rounded-xl uppercase tracking-widest transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}