import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useFacultyAnalytics } from "../hooks/FacultyAnalyticsHook";
import { Loader2, AlertCircle, Clock, CheckCircle, AlertTriangle, Calendar, Filter } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeBalham } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

const customTheme = themeBalham.withParams({
  accentColor: '#3b82f6',
  backgroundColor: '#020617',
  foregroundColor: '#e2e8f0',
  borderColor: '#1e293b',
  headerBackgroundColor: '#0f172a',
  headerTextColor: '#94a3b8',
  oddRowBackgroundColor: '#020617',
  rowHeight: 48,
  headerHeight: 40,
});
export default function FacultyAnalyticsPage() {
  const navigate = useNavigate();
  // Fetch options from hook in real implementation, for now we will use the hook's options
  // but if the hook doesn't export them yet, we need to check.
  // I updated FacultyAnalyticsHook earlier to return `options`.
  const {
    overview,
    timeline,
    history,
    courseAnalytics,
    onTimeStats,
    semester,
    academicYear,
    setTimelineFilter,
    loading,
    error,
    options // Dynamic options
  } = useFacultyAnalytics();

  // State for filters
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const courseColDefs = useMemo(() => [
    { field: "course_code", headerName: "Course Code", width: 140, cellClass: "font-medium text-slate-100" },
    { field: "course_name", headerName: "Course Name", flex: 2, cellClass: "text-slate-300" },
    {
      field: "progress",
      headerName: "Progress",
      flex: 1.5,
      cellRenderer: (p) => {
        const c = p.data;
        const percentage = Math.round((c.submitted_count / c.total_required) * 100) || 0;
        return (
          <div className="flex items-center gap-3 h-full">
            <div className="flex-1 bg-slate-700 rounded-full h-2 w-24 overflow-hidden -mt-1">
              <div
                className={`h-full ${percentage >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <span className="text-xs text-slate-400 -mt-1">{c.submitted_count}/{c.total_required}</span>
          </div>
        );
      }
    },
    {
      field: "status",
      headerName: "Status",
      width: 140,
      cellRenderer: (p) => {
        const c = p.data;
        const pendingCount = Math.max(0, c.total_required - c.submitted_count);
        if (pendingCount === 0) {
          return <span className="px-2 py-1 text-[10px] uppercase font-bold bg-green-500/10 text-green-400 rounded">Completed</span>;
        } else {
          return <span className="px-2 py-1 text-[10px] uppercase font-bold bg-amber-500/10 text-amber-400 rounded">{pendingCount} Pending</span>;
        }
      }
    }
  ], []);

  const historyColDefs = useMemo(() => [
    { field: "doc_type", headerName: "Document", flex: 1.5, cellClass: "font-medium text-slate-100" },
    {
      field: "semester_info",
      headerName: "Semester",
      width: 140,
      valueGetter: (p) => `${p.data.semester} ${p.data.academic_year}`,
      cellClass: "text-slate-300 text-xs"
    },
    {
      field: "updated_at",
      headerName: "Submission Date",
      width: 150,
      cellRenderer: (p) => <span className="text-slate-300 text-xs">{p.value ? new Date(p.value).toLocaleDateString() : '-'}</span>
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      cellRenderer: (p) => {
        const isApproved = p.value === 'APPROVED';
        const isRejected = p.value === 'REJECTED';
        const bg = isApproved ? 'bg-green-500/10 text-green-400' : isRejected ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400';
        return <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${bg}`}>{p.value}</span>;
      }
    },
    {
      field: "file_info",
      headerName: "File Info",
      flex: 1.5,
      cellRenderer: (p) => <span className="text-xs text-slate-400 truncate block w-full">{p.data.original_filename} ({(p.data.file_size_bytes / 1024).toFixed(1)} KB)</span>
    }
  ], []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
        <p className="text-slate-400">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="border-red-900/50 bg-red-900/10 text-red-200">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Calculate strict circumference for circle
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (overview.completion_rate / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">My Analytics</h1>
        <p className="text-slate-400">Track your submission progress and performance</p>
      </div>

      {/* Main Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Progress Card */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
          <h3 className="font-semibold mb-4 text-slate-100">Personal Progress</h3>
          <div className="flex flex-col items-center">
            {/* Circular Progress Ring */}
            <div className="relative mb-4" style={{ width: '120px', height: '120px' }}>
              <svg className="transform -rotate-90" viewBox="0 0 120 120" style={{ width: '120px', height: '120px' }}>
                {/* Background Circle */}
                <circle
                  className="stroke-slate-700"
                  strokeWidth="10"
                  fill="transparent"
                  r={radius}
                  cx="60"
                  cy="60"
                />
                {/* Progress Circle */}
                <circle
                  className="stroke-blue-500 transition-all duration-1000 ease-out"
                  strokeWidth="10"
                  fill="transparent"
                  r={radius}
                  cx="60"
                  cy="60"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-slate-100">{overview.completion_rate}%</span>
              </div>
            </div>
            <p className="text-lg font-medium mb-1 text-slate-100">{overview.submitted_count} of {overview.total_required} documents submitted</p>
            <p className="text-slate-400 text-sm">
              {overview.completion_rate >= overview.dept_average
                ? `You're above the department average (${overview.dept_average}%)`
                : `Department average is ${overview.dept_average}%`
              }
            </p>
          </div>
        </div>

        {/* Submission Timeline Card — with Semester/Year toggle */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            {/* Semester Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <select
                className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[160px]"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                {options?.semesters?.map((sem) => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
                {!options?.semesters?.length && <option value="">Loading...</option>}
              </select>
            </div>

            {/* Academic Year Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <select
                className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[140px]"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {options?.academic_years?.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
                {!options?.academic_years?.length && <option value="">Loading...</option>}
              </select>
            </div>
          </div>
          <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
            {timeline.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-200">{item.label}</span>
                  <span className={`font-medium ${item.status === 'On Time' || item.status === 'Early' ? 'text-green-400' :
                    item.status === 'Late' ? 'text-amber-500' :
                      item.status === 'Submitted' ? 'text-blue-400' : 'text-slate-500'
                    }`}>
                    {item.date ? `${new Date(item.date).toLocaleDateString()} (${item.status})` : `Pending`}
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className={`h-full ${item.status === 'On Time' || item.status === 'Early' ? 'bg-green-500' :
                      item.status === 'Late' ? 'bg-amber-500' :
                        item.status === 'Submitted' ? 'bg-blue-500' : 'bg-slate-700'
                      }`}
                    style={{ width: item.status === 'Pending' ? '15%' : '100%' }}
                  ></div>
                </div>
              </div>
            ))}
            {timeline.length === 0 && (
              <p className="text-slate-500 text-center py-6 bg-slate-900/30 rounded border border-slate-800 border-dashed">No timeline data available for this filter.</p>
            )}
          </div>
        </div>

        {/* On-Time vs Late + Performance Card */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
          <h3 className="font-semibold mb-4 text-slate-100">On-Time vs Late Submissions</h3>

          {/* Stacked Bar */}
          <div className="mb-4">
            <div className="flex h-6 rounded-full overflow-hidden bg-slate-700">
              {onTimeStats.total_count > 0 && (
                <>
                  <div
                    className="bg-emerald-500 transition-all duration-500"
                    style={{ width: `${onTimeStats.on_time_rate}%` }}
                    title={`On Time: ${onTimeStats.on_time_count}`}
                  ></div>
                  <div
                    className="bg-amber-500 transition-all duration-500"
                    style={{ width: `${100 - onTimeStats.on_time_rate}%` }}
                    title={`Late: ${onTimeStats.late_count}`}
                  ></div>
                </>
              )}
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                On Time: {onTimeStats.on_time_count}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                Late: {onTimeStats.late_count}
              </span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-emerald-400">{onTimeStats.on_time_rate}%</p>
              <p className="text-xs text-slate-400 mt-1">On-Time Rate</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">{onTimeStats.total_count}</p>
              <p className="text-xs text-slate-400 mt-1">Total Submitted</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-400">{onTimeStats.late_count}</p>
              <p className="text-xs text-slate-400 mt-1">Late</p>
            </div>
          </div>

          {/* Performance Comparison */}
          <h4 className="font-semibold mb-3 text-slate-200 text-sm">Performance Comparison</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">Your Progress</span>
                <span className="font-medium text-slate-300">{overview.completion_rate}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${overview.completion_rate}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">Department Average</span>
                <span className="font-medium text-slate-300">{overview.dept_average}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-slate-500" style={{ width: `${overview.dept_average}%` }}></div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
            <p className="text-blue-400 text-sm font-medium">
              {overview.completion_rate >= 100
                ? "🎉 Congratulations! You have completed all requirements."
                : overview.completion_rate >= overview.dept_average
                  ? "🚀 You are tracking above the department average. Keep it up!"
                  : "⚠️ You are slightly behind. Check your pending tasks."
              }
            </p>
          </div>
        </div>
      </div>

      {/* Course Completion Breakdown */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md flex flex-col flex-1 min-h-[400px]">
        <div className="p-6 border-b border-slate-800 shrink-0 bg-slate-950/30">
          <h3 className="font-semibold text-lg text-slate-100 mb-0">Course Completion Breakdown</h3>
        </div>
        <div className="flex-1 relative p-0">
          <div className="absolute inset-0">
            <AgGridReact
              theme={customTheme}
              rowData={courseAnalytics || []}
              columnDefs={courseColDefs}
              pagination={true}
              paginationPageSize={10}
              suppressCellFocus={true}
              overlayNoRowsTemplate={`<div class="text-slate-400 text-sm py-8"><p>No course data available.</p></div>`}
            />
          </div>
        </div>
      </div>

      {/* Submission History */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md flex flex-col flex-1 min-h-[400px]">
        <div className="p-6 border-b border-slate-800 shrink-0 bg-slate-950/30">
          <h3 className="font-semibold text-lg text-slate-100 mb-0">Submission History</h3>
        </div>
        <div className="flex-1 relative p-0">
          <div className="absolute inset-0">
            <AgGridReact
              theme={customTheme}
              rowData={history || []}
              columnDefs={historyColDefs}
              pagination={true}
              paginationPageSize={10}
              suppressCellFocus={true}
              overlayNoRowsTemplate={`<div class="text-slate-400 text-sm py-8"><p>No submissions found.</p></div>`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
