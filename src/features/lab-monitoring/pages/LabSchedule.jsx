import React, { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { Calendar, Plus, Edit, Trash2, Clock } from "lucide-react";
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeBalham } from 'ag-grid-community';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Uses the AG Grid v33+ Theming API.
const scheduleTheme = themeBalham.withParams({
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

export default function LabSchedule() {
    const { labName } = useOutletContext();
    const [gridApi, setGridApi] = useState(null);

    // Dummy Data for testing
    const [rowData] = useState([
        { id: 1, subject: "CC101", desc: "Introduction to Computing", prof: "Prof. Smith", day: "Monday", time_start: "08:00 AM", time_end: "11:00 AM", section: "BSCS-1A" },
        { id: 2, subject: "IT305", desc: "Advanced Web Development", prof: "Prof. Johnson", day: "Tuesday", time_start: "01:00 PM", time_end: "04:00 PM", section: "BSIT-3A" },
        { id: 3, subject: "CS202", desc: "Data Structures", prof: "Prof. Davis", day: "Wednesday", time_start: "02:00 PM", time_end: "05:00 PM", section: "BSCS-2B" },
        { id: 4, subject: "IT401", desc: "Capstone Project 1", prof: "Prof. Wilson", day: "Thursday", time_start: "09:00 AM", time_end: "12:00 PM", section: "BSIT-4A" },
        { id: 5, subject: "CC102", desc: "Computer Programming 1", prof: "Prof. Smith", day: "Friday", time_start: "01:00 PM", time_end: "04:00 PM", section: "BSIT-1C" },
    ]);

    const columnDefs = useMemo(() => [
        { 
            headerName: "Course Info", 
            field: "subject", 
            flex: 2,
            cellRenderer: (params) => (
                <div className="flex flex-col justify-center h-full leading-tight">
                    <span className="font-bold text-slate-100">{params.data.subject}</span>
                    <span className="text-[10px] text-slate-500 font-mono uppercase truncate">{params.data.desc}</span>
                </div>
            )
        },
        { 
            headerName: "Section", 
            field: "section", 
            width: 120,
            cellRenderer: (params) => (
                <span className="px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {params.value}
                </span>
            )
        },
        { field: "prof", headerName: "Professor", flex: 1, cellClass: "text-slate-300 text-sm" },
        { 
            headerName: "Schedule", 
            children: [
                { field: "day", headerName: "Day", width: 120, cellClass: "font-medium text-slate-200" },
                { 
                    headerName: "Time", 
                    valueGetter: (params) => `${params.data.time_start} - ${params.data.time_end}`,
                    flex: 1,
                    cellRenderer: (params) => (
                        <div className="flex items-center gap-2 text-slate-400 font-mono text-xs h-full">
                            <Clock size={12} className="text-sky-500" />
                            {params.value}
                        </div>
                    )
                },
            ]
        },
        {
            headerName: "Actions",
            width: 120,
            sortable: false,
            filter: false,
            cellRenderer: () => (
                <div className="flex items-center gap-2 h-full">
                    <button className="p-1.5 rounded-md text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors">
                        <Edit size={16} />
                    </button>
                    <button className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors">
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ], []);

    return (
        <div className="p-8 space-y-6 bg-[#020617] min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">{labName} — Laboratory Schedule</h1>
                    <p className="text-slate-400 text-sm italic">Defines parameters for the Kiosk Anti-Cutting Protocol</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-2.5 px-6 rounded-lg uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all">
                    <Plus size={14} /> Add Schedule
                </button>
            </div>

            <div className="h-[550px] w-full rounded-xl overflow-hidden border border-[#1e293b] shadow-2xl mt-6">
                <AgGridReact
                    theme={scheduleTheme}
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