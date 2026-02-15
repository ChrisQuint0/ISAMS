import { useNavigate } from "react-router-dom";
import { useFacultyAnalytics } from "../hooks/FacultyAnalyticsHook";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function FacultyAnalyticsPage() {
  const navigate = useNavigate();
  const { overview, timeline, history, loading, error } = useFacultyAnalytics();

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

        {/* Submission Timeline Card */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
          <h3 className="font-semibold mb-4 text-slate-100">Submission Timeline</h3>
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
                        item.status === 'Late' ? 'bg-amber-500' : 'bg-slate-600'
                      }`}
                    style={{ width: item.status === 'Pending' ? '0%' : '100%' }}
                  ></div>
                </div>
              </div>
            ))}
            {timeline.length === 0 && (
              <p className="text-slate-500 text-center py-4">No timeline data available.</p>
            )}
          </div>
        </div>

        {/* Performance Comparison Card */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
          <h3 className="font-semibold mb-4 text-slate-100">Performance Comparison</h3>
          <div className="space-y-4">
            {/* Your Progress */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">Your Progress</span>
                <span className="font-medium text-slate-300">{overview.completion_rate}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${overview.completion_rate}%` }}></div>
              </div>
            </div>

            {/* Department Average */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">Department Average</span>
                <span className="font-medium text-slate-300">{overview.dept_average}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-slate-500" style={{ width: `${overview.dept_average}%` }}></div>
              </div>
            </div>

            {/* Target */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">Target Goal</span>
                <span className="font-medium text-slate-300">100%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 hover:bg-emerald-400 transition-colors" style={{ width: '1000%' }}></div>
                {/* Intentional visual fix: width 100% looks small locally sometimes, keeping 100% logic */}
                <div className="h-full bg-emerald-500" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
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
