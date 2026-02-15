import React, { useState, useMemo, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";


// AG-Grid Styles
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";


import {
  ShieldAlert, Search, AlertTriangle,
  CheckCircle2, History, AlertCircle, Filter
} from "lucide-react";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";


// FACULTY THEME: Consistent Slate palette and filter popup styling
const GRID_STYLE_OVERRIDES = `
  .ag-theme-quartz-dark {
    --ag-background-color: #0f172a !important;
    --ag-header-background-color: #1e293b !important;
    --ag-border-color: #1e293b !important;
    --ag-header-foreground-color: #94a3b8 !important;
    --ag-foreground-color: #ffffff !important;
    --ag-row-hover-color: rgba(30, 41, 59, 0.5) !important;
  }
  .ag-theme-quartz-dark .ag-header-cell-label {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
  }
  .ag-theme-quartz-dark .ag-cell {
    font-size: 14px;
    color: #e2e8f0 !important;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #1e293b44 !important;
  }
  .ag-theme-quartz-dark .ag-row {
    background-color: #0f172a !important;
  }
  .ag-theme-quartz-dark .ag-filter-wrapper {
    background-color: #1e293b !important;
    border: 1px solid #334155 !important;
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


  const rowData = useMemo(() => [
    { name: "Jamil C. Saludo", section: "BSCS 3-A", violation: "Uniform Policy", status: "Active" },
    { name: "Marc Angelo A. Soria", section: "BSIT 2-B", violation: "Late Entry", status: "Cleared" },
    { name: "Ella Mae C. Leonidas", section: "BSIT 2-B", violation: "Academic Dishonesty", status: "Active" },
    { name: "John Louis E. Baruelo", section: "BSCS 3-A", violation: "No ID Found", status: "Active" },
    { name: "Apple Ann Danielle S. Selosa", section: "BSIT 2-B", violation: "Uniform Policy", status: "Active" },
    { name: "Christopher O. Quinto", section: "BSCS 3-A", violation: "Smoking on Campus", status: "Cleared" },
    { name: "John Kurt O. Fajutagana", section: "BSIT 2-B", violation: "Misconduct", status: "Active" },
    { name: "Cristiana Mae P. Montipolca", section: "BSCS 3-A", violation: "Uniform Policy", status: "Active" },
    { name: "Ruth G. Domino", section: "BSIT 2-B", violation: "Late Entry", status: "Cleared" },
  ], []);


  const columnDefs = useMemo(() => [
    {
      headerName: "Student Name",
      field: "name",
      flex: 1.5,
      filter: true, // Enabled filtering for names
      cellStyle: { color: '#f8fafc', fontWeight: '600' }
    },
    {
      headerName: "Section",
      field: "section",
      flex: 1,
      filter: true, // Enabled filtering for sections
      cellStyle: { color: '#94a3b8', fontWeight: '500' }
    },
    {
      headerName: "Violation Type",
      field: "violation",
      flex: 1.5,
      filter: true, // Enabled filtering for violation types
      cellStyle: { color: '#94a3b8', fontWeight: '500' }
    },
    {
      headerName: "Status",
      field: "status",
      flex: 1,
      filter: true, // Enabled filtering for status
      cellRenderer: (params) => {
        const isCleared = params.value === 'Cleared';
        return (
          <div className="flex items-center h-full">
            <span className={`flex items-center text-[12px] font-bold ${isCleared ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span className={`mr-2 h-1.5 w-1.5 rounded-full ${isCleared ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'}`} />
              {params.value}
            </span>
          </div>
        );
      }
    },
    {
      headerName: "Action",
      field: "action",
      width: 120,
      pinned: 'right',
      cellRenderer: () => (
        <div className="flex items-center justify-end h-full pr-2">
          <Button
            variant="outline"
            className="h-7 px-4 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-100 rounded-md text-[11px] font-semibold transition-all duration-200"
          >
            Manage
          </Button>
        </div>
      )
    }
  ], []);


  const defaultColDef = useMemo(() => ({
    sortable: true,
    resizable: true,
  }), []);


  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Violations</h1>
          <p className="text-slate-400">Student compliance monitor and disciplinary records</p>
        </div>
        <Button className="bg-rose-600 hover:bg-rose-700 text-white h-9 px-4 rounded-md font-medium text-sm transition-all shadow-sm active:scale-95">
          <AlertCircle className="w-4 h-4 mr-2" /> Report violation
        </Button>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickStat title="Total violations" value="56" icon={ShieldAlert} color="text-slate-400" />
        <QuickStat title="Active offenses" value="12" icon={AlertTriangle} color="text-rose-500" />
        <QuickStat title="Cleared records" value="44" icon={CheckCircle2} color="text-emerald-500" />
      </div>


      <Card className="bg-slate-900 border-slate-800 flex flex-col rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800/20">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-200">Disciplinary logs</h3>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Quick search..."
                className="pl-9 bg-slate-950 border-slate-800 text-slate-200 text-sm h-9 rounded-md focus:ring-1 focus:ring-blue-600"
                onChange={(e) => gridApi?.setQuickFilter(e.target.value)}
              />
            </div>
            <Button variant="outline" className="h-9 px-3 bg-slate-800 border-slate-700 text-slate-400 hover:text-white">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
       
        <div className="ag-theme-quartz-dark w-full" style={{ height: "500px" }}>
          <AgGridReact
            theme="legacy"
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={(params) => setGridApi(params.api)}
            animateRows={true}
            rowHeight={48}
            headerHeight={44}
            pagination={true}
            paginationPageSize={10}
            suppressCellFocus={true}
          />
        </div>
      </Card>
    </div>
  );
};


function QuickStat({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center gap-4 transition-colors hover:border-slate-700">
      <div className={`p-2 rounded-md bg-slate-800/50 border border-slate-700 ${color}`}><Icon size={20} /></div>
      <div>
        <p className="text-xs font-medium text-slate-500 leading-none">{title}</p>
        <p className="text-lg font-bold text-white mt-1 leading-none">{value}</p>
      </div>
    </div>
  );
}


export default StudViolations;
