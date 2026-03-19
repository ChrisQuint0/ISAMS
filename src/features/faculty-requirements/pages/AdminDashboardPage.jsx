import React, { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  PieChart, Clock, AlertTriangle, CalendarCheck, CheckCircle,
  Bell, Mail, Eye, CalendarPlus, FileText, Download, AlertCircle,
  RefreshCw, Users, Activity, CheckSquare, BookOpen,
  Settings, Folder, TrendingUp, TrendingDown, ArrowRight, BarChart3
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Components
import { DataTable } from "@/components/DataTable";
import { ToastProvider, useToast } from "@/components/ui/toast/toaster";

// Custom Hook
import { useAdminDashboard } from '../hooks/AdminDashboardHook';

// ─── Toast bridge ─────────────────────────────────────────────────────────────
const DashboardToastHandler = ({ success, error }) => {
  const { addToast } = useToast();
  useEffect(() => {
    if (success) addToast({ title: "Success", description: String(success), variant: "success" });
  }, [success, addToast]);
  useEffect(() => {
    if (error) addToast({ title: "Error", description: String(error), variant: "destructive" });
  }, [error, addToast]);
  return null;
};

// ─── Deadline urgency helper ───────────────────────────────────────────────────
function getDaysLeft(dateStr, graceDays = 0) {
  if (!dateStr) return { label: 'No date', urgent: false, overdue: false, grace: false };
  const [y, m, d] = dateStr.split('-').map(Number);
  const due = new Date(y, m - 1, d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.floor((due - today) / 86400000);
  
  if (diff === 0) return { label: 'Due today', urgent: true, overdue: false, grace: false };
  if (diff === 1) return { label: 'Due tomorrow', urgent: true, overdue: false, grace: false };
  if (diff > 0) return { label: `${diff} days left`, urgent: diff <= 3, overdue: false, grace: false };
  
  // Check grace period
  const cutoff = new Date(due); cutoff.setDate(cutoff.getDate() + graceDays);
  const gDiff = Math.floor((cutoff - today) / 86400000);
  
  if (gDiff >= 0) return { label: `Grace: ${gDiff}d left`, urgent: true, overdue: false, grace: true };
  return { label: 'Passed', urgent: false, overdue: true, grace: false };
}

// ─── Status badge helper ───────────────────────────────────────────────────────
function StatusBadge({ value }) {
  const v = (value || '').toUpperCase();
  const isGreen = ['APPROVED', 'VALIDATED', 'SUBMITTED', 'RESUBMITTED'].includes(v);
  const isRed = v === 'REJECTED';
  const isOrange = v === 'REVISION_REQUESTED' || v === 'LATE';
  const cls = isGreen ? 'bg-[#E6F7F0] text-[#00A86B] border-[#00A86B]/20'
    : isRed ? 'bg-destructive/10 text-destructive border-destructive/20'
      : isOrange ? 'bg-warning/10 text-warning border-warning/20'
        : 'bg-[#F1F5F9] text-[#475569] border-[#475569]/10';
  const label = v === 'SUBMITTED' || v === 'RESUBMITTED' ? 'Submitted'
    : v === 'APPROVED' || v === 'VALIDATED' ? 'Approved'
      : v === 'REVISION_REQUESTED' ? 'Revision'
        : v === 'LATE' ? 'Late'
        : v === 'REJECTED' ? 'Rejected'
          : v.charAt(0) + v.slice(1).toLowerCase();
  return (
    <span className={`inline-flex items-center whitespace-nowrap h-fit font-bold text-xs px-2 py-0.5 rounded-full border shadow-none ${cls}`}>
      {label}
    </span>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const {
    loading,
    error,
    success,
    stats,
    recentActivity,
    settings,
    refresh,
    sendBulkReminders
  } = useAdminDashboard();

  // ─── Recent Activity Column Defs ──────────────────────────────────────────────
  const recentActivityColDefs = useMemo(() => [
    {
      headerName: "Date & Time",
      valueGetter: (p) => p.data.date || p.data.submitted_at,
      cellRenderer: (p) => (
        <span className="font-mono text-neutral-500 text-xs font-medium">
          {p.value ? new Date(p.value).toLocaleString() : '—'}
        </span>
      ),
      flex: 1.2,
    },
    {
      field: "faculty_name",
      headerName: "Faculty",
      flex: 1.5,
      cellRenderer: (p) => (
        <span className="font-bold text-neutral-900 text-xs">{p.value || '—'}</span>
      )
    },
    {
      field: "course_code",
      headerName: "Course",
      flex: 0.7,
      cellRenderer: (p) => (
        <span className="inline-flex items-center h-fit font-bold text-xs px-2 py-0.5 rounded-full border bg-primary-50 text-primary-700 border-primary-200 font-mono">
          {p.value || '—'}
        </span>
      )
    },
    {
      field: "section",
      headerName: "Section",
      flex: 0.8,
      cellRenderer: (p) => (
        <span className="inline-flex items-center h-fit font-bold text-xs px-2 py-0.5 rounded-full border bg-neutral-100 text-neutral-700 border-neutral-200 font-mono">
          {p.value || '—'}
        </span>
      )
    },
    {
      field: "doc_type",
      headerName: "Document",
      flex: 1.5,
      cellRenderer: (p) => (
        <span className="font-medium text-neutral-900 text-xs">{p.value || '—'}</span>
      )
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      cellRenderer: (p) => {
        const isCompleted = p.value === 'SUBMITTED' || p.value === 'RESUBMITTED' || p.value === 'APPROVED' || p.value === 'VALIDATED';
        const displayValue = p.data.is_submitted_late && isCompleted ? 'LATE' : p.value;
        return (
          <div className="flex items-center h-full">
            <StatusBadge value={displayValue} />
          </div>
        );
      }
    }
  ], []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <RefreshCw className="h-10 w-10 animate-spin text-primary-600 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Loading Dashboard...</p>
      </div>
    );
  }

  const completion = stats.overall_completion || 0;
  const onTimeRate = stats.on_time_rate || 0;

  return (
    <ToastProvider>
      <DashboardToastHandler success={success} error={error} />
      <div className="space-y-6 flex flex-col h-full bg-neutral-50/30">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Institutional Dashboard</h1>
            <p className="text-neutral-500 font-medium text-sm mt-0.5">
              {settings?.semester || '—'}, AY {settings?.academic_year || '—'}
              <span className="font-bold text-neutral-700 ml-1">· Admin Overview</span>
            </p>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0">

          {/* Overall Completion */}
          <Card className="bg-white border-neutral-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-neutral-50 border border-neutral-200">
                    <PieChart className="h-4 w-4 text-primary-600" />
                  </div>
                  <h3 className="font-bold text-neutral-900 text-sm">Overall Completion</h3>
                </div>
                <span className={`text-2xl font-black ${completion >= 100 ? 'text-success' : 'text-primary-600'}`}>
                  {completion}%
                </span>
              </div>
              <div className="relative w-full h-2 bg-neutral-100 border border-neutral-200 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`absolute top-0 left-0 h-full transition-all duration-1000 rounded-full ${completion >= 100 ? 'bg-success' : 'bg-primary-500'}`}
                  style={{ width: `${Math.min(completion, 100)}%` }}
                />
              </div>
              <div className="mt-3 flex justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                <span>Institutional Submissions Rate</span>
                {completion >= 100 && (
                  <span className="text-success flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> All Done
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Faculty Statistics */}
          <Card className="bg-white border-neutral-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-neutral-50 border border-neutral-200">
                    <Users className="h-4 w-4 text-primary-600" />
                  </div>
                  <h3 className="font-bold text-neutral-900 text-sm">Faculty Statistics</h3>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border shadow-sm bg-primary-50 text-primary-600 border-primary-200">
                  {stats.total_faculty || 0} Total
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-primary-600 leading-none">{stats.active_faculty || 0}</span>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">Current Semester</span>
                  <p className="text-[9px] text-neutral-400 font-medium mt-0.5 leading-tight">{stats.active_faculty || 0} faculties within this semester</p>
                </div>
                <div className="h-10 w-px bg-neutral-100 mx-4" />
                <div className="flex flex-col items-end text-right">
                  <span className="text-3xl font-black text-neutral-400 leading-none">{stats.inactive_faculty || 0}</span>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">Other Semester</span>
                  <p className="text-[9px] text-neutral-400 font-medium mt-0.5 leading-tight">{stats.inactive_faculty || 0} not in this semester</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submission Metrics */}
          <Card className="bg-white border-neutral-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-neutral-50 border border-neutral-200">
                    <CheckSquare className="h-4 w-4 text-warning" />
                  </div>
                  <h3 className="font-bold text-neutral-900 text-sm">Submission Metrics</h3>
                </div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="flex flex-col">
                  <span className="text-3xl font-black text-warning leading-none">{stats.pending_submissions || 0}</span>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">Pending Items</span>
                </div>
                <div className="h-10 w-px bg-neutral-100 mx-4" />
                <div className="flex flex-col items-end text-right">
                  <span className={`text-3xl font-black leading-none ${onTimeRate >= 80 ? 'text-success' : onTimeRate >= 50 ? 'text-warning' : 'text-destructive'}`}>
                    {onTimeRate}%
                  </span>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">On-Time Rate</span>
                  <span className={`text-[9px] font-bold mt-0.5 flex items-center gap-0.5 ${onTimeRate >= 80 ? 'text-success' : 'text-warning'}`}>
                    {onTimeRate >= 80
                      ? <><TrendingUp className="h-3 w-3" /> Good standing</>
                      : <><TrendingDown className="h-3 w-3" /> Needs attention</>
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* ── Main Content Grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">

          {/* Left: Analytics & Activity (2 columns) */}
          <div className="xl:col-span-2 space-y-6 flex flex-col min-h-0">

            {/* Requirement Status Breakdown */}
            <Card className="bg-white border-neutral-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden shrink-0">
              <CardHeader className="bg-neutral-50/50 border-b border-neutral-200 py-3.5 px-4">
                <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary-600" />
                  Requirement Status Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {(stats.requirement_breakdown || []).map((req, idx) => (
                    <div key={idx} className="group space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-neutral-600 group-hover:text-primary-700 transition-colors">{req.label}</span>
                        <span className={`font-black ${req.progress >= 100 ? 'text-success' : req.progress >= 50 ? 'text-primary-600' : 'text-warning'}`}>
                          {req.progress}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden border border-neutral-200 shadow-inner">
                        <div
                          className={`h-full transition-all duration-1000 rounded-full ${req.progress >= 100 ? 'bg-success' : req.progress >= 50 ? 'bg-primary-500' : 'bg-warning'}`}
                          style={{ width: `${Math.max(req.progress, req.progress > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {(!stats.requirement_breakdown || stats.requirement_breakdown.length === 0) && (
                    <div className="col-span-2 flex flex-col items-center justify-center py-8 bg-neutral-50 rounded-xl border border-dashed border-neutral-200 text-neutral-400 gap-2">
                      <BookOpen className="h-6 w-6 opacity-30" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No active requirements for this semester.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Institution Activity Log */}
            <Card className="bg-white border-neutral-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col flex-1 min-h-[380px]">
              <CardHeader className="bg-neutral-50/50 border-b border-neutral-200 py-3.5 px-4 shrink-0">
                <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary-600" />
                  Institution Activity Log
                </CardTitle>
              </CardHeader>
              <div className="flex-1">
                <DataTable
                  rowData={recentActivity}
                  columnDefs={recentActivityColDefs}
                  className="h-full border-0 shadow-none"
                  overlayNoRowsTemplate='<div class="text-neutral-500 text-sm py-8 font-medium text-center"><p>No recent submissions found.</p></div>'
                />
              </div>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">

            {/* Upcoming Deadlines */}
            <Card className="bg-white border-neutral-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <CardHeader className="bg-neutral-50/50 border-b border-neutral-200 py-3.5 px-4">
                <CardTitle className="text-base font-bold text-neutral-900 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-warning" />
                    Upcoming Deadlines
                  </span>
                  {(stats.upcoming_deadlines?.length > 0) && (
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider border-warning/20 bg-warning/5 text-warning">
                      {stats.upcoming_deadlines.length} active
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5">
                {(stats.upcoming_deadlines || []).map((dl, idx) => {
                  const { label, urgent, overdue, grace } = getDaysLeft(dl.date, dl.grace_period_days || 0);
                  const isOverdue = overdue;
                  const isUrgent = urgent && !overdue && !grace;
                  const isGrace = grace;
                  
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        isOverdue ? 'bg-destructive/5 border-destructive/20' :
                        isGrace ? 'bg-warning/10 border-warning/20' :
                        isUrgent ? 'bg-warning/5 border-warning/20' :
                        'bg-success/5 border-success/20'
                      }`}
                    >
                      <div className={`p-2 rounded-lg border bg-white shadow-sm shrink-0 ${
                        isOverdue ? 'border-destructive/30' :
                        isGrace ? 'border-warning/40' :
                        isUrgent ? 'border-warning/30' :
                        'border-success/30'
                      }`}>
                        <Folder className={`h-4 w-4 ${
                          isOverdue ? 'text-destructive' :
                          isGrace ? 'text-warning' :
                          isUrgent ? 'text-warning' :
                          'text-success'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-neutral-900 truncate">{dl.label}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${
                            isOverdue ? 'text-destructive' :
                            isGrace ? 'text-warning' :
                            isUrgent ? 'text-warning' :
                            'text-success'
                          }`}>
                            {label}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-medium">
                            {new Date(dl.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(!stats.upcoming_deadlines || stats.upcoming_deadlines.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-8 bg-neutral-50 rounded-xl border border-dashed border-neutral-200 text-neutral-400 gap-3">
                    <div className="p-3 bg-white rounded-full shadow-sm border border-neutral-100">
                      <CheckCircle className="h-5 w-5 text-success opacity-60" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-center px-4">All deadlines met or none active.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white border-neutral-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <CardHeader className="bg-neutral-50/50 border-b border-neutral-200 py-3.5 px-4">
                <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5">
                <ActionButton
                  icon={CalendarPlus}
                  label="Manage Deadlines"
                  sub="Modify academic dates & grace periods"
                  onClick={() => navigate('/deadlines')}
                  color="text-primary-600"
                  bg="hover:border-primary-200 hover:bg-primary-50/30"
                />
                <ActionButton
                  icon={Eye}
                  label="Monitoring Center"
                  sub="View detailed faculty compliance"
                  onClick={() => navigate('/faculty-monitor')}
                  color="text-success"
                  bg="hover:border-success/30 hover:bg-success/5"
                />
                <ActionButton
                  icon={Settings}
                  label="Manage Semester"
                  sub="Set current period & year"
                  onClick={() => navigate('/semester-management')}
                  color="text-warning"
                  bg="hover:border-warning/30 hover:bg-warning/5"
                />
                <ActionButton
                  icon={BarChart3}
                  label="Analyze Reports"
                  sub="Download formal datasets"
                  onClick={() => navigate('/reports')}
                  color="text-info"
                  bg="hover:border-info/30 hover:bg-info/5"
                />
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </ToastProvider>
  );
}

// ─── Sub Components ────────────────────────────────────────────────────────────

function ActionButton({ icon: Icon, label, sub, onClick, color, bg = '' }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full p-3 rounded-xl transition-all duration-200 text-left border border-neutral-200 group bg-white ${bg} active:scale-[0.98]`}
    >
      <div className={`mr-3.5 p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 group-hover:bg-white transition-all shadow-sm shrink-0`}>
        <Icon className={`${color} h-4 w-4`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-neutral-900 text-sm tracking-tight">{label}</p>
        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5 truncate">{sub}</p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-neutral-300 group-hover:text-neutral-500 transition-colors shrink-0 ml-2" />
    </button>
  );
}