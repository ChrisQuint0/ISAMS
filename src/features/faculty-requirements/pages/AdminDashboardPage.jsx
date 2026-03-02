import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);
import {
  PieChart, Clock, AlertTriangle, CalendarCheck, CheckCircle,
  Bell, Search, Mail, Eye, CalendarPlus, FileText, Download, AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

// Custom Hook
import { useAdminDashboard } from '../hooks/AdminDashboardHook';

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

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');

  const {
    loading,
    error,
    success,
    stats,
    departmentProgress,
    facultyStatus,
    settings,
    refresh,
    sendBulkReminders,
    sendIndividualReminder
  } = useAdminDashboard();


  // Filter Logic
  const filteredFaculty = useMemo(() => {
    let result = facultyStatus || [];
    if (selectedDepartment !== 'All Departments') {
      result = result.filter(f => f.department === selectedDepartment);
    }
    if (searchText) {
      const lower = searchText.toLowerCase();
      result = result.filter(f =>
        f.name.toLowerCase().includes(lower) || f.department.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [facultyStatus, selectedDepartment, searchText]);

  const departments = ['All Departments', ...new Set(facultyStatus?.map(f => f.department) || [])];

  // Grid Definitions
  const colDefs = useMemo(() => [
    {
      field: "name",
      headerName: "Faculty Name",
      flex: 1.5,
      filter: true,
      cellClass: "font-semibold text-neutral-900"
    },
    {
      field: "department",
      headerName: "Department",
      flex: 1.2,
      filter: true,
      cellClass: "text-neutral-500 font-medium"
    },
    {
      field: "courses_count",
      headerName: "Courses",
      width: 120,
      cellRenderer: (params) => (
        <span className="text-neutral-600 bg-neutral-100 px-2 py-0.5 border border-neutral-200 rounded text-[10px] font-bold">
          {params.value} COURSES
        </span>
      )
    },
    {
      field: "progress",
      headerName: "Progress",
      flex: 1.5,
      cellRenderer: (params) => (
        <div className="flex items-center w-full pr-4 gap-3">
          <div className="flex-1 bg-neutral-100 rounded-full h-1.5 overflow-hidden border border-neutral-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${params.value >= 100 ? 'bg-primary-600' :
                params.value >= 50 ? 'bg-info' : 'bg-warning'
                }`}
              style={{ width: `${Math.min(params.value, 100)}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-neutral-900 w-8 text-right">
            {params.value.toFixed(0)}%
          </span>
        </div>
      )
    },
    {
      field: "status",
      headerName: "Status",
      width: 140,
      cellRenderer: (params) => {
        const styles = {
          'On Track': 'bg-success/10 text-success border-success/20',
          'At Risk': 'bg-warning/10 text-warning border-warning/20',
          'Delayed': 'bg-destructive-semantic/10 text-destructive-semantic border-destructive-semantic/20',
          'No Submissions': 'bg-neutral-100 text-neutral-500 border-neutral-200'
        };
        const activeStyle = styles[params.value] || styles['No Submissions'];

        return (
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${activeStyle} flex items-center justify-center w-fit`}>
            {params.value}
          </span>
        );
      }
    },
    {
      headerName: "Actions",
      field: "actions",
      width: 100,
      sortable: false,
      filter: false,
      cellRenderer: (params) => (
        <div className="flex gap-1 items-center h-full">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-neutral-400 hover:text-primary-600 hover:bg-primary-600/10"
            onClick={() => navigate(`/faculty/${params.data.faculty_id}`)}
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-neutral-400 hover:text-gold-600 hover:bg-gold-500/10"
            onClick={() => sendIndividualReminder(params.data)}
            title="Send Reminder"
          >
            <Mail className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ], [sendIndividualReminder, navigate]);

  return (
    <div className="space-y-6 flex flex-col h-full bg-neutral-50">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Dean's Dashboard</h1>
          <p className="text-neutral-500 text-sm font-medium">College-wide overview • {settings?.semester || 'Loading...'}, AY {settings?.academic_year || '...'}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={refresh}
            disabled={loading}
            className="bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-primary-600 shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Button
            className="bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-emerald-900/10 transition-all font-bold"
            onClick={() => window.print()}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Alerts */}
      <div className="shrink-0">
        {error && (
          <Alert variant="destructive" className="border-red-900/50 bg-red-900/10 text-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="border-green-900/50 bg-green-900/10 text-green-200">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <StatCard
          title="Overall Completion"
          value={`${stats.overall_completion}%`}
          icon={PieChart}
          color="text-primary-600"
          bg="bg-white"
          border="border-neutral-200"
        />
        <StatCard
          title="Pending Submissions"
          value={stats.pending_submissions}
          sub="12 days to institutional deadline"
          icon={Clock}
          color="text-neutral-500"
          bg="bg-white"
          border="border-neutral-200"
        />
        <StatCard
          title="Validation Queue"
          value={stats.validation_queue}
          sub="Items requiring dean audit"
          icon={AlertTriangle}
          color="text-warning"
          bg="bg-white"
          border="border-neutral-200"
        />
        <StatCard
          title="On-Time Rate"
          value={`${stats.on_time_rate}%`}
          sub="+5% from last academic semester"
          icon={CheckCircle}
          color="text-success"
          bg="bg-white"
          border="border-neutral-200"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">

        {/* Department Progress (Left 2 Columns) */}
        <Card className="lg:col-span-2 bg-white border-neutral-200 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-neutral-100 py-4 bg-neutral-50/50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-bold text-neutral-900 uppercase tracking-tight">Department Progress</CardTitle>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-[180px] h-8 bg-white border-neutral-200 text-xs text-neutral-900 font-semibold shadow-sm focus:ring-primary-500/20">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="bg-white border-neutral-200 text-neutral-900">
                  {departments.map(d => (
                    <SelectItem key={d} value={d} className="focus:bg-neutral-100 text-xs font-medium">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6 bg-white">
            {departmentProgress
              .filter(d => selectedDepartment === 'All Departments' || d.department === selectedDepartment)
              .map(d => (
                <div key={d.department} className="group">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-700 font-bold">{d.department}</span>
                    <span className="font-extrabold text-primary-600">{d.progress}%</span>
                  </div>
                  <Progress
                    value={d.progress}
                    className="h-2 bg-neutral-100 border border-neutral-200 shadow-inner"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400 mt-1 uppercase font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>{d.total_faculty} Faculty Members</span>
                    <span>{d.faculty_completed} Validated</span>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Quick Actions (Right Column) */}
        <Card className="bg-white border-neutral-200 shadow-sm h-full overflow-hidden">
          <CardHeader className="border-b border-neutral-100 py-4 bg-neutral-50/50">
            <CardTitle className="text-base font-bold text-neutral-900 uppercase tracking-tight">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 bg-white">
            <div className="space-y-3">
              <ActionButton
                icon={CalendarPlus}
                label="Extend Deadline"
                sub="Modify academic dates"
                onClick={() => navigate('/deadlines')}
                color="text-primary-600"
                bg="hover:bg-neutral-50"
              />
              <ActionButton
                icon={CheckCircle}
                label="Review Queue"
                sub={`${stats.validation_queue} Pending items`}
                onClick={() => navigate('/validation')}
                color="text-info"
                bg="hover:bg-neutral-50"
              />
              <ActionButton
                icon={FileText}
                label="Export Report"
                sub="Download GSDS report"
                onClick={() => navigate('/reports')}
                color="text-gold-600"
                bg="hover:bg-neutral-50"
              />
              <ActionButton
                icon={Bell}
                label="Send Reminders"
                sub="Notify pending faculty"
                onClick={() => { if (window.confirm('Send bulk reminders?')) sendBulkReminders(); }}
                color="text-warning"
                bg="hover:bg-neutral-50"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Faculty Grid - Fills remaining height */}
      <Card className="flex-1 bg-white border-neutral-200 shadow-sm flex flex-col min-h-[400px] overflow-hidden">
        <CardHeader className="border-b border-neutral-100 py-4 shrink-0 bg-neutral-50/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-base font-bold text-neutral-900 uppercase tracking-tight">Faculty Status Overview</CardTitle>
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 group-focus-within:text-primary-600 transition-colors" />
              <Input
                placeholder="Search faculty name or department..."
                className="pl-10 bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-primary-500 focus-visible:border-primary-500 transition-all font-medium"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 relative">
          {/* FIX: Absolute positioning + w/h-full ensures grid takes exactly the available space */}
          <div className="absolute inset-0">
            <AgGridReact
              theme={customTheme}
              rowData={filteredFaculty}
              columnDefs={colDefs}
              pagination={true}
              paginationPageSize={20}
              loading={loading}
              suppressCellFocus={true}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- SUB COMPONENTS ---

function StatCard({ title, value, sub, icon: Icon, color, bg, border }) {
  return (
    <Card className={`${bg} ${border} shadow-sm border-neutral-200 transition-all hover:shadow-md`}>
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
        {sub && <p className="text-[10px] text-neutral-400 mt-3 font-bold uppercase tracking-tight">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function ActionButton({ icon: Icon, label, sub, onClick, color, bg }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full p-3 rounded-lg transition-all duration-200 text-left border border-neutral-100 hover:border-primary-200 hover:shadow-sm group bg-neutral-50/30 ${bg}`}
    >
      <div className={`mr-4 p-2 rounded-md bg-white border border-neutral-200 group-hover:border-primary-100 transition-all shadow-xs`}>
        <Icon className={`${color} h-5 w-5`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-neutral-900 text-sm tracking-tight">{label}</p>
        <p className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-wider truncate">{sub}</p>
      </div>
    </button>
  );
}