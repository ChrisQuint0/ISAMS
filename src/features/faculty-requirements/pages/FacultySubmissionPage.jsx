import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useFacultySubmission } from "../hooks/FacultySubmissionHook";
import { FacultySubmissionService } from "../services/FacultySubmissionService";
import { useSubmission } from "../contexts/SubmissionContext";
import FilePreview from "../components/FilePreview";
import {
  CloudUpload,
  FolderOpen,
  CheckCircle,
  Settings,
  FileText,
  Expand,
  Upload,
  AlertCircle,
  X,
  Check,
  Clock,
  Search,
  History as HistoryIcon,
  Eye,
  AlertTriangle,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { ToastProvider, useToast } from "@/components/ui/toast/toaster";

// Toast Handler
const FacultyToastHandler = ({ success, error }) => {
  const { addToast } = useToast();

  useEffect(() => {
    if (success) {
      addToast({ title: "Success", description: String(success), variant: "success" });
    }
  }, [success, addToast]);

  useEffect(() => {
    if (error) {
      addToast({ title: "Error", description: String(error), variant: "destructive" });
    }
  }, [error, addToast]);

  return null;
};

export default function FacultySubmissionPage() {
  const navigate = useNavigate();
  const {
    courses,
    requiredDocs,
    loading,
    isSubmitting,
    error: hookError,
    submitDocument,
    currentSemester,
    currentAcademicYear,
    ocrEnabled,
    loadRequiredDocs,
    loadCourses,
    loadSettings,
  } = useFacultySubmission();

  const [stagedFiles, setStagedFiles] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [formData, setFormData] = useState({
    documentType: "",
    course: ""
  });

  const [isLateSubmission, setIsLateSubmission] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Local Toast States (Replaces native alerts and inline alerts)
  const [localToastError, setLocalToastError] = useState(null);
  const [localToastSuccess, setLocalToastSuccess] = useState(null);

  // History State
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Safe File Input Ref
  const fileInputRef = useRef(null);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await FacultySubmissionService.getSubmissionHistory();
      setHistory(data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleClearHistory = async () => {
    setIsClearingHistory(true);
    try {
      await FacultySubmissionService.clearSubmissionHistory();
      triggerSuccess("Submission history cleared successfully.");
      setHistory([]);
      loadRequiredDocs(formData.course); // Refresh statuses in dropdown
    } catch (error) {
      triggerError("Failed to clear history.");
    } finally {
      setIsClearingHistory(false);
      setShowClearConfirm(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (formData.course) {
      loadRequiredDocs(formData.course);
    }
  }, [formData.course]);

  // Real-time synchronization for admin changes
  useEffect(() => {
    const channel = supabase
      .channel("faculty-admin-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deadlines_fs" },
        () => {
          if (formData.course) loadRequiredDocs(formData.course);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documenttypes_fs" },
        () => {
          if (formData.course) loadRequiredDocs(formData.course);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "courses_fs" },
        () => {
          loadCourses();
          if (formData.course) loadRequiredDocs(formData.course);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "systemsettings_fs" },
        () => {
          loadSettings();
          loadCourses(); // System settings often affect which courses are "current"
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [formData.course]);

  // Sync effect: Re-ensure documentType is selected once requiredDocs finish loading
  // This handles the "Re-submit" race condition where formData.documentType is set
  // before the Select component's options (requiredDocs) are available.
  useEffect(() => {
    if (formData.documentType && !loading && requiredDocs.length > 0) {
      const exists = requiredDocs.some(d => String(d.doc_type_id) === String(formData.documentType));
      if (!exists) {
        // If the current docType isn't in the new list, we should probably clear it
        // BUT if we just triggered handleResubmit, we might want to wait.
        // For ISAMS, most re-submissions stay within the same requirements list.
      }
    }
  }, [loading, requiredDocs, formData.documentType]);

  // Helper to trigger toasts instead of native alerts
  const triggerError = (msg) => {
    setLocalToastError(msg);
    setTimeout(() => setLocalToastError(null), 3500); // Clear state so the same error can trigger again
  };

  const triggerSuccess = (msg) => {
    setLocalToastSuccess(msg);
    setTimeout(() => setLocalToastSuccess(null), 3500);
  };

  const getValidationRules = () => {
    const doc = requiredDocs.find(d => String(d.doc_type_id) === String(formData.documentType));
    return {
      maxMB: doc?.max_file_size_mb || 10,
      allowedExts: doc?.allowed_extensions?.map(e => e.toLowerCase().trim()) || ['.pdf', '.docx', '.xlsx', '.png', '.jpg', '.jpeg']
    };
  };

  const handleFilesAdded = async (filesArray) => {
    if (!formData.documentType) {
      triggerError("Please select a document type first.");
      return;
    }

    const { maxMB, allowedExts } = getValidationRules();
    const newStagedFiles = [];

    // Pre-validation and UI Queue Addition
    for (const file of filesArray) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      let error = null;

      if (file.size > maxMB * 1024 * 1024) {
        error = `Size exceeds ${maxMB}MB limit.`;
      } else if (!allowedExts.includes(ext)) {
        error = `Invalid type. Allowed: ${allowedExts.join(', ')}`;
      }

      newStagedFiles.push({
        id: crypto.randomUUID(),
        file,
        ext,
        validating: !error, // Only validate if no initial error
        error,
        ocrResult: null
      });
    }

    // Add to state immediately so UI shows spinners
    setStagedFiles(prev => [...prev, ...newStagedFiles]);

    // Process valid files for OCR independently
    for (const stagedFile of newStagedFiles) {
      if (stagedFile.error) continue; // Skip files with initial errors

      // Define an async IIFE to process without blocking the loop
      (async () => {
        try {
          const result = await FacultySubmissionService.runOCR(stagedFile.file, formData.documentType, stagedFile.ext);

          setStagedFiles(currentQueue => currentQueue.map(f => {
            if (f.id === stagedFile.id) {
              return {
                ...f,
                validating: false,
                ocrResult: result,
                error: result.success === false ? (result.error || result.text) : null
              };
            }
            return f;
          }));

        } catch (err) {
          setStagedFiles(currentQueue => currentQueue.map(f => {
            if (f.id === stagedFile.id) {
              return {
                ...f,
                validating: false,
                error: "OCR execution failed."
              };
            }
            return f;
          }));
        }
      })();
    }
  };

  const handleFileSelect = () => {
    if (!formData.course || !formData.documentType) {
      triggerError("Please select a course and document type first.");
      return;
    }
    // Safely trigger the hidden file input
    fileInputRef.current?.click();
  };

  const handleHiddenInputChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      handleFilesAdded(Array.from(event.target.files));
    }
    event.target.value = null;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(Array.from(e.dataTransfer.files));
    }
  };

  const handleSubmit = async () => {
    if (stagedFiles.length === 0 || !formData.documentType || !formData.course) {
      triggerError("Please fill all required fields and select at least one file.");
      return;
    }

    const hasValidationErrors = stagedFiles.some(f => f.validating || f.error);
    if (hasValidationErrors) {
      triggerError("Please resolve all validation errors before submitting.");
      return;
    }

    const filesToUpload = stagedFiles.map(f => ({ file: f.file }));

    const selectedCourse = courses.find(c => String(c.course_id) === String(formData.course));
    const selectedDocType = requiredDocs.find(d => String(d.doc_type_id) === String(formData.documentType));

    const result = await submitDocument({
      files: filesToUpload,
      courseId: formData.course,
      docTypeId: formData.documentType,
      semester: currentSemester,
      academicYear: currentAcademicYear,
      courseCode: selectedCourse?.course_code || 'Unknown Course',
      docTypeName: selectedDocType?.type_name || 'Document'
    });

    if (result) {
      if (result.is_late) {
        setIsLateSubmission(true);
        triggerSuccess("Upload succesfull on gdrive, but marked as LATE.");
      } else {
        triggerSuccess("Upload succesfull on gdrive");
      }

      fetchHistory();

      setTimeout(() => {
        setIsLateSubmission(false);
        handleReset();
      }, 3000);
    }
  };

  const handleResubmit = (sub) => {
    // Ensure staged files are cleared when starting a re-submission
    setStagedFiles([]);

    // Set form data with stringified IDs to match Select's expected value type
    setFormData({
      course: String(sub.course_id),
      documentType: String(sub.doc_type_id)
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Completely resets the entire form (Dropdowns + File)
  const handleReset = () => {
    setStagedFiles([]);
    setShowPreview(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setPreviewFile(null);
    setFormData({
      documentType: "",
      course: ""
    });
    setIsLateSubmission(false);
  };

  const handleRemoveFile = (id) => {
    setStagedFiles(prev => prev.filter(f => f.id !== id));
  };

  // Current "Today" for the app
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Status Calculation Helpers
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  const getDocStatus = (doc) => {
    if (!doc) return 'None';
    const issueDate = parseLocalDate(doc.issue_date);
    const dueDate = parseLocalDate(doc.deadline_date);
    const hardCutoff = dueDate ? new Date(dueDate) : null;
    if (hardCutoff) {
      hardCutoff.setDate(hardCutoff.getDate() + (doc.grace_period_days || 0));
    }

    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);

    if (!dueDate) return 'No Deadline';
    if (todayStart < issueDate) return 'Upcoming';
    if (todayStart > hardCutoff) return 'Passed';
    if (todayStart > dueDate) return 'Grace Period';
    return 'Active';
  };

  const selectedDocInfo = requiredDocs.find(d => String(d.doc_type_id) === String(formData.documentType));
  const docStatus = getDocStatus(selectedDocInfo);
  const isBlocked = docStatus === 'Passed' || docStatus === 'Upcoming';
  const isLate = docStatus === 'Grace Period';
  const isUploadLocked = !formData.course || !formData.documentType || isBlocked;

  return (
    <ToastProvider>
      <FacultyToastHandler error={localToastError || hookError} success={localToastSuccess} />
      <div className="space-y-6 flex flex-col h-full bg-neutral-50/30">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-1">Submission Portal</h1>
          <p className="text-neutral-500 text-sm font-medium">Upload and validate your documents with automated standardization</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Upload Section */}
          <div className="lg:col-span-2">

            <Card className="bg-white border-neutral-200 shadow-sm overflow-hidden mb-6">
              <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-4 shrink-0">
                <CardTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <CloudUpload className="h-4 w-4 text-primary-600" /> Upload New Document
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 lg:p-8 bg-white space-y-4">

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Course</label>
                    <Select
                      value={formData.course}
                      onValueChange={(value) => setFormData({ ...formData, course: value, documentType: "" })}
                      disabled={stagedFiles.length > 0 || isSubmitting}
                    >
                      <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm h-10 text-sm focus:ring-primary-500/20 font-medium disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed">
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-neutral-200 text-neutral-900">
                        {courses
                          .filter(c => c.master_courses_fs?.is_active !== false)
                          .map(c => (
                            <SelectItem key={c.course_id} value={String(c.course_id)} className="font-medium text-sm">
                              {c.course_code} ({c.section || 'No Section'}) - {c.course_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Document Type</label>
                    <Select
                      value={formData.documentType || ""}
                      onValueChange={(value) => {
                        const doc = requiredDocs.find(d => String(d.doc_type_id) === String(value));
                        const status = getDocStatus(doc);
                        if (status === 'Upcoming' || status === 'Passed') return; // Strict block
                        setFormData({ ...formData, documentType: value });
                      }}
                      disabled={!formData.course || loading || stagedFiles.length > 0 || isSubmitting}
                    >
                      <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm h-10 text-sm focus:ring-primary-500/20 font-medium disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed">
                        <SelectValue placeholder={loading ? "Loading..." : "Select document type"} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-neutral-200 text-neutral-900">
                        {requiredDocs
                          .filter(doc => doc.deadline_date) // Requirement 1: Only show those with deadlines
                          .map(doc => {
                            const status = getDocStatus(doc);
                            const isSubmitted = doc.is_submitted;
                            const isLateSubmission = doc.is_submitted_late;

                            let label = doc.type_name;
                            if (doc.is_required === false) label += " (Optional)";

                            let colorClass = "text-neutral-900 focus:text-neutral-900 focus:bg-neutral-100";
                            let isDisabled = false;

                            if (status === 'Upcoming') {
                              label += " (Upcoming)";
                              colorClass = "text-neutral-400 focus:text-neutral-400";
                              isDisabled = true;
                            } else if (status === 'Passed') {
                              isDisabled = true;
                              if (!isSubmitted) {
                                label += " (Passed)";
                                colorClass = "text-neutral-400 focus:text-neutral-400";
                              } else {
                                if (isLateSubmission) {
                                  label += " (Submitted but Late & Passed)";
                                  colorClass = "text-warning focus:text-warning focus:bg-warning/10";
                                } else {
                                  label += " (Submitted & Passed)";
                                  colorClass = "text-success focus:text-success focus:bg-success/10";
                                }
                              }
                            } else if (isSubmitted) {
                              if (isLateSubmission) {
                                label += " (Submitted but Late)";
                                colorClass = "text-warning focus:text-warning focus:bg-warning/10";
                              } else {
                                label += " (Submitted)";
                                colorClass = "text-success focus:text-success focus:bg-success/10";
                              }
                            } else if (status === 'Grace Period') {
                              label += " (Late)";
                              colorClass = "text-warning focus:text-warning focus:bg-warning/10";
                            }

                            return (
                              <SelectItem
                                key={doc.doc_type_id}
                                value={doc.doc_type_id.toString()}
                                disabled={isDisabled}
                                className={`font-medium text-sm ${colorClass}`}
                              >
                                {label}
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* NEW: Submission Closed Warning */}
                {isBlocked && (
                  <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start shadow-inner">
                    <AlertTriangle className="h-5 w-5 text-destructive mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-destructive mb-1">Submission Closed</h4>
                      <p className="text-sm text-neutral-700 font-medium">
                        The deadline for this document type (including any grace period) has passed. Submissions are no longer accepted for this academic period.
                      </p>
                    </div>
                  </div>
                )}

                {/* NEW: Late Submission Warning */}
                {isLate && (
                  <div className="mb-6 bg-warning/10 border border-warning/20 rounded-lg p-4 flex items-start shadow-inner">
                    <Clock className="h-5 w-5 text-warning mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-warning mb-1">Late Submission</h4>
                      <p className="text-sm text-neutral-700 font-medium">
                        The primary deadline for this document has passed. You are currently within the grace period, but this submission will be flagged as <span className="text-warning font-bold">LATE</span>.
                      </p>
                    </div>
                  </div>
                )}

                {/* Guidelines / Description Box */}

                {/* NEW: Naming Convention Warning */}
                {formData.documentType && (
                  <div className="mb-6 bg-warning/5 border border-warning/20 rounded-lg p-4 flex items-start shadow-inner">
                    <AlertTriangle className="h-5 w-5 text-warning mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-warning mb-1">Important: File Naming</h4>
                      <p className="text-sm text-neutral-700 font-medium">
                        Please ensure your original files are named clearly before uploading (e.g., <span className="font-mono text-warning font-bold px-1 bg-warning/10 rounded">Week_1_Activity</span>). The system will automatically attach your Course Code, Name, and Document Type to the front of the file to prevent batch uploads from overwriting each other.
                      </p>
                    </div>
                  </div>
                )}

                {formData.documentType && (
                  <div className="mb-6 bg-info/5 border border-info/20 rounded-lg p-4 flex items-start shadow-inner">
                    <AlertCircle className="h-5 w-5 text-info mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-info mb-1">Guidelines</h4>
                      <p className="text-sm text-neutral-700 font-medium">
                        {requiredDocs.find(d => String(d.doc_type_id) === String(formData.documentType))?.description || "No guidelines or description set for this document type."}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Upload File</label>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    className="hidden"
                    accept={formData.documentType ? getValidationRules().allowedExts.join(',') : ""}
                    onChange={handleHiddenInputChange}
                    disabled={isUploadLocked}
                  />

                  {/* Dynamic Dropzone */}
                  {/* Dynamic Dropzone */}
                  <div
                    onClick={isUploadLocked ? undefined : handleFileSelect}
                    onDragOver={isUploadLocked ? undefined : handleDragOver}
                    onDragLeave={isUploadLocked ? undefined : handleDragLeave}
                    onDrop={isUploadLocked ? undefined : handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 relative overflow-hidden mb-4
                      ${isUploadLocked
                        ? 'opacity-60 bg-neutral-50 border-neutral-200 cursor-not-allowed'
                        : 'cursor-pointer group hover:bg-neutral-100 hover:border-primary-300 bg-neutral-50 border-neutral-300'
                      }
                      ${!isUploadLocked && isDragOver ? 'border-primary-500 bg-primary-50 scale-[1.02]' : ''}
                    `}
                  >
                    <CloudUpload className={`mx-auto mb-3 h-12 w-12 transition-all ${isUploadLocked ? 'text-neutral-300' : 'text-neutral-400 group-hover:scale-110 group-hover:text-primary-500'} ${!isUploadLocked && isDragOver ? 'text-primary-600 animate-bounce' : ''}`} />
                    <p className={`font-bold mb-1 ${isUploadLocked ? 'text-neutral-400' : 'text-neutral-900'}`}>
                      {isBlocked ? "Submission Window Closed" : isUploadLocked ? "Select Course and Document Type first" : isDragOver ? "Drop files here!" : "Click to browse or drag files here"}
                    </p>
                    <p className="text-neutral-500 mb-4 text-xs font-medium max-w-sm mx-auto leading-relaxed">
                      {isBlocked
                        ? `The cutoff date has passed. Contact the administrator if you believe this is an error.`
                        : isUploadLocked
                          ? `Upload is locked until required fields are selected.`
                          : `Supports: ${getValidationRules().allowedExts.join(', ').replace(/\./g, '').toUpperCase()} (Max: ${getValidationRules().maxMB}MB)`}
                    </p>
                    <Button
                      variant={isUploadLocked ? "outline" : "default"}
                      className={`${isUploadLocked ? "bg-neutral-100 text-neutral-400 border-neutral-200" : "bg-primary-600 hover:bg-primary-700 text-white shadow-sm"} font-bold pointer-events-none`}
                      disabled={isUploadLocked}
                    >
                      {isUploadLocked ? <Settings className="h-4 w-4 mr-2 opacity-50" /> : <FolderOpen className="h-4 w-4 mr-2" />}
                      {isUploadLocked ? "Upload Locked" : "Browse Files"}
                    </Button>
                  </div>

                  {/* Staged Files Queue */}
                  {stagedFiles.length > 0 && (
                    <div className="border border-neutral-200 rounded-xl bg-neutral-50 shadow-inner overflow-hidden max-h-[300px] overflow-y-auto mb-6">
                      <div className="bg-neutral-100 border-b border-neutral-200 px-4 py-2 flex justify-between items-center sticky top-0 z-10 backdrop-blur-sm bg-neutral-100/90">
                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{stagedFiles.length} file(s) staged</span>
                      </div>
                      <div className="divide-y divide-neutral-200">
                        {stagedFiles.map((stagedFile) => (
                          <div key={stagedFile.id} className="p-4 bg-white flex items-start gap-4 transition-colors hover:bg-neutral-50/50">
                            {/* File Icon */}
                            <div className="shrink-0 mt-1">
                              <FileText className="h-8 w-8 text-neutral-400" />
                            </div>

                            {/* File Details */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-neutral-900 truncate pr-4">{stagedFile.file.name}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs text-neutral-500 font-mono bg-neutral-100 px-1.5 py-0.5 rounded">
                                  {(stagedFile.file.size / 1024 / 1024).toFixed(2)} MB
                                </span>

                                {/* Status Indicator */}
                                {stagedFile.validating ? (
                                  <span className="inline-flex items-center text-xs font-bold text-info ml-2">
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Analyzing OCR...
                                  </span>
                                ) : stagedFile.error ? (
                                  <span className="inline-flex items-center text-xs font-bold text-destructive ml-2">
                                    <AlertCircle className="h-3 w-3 mr-1" /> {stagedFile.error}
                                  </span>
                                ) : stagedFile.ocrResult?.success ? (
                                  <span className="inline-flex items-center text-xs font-bold text-success ml-2">
                                    <CheckCircle className="h-3 w-3 mr-1" /> OCR Passed ({Math.round(stagedFile.ocrResult.confidence)}%)
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="shrink-0 flex items-center gap-2 mt-1">
                              <Button
                                variant="outline"
                                size="icon-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewUrl(URL.createObjectURL(stagedFile.file));
                                  setPreviewFile(stagedFile.file);
                                  setShowPreview(true);
                                }}
                                className="h-8 w-8 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 bg-white"
                                title="Preview File"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon-xs"
                                onClick={(e) => { e.stopPropagation(); handleRemoveFile(stagedFile.id); }}
                                className="h-8 w-8 text-neutral-400 hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 bg-white"
                                title="Remove file"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>



                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-neutral-100">
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      stagedFiles.length === 0 ||
                      !formData.documentType ||
                      !formData.course ||
                      isSubmitting ||
                      localToastSuccess ||
                      stagedFiles.some(f => f.validating || f.error)
                    }
                    className="bg-primary-600 hover:bg-primary-700 text-white flex-1 font-bold shadow-sm active:scale-95 transition-all h-11 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Submitting...
                      </>
                    ) : stagedFiles.some(f => f.validating) ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Validating Document(s)...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" /> Submit Document
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    disabled={isSubmitting || stagedFiles.some(f => f.validating)}
                    className="bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 font-bold shadow-sm sm:w-1/3 h-11 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Form
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Embedded Document Preview Modal */}
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogContent className="bg-neutral-50 border-neutral-200 text-neutral-900 !max-w-[95vw] !w-[95vw] !h-[90vh] flex flex-col shadow-2xl p-0 overflow-hidden">
              <DialogHeader className="p-4 bg-white border-b border-neutral-200 shadow-sm shrink-0 flex flex-row items-center justify-between">
                <div>
                  <DialogTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary-600" /> Document Preview
                  </DialogTitle>
                  <p className="text-sm font-medium text-neutral-500 mt-1">
                    {previewFile?.name} ({(previewFile?.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-hidden p-4">
                <FilePreview file={previewFile} url={previewUrl} />
              </div>
            </DialogContent>
          </Dialog>

          {/* Sidebar - Submission History */}
          <div className="flex flex-col gap-6">
            <Card className="bg-white border-neutral-200 shadow-sm overflow-hidden flex flex-col">
              <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-4 flex flex-row items-center justify-between shrink-0">
                <CardTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <HistoryIcon className="h-4 w-4 text-primary-600" /> Recent Submissions
                </CardTitle>
                <div className="flex items-center gap-1">
                  {history.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowClearConfirm(true)}
                      className="h-7 w-7 text-neutral-400 hover:text-destructive hover:bg-destructive/10"
                      title="Clear History"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchHistory}
                    disabled={loadingHistory}
                    className="h-7 w-7 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingHistory ? 'animate-spin text-primary-600' : ''}`} />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-4 px-4 space-y-3 bg-white max-h-[500px] overflow-y-auto custom-scrollbar">
                {loadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-8 text-neutral-500 gap-3">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary-500" />
                    <p className="text-sm font-medium">Loading history...</p>
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-10 bg-neutral-50 rounded-lg border border-dashed border-neutral-200 text-neutral-500 text-sm font-medium">
                    No submissions yet.
                  </div>
                ) : (
                  (() => {
                    // Group history by course and doc type to avoid duplicates for multi-file requirements
                    const grouped = history.reduce((acc, sub) => {
                      const key = `${sub.course_id}_${sub.doc_type_id}`;
                      if (!acc[key]) {
                        acc[key] = { ...sub };
                      } else {
                        // Keep the most recent record
                        if (new Date(sub.submitted_at) > new Date(acc[key].submitted_at)) {
                          acc[key] = { ...sub };
                        }
                        // Priority Check: If any file in the group is 'REVISION_REQUESTED', show that status
                        if (sub.submission_status === 'REVISION_REQUESTED') {
                          acc[key].submission_status = 'REVISION_REQUESTED';
                        }
                      }
                      return acc;
                    }, {});

                    return Object.values(grouped)
                      .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
                      .map((sub) => (
                        <div key={sub.submission_id} className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-sm hover:border-primary-300 hover:shadow-md transition-all group">
                          <div className="flex justify-between items-start mb-2">
                            <div className="pr-2">
                              <p className="font-bold text-neutral-900 leading-tight">{sub.documenttypes_fs?.type_name}</p>
                              <p className="text-xs font-mono text-primary-600 mt-1 font-bold">
                                {sub.courses_fs?.course_code} ({sub.courses_fs?.section || 'No Section'})
                              </p>
                            </div>
                              <Badge variant="outline" className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full shadow-sm shrink-0 ${sub.submission_status === 'SUBMITTED' || sub.submission_status === 'APPROVED' || sub.submission_status === 'VALIDATED' || sub.submission_status === 'RESUBMITTED' ? 'bg-success/10 text-success border-success/20' :
                                sub.submission_status === 'REVISION_REQUESTED' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                  sub.submission_status === 'REJECTED' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                    'bg-info/10 text-info border-info/20'
                              }`}>
                              {sub.submission_status === 'REVISION_REQUESTED' ? 'REVISION ONGOING' : sub.submission_status === 'RESUBMITTED' ? 'SUBMITTED' : sub.submission_status}
                            </Badge>
                          </div>

                          <div className="flex justify-between items-center text-[11px] font-bold text-neutral-500 mt-3 pt-3 border-t border-neutral-200/60 uppercase tracking-wider">
                            <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{new Date(sub.submitted_at).toLocaleDateString()}</span>

                            <div className="flex gap-2">
                              {(sub.submission_status === 'REJECTED' || sub.submission_status === 'REVISION_REQUESTED') && (
                                <button
                                  onClick={() => handleResubmit(sub)}
                                  className="text-primary-600 hover:text-primary-700 flex items-center gap-1 font-bold transition-colors bg-primary-50 px-2 py-1 rounded"
                                >
                                  Re-submit
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ));
                  })()
                )}
              </CardContent>
            </Card>

            {/* Clear History Confirmation Dialog */}
            <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
              <DialogContent className="max-w-md p-6 bg-white rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-destructive" /> Confirm Deletion
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4 text-neutral-600 font-medium text-sm leading-relaxed">
                  Are you sure you want to clear your submission history? This action will permanently delete all your recent submission records from the database and cannot be undone.
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowClearConfirm(false)}
                    disabled={isClearingHistory}
                    className="font-bold rounded-lg border-neutral-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleClearHistory}
                    disabled={isClearingHistory}
                    className="font-bold shadow-sm rounded-lg"
                  >
                    {isClearingHistory ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Clearing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" /> Yes, Clear All History
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}