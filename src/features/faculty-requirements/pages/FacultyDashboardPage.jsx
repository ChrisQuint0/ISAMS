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
  const isOrange = v === 'REVISION_REQUESTED' || v === 'LATE';
  const isPassed = v === 'PASSED';

  const cls = isGreen ? 'bg-[#E6F7F0] text-[#00A86B] border-[#00A86B]/20'
    : isRed ? 'bg-destructive/10 text-destructive border-destructive/20'
      : isOrange ? 'bg-warning/10 text-warning border-warning/20'
        : 'bg-[#F1F5F9] text-[#475569] border-[#475569]/10';

  const label = v === 'SUBMITTED' || v === 'RESUBMITTED' ? 'Submitted'
    : v === 'APPROVED' || v === 'VALIDATED' ? 'Approved'
      : v === 'REVISION_REQUESTED' ? 'Revision'
        : v === 'LATE' ? 'Late'
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
  const { addToast: toast } = useToast();

  // Move preview logic here for use in JSX
  let fileId = null;
  let previewUrl = null;
  let openNativeUrl = null;
  if (selectedViewerFile) {
    fileId = selectedViewerFile.gdrive_file_id
      || (() => {
        const m = (selectedViewerFile.gdrive_web_view_link || '').match(/\/d\/([a-zA-Z0-9_-]+)/);
        return m ? m[1] : null;
      })();
    previewUrl = fileId
      ? `https://drive.google.com/file/d/${fileId}/preview`
      : null;
    openNativeUrl = selectedViewerFile.gdrive_web_view_link
      || (fileId ? `https://drive.google.com/file/d/${fileId}/view` : '#');
  }
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
      flex: 0.7,
      cellRenderer: (p) => (
        <span className="font-bold text-xs px-2 py-0.5 rounded-full border bg-primary-50 text-primary-700 border-primary-200 font-mono">
          {p.value || '—'}
        </span>
      )
    },
    {
      field: "section",
      headerName: "Section",
      flex: 0.8,
      cellRenderer: (p) => (
        <span className="font-bold text-xs px-2 py-0.5 rounded-full border bg-neutral-100 text-neutral-700 border-neutral-200 font-mono">
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
      cellRenderer: (p) => {
        const isCompleted = p.value === 'SUBMITTED' || p.value === 'RESUBMITTED' || p.value === 'APPROVED' || p.value === 'VALIDATED';
        const displayValue = p.data.is_submitted_late && isCompleted ? 'LATE' : p.value;
        return (
          <div className="flex items-center h-full">
            <StatusBadge value={displayValue} />
          </div>
        );
      }
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
      toast({ title: "Success", description: "Certificate generated successfully!", variant: "success" });
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
      <>
        <div className="flex flex-col items-center justify-center h-96">
          <RefreshCw className="h-10 w-10 animate-spin text-primary-600 mb-4" />
          <p className="text-neutral-500 font-medium">Loading dashboard...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <ToastProvider>
        <div className="space-y-6 flex flex-col h-full bg-neutral-50/30">
          {/* ...existing code... */}

          {/* Recent Activity Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
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
                    <span className="text-sm font-bold text-neutral-800 truncate pr-4">
                      {selectedViewerFile.original_filename || selectedViewerFile.standardized_filename}
                    </span>
                    <a
                      href={openNativeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold uppercase tracking-wider text-primary-600 hover:bg-primary-50 border border-transparent hover:border-primary-100 px-3 py-1.5 flex items-center gap-1.5 rounded-md transition-all shrink-0"
                    >
                      Open Native <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  {previewUrl ? (
                    <iframe
                      src={previewUrl}
                      className="w-full flex-1 border-0 bg-white"
                      title="Document Preview"
                      allow="autoplay"
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 gap-2">
                      <Eye className="h-10 w-10 opacity-20" />
                      <p className="text-sm font-bold">Preview not available</p>
                      <p className="text-xs text-neutral-400">Use Open Native to view this file</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  </ToastProvider>
</>
  );
}