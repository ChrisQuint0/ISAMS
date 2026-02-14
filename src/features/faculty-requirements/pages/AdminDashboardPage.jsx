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

// Custom theme using AG Grid v33+ Theming API
const customTheme = themeQuartz.withParams({
  accentColor: '#3b82f6',
  backgroundColor: '#0f172a',
  foregroundColor: '#e2e8f0',
  borderColor: '#1e293b',
  headerBackgroundColor: '#1e293b',
  headerTextColor: '#94a3b8',
  oddRowBackgroundColor: '#0f172a',
  rowHoverColor: '#1e293b',
  inputFocusBorderColor: '#3b82f6',
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
      cellClass: "font-medium text-slate-200"
    },
    {
      field: "department",
      headerName: "Department",
      flex: 1.2,
      filter: true,
      cellClass: "text-slate-400"
    },
    {
      field: "courses_count",
      headerName: "Courses",
      width: 120,
      cellRenderer: (params) => (
        <span className="text-slate-400 bg-slate-800/50 px-2 py-1 rounded text-xs">
          {params.value} courses
        </span>
      )
    },
    {
      field: "progress",
      headerName: "Progress",
      flex: 1.5,
      cellRenderer: (params) => (
        <div className="flex items-center w-full pr-4 gap-3">
          {/* FIX: Used flex-1 so bar takes available space */}
          <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${params.value >= 100 ? 'bg-green-500' :
                params.value >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                }`}
              style={{ width: `${Math.min(params.value, 100)}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-300 w-8 text-right">
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
          'On Track': 'bg-green-500/10 text-green-400 border-green-500/20',
          'At Risk': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          'Delayed': 'bg-red-500/10 text-red-400 border-red-500/20',
          'No Submissions': 'bg-slate-800 text-slate-400 border-slate-700'
        };
        const activeStyle = styles[params.value] || styles['No Submissions'];

        return (
          <span className={`px-2 py-1 rounded-md text-xs font-medium border ${activeStyle} flex items-center justify-center w-fit`}>
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
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-slate-400 hover:text-blue-400 hover:bg-slate-800"
            onClick={() => navigate(`/faculty/${params.data.faculty_id}`)}
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-slate-400 hover:text-amber-400 hover:bg-slate-800"
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
    <div className="space-y-6 h-full flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dean's Dashboard</h1>
          <p className="text-slate-400 text-sm">College-wide overview • Semester 2, AY 2023-2024</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={refresh}
            disabled={loading}
            className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20"
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
          color="text-emerald-400"
          bg="bg-emerald-500/10"
          border="border-emerald-500/20"
        />
        <StatCard
          title="Pending Submissions"
          value={stats.pending_submissions}
          sub="12 days to deadline"
          icon={Clock}
          color="text-amber-400"
          bg="bg-amber-500/10"
          border="border-amber-500/20"
        />
        <StatCard
          title="Validation Queue"
          value={stats.validation_queue}
          sub="Requires attention"
          icon={AlertTriangle}
          color="text-rose-400"
          bg="bg-rose-500/10"
          border="border-rose-500/20"
        />
        <StatCard
          title="On-Time Rate"
          value={`${stats.on_time_rate}%`}
          sub="+5% from last sem"
          icon={CalendarCheck}
          color="text-blue-400"
          bg="bg-blue-500/10"
          border="border-blue-500/20"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">

        {/* Department Progress (Left 2 Columns) */}
        <Card className="lg:col-span-2 bg-slate-900 border-slate-800 shadow-none">
          <CardHeader className="border-b border-slate-800 py-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-medium text-slate-100">Department Progress</CardTitle>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-[180px] h-8 bg-slate-800 border-slate-700 text-xs text-slate-200">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  {departments.map(d => (
                    <SelectItem key={d} value={d} className="focus:bg-slate-300 text-xs">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            {departmentProgress
              .filter(d => selectedDepartment === 'All Departments' || d.department === selectedDepartment)
              .map(d => (
                <div key={d.department} className="group">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300 font-medium">{d.department}</span>
                    <span className="font-bold text-slate-100">{d.progress}%</span>
                  </div>
                  <Progress
                    value={d.progress}
                    className="h-2 bg-slate-800"
                  // Use a more specific selector or style for the indicator if needed, 
                  // but default Shadcn Progress usually handles color via class
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>{d.total_faculty} faculty members</span>
                    <span>{d.faculty_completed} completed</span>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Quick Actions (Right Column) */}
        <Card className="bg-slate-900 border-slate-800 shadow-none h-full">
          <CardHeader className="border-b border-slate-800 py-4">
            <CardTitle className="text-base font-medium text-slate-100">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <ActionButton
                icon={CalendarPlus}
                label="Extend Deadline"
                sub="Modify submission dates"
                onClick={() => navigate('/deadlines')}
                color="text-emerald-400"
                bg="hover:bg-slate-800/80"
              />
              <ActionButton
                icon={CheckCircle}
                label="Review Queue"
                sub={`${stats.validation_queue} pending items`}
                onClick={() => navigate('/validation')}
                color="text-blue-400"
                bg="hover:bg-slate-800/80"
              />
              <ActionButton
                icon={FileText}
                label="Export Report"
                sub="Download status report"
                onClick={() => navigate('/reports')}
                color="text-purple-400"
                bg="hover:bg-slate-800/80"
              />
              <ActionButton
                icon={Bell}
                label="Send Reminders"
                sub="Notify pending faculty"
                onClick={() => { if (window.confirm('Send bulk reminders?')) sendBulkReminders(); }}
                color="text-amber-400"
                bg="hover:bg-slate-800/80"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Faculty Grid - Fills remaining height */}
      <Card className="flex-1 bg-slate-900 border-slate-800 shadow-none flex flex-col min-h-[400px]">
        <CardHeader className="border-b border-slate-800 py-4 shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-base font-medium text-slate-100">Faculty Status Overview</CardTitle>
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search faculty name or department..."
                className="pl-10 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:ring-blue-500/20"
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
    // FIX: Removed 'bg-transparent' to allow color themes to show
    <Card className={`${bg} ${border} border backdrop-blur-sm shadow-none`}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">{value}</p>
          </div>
          <div className={`p-2 rounded-lg bg-slate-950/30 border ${border}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
        {sub && <p className="text-xs text-slate-400 mt-3 font-medium">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function ActionButton({ icon: Icon, label, sub, onClick, color, bg }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full p-3 rounded-lg transition-all duration-200 text-left border border-slate-800 hover:border-slate-700 group ${bg}`}
    >
      <div className={`mr-4 p-2 rounded-md bg-slate-950/50 group-hover:bg-slate-950 transition-colors`}>
        <Icon className={`${color} h-5 w-5`} />
      </div>
      <div className="flex-1 min-w-0"> {/* min-w-0 helps text truncation work */}
        <p className="font-medium text-slate-200 text-sm">{label}</p>
        <p className="text-xs text-slate-500 truncate">{sub}</p>
      </div>
    </button>
  );
}