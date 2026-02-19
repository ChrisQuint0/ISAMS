import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFacultyAnalytics } from "../hooks/FacultyAnalyticsHook";
import { Loader2, AlertCircle, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SEMESTERS = ['1st Semester', '2nd Semester', 'Midyear'];
const ACADEMIC_YEARS = ['2024-2025', '2025-2026', '2026-2027'];

export default function FacultyAnalyticsPage() {
  const navigate = useNavigate();
  const { overview, timeline, history, courseAnalytics, onTimeStats, semester, academicYear, setTimelineFilter, loading, error } = useFacultyAnalytics();

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
            <h3 className="font-semibold text-slate-100">Submission Timeline</h3>
            <div className="flex gap-2">
              <select
                className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={semester || ''}
                onChange={e => setTimelineFilter(e.target.value || null, academicYear)}
              >
                <option value="">All Semesters</option>
                {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={academicYear || ''}
                onChange={e => setTimelineFilter(semester, e.target.value || null)}
              >
                <option value="">All Years</option>
                {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
            {timeline.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{item.label}</span>
                  <span className="font-medium text-slate-300">
                    {item.date ? new Date(item.date).toLocaleDateString() : 'Not submitted'}
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.status === 'On Time' ? 'bg-green-500' :
                      item.status === 'Late' ? 'bg-amber-500' :
                        item.status === 'Submitted' ? 'bg-blue-500' : 'bg-slate-600'
                      }`}
                    style={{ width: item.status === 'Pending' ? '0%' : '100%' }}
                  ></div>
                </div>
              </div>
            ))}
            {timeline.length === 0 && (
              <p className="text-slate-500 text-center py-4">No timeline data available for this filter.</p>
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
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
        <h3 className="font-semibold text-lg mb-4 text-slate-100">Course Completion Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 font-medium text-slate-300">Course Code</th>
                <th className="text-left py-3 px-4 font-medium text-slate-300">Course Name</th>
                <th className="text-left py-3 px-4 font-medium text-slate-300">Progress</th>
                <th className="text-left py-3 px-4 font-medium text-slate-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {courseAnalytics && courseAnalytics.map((course) => {
                const percentage = Math.round((course.submitted_count / course.total_required) * 100) || 0;
                // RPC get_faculty_courses_status returns 'submitted_count' and 'total_required' (hardcoded to 4 currently)
                // It does NOT return 'pending_count' explicitly in the root object, so we calculate it.
                const pendingCount = Math.max(0, course.total_required - course.submitted_count);

                return (
                  <tr key={course.course_id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-100">{course.course_code}</td>
                    <td className="py-3 px-4 text-slate-300">{course.course_name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-700 rounded-full h-2 w-24 overflow-hidden">
                          <div
                            className={`h-full ${percentage >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-slate-400">{course.submitted_count}/{course.total_required}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {pendingCount === 0 ? (
                        <span className="px-2 py-1 text-xs font-semibold bg-green-500/10 text-green-400 rounded">
                          Completed
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold bg-amber-500/10 text-amber-400 rounded">
                          {pendingCount} Pending
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {(!courseAnalytics || courseAnalytics.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">No course data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submission History */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
        <h3 className="font-semibold text-lg mb-4 text-slate-100">Submission History</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 font-medium text-slate-300">Document</th>
                <th className="text-left py-3 px-4 font-medium text-slate-300">Semester</th>
                <th className="text-left py-3 px-4 font-medium text-slate-300">Submission Date</th>
                <th className="text-left py-3 px-4 font-medium text-slate-300">Status</th>
                <th className="text-left py-3 px-4 font-medium text-slate-300">File Info</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record) => (
                <tr key={record.submission_id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-100">{record.doc_type}</td>
                  <td className="py-3 px-4 text-slate-300">{record.semester} {record.academic_year}</td>
                  <td className="py-3 px-4 text-slate-300">
                    {record.updated_at ? new Date(record.updated_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${record.status === 'APPROVED' ? 'bg-green-500/10 text-green-400' :
                      record.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    {record.original_filename} ({(record.file_size_bytes / 1024).toFixed(1)} KB)
                  </td>
                </tr>
              ))}

              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No submissions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
