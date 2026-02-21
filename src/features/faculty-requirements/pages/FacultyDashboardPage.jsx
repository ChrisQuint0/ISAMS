import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeBalham } from 'ag-grid-community';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);
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

// Custom theme using AG Grid v33+ Theming API with Balham theme
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
export default function FacultyDashboardPage() {
  const navigate = useNavigate();
  const { stats, settings, courses, recentActivity, loading, error } = useFacultyDashboard();

  const recentActivityColDefs = useMemo(() => [
    {
      field: "date",
      headerName: "Date & Time",
      valueGetter: (p) => p.data.submitted_at || p.data.date,
      cellRenderer: (p) => p.value ? new Date(p.value).toLocaleString() : '-',
      flex: 1.5,
      cellClass: "font-medium text-slate-300 text-xs"
    },
    {
      field: "course_code",
      headerName: "Course",
      flex: 1,
      cellClass: "text-slate-300 text-xs font-mono"
    },
    {
      field: "doc_type",
      headerName: "Document",
      flex: 2,
      cellClass: "text-slate-300 text-xs"
    },
    {
      field: "status",
      headerName: "Status",
      width: 140,
      cellRenderer: (p) => {
        const isApproved = p.value === 'APPROVED';
        const isRejected = p.value === 'REJECTED';
        const isRevision = p.value === 'REVISION_REQUESTED';
        const bg = isApproved ? 'bg-green-500/10 text-green-400 border-green-500/20' :
          (isRejected || isRevision) ? 'bg-red-500/10 text-red-400 border-red-500/20' :
            'bg-blue-500/10 text-blue-400 border-blue-500/20';
        return (
          <span className={`px-2 py-1 text-[10px] font-bold rounded border uppercase tracking-wider ${bg}`}>
            {p.value}
          </span>
        )
      }
    },
    {
      headerName: "Actions",
      width: 100,
      cellRenderer: (p) => (
        <div className="flex gap-1 items-center h-full">
          <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-slate-300 hover:bg-slate-800">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ], []);

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
          {settings?.semester || '...'}, AY {settings?.academic_year || '...'} | Deadline: {stats.next_deadline ? new Date(stats.next_deadline).toLocaleDateString() : 'TBA'}
          {stats.days_remaining > 0 && ` (${stats.days_remaining} days left)`}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          onClick={() => navigate("/faculty-requirements/submission")}
          className="h-auto py-4 flex flex-col items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50 transition-all group"
        >
          <Upload className="h-6 w-6 mb-2 text-blue-400 group-hover:scale-110 transition-transform" />
          <span className="text-slate-200 font-medium">Upload Requirement</span>
          <span className="text-xs text-slate-500 mt-1">Submit your documents</span>
        </Button>

        <Button
          onClick={() => navigate("/faculty-requirements/analytics")}
          className="h-auto py-4 flex flex-col items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-500/50 transition-all group"
        >
          <Clock className="h-6 w-6 mb-2 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="text-slate-200 font-medium">View Deadlines</span>
          <span className="text-xs text-slate-500 mt-1">Check submission schedule</span>
        </Button>

        <Button
          onClick={() => navigate("/faculty-requirements/hub")}
          className="h-auto py-4 flex flex-col items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-green-500/50 transition-all group"
        >
          <FileSliders className="h-6 w-6 mb-2 text-green-400 group-hover:scale-110 transition-transform" />
          <span className="text-slate-200 font-medium">Download Templates</span>
          <span className="text-xs text-slate-500 mt-1">Get official forms</span>
        </Button>
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
          {courses.map((course) => {
            const pct = Math.round((course.submitted_count / course.total_required) * 100) || 0;
            return (
              <div key={course.course_id} className="bg-slate-900/50 border border-slate-800 rounded-xl shadow-md p-6">
                <div className="flex justify-between items-start mb-6 border-b border-slate-800/50 pb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-100">{course.course_code} - {course.course_name}</h3>
                    <p className="text-sm text-slate-400">Department: {course.department || 'N/A'}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className={`px-2.5 py-1 text-xs font-bold rounded-md mb-2 ${pct === 100 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      pct >= 50 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                      {pct}% Complete
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      Deadline: {stats.days_remaining} days
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {course.documents && course.documents.map((doc, idx) => {

                    // Determine styling based on status
                    const isApproved = doc.status === 'APPROVED' || doc.status === 'VALIDATED';
                    const isRejected = doc.status === 'REJECTED' || doc.status === 'REVISION_REQUESTED';
                    const isSubmitted = doc.status === 'SUBMITTED';
                    const isPending = !doc.status || doc.status === 'DRAFT';

                    // Determine icon based on doc_type name heuristic
                    const docName = doc.doc_type.toLowerCase();
                    let DocIcon = FileText;
                    let iconColor = "text-slate-400";

                    if (docName.includes('syllabus')) { DocIcon = FileText; iconColor = isApproved ? "text-green-500" : isSubmitted ? "text-blue-500" : "text-green-600/70"; }
                    else if (docName.includes('grade')) { DocIcon = BarChart3; iconColor = isApproved ? "text-green-500" : isSubmitted ? "text-blue-500" : "text-blue-600/70"; }
                    else if (docName.includes('presentation') || docName.includes('slide')) { DocIcon = FileSliders; iconColor = isApproved ? "text-green-500" : isSubmitted ? "text-blue-500" : "text-purple-500/70"; }
                    else if (docName.includes('exam') || docName.includes('question')) { DocIcon = HelpCircle; iconColor = isApproved ? "text-green-500" : isSubmitted ? "text-blue-500" : "text-amber-500/70"; }

                    return (
                      <div key={idx} className={`flex items-center justify-between p-3.5 rounded-lg border transition-all ${isApproved ? 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/60' :
                        isRejected ? 'bg-red-950/20 border-red-900/40 hover:bg-red-900/30' :
                          isSubmitted ? 'bg-blue-950/20 border-blue-900/40 hover:bg-blue-900/30' :
                            'bg-amber-950/10 border-amber-900/30 hover:bg-amber-900/20'
                        }`}>
                        <div className="flex items-center">
                          <DocIcon className={`mr-3.5 h-6 w-6 ${iconColor}`} />
                          <div>
                            <p className="font-medium text-slate-200 text-sm leading-tight">{doc.doc_type}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{doc.description || 'Required Document'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Status Badge */}
                          <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded flex-shrink-0 ${isApproved ? 'bg-green-500/10 text-green-400' :
                            isRejected ? 'bg-red-500/10 text-red-400' :
                              isSubmitted ? 'bg-blue-500/10 text-blue-400' :
                                'bg-amber-500/10 text-amber-400'
                            }`}>
                            {doc.status || 'Pending'}
                          </span>

                          {/* Action Button */}
                          {isPending || isRejected ? (
                            <Button
                              size="sm"
                              onClick={() => navigate("/faculty-requirements/submission", { state: { courseId: course.course_id, docTypeId: doc.doc_type_id } })}
                              className={`h-7 px-3 text-xs shadow-sm bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0`}
                            >
                              <Upload className="h-3 w-3 mr-1.5" />
                              {isRejected ? 'Resubmit' : 'Submit'}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                              onClick={() => doc.gdrive_web_view_link && window.open(doc.gdrive_web_view_link, '_blank')}
                              disabled={!doc.gdrive_web_view_link}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {(!course.documents || course.documents.length === 0) && (
                    <div className="p-4 text-center text-slate-500 text-sm italic">
                      No document requirements configured for this course.
                    </div>
                  )}
                </div>

                <div className="text-center mt-auto pt-2">
                  <Button
                    variant="outline"
                    className="w-full bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    onClick={() => navigate("/faculty-requirements/submission", { state: { courseId: course.course_id } })}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit All at Once
                  </Button>
                </div>
              </div>
            );
          })}

          {courses.length === 0 && (
            <div className="col-span-1 lg:col-span-2 text-center py-16 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
              <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-300 mb-1">No Courses Assigned</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                You currently don't have any courses assigned for this semester. Check back later or contact the administrator.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md flex flex-col flex-1 min-h-[400px]">
        <div className="p-6 border-b border-slate-800 shrink-0 bg-slate-950/30">
          <h3 className="font-semibold text-lg text-slate-100 mb-0">Recent Activity</h3>
        </div>
        <div className="flex-1 relative p-0">
          <div className="absolute inset-0">
            <AgGridReact
              theme={customTheme}
              rowData={recentActivity}
              columnDefs={recentActivityColDefs}
              pagination={true}
              paginationPageSize={10}
              suppressCellFocus={true}
              overlayNoRowsTemplate={`<div class="text-slate-400 text-sm py-8"><Clock class="h-8 w-8 mx-auto mb-3 text-slate-600" /><p>No recent activity found. Your submissions will appear here.</p></div>`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
