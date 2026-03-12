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
import { supabase } from "@/lib/supabaseClient";

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
  const [rowData, setRowData] = useState([]);
  const [kpiStats, setKpiStats] = useState({
    complianceRate: "0%",
    activeCases: 0,
    criticalCases: 0,
    resolvedRate: "0%"
  });

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Activity Logs
      const { data: logData, error: logError } = await supabase
        .from('activity_log_sv')
        .select('*')
        .order('created_at', { ascending: false })
        .order('log_id', { ascending: false });

      if (logError) throw logError;

      const formattedData = logData.map((log) => {
        let displayType = "System Activity";
        let colorType = "text-neutral-500";
        if (log.action_type === 'INSERT') {
          displayType = "New Record";
          colorType = "text-info";
        } else if (log.action_type === 'UPDATE') {
          displayType = "Record update";
          colorType = "text-success";
        } else if (log.action_type === 'DELETE') {
          displayType = "Record removed";
          colorType = "text-destructive-semantic";
        }

        // Make table names human readable, including the newly added evidence tables
        const tableMap = {
          'students_sv': 'Student',
          'violations_sv': 'Violation',
          'sanctions_sv': 'Sanction Matrix',
          'offense_types_sv': 'Offense Type',
          'student_sanctions_sv': 'Student Sanction',
          'violation_evidence_sv': 'Violation Evidence',
          'compliance_evidence_sv': 'Compliance Evidence'
        };
        const readableTable = tableMap[log.table_name] || log.table_name;

        let detailMsg = `Action on ${readableTable}`;
        if (log.record_id) {
          detailMsg = `${log.action_type} on ${readableTable} (ID: ${log.record_id})`;
        }

        return {
          id: log.log_id,
          type: displayType,
          detail: detailMsg,
          time: formatTimeAgo(log.created_at)
        };
      });

      setRowData(formattedData);

      // 2. Fetch KPI Data (Violations and Sanctions)
      const { data: violations } = await supabase.from('violations_sv').select('status, offense_type_id');
      const { data: sanctions } = await supabase.from('student_sanctions_sv').select('status');
      const { data: offenseTypes } = await supabase.from('offense_types_sv').select('offense_type_id, severity');
      
      const vList = violations || [];
      const sList = sanctions || [];
      const oList = offenseTypes || [];

      // Build offense severity lookup
      const severityMap = {};
      oList.forEach(o => { severityMap[o.offense_type_id] = o.severity; });

      const totalViolations = vList.length;
      const totalSanctions = sList.length;

      // Active cases (Pending, Under Investigation, Sanctioned)
      const activeCasesCount = vList.filter(v => ['Pending', 'Under Investigation', 'Sanctioned'].includes(v.status)).length;

      // Critical Cases (Major severity and not Resolved/Dismissed)
      const criticalCasesCount = vList.filter(v => {
          const sev = severityMap[v.offense_type_id];
          const isResolved = ['Resolved', 'Dismissed'].includes(v.status);
          return sev === 'Major' && !isResolved;
      }).length;

      // Resolved Rate (Resolved / Total Violations)
      const resolvedCount = vList.filter(v => v.status === 'Resolved').length;
      const resolvedRateCalc = totalViolations > 0 ? Math.round((resolvedCount / totalViolations) * 100) : 0;

      // Compliance Rate (Completed Sanctions / Total Sanctions)
      const completedSanctions = sList.filter(s => s.status === 'Completed').length;
      const complianceRateCalc = totalSanctions > 0 ? Math.round((completedSanctions / totalSanctions) * 100) : 0;

      setKpiStats({
          complianceRate: `${complianceRateCalc}%`,
          activeCases: activeCasesCount,
          criticalCases: criticalCasesCount,
          resolvedRate: `${resolvedRateCalc}%`
      });

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const columnDefs = useMemo(() => [
    {
      headerName: "Activity Type",
      field: "type",
      flex: 1,
      cellRenderer: (params) => {
        let color = "text-neutral-500";
        if (params.value.includes("New")) color = "text-destructive-semantic";
        if (params.value.includes("removed")) color = "text-destructive-semantic";
        if (params.value.includes("update")) color = "text-info";
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
          onClick={fetchDashboardData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickStat title="Compliance" value={kpiStats.complianceRate} icon={PieChart} color="text-primary-600" />
        <QuickStat title="Active cases" value={kpiStats.activeCases.toString().padStart(2, '0')} icon={Clock} color="text-warning" />
        <QuickStat title="Critical" value={kpiStats.criticalCases.toString().padStart(2, '0')} icon={AlertTriangle} color="text-destructive-semantic" />
        <QuickStat title="Resolved" value={kpiStats.resolvedRate} icon={CalendarCheck} color="text-success" />
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