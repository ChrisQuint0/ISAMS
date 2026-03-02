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


import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Custom theme using AG Grid v33+ Theming API with Quartz theme for a clean institutional look
const customTheme = themeQuartz.withParams({
  accentColor: 'var(--primary-600)',
  backgroundColor: 'var(--neutral-50)',
  foregroundColor: 'var(--neutral-900)',
  borderColor: 'var(--neutral-200)',
  headerBackgroundColor: 'var(--neutral-100)',
  headerTextColor: 'var(--neutral-900)',
  oddRowBackgroundColor: '#ffffff',
  rowHoverColor: 'var(--neutral-100)',
  selectedRowBackgroundColor: 'color-mix(in srgb, var(--primary-500) 10%, transparent)',
  rowHeight: 48,
  headerHeight: 40,
  headerFontWeight: '700',
  fontSize: '13px',
});

export default function StudViolationDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [gridApi, setGridApi] = useState(null);

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
        let color = "text-neutral-500";
        if (params.value.includes("New")) color = "text-destructive-semantic";
        if (params.value.includes("cleared")) color = "text-success";
        if (params.value.includes("update")) color = "text-info";
        if (params.value.includes("Sanction")) color = "text-warning";
        return <span className={`font-semibold ${color}`}>{params.value}</span>;
      }
    },
    {
      headerName: "Details",
      field: "detail",
      flex: 2,
      tooltipField: "detail",
      cellStyle: { color: 'var(--neutral-900)', fontWeight: '500' }
    },
    {
      headerName: "Time",
      field: "time",
      flex: 0.8,
      cellStyle: { color: 'var(--neutral-500)', fontStyle: 'italic' }
    }
  ], []);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    resizable: true,
  }), []);


  const navActions = [
    { icon: <Users size={20} />, label: "Records", onClick: () => navigate('/students'), color: "text-success" },
    { icon: <ShieldAlert size={20} />, label: "Manage", onClick: () => navigate('/violations'), color: "text-destructive-semantic" },
    { icon: <FileText size={20} />, label: "Reports", onClick: () => navigate('/generate-report'), color: "text-warning" },
    { icon: <BarChart3 size={20} />, label: "Analytics", onClick: () => navigate('/analytics'), color: "text-info" },
  ];


  return (
    <div className="space-y-6 flex flex-col h-full bg-neutral-50 animate-in fade-in duration-500 text-left">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Dashboard</h1>
          <p className="text-neutral-500 text-sm font-medium">
            System overview • Semester 2, AY 2025-2026
          </p>
        </div>
        <Button
          variant="outline"
          className="bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-primary-600 shadow-sm transition-all active:scale-95 h-10 px-4 font-medium text-xs"
          onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 800); }}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickStat title="Compliance" value="94%" icon={PieChart} color="text-primary-600" />
        <QuickStat title="Active cases" value="12" icon={Clock} color="text-warning" />
        <QuickStat title="Critical" value="03" icon={AlertTriangle} color="text-destructive-semantic" />
        <QuickStat title="Resolved" value="88%" icon={CalendarCheck} color="text-success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* RECENT ACTIVITY LOG - COMPACTED HEADER */}
        <Card className="lg:col-span-3 bg-white border-neutral-200 flex flex-col rounded-lg overflow-hidden shadow-sm">
          {/* Header container with h-9 and py-0 removes the top/bottom space */}
          <div className="px-4 py-4 flex items-center justify-between border-b border-neutral-100 bg-neutral-50/50">
            <h3 className="text-base font-bold text-neutral-900 uppercase tracking-tight">Recent activity log</h3>
            <div className="flex items-center">
              <div className="relative w-48 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 group-focus-within:text-primary-600 transition-colors" />
                <Input
                  placeholder="Filter logs..."
                  className="pl-10 h-8 bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-primary-500 focus-visible:border-primary-500 transition-all font-medium text-xs rounded"
                  onChange={(e) => gridApi?.setQuickFilter(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="w-full flex-1" style={{ height: "400px" }}>
            <AgGridReact
              theme={customTheme}
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
        <Card className="lg:col-span-1 bg-white border-neutral-200 p-4 flex flex-col gap-3 h-full shadow-sm">
          <h3 className="text-base font-bold text-neutral-900 uppercase tracking-tight pb-2 border-b border-neutral-100 mb-2">Quick Actions</h3>
          <div className="flex flex-col gap-2">
            {navActions.map((action, i) => (
              <button
                key={i}
                onClick={action.onClick}
                className="flex items-center gap-3 p-3 rounded-lg border border-neutral-100 bg-neutral-50/30 hover:border-primary-200 hover:shadow-sm transition-all group text-left"
              >
                <div className={`p-2 rounded-md bg-white border border-neutral-200 ${action.color} group-hover:border-primary-100 transition-colors shadow-xs`}>
                  {action.icon}
                </div>
                <span className="text-sm font-bold text-neutral-900 tracking-tight">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
          
          <div className="mt-auto pt-4">
            <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-100">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">System Status</span>
              </div>
              <p className="text-sm font-bold text-neutral-900 mt-1">All systems operational.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function QuickStat({ title, value, icon: Icon, color }) {
  return (
    <Card className="bg-white border-neutral-200 shadow-sm transition-all hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{title}</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{value}</p>
          </div>
          <div className={`p-2 rounded-lg bg-neutral-50 border border-neutral-100`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}