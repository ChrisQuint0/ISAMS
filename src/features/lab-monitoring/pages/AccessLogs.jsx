import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Search, Monitor, Laptop, X, User, Clock, CalendarDays, LogOut, Loader2 } from "lucide-react";
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeBalham } from 'ag-grid-community';
import { supabase } from "@/lib/supabaseClient";

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

// TIMEZONE FIX: Strictly format "Today" in Asia/Manila Timezone
const getPHDateString = (inputDate = new Date()) => {
    const phTime = new Date(inputDate.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
    const y = phTime.getFullYear();
    const m = String(phTime.getMonth() + 1).padStart(2, '0');
    const d = String(phTime.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`; 
};

export default function AccessLogs() {
    const labId = sessionStorage.getItem('active_lab_id') || "lab-1";
    const labName = sessionStorage.getItem('active_lab_name') || "Lab 1"; 

    // 0TITLE FORMATTER
    const displayTitle = labName.replace(/^(Computer\s*)?Lab\s/i, 'Computer Laboratory ');

    const [gridApi, setGridApi] = useState(null);
    
    // Default to strict Philippine 'Today'
    const todayStr = getPHDateString();
    const [dateFrom, setDateFrom] = useState(todayStr);
    const [dateTo, setDateTo] = useState(todayStr);
    
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    
    const [rowData, setRowData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('attendance_logs_lm')
                .select(`
                    id, time_in, time_out, log_type, pc_no,
                    students_lists_lm ( full_name, student_no ),
                    lab_schedules_lm!inner ( room, section_block, subject_name ) 
                `)
                .eq('lab_schedules_lm.room', labName)
                .gte('time_in', `${dateFrom}T00:00:00+08:00`)
                .lte('time_in', `${dateTo}T23:59:59+08:00`)
                .order('time_in', { ascending: false });

            if (error) {
                console.error("Supabase Error:", error);
                throw error;
            }

            const formatPHTimeOnly = (d) => new Date(d).toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' });
            const formatPHDateUI = (d) => new Date(d).toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' });

            const formattedData = data.map(log => {
                return {
                    id: log.id,
                    student_no: log.students_lists_lm?.student_no || "N/A",
                    student_name: log.students_lists_lm?.full_name || "Unknown Student",
                    section: log.lab_schedules_lm?.section_block || "N/A",
                    subject: log.lab_schedules_lm?.subject_name || "Unknown Subject",
                    pc_number: log.pc_no ? `PC-${log.pc_no.toString().padStart(2, '0')}` : "OVERFLOW",
                    session_mode: log.log_type === 'Laptop' ? 'Laptop' : 'PC',
                    date: getPHDateString(new Date(log.time_in)), 
                    ui_date: formatPHDateUI(log.time_in),         
                    time_in: formatPHTimeOnly(log.time_in),
                    time_out: log.time_out ? formatPHTimeOnly(log.time_out) : "---",
                    status: !log.time_out ? "Present" : "Completed" 
                };
            });

            setRowData(formattedData);
        } catch (error) {
            console.error("Error fetching access logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        
        const sub = supabase.channel('logs-channel')
            .on('postgres_changes', { event: '*', table: 'attendance_logs_lm' }, fetchLogs)
            .subscribe();

        return () => supabase.removeChannel(sub);
    }, [labName, dateFrom, dateTo]);

    const onRowClicked = useCallback((e) => {
        setSelectedStudent(e.data);
        setDrawerOpen(true);
    }, []);

    // DATE VALIDATION HANDLERS
    const handleDateFromChange = (e) => {
        const newFrom = e.target.value;
        setDateFrom(newFrom);
        // Auto-correct: If the start date is pushed past the end date, move the end date up
        if (newFrom > dateTo) {
            setDateTo(newFrom);
        }
    };

    const handleDateToChange = (e) => {
        const newTo = e.target.value;
        setDateTo(newTo);
        // Auto-correct: If the end date is pulled before the start date, pull the start date back
        if (newTo < dateFrom) {
            setDateFrom(newTo);
        }
    };

    const columnDefs = useMemo(() => [
        { 
            headerName: "Student Info", field: "student_name", flex: 2,
            getQuickFilterText: (params) => {
                return `${params.value} ${params.data.student_no}`;
            },
            cellRenderer: (params) => (
                <div className="flex flex-col justify-center h-full leading-tight">
                    <span className="font-bold text-slate-100">{params.value}</span>
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">{params.data.student_no}</span>
                </div>
            )
        },
        { headerName: "Section", field: "section", width: 110, cellClass: "text-xs text-slate-400" },
        { 
            headerName: "Station", field: "pc_number", flex: 1,
            cellRenderer: (params) => (
                <span className={`font-bold ${params.value === "OVERFLOW" ? "text-rose-400" : "text-sky-400"}`}>{params.value}</span>
            )
        },
        { 
            headerName: "Mode", field: "session_mode", flex: 1,
            cellRenderer: (params) => (
                <div className="flex items-center gap-2 text-slate-300 h-full">
                    {params.value === "Laptop" ? <Laptop size={14} className="text-purple-400" /> : <Monitor size={14} className="text-sky-400" />}
                    <span className="text-xs">{params.value}</span>
                </div>
            )
        },
        { headerName: "Date", field: "date", width: 110, cellClass: "font-mono text-slate-400 text-xs" },
        { 
            headerName: "Log Times", children: [
                { headerName: "In", field: "time_in", width: 100, cellClass: "font-mono text-slate-400 text-xs" },
                { headerName: "Out", field: "time_out", width: 100, cellClass: "font-mono text-slate-400 text-xs" },
            ]
        },
        { 
            headerName: "Status", field: "status", width: 150, cellStyle: { display: 'flex', alignItems: 'center', padding: '6px' },
            cellRenderer: (params) => (
                <span className={`inline-flex items-center justify-center w-full h-full rounded text-[10px] font-black uppercase tracking-tighter border text-center ${
                    params.value === "Present" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                    params.value === "Completed" ? "bg-sky-500/10 text-sky-500 border-sky-500/20" :
                    params.value === "Early Exit" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
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
                <h1 className="text-2xl font-bold text-white tracking-tight">{displayTitle} — Access Logs</h1>
                <p className="text-slate-400 text-sm italic">Audit Trail & Peripheral Accountability</p>
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative max-w-xs flex-1 group/search" style={{ minWidth: 200 }}>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 z-10" size={14} />
                        <input 
                            type="text" placeholder="Search logs or student ID..."
                            className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg py-2 pl-9 pr-4 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all hover:border-slate-600 placeholder:text-slate-600"
                            onChange={(e) => gridApi?.setGridOption("quickFilterText", e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-[#0f172a] border border-[#1e293b] rounded-lg px-3 py-1.5 hover:border-slate-600 transition-colors">
                        <CalendarDays size={13} className="text-slate-500 shrink-0" />
                        <input 
                            type="date" 
                            value={dateFrom} 
                            onChange={handleDateFromChange}
                            max={dateTo || todayStr} // Cannot go past the set end date
                            className="bg-transparent text-xs text-slate-300 outline-none border-none [color-scheme:dark] w-[120px]"
                        />
                        <span className="text-[9px] text-slate-600 font-bold uppercase">to</span>
                        <input 
                            type="date" 
                            value={dateTo} 
                            onChange={handleDateToChange}
                            min={dateFrom} // Cannot be earlier than the set start date
                            max={todayStr} // Cannot exceed today
                            className="bg-transparent text-xs text-slate-300 outline-none border-none [color-scheme:dark] w-[120px]"
                        />
                    </div>
                </div>
            </div>

            <div className="h-[calc(100vh-240px)] w-full rounded-xl overflow-hidden border border-[#1e293b] shadow-2xl relative">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#020617] z-20 space-y-4">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">Syncing Logs...</p>
                    </div>
                ) : (
                    <AgGridReact
                        theme={accessLogTheme}
                        rowData={rowData}
                        columnDefs={columnDefs}
                        onGridReady={(params) => setGridApi(params.api)}
                        onRowClicked={onRowClicked}
                        pagination={true}
                        paginationPageSize={15}
                        defaultColDef={{ sortable: true, filter: true, resizable: true }}
                    />
                )}
            </div>

            {/* Right Side Drawer */}
            {drawerOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setDrawerOpen(false)}
                />
            )}
            
            <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#0f172a] border-l border-[#1e293b] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}>
                {selectedStudent && (
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between p-6 border-b border-[#1e293b]">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Student Details</h3>
                            <button onClick={() => setDrawerOpen(false)} className="p-2 text-slate-500 hover:text-white bg-[#1e293b] rounded-lg">
                                <X size={14} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="bg-[#020617] border border-[#1e293b] rounded-2xl p-5">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-sky-500/20 flex items-center justify-center shrink-0">
                                        <User size={24} className="text-sky-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-lg font-bold text-white truncate">{selectedStudent.student_name}</p>
                                        <p className="text-xs text-slate-500 font-mono">{selectedStudent.student_no}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#1e293b]">
                                    <div className="col-span-2">
                                        <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">Class / Subject</p>
                                        <p className="text-xs font-medium text-slate-300 mt-0.5 truncate">
                                            {selectedStudent.subject} <span className="text-slate-500">({selectedStudent.section})</span>
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">Date Attended</p>
                                        <p className="text-xs font-mono text-slate-400 mt-0.5 flex items-center gap-1.5">
                                            <CalendarDays size={11}/> {selectedStudent.ui_date}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">Session Mode</p>
                                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                                            {selectedStudent.session_mode === "Laptop" ? <Laptop size={11} className="text-purple-400" /> : <Monitor size={11} className="text-sky-400" />}
                                            {selectedStudent.session_mode}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-[#020617] border border-[#1e293b] rounded-xl p-4">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                    <Clock size={11} className="text-sky-500" /> Current Session Status
                                </h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <p className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">Station</p>
                                        <p className={`text-sm font-bold mt-0.5 ${selectedStudent.pc_number === "OVERFLOW" ? "text-rose-400" : "text-sky-400"}`}>{selectedStudent.pc_number}</p>
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
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}