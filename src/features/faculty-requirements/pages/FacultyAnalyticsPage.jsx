import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFacultyAnalytics } from "../hooks/FacultyAnalyticsHook";
import {
  RefreshCw, AlertCircle, Clock, CheckCircle, AlertTriangle,
  Calendar, Filter, ArrowRight, BookOpen, History,
  FileX, Star, Upload
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import { useToast, ToastProvider } from "@/components/ui/toast/toaster";

// ─── Deadline countdown helper (matches FacultyDashboardPage exactly) ──────────
function getDaysLeft(dateStr, graceDays = 0) {
  if (!dateStr) return { label: 'No deadline set', urgent: false, overdue: false, grace: false };
  const [y, m, d] = dateStr.split('-').map(Number);
  const due = new Date(y, m - 1, d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.floor((due - today) / 86400000);
  if (diff === 0) return { label: 'Due today', urgent: true, overdue: false, grace: false };
  if (diff === 1) return { label: 'Due tomorrow', urgent: true, overdue: false, grace: false };
  if (diff > 0) return { label: `${diff}d left`, urgent: diff <= 3, overdue: false, grace: false };
  // Deadline passed — check grace window
  const cutoff = new Date(due); cutoff.setDate(cutoff.getDate() + graceDays);
  const gDiff = Math.floor((cutoff - today) / 86400000);
  if (gDiff >= 0) return { label: `Grace: ${gDiff}d left`, urgent: true, overdue: false, grace: true };
  return { label: `${Math.abs(diff)}d overdue`, urgent: false, overdue: true, grace: false };
}

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
    options
  } = useFacultyAnalytics();
  const { addToast } = useToast();

  // State for filters
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  // Sync internal filter state with active term from options
  useEffect(() => {
    if (options?.currentAcademicYear && !selectedYear) {
      setSelectedYear(options.currentAcademicYear);
      setTimelineFilter(selectedSemester || null, options.currentAcademicYear);
    }
    if (options?.currentSemester && !selectedSemester) {
      setSelectedSemester(options.currentSemester);
      setTimelineFilter(options.currentSemester, selectedYear || options.currentAcademicYear || null);
    }
  }, [options]);

  // Dynamically filter semesters based on selected academic year
  const filteredSemestersList = useMemo(() => {
    if (!selectedYear || !options?.semesterPeriods?.length) return options?.semesters || [];
    return options.semesterPeriods
      .filter(p => p.academic_year === selectedYear)
      .map(p => ({ semester: p.semester, status: p.status }));
  }, [options, selectedYear]);

  // Handle errors via toast
  useEffect(() => {
    if (error) {
      addToast({
        variant: "destructive",
        title: "Error fetching analytics",
        description: error,
      });
    }
  }, [error]);

  const handleSemesterChange = (val) => {
    setSelectedSemester(val);
    setTimelineFilter(val || null, selectedYear || null);
  };

  const handleYearChange = (val) => {
    setSelectedYear(val);
    setTimelineFilter(selectedSemester || null, val || null);
  };

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
      cellRenderer: (p) => <span className="font-bold text-neutral-900 truncate">{p.value}</span>
    },
    {
      field: "progress",
      headerName: "Progress",
      flex: 1.5,
      cellRenderer: (p) => {
        const c = p.data;
        const percentage = Math.round((c.submitted_count / c.total_required) * 100) || 0;
        return (
          <div className="flex items-center gap-3 h-full w-full pr-4">
            <div className="flex-1 bg-neutral-100 border border-neutral-200 rounded-full h-2 overflow-hidden shadow-inner">
              <div
                className={`h-full transition-all duration-500 ease-out ${percentage >= 100 ? 'bg-success' : 'bg-primary-500'}`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <span className="text-[10px] font-black text-neutral-600 w-8 text-right">{c.submitted_count}/{c.total_required}</span>
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
          return <Badge className="font-bold text-xs px-2 py-0.5 rounded-full border bg-success/10 text-success border-success/20 shadow-none">Completed</Badge>;
        } else {
          return <Badge className="font-bold text-xs px-2 py-0.5 rounded-full border bg-warning/10 text-warning border-warning/20 shadow-none">{pendingCount} Pending</Badge>;
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
      cellRenderer: (p) => <span className="text-neutral-500 text-xs font-medium">{p.value ? new Date(p.value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</span>
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      cellRenderer: (p) => {
        const status = p.value || 'SUBMITTED';
        const isApproved = status === 'APPROVED' || status === 'VALIDATED';
        const isRejected = status === 'REJECTED' || status === 'REVISION_REQUESTED';
        const isLate = p.data.is_late || p.data.is_submitted_late; 

        if (isApproved) {
          return (
            <div className="flex items-center h-full">
              <Badge className={`font-bold text-xs px-2 py-0.5 rounded-full border shadow-none ${isLate ? 'bg-warning/10 text-warning border-warning/20' : 'bg-success/10 text-success border-success/20'}`}>
                {isLate ? 'Late & Approved' : 'Approved'}
              </Badge>
            </div>
          );
        }

        if (isRejected) {
          return (
            <div className="flex items-center h-full">
              <Badge className="font-bold text-xs px-2 py-0.5 rounded-full border shadow-none bg-destructive/10 text-destructive border-destructive/20">
                Rejected
              </Badge>
            </div>
          );
        }

        // Default: Show Punctuality as the main status
        return (
          <div className="flex items-center h-full">
            <Badge className={`font-bold text-xs px-2 py-0.5 rounded-full border shadow-none ${isLate ? 'bg-warning/10 text-warning border-warning/20' : 'bg-success/10 text-success border-success/20'}`}>
              {isLate ? 'Late' : 'Submitted'}
            </Badge>
          </div>
        );
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
      <div className="flex flex-col items-center justify-center h-full gap-4 min-h-[400px]">
        <RefreshCw className="h-8 w-8 text-primary-600 animate-spin" />
        <p className="font-bold text-neutral-400 uppercase tracking-widest text-[10px]">Loading Analytics...</p>
      </div>
    );
  }

  // Removed inline error Alert to use Toast instead

  // Calculate strict circumference for circle
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (overview.completion_rate / 100) * circumference;

  return (
    <ToastProvider>
    <div className="space-y-6 flex flex-col h-full bg-neutral-50/30">

      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">My Analytics</h1>
        <p className="text-neutral-500 text-sm font-medium">Track your submission progress and performance</p>
      </div>

      {/* Global Filter Widget */}
      <Card className="bg-white border-neutral-200 shadow-sm shrink-0 overflow-hidden">
        <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-3.5 px-4">
          <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary-600" />
            Filter Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 bg-white">
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex flex-col md:flex-row flex-wrap gap-3 items-start md:items-end shadow-sm">
            <div className="flex-[1.5] space-y-1 w-full min-w-[200px]">
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-0.5">Academic Year</label>
              <Select value={selectedYear} onValueChange={handleYearChange}>
                <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs focus:ring-primary-500/20 font-medium">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent className="bg-white border-neutral-200 text-neutral-900">
                  {options?.academic_years?.map(year => {
                    const isActive = year === options?.currentAcademicYear;
                    return (
                      <SelectItem key={year} value={year} className="font-medium text-xs">
                        <span className="flex items-center gap-2">
                          {year}
                          {isActive && (
                             <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20">
                               Active
                             </span>
                          )}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-[1.5] space-y-1 w-full min-w-[200px]">
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-0.5">Semester</label>
              <Select value={selectedSemester} onValueChange={handleSemesterChange}>
                <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs focus:ring-primary-500/20 font-medium">
                  <SelectValue placeholder="All Semesters" />
                </SelectTrigger>
                <SelectContent className="bg-white border-neutral-200 text-neutral-900">
                  {filteredSemestersList.map(item => {
                    const sem = typeof item === 'string' ? item : item.semester;
                    const status = typeof item === 'object' ? item.status : null;
                    const isActive = status === 'Active' || (sem === options?.currentSemester && selectedYear === options?.currentAcademicYear);
                    return (
                      <SelectItem key={sem} value={sem} className="font-medium text-xs">
                        <span className="flex items-center gap-2">
                          {sem}
                          {isActive && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20">
                              Active
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">

        {/* Personal Progress Card */}
        <Card className="bg-white border-neutral-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow relative">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-primary-50 rounded-full blur-2xl opacity-60 pointer-events-none"></div>
          <CardHeader className="bg-neutral-50/50 border-b border-neutral-200 py-3.5 px-4 shrink-0 z-10">
            <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary-600" /> Personal Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center flex-1 z-10">
            <div className="relative mb-6" style={{ width: '130px', height: '130px' }}>
              <svg className="transform -rotate-90 drop-shadow-sm" viewBox="0 0 120 120" style={{ width: '130px', height: '130px' }}>
                <circle className="stroke-neutral-100" strokeWidth="12" fill="transparent" r={radius} cx="60" cy="60" />
                <circle
                  className={`${overview.completion_rate >= 100 ? 'stroke-success' : 'stroke-primary-500'} transition-all duration-1000 ease-out`}
                  strokeWidth="12" fill="transparent" r={radius} cx="60" cy="60"
                  strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-neutral-900 tracking-tighter">{overview.completion_rate}%</span>
              </div>
            </div>
            <Badge variant="outline" className="mb-3 bg-neutral-50 text-neutral-800 border-neutral-200 shadow-sm text-xs py-1 px-3">
              {overview.submitted_count} of {overview.total_required} documents
            </Badge>
            <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mt-1">
              {overview.completion_rate >= overview.dept_average
                ? <span className="text-success flex items-center justify-center gap-1"><ArrowRight className="h-3 w-3 -rotate-45" /> Above faculty average ({overview.dept_average}%)</span>
                : `Overall faculty average is ${overview.dept_average}%`
              }
            </p>
          </CardContent>
        </Card>

        {/* Submission Timeline Card */}
        <Card className="bg-white border-neutral-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <CardHeader className="bg-neutral-50/50 border-b border-neutral-200 py-3.5 px-4 shrink-0">
            <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-info" /> Dynamic Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex-1 flex flex-col min-h-0">
            <div className="space-y-4 max-h-[240px] overflow-y-auto pr-3 custom-scrollbar flex-1">
              {timeline.map((item, index) => {
                const total = item.total_courses ?? 1;
                const submitted = item.submitted_courses ?? (item.status === 'Pending' ? 0 : total);
                const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;
                const isComplete = submitted >= total && total > 0;
                const barColor = isComplete ? 'bg-success' : (submitted > 0 ? 'bg-warning' : 'bg-neutral-300');

                return (
                  <div key={index} className="group">
                    <div className="flex justify-between items-center text-xs mb-1.5 gap-2">
                      <span className="text-neutral-700 font-bold group-hover:text-primary-700 transition-colors truncate">{item.label}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* X/Y counter */}
                        <span className="text-[10px] font-black text-neutral-400 tabular-nums">
                          {submitted}/{total}
                        </span>
                        {/* Status badge */}
                        {isComplete ? (
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-success/10 text-success border border-success/20">Completed</span>
                        ) : submitted > 0 ? (
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20">Partial</span>
                        ) : (
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-400 border border-neutral-200">Pending</span>
                        )}
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/50 shadow-inner">
                      <div
                        className={`h-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.max(pct, submitted > 0 ? 8 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {timeline.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-neutral-400 space-y-3 py-8 bg-neutral-50/50 rounded-xl border border-dashed border-neutral-200">
                  <div className="p-3 bg-white rounded-full shadow-sm border border-neutral-100">
                    <Calendar className="h-5 w-5 text-neutral-300" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest">No timeline data available.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* On-Time vs Late + Performance Card */}
        <Card className="bg-white border-neutral-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <CardHeader className="bg-neutral-50/50 border-b border-neutral-200 py-3.5 px-4 shrink-0">
            <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" /> Submission Habits
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex-1 flex flex-col justify-between">
            {/* Stacked Bar */}
            <div className="mb-6">
              <div className="flex h-3.5 rounded-full overflow-hidden bg-neutral-100 border border-neutral-200 shadow-inner mb-2.5">
                {onTimeStats.total_count > 0 && (
                  <>
                    <div className="bg-success transition-all duration-500 hover:brightness-110" style={{ width: `${onTimeStats.on_time_rate}%` }} title={`On Time: ${onTimeStats.on_time_count}`}></div>
                    <div className="bg-warning transition-all duration-500 hover:brightness-110" style={{ width: `${100 - onTimeStats.on_time_rate}%` }} title={`Late: ${onTimeStats.late_count}`}></div>
                  </>
                )}
              </div>
              <div className="flex justify-between text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success inline-block shadow-sm"></span>
                  On Time: {onTimeStats.on_time_count}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning inline-block shadow-sm"></span>
                  Late: {onTimeStats.late_count}
                </span>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-center shadow-inner">
                <p className="text-xl font-black text-success tracking-tight">{onTimeStats.on_time_rate}%</p>
                <p className="text-[9px] font-black text-neutral-400 mt-1 uppercase tracking-widest">On-Time</p>
              </div>
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-center shadow-inner">
                <p className="text-xl font-black text-primary-600 tracking-tight">{onTimeStats.total_count}</p>
                <p className="text-[9px] font-black text-neutral-400 mt-1 uppercase tracking-widest">Total</p>
              </div>
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-center shadow-inner">
                <p className="text-xl font-black text-warning tracking-tight">{onTimeStats.late_count}</p>
                <p className="text-[9px] font-black text-neutral-400 mt-1 uppercase tracking-widest">Late</p>
              </div>
            </div>

            {/* Performance Comparison */}
            <div className="bg-info/5 border border-info/20 rounded-xl p-4 shadow-sm mt-auto">
              <h4 className="font-black mb-3 text-info text-[10px] uppercase tracking-widest">Performance Benchmarks</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                    <span className="text-info tracking-wider">Your Progress</span>
                    <span className="text-info font-black">{overview.completion_rate}%</span>
                  </div>
                  <div className="h-1.5 bg-info/20 rounded-full overflow-hidden">
                    <div className="h-full bg-info" style={{ width: `${overview.completion_rate}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                    <span className="text-neutral-500 tracking-wider">Dept Average</span>
                    <span className="text-neutral-500 font-black">{overview.dept_average}%</span>
                  </div>
                  <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                    <div className="h-full bg-neutral-400" style={{ width: `${overview.dept_average}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Pending Documents ───────────────────────────────────────────────────── */}

        {/* Pending Documents Card */}
        {(() => {
          // Include ALL non-fully-submitted document types — including overdue ones
          const pending = timeline.filter(t => t.status === 'Pending');

          // Total missing files = sum of (total_courses - submitted_courses) for each pending type
          const totalMissingFiles = pending.reduce((acc, item) => {
            const total = item.total_courses ?? 0;
            const submitted = item.submitted_courses ?? 0;
            return acc + Math.max(0, total - submitted);
          }, 0);

          return (
            <Card className="bg-white border-neutral-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <CardHeader className="bg-neutral-50/50 border-b border-neutral-200 py-3.5 px-4 shrink-0">
                <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <FileX className="h-4 w-4 text-destructive" /> Pending Documents
                  {totalMissingFiles > 0 && (
                    <span className="ml-auto text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                      {totalMissingFiles} missing
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-col justify-between flex-1 gap-4">
                {pending.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center gap-3 bg-success/5 rounded-xl border border-success/20 flex-1">
                    <CheckCircle className="h-8 w-8 text-success" />
                    <div>
                      <p className="font-black text-success text-sm">All documents submitted!</p>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">You are fully compliant for this period.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-2.5">
                      {pending.map((item, i) => {
                        const { label, urgent, overdue, grace } = getDaysLeft(item.deadline_date, item.grace_period_days || 0);
                        const missingCount = Math.max(0, (item.total_courses ?? 0) - (item.submitted_courses ?? 0));
                        const deadlineFmt = item.deadline_date
                          ? (() => { const [y,m,d] = item.deadline_date.split('-').map(Number); return new Date(y, m-1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); })()
                          : null;
                        return (
                          <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            overdue ? 'bg-destructive/5 border-destructive/20' :
                            grace   ? 'bg-warning/5 border-warning/20' :
                            urgent  ? 'bg-warning/5 border-warning/20' :
                            'bg-success/5 border-success/20'
                          }`}>
                            <div className={`p-1.5 rounded border bg-white shrink-0 ${
                              overdue ? 'border-destructive/30' : (grace || urgent) ? 'border-warning/30' : 'border-success/30'
                            }`}>
                              <Clock className={`h-4 w-4 ${
                                overdue ? 'text-destructive' : (grace || urgent) ? 'text-warning' : 'text-success'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-neutral-900 truncate">{item.label}</p>
                              <p className="text-[10px] font-medium mt-0.5">
                                {deadlineFmt && (
                                  <span className="text-neutral-400">
                                    {grace ? 'Grace period — ' : ''}{deadlineFmt} deadline ·{' '}
                                  </span>
                                )}
                                <span className={overdue ? 'text-destructive font-bold' : 'text-neutral-500'}>
                                  {missingCount} course{missingCount !== 1 ? 's' : ''} pending
                                </span>
                              </p>
                            </div>
                            <span className={`text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                              overdue ? 'text-destructive' : (grace || urgent) ? 'text-warning' : 'text-success'
                            }`}>
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <Button
                      onClick={() => navigate('/faculty-requirements/submission')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs transition-all active:scale-95 shadow-sm"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Submit Documents
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })()}


      {/* Course Completion Breakdown Table */}
      <Card className="bg-white border-neutral-200 shadow-sm flex-1 flex flex-col min-h-[350px] overflow-hidden">
        <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-3.5 px-5 shrink-0">
          <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary-600" /> Course Completion Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 relative bg-white">
          <DataTable
            rowData={courseAnalytics || []}
            columnDefs={courseColDefs}
            className="h-full border-0 rounded-none shadow-none"
            overlayNoRowsTemplate='<div class="text-[10px] font-black uppercase tracking-widest text-neutral-400 p-8 text-center">No course data available.</div>'
          />
        </CardContent>
      </Card>

      {/* Submission History Table */}
      <Card className="bg-white border-neutral-200 shadow-sm flex-1 flex flex-col min-h-[350px] overflow-hidden">
        <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-3.5 px-5 shrink-0">
          <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <History className="h-4 w-4 text-primary-600" /> Submission History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 relative bg-white">
          <DataTable
            rowData={history || []}
            columnDefs={historyColDefs}
            className="h-full border-0 rounded-none shadow-none"
            overlayNoRowsTemplate='<div class="text-[10px] font-black uppercase tracking-widest text-neutral-400 p-8 text-center">No submissions found.</div>'
          />
        </CardContent>
      </Card>

    </div>
    </ToastProvider>
  );
}