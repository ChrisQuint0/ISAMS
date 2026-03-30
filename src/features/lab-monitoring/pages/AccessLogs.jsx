import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Search, Monitor, Laptop, User, Clock, CalendarDays, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/lib/supabaseClient";

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
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data, error: supabaseError } = await supabase
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

            if (supabaseError) {
                console.error("Supabase Error:", supabaseError);
                setError(`Failed to load access logs. ${supabaseError.message}`);
                throw supabaseError;
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
            setSuccessMessage(`Successfully loaded ${formattedData.length} access logs`);
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (error) {
            console.error("Error fetching access logs:", error);
            setError("Failed to fetch access logs. Please refresh and try again.");
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
                    <span className="font-bold text-neutral-900">{params.value}</span>
                    <span className="text-[10px] text-neutral-600 font-mono uppercase tracking-tighter">{params.data.student_no}</span>
                </div>
            )
        },
        { headerName: "Section", field: "section", width: 110, cellClass: "text-xs text-neutral-700" },
        { 
            headerName: "Station", field: "pc_number", flex: 1,
            cellRenderer: (params) => (
                <span className={`font-bold ${params.value === "OVERFLOW" ? "text-destructive-semantic" : "text-primary-600"}`}>{params.value}</span>
            )
        },
        { 
            headerName: "Mode", field: "session_mode", flex: 1,
            cellRenderer: (params) => (
                <div className="flex items-center gap-2 text-neutral-700 h-full">
                    {params.value === "Laptop" ? <Laptop size={14} className="text-warning" /> : <Monitor size={14} className="text-primary-600" />}
                    <span className="text-xs">{params.value}</span>
                </div>
            )
        },
        { headerName: "Date", field: "date", width: 110, cellClass: "font-mono text-neutral-700 text-xs" },
        { 
            headerName: "Log Times", headerClass: "font-normal", children: [
                { 
                    headerName: "In", field: "time_in", width: 100, headerClass: "font-normal",
                    cellRenderer: (params) => (
                        <span className="font-bold text-neutral-900">{params.value}</span>
                    )
                },
                { 
                    headerName: "Out", field: "time_out", width: 100, headerClass: "font-normal",
                    cellRenderer: (params) => (
                        <span className="font-bold text-neutral-900">{params.value}</span>
                    )
                },
            ]
        },
        { 
            headerName: "Status", field: "status", width: 150, cellStyle: { display: 'flex', alignItems: 'center', padding: '6px' },
            cellRenderer: (params) => (
                <span className={`inline-flex items-center justify-center w-full h-full rounded text-[10px] font-black uppercase tracking-tighter border text-center ${
                    params.value === "Present" ? "bg-success/10 text-success border-success/20" : 
                    params.value === "Completed" ? "bg-primary-600/10 text-primary-600 border-primary-600/20" :
                    params.value === "Early Exit" ? "bg-warning/10 text-warning border-warning/20" : 
                    "bg-neutral-200 text-neutral-700 border-neutral-300"
                }`}>
                    {params.value}
                </span>
            )
        },
    ], []);

    return (
        <div className="p-6 space-y-5 bg-neutral-100 min-h-screen relative">
            <div>
                <h1 className="text-[30px] font-bold text-neutral-900 tracking-tight">{displayTitle} — Access Logs</h1>
                <p className="text-neutral-600 text-sm italic">Audit Trail & Peripheral Accountability</p>
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative max-w-xs flex-1 group/search" style={{ minWidth: 200 }}>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 z-10" size={12} />
                        <input 
                            type="text" placeholder="Search logs or student ID..."
                            className="w-full bg-white border border-neutral-200 rounded-lg py-1.5 pl-9 pr-4 text-sm text-neutral-900 font-semibold focus:ring-1 focus:ring-primary-600 outline-none transition-all hover:border-neutral-300 placeholder:text-neutral-500 shadow-sm"
                            onChange={(e) => gridApi?.setGridOption("quickFilterText", e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-lg px-3 py-1.5 hover:border-neutral-300 transition-colors shadow-sm">
                        <CalendarDays size={12} className="text-neutral-500 shrink-0" />
                        <input 
                            type="date" 
                            value={dateFrom} 
                            onChange={handleDateFromChange}
                            max={dateTo || todayStr}
                            className="bg-transparent text-sm text-neutral-900 font-semibold outline-none border-none [color-scheme:light] w-[120px]"
                        />
                        <span className="text-[9px] text-neutral-200 font-semibold uppercase">to</span>
                        <input 
                            type="date" 
                            value={dateTo} 
                            onChange={handleDateToChange}
                            min={dateFrom}
                            max={todayStr}
                            className="bg-transparent text-sm text-neutral-900 font-semibold outline-none border-none [color-scheme:light] w-[120px]"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="h-[720px] w-full rounded-lg overflow-hidden border border-neutral-200 shadow-sm flex flex-col items-center justify-center bg-white space-y-4">
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                    <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest animate-pulse">Syncing Logs...</p>
                </div>
            ) : (
                <div style={{
                  '--ag-header-background-color': '#f9fafb',
                  '--ag-header-foreground-color': '#374151',
                  '--ag-background-color': '#ffffff',
                }}>
                  <DataTable
                      rowData={rowData}
                      columnDefs={columnDefs}
                      onGridReady={(params) => setGridApi(params.api)}
                      onRowClicked={onRowClicked}
                      paginationPageSize={15}
                      className="h-[720px] rounded-lg bg-white"
                  />
                </div>
            )}

            {/* Student Details Modal */}
            <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DialogContent className="bg-white border-neutral-200 text-neutral-900 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-neutral-900">Student Details</DialogTitle>
                    </DialogHeader>

                    {selectedStudent && (
                        <div className="space-y-6">
                            <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-primary-600/10 flex items-center justify-center shrink-0">
                                        <User size={24} className="text-primary-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-lg font-bold text-neutral-900 truncate">{selectedStudent.student_name}</p>
                                        <p className="text-xs text-neutral-600 font-mono">{selectedStudent.student_no}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-neutral-200">
                                    <div className="col-span-2">
                                        <p className="text-[9px] text-neutral-600 uppercase tracking-wider font-bold">Class / Subject</p>
                                        <p className="text-xs font-medium text-neutral-900 mt-0.5 truncate">
                                            {selectedStudent.subject} <span className="text-neutral-600">({selectedStudent.section})</span>
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-neutral-600 uppercase tracking-wider font-bold">Date Attended</p>
                                        <p className="text-xs font-mono text-neutral-700 mt-0.5 flex items-center gap-1.5">
                                            <CalendarDays size={11}/> {selectedStudent.ui_date}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-neutral-600 uppercase tracking-wider font-bold">Session Mode</p>
                                        <p className="text-xs text-neutral-700 mt-0.5 flex items-center gap-1.5">
                                            {selectedStudent.session_mode === "Laptop" ? <Laptop size={11} className="text-warning" /> : <Monitor size={11} className="text-primary-600" />}
                                            {selectedStudent.session_mode}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 shadow-sm">
                                <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                    <Clock size={11} className="text-primary-600" /> Current Session Status
                                </h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <p className="text-[9px] text-neutral-500 uppercase tracking-wider font-bold">Station</p>
                                        <p className={`text-sm font-bold mt-0.5 ${selectedStudent.pc_number === "OVERFLOW" ? "text-destructive-semantic" : "text-primary-600"}`}>{selectedStudent.pc_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-neutral-500 uppercase tracking-wider font-bold">Time In</p>
                                        <p className="text-sm font-mono text-neutral-900 mt-0.5">{selectedStudent.time_in}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-neutral-500 uppercase tracking-wider font-bold">Time Out</p>
                                        <p className="text-sm font-mono text-neutral-900 mt-0.5">{selectedStudent.time_out}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}