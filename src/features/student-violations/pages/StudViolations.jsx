import React, { useState, useMemo, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";

// Standard CSS imports for Legacy mode
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import { 
  ShieldAlert, Search, Filter, 
  AlertTriangle, CheckCircle2, History, AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Enforced Dark Theme CSS
const GRID_STYLE_OVERRIDES = `
  .ag-theme-quartz-dark {
    --ag-background-color: #090E1A !important;
    --ag-header-background-color: #161B26 !important;
    --ag-border-color: #1e293b !important;
    --ag-header-foreground-color: #94a3b8 !important;
    --ag-foreground-color: #ffffff !important; 
    --ag-row-hover-color: #1e293b !important;
    --ag-odd-row-background-color: #090E1A !important;
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
  /* Kills white bars */
  .ag-theme-quartz-dark .ag-row {
    background-color: #090E1A !important;
  }
`;

const StudViolations = () => {
  const [gridApi, setGridApi] = useState(null);

  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = GRID_STYLE_OVERRIDES;
    document.head.appendChild(styleEl);
    return () => document.head.removeChild(styleEl);
  }, []);

  // Hardcoded Violation Data
  const rowData = useMemo(() => [
    { name: "ALEX JOHNSON", section: "BSCS 3-A", violation: "UNIFORM POLICY", status: "ACTIVE" },
    { name: "MARIA GARCIA", section: "BSIT 2-B", violation: "LATE ENTRY", status: "CLEARED" },
    { name: "LIAM SMITH", section: "BSDS 4-A", violation: "ACADEMIC DISHONESTY", status: "ACTIVE" },
    { name: "SOPHIA CHEN", section: "BSSE 1-C", violation: "NO ID FOUND", status: "ACTIVE" },
    { name: "NOAH WILLIAMS", section: "BSIT 3-B", violation: "SMOKING ON CAMPUS", status: "CLEARED" },
    { name: "AVA MARTINEZ", section: "BSCS 2-D", violation: "UNIFORM POLICY", status: "ACTIVE" },
    { name: "MASON DAVIS", section: "BSDS 2-A", violation: "LATE ENTRY", status: "CLEARED" },
    { name: "EMMA BROWN", section: "BSIT 4-B", violation: "MISCONDUCT", status: "ACTIVE" },
  ], []);

  const columnDefs = useMemo(() => [
    { 
      headerName: "STUDENT NAME", 
      field: "name", 
      flex: 1.5,
      cellStyle: { color: '#f1f5f9', fontWeight: '700' }
    },
    { 
      headerName: "SECTION", 
      field: "section", 
      flex: 1,
      cellStyle: { color: '#64748b', fontWeight: '700', fontSize: '11px' }
    },
    { 
      headerName: "VIOLATION TYPE", 
      field: "violation",
      flex: 1.5,
      cellStyle: { color: '#94a3b8', fontWeight: '700', fontSize: '12px' }
    },
    { 
      headerName: "STATUS", 
      field: "status",
      flex: 1,
      cellRenderer: (params) => (
        <div className="flex items-center h-full">
          <span className={`px-3 py-1 rounded-md text-[10px] font-black tracking-widest border ${
            params.value === 'CLEARED' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            {params.value}
          </span>
        </div>
      )
    },
    {
      headerName: "ACTION",
      field: "action",
      width: 120,
      pinned: 'right',
      cellRenderer: () => (
        <div className="flex items-center justify-end h-full pr-2">
          <Button variant="outline" className="h-7 px-4 bg-slate-800 border-slate-700 text-slate-300 hover:text-white rounded-md text-[10px] font-black">
            MANAGE
          </Button>
        </div>
      )
    }
  ], []);

  return (
    <div className="flex flex-col h-full bg-[#020617] min-h-screen text-left">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-slate-800/60 px-6 bg-[#090E1A] z-20">
        <SidebarTrigger className="text-slate-400 scale-90" />
        <Separator orientation="vertical" className="mx-1 h-3 bg-slate-800" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em]">ISAMS</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator className="text-slate-800" />
            <BreadcrumbItem><BreadcrumbPage className="text-white font-bold text-sm tracking-tight uppercase">Violation Registry</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex-1 px-6 lg:px-10 pt-10 pb-10 space-y-8 overflow-y-auto no-scrollbar relative">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-6">
          <div className="flex flex-col">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">VIOLATIONS</h1>
            <div className="flex items-center gap-3 mt-3">
              <div className="h-[2px] w-8 bg-slate-600" />
              <p className="text-slate-500 text-[11px] font-black tracking-[0.3em] uppercase">Student Compliance Monitor</p>
            </div>
          </div>
          <Button className="bg-rose-600 hover:bg-rose-700 text-white h-10 px-6 rounded-xl font-bold text-xs shadow-lg shadow-rose-900/20">
            <AlertCircle className="w-4 h-4 mr-2" /> REPORT VIOLATION
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <QuickStat label="Total Violations" value="56" icon={ShieldAlert} color="text-slate-400" />
          <QuickStat label="Active Offenses" value="12" icon={AlertTriangle} color="text-rose-500" />
          <QuickStat label="Cleared Records" value="44" icon={CheckCircle2} color="text-emerald-500" />
        </div>

        <Card className="bg-[#090E1A] border-slate-800 flex flex-col rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest flex items-center gap-3">
              <History className="h-4 w-4 text-slate-500" /> Disciplinary Logs
            </h3>
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input 
                placeholder="Search logs..."
                className="pl-9 bg-[#020617] border-slate-800 text-white text-sm h-10 rounded-xl"
                onChange={(e) => gridApi?.setQuickFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="ag-theme-quartz-dark w-full" style={{ height: "450px" }}>
            <AgGridReact
              theme="legacy" // Enforces CSS overrides
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

function QuickStat({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-[#090E1A] border border-slate-800 p-5 rounded-2xl flex items-center justify-between transition-all hover:scale-[1.01] text-left">
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-white leading-none mt-1.5">{value}</p>
      </div>
      <div className={`p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 ${color}`}><Icon size={22} /></div>
    </div>
  );
}

export default StudViolations;