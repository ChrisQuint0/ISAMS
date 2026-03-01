import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  CloudUpload,
  FolderOpen,
  CheckCircle,
  Settings,
  FileText,
  Expand,
  Upload,
  RotateCcw,
  Loader2,
  AlertCircle,
  X,
  Check,
  Clock,
  Search,
  History as HistoryIcon // Aliased to prevent global browser History constructor clash
} from "lucide-react";
import { useFacultySubmission } from "../hooks/FacultySubmissionHook";
import { FacultySubmissionService } from "../services/FacultySubmissionService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

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
    ocrEnabled
  } = useFacultySubmission();

  const [selectedFile, setSelectedFile] = useState(null);
  const [showValidation, setShowValidation] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    documentType: "",
    course: ""
  });

  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isLateSubmission, setIsLateSubmission] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  // History State
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Safe File Input Ref
  const fileInputRef = useRef(null);

  const fetchHistory = async () => {
    try {
      const data = await FacultySubmissionService.getSubmissionHistory();
      setHistory(data || []);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getValidationRules = () => {
    const doc = requiredDocs.find(d => String(d.doc_type_id) === String(formData.documentType));
    return {
      maxMB: doc?.max_file_size_mb || 10,
      allowedExts: doc?.allowed_extensions?.map(e => e.toLowerCase().trim()) || ['.pdf', '.docx', '.xlsx', '.png', '.jpg', '.jpeg']
    };
  };

  const validateFile = async (file) => {
    if (!formData.documentType) {
      alert("Please select a document type first.");
      return;
    }

    const { maxMB, allowedExts } = getValidationRules();

    // 1. Size Check
    if (file.size > maxMB * 1024 * 1024) {
      alert(`File size exceeds ${maxMB}MB limit.`);
      return;
    }

    // 2. Extension Check
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedExts.includes(ext)) {
      alert(`Invalid file type. Allowed: ${allowedExts.join(', ')}`);
      return;
    }

    setSelectedFile(file);
    setShowValidation(true);
    setShowPreview(true);
    setOcrResult(null);

    // 3. OCR Check (If image)
    if (['.png', '.jpg', '.jpeg'].includes(ext)) {
      if (!ocrEnabled) {
        setOcrResult({ success: false, text: "Can't validate the file, Master Switch is Off", confidence: 0 });
        return;
      }
      setIsValidating(true);
      const result = await FacultySubmissionService.runOCR(file);
      setOcrResult(result);
      setIsValidating(false);
    } else {
      setOcrResult({ success: true, text: "Format valid (OCR skipped for non-image)", confidence: 100 });
    }
  };

  const handleFileSelect = () => {
    if (!formData.documentType) {
      alert("Please select a document type first.");
      return;
    }
    // Safely trigger the hidden file input
    fileInputRef.current?.click();
  };

  const handleHiddenInputChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      validateFile(file);
    }
    // Reset so the same file can be selected again if removed
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
    const file = e.dataTransfer.files[0];
    if (file) validateFile(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !formData.documentType || !formData.course) {
      alert("Please fill all required fields and select a file.");
      return;
    }

    const result = await submitDocument({
      file: selectedFile,
      courseId: formData.course,
      docTypeId: formData.documentType,
      semester: currentSemester,
      academicYear: currentAcademicYear
    });

    if (result) {
      setUploadSuccess(true);
      if (result.is_late) setIsLateSubmission(true);

      fetchHistory(); // Manually refresh history

      setTimeout(() => {
        setUploadSuccess(false);
        setIsLateSubmission(false);
        handleReset();
      }, 3000);
    }
  };

  const handleResubmit = (sub) => {
    setFormData({
      course: sub.course_id,
      documentType: sub.doc_type_id
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setSelectedFile(null);
    setShowValidation(false);
    setShowPreview(false);
    setFormData({
      documentType: "",
      course: ""
    });
    setUploadSuccess(false);
    setIsLateSubmission(false);
    setOcrResult(null);
    setIsValidating(false);
  };

  return (
    <div className="space-y-6 flex flex-col h-full bg-neutral-50/30">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-1">Submission Portal</h1>
        <p className="text-neutral-500 text-sm font-medium">Upload and validate your documents with automated standardization</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Upload Section */}
        <div className="lg:col-span-2">
          {hookError && (
            <Alert variant="destructive" className="mb-4 border-destructive/30 bg-destructive/5 text-destructive shadow-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-medium">{hookError}</AlertDescription>
            </Alert>
          )}

          {uploadSuccess && (
            <Alert className={`mb-4 shadow-sm ${isLateSubmission
              ? 'border-warning/30 bg-warning/5 text-warning'
              : 'border-success/30 bg-success/5 text-success'}`}>
              {isLateSubmission
                ? <Clock className="h-4 w-4 text-warning" />
                : <CheckCircle className="h-4 w-4 text-success" />}
              <AlertDescription className="font-bold">
                {isLateSubmission
                  ? 'Document submitted, but marked as LATE. Redirecting...'
                  : 'Document submitted successfully! Redirecting...'}
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 lg:p-8 mb-6">
            <h3 className="font-bold text-lg mb-6 text-neutral-900 flex items-center gap-2">
              <CloudUpload className="h-5 w-5 text-primary-600" /> Upload New Document
            </h3>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Course</label>
                <select
                  className="w-full px-3 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm font-medium cursor-pointer"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value, documentType: "" })}
                >
                  <option value="" disabled>Select a course</option>
                  {courses.map(c => (
                    <option key={c.course_id} value={c.course_id}>{c.course_code} - {c.course_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Document Type</label>
                <select
                  className="w-full px-3 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm font-medium disabled:bg-neutral-50 disabled:text-neutral-400 cursor-pointer"
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  disabled={!formData.course || loading}
                >
                  <option value="" disabled>{loading ? "Loading..." : "Select document type"}</option>
                  {requiredDocs.map(doc => (
                    <option key={doc.doc_type_id} value={doc.doc_type_id} className={doc.is_submitted ? "text-success font-bold" : ""}>
                      {doc.type_name} {doc.is_submitted ? "(✔ Submitted)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Guidelines / Description Box */}
            {formData.documentType && (
              <div className="mb-6 bg-info/5 border border-info/20 rounded-lg p-4 flex items-start shadow-inner">
                <AlertCircle className="h-5 w-5 text-info mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-info mb-1">Guidelines</h4>
                  <p className="text-sm text-neutral-700 font-medium">
                    {requiredDocs.find(d => String(d.doc_type_id) === String(formData.documentType))?.description || "No specific guidelines provided for this document type."}
                  </p>
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Upload File</label>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={formData.documentType ? getValidationRules().allowedExts.join(',') : ""}
                onChange={handleHiddenInputChange}
              />

              <div
                onClick={handleFileSelect}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer group relative overflow-hidden
                  ${isDragOver ? 'border-primary-500 bg-primary-50 scale-[1.02]' : 'border-neutral-300 bg-neutral-50 hover:bg-neutral-100 hover:border-primary-300'}
                  ${selectedFile ? 'border-success/50 bg-success/5' : ''}
                `}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                    <FileText className="h-12 w-12 text-success mb-3 drop-shadow-sm" />
                    <p className="text-neutral-900 font-bold text-lg mb-1">{selectedFile.name}</p>
                    <p className="text-neutral-500 font-medium text-sm mb-4 bg-white px-3 py-1 rounded-full border border-neutral-200 shadow-sm">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type || 'Unknown Type'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleReset(); }}
                      className="bg-white border-neutral-200 text-destructive hover:text-white hover:bg-destructive shadow-sm transition-colors font-bold"
                    >
                      <X className="h-4 w-4 mr-1.5" /> Remove File
                    </Button>
                  </div>
                ) : (
                  <>
                    <CloudUpload className={`text-neutral-400 mx-auto mb-3 h-12 w-12 group-hover:scale-110 group-hover:text-primary-500 transition-all ${isDragOver ? 'text-primary-600 animate-bounce' : ''}`} />
                    <p className="text-neutral-900 font-bold mb-1">
                      {isDragOver ? "Drop file here!" : "Click to browse or drag file here"}
                    </p>
                    <p className="text-neutral-500 mb-4 text-xs font-medium max-w-sm mx-auto leading-relaxed">
                      {formData.documentType
                        ? `Supports: ${getValidationRules().allowedExts.join(', ').replace(/\./g, '').toUpperCase()} (Max: ${getValidationRules().maxMB}MB)`
                        : `Select a document type to view supported formats`}
                    </p>
                    <Button
                      className="bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-sm pointer-events-none"
                      disabled={!formData.documentType}
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Browse Files
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Validation Messages */}
            {showValidation && (
              <div className="space-y-3 mb-6 animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* File Check */}
                  <div className="flex items-center p-3 bg-success/5 border border-success/20 rounded-lg shadow-sm">
                    <CheckCircle className="text-success mr-3 h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-bold text-success text-xs uppercase tracking-wider">System Check</p>
                      <p className="text-neutral-600 text-xs font-medium mt-0.5">File size & extension valid</p>
                    </div>
                  </div>

                  {/* Content/OCR Check */}
                  <div className={`flex items-center p-3 rounded-lg border shadow-sm transition-colors
                        ${isValidating ? 'bg-info/5 border-info/20' :
                      ocrResult?.success ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}
                    `}>
                    {isValidating ? (
                      <Loader2 className="text-info mr-3 h-5 w-5 animate-spin shrink-0" />
                    ) : ocrResult?.success ? (
                      <Search className="text-success mr-3 h-5 w-5 shrink-0" />
                    ) : (
                      <AlertCircle className="text-destructive mr-3 h-5 w-5 shrink-0" />
                    )}

                    <div className="flex-1">
                      <p className={`font-bold text-xs uppercase tracking-wider ${isValidating ? 'text-info' : ocrResult?.success ? 'text-success' : 'text-destructive'}`}>
                        {isValidating ? "Analyzing Content..." : "Content Validation"}
                      </p>
                      <p className="text-neutral-600 text-xs font-medium mt-0.5">
                        {isValidating ? "Running OCR checks..." :
                          ocrResult?.success ? `Confidence: ${Math.round(ocrResult.confidence)}%` :
                            ocrResult?.text || "Check Complete"}
                      </p>
                    </div>
                  </div>
                </div>

                {ocrResult?.text && (
                  <div className="text-xs text-neutral-700 bg-neutral-50 p-4 rounded-lg border border-neutral-200 max-h-32 overflow-y-auto shadow-inner leading-relaxed">
                    <span className="font-bold text-neutral-400 uppercase tracking-widest block mb-2 text-[10px]">OCR Raw Output:</span>
                    <span className="font-mono">{ocrResult.text.substring(0, 300)}{ocrResult.text.length > 300 ? '...' : ''}</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-neutral-100">
              <Button
                onClick={handleSubmit}
                disabled={!selectedFile || !formData.documentType || !formData.course || isSubmitting || uploadSuccess}
                className="bg-primary-600 hover:bg-primary-700 text-white flex-1 font-bold shadow-sm active:scale-95 transition-all h-11"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...
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
                disabled={isSubmitting}
                className="bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 font-bold shadow-sm sm:w-1/3 h-11"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Form
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar - Submission History */}
        <div className="space-y-6 flex flex-col h-full">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3 shrink-0">
              <h3 className="font-bold text-neutral-900 flex items-center gap-2">
                <HistoryIcon className="h-4 w-4 text-primary-600" /> Recent Submissions
              </h3>
              <Button variant="ghost" size="icon" onClick={fetchHistory} className="h-7 w-7 text-neutral-400 hover:text-primary-600 hover:bg-primary-50">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-8 text-neutral-500 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                  <p className="text-sm font-medium">Loading history...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-10 bg-neutral-50 rounded-lg border border-dashed border-neutral-200 text-neutral-500 text-sm font-medium">
                  No submissions yet.
                </div>
              ) : (
                history.map((sub) => (
                  <div key={sub.submission_id} className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-sm hover:border-primary-300 hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="pr-2">
                        <p className="font-bold text-neutral-900 leading-tight">{sub.documenttypes_fs?.type_name}</p>
                        <p className="text-xs font-mono text-primary-600 mt-1 font-bold">{sub.courses_fs?.course_code}</p>
                      </div>
                      <Badge variant="outline" className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full shadow-sm shrink-0 ${sub.submission_status === 'APPROVED' || sub.submission_status === 'VALIDATED' ? 'bg-success/10 text-success border-success/20' :
                          sub.submission_status === 'REJECTED' || sub.submission_status === 'REVISION_REQUESTED' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                            'bg-info/10 text-info border-info/20'
                        }`}>
                        {sub.submission_status}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center text-[11px] font-bold text-neutral-500 mt-3 pt-3 border-t border-neutral-200/60 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{new Date(sub.submitted_at).toLocaleDateString()}</span>

                      {(sub.submission_status === 'REJECTED' || sub.submission_status === 'REVISION_REQUESTED') && (
                        <button
                          onClick={() => handleResubmit(sub)}
                          className="text-primary-600 hover:text-primary-700 flex items-center gap-1 font-bold transition-colors bg-primary-50 px-2 py-1 rounded"
                        >
                          <RotateCcw className="h-3 w-3" /> Re-submit
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}