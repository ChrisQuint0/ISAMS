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
// Accepts lookup maps to resolve IDs to human-readable names:
//   studentMap: { student_number -> "First Last" }
//   violationStudentMap: { violation_id -> student_number }
//   sanctionViolationMap: { sanction_id -> violation_id }
const buildDetailMessage = (log, userName, { studentMap = {}, violationStudentMap = {}, sanctionViolationMap = {} } = {}) => {
  const action = log.action_type;
  const table = log.table_name;
  const d = log.details || {};
  const data = action === 'UPDATE' ? (d.new || d) : d;
  const oldData = action === 'UPDATE' ? (d.old || {}) : {};
  const name = userName || 'Someone';

  // Resolve a student_number to a display string like "Juan Dela Cruz (23-00117)"
  const resolveStudent = (sn) => {
    if (!sn) return 'a student';
    const fullName = studentMap[sn];
    return fullName ? `${fullName} (${sn})` : sn;
  };

  // Resolve a violation_id to its associated student display string
  const resolveViolationStudent = (vid) => {
    if (!vid) return 'a student';
    const sn = violationStudentMap[vid] || violationStudentMap[String(vid)];
    return sn ? resolveStudent(sn) : `violation #${vid}`;
  };

  // Resolve a sanction_id to its associated student display string
  const resolveSanctionStudent = (sid) => {
    if (!sid) return 'a student';
    const vid = sanctionViolationMap[sid] || sanctionViolationMap[String(sid)];
    if (vid) return resolveViolationStudent(vid);
    return `sanction #${sid}`;
  };

  try {
    switch (table) {
      case 'students_sv': {
        const sn = data.student_number || log.record_id;
        const studentDisplay = `${data.first_name || ''} ${data.last_name || ''}`.trim();
        const label = studentDisplay ? `${studentDisplay} (${sn})` : sn;
        if (action === 'INSERT') return `${name} registered student ${label}`;
        if (action === 'UPDATE') {
          const oldStatus = oldData.status;
          const newStatus = data.status;
          if (oldStatus && newStatus && oldStatus !== newStatus) {
            return `${name} changed ${label}'s status from ${oldStatus} to ${newStatus}`;
          }
          return `${name} updated the record of ${label}`;
        }
        if (action === 'DELETE') return `${name} removed student ${label}`;
        break;
      }
      case 'violations_sv': {
        const sn = data.student_number || '';
        const studentLabel = resolveStudent(sn);
        if (action === 'INSERT') return `${name} filed a violation against ${studentLabel}`;
        if (action === 'UPDATE') {
          const oldStatus = oldData.status;
          const newStatus = data.status;
          if (oldStatus && newStatus && oldStatus !== newStatus) {
            return `${name} changed ${studentLabel}'s violation status from ${oldStatus} to ${newStatus}`;
          }
          return `${name} updated the violation record of ${studentLabel}`;
        }
        if (action === 'DELETE') return `${name} removed a violation record of ${studentLabel}`;
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
          const oldName = oldData.name;
          if (oldName && oldName !== offName) {
            return `${name} renamed offense type "${oldName}" to "${offName}"`;
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
        const context = severity && freq ? ` for ${severity} ${freq} offense` : '';
        if (action === 'INSERT') return `${name} added sanction rule "${sName}"${context}`;
        if (action === 'UPDATE') {
          const oldName = oldData.sanction_name;
          if (oldName && oldName !== sName) {
            return `${name} renamed sanction rule "${oldName}" to "${sName}"`;
          }
          return `${name} updated sanction rule "${sName}"`;
        }
        if (action === 'DELETE') return `${name} removed sanction rule "${sName}"`;
        break;
      }
      case 'student_sanctions_sv': {
        const penalty = data.penalty_name || 'a sanction';
        const vid = data.violation_id || '';
        const studentLabel = resolveViolationStudent(vid);
        if (action === 'INSERT') return `${name} assigned "${penalty}" to ${studentLabel}`;
        if (action === 'UPDATE') {
          const oldStatus = oldData.status;
          const newStatus = data.status;
          if (oldStatus && newStatus && oldStatus !== newStatus) {
            return `${name} changed ${studentLabel}'s sanction "${penalty}" status from ${oldStatus} to ${newStatus}`;
          }
          return `${name} updated sanction "${penalty}" for ${studentLabel}`;
        }
        if (action === 'DELETE') return `${name} removed sanction "${penalty}" from ${studentLabel}`;
        break;
      }
      case 'violation_evidence_sv': {
        const fileName = data.file_name || 'a file';
        const vid = data.violation_id || '';
        const studentLabel = resolveViolationStudent(vid);
        if (action === 'INSERT') return `${name} uploaded evidence "${fileName}" for ${studentLabel}'s violation`;
        if (action === 'DELETE') return `${name} removed evidence from ${studentLabel}'s violation`;
        break;
      }
      case 'compliance_evidence_sv': {
        const fileName = data.file_name || 'a file';
        const sid = data.sanction_id || '';
        const studentLabel = resolveSanctionStudent(sid);
        if (action === 'INSERT') return `${name} uploaded compliance evidence "${fileName}" for ${studentLabel}'s sanction`;
        if (action === 'DELETE') return `${name} removed compliance evidence from ${studentLabel}'s sanction`;
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
    'students_sv': 'Student', 'violations_sv': 'Violation', 'sanctions_sv': 'Sanction Rule',
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
  const [topViolators, setTopViolators] = useState([]);
  const [selectedViolator, setSelectedViolator] = useState(null);
  const [severityFilter, setSeverityFilter] = useState("All");

  const filteredTopViolators = useMemo(() => {
    if (severityFilter === "All") return topViolators;
    
    return topViolators
      .map(violator => {
        const filteredViols = violator.violations.filter(v => v.severity === severityFilter);
        return {
          ...violator,
          count: filteredViols.length,
          violations: filteredViols
        };
      })
      .filter(violator => violator.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [topViolators, severityFilter]);

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
          .select('id, first_name, last_name, email')
          .in('id', uniqueUuids);
        if (users) {
          users.forEach(u => {
            const hasName = u.first_name || u.last_name;
            userMap[u.id] = hasName 
              ? `${u.first_name || ''} ${u.last_name || ''}`.trim()
              : (u.email ? u.email.split('@')[0] : 'Unknown User');
          });
        }
      }

      // 3. Build lookup maps for resolving IDs to student names
      // studentMap: student_number -> "First Last"
      const { data: studentsData } = await supabase
        .from('students_sv')
        .select('student_number, first_name, last_name');
      const studentMap = {};
      if (studentsData) {
        studentsData.forEach(s => {
          studentMap[s.student_number] = `${s.first_name} ${s.last_name}`;
        });
      }

      // violationStudentMap: violation_id -> student_number
      const { data: violationsData } = await supabase
        .from('violations_sv')
        .select(`
          violation_id, 
          student_number,
          status,
          offense_type_id,
          incident_date,
          offense_types_sv (name, severity)
        `);
      const violationStudentMap = {};
      const violatorMap = {};
      if (violationsData) {
        violationsData.forEach(v => {
          violationStudentMap[v.violation_id] = v.student_number;
          violationStudentMap[String(v.violation_id)] = v.student_number;

          if (v.student_number) {
            if (!violatorMap[v.student_number]) {
              violatorMap[v.student_number] = {
                student_number: v.student_number,
                name: studentMap[v.student_number] || 'Unknown Student',
                count: 0,
                violations: []
              };
            }
            violatorMap[v.student_number].count += 1;
            violatorMap[v.student_number].violations.push({
              violation_id: v.violation_id,
              offense_name: v.offense_types_sv?.name || 'Unknown',
              severity: v.offense_types_sv?.severity || 'Unknown',
              status: v.status,
              incident_date: v.incident_date
            });
          }
        });
      }
      
      const topViolatorArray = Object.values(violatorMap)
        .sort((a, b) => b.count - a.count);
      setTopViolators(topViolatorArray);

      // sanctionViolationMap: sanction_id -> violation_id
      const { data: sanctionsData } = await supabase
        .from('student_sanctions_sv')
        .select('sanction_id, violation_id');
      const sanctionViolationMap = {};
      if (sanctionsData) {
        sanctionsData.forEach(s => {
          sanctionViolationMap[s.sanction_id] = s.violation_id;
          sanctionViolationMap[String(s.sanction_id)] = s.violation_id;
        });
      }

      const lookups = { studentMap, violationStudentMap, sanctionViolationMap };

      // 4. Format log data with human-readable details
      const formattedData = logData.map((log) => {
        let displayType = "System Activity";
        if (log.action_type === 'INSERT') displayType = "New Record";
        else if (log.action_type === 'UPDATE') displayType = "Record Updated";
        else if (log.action_type === 'DELETE') displayType = "Record Removed";

        const performerName = userMap[log.performed_by] || 'System';
        const detailMsg = buildDetailMessage(log, performerName.split(' ')[0], lookups);

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
      const { data: sanctions } = await supabase.from('student_sanctions_sv').select('status');
      const { data: offenseTypes } = await supabase.from('offense_types_sv').select('offense_type_id, severity');
      
      const vList = violationsData || [];
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
      headerName: "Details",
      field: "detail",
      flex: 3,
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

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        {/* RECENT ACTIVITY LOG - COMPACTED HEADER */}
        <Card className="lg:col-span-7 bg-white border-neutral-200 flex flex-col rounded-lg overflow-hidden shadow-sm p-0 z-10 h-[400px]">
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

          <div className="w-full flex-1 [&_.ag-root-wrapper]:border-none [&_.ag-header]:border-t-0 -mt-[15px]" style={{ height: "236px" }}>
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
              pagination={false}
              suppressCellFocus={true}
            />
          </div>
        </Card>

        {/* TOP VIOLATORS SIDEBAR */}
        <Card className="lg:col-span-3 bg-white border-neutral-200 p-4 flex flex-col gap-3 h-[400px] shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100 mb-2 mt-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-[16px] w-[16px] text-destructive-semantic" />
              <h3 className="text-[15px] font-bold text-neutral-900 uppercase tracking-wider leading-none">Top Violators</h3>
            </div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-[11px] font-bold text-neutral-600 bg-neutral-100 border-none rounded-md px-2 py-1 outline-none cursor-pointer focus:ring-1 focus:ring-primary-500 hover:bg-neutral-200 transition-colors"
            >
              <option value="All">All Severities</option>
              <option value="Major">Major</option>
              <option value="Minor">Minor</option>
              <option value="Compliance">Compliance</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto pr-1 hide-ag-scrollbars" style={{ maxHeight: '350px' }}>
            {filteredTopViolators.length === 0 ? (
              <p className="text-sm text-neutral-500 font-medium text-center py-4">No violators found.</p>
            ) : (
              filteredTopViolators.map((violator, i) => (
                <div key={violator.student_number} className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 bg-neutral-50/30 hover:border-primary-200 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-neutral-100 text-neutral-700 font-black text-xs group-hover:bg-destructive-semantic/10 group-hover:text-destructive-semantic transition-colors">
                      #{i + 1}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-neutral-900 tracking-tight leading-tight">{violator.student_number}</span>
                      <span className="text-[11px] font-medium text-neutral-500">{violator.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center justify-center pr-2 border-r border-neutral-200">
                      <span className="text-sm font-black text-neutral-900 leading-none">{violator.count}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 px-2.5 text-[11px] font-bold bg-white text-primary-700 hover:bg-primary-50 hover:text-primary-800 border-primary-200"
                      onClick={() => setSelectedViolator(violator)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* MODAL FOR STUDENT VIOLATIONS */}
      {selectedViolator && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg bg-white shadow-2xl rounded-xl border-0 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 pt-4 pb-3 bg-neutral-50/50">
              <div>
                <h3 className="text-lg font-black text-neutral-900 tracking-tight leading-none mb-1">Violation Records</h3>
                <p className="text-[13px] font-bold text-neutral-500 tracking-tight">{selectedViolator.name} • {selectedViolator.student_number}</p>
              </div>
              <button 
                onClick={() => setSelectedViolator(null)} 
                className="p-1.5 hover:bg-neutral-200/50 text-neutral-500 hover:text-neutral-900 rounded-md transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 pt-3 pb-5 max-h-[60vh] overflow-y-auto space-y-3 bg-neutral-50/30 hide-ag-scrollbars">
              {selectedViolator.violations.map((v, idx) => (
                <div key={v.violation_id || idx} className="p-4 border border-neutral-200 rounded-lg bg-white shadow-sm flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-neutral-900 text-sm leading-tight max-w-[70%]">{v.offense_name}</span>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${
                      v.status === 'Resolved' ? 'bg-success/10 text-success border-success/20' : 
                      v.status === 'Dismissed' ? 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20' :
                      v.status === 'Pending' ? 'bg-warning/10 text-warning border-warning/20' :
                      v.status === 'Sanctioned' ? 'bg-sanctioned/10 text-sanctioned border-sanctioned/20' :
                      'bg-info/10 text-info border-info/20'
                    }`}>
                      {v.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-end mt-1">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Severity</span>
                      <span className={`text-xs font-bold ${
                        v.severity === 'Major' ? 'text-destructive-semantic' : 
                        v.severity === 'Minor' ? 'text-info' : 'text-neutral-700'
                      }`}>
                        {v.severity}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 items-end">
                      <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Date</span>
                      <span className="text-xs font-semibold text-neutral-700">
                        {v.incident_date ? new Date(v.incident_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}