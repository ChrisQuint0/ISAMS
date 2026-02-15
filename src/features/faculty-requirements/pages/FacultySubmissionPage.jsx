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
  AlertCircle
} from "lucide-react";
import { useFacultySubmission } from "../hooks/FacultySubmissionHook";
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

  const [selectedFile, setSelectedFile] = useState(null);
  const [showValidation, setShowValidation] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    documentType: "",
    course: ""
  });

  const [uploadSuccess, setUploadSuccess] = useState(false);

  // When course changes, load its required documents
  useEffect(() => {
    if (formData.course) {
      loadRequiredDocs(formData.course);
    }
  }, [formData.course]);

  const handleFileSelect = (e) => {
    // In a real file input, we'd get the file here. 
    // For this UI, we might need a hidden file input or just simulate if drag/drop isn't fully wired.
    // Let's assume this is clicked and opens a file dialog.
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ".pdf,.docx,.xlsx";
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          alert("File size exceeds 10MB limit.");
          return;
        }
        setSelectedFile(file);
        setShowValidation(true);
        setShowPreview(true);
      }
    };
    input.click();
  };

  const handleSubmit = async () => {
    if (!selectedFile || !formData.documentType || !formData.course) {
      alert("Please fill all required fields and select a file.");
      return;
    }

    const success = await submitDocument({
      file: selectedFile,
      courseId: formData.course,
      docTypeId: formData.documentType
    });

    if (success) {
      setUploadSuccess(true);
      setTimeout(() => {
        // Reset form after 2 seconds
        setUploadSuccess(false);
        handleReset();
        // Optional: navigate to dashboard
        // navigate('/faculty-requirements/dashboard'); 
      }, 2000);
    }
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

            {/* Upload Area */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-200 mb-2">Upload File</label>
              <div
                onClick={handleFileSelect}
                className="border-3 border-dashed border-slate-600 rounded-xl p-8 text-center bg-slate-800/50 hover:bg-slate-800/70 transition-colors cursor-pointer"
              >
                <CloudUpload className="text-slate-400 mx-auto mb-3 h-12 w-12" />
                <p className="text-slate-200 font-medium mb-1">{selectedFile ? selectedFile.name : "Click to browse files"}</p>
                <p className="text-slate-400 mb-4">{selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : "Supports: PDF, DOCX, XLSX (Max: 10MB)"}</p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white pointer-events-none">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  {selectedFile ? "Change File" : "Browse Files"}
                </Button>
              </div>
            </div>

            {/* Validation Messages */}
            {showValidation && (
              <div className="space-y-2 mb-6">
                <div className="flex items-center p-3 bg-green-500/10 border border-green-500/20 rounded">
                  <CheckCircle className="text-green-400 mr-3 h-5 w-5" />
                  <div>
                    <p className="font-medium text-green-400">File extension validated: {selectedFile?.name.split('.').pop()}</p>
                  </div>
                </div>
                {/* Simplified validation display for now */}
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
          {/* Submission Guidelines */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-lg mb-4 text-slate-100">Submission Guidelines</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <CheckCircle className="text-green-400 mr-2 h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-slate-300">Use the standardized naming convention</p>
              </div>
              <div className="flex items-start">
                <CheckCircle className="text-green-400 mr-2 h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-slate-300">Ensure document quality and completeness</p>
              </div>
              <div className="flex items-start">
                <CheckCircle className="text-green-400 mr-2 h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-slate-300">Submit before the deadline</p>
              </div>
              <div className="flex items-start">
                <CheckCircle className="text-green-400 mr-2 h-4 w-4 mt-0.5 flex-shrink-0" />
                <p className="text-slate-300">File size must not exceed 10MB</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/faculty-requirements/hub")}
              className="w-full mt-4 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              Download Templates
            </Button>
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
