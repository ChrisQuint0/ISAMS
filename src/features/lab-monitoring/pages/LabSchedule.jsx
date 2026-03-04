import React, { useState, useMemo, useCallback } from "react";
import { Calendar, Plus, Edit, Trash2, Clock, Table, LayoutGrid, User, Loader2 } from "lucide-react";
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeBalham } from 'ag-grid-community';

import { useLabSchedule } from "../hooks/useLabSchedule";
import ScheduleModal from "../components/schedule/ScheduleModal"; 

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
    { bg: "bg-indigo-500/15", border: "border-indigo-500/30", text: "text-indigo-300", sub: "text-indigo-500", dot: "bg-indigo-400" },
    { bg: "bg-teal-500/15",   border: "border-teal-500/30",   text: "text-teal-300",   sub: "text-teal-500",   dot: "bg-teal-400"   },
    { bg: "bg-orange-500/15", border: "border-orange-500/30", text: "text-orange-300", sub: "text-orange-500", dot: "bg-orange-400" },
    { bg: "bg-fuchsia-500/15",border: "border-fuchsia-500/30",text: "text-fuchsia-300",sub: "text-fuchsia-500",dot: "bg-fuchsia-400"},
    { bg: "bg-lime-500/15",   border: "border-lime-500/30",   text: "text-lime-300",   sub: "text-lime-500",   dot: "bg-lime-400"   },
    { bg: "bg-pink-500/15",   border: "border-pink-500/30",   text: "text-pink-300",   sub: "text-pink-500",   dot: "bg-pink-400"   },
    { bg: "bg-blue-500/15",   border: "border-blue-500/30",   text: "text-blue-300",   sub: "text-blue-500",   dot: "bg-blue-400"   },
    { bg: "bg-yellow-500/15", border: "border-yellow-500/30", text: "text-yellow-300", sub: "text-yellow-500", dot: "bg-yellow-400" },
    { bg: "bg-red-500/15",    border: "border-red-500/30",    text: "text-red-300",    sub: "text-red-500",    dot: "bg-red-400"    },
    { bg: "bg-violet-500/15", border: "border-violet-500/30", text: "text-violet-300", sub: "text-violet-500", dot: "bg-violet-400" },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]; 

function parseHour(timeStr) {
    if (!timeStr) return 0;
    if (timeStr.includes("AM") || timeStr.includes("PM")) {
        const [time, meridiem] = timeStr.split(" ");
        let [h] = time.split(":").map(Number);
        if (meridiem === "PM" && h !== 12) h += 12;
        if (meridiem === "AM" && h === 12) h = 0;
        return h;
    } else {
        const [h] = timeStr.split(":").map(Number);
        return h;
    }
}

function formatHour(h) {
    if (h === 0 || h === 12) return `12 ${h < 12 ? "AM" : "PM"}`;
    return `${h > 12 ? h - 12 : h} ${h >= 12 ? "PM" : "AM"}`;
}

