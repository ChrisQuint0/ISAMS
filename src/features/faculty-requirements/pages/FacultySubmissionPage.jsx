import { useState, useEffect } from "react";
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
  FileIcon,
  X,
  ScanText,
  Check,
  Clock
} from "lucide-react";
import { useFacultySubmission } from "../hooks/FacultySubmissionHook";
import { FacultySubmissionService } from "../services/FacultySubmissionService";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function FacultySubmissionPage() {
  const navigate = useNavigate();
  const {
    courses,
    requiredDocs,
    loading,
    isSubmitting,
    error: hookError,
    loadRequiredDocs,
    submitDocument
  } = useFacultySubmission();

  // NOTE: If runOCR is not in hook, we can import service directly or add it to hook.
  // For now, let's import service directly to avoid hook refactor if possible, 
  // OR better: update hook to expose it. Let's use service directly for the action to be quick.
  // UPDATE: We also need getSubmissionHistory now.

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
  }, [uploadSuccess]); // Refresh history on successful upload

  // When course changes, load its required documents
  useEffect(() => {
    if (formData.course) {
      loadRequiredDocs(formData.course);
    }
  }, [formData.course]);

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
    const { allowedExts } = getValidationRules();

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = allowedExts.join(',');
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) validateFile(file);
    };
    input.click();
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
      docTypeId: formData.documentType
    });

    if (result) {
      setUploadSuccess(true);
      if (result.is_late) setIsLateSubmission(true);
      setTimeout(() => {
        // Reset form after 2 seconds
        setUploadSuccess(false);
        setIsLateSubmission(false);
        handleReset();
        // Optional: navigate to dashboard
        // navigate('/faculty-requirements/dashboard'); 
      }, 3000); // Increased timeout to read the message
    }
  };

  const handleResubmit = (sub) => {
    // Pre-fill form
    setFormData({
      course: sub.course_id,
      documentType: sub.doc_type_id
    });
    // Scroll to top
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Submission Portal</h1>
        <p className="text-slate-400">Upload and validate your documents with automated standardization</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Upload Section */}
        <div className="lg:col-span-2">
          {hookError && (
            <Alert variant="destructive" className="mb-4 border-red-900/50 bg-red-900/10 text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{hookError}</AlertDescription>
            </Alert>
          )}

          {uploadSuccess && (
            <Alert className="mb-4 border-green-900/50 bg-green-900/10 text-green-200">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription>Document submitted successfully! Redirecting...</AlertDescription>
            </Alert>
          )}

          {isLateSubmission && (
            <Alert className="mb-4 border-amber-900/50 bg-amber-900/10 text-amber-200">
              <Clock className="h-4 w-4 text-amber-400" />
              <AlertDescription>Document submitted successfully, but it was marked as LATE.</AlertDescription>
            </Alert>
          )}

          <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4 text-slate-100">Upload New Document</h3>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">Course</label>
                <select
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value, documentType: "" })}
                >
                  <option value="">Select course</option>
                  {courses.map(c => (
                    <option key={c.course_id} value={c.course_id}>{c.course_code} - {c.course_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">Document Type</label>
                <select
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  disabled={!formData.course || loading}
                >
                  <option value="">{loading ? "Loading..." : "Select document type"}</option>
                  {requiredDocs.map(doc => (
                    <option key={doc.doc_type_id} value={doc.doc_type_id} className={doc.is_submitted ? "text-green-400" : ""}>
                      {doc.type_name} {doc.is_submitted ? "(✔ Submitted)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Guidelines / Description Box */}
            {formData.documentType && (
              <div className="mb-6 bg-blue-900/20 border border-blue-900/50 rounded-lg p-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-300 mb-1">Guidelines</h4>
                  <p className="text-sm text-blue-200/80">
                    {requiredDocs.find(d => d.doc_type_id === formData.documentType)?.description || "No specific guidelines provided for this document type."}
                  </p>
                </div>
              </div>
            )}

            {/* Upload Area */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-200 mb-2">Upload File</label>
              <div
                onClick={handleFileSelect}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-3 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer group relative overflow-hidden
                  ${isDragOver ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 bg-slate-800/50 hover:bg-slate-800/70'}
                  ${selectedFile ? 'border-green-500/50 bg-green-500/5' : ''}
                `}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                    <FileIcon className="h-12 w-12 text-green-400 mb-3" />
                    <p className="text-slate-200 font-medium text-lg mb-1">{selectedFile.name}</p>
                    <p className="text-slate-400 text-sm mb-4">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type || 'Unknown Type'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleReset(); }}
                      className="bg-slate-800 border-slate-700 text-slate-300 hover:text-red-400 hover:border-red-400"
                    >
                      <X className="h-4 w-4 mr-2" /> Remove File
                    </Button>
                  </div>
                ) : (
                  <>
                    <CloudUpload className={`text-slate-400 mx-auto mb-3 h-12 w-12 group-hover:scale-110 transition-transform ${isDragOver ? 'text-blue-400 animate-bounce' : ''}`} />
                    <p className="text-slate-200 font-medium mb-1">
                      {isDragOver ? "Drop file here!" : "Click to browse or drag file here"}
                    </p>
                    <p className="text-slate-400 mb-4 text-sm">Supports: PDF, DOCX, XLSX, PNG, JPG (Max: 10MB)</p>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white pointer-events-none">
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
                  <div className="flex items-center p-3 bg-green-500/10 border border-green-500/20 rounded">
                    <CheckCircle className="text-green-400 mr-3 h-5 w-5" />
                    <div>
                      <p className="font-medium text-green-400 text-sm">System Check</p>
                      <p className="text-slate-400 text-xs">File size & extension valid</p>
                    </div>
                  </div>

                  {/* Content/OCR Check */}
                  <div className={`flex items-center p-3 rounded border transition-colors
                        ${isValidating ? 'bg-blue-500/10 border-blue-500/20' :
                      ocrResult?.success ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}
                    `}>
                    {isValidating ? (
                      <Loader2 className="text-blue-400 mr-3 h-5 w-5 animate-spin" />
                    ) : ocrResult?.success ? (
                      <ScanText className="text-green-400 mr-3 h-5 w-5" />
                    ) : (
                      <AlertCircle className="text-red-400 mr-3 h-5 w-5" />
                    )}

                    <div className="flex-1">
                      <p className={`font-medium text-sm ${isValidating ? 'text-blue-400' : ocrResult?.success ? 'text-green-400' : 'text-red-400'}`}>
                        {isValidating ? "Analyzing Content..." : "Content Validation"}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {isValidating ? "Running OCR..." : ocrResult?.text ? `Confidence: ${Math.round(ocrResult.confidence)}%` : "Check Complete"}
                      </p>
                    </div>
                  </div>
                </div>

                {ocrResult?.text && (
                  <div className="text-xs text-slate-500 bg-slate-950 p-3 rounded border border-slate-800 max-h-24 overflow-y-auto">
                    <span className="font-mono text-slate-400 block mb-1">OCR PREVIEW:</span>
                    {ocrResult.text.substring(0, 200)}...
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button
                onClick={handleSubmit}
                disabled={!selectedFile || !formData.documentType || !formData.course || isSubmitting || uploadSuccess}
                className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
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
                className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Form
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar - Submission History */}
        <div className="space-y-6">
          {/* Recent Submissions (Replaces Guidelines) */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-slate-100">Recent Submissions</h3>
              <Button variant="ghost" size="sm" onClick={fetchHistory} className="h-6 w-6 p-0 text-slate-400">
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {loadingHistory ? (
                <div className="text-center py-4 text-slate-500">Loading history...</div>
              ) : history.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-sm">No submissions yet.</div>
              ) : (
                history.map((sub) => (
                  <div key={sub.submission_id} className="p-3 bg-slate-950/50 rounded-lg border border-slate-800 text-sm hover:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-slate-200">{sub.documenttypes_fs?.type_name}</p>
                        <p className="text-xs text-slate-400">{sub.courses_fs?.course_code}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded uppercase tracking-wider ${sub.submission_status === 'APPROVED' ? 'bg-green-500/10 text-green-400' :
                        sub.submission_status === 'REJECTED' || sub.submission_status === 'REVISION_REQUESTED' ? 'bg-red-500/10 text-red-400' :
                          'bg-blue-500/10 text-blue-400'
                        }`}>
                        {sub.submission_status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-500 mt-2 pt-2 border-t border-slate-800/50">
                      <span>{new Date(sub.submitted_at).toLocaleDateString()}</span>

                      {(sub.submission_status === 'REJECTED' || sub.submission_status === 'REVISION_REQUESTED') && (
                        <button
                          onClick={() => handleResubmit(sub)}
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
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

          {/* Help & Support */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-lg mb-4 text-slate-100">Need Help?</h3>
            <div className="space-y-3 text-sm">
              <p className="text-slate-300">Having trouble with your submission? Contact our support team.</p>
              <div className="space-y-2">
                <p className="text-slate-400">Email: faculty.support@ccs.edu</p>
                <p className="text-slate-400">Phone: (02) 123-4567</p>
                <p className="text-slate-400">Office Hours: 8AM - 5PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
