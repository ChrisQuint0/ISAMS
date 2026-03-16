import { useMemo, useState } from "react";
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
  AlertCircle,
  CheckCircle,
  Calendar,
  Activity,
  CheckSquare,
  Square,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Search,
  BookOpen
} from "lucide-react";
import { useFacultyDashboard } from "../hooks/FacultyDashboardHook";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { useToast } from "@/components/ui/toast/toaster";
import { ToastProvider } from "@/components/ui/toast/toaster";
import { useEffect as useToastEffect } from "react";

// ─── Status badge helper ───────────────────────────────────────────────────────
function StatusBadge({ value }) {
  const v = (value || '').toUpperCase();

  // Color mapping based on image and specific feedback
  const isGreen = ['APPROVED', 'VALIDATED', 'SUBMITTED', 'RESUBMITTED'].includes(v);
  const isRed = v === 'REJECTED';
  const isOrange = v === 'REVISION_REQUESTED';
  const isPassed = v === 'PASSED';

  const cls = isGreen ? 'bg-[#E6F7F0] text-[#00A86B] border-[#00A86B]/20'
    : isRed ? 'bg-destructive/10 text-destructive border-destructive/20'
      : isOrange ? 'bg-warning/10 text-warning border-warning/20'
        : 'bg-[#F1F5F9] text-[#475569] border-[#475569]/10';

  const label = v === 'SUBMITTED' || v === 'RESUBMITTED' ? 'Submitted'
    : v === 'APPROVED' || v === 'VALIDATED' ? 'Approved'
      : v === 'REVISION_REQUESTED' ? 'Revision'
        : v === 'REJECTED' ? 'Rejected'
          : v === 'PASSED' ? 'Passed'
            : v.charAt(0) + v.slice(1).toLowerCase();

  return (
    <span className={`font-bold text-xs px-2 py-0.5 rounded-full border shadow-none ${cls}`}>
      {label}
    </span>
  );
}

