import React, { useState, useMemo, useCallback } from "react";
import { Plus, Edit, Trash2, Clock, Table, LayoutGrid, User, Loader2 } from "lucide-react";
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeBalham } from 'ag-grid-community';

import { Button } from "@/components/ui/button";
import { useLabSchedule } from "../hooks/useLabSchedule";
import ScheduleModal from "../components/schedule/ScheduleModal"; 

ModuleRegistry.registerModules([AllCommunityModule]);

const scheduleTheme = themeBalham.withParams({
    accentColor: '#008A45',
    backgroundColor: '#ffffff',
    foregroundColor: '#111827',
    borderColor: '#e5e7eb',
    headerBackgroundColor: '#f9fafb',
    headerTextColor: '#374151',
    oddRowBackgroundColor: '#ffffff',
    rowHeight: 48,
    headerHeight: 40,
});

const BLOCK_COLORS = [
    { bg: "bg-slate-200",     border: "border-slate-400",     text: "text-slate-900",    sub: "text-slate-700",     dot: "bg-slate-500", hex: "#008A45" },
    { bg: "bg-rose-200",      border: "border-rose-400",      text: "text-rose-900",     sub: "text-rose-700",      dot: "bg-rose-500", hex: "#ef4444" },
    { bg: "bg-blue-200",      border: "border-blue-400",      text: "text-blue-900",     sub: "text-blue-700",      dot: "bg-blue-500", hex: "#3b82f6" },
    { bg: "bg-amber-200",     border: "border-amber-400",     text: "text-amber-900",    sub: "text-amber-700",     dot: "bg-amber-500", hex: "#f59e0b" },
    { bg: "bg-purple-200",    border: "border-purple-400",    text: "text-purple-900",   sub: "text-purple-700",    dot: "bg-purple-500", hex: "#008A45" },
    { bg: "bg-teal-200",      border: "border-teal-400",      text: "text-teal-900",     sub: "text-teal-700",      dot: "bg-teal-500", hex: "#FFCE00" },
    { bg: "bg-indigo-200",    border: "border-indigo-400",    text: "text-indigo-900",   sub: "text-indigo-700",    dot: "bg-indigo-500", hex: "#006B35" },
    { bg: "bg-emerald-200",   border: "border-emerald-400",   text: "text-emerald-900",  sub: "text-emerald-700",   dot: "bg-emerald-500", hex: "#ef4444" },
    { bg: "bg-orange-200",    border: "border-orange-400",    text: "text-orange-900",   sub: "text-orange-700",    dot: "bg-orange-500", hex: "#FFCE00" },
    { bg: "bg-cyan-200",      border: "border-cyan-400",      text: "text-cyan-900",     sub: "text-cyan-700",      dot: "bg-cyan-500", hex: "#004D26" },
    { bg: "bg-stone-200",     border: "border-stone-400",     text: "text-stone-900",    sub: "text-stone-700",     dot: "bg-stone-500", hex: "#006B35" },
    { bg: "bg-zinc-200",      border: "border-zinc-400",      text: "text-zinc-900",     sub: "text-zinc-700",      dot: "bg-zinc-500", hex: "#004D26" },
    { bg: "bg-pink-200",      border: "border-pink-400",      text: "text-pink-900",     sub: "text-pink-700",      dot: "bg-pink-500", hex: "#f59e0b" },
    { bg: "bg-lime-200",      border: "border-lime-400",      text: "text-lime-900",     sub: "text-lime-700",      dot: "bg-lime-500", hex: "#006B35" },
    { bg: "bg-fuchsia-200",   border: "border-fuchsia-400",   text: "text-fuchsia-900",  sub: "text-fuchsia-700",   dot: "bg-fuchsia-500", hex: "#10b981" },
    { bg: "bg-gray-200",      border: "border-gray-400",      text: "text-gray-900",     sub: "text-gray-700",      dot: "bg-gray-500", hex: "#008A45" },
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
            headerName: "COURSE INFO", 
            field: "subject", 
            flex: 2,
            cellRenderer: (params) => {
                const c = colorMap[params.data.subject] || BLOCK_COLORS[0];
                return (
                    <div className="flex items-center gap-3 h-full">
                        <div className={`w-2 h-2 rounded-full ${c.dot} shrink-0`} />
                        <div className="flex flex-col justify-center leading-tight">
                            <span className={`font-bold text-sm ${c.text}`}>{params.data.subject}</span>
                            <span className="text-xs text-neutral-500 font-mono uppercase truncate">{params.data.desc}</span>
                        </div>
                    </div>
                );
            }
        },
        { 
            headerName: "SECTION", 
            field: "section", 
            width: 120,
            cellRenderer: (params) => {
                const c = colorMap[params.data.subject] || BLOCK_COLORS[0];
                return (
                    <span className={`px-2 py-1 rounded text-xs font-black uppercase tracking-widest ${c.bg} ${c.text} border ${c.border}`}>
                        {params.value}
                    </span>
                );
            }
        },
        { field: "prof", headerName: "PROFESSOR", flex: 1, cellClass: "text-neutral-700 text-base" },
        { 
            headerName: "SCHEDULE", 
            children: [
                { field: "day", headerName: "DAY", width: 120, cellClass: "font-medium text-neutral-900" },
                { 
                    headerName: "TIME", 
                    valueGetter: (params) => `${params.data.time_start} - ${params.data.time_end}`,
                    flex: 1,
                    cellRenderer: (params) => (
                        <div className="flex items-center gap-2 text-neutral-700 font-mono text-sm h-full">
                            <Clock size={12} className="text-emerald-600" />
                            {params.value}
                        </div>
                    )
                },
            ]
        },
        {
            headerName: "ACTIONS",
            width: 120,
            sortable: false,
            filter: false,
            cellRenderer: (params) => (
                <div className="flex items-center gap-2 h-full">
                    <Button 
                        variant="ghost" 
                        size="icon-xs"
                        onClick={() => handleOpenEdit(params.data)}
                        className="text-neutral-600 hover:text-emerald-600 hover:bg-emerald-50"
                    >
                        <Edit size={16} />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon-xs"
                        onClick={() => handleDeleteClick(params.data.id)}
                        className="text-neutral-600 hover:text-red-600 hover:bg-red-50"
                    >
                        <Trash2 size={16} />
                    </Button>
                </div>
            )
        }
    ], [colorMap, handleOpenEdit, handleDeleteClick]);

    return (
        <div className="p-6 space-y-6 bg-neutral-100 min-h-screen flex flex-col">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-[30px] font-bold text-neutral-900 tracking-tight">{displayTitle} — Schedule</h1>
                    <p className="text-neutral-500 text-sm italic">Defines parameters for the Kiosk Anti-Cutting Protocol</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center bg-neutral-100 border border-neutral-200 rounded-lg p-0.5 gap-0.5">
                        <Button
                            variant={view === "timetable" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setView("timetable")}
                            className={`text-sm text-[10px] font-semibold uppercase tracking-widest h-9 ${view === "timetable" ? "bg-primary-500 hover:bg-primary-600" : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"}`}
                        >
                            <LayoutGrid size={11} /> Timetable
                        </Button>
                        <Button
                            variant={view === "table" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setView("table")}
                            className={`text-sm text-[10px] font-semibold uppercase tracking-widest h-9 ${view === "table" ? "bg-primary-500 hover:bg-primary-600" : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"}`}
                        >
                            <Table size={11} /> Table
                        </Button>
                    </div>

                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleOpenAdd}
                        className="text-sm text-[11px] font-semibold uppercase tracking-widest h-9 bg-primary-500 text-white hover:bg-primary-600 transition-all"
                    >
                        <Plus size={13} /> Add Schedule
                    </Button>
                </div>
            </div>

            {/* Scrollable Legend Row */}
            {uniqueSubjects.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mt-2 custom-scrollbar">
                    <span className="text-[10px] font-black text-neutral-900 uppercase tracking-widest mr-2 shrink-0">Color Legend:</span>
                    {uniqueSubjects.map((subject, i) => {
                        const c = colorMap[subject] || BLOCK_COLORS[0];
                        return (
                            <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${c.bg} ${c.border} shrink-0 shadow-sm`}>
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
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                    <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">Syncing Lab Schedules...</p>
                </div>
            ) : view === "timetable" ? (
                <div className="h-full w-full bg-white border border-neutral-200 rounded-2xl shadow-lg overflow-hidden">
                    <div className="h-full overflow-auto custom-scrollbar">
                        <table className="w-full border-collapse relative z-20" style={{ minWidth: 900 }}>
                            <thead className="sticky top-0 z-30 shadow-sm">
                                <tr>
                                    <th className="w-20 bg-neutral-100 p-3 backdrop-blur-sm">
                                        <Clock size={14} className="text-neutral-500 mx-auto" />
                                    </th>
                                    {DAYS.map(day => (
                                        <th key={day} className="bg-neutral-100 p-3 text-center backdrop-blur-sm">
                                            <span className="text-[10px] font-black text-neutral-900 uppercase tracking-[0.2em]">{day.slice(0, 3)}</span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {HOURS.map(hour => (
                                    <tr key={hour} className="hover:bg-neutral-50 transition-colors">
                                        <td className="p-3 text-right align-top">
                                            <span className="text-[10px] font-mono text-neutral-500 whitespace-nowrap">{formatHour(hour)}</span>
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
                                                        className="p-1.5 align-top"
                                                    >
                                                        <div className={`h-full rounded-lg ${c.bg} border ${c.border} p-2 cursor-pointer hover:scale-[1.02] transition-transform duration-200 shadow-sm hover:shadow-md flex flex-col justify-between`}>
                                                            <div className="space-y-1">
                                                                <div className="flex items-start justify-between gap-1.5">
                                                                    <span className={`text-base font-bold ${c.text} leading-tight`}>{entry.subject}</span>
                                                                    <span className={`text-xs font-black uppercase tracking-widest ${c.sub} shrink-0 bg-neutral-100 px-2 py-1 rounded`}>{entry.section}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <User size={10} className="text-neutral-500" />
                                                                    <span className="text-[12px] font-bold text-neutral-700">{entry.prof}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Clock size={10} className="text-neutral-500" />
                                                                    <span className="text-[12px] font-mono text-neutral-700">{entry.time_start} – {entry.time_end}</span>
                                                                </div>
                                                            </div>
                                                            <div className="mt-1.5 pt-1.5 border-t border-neutral-200 flex items-center justify-end gap-1 opacity-0 hover:opacity-100 transition-opacity">
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon-xs"
                                                                    onClick={() => handleOpenEdit(entry)}
                                                                    className="text-neutral-600 hover:text-emerald-600 hover:bg-emerald-50"
                                                                >
                                                                    <Edit size={13} />
                                                                </Button>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon-xs"
                                                                    onClick={() => handleDeleteClick(entry.id)}
                                                                    className="text-neutral-600 hover:text-red-600 hover:bg-red-50"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            return (
                                                <td key={cellKey} className="p-1.5 align-top h-20">
                                                    <div className="h-full w-full rounded-lg border border-transparent hover:border-neutral-300 hover:bg-neutral-50 transition-all cursor-pointer" />
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
                <div className="h-[720px] w-full rounded-xl overflow-hidden border border-neutral-200 shadow-lg">
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