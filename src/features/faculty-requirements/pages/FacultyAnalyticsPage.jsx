import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useFacultyAnalytics } from "../hooks/FacultyAnalyticsHook";
import { Loader2, AlertCircle, Clock, CheckCircle, AlertTriangle, Calendar, Filter, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DataTable } from "@/components/DataTable"; // Utilizing your standardized wrapper

export default function FacultyAnalyticsPage() {
  const navigate = useNavigate();
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
    {
      field: "course_code",
      headerName: "Course Code",
      width: 140,
      cellRenderer: (p) => <span className="font-mono text-primary-600 font-bold">{p.value}</span>
    },
    {
      field: "course_name",
      headerName: "Course Name",
      flex: 2,
      cellRenderer: (p) => <span className="font-medium text-neutral-900">{p.value}</span>
    },
    {
      field: "progress",
      headerName: "Progress",
      flex: 1.5,
      cellRenderer: (p) => {
        const c = p.data;
        const percentage = Math.round((c.submitted_count / c.total_required) * 100) || 0;
        return (
          <div className="flex items-center gap-3 h-full w-full">
            <div className="flex-1 bg-neutral-100 border border-neutral-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full transition-all ${percentage >= 100 ? 'bg-success' : 'bg-primary-500'}`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-neutral-600 w-8">{c.submitted_count}/{c.total_required}</span>
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
          return <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold bg-success/10 text-success border border-success/20 rounded-full shadow-sm">Completed</span>;
        } else {
          return <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold bg-warning/10 text-warning border border-warning/20 rounded-full shadow-sm">{pendingCount} Pending</span>;
        }
      }
    }
  ], []);

  const historyColDefs = useMemo(() => [
    {
      field: "doc_type",
      headerName: "Document",
      flex: 1.5,
      cellRenderer: (p) => <span className="font-bold text-neutral-900">{p.value}</span>
    },
    {
      field: "semester_info",
      headerName: "Semester",
      width: 140,
      valueGetter: (p) => `${p.data.semester} ${p.data.academic_year}`,
      cellRenderer: (p) => <span className="text-neutral-500 text-xs font-medium">{p.value}</span>
    },
    {
      field: "updated_at",
      headerName: "Submission Date",
      width: 150,
      cellRenderer: (p) => <span className="text-neutral-600 text-xs font-mono font-medium">{p.value ? new Date(p.value).toLocaleDateString() : '-'}</span>
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      cellRenderer: (p) => {
        const isApproved = p.value === 'APPROVED';
        const isRejected = p.value === 'REJECTED';
        const bgClass = isApproved ? 'bg-success/10 text-success border-success/20'
          : isRejected ? 'bg-destructive/10 text-destructive border-destructive/20'
            : 'bg-warning/10 text-warning border-warning/20';
        return <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border shadow-sm ${bgClass}`}>{p.value}</span>;
      }
    },
    {
      field: "file_info",
      headerName: "File Info",
      flex: 1.5,
      cellRenderer: (p) => <span className="text-xs text-neutral-500 font-medium truncate block w-full">{p.data.original_filename} ({(p.data.file_size_bytes / 1024).toFixed(1)} KB)</span>
    }
  ], []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600 mb-4" />
        <p className="text-neutral-500 font-medium">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="border-destructive/30 bg-destructive/5 text-destructive shadow-sm">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="font-medium">{error}</AlertDescription>
      </Alert>
    );
  }

  // Calculate strict circumference for circle
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (overview.completion_rate / 100) * circumference;

  return (
    <div className="space-y-6 flex flex-col h-full bg-neutral-50/30">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-1">My Analytics</h1>
        <p className="text-neutral-500 text-sm font-medium">Track your submission progress and performance</p>
      </div>

      {/* Main Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Personal Progress Card */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 flex flex-col items-center text-center relative overflow-hidden">
          {/* Decorative Background Element */}
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-primary-50 rounded-full blur-2xl opacity-60 pointer-events-none"></div>

          <h3 className="font-bold mb-6 text-neutral-900 w-full text-left flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary-600" /> Personal Progress
          </h3>

          {/* Circular Progress Ring */}
          <div className="relative mb-6" style={{ width: '130px', height: '130px' }}>
            <svg className="transform -rotate-90 drop-shadow-sm" viewBox="0 0 120 120" style={{ width: '130px', height: '130px' }}>
              {/* Background Circle */}
              <circle
                className="stroke-neutral-100"
                strokeWidth="12"
                fill="transparent"
                r={radius}
                cx="60"
                cy="60"
              />
              {/* Progress Circle */}
              <circle
                className={`${overview.completion_rate >= 100 ? 'stroke-success' : 'stroke-primary-500'} transition-all duration-1000 ease-out`}
                strokeWidth="12"
                fill="transparent"
                r={radius}
                cx="60"
                cy="60"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-neutral-900 tracking-tighter">{overview.completion_rate}%</span>
            </div>
          </div>
          <p className="text-sm font-bold mb-1 text-neutral-800 bg-neutral-50 px-3 py-1 rounded-full border border-neutral-200 shadow-sm">
            {overview.submitted_count} of {overview.total_required} documents
          </p>
          <p className="text-neutral-500 text-xs font-medium mt-2">
            {overview.completion_rate >= overview.dept_average
              ? <span className="text-success flex items-center justify-center gap-1"><ArrowRight className="h-3 w-3 -rotate-45" /> Above dept average ({overview.dept_average}%)</span>
              : `Department average is ${overview.dept_average}%`
            }
          </p>
        </div>

        {/* Submission Timeline Card */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 flex flex-col">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
            <h3 className="font-bold text-neutral-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary-600" /> Timeline
            </h3>
            <div className="flex gap-2 w-full sm:w-auto">
              {/* Semester Filter */}
              <div className="relative flex-1 sm:flex-none">
                <Calendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                <select
                  className="w-full pl-8 pr-6 py-1.5 bg-white border border-neutral-200 rounded-md text-xs text-neutral-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none shadow-sm cursor-pointer"
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
              <div className="relative flex-1 sm:flex-none">
                <Filter className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                <select
                  className="w-full pl-8 pr-6 py-1.5 bg-white border border-neutral-200 rounded-md text-xs text-neutral-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none shadow-sm cursor-pointer"
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
          </div>

          <div className="space-y-4 max-h-[220px] overflow-y-auto pr-3 custom-scrollbar flex-1">
            {timeline.map((item, index) => (
              <div key={index} className="group">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-neutral-700 font-bold group-hover:text-primary-700 transition-colors">{item.label}</span>
                  <span className={`font-bold ${item.status === 'On Time' || item.status === 'Early' ? 'text-success' :
                    item.status === 'Late' ? 'text-warning' :
                      item.status === 'Submitted' ? 'text-info' : 'text-neutral-400'
                    }`}>
                    {item.date ? `${new Date(item.date).toLocaleDateString()} (${item.status})` : `Pending`}
                  </span>
                </div>
                <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/50 shadow-inner">
                  <div
                    className={`h-full transition-all ${item.status === 'On Time' || item.status === 'Early' ? 'bg-success' :
                      item.status === 'Late' ? 'bg-warning' :
                        item.status === 'Submitted' ? 'bg-info' : 'bg-neutral-200'
                      }`}
                    style={{ width: item.status === 'Pending' ? '15%' : '100%' }}
                  ></div>
                </div>
              </div>
            ))}
            {timeline.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-neutral-400 space-y-2 py-8 bg-neutral-50/50 rounded-lg border border-dashed border-neutral-200">
                <Calendar className="h-6 w-6 opacity-50" />
                <p className="text-xs font-medium">No timeline data available.</p>
              </div>
            )}
          </div>
        </div>

        {/* On-Time vs Late + Performance Card */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold mb-5 text-neutral-900 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary-600" /> Submission Habits
            </h3>

            {/* Stacked Bar */}
            <div className="mb-5">
              <div className="flex h-5 rounded-full overflow-hidden bg-neutral-100 border border-neutral-200 shadow-inner">
                {onTimeStats.total_count > 0 && (
                  <>
                    <div
                      className="bg-success transition-all duration-500 hover:brightness-110"
                      style={{ width: `${onTimeStats.on_time_rate}%` }}
                      title={`On Time: ${onTimeStats.on_time_count}`}
                    ></div>
                    <div
                      className="bg-warning transition-all duration-500 hover:brightness-110"
                      style={{ width: `${100 - onTimeStats.on_time_rate}%` }}
                      title={`Late: ${onTimeStats.late_count}`}
                    ></div>
                  </>
                )}
              </div>
              <div className="flex justify-between mt-2 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-success inline-block shadow-sm"></span>
                  On Time: {onTimeStats.on_time_count}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-warning inline-block shadow-sm"></span>
                  Late: {onTimeStats.late_count}
                </span>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-neutral-50 border border-neutral-100 rounded-lg p-3 text-center shadow-sm">
                <p className="text-xl font-black text-success">{onTimeStats.on_time_rate}%</p>
                <p className="text-[10px] font-bold text-neutral-500 mt-1 uppercase tracking-wider">On-Time</p>
              </div>
              <div className="bg-neutral-50 border border-neutral-100 rounded-lg p-3 text-center shadow-sm">
                <p className="text-xl font-black text-info">{onTimeStats.total_count}</p>
                <p className="text-[10px] font-bold text-neutral-500 mt-1 uppercase tracking-wider">Total</p>
              </div>
              <div className="bg-neutral-50 border border-neutral-100 rounded-lg p-3 text-center shadow-sm">
                <p className="text-xl font-black text-warning">{onTimeStats.late_count}</p>
                <p className="text-[10px] font-bold text-neutral-500 mt-1 uppercase tracking-wider">Late</p>
              </div>
            </div>
          </div>

          {/* Performance Comparison */}
          <div className="bg-info/5 border border-info/20 rounded-lg p-4">
            <h4 className="font-bold mb-3 text-info text-xs uppercase tracking-wider">Performance Benchmarks</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-info">Your Progress</span>
                  <span className="text-info">{overview.completion_rate}%</span>
                </div>
                <div className="h-1.5 bg-info/20 rounded-full overflow-hidden">
                  <div className="h-full bg-info" style={{ width: `${overview.completion_rate}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-neutral-500">Department Average</span>
                  <span className="text-neutral-500">{overview.dept_average}%</span>
                </div>
                <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                  <div className="h-full bg-neutral-400" style={{ width: `${overview.dept_average}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Completion Breakdown */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm flex flex-col flex-1 min-h-[400px] overflow-hidden">
        <div className="p-5 border-b border-neutral-100 bg-neutral-50/50 shrink-0">
          <h3 className="font-bold text-base text-neutral-900 mb-0">Course Completion Breakdown</h3>
        </div>
        <div className="p-4 flex-1">
          <DataTable
            rowData={courseAnalytics || []}
            columnDefs={courseColDefs}
            className="h-full border-0 shadow-none"
            overlayNoRowsTemplate='<span style="color:var(--neutral-500);font-style:italic;font-weight:500;">No course data available.</span>'
          />
        </div>
      </div>

      {/* Submission History */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm flex flex-col flex-1 min-h-[400px] overflow-hidden mb-6">
        <div className="p-5 border-b border-neutral-100 bg-neutral-50/50 shrink-0">
          <h3 className="font-bold text-base text-neutral-900 mb-0">Submission History</h3>
        </div>
        <div className="p-4 flex-1">
          <DataTable
            rowData={history || []}
            columnDefs={historyColDefs}
            className="h-full border-0 shadow-none"
            overlayNoRowsTemplate='<span style="color:var(--neutral-500);font-style:italic;font-weight:500;">No submissions found.</span>'
          />
        </div>
      </div>
    </div>
  );
}