export default function LabSchedule() {
    const labName = sessionStorage.getItem('active_lab_name') || "Lab 1"; 

    // SMART TITLE FORMATTER
    const displayTitle = labName.replace(/^(Computer\s*)?Lab\s/i, 'Computer Laboratory ');

    const [gridApi, setGridApi] = useState(null);
    const [view, setView] = useState("timetable"); 

    const { rowData, loading, saveSchedule, deleteSchedule } = useLabSchedule(labName);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingData, setEditingData] = useState(null);

    const handleOpenAdd = () => {
        setEditingData(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = useCallback((entry) => {
        setEditingData(entry);
        setIsModalOpen(true);
    }, []);

    const handleSaveSubmit = async (formData, editingId) => {
        const payload = {
            room: labName,
            course_code: formData.subject,
            subject_name: formData.desc,
            professor: formData.prof,
            day: formData.day,
            time_start: formData.time_start,
            time_end: formData.time_end,
            section_block: formData.section
        };

        const { success } = await saveSchedule(payload, editingId);
        if (success) {
            setIsModalOpen(false);
        } else {
            alert("Failed to save schedule. Please check inputs and try again.");
        }
    };

    const handleDeleteClick = useCallback(async (id) => {
        if(window.confirm("Are you sure you want to delete this schedule?")) {
            await deleteSchedule(id);
        }
    }, [deleteSchedule]);

    const colorMap = useMemo(() => {
        const subjects = [...new Set(rowData.map(r => r.subject))];
        const map = {};
        subjects.forEach((s, i) => { map[s] = BLOCK_COLORS[i % BLOCK_COLORS.length]; });
        return map;
    }, [rowData]);

    const uniqueSubjects = useMemo(() => {
        return [...new Set(rowData.map(r => r.subject))];
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

    const columnDefs = useMemo(() => [
        { 
            headerName: "Course Info", 
            field: "subject", 
            flex: 2,
            cellRenderer: (params) => {
                const c = colorMap[params.data.subject] || BLOCK_COLORS[0];
                return (
                    <div className="flex items-center gap-3 h-full">
                        <div className={`w-2 h-2 rounded-full ${c.dot} shrink-0`} />
                        <div className="flex flex-col justify-center leading-tight">
                            <span className={`font-bold ${c.text}`}>{params.data.subject}</span>
                            <span className="text-[10px] text-slate-500 font-mono uppercase truncate">{params.data.desc}</span>
                        </div>
                    </div>
                );
            }
        },
        { 
            headerName: "Section", 
            field: "section", 
            width: 120,
            cellRenderer: (params) => {
                const c = colorMap[params.data.subject] || BLOCK_COLORS[0];
                return (
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${c.bg} ${c.text} border ${c.border}`}>
                        {params.value}
                    </span>
                );
            }
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
            cellRenderer: (params) => (
                <div className="flex items-center gap-2 h-full">
                    <button onClick={() => handleOpenEdit(params.data)} className="p-1.5 rounded-md text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors">
                        <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteClick(params.data.id)} className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors">
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ], [colorMap, handleOpenEdit, handleDeleteClick]);

    return (
        <div className="p-8 space-y-6 bg-[#020617] min-h-screen flex flex-col">

            {/* Header & Controls Row */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    {/* APPLIED THE UI FORMATTER HERE */}
                    <h1 className="text-2xl font-bold text-white tracking-tight">{displayTitle} — Schedule</h1>
                    <p className="text-slate-400 text-sm italic">Defines parameters for the Kiosk Anti-Cutting Protocol</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
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

                    <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 text-blue-400 hover:text-blue-300 text-[11px] font-bold py-2.5 px-6 rounded-lg uppercase tracking-widest transition-all group/btn relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 via-blue-400/0 to-blue-400/0 group-hover/btn:from-blue-400/5 group-hover/btn:via-blue-400/0 group-hover/btn:to-blue-400/0 transition-all duration-500 pointer-events-none" />
                        <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                        <Plus size={14} /> Add Schedule
                    </button>
                </div>
            </div>

            {/* Scrollable Legend Row */}
            {uniqueSubjects.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mt-2 custom-scrollbar">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2 shrink-0">Color Legend:</span>
                    {uniqueSubjects.map((subject, i) => {
                        const c = colorMap[subject] || BLOCK_COLORS[0];
                        return (
                            <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${c.bg} ${c.border} shrink-0`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${c.text}`}>{subject}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Content Area */}
            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4 min-h-[400px]">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Syncing Lab Schedules...</p>
                </div>
            ) : view === "timetable" ? (
                <div className="h-[calc(100vh-240px)] w-full bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden group relative hover:border-slate-600 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none z-10" />
                    
                    <div className="h-full overflow-auto custom-scrollbar">
                        <table className="w-full border-collapse relative z-20" style={{ minWidth: 900 }}>
                            <thead className="sticky top-0 z-30 shadow-sm">
                                <tr>
                                    <th className="w-20 bg-[#0f172a] border-b border-r border-[#1e293b] p-3 backdrop-blur-sm bg-opacity-95">
                                        <Clock size={14} className="text-slate-600 mx-auto" />
                                    </th>
                                    {DAYS.map(day => (
                                        <th key={day} className="bg-[#0f172a] border-b border-r border-[#1e293b] last:border-r-0 p-3 text-center backdrop-blur-sm bg-opacity-95">
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
                                                const c = colorMap[entry.subject] || BLOCK_COLORS[0];
                                                return (
                                                    <td 
                                                        key={cellKey} 
                                                        rowSpan={entry.span} 
                                                        className="border-r border-b border-[#1e293b] last:border-r-0 p-1 align-top"
                                                    >
                                                        <div className={`h-full rounded-xl ${c.bg} border ${c.border} p-3 cursor-pointer hover:scale-[1.02] transition-transform duration-200 group/block relative overflow-hidden flex flex-col justify-between`}>
                                                            <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover/block:from-white/5 group-hover/block:via-white/0 group-hover/block:to-white/0 transition-all duration-500 pointer-events-none" />
                                                            <div className="space-y-1.5 relative z-10">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <span className={`text-sm font-bold ${c.text} leading-tight`}>{entry.subject}</span>
                                                                    <span className={`text-[8px] font-black uppercase tracking-widest ${c.sub} shrink-0 bg-slate-950/30 px-1.5 py-0.5 rounded`}>{entry.section}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 pt-1">
                                                                    <User size={10} className="text-slate-500" />
                                                                    <span className="text-[10px] text-slate-400">{entry.prof}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <Clock size={10} className="text-slate-500" />
                                                                    <span className="text-[9px] font-mono text-slate-400">{entry.time_start} – {entry.time_end}</span>
                                                                </div>
                                                            </div>
                                                            <div className="relative z-10 mt-3 pt-2 border-t border-white/5 flex items-center justify-end gap-2 opacity-0 group-hover/block:opacity-100 transition-opacity">
                                                                <button onClick={() => handleOpenEdit(entry)} className="p-1 rounded-md text-slate-400 hover:text-sky-400 hover:bg-slate-950/50 transition-colors">
                                                                    <Edit size={13} />
                                                                </button>
                                                                <button onClick={() => handleDeleteClick(entry.id)} className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-950/50 transition-colors">
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            return (
                                                <td key={cellKey} className="border-r border-b border-[#1e293b] last:border-r-0 p-1 align-top h-20">
                                                    <div className="h-full w-full rounded-lg border border-transparent hover:border-slate-800 hover:bg-slate-800/30 transition-all cursor-pointer" />
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="h-[calc(100vh-240px)] w-full rounded-xl overflow-hidden border border-[#1e293b] shadow-2xl group relative hover:border-slate-600 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none z-10" />
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

            <ScheduleModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveSubmit}
                editingId={editingData?.id}
                initialData={editingData}
            />
        </div>
    );
}