import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  BarChart3,
  FileSliders,
  HelpCircle,
  Upload,
  RotateCcw,
  Eye,
  Clock,
  Send,
  Download,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useFacultyDashboard } from "../hooks/FacultyDashboardHook";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function FacultyDashboardPage() {
  const navigate = useNavigate();
  const { stats, courses, recentActivity, loading, error } = useFacultyDashboard();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
        <p className="text-slate-400">Loading dashboard...</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">To-Do Command Center</h1>
        <p className="text-slate-400">
          Semester 2, AY 2023-2024 | Deadline: {stats.next_deadline ? new Date(stats.next_deadline).toLocaleDateString() : 'TBA'}
          {stats.days_remaining > 0 && ` (${stats.days_remaining} days left)`}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Progress */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-100">Overall Progress</h3>
            <span className={`text-2xl font-bold ${stats.overall_progress >= 100 ? 'text-green-400' : 'text-blue-400'}`}>
              {stats.overall_progress}%
            </span>
          </div>
          <div className="relative w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full ${stats.overall_progress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${stats.overall_progress}%` }}
            ></div>
          </div>
          <div className="mt-4 flex justify-between text-sm text-slate-400">
            <span>{stats.submitted_count} submitted</span>
            <span>{stats.pending_count} pending</span>
          </div>
        </div>

        {/* Deadline Status */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-100">Deadline Status</h3>
            <span className={`font-semibold ${stats.days_remaining < 3 ? 'text-red-400' : 'text-amber-400'}`}>
              {stats.days_remaining < 3 ? 'Urgent' : 'On Track'}
            </span>
          </div>
          <div className="flex items-center">
            <div className="text-3xl font-bold mr-3 text-slate-100">{stats.days_remaining}</div>
            <div>
              <p className="font-medium text-slate-100">Days remaining</p>
              <p className="text-sm text-slate-400">
                Next: {stats.next_deadline ? new Date(stats.next_deadline).toLocaleDateString() : 'No upcoming deadlines'}
              </p>
            </div>
          </div>
        </div>

        {/* Clearance Status */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-100">Clearance Status</h3>
            {stats.pending_count === 0 ? (
              <span className="px-2 py-1 text-xs font-semibold bg-green-500/10 text-green-400 rounded">Ready</span>
            ) : (
              <span className="px-2 py-1 text-xs font-semibold bg-amber-500/10 text-amber-400 rounded">Not Ready</span>
            )}
          </div>
          <p className="text-sm text-slate-400 mb-4">
            {stats.pending_count === 0
              ? "All requirements completed. You can now download your certificate."
              : "Complete all requirements to generate clearance certificate"}
          </p>
          <Button
            disabled={stats.pending_count > 0}
            className={`w-full ${stats.pending_count === 0 ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Certificate
          </Button>
        </div>
      </div>

      {/* Your Courses Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-slate-100">Your Courses</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {courses.map((course) => (
            <div key={course.course_id} className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-100">{course.course_code} - {course.course_name}</h3>
                  <p className="text-slate-400">Requirements Check</p>
                </div>
                <div className="text-right">
                  <div className="px-2 py-1 text-xs font-semibold bg-green-500/10 text-green-400 rounded mb-2">
                    {course.submitted_count}/{course.total_required} Done
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {course.documents && course.documents.map((doc, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-3 rounded ${doc.status === 'APPROVED' ? 'bg-slate-800/50' :
                    doc.status === 'REJECTED' || doc.status === 'REVISION_REQUESTED' ? 'bg-red-500/10 border border-red-500/20' :
                      doc.status === 'SUBMITTED' ? 'bg-blue-500/10 border border-blue-500/20' :
                        'bg-amber-500/10 border border-amber-500/20'
                    }`}>
                    <div className="flex items-center">
                      <FileText className={`mr-3 h-5 w-5 ${doc.status === 'APPROVED' ? 'text-green-400' : 'text-slate-400'
                        }`} />
                      <div>
                        <p className="font-medium text-slate-100">{doc.doc_type}</p>
                        <p className="text-sm text-slate-400">{doc.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {doc.status === 'PENDING' || doc.status === 'REJECTED' ? (
                        <Button
                          size="sm"
                          onClick={() => navigate("/faculty-requirements/submission")}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          {doc.status === 'REJECTED' ? 'Resubmit' : 'Submit'}
                        </Button>
                      ) : (
                        <div className="flex items-center">
                          <span className="px-2 py-1 text-xs font-semibold bg-green-500/10 text-green-400 rounded mr-3">
                            {doc.status}
                          </span>
                          <Button size="sm" variant="outline" className="text-sm bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <Button variant="outline" className="w-full bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
                  <Send className="h-4 w-4 mr-2" />
                  Submit All at Once
                </Button>
              </div>
            </div>
          ))}

          {courses.length === 0 && (
            <div className="col-span-1 lg:col-span-2 text-center py-12 text-slate-400 bg-slate-900/30 rounded-lg border border-slate-800 border-dashed">
              <p>No courses assigned to you yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
        <h3 className="font-semibold text-lg mb-4 text-slate-100">Recent Activity</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 font-medium text-slate-100">Date & Time</th>
                <th className="text-left py-3 px-4 font-medium text-slate-100">Course</th>
                <th className="text-left py-3 px-4 font-medium text-slate-100">Document</th>
                <th className="text-left py-3 px-4 font-medium text-slate-100">Status</th>
                <th className="text-left py-3 px-4 font-medium text-slate-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {recentActivity.map((activity) => (
                <tr key={activity.submission_id}>
                  <td className="py-3 px-4 text-slate-300">{new Date(activity.date).toLocaleString()}</td>
                  <td className="py-3 px-4 text-slate-300">{activity.course_code}</td>
                  <td className="py-3 px-4 text-slate-300">{activity.doc_type}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${activity.status === 'APPROVED' ? 'bg-green-500/10 text-green-400' :
                      activity.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                      {activity.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Button size="sm" variant="outline" className="text-sm bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
                      <Eye className="h-4 w-4 mr-1" />View
                    </Button>
                  </td>
                </tr>
              ))}

              {recentActivity.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">No recent activity found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
