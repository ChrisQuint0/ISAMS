import React, { useState, useMemo, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";

// Standard CSS imports for Legacy mode
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import { Plus, Search, UserCheck, Users, GraduationCap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Enforced Dark Theme CSS
const GRID_STYLE_OVERRIDES = `
  .ag-theme-quartz-dark {
    --ag-background-color: #0f172a !important;
    --ag-header-background-color: #1e293b !important;
    --ag-border-color: #1e293b !important;
    --ag-header-foreground-color: #94a3b8 !important;
    --ag-foreground-color: #ffffff !important; 
    --ag-row-hover-color: #1e293b !important;
    --ag-odd-row-background-color: #0f172a !important;
  }
  .ag-theme-quartz-dark .ag-header-cell-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 800;
  }
  .ag-theme-quartz-dark .ag-cell {
    font-size: 13px;
    color: #f1f5f9 !important; 
    display: flex;
    align-items: center;
    border-bottom: 1px solid #1e293b44 !important;
  }
  /* Remove the white zebra bars from your screenshot */
  .ag-theme-quartz-dark .ag-row {
    background-color: #0f172a !important;
  }
`;

const StudRecords = () => {
  const [gridApi, setGridApi] = useState(null);

  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = GRID_STYLE_OVERRIDES;
    document.head.appendChild(styleEl);
    return () => document.head.removeChild(styleEl);
  }, []);

  // Hardcoded Data
  const rowData = useMemo(() => [
    { id: "2024-001", name: "ALEX JOHNSON", course: "BS COMPUTER SCIENCE", status: "ACTIVE" },
    { id: "2024-002", name: "MARIA GARCIA", course: "BS INFORMATION TECHNOLOGY", status: "ACTIVE" },
    { id: "2024-003", name: "LIAM SMITH", course: "BS DATA SCIENCE", status: "PROBATION" },
    { id: "2024-004", name: "SOPHIA CHEN", course: "BS SOFTWARE ENGINEERING", status: "ACTIVE" },
    { id: "2024-005", name: "JAMES WILSON", course: "BS COMPUTER SCIENCE", status: "PROBATION" },
    { id: "2024-006", name: "ISABELLA LOPEZ", course: "BS INFORMATION SYSTEMS", status: "ACTIVE" },
    { id: "2024-007", name: "ETHAN WRIGHT", course: "BS CYBER SECURITY", status: "ACTIVE" },
    { id: "2024-008", name: "CHLOE MILLER", course: "BS DATA SCIENCE", status: "ACTIVE" },
  ], []);

  const columnDefs = useMemo(() => [
    { headerName: "STUDENT ID", field: "id", flex: 1, cellStyle: { fontWeight: '800', color: '#94a3b8' } },
    { headerName: "FULL NAME", field: "name", flex: 1.5, cellStyle: { fontWeight: '700', color: '#f1f5f9' } },
    { headerName: "COURSE", field: "course", flex: 1.5, cellStyle: { color: '#64748b', fontWeight: '700' } },
    { 
      headerName: "STATUS", 
      field: "status",
      flex: 1,
      cellRenderer: (params) => (
        <div className="flex items-center h-full">
          <span className={`px-3 py-1 rounded-md text-[10px] font-black tracking-widest border ${
            params.value === 'ACTIVE' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            {params.value}
          </span>
        </div>
      )
    }
  ], []);

  return (
    <div className="flex flex-col h-full bg-slate-950 min-h-screen text-left">
      {/* HEADER: bg color #090E1A matched */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-slate-800 px-6 bg-slate-900/50 z-20">
        <SidebarTrigger className="text-slate-400 hover:text-slate-100 transition-colors p-2 hover:bg-slate-800 rounded-md scale-90" />
        <Separator orientation="vertical" className="mx-1 h-3 bg-slate-800" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] cursor-default">ISAMS</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-slate-800" />
            <BreadcrumbItem>
              <BreadcrumbLink className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] cursor-default">Student Violation Module</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-slate-800" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-slate-100 font-bold text-sm tracking-tight uppercase">Student Record</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex-1 px-6 lg:px-10 pt-10 pb-10 space-y-8 overflow-y-auto">
        {/* Title Section aligned to pt-10 */}
        <div className="flex justify-between items-end mb-6">
          <div className="flex flex-col">
            <h1 className="text-4xl font-black text-slate-100 tracking-tighter uppercase leading-none">STUDENT DATABASE</h1>
            <div className="flex items-center gap-3 mt-3">
              <div className="h-[2px] w-8 bg-slate-600" />
              <p className="text-slate-500 text-[11px] font-black tracking-[0.3em] uppercase">Academic Year 2025-2026</p>
            </div>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6 rounded-xl font-bold text-xs shadow-lg shadow-blue-900/20">
            <Plus className="w-4 h-4 mr-2" /> ADD NEW STUDENT
          </Button>
        </div>

        {/* Midnight Slate Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickStat title="Total Students" value="1,240" icon={Users} color="text-blue-400" />
          <QuickStat title="Active Enrollment" value="1,192" icon={UserCheck} color="text-emerald-400" />
          <QuickStat title="On Probation" value="48" icon={ShieldCheck} color="text-rose-400" />
        </div>

        {/* The Card Surface using #090E1A */}
        <Card className="bg-slate-900 border-slate-800 flex flex-col rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-slate-500" /> Enrollment Registry
            </h3>
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input 
                placeholder="Search..." 
                className="pl-10 bg-slate-950 border-slate-800 text-slate-100 text-sm h-10 rounded-xl"
                onChange={(e) => gridApi?.setQuickFilter(e.target.value)}
              />
            </div>
          </div>
          
          <div className="ag-theme-quartz-dark w-full" style={{ height: "450px" }}>
            <AgGridReact
              theme="legacy" // Fixes Error #239
              rowData={rowData}
              columnDefs={columnDefs}
              onGridReady={(params) => setGridApi(params.api)}
              animateRows={true}
              rowHeight={52}
              headerHeight={52}
              pagination={true}
              paginationPageSize={10}
              suppressCellFocus={true}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

function QuickStat({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between transition-all hover:scale-[1.01]">
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-slate-100 leading-none mt-1">{value}</p>
      </div>
      <div className={`p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 ${color}`}><Icon size={22} /></div>
    </div>
  );
}

export default StudRecords;