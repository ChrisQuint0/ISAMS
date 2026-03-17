import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFacultyAnalytics } from "../hooks/FacultyAnalyticsHook";
import {
  RefreshCw, AlertCircle, Clock, CheckCircle, AlertTriangle,
  Calendar, Filter, ArrowRight, BookOpen, History
} from "lucide-react";

// UI Components
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import { useToast } from "@/components/ui/toast/toaster";

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
  const { addToast: toast } = useToast();

  // State for filters
  const [selectedSemester, setSelectedSemester] = useState("All Semesters");
  const [selectedYear, setSelectedYear] = useState("All Years");

  // Sync internal filter state with active term from options
  useEffect(() => {
    if (options?.currentAcademicYear && (selectedYear === "All Years")) {
      setSelectedYear(options.currentAcademicYear);
      setTimelineFilter(selectedSemester === "All Semesters" ? null : selectedSemester, options.currentAcademicYear);
    }
    if (options?.currentSemester && (selectedSemester === "All Semesters")) {
      setSelectedSemester(options.currentSemester);
      setTimelineFilter(options.currentSemester, selectedYear === "All Years" ? (options.currentAcademicYear || null) : selectedYear);
    }
  }, [options]);

  // Dynamically filter semesters based on selected academic year
  const filteredSemestersList = useMemo(() => {
    if (selectedYear === "All Years") return options?.semesters || [];
    if (!options?.semesterPeriods?.length) return options?.semesters || [];
    return options.semesterPeriods
      .filter(p => p.academic_year === selectedYear)
      .map(p => ({ semester: p.semester, status: p.status }));
  }, [options, selectedYear]);

  // Handle errors via toast
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error fetching analytics",
        description: error,
      });
    }
  }, [error, toast]);

  const handleSemesterChange = (val) => {
    setSelectedSemester(val);
    setTimelineFilter(val === "All Semesters" ? null : val, selectedYear === "All Years" ? null : selectedYear);
  };

  const handleYearChange = (val) => {
    setSelectedYear(val);
    // When year changes, if current semester isn't in the new year's list, we might want to reset it or keep "All"
    // For now, mirroring Archive behavior where we keep visibility but filters handle the rest
    setTimelineFilter(selectedSemester === "All Semesters" ? null : selectedSemester, val === "All Years" ? null : val);
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
        const isLate = p.data.is_late;

        if (isApproved) {
          return (
            <div className="flex items-center h-full">
              <Badge className="font-bold text-xs px-2 py-0.5 rounded-full border shadow-none bg-success/10 text-success border-success/20">
                Approved
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
              {isLate ? 'Late' : 'On Time'}
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
                  <SelectItem value="All Years" className="font-medium text-xs">All Years</SelectItem>
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
                  <SelectItem value="All Semesters" className="font-medium text-xs">All Semesters</SelectItem>
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
              {timeline.map((item, index) => (
                <div key={index} className="group">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-neutral-700 font-bold group-hover:text-primary-700 transition-colors truncate pr-2">{item.label}</span>
                    <span className={`font-bold text-xs px-2 py-0.5 shrink-0 ${item.status === 'On Time' || item.status === 'Early' ? 'text-success' :
                      item.status === 'Late' ? 'text-warning' :
                        item.status === 'Submitted' ? 'text-info' : 'text-neutral-400'
                      }`}>
                      {item.date ? `${new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} (${item.status})` : `Pending`}
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
  );
}