// ─── Deadline urgency helper ───────────────────────────────────────────────────
function getDaysLeft(dateStr, graceDays = 0) {
  if (!dateStr) return { label: 'N/A', urgent: false, grace: false };
  const [y, m, d] = dateStr.split('-').map(Number);
  const due = new Date(y, m - 1, d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.floor((due - today) / 86400000);
  if (diff === 0) return { label: 'Due today', urgent: true, grace: false };
  if (diff === 1) return { label: 'Due tomorrow', urgent: true, grace: false };
  if (diff > 0) return { label: `${diff} days left`, urgent: diff <= 3, grace: false };
  // Check grace period
  const cutoff = new Date(due); cutoff.setDate(cutoff.getDate() + graceDays);
  const gDiff = Math.floor((cutoff - today) / 86400000);
  if (gDiff >= 0) return { label: `Grace: ${gDiff}d left`, urgent: true, grace: true };
  return { label: 'Passed', urgent: false, grace: false };
}

export default function FacultyDashboardPage() {
  const navigate = useNavigate();
  const {
    stats, settings, courses, recentActivity, deadlines,
    loading, error, facultyProfile, templates, refreshDashboard,
    isDocViewerOpen, setIsDocViewerOpen, viewerFiles,
    selectedViewerFile, setSelectedViewerFile,
    isViewerLoading, viewerCourseContext, viewerDocContext, fetchDocumentFiles
  } = useFacultyDashboard();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const activeCoursesCount = useMemo(() => courses.filter(c => c.master_is_active !== false).length, [courses]);
  const inactiveCoursesCount = useMemo(() => courses.filter(c => c.master_is_active === false).length, [courses]);

  // ─── Recent Activity Column Defs ──────────────────────────────────────────────
  const recentActivityColDefs = useMemo(() => [
    {
      headerName: "Date & Time",
      valueGetter: (p) => p.data.date || p.data.submitted_at,
      cellRenderer: (p) => (
        <span className="font-mono text-neutral-500 text-xs font-medium">
          {p.value ? new Date(p.value).toLocaleString() : '—'}
        </span>
      ),
      flex: 1.5,
    },
    {
      field: "course_code",
      headerName: "Course",
      flex: 0.8,
      cellRenderer: (p) => (
        <span className="font-bold text-xs px-2 py-0.5 rounded-full border bg-primary-50 text-primary-700 border-primary-200 font-mono">
          {p.value || '—'}
        </span>
      )
    },
    {
      field: "doc_type",
      headerName: "Document",
      flex: 1.5,
      cellRenderer: (p) => (
        <span className="font-medium text-neutral-900 text-xs">{p.value || '—'}</span>
      )
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      cellRenderer: (p) => <StatusBadge value={p.value} />
    }
  ], []);

  // ─── Certificate generator ────────────────────────────────────────────────────
  const hexToRgbHelper = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? { r: parseInt(result[1], 16) / 255, g: parseInt(result[2], 16) / 255, b: parseInt(result[3], 16) / 255 }
      : { r: 0, g: 107 / 255, b: 53 / 255 };
  };

  const handleDownloadCertificate = async () => {
    const certificateTemplate = templates.find(t => t.system_category === 'CLEARANCE_CERTIFICATE');
    if (!certificateTemplate) {
      toast({ variant: "destructive", title: "Template Not Found", description: "Active Clearance Certificate template not found." });
      return;
    }
    setIsGenerating(true);
    try {
      const bytes = await fetch(certificateTemplate.file_url).then(r => r.arrayBuffer());
      const pdfDoc = await PDFDocument.load(bytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width } = firstPage.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const firstName = facultyProfile?.first_name || '';
      const lastName = facultyProfile?.last_name || 'Faculty';
      const name = `${firstName} ${lastName}`.trim().toUpperCase() || 'FACULTY NAME';
      const fontSize = certificateTemplate.font_size ? Number(certificateTemplate.font_size) : 24;
      const textWidth = font.widthOfTextAtSize(name, fontSize);
      const centerX = (width - textWidth) / 2;
      const y = certificateTemplate.y_coord ? Number(certificateTemplate.y_coord) : 300;
      const rgbColor = hexToRgbHelper(certificateTemplate.font_color || '#006B35');
      firstPage.drawText(name, { x: centerX, y, size: fontSize, font, color: rgb(rgbColor.r, rgbColor.g, rgbColor.b) });
      const pdfBytes = await pdfDoc.save();
      saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), `Clearance_${facultyProfile?.last_name || 'Certificate'}.pdf`);
      toast({ title: "Success", description: "Certificate generated successfully!" });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Generation Failed", description: "Failed to generate certificate." });
    } finally {
      setIsGenerating(false);
    }
  };

  useToastEffect(() => {
    if (error) toast({ variant: "destructive", title: "Error Loading Dashboard", description: error });
  }, [error, toast]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <RefreshCw className="h-10 w-10 animate-spin text-primary-600 mb-4" />
        <p className="text-neutral-500 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="space-y-6 flex flex-col h-full bg-neutral-50/30">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
              Welcome back, {facultyProfile?.first_name || 'Faculty'}
            </h1>
            <p className="text-neutral-500 font-medium text-sm mt-0.5">
              {settings?.semester || '—'}, AY {settings?.academic_year || '—'}
              {stats.next_deadline && (
                <> · Next deadline: <span className="font-bold text-neutral-700">{new Date(stats.next_deadline).toLocaleDateString()}</span>
                  {stats.days_remaining > 0 && <span className="text-warning font-bold"> ({stats.days_remaining}d left)</span>}
                </>
              )}
            </p>
          </div>
          {/* Compact Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => navigate("/faculty-requirements/submission")}
              className="h-9 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-sm active:scale-95 transition-all text-xs"
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Upload Requirement
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/faculty-requirements/hub")}
              className="h-9 px-4 bg-gold-400 text-neutral-900 hover:text-neutral-900 hover:bg-gold-600 font-bold shadow-sm active:scale-95 transition-all text-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download Templates
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={refreshDashboard}
              disabled={loading}
              className="h-9 w-9 text-primary-600 hover:text-primary-700 hover:bg-primary-50 border-neutral-200 shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0">
          {/* Overall Progress */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-neutral-50 border border-neutral-200">
                  <Activity className="h-4 w-4 text-primary-600" />
                </div>
                <h3 className="font-bold text-neutral-900 text-sm">Overall Progress</h3>
              </div>
              <span className={`text-2xl font-black ${stats.overall_progress >= 100 ? 'text-success' : 'text-primary-600'}`}>
                {stats.overall_progress}%
              </span>
            </div>
            <div className="relative w-full h-2 bg-neutral-100 border border-neutral-200 rounded-full overflow-hidden shadow-inner">
              <div
                className={`absolute top-0 left-0 h-full transition-all duration-1000 ${stats.overall_progress >= 100 ? 'bg-success' : 'bg-primary-500'}`}
                style={{ width: `${Math.min(stats.overall_progress, 100)}%` }}
              />
            </div>
            <div className="mt-3 flex justify-between text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
              <span className="text-success">{stats.submitted_count} submitted</span>
              <span className="text-warning">{stats.pending_count} pending</span>
            </div>
          </div>

          {/* Course Counters */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-neutral-50 border border-neutral-200">
                  <BookOpen className="h-4 w-4 text-warning" />
                </div>
                <h3 className="font-bold text-neutral-900 text-sm">Course Statistics</h3>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border shadow-sm bg-warning/10 text-warning border-warning/20">
                {courses.length} Total
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="flex flex-col">
                <span className="text-3xl font-black text-warning leading-none">{activeCoursesCount}</span>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">Active Courses</span>
              </div>
              <div className="h-8 w-px bg-neutral-100 mx-4" />
              <div className="flex flex-col items-end text-right">
                <span className="text-3xl font-black text-neutral-400 leading-none">{inactiveCoursesCount}</span>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">Inactive</span>
              </div>
            </div>
          </div>

          {/* Clearance Status */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-neutral-50 border border-neutral-200">
                    <ShieldCheck className="h-4 w-4 text-success" />
                  </div>
                  <h3 className="font-bold text-neutral-900 text-sm">Clearance Status</h3>
                </div>
                {stats.pending_count === 0
                  ? <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold bg-success/10 text-success border border-success/20 rounded-full shadow-sm">Ready</span>
                  : <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold bg-neutral-100 text-neutral-500 border border-neutral-200 rounded-full shadow-sm">Not Ready</span>}
              </div>
              <p className="text-xs text-neutral-500 font-medium mb-3">
                {stats.pending_count === 0
                  ? "All requirements completed. Download your certificate."
                  : `${stats.pending_count} requirement${stats.pending_count > 1 ? 's' : ''} still pending.`}
              </p>
            </div>
            <Button
              disabled={stats.pending_count > 0 || isGenerating}
              onClick={handleDownloadCertificate}
              className={`w-full font-bold shadow-sm transition-all text-sm ${stats.pending_count === 0 ? 'bg-success hover:bg-success/90 text-white active:scale-95' : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'}`}
            >
              {isGenerating ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {isGenerating ? 'Generating...' : 'Download Certificate'}
            </Button>
          </div>
        </div>

        {/* ── Active Deadlines Card ── */}
        {deadlines.length > 0 && (
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden shrink-0">
            <div className="px-5 py-3.5 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary-600" />
                <h3 className="font-bold text-neutral-900 text-sm">Active Deadlines</h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold text-success border-success/20 bg-success/5">
                {deadlines.length} {deadlines.length === 1 ? 'ACTIVE' : 'ACTIVE'}
              </Badge>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {deadlines.map((d, i) => {
                const { label, urgent, grace } = getDaysLeft(d.deadline_date, d.grace_period_days);
                const isGrace = d.status === 'Grace Period';
                return (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isGrace ? 'bg-warning/5 border-warning/20' : urgent ? 'bg-destructive/5 border-destructive/20' : 'bg-success/5 border-success/20'}`}>
                    <div className={`p-1.5 rounded border bg-white ${isGrace ? 'border-warning/30' : urgent ? 'border-destructive/30' : 'border-success/30'}`}>
                      <Clock className={`h-4 w-4 ${isGrace ? 'text-warning' : urgent ? 'text-destructive' : 'text-success'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-neutral-900 truncate">{d.type_name}</p>
                      <p className={`text-[10px] font-extrabold uppercase tracking-wider ${isGrace ? 'text-warning' : urgent ? 'text-destructive' : 'text-success'}`}>
                        {label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Your Courses Section ── */}
        <div>
          <h2 className="text-base font-bold mb-3 text-neutral-900">Your Courses</h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {courses.map((course) => {
              const pct = Math.round((course.submitted_count / course.total_required) * 100) || 0;
              return (
                <div key={course.course_id} className="bg-white border border-neutral-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                  {/* Course Header */}
                  <div className="flex justify-between items-start p-4 bg-neutral-50/50 border-b border-neutral-100">
                    <div>
                      <h3 className="font-bold text-base text-neutral-900">
                        {course.course_code}
                        {course.section && <span className="text-neutral-400 font-medium ml-1">· {course.section}</span>}
                        {course.master_is_active === false && (
                          <Badge variant="outline" className="ml-2 bg-neutral-100 text-neutral-500 border-neutral-200 text-[10px] uppercase">Inactive</Badge>
                        )}
                      </h3>
                      <p className="text-xs text-neutral-500 font-medium mt-0.5">{course.course_name}</p>
                    </div>
                    <div className={`px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full border shadow-sm ${pct === 100 ? 'bg-success/10 text-success border-success/20' :
                      pct >= 50 ? 'bg-primary-50 text-primary-700 border-primary-200' :
                        'bg-warning/10 text-warning border-warning/20'
                      }`}>
                      {pct}% Complete
                    </div>
                  </div>

                  {/* Documents List */}
                  <div className="p-4 flex-1 space-y-2">
                    {course.documents?.map((doc, idx) => {
                      const isApproved = doc.status === 'APPROVED' || doc.status === 'VALIDATED';
                      // Custom Status Display Logic
                      const isDone = ['SUBMITTED', 'RESUBMITTED', 'APPROVED', 'VALIDATED', 'ARCHIVED'].includes(doc.status);
                      const displayStatus = doc.status === 'REVISION_REQUESTED' ? 'ONGOING' :
                        doc.is_submitted_late ? 'LATE' :
                          (doc.status === 'APPROVED' || doc.status === 'VALIDATED' || doc.status === 'ARCHIVED') ? 'SUBMITTED' :
                            (doc.status || 'PENDING');

                      const isPending = !doc.status || doc.status === 'DRAFT';
                      const isRejected = doc.status === 'REJECTED';
                      const isRevision = doc.status === 'REVISION_REQUESTED';

                      return (
                        <div key={idx} className="flex flex-col p-2.5 rounded-lg border border-neutral-100 bg-neutral-50/50 hover:bg-white hover:border-neutral-200 transition-all group/item">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              {isDone ? (
                                <CheckSquare className="h-3.5 w-3.5 text-success" />
                              ) : (
                                <Square className="h-3.5 w-3.5 text-neutral-300" />
                              )}
                              <span className={`text-xs font-bold truncate ${isDone ? 'text-neutral-900' : 'text-neutral-500'}`}>
                                {doc.doc_type}
                                {doc.description && <span className="ml-1.5 font-normal text-[10px] text-neutral-400 truncate hidden sm:inline-block">- {doc.description}</span>}
                              </span>
                            </div>
                            <Badge className={`text-[8px] font-extrabold tracking-widest px-1.5 py-0 shadow-none border uppercase ${doc.is_submitted_late ? 'bg-warning/10 border-warning/20 text-warning' :
                              isDone ? 'bg-success/10 border-success/20 text-success' :
                                doc.status === 'REVISION_REQUESTED' ? 'bg-warning/10 border-warning/20 text-warning' :
                                  'bg-neutral-100 border-neutral-200 text-neutral-500'
                              }`}>
                              {doc.status === 'RESUBMITTED' ? 'SUBMITTED' : displayStatus}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                              {doc.submitted_at ? new Date(doc.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'NOT SUBMITTED'}
                            </span>

                            {/* Controls */}
                            <div className="flex gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                              {/* View Files Modal Trigger */}
                              {(isDone || isRevision) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => fetchDocumentFiles(doc, course)}
                                  className="h-6 w-6 rounded-md text-neutral-400 hover:text-primary-600 hover:bg-primary-50"
                                  title="View Files"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {(!course.documents || course.documents.length === 0) && (
                      <div className="p-5 text-center text-neutral-500 text-xs font-medium border border-dashed border-neutral-200 rounded-lg bg-neutral-50">
                        No document requirements configured for this course.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {courses.length === 0 && (
              <div className="col-span-1 xl:col-span-2 text-center py-16 bg-neutral-50 rounded-xl border border-neutral-200 border-dashed">
                <div className="w-14 h-14 bg-white border border-neutral-200 shadow-sm rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-7 w-7 text-neutral-400" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 mb-1">No Courses Assigned</h3>
                <p className="text-sm text-neutral-500 font-medium max-w-sm mx-auto">
                  You don't have any courses assigned for this semester. Contact the administrator.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Recent Activity Table ── */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm flex flex-col flex-1 min-h-[350px] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-100 bg-neutral-50/50 shrink-0 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary-600" />
            <h3 className="font-bold text-sm text-neutral-900">Recent Activity</h3>
          </div>
          <div className="flex-1">
            <DataTable
              rowData={recentActivity}
              columnDefs={recentActivityColDefs}
              className="h-full border-0 shadow-none"
              overlayNoRowsTemplate='<div class="text-neutral-500 text-sm py-8 font-medium text-center"><p>No recent activity. Your submissions will appear here.</p></div>'
            />
          </div>
        </div>

      </div>

      {/* Advanced Document Viewer Dialog for Faculty */}
      <Dialog open={isDocViewerOpen} onOpenChange={setIsDocViewerOpen}>
        <DialogContent className="max-w-[90vw] lg:max-w-7xl xl:max-w-[1400px] w-full h-[88vh] bg-white border-neutral-200 p-0 overflow-hidden flex flex-col shadow-2xl">
          <DialogHeader className="px-5 py-4 border-b border-neutral-200 bg-neutral-50/50 shrink-0 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary-600" />
                {viewerCourseContext?.course_code} - {viewerDocContext?.doc_type}
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 font-medium mt-1">
                Viewing files you submitted for this requirement in {viewerCourseContext?.section}.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`uppercase tracking-wider font-bold text-[10px] px-2 py-0.5 shadow-none border mt-5 ${viewerDocContext?.is_submitted_late ? 'bg-warning/10 text-warning border-warning/20' : 'bg-success/10 text-success border-success/20'}`}>
                {viewerDocContext?.is_submitted_late ? 'LATE' : 'SUBMITTED'}
              </Badge>
              {(viewerDocContext?.status === 'REVISION_REQUESTED' || viewerDocContext?.status === 'RESUBMITTED') && (
                <Badge className={`uppercase tracking-wider font-bold text-[10px] px-2 py-0.5 shadow-none border mt-5 ${viewerDocContext?.status === 'REVISION_REQUESTED' ? 'bg-warning/10 text-warning border-warning/20' : 'bg-success/10 text-success border-success/20'}`}>
                  {viewerDocContext?.status === 'REVISION_REQUESTED' ? 'REQUEST REVISION' : 'SUBMITTED'}
                </Badge>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 flex overflow-hidden">
            {/* Left Side: File List */}
            <div className="w-1/3 min-w-[300px] border-r border-neutral-200 bg-neutral-50 flex flex-col">
              <div className="p-3 border-b border-neutral-200 bg-neutral-100/50 flex justify-between items-center">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Submitted Files ({viewerFiles.length})</h3>
              </div>

              {viewerDocContext?.status === 'REVISION_REQUESTED' && viewerDocContext?.approval_remarks && (
                <div className="m-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-xs font-bold text-destructive uppercase tracking-wider">Revision Remarks</span>
                  </div>
                  <p className="text-xs text-destructive font-medium leading-relaxed">
                    {viewerDocContext.approval_remarks}
                  </p>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {isViewerLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-neutral-400 gap-2">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span className="text-xs font-medium">Loading files...</span>
                  </div>
                ) : viewerFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4 bg-white rounded-xl border border-dashed border-neutral-200 text-center space-y-4 shadow-sm">
                    <div className="bg-neutral-50 p-3 rounded-full border border-neutral-100">
                      <Search className="h-6 w-6 text-neutral-300" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-neutral-900">No files found</p>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">You have not uploaded files for this requirement.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1 pr-3">
                      <div className="space-y-2.5 pb-4">
                        {viewerFiles.map((file) => (
                          <div
                            key={file.submission_id || file.gdrive_file_id}
                            className={`group relative p-3 rounded-xl border transition-all cursor-pointer flex gap-3 ${selectedViewerFile?.submission_id === (file.submission_id || file.gdrive_file_id) ? 'bg-primary-50 border-primary-300 shadow-sm' : 'bg-white border-neutral-200 hover:border-primary-200 hover:shadow-sm'}`}
                            onClick={() => setSelectedViewerFile(file)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="mb-2">
                                <p className={`text-sm font-bold truncate pr-3 ${selectedViewerFile?.submission_id === (file.submission_id || file.gdrive_file_id) ? 'text-primary-900' : 'text-neutral-900'}`} title={file.original_filename || file.standardized_filename}>
                                  {file.original_filename || file.standardized_filename || "Document"}
                                </p>
                                <div className="flex flex-wrap gap-1.5 mt-2 min-h-[14px]">
                                  {/* Only show badge if the specific file is requested for revision */}
                                  {(file.submission_status === 'REVISION_REQUESTED' || file.status === 'REVISION_REQUESTED') && (
                                    <Badge className="text-[7px] font-black bg-warning/10 text-warning border-warning/20 px-1 py-0 h-3.5 shrink-0 uppercase tracking-tighter">
                                      Request Revision
                                    </Badge>
                                  )}
                                  {(file.submission_status === 'RESUBMITTED' || file.status === 'RESUBMITTED') && (
                                    <Badge className="text-[7px] font-black bg-success/10 text-success border-success/20 px-1 py-0 h-3.5 shrink-0 uppercase tracking-tighter">
                                      Submitted
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex justify-between items-center text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(file.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                {file.file_size_bytes && <span>{(file.file_size_bytes / 1024 / 1024).toFixed(2)} MB</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Embedded Preview */}
            <div className="flex-1 bg-neutral-100 flex flex-col relative">
              {!selectedViewerFile ? (
                <div className="flex-1 flex flex-col items-center justify-center text-neutral-400">
                  <Eye className="h-12 w-12 mb-3 opacity-20 text-neutral-500" />
                  <p className="font-bold text-sm">Select a file to preview</p>
                </div>
              ) : (
                <>
                  <div className="h-12 bg-white border-b border-neutral-200 flex items-center px-5 justify-between shrink-0 shadow-sm z-10">
                    <span className="text-sm font-bold text-neutral-800 truncate pr-4">{selectedViewerFile.original_filename || selectedViewerFile.standardized_filename}</span>
                    <a
                      href={selectedViewerFile.gdrive_web_view_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold uppercase tracking-wider text-primary-600 hover:bg-primary-50 border border-transparent hover:border-primary-100 px-3 py-1.5 flex items-center gap-1.5 rounded-md transition-all shrink-0"
                    >
                      Open Native <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <iframe
                    src={selectedViewerFile.gdrive_web_view_link?.replace('/view', '/preview')}
                    className="w-full flex-1 border-0 bg-white"
                    title="Document Preview"
                    allow="autoplay"
                  />
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ToastProvider>
  );
}