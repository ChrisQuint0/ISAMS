import { useMemo } from "react";
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
import { DataTable } from "@/components/DataTable"; // Using your standardized wrapper

export default function FacultyDashboardPage() {
  const navigate = useNavigate();
  const { stats, settings, courses, recentActivity, loading, error } = useFacultyDashboard();

  const recentActivityColDefs = useMemo(() => [
    {
      field: "date",
      headerName: "Date & Time",
      valueGetter: (p) => p.data.submitted_at || p.data.date,
      cellRenderer: (p) => <span className="font-mono text-neutral-500 font-medium text-xs">{p.value ? new Date(p.value).toLocaleString() : '-'}</span>,
      flex: 1.5,
    },
    {
      field: "course_code",
      headerName: "Course",
      flex: 1,
      cellRenderer: (p) => <span className="font-bold text-primary-600 font-mono text-xs">{p.value}</span>
    },
    {
      field: "doc_type",
      headerName: "Document",
      flex: 2,
      cellRenderer: (p) => <span className="font-medium text-neutral-900 text-xs">{p.value}</span>
    },
    {
      field: "status",
      headerName: "Status",
      width: 140,
      cellRenderer: (p) => {
        const isApproved = p.value === 'APPROVED' || p.value === 'VALIDATED';
        const isRejected = p.value === 'REJECTED';
        const isRevision = p.value === 'REVISION_REQUESTED';

        const bg = isApproved ? 'bg-success/10 text-success border-success/20' :
          (isRejected || isRevision) ? 'bg-destructive/10 text-destructive border-destructive/20' :
            'bg-info/10 text-info border-info/20';

        return (
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border shadow-sm uppercase tracking-wider ${bg}`}>
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
          <Button size="icon" variant="ghost" className="h-7 w-7 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ], []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600 mb-4" />
        <p className="text-neutral-500 font-medium">Loading dashboard...</p>
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

  return (
    <div className="space-y-6 flex flex-col h-full bg-neutral-50/30">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-1">To-Do Command Center</h1>
        <p className="text-neutral-500 font-medium text-sm">
          {settings?.semester || '...'}, AY {settings?.academic_year || '...'} | Deadline: <span className="font-bold text-neutral-700">{stats.next_deadline ? new Date(stats.next_deadline).toLocaleDateString() : 'TBA'}</span>
          {stats.days_remaining > 0 && <span className="text-warning font-bold"> ({stats.days_remaining} days left)</span>}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          onClick={() => navigate("/faculty-requirements/submission")}
          className="h-auto py-5 flex flex-col items-center justify-center bg-white hover:bg-primary-50 border border-neutral-200 hover:border-primary-300 shadow-sm transition-all group active:scale-95"
        >
          <div className="p-3 bg-primary-50 border border-primary-100 rounded-full mb-3 group-hover:bg-white transition-colors">
            <Upload className="h-6 w-6 text-primary-600 group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-neutral-900 font-bold">Upload Requirement</span>
          <span className="text-xs text-neutral-500 mt-1 font-medium">Submit your documents</span>
        </Button>

        <Button
          onClick={() => navigate("/faculty-requirements/analytics")}
          className="h-auto py-5 flex flex-col items-center justify-center bg-white hover:bg-warning/5 border border-neutral-200 hover:border-warning/30 shadow-sm transition-all group active:scale-95"
        >
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-full mb-3 group-hover:bg-white transition-colors">
            <Clock className="h-6 w-6 text-warning group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-neutral-900 font-bold">View Deadlines</span>
          <span className="text-xs text-neutral-500 mt-1 font-medium">Check submission schedule</span>
        </Button>

        <Button
          onClick={() => navigate("/faculty-requirements/hub")}
          className="h-auto py-5 flex flex-col items-center justify-center bg-white hover:bg-success/5 border border-neutral-200 hover:border-success/30 shadow-sm transition-all group active:scale-95"
        >
          <div className="p-3 bg-success/10 border border-success/20 rounded-full mb-3 group-hover:bg-white transition-colors">
            <FileSliders className="h-6 w-6 text-success group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-neutral-900 font-bold">Download Templates</span>
          <span className="text-xs text-neutral-500 mt-1 font-medium">Get official forms</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Progress */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-neutral-900">Overall Progress</h3>
            <span className={`text-2xl font-black ${stats.overall_progress >= 100 ? 'text-success' : 'text-primary-600'}`}>
              {stats.overall_progress}%
            </span>
          </div>
          <div className="relative w-full h-2.5 bg-neutral-100 border border-neutral-200 rounded-full overflow-hidden shadow-inner">
            <div
              className={`absolute top-0 left-0 h-full transition-all duration-1000 ${stats.overall_progress >= 100 ? 'bg-success' : 'bg-primary-500'}`}
              style={{ width: `${stats.overall_progress}%` }}
            ></div>
          </div>
          <div className="mt-4 flex justify-between text-xs font-bold text-neutral-500 uppercase tracking-wider">
            <span className="text-primary-700">{stats.submitted_count} submitted</span>
            <span className="text-warning">{stats.pending_count} pending</span>
          </div>
        </div>

        {/* Deadline Status */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-neutral-900">Deadline Status</h3>
            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border shadow-sm ${stats.days_remaining < 3 ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
              {stats.days_remaining < 3 ? 'Urgent' : 'On Track'}
            </span>
          </div>
          <div className="flex items-center">
            <div className={`text-4xl font-black mr-4 ${stats.days_remaining < 3 ? 'text-destructive' : 'text-warning'}`}>
              {stats.days_remaining}
            </div>
            <div>
              <p className="font-bold text-neutral-900 leading-none">Days remaining</p>
              <p className="text-xs text-neutral-500 font-medium mt-1">
                Next: {stats.next_deadline ? new Date(stats.next_deadline).toLocaleDateString() : 'No upcoming deadlines'}
              </p>
            </div>
          </div>
        </div>

        {/* Clearance Status */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-neutral-900">Clearance Status</h3>
              {stats.pending_count === 0 ? (
                <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold bg-success/10 text-success border border-success/20 rounded-full shadow-sm">Ready</span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold bg-neutral-100 text-neutral-500 border border-neutral-200 rounded-full shadow-sm">Not Ready</span>
              )}
            </div>
            <p className="text-xs text-neutral-500 font-medium mb-4">
              {stats.pending_count === 0
                ? "All requirements completed. You can now download your certificate."
                : "Complete all requirements to generate clearance certificate."}
            </p>
          </div>
          <Button
            disabled={stats.pending_count > 0}
            className={`w-full font-bold shadow-sm transition-all ${stats.pending_count === 0 ? 'bg-success hover:bg-success/90 text-white active:scale-95' : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'}`}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Certificate
          </Button>
        </div>
      </div>

      {/* Your Courses Section */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-neutral-900">Your Courses</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {courses.map((course) => {
            const pct = Math.round((course.submitted_count / course.total_required) * 100) || 0;
            return (
              <div key={course.course_id} className="bg-white border border-neutral-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                {/* Course Header */}
                <div className="flex justify-between items-start p-5 bg-neutral-50/50 border-b border-neutral-100">
                  <div>
                    <h3 className="font-bold text-lg text-neutral-900">
                      {course.course_code} - {course.course_name}
                      {course.master_is_active === false && <Badge variant="outline" className="ml-2 bg-neutral-100 text-neutral-500 border-neutral-200 text-[10px] uppercase">Inactive</Badge>}
                    </h3>
                    <p className="text-xs text-neutral-500 font-medium mt-0.5">Department: {course.department || 'N/A'}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className={`px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full border shadow-sm mb-1.5 ${pct === 100 ? 'bg-success/10 text-success border-success/20' :
                        pct >= 50 ? 'bg-primary-50 text-primary-700 border-primary-200' :
                          'bg-warning/10 text-warning border-warning/20'
                      }`}>
                      {pct}% Complete
                    </div>
                    <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                      Deadline: {stats.days_remaining} days
                    </div>
                  </div>
                </div>

                {/* Course Documents List */}
                <div className="p-5 flex-1 space-y-3">
                  {course.documents && course.documents.map((doc, idx) => {

                    // Determine styling based on status
                    const isApproved = doc.status === 'APPROVED' || doc.status === 'VALIDATED';
                    const isRejected = doc.status === 'REJECTED' || doc.status === 'REVISION_REQUESTED';
                    const isSubmitted = doc.status === 'SUBMITTED';
                    const isPending = !doc.status || doc.status === 'DRAFT';

                    // Determine icon based on doc_type name heuristic
                    const docName = doc.doc_type.toLowerCase();
                    let DocIcon = FileText;
                    let iconColor = "text-neutral-400";

                    if (docName.includes('syllabus')) { DocIcon = FileText; iconColor = isApproved ? "text-success" : isSubmitted ? "text-info" : "text-primary-400"; }
                    else if (docName.includes('grade')) { DocIcon = BarChart3; iconColor = isApproved ? "text-success" : isSubmitted ? "text-info" : "text-info/70"; }
                    else if (docName.includes('presentation') || docName.includes('slide')) { DocIcon = FileSliders; iconColor = isApproved ? "text-success" : isSubmitted ? "text-info" : "text-purple-400"; }
                    else if (docName.includes('exam') || docName.includes('question')) { DocIcon = HelpCircle; iconColor = isApproved ? "text-success" : isSubmitted ? "text-info" : "text-warning"; }

                    return (
                      <div key={idx} className={`flex items-center justify-between p-3.5 rounded-lg border transition-all ${isApproved ? 'bg-success/5 border-success/20 hover:bg-success/10 shadow-sm' :
                          isRejected ? 'bg-destructive/5 border-destructive/20 hover:bg-destructive/10 shadow-sm' :
                            isSubmitted ? 'bg-info/5 border-info/20 hover:bg-info/10 shadow-sm' :
                              'bg-neutral-50 border-neutral-200 hover:border-primary-300 hover:shadow-md'
                        }`}>
                        <div className="flex items-center">
                          <div className={`p-2 rounded bg-white border border-neutral-100 shadow-sm mr-3`}>
                            <DocIcon className={`h-5 w-5 ${iconColor}`} />
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900 text-sm leading-tight">{doc.doc_type}</p>
                            <p className="text-[11px] text-neutral-500 font-medium mt-0.5">{doc.description || 'Required Document'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Status Badge */}
                          <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-full border shadow-sm flex-shrink-0 ${isApproved ? 'bg-success/10 text-success border-success/20' :
                              isRejected ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                isSubmitted ? 'bg-info/10 text-info border-info/20' :
                                  'bg-neutral-100 text-neutral-500 border-neutral-200'
                            }`}>
                            {doc.status || 'Pending'}
                          </span>

                          {/* Action Button */}
                          {isPending || isRejected ? (
                            <Button
                              size="sm"
                              onClick={() => navigate("/faculty-requirements/submission", { state: { courseId: course.course_id, docTypeId: doc.doc_type_id } })}
                              className={`h-7 px-3 text-xs shadow-sm flex-shrink-0 font-bold active:scale-95 transition-all ${isRejected ? 'bg-destructive hover:bg-destructive/90 text-white' : 'bg-primary-600 hover:bg-primary-700 text-white'
                                }`}
                            >
                              {isRejected ? <RotateCcw className="h-3 w-3 mr-1.5" /> : <Upload className="h-3 w-3 mr-1.5" />}
                              {isRejected ? 'Resubmit' : 'Submit'}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors border border-transparent hover:border-primary-200 shadow-none hover:shadow-sm"
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
                    <div className="p-6 text-center text-neutral-500 text-sm font-medium border border-dashed border-neutral-200 rounded-lg bg-neutral-50">
                      No document requirements configured for this course.
                    </div>
                  )}
                </div>

                <div className="p-5 border-t border-neutral-100 bg-neutral-50/30">
                  <Button
                    variant="outline"
                    className="w-full bg-white border-neutral-200 text-neutral-700 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 shadow-sm transition-all font-bold active:scale-95"
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
            <div className="col-span-1 xl:col-span-2 text-center py-20 bg-neutral-50 rounded-xl border border-neutral-200 border-dashed">
              <div className="w-16 h-16 bg-white border border-neutral-200 shadow-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-1">No Courses Assigned</h3>
              <p className="text-sm text-neutral-500 font-medium max-w-sm mx-auto">
                You currently don't have any courses assigned for this semester. Check back later or contact the administrator.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm flex flex-col flex-1 min-h-[400px] overflow-hidden mt-4">
        <div className="p-5 border-b border-neutral-100 bg-neutral-50/50 shrink-0">
          <h3 className="font-bold text-base text-neutral-900 mb-0">Recent Activity</h3>
        </div>
        <div className="flex-1 p-4">
          <DataTable
            rowData={recentActivity}
            columnDefs={recentActivityColDefs}
            className="h-full border-0 shadow-none"
            overlayNoRowsTemplate='<div class="text-neutral-500 text-sm py-8 font-medium text-center"><p>No recent activity found. Your submissions will appear here.</p></div>'
          />
        </div>
      </div>
    </div>
  );
}