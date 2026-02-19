import React, { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { Calendar, Plus, Edit, Trash2, Clock, Table, LayoutGrid, GraduationCap, User } from "lucide-react";
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeBalham } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

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

const BLOCK_COLORS = [
    { bg: "bg-sky-500/15",    border: "border-sky-500/30",    text: "text-sky-300",    sub: "text-sky-500",    dot: "bg-sky-400"    },
    { bg: "bg-purple-500/15", border: "border-purple-500/30", text: "text-purple-300", sub: "text-purple-500", dot: "bg-purple-400" },
    { bg: "bg-emerald-500/15",border: "border-emerald-500/30",text: "text-emerald-300",sub: "text-emerald-500",dot: "bg-emerald-400"},
    { bg: "bg-amber-500/15",  border: "border-amber-500/30",  text: "text-amber-300",  sub: "text-amber-500",  dot: "bg-amber-400"  },
    { bg: "bg-rose-500/15",   border: "border-rose-500/30",   text: "text-rose-300",   sub: "text-rose-500",   dot: "bg-rose-400"   },
    { bg: "bg-cyan-500/15",   border: "border-cyan-500/30",   text: "text-cyan-300",   sub: "text-cyan-500",   dot: "bg-cyan-400"   },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]; 

function parseHour(timeStr) {
    const [time, meridiem] = timeStr.split(" ");
    let [h] = time.split(":").map(Number);
    if (meridiem === "PM" && h !== 12) h += 12;
    if (meridiem === "AM" && h === 12) h = 0;
    return h;
}

function formatHour(h) {
    if (h === 0 || h === 12) return `12 ${h < 12 ? "AM" : "PM"}`;
    return `${h > 12 ? h - 12 : h} ${h >= 12 ? "PM" : "AM"}`;
}

