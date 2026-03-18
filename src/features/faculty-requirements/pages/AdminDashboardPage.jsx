import React, { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  PieChart, Clock, AlertTriangle, CalendarCheck, CheckCircle,
  Bell, Search, Mail, Eye, CalendarPlus, FileText, Download, AlertCircle,
  RefreshCw, BadgeIcon, Users, Activity, Square, CheckSquare, BookOpen,
  Settings, Folder
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// Components
import { DataTable } from "@/components/DataTable";
import { ToastProvider, useToast } from "@/components/ui/toast/toaster";

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

// Custom Hook
import { useAdminDashboard } from '../hooks/AdminDashboardHook';

// ─── Status badge helper ───────────────────────────────────────────────────────
function StatusBadge({ value }) {
  const v = (value || '').toUpperCase();

  const isGreen = ['APPROVED', 'VALIDATED', 'SUBMITTED', 'RESUBMITTED'].includes(v);
  const isRed = v === 'REJECTED';
  const isOrange = v === 'REVISION_REQUESTED';
  const isPassed = v === 'PASSED';

  const cls = isGreen ? 'bg-[#E6F7F0] text-[#00A86B] border-[#00A86B]/20'
    : isRed ? 'bg-destructive/10 text-destructive border-destructive/20'
      : isOrange ? 'bg-warning/10 text-warning border-warning/20'
        : 'bg-[#F1F5F9] text-[#475569] border-[#475569]/10';

  const label = v === 'SUBMITTED' || v === 'RESUBMITTED' ? 'Submitted'
    : v === 'APPROVED' || v === 'VALIDATED' ? 'Approved'
      : v === 'REVISION_REQUESTED' ? 'Revision'
        : v === 'REJECTED' ? 'Rejected'
          : v === 'PASSED' ? 'Passed'
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
      flex: 0.8,
      cellRenderer: (p) => (
        <span className="inline-flex items-center h-fit font-bold text-xs px-2 py-0.5 rounded-full border bg-primary-50 text-primary-700 border-primary-200 font-mono">
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
      cellRenderer: (p) => (
        <div className="flex items-center h-full">
          <StatusBadge value={p.value} />
        </div>
      )
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

  return (
    <ToastProvider>
      <DashboardToastHandler success={success} error={error} />
      <div className="space-y-6 flex flex-col h-full uppercase-counters">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Institutional Dashboard</h1>
          <p className="text-neutral-500 font-medium text-sm mt-0.5">
            {settings?.semester || '—'}, AY {settings?.academic_year || '—'}
            <span className="font-bold text-neutral-700 ml-1">· Admin Overview</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={refresh}
            disabled={loading}
            className="bg-primary-500 border-primary-500 text-neutral-50 hover:bg-primary-600 hover:text-neutral-50 shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Dashboard
          </Button>
        </div>
      </div>

      {/* Alerts */}
      <div className="shrink-0 space-y-2">
        {error && (
          <Alert variant="destructive" className="border-red-900/50 bg-red-900/10 text-red-700 shadow-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-bold text-xs">{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="border-green-600/50 bg-green-50 text-green-700 shadow-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="font-bold text-xs">{success}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0">

        {/* Overall Completion */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-neutral-50 border border-neutral-200">
                <PieChart className="h-4 w-4 text-primary-600" />
              </div>
              <h3 className="font-bold text-neutral-900 text-sm">Overall Completion</h3>
            </div>
            <span className={`text-2xl font-black ${stats.overall_completion >= 100 ? 'text-success' : 'text-primary-600'}`}>
              {stats.overall_completion || 0}%
            </span>
          </div>
          <div className="relative w-full h-2 bg-neutral-100 border border-neutral-200 rounded-full overflow-hidden shadow-inner">
            <div
              className={`absolute top-0 left-0 h-full transition-all duration-1000 ${stats.overall_completion >= 100 ? 'bg-success' : 'bg-primary-500'}`}
              style={{ width: `${Math.min(stats.overall_completion || 0, 100)}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
            <span className="text-neutral-400">Institutional Submissions Rate</span>
          </div>
        </div>

        {/* Faculty Counters */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-neutral-50 border border-neutral-200">
                <Users className="h-4 w-4 text-primary-600" />
              </div>
              <h3 className="font-bold text-neutral-900 text-sm">Faculty Statistics</h3>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border shadow-sm bg-primary-50 text-primary-600 border-primary-200">
              {stats.total_faculty} Total
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex flex-col">
              <span className="text-3xl font-black text-primary-600 leading-none">{stats.active_faculty}</span>
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">Current Semester Staff</span>
              <p className="text-[9px] text-neutral-400 font-medium mt-0.5 leading-tight">{stats.active_faculty} Faculties within this semester</p>
            </div>
            <div className="h-8 w-px bg-neutral-100 mx-4" />
            <div className="flex flex-col items-end text-right">
              <span className="text-3xl font-black text-neutral-400 leading-none">{stats.inactive_faculty}</span>
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">Other Registered Staff</span>
              <p className="text-[9px] text-neutral-400 font-medium mt-0.5 leading-tight">{stats.inactive_faculty} Faculties who are not within this semester</p>
            </div>
          </div>
        </div>

        {/* Submission Metrics */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5">
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
            <div className="h-8 w-px bg-neutral-100 mx-4" />
            <div className="flex flex-col items-end text-right">
              <span className="text-3xl font-black text-success leading-none">{stats.on_time_rate || 0}%</span>
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">On-Time Rate</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 shrink-0 flex-1">

        {/* Left/Middle: Analytics & Activity (2 columns) */}
        <div className="xl:col-span-2 space-y-6 flex flex-col min-h-0 overflow-auto">

          {/* Requirement Status Breakdown (New) */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col shrink-0">
            <div className="px-5 py-3.5 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary-600" />
              <h3 className="font-bold text-sm text-neutral-900">Requirement Status Breakdown</h3>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {(stats.requirement_breakdown || []).map((req, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-neutral-500">{req.label}</span>
                    <span className={req.progress >= 100 ? 'text-success' : 'text-primary-600'}>{req.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden border border-neutral-100 shadow-inner">
                    <div
                      className={`h-full transition-all duration-1000 ${req.progress >= 100 ? 'bg-success' : 'bg-primary-500'}`}
                      style={{ width: `${req.progress}%` }}
                    />
                  </div>
                </div>
              ))}
              {(!stats.requirement_breakdown || stats.requirement_breakdown.length === 0) && (
                <p className="col-span-2 text-xs text-neutral-400 italic py-2">No active requirements for this semester.</p>
              )}
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm flex flex-col overflow-hidden flex-1 min-h-[400px]">
            <div className="px-5 py-3.5 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary-600" />
              <h3 className="font-bold text-sm text-neutral-900">Institution Activity Log</h3>
            </div>
            <div className="flex-1">
              <DataTable
                rowData={recentActivity}
                columnDefs={recentActivityColDefs}
                className="h-full border-0 shadow-none"
                overlayNoRowsTemplate='<div class="text-neutral-500 text-sm py-8 font-medium text-center"><p>No recent submissions found.</p></div>'
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar: Deadlines & Actions */}
        <div className="space-y-6">

          {/* Upcoming Deadlines (New) */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-warning" />
              <h3 className="font-bold text-sm text-neutral-900">Upcoming Deadlines</h3>
            </div>
            <div className="p-5 space-y-4">
              {(stats.upcoming_deadlines || []).map((dl, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-neutral-100 bg-neutral-50/50 shadow-inner">
                  <div className="p-2 rounded bg-white shadow-sm border border-neutral-100">
                    <Folder className="h-4 w-4 text-neutral-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-neutral-900 truncate">{dl.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={`text-[10px] font-black uppercase px-1.5 py-0 border-none shadow-none ${dl.days_left === 0 ? 'text-red-600 bg-red-50' :
                        dl.days_left <= 2 ? 'text-orange-600 bg-orange-50' :
                          'text-primary-600 bg-primary-50'
                        }`}>
                        {dl.days_left === 0 ? 'Due Today' : `${dl.days_left} Days Left`}
                      </Badge>
                      <span className="text-[10px] text-neutral-400 font-medium">{new Date(dl.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
              {(!stats.upcoming_deadlines || stats.upcoming_deadlines.length === 0) && (
                <div className="text-center py-6 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                  <CheckCircle className="h-10 w-10 text-success mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-neutral-500 font-bold tracking-tight px-4">All deadlines met or none active.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary-600" />
              <h3 className="font-bold text-sm text-neutral-900">Quick Actions</h3>
            </div>
            <div className="p-5 bg-white space-y-3">
              <ActionButton
                icon={CalendarPlus}
                label="Manage Deadlines"
                sub="Modify academic dates & grace periods"
                onClick={() => navigate('/deadlines')}
                color="text-primary-600"
              />
              <ActionButton
                icon={Eye}
                label="Monitoring Center"
                sub="View detailed faculty compliance"
                onClick={() => navigate('/faculty-monitor')}
                color="text-success"
              />
              <ActionButton
                icon={Settings}
                label="Manage Semester"
                sub="Set current period & year"
                onClick={() => navigate('/semester-management')}
                color="text-gold-600"
              />
              <ActionButton
                icon={FileText}
                label="Analyze Reports"
                sub="Download formal datasets"
                onClick={() => navigate('/reports')}
                color="text-blue-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    </ToastProvider>
  );
}

// --- SUB COMPONENTS ---

function ActionButton({ icon: Icon, label, sub, onClick, color, bg }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full p-3 rounded-xl transition-all duration-200 text-left border border-neutral-200 hover:border-primary-200 hover:shadow-sm group bg-white ${bg}`}
    >
      <div className={`mr-4 p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 group-hover:border-primary-200 group-hover:bg-white transition-all shadow-sm`}>
        <Icon className={`${color} h-4 w-4`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-neutral-900 text-sm tracking-tight">{label}</p>
        <p className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest mt-0.5 truncate">{sub}</p>
      </div>
    </button>
  );
}