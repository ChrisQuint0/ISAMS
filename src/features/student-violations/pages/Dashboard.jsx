import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

import {
  Users, ShieldAlert, FileText, BarChart3,
  History, PieChart, Clock, AlertTriangle,
  CalendarCheck, RefreshCw, Search, X, ArrowUpRight, ArrowDownRight, Loader2
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

// --- Reusable Stat Card (Extra Compact) ---
const StatCard = ({ title, value, icon: Icon, description, trend, isUp, isLoading, borderTopClass = "bg-primary-500", iconClass = "text-primary-600 bg-primary-50 border-primary-100" }) => (
  <Card className="bg-white border-neutral-200 shadow-sm rounded-lg overflow-hidden relative group transition-all hover:shadow-md hover:-translate-y-0.5 h-full flex flex-col">
    <div className={`absolute top-0 left-0 w-full h-1 ${borderTopClass} transition-opacity opacity-70 group-hover:opacity-100`}></div>
    <CardContent className="p-3 flex-1 flex flex-col justify-between relative z-10">
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className={`p-1.5 rounded-md border ${iconClass} transition-transform group-hover:scale-105 duration-300`}>
            <Icon size={16} strokeWidth={2.5} />
          </div>
          {trend !== undefined && !isLoading && (
            <div className={`px-2 py-0.5 rounded-full flex items-center text-[10px] font-bold ${isUp ? 'bg-success/10 text-success' : 'bg-destructive-semantic/10 text-destructive-semantic'}`}>
              {isUp ? <ArrowUpRight size={12} className="mr-0.5" /> : <ArrowDownRight size={12} className="mr-0.5" />}
              {trend}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-2xl font-black text-neutral-900 tracking-tighter leading-none mb-1">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-neutral-300" /> : value}
          </h3>
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{title}</p>
        </div>
      </div>
      {description && (
        <div className="mt-2 pt-2 border-t border-neutral-100/60 hidden">
          <p className="text-[10px] text-neutral-400 font-medium">{description}</p>
        </div>
      )}
    </CardContent>
  </Card>
);

// Helper: format occurrence number
const formatFrequency = (freq) => {
  if (freq === 1) return '1st';
  if (freq === 2) return '2nd';
  if (freq === 3) return '3rd';
  return `${freq}th`;
};

// Helper: Build a human-readable detail message from a log entry
const buildDetailMessage = (log, userName) => {
  const action = log.action_type;
  const table = log.table_name;
  const d = log.details || {};
  // For UPDATE actions, relevant data is in details.new
  const data = action === 'UPDATE' ? (d.new || d) : d;
  const oldData = action === 'UPDATE' ? (d.old || {}) : {};
  const name = userName || 'Someone';

  try {
    switch (table) {
      case 'students_sv': {
        const sn = data.student_number || log.record_id;
        if (action === 'INSERT') return `${name} added a student (${sn})`;
        if (action === 'UPDATE') return `${name} updated student ${sn}`;
        if (action === 'DELETE') return `${name} removed student ${sn}`;
        break;
      }
      case 'violations_sv': {
        const sn = data.student_number || '';
        const vid = data.violation_id || log.record_id;
        if (action === 'INSERT') return `${name} filed a violation against ${sn}`;
        if (action === 'UPDATE') {
          const oldStatus = oldData.status;
          const newStatus = data.status;
          if (oldStatus && newStatus && oldStatus !== newStatus) {
            return `${name} updated violation #${vid} status to ${newStatus}`;
          }
          return `${name} updated violation #${vid} for ${sn}`;
        }
        if (action === 'DELETE') return `${name} removed violation #${vid}`;
        break;
      }
      case 'offense_types_sv': {
        const offName = data.name || `ID ${log.record_id}`;
        if (action === 'INSERT') return `${name} added offense type "${offName}"`;
        if (action === 'UPDATE') {
          const oldSev = oldData.severity;
          const newSev = data.severity;
          if (oldSev && newSev && oldSev !== newSev) {
            return `${name} changed "${offName}" severity from ${oldSev} to ${newSev}`;
          }
          return `${name} updated offense type "${offName}"`;
        }
        if (action === 'DELETE') return `${name} removed offense type "${offName}"`;
        break;
      }
      case 'sanctions_sv': {
        const sName = data.sanction_name || `ID ${log.record_id}`;
        const severity = data.severity || '';
        const freq = data.frequency ? formatFrequency(data.frequency) : '';
        if (action === 'INSERT') return `${name} added sanction "${sName}" (${severity}, ${freq})`;
        if (action === 'UPDATE') {
          const oldName = oldData.sanction_name;
          if (oldName && oldName !== sName) {
            return `${name} renamed sanction "${oldName}" to "${sName}"`;
          }
          return `${name} updated sanction "${sName}"`;
        }
        if (action === 'DELETE') return `${name} removed sanction "${sName}"`;
        break;
      }
      case 'student_sanctions_sv': {
        const penalty = data.penalty_name || 'a sanction';
        const vid = data.violation_id || '';
        if (action === 'INSERT') return `${name} assigned "${penalty}" to violation #${vid}`;
        if (action === 'UPDATE') {
          const oldStatus = oldData.status;
          const newStatus = data.status;
          if (oldStatus && newStatus && oldStatus !== newStatus) {
            return `${name} updated sanction "${penalty}" status to ${newStatus}`;
          }
          return `${name} updated sanction "${penalty}" for violation #${vid}`;
        }
        if (action === 'DELETE') return `${name} removed sanction "${penalty}" from violation #${vid}`;
        break;
      }
      case 'violation_evidence_sv': {
        const fileName = data.file_name || 'a file';
        const vid = data.violation_id || '';
        if (action === 'INSERT') return `${name} uploaded evidence "${fileName}" for violation #${vid}`;
        if (action === 'DELETE') return `${name} removed evidence from violation #${vid}`;
        break;
      }
      case 'compliance_evidence_sv': {
        const fileName = data.file_name || 'a file';
        const sid = data.sanction_id || '';
        if (action === 'INSERT') return `${name} uploaded compliance evidence "${fileName}" for sanction #${sid}`;
        if (action === 'DELETE') return `${name} removed compliance evidence from sanction #${sid}`;
        break;
      }
      default:
        break;
    }
  } catch {
    // Fallback below
  }

  // Generic fallback
  const tableMap = {
    'students_sv': 'Student', 'violations_sv': 'Violation', 'sanctions_sv': 'Sanction Matrix',
    'offense_types_sv': 'Offense Type', 'student_sanctions_sv': 'Student Sanction',
    'violation_evidence_sv': 'Violation Evidence', 'compliance_evidence_sv': 'Compliance Evidence'
  };
  const readable = tableMap[table] || table;
  return `${name} performed ${action} on ${readable} (ID: ${log.record_id})`;
};

export default function StudViolationDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [rowData, setRowData] = useState([]);
  const [quickFilterText, setQuickFilterText] = useState("");
  const [overdueSanctions, setOverdueSanctions] = useState([]);
  const [alertDismissed, setAlertDismissed] = useState(false);
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

      // 2. Resolve performed_by UUIDs to user names
      const uniqueUuids = [...new Set(logData.map(l => l.performed_by).filter(Boolean))];
      let userMap = {};
      if (uniqueUuids.length > 0) {
        const { data: users } = await supabase
          .from('users_with_roles')
          .select('id, first_name, last_name')
          .in('id', uniqueUuids);
        if (users) {
          users.forEach(u => {
            userMap[u.id] = `${u.first_name} ${u.last_name}`;
          });
        }
      }

      // 3. Format log data with human-readable details
      const formattedData = logData.map((log) => {
        let displayType = "System Activity";
        if (log.action_type === 'INSERT') displayType = "New Record";
        else if (log.action_type === 'UPDATE') displayType = "Record Updated";
        else if (log.action_type === 'DELETE') displayType = "Record Removed";

        const performerName = userMap[log.performed_by] || 'System';
        const detailMsg = buildDetailMessage(log, performerName.split(' ')[0]);

        return {
          id: log.log_id,
          type: displayType,
          performedBy: performerName,
          detail: detailMsg,
          time: formatTimeAgo(log.created_at)
        };
      });

      setRowData(formattedData);

      // 2. Fetch Overdue Sanctions for alert banner
      const { data: overdueData } = await supabase
        .from('student_sanctions_sv')
        .select(`
          sanction_id, penalty_name, deadline_date,
          violations_sv (
            students_sv (first_name, last_name)
          )
        `)
        .eq('status', 'Overdue')
        .order('deadline_date', { ascending: true });
      setOverdueSanctions(overdueData || []);
      setAlertDismissed(false);

      // 3. Fetch KPI Data (Violations and Sanctions)
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
      flex: 0.8,
      cellRenderer: (params) => {
        let color = "text-neutral-500";
        if (params.value.includes("New")) color = "text-info";
        if (params.value.includes("Removed")) color = "text-destructive-semantic";
        if (params.value.includes("Updated")) color = "text-success";
        return <span className={`font-semibold ${color}`}>{params.value}</span>;
      }
    },
    {
      headerName: "Performed By",
      field: "performedBy",
      flex: 0.8,
      cellStyle: { color: 'var(--neutral-700)', fontWeight: '600' }
    },
    {
      headerName: "Details",
      field: "detail",
      flex: 2,
      filter: true,
      tooltipField: "detail",
      cellStyle: { color: 'var(--neutral-900)', fontWeight: '500' }
    },
    {
      headerName: "Time",
      field: "time",
      flex: 0.7,
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
    <div className="space-y-6 flex flex-col h-full bg-neutral-50 animate-in fade-in duration-500 text-left px-2">
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

      {/* OVERDUE SANCTIONS ALERT BANNER */}
      {overdueSanctions.length > 0 && !alertDismissed && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 animate-in fade-in duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="shrink-0 mt-0.5 p-1.5 rounded-md bg-red-100 border border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-red-800">
                  {overdueSanctions.length} overdue sanction{overdueSanctions.length > 1 ? 's' : ''} require{overdueSanctions.length === 1 ? 's' : ''} attention
                </p>
                <div className="mt-2 flex flex-col gap-1">
                  {overdueSanctions.slice(0, 5).map((s) => {
                    const student = s.violations_sv?.students_sv;
                    const studentName = student ? `${student.first_name} ${student.last_name}` : 'Unknown Student';
                    const daysOverdue = s.deadline_date
                      ? Math.floor((new Date() - new Date(s.deadline_date)) / (1000 * 60 * 60 * 24))
                      : null;
                    return (
                      <div key={s.sanction_id} className="flex items-center gap-2 text-xs text-red-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                        <span className="font-semibold">{studentName}</span>
                        <span className="text-red-400">—</span>
                        <span className="truncate">{s.penalty_name}</span>
                        {daysOverdue !== null && (
                          <span className="shrink-0 ml-auto font-bold text-red-600">{daysOverdue}d overdue</span>
                        )}
                      </div>
                    );
                  })}
                  {overdueSanctions.length > 5 && (
                    <p className="text-xs text-red-500 mt-1 font-medium">+{overdueSanctions.length - 5} more...</p>
                  )}
                </div>
                <button
                  onClick={() => navigate('/violations')}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-red-700 hover:text-red-900 underline underline-offset-2 transition-colors"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  View all sanctions
                </button>
              </div>
            </div>
            <button
              onClick={() => setAlertDismissed(true)}
              className="shrink-0 p-1 rounded-md text-red-400 hover:text-red-700 hover:bg-red-100 transition-colors"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="Compliance" 
            value={kpiStats.complianceRate} 
            icon={PieChart} 
            isLoading={loading}
            borderTopClass="bg-info"
            iconClass="text-info bg-info/10 border-info/20" 
        />
        <StatCard 
            title="Active Cases" 
            value={kpiStats.activeCases.toString().padStart(2, '0')} 
            icon={Clock} 
            isLoading={loading}
            borderTopClass="bg-warning"
            iconClass="text-warning bg-warning/10 border-warning/20" 
        />
        <StatCard 
            title="Critical" 
            value={kpiStats.criticalCases.toString().padStart(2, '0')} 
            icon={AlertTriangle} 
            isLoading={loading}
            borderTopClass="bg-destructive-semantic"
            iconClass="text-destructive-semantic bg-destructive-semantic/10 border-destructive-semantic/20" 
        />
        <StatCard 
            title="Resolved" 
            value={kpiStats.resolvedRate} 
            icon={CalendarCheck} 
            isLoading={loading}
            borderTopClass="bg-success"
            iconClass="text-success bg-success/10 border-success/20" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* RECENT ACTIVITY LOG - COMPACTED HEADER */}
        <Card className="lg:col-span-3 bg-white border-neutral-200 flex flex-col rounded-lg overflow-hidden shadow-sm p-0 z-10">
          <div className="px-5 pt-5 pb-2 flex items-center justify-between bg-white relative z-20">
            <div className="flex items-center gap-2">
              <History className="h-[15px] w-[15px] text-neutral-600" />
              <h3 className="text-[15px] font-bold text-neutral-900 uppercase tracking-wider leading-none">Recent Activity Log</h3>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64 group">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 group-focus-within:text-primary-600 transition-colors" />
                <Input
                  placeholder="Search logs..."
                  className="pl-8 h-7 bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-primary-500 focus-visible:border-primary-500 transition-all font-medium text-xs shadow-sm rounded-md"
                  value={quickFilterText}
                  onChange={(e) => setQuickFilterText(e.target.value)}
                />
              </div>

            </div>
          </div>

          <div className="w-full flex-1 hide-ag-scrollbars [&_.ag-root-wrapper]:border-none [&_.ag-header]:border-t-0 -mt-[15px]" style={{ height: "400px" }}>
            <style>{`
              .hide-ag-scrollbars .ag-body-viewport::-webkit-scrollbar,
              .hide-ag-scrollbars .ag-body-vertical-scroll-viewport::-webkit-scrollbar,
              .hide-ag-scrollbars .ag-body-horizontal-scroll-viewport::-webkit-scrollbar {
                display: none !important;
                width: 0 !important;
                height: 0 !important;
              }
              .hide-ag-scrollbars .ag-body-viewport,
              .hide-ag-scrollbars .ag-body-vertical-scroll-viewport,
              .hide-ag-scrollbars .ag-body-horizontal-scroll-viewport {
                -ms-overflow-style: none !important;
                scrollbar-width: none !important;
              }
            `}</style>
            <AgGridReact
              theme={customTheme}
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              onGridReady={(params) => setGridApi(params.api)}
              quickFilterText={quickFilterText}
              animateRows={true}
              rowHeight={48}
              headerHeight={44}
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
          </div>
        </Card>
      </div>
    </div>
  );
}