export default function LabSchedule() {
    const { labName } = useOutletContext();
    const [gridApi, setGridApi] = useState(null);
    const [view, setView] = useState("timetable"); 

    const [rowData] = useState([
        { id: 1,  subject: "CC101",  desc: "Introduction to Computing",   prof: "Prof. Dela Cruz", day: "Monday",    time_start: "08:00 AM", time_end: "11:00 AM", section: "BSCS-1A" },
        { id: 2,  subject: "IT305",  desc: "Advanced Web Development",    prof: "Prof. Reyes",     day: "Tuesday",   time_start: "01:00 PM", time_end: "04:00 PM", section: "BSIT-3A" },
        { id: 3,  subject: "CS202",  desc: "Data Structures",             prof: "Prof. Santos",    day: "Wednesday", time_start: "02:00 PM", time_end: "05:00 PM", section: "BSCS-2B" },
        { id: 4,  subject: "IT401",  desc: "Capstone Project 1",          prof: "Prof. Garcia",    day: "Thursday",  time_start: "09:00 AM", time_end: "12:00 PM", section: "BSIT-4A" },
        { id: 5,  subject: "CC102",  desc: "Computer Programming 1",      prof: "Prof. Dela Cruz", day: "Friday",    time_start: "01:00 PM", time_end: "04:00 PM", section: "BSIT-1C" },
        { id: 6,  subject: "CC101",  desc: "Introduction to Computing",   prof: "Prof. Dela Cruz", day: "Wednesday", time_start: "08:00 AM", time_end: "11:00 AM", section: "BSCS-1A" },
        { id: 7,  subject: "IT305",  desc: "Advanced Web Development",    prof: "Prof. Reyes",     day: "Thursday",  time_start: "01:00 PM", time_end: "04:00 PM", section: "BSIT-3A" },
        { id: 8,  subject: "CS202",  desc: "Data Structures",             prof: "Prof. Santos",    day: "Friday",    time_start: "08:00 AM", time_end: "11:00 AM", section: "BSCS-2B" },
        { id: 9,  subject: "CC102",  desc: "Computer Programming 1",      prof: "Prof. Dela Cruz", day: "Monday",    time_start: "01:00 PM", time_end: "04:00 PM", section: "BSIT-1C" },
        { id: 10, subject: "IT401",  desc: "Capstone Project 1",          prof: "Prof. Garcia",    day: "Saturday",  time_start: "08:00 AM", time_end: "11:00 AM", section: "BSIT-4A" },
        { id: 11, subject: "IT102",  desc: "Platform Technologies",       prof: "Prof. Villanueva",day: "Tuesday",   time_start: "08:00 AM", time_end: "11:00 AM", section: "BSIT-1C" },
        { id: 12, subject: "IT102",  desc: "Platform Technologies",       prof: "Prof. Villanueva",day: "Saturday",  time_start: "01:00 PM", time_end: "04:00 PM", section: "BSIT-1C" },
    ]);

    const colorMap = useMemo(() => {
        const subjects = [...new Set(rowData.map(r => r.subject))];
        const map = {};
        subjects.forEach((s, i) => { map[s] = BLOCK_COLORS[i % BLOCK_COLORS.length]; });
        return map;
    }, [rowData]);

    const timetableMap = useMemo(() => {
        const map = {};
        rowData.forEach(entry => {
            const startH = parseHour(entry.time_start);
            const endH = parseHour(entry.time_end);
            const key = `${entry.day}-${startH}`;
            if (!map[key]) map[key] = [];
            map[key].push({ ...entry, startH, endH, span: endH - startH });
        });
        return map;
    }, [rowData]);

    const occupiedCells = useMemo(() => {
        const set = new Set();
        Object.values(timetableMap).forEach(entries => {
            entries.forEach(entry => {
                for (let h = entry.startH; h < entry.endH; h++) {
                    if (h !== entry.startH) set.add(`${entry.day}-${h}`);
                }
            });
        });
        return set;
    }, [timetableMap]);

    const recurringPatterns = useMemo(() => {
        const groups = {};
        rowData.forEach(r => {
            const key = `${r.subject}-${r.section}`;
            if (!groups[key]) groups[key] = { ...r, days: [] };
            groups[key].days.push(r.day);
        });
        return Object.values(groups);
    }, [rowData]);

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
        <div className="p-8 space-y-5 bg-[#020617] min-h-screen">

            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">{labName} — Laboratory Schedule</h1>
                <p className="text-slate-400 text-sm italic">Defines parameters for the Kiosk Anti-Cutting Protocol</p>
            </div>

            <div className="flex items-start justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                    {recurringPatterns.map((p, i) => {
                        const c = colorMap[p.subject];
                        return (
                            <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${c.bg} ${c.border} transition-colors`}>
                                <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${c.text}`}>{p.subject}</span>
                                <span className="text-[9px] text-slate-600">·</span>
                                <span className="text-[9px] text-slate-500 font-mono">{p.days.map(d => d.slice(0, 3)).join(", ")}</span>
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-[#0f172a] border border-[#1e293b] rounded-lg p-0.5">
                        <button
                            onClick={() => setView("timetable")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
                                view === "timetable"
                                    ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                                    : "text-slate-500 hover:text-slate-300 border border-transparent"
                            }`}
                        >
                            <LayoutGrid size={12} /> Timetable
                        </button>
                        <button
                            onClick={() => setView("table")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
                                view === "table"
                                    ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                                    : "text-slate-500 hover:text-slate-300 border border-transparent"
                            }`}
                        >
                            <Table size={12} /> Table
                        </button>
                    </div>

                    <button className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 text-blue-400 hover:text-blue-300 text-[11px] font-bold py-2.5 px-6 rounded-lg uppercase tracking-widest transition-all group/btn relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 via-blue-400/0 to-blue-400/0 group-hover/btn:from-blue-400/5 group-hover/btn:via-blue-400/0 group-hover/btn:to-blue-400/0 transition-all duration-500 pointer-events-none" />
                        <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                        <Plus size={14} /> Add Schedule
                    </button>
                </div>
            </div>

            {view === "timetable" && (
                <div className="space-y-5">
                    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden group relative hover:border-slate-600 transition-colors">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none z-10" />
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none z-10" />

                        <div className="overflow-auto max-h-[calc(100vh-260px)]">
                            <table className="w-full border-collapse relative z-20" style={{ minWidth: 900 }}>
                                <thead className="sticky top-0 z-30">
                                    <tr>
                                        <th className="w-20 bg-[#0f172a] border-b border-r border-[#1e293b] p-3">
                                            <Clock size={14} className="text-slate-600 mx-auto" />
                                        </th>
                                        {DAYS.map(day => (
                                            <th key={day} className="bg-[#0f172a] border-b border-r border-[#1e293b] last:border-r-0 p-3 text-center">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{day.slice(0, 3)}</span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {HOURS.map(hour => (
                                        <tr key={hour} className="hover:bg-slate-800/20 transition-colors">
                                            <td className="border-r border-b border-[#1e293b] p-2 text-right align-top">
                                                <span className="text-[10px] font-mono text-slate-600 whitespace-nowrap">{formatHour(hour)}</span>
                                            </td>

                                            {DAYS.map(day => {
                                                const cellKey = `${day}-${hour}`;

                                                if (occupiedCells.has(cellKey)) return null;

                                                const entries = timetableMap[cellKey];
                                                if (entries && entries.length > 0) {
                                                    const entry = entries[0];
                                                    const c = colorMap[entry.subject];
                                                    return (
                                                        <td 
                                                            key={cellKey} 
                                                            rowSpan={entry.span} 
                                                            className="border-r border-b border-[#1e293b] last:border-r-0 p-1 align-top"
                                                        >
                                                            <div className={`h-full rounded-xl ${c.bg} border ${c.border} p-3 cursor-pointer hover:scale-[1.02] transition-transform duration-200 group/block relative overflow-hidden`}>
                                                                <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover/block:from-white/5 group-hover/block:via-white/0 group-hover/block:to-white/0 transition-all duration-500 pointer-events-none" />
                                                                <div className="space-y-1.5 relative z-10">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className={`text-sm font-bold ${c.text}`}>{entry.subject}</span>
                                                                        <div className="flex flex-col items-end gap-1">
                                                                            <span className={`text-[8px] font-black uppercase tracking-widest ${c.sub}`}>{entry.section}</span>
                                                                            <div className="flex items-center gap-2">
                                                                                <button className="p-1 rounded-md text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors">
                                                                                    <Edit size={14} />
                                                                                </button>
                                                                                <button className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors">
                                                                                    <Trash2 size={14} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-[10px] text-slate-400 leading-relaxed truncate">{entry.desc}</p>
                                                                    <div className="flex items-center gap-1.5 pt-1">
                                                                        <User size={10} className="text-slate-600" />
                                                                        <span className="text-[10px] text-slate-500">{entry.prof}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Clock size={10} className="text-slate-600" />
                                                                        <span className="text-[9px] font-mono text-slate-600">{entry.time_start} – {entry.time_end}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    );
                                                }

                                                return (
                                                    <td key={cellKey} className="border-r border-b border-[#1e293b] last:border-r-0 p-1 align-top h-16">
                                                        <div className="h-full w-full rounded-lg border border-transparent hover:border-slate-700 hover:bg-slate-800/20 transition-all cursor-pointer" />
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {view === "table" && (
                <div className="h-[calc(100vh-220px)] w-full rounded-xl overflow-hidden border border-[#1e293b] shadow-2xl group relative hover:border-slate-600 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none z-10" />
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none z-10" />
                    <AgGridReact
                        theme={scheduleTheme}
                        rowData={rowData}
                        columnDefs={columnDefs}
                        onGridReady={(params) => setGridApi(params.api)}
                        pagination={true}
                        paginationPageSize={15}
                        defaultColDef={{
                            sortable: true,
                            filter: true,
                            resizable: true
                        }}
                    />
                </div>
            )}

        </div>
    );
}