import React, { useState, useMemo, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";


// AG-Grid Styles
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";


import { Plus, Search, UserCheck, Users, GraduationCap, ShieldCheck, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";


// FACULTY THEME: Standardized Slate palette and clean typography
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
  /* Style for the filter popup to match our slate theme */
  .ag-theme-quartz-dark .ag-filter-wrapper {
    background-color: #1e293b !important;
    border: 1px solid #334155 !important;
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


  // Your specific student list
  const rowData = useMemo(() => [
    { id: "23-00201", name: "Jamil C. Saludo", course: "BSCS", status: "Active" },
    { id: "23-00202", name: "Marc Angelo A. Soria", course: "BSIT", status: "Active" },
    { id: "23-00203", name: "Ella Mae C. Leonidas", course: "BSIT", status: "Active" },
    { id: "23-00204", name: "John Louis E. Baruelo", course: "BSCS", status: "Active" },
    { id: "23-00205", name: "Apple Ann Danielle S. Selosa", course: "BSIT", status: "Active" },
    { id: "23-00206", name: "Christopher O. Quinto", course: "BSCS", status: "Probation" },
    { id: "23-00207", name: "John Kurt O. Fajutagana", course: "BSIT", status: "Active" },
    { id: "23-00208", name: "Cristiana Mae P. Montipolca", course: "BSCS", status: "Active" },
    { id: "23-00209", name: "Ruth G. Domino", course: "BSIT", status: "Active" },
  ], []);


  const columnDefs = useMemo(() => [
    {
      headerName: "Student ID",
      field: "id",
      flex: 1,
      cellStyle: { fontWeight: '500', color: '#94a3b8' },
      filter: true // Enabled filtering for IDs
    },
    {
      headerName: "Full Name",
      field: "name",
      flex: 2,
      cellStyle: { fontWeight: '600', color: '#f8fafc' },
      filter: true // Enabled filtering for names
    },
    {
      headerName: "Course",
      field: "course",
      flex: 1,
      cellStyle: { color: '#94a3b8', fontWeight: '500' },
      filter: 'agSetColumnFilter', // Specialized filter for categories
    },
    {
      headerName: "Status",
      field: "status",
      flex: 1,
      filter: true,
      cellRenderer: (params) => {
        const isActive = params.value === 'Active';
        return (
          <div className="flex items-center h-full">
            <span className={`flex items-center text-[12px] font-bold ${
              isActive ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              <span className={`mr-2 h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {params.value}
            </span>
          </div>
        );
      }
    }
  ], []);


  const defaultColDef = useMemo(() => ({
    sortable: true,
    resizable: true,
    floatingFilter: false, // Set to true if you want filter inputs under the headers
  }), []);


  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Student database</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and monitor student enrollment records</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 rounded-md font-medium text-sm transition-all shadow-sm active:scale-95">
          <Plus className="w-4 h-4 mr-2" /> Add student
        </Button>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickStat title="Total students" value="1,240" icon={Users} color="text-blue-400" />
        <QuickStat title="Active enrollment" value="1,192" icon={UserCheck} color="text-emerald-400" />
        <QuickStat title="On probation" value="48" icon={ShieldCheck} color="text-rose-400" />
      </div>


      <Card className="bg-slate-900 border-slate-800 flex flex-col rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800/20">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-200">Enrollment registry</h3>
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
            {/* Filter Toggle Button for visual consistency */}
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


export default StudRecords;
