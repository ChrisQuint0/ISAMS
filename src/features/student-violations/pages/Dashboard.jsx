import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

import {
  Users, ShieldAlert, FileText, BarChart3,
  History, PieChart, Clock, AlertTriangle,
  CalendarCheck, RefreshCw, Search
} from "lucide-react";


import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    font-size: 14px;
    font-weight: 600;
    color: #64748b;
  }
  .ag-theme-quartz-dark .ag-cell {
    font-size: 15px;
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
  .ag-theme-quartz-dark .ag-root-wrapper {
    border: none !important;
  }
`;


export default function StudViolationDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [gridApi, setGridApi] = useState(null);

  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = GRID_STYLE_OVERRIDES;
    document.head.appendChild(styleEl);
    return () => document.head.removeChild(styleEl);
  }, []);

  const rowData = [
    { id: 1, type: "New violation", detail: "Uniform policy breach: Jamil C. Saludo (23-00201).", time: "just now" },
    { id: 2, type: "Case cleared", detail: "Late entry violation for Marc Angelo A. Soria resolved.", time: "12 min ago" },
    { id: 3, type: "Record update", detail: "Ella Mae C. Leonidas moved to Active status.", time: "45 min ago" },
    { id: 4, type: "New violation", detail: "ID missing: John Doe (23-12345).", time: "1 hour ago" },
    { id: 5, type: "Sanction", detail: "Community service assigned to Jane Smith.", time: "2 hours ago" },
  ];

  const columnDefs = useMemo(() => [
    {
      headerName: "Activity Type",
      field: "type",
      flex: 1,
      cellRenderer: (params) => {
        let color = "text-slate-400";
        if (params.value.includes("New")) color = "text-rose-400";
        if (params.value.includes("cleared")) color = "text-emerald-400";
        if (params.value.includes("update")) color = "text-blue-400";
        if (params.value.includes("Sanction")) color = "text-amber-400";
        return <span className={`font-semibold ${color}`}>{params.value}</span>;
      }
    },
    {
      headerName: "Details",
      field: "detail",
      flex: 2,
      tooltipField: "detail",
      cellStyle: { color: '#e2e8f0' }
    },
    {
      headerName: "Time",
      field: "time",
      flex: 0.8,
      cellStyle: { color: '#94a3b8', fontStyle: 'italic' }
    }
  ], []);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    resizable: true,
  }), []);


  const navActions = [
    { icon: <Users size={20} />, label: "Records", onClick: () => navigate('/students'), color: "text-emerald-400" },
    { icon: <ShieldAlert size={20} />, label: "Manage", onClick: () => navigate('/violations'), color: "text-rose-400" },
    { icon: <FileText size={20} />, label: "Reports", onClick: () => navigate('/generate-report'), color: "text-amber-400" },
    { icon: <BarChart3 size={20} />, label: "Analytics", onClick: () => navigate('/analytics'), color: "text-blue-400" },
  ];


  return (
    <div className="space-y-4 animate-in fade-in duration-500 text-left">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-400 text-sm">
            System overview • Semester 2, AY 2025-2026
          </p>
        </div>
        <Button
          variant="outline"
          className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white h-8 px-3 rounded-md font-medium text-xs transition-all active:scale-95 shadow-sm"
          onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 800); }}
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickStat title="Compliance" value="94%" icon={PieChart} color="text-emerald-400" />
        <QuickStat title="Active cases" value="12" icon={Clock} color="text-amber-400" />
        <QuickStat title="Critical" value="03" icon={AlertTriangle} color="text-rose-400" />
        <QuickStat title="Resolved" value="88%" icon={CalendarCheck} color="text-blue-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* RECENT ACTIVITY LOG - COMPACTED HEADER */}
        <Card className="lg:col-span-3 bg-slate-900 border-slate-800 flex flex-col rounded-lg overflow-hidden shadow-sm">
          {/* Header container with h-9 and py-0 removes the top/bottom space */}
          <div className="px-3 py-0 flex items-center justify-between bg-slate-900/50">
            <h3 className="text-sm font-bold text-slate-200">Recent activity log</h3>
            <div className="flex items-center">
              <div className="relative w-36 md:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                <Input
                  placeholder="Filter logs..."
                  className="pl-8 bg-slate-950 border-slate-800 text-slate-200 text-xs h-6 rounded focus:ring-1 focus:ring-blue-600"
                  onChange={(e) => gridApi?.setQuickFilter(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="ag-theme-quartz-dark w-full" style={{ height: "400px" }}>
            <AgGridReact
              theme={themeQuartz}
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              onGridReady={(params) => setGridApi(params.api)}
              tooltipShowDelay={0}
              animateRows={true}
              rowHeight={42}
              headerHeight={24}
              pagination={true}
              paginationPageSize={10}
              suppressCellFocus={true}
            />
          </div>
        </Card>

        {/* QUICK ACTIONS SIDEBAR */}
        <Card className="lg:col-span-1 bg-slate-900 border-slate-800 p-3 flex flex-col gap-3 h-full">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1">Quick Actions</h3>
          <div className="flex flex-col gap-2">
            {navActions.map((action, i) => (
              <button
                key={i}
                onClick={action.onClick}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-800 bg-slate-950/30 hover:bg-slate-800 hover:border-slate-700 transition-all group text-left"
              >
                <div className={`p-1.5 rounded-md bg-slate-900 border border-slate-800 ${action.color} group-hover:text-white transition-colors`}>
                  {action.icon}
                </div>
                <span className="text-sm font-semibold text-slate-300 group-hover:text-white">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
          
          <div className="mt-auto pt-4 border-t border-slate-800">
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-bold text-slate-400 uppercase">System Status</span>
              </div>
              <p className="text-sm text-slate-500">All systems operational.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function QuickStat({ title, value, icon: Icon, color }) {
  const getGradient = (c) => {
    if (c.includes("blue")) return "from-blue-600/50 via-blue-500/50 to-blue-600/50";
    if (c.includes("emerald")) return "from-emerald-600/50 via-emerald-500/50 to-emerald-600/50";
    if (c.includes("indigo")) return "from-indigo-600/50 via-indigo-500/50 to-indigo-600/50";
    if (c.includes("amber")) return "from-amber-600/50 via-amber-500/50 to-amber-600/50";
    if (c.includes("orange")) return "from-orange-600/50 via-orange-500/50 to-orange-600/50";
    if (c.includes("rose")) return "from-rose-600/50 via-rose-500/50 to-rose-600/50";
    return "from-slate-600/50 via-slate-500/50 to-slate-600/50";
  };

  return (
    <div className="group relative overflow-hidden bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center gap-4 transition-all duration-300 hover:border-slate-700 hover:shadow-lg hover:shadow-slate-900/20">
      <div className="absolute inset-0 bg-linear-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
      <div className={`relative p-2 rounded-md bg-slate-800/50 border border-slate-700 ${color}`}><Icon size={20} /></div>
      <div className="relative">
        <p className="text-sm font-medium text-slate-500 leading-none">{title}</p>
        <p className="text-2xl font-bold text-white mt-1 leading-none">{value}</p>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r ${getGradient(color)} scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />
    </div>
  );
}