import { useState } from "react";
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
  Eye,
  Clock
} from "lucide-react";

export default function FacultySubmissionPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [showValidation, setShowValidation] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    documentType: "",
    course: ""
  });

  const handleFileSelect = () => {
    // Simulate file selection
    setSelectedFile({
      name: "example_document.pdf",
      size: "2.4 MB",
      type: "application/pdf"
    });
    setShowValidation(true);
    setShowPreview(true);
  };

  const handleSubmit = () => {
    if (!selectedFile || !formData.documentType || !formData.course) {
      alert("Please fill all required fields and select a file.");
      return;
    }
    
    alert(
      'File validation complete!\n✓ Extension validated (.pdf)\n✓ Auto-renamed using convention\n✓ File size within limits\n\nDocument submitted successfully. Digital receipt generated.'
    );
    
    // Reset form
    setSelectedFile(null);
    setShowValidation(false);
    setShowPreview(false);
    setFormData({
      documentType: "",
      course: ""
    });
  };

  const handleReset = () => {
    setSelectedFile(null);
    setShowValidation(false);
    setShowPreview(false);
    setFormData({
      documentType: "",
      course: ""
    });
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
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4 text-slate-100">Upload New Document</h3>
            
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">Document Type</label>
                <select 
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.documentType}
                  onChange={(e) => setFormData({...formData, documentType: e.target.value})}
                >
                  <option value="">Select document type</option>
                  <option value="Course Syllabus">Course Syllabus</option>
                  <option value="Final Grades (Excel)">Final Grades (Excel)</option>
                  <option value="PDF Presentations">PDF Presentations</option>
                  <option value="Exam Questionnaires">Exam Questionnaires</option>
                  <option value="Table of Specifications">Table of Specifications</option>
                  <option value="Course Portfolio">Course Portfolio</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">Course</label>
                <select 
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.course}
                  onChange={(e) => setFormData({...formData, course: e.target.value})}
                >
                  <option value="">Select course</option>
                  <option value="CCS 101 - Intro to Computer Science">CCS 101 - Intro to Computer Science</option>
                  <option value="CCS 102 - Programming Fundamentals">CCS 102 - Programming Fundamentals</option>
                  <option value="CCS 201 - Data Structures">CCS 201 - Data Structures</option>
                  <option value="CCS 202 - Algorithms">CCS 202 - Algorithms</option>
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
                <p className="text-slate-200 font-medium mb-1">Drag and drop your file here</p>
                <p className="text-slate-400 mb-4">or click to browse files</p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Browse Files
                </Button>
                <p className="text-xs text-slate-500 mt-3">Supports: PDF, DOCX, XLSX (Max: 10MB)</p>
              </div>
            </div>

            {/* Validation Messages */}
            {showValidation && (
              <div className="space-y-2 mb-6">
                <div className="flex items-center p-3 bg-green-500/10 border border-green-500/20 rounded">
                  <CheckCircle className="text-green-400 mr-3 h-5 w-5" />
                  <div>
                    <p className="font-medium text-green-400">File extension validated: .pdf</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                  <Settings className="text-blue-400 mr-3 h-5 w-5" />
                  <div>
                    <p className="font-medium text-blue-400">Auto-rename applied: DOE_JANE_CCS101_SYLLABUS_S2_2024.pdf</p>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Section */}
            {showPreview && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-slate-100">Document Preview</h4>
                  <Button variant="outline" size="sm" className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
                    <Expand className="h-4 w-4 mr-1" />Full Screen
                  </Button>
                </div>
                <div className="border border-slate-700 rounded-lg p-4 bg-slate-800/50">
                  <div className="flex items-center justify-center h-64">
                    <FileText className="text-red-400 mr-4 h-16 w-16" />
                    <div>
                      <p className="font-medium text-slate-100">DOE_JANE_CCS101_SYLLABUS_S2_2024.pdf</p>
                      <p className="text-slate-400">2.4 MB • 15 pages</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button 
                onClick={handleSubmit}
                disabled={!selectedFile || !formData.documentType || !formData.course}
                className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Submit Document
              </Button>
              <Button 
                onClick={handleReset}
                variant="outline" 
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
          {/* Recent Submissions */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-lg mb-4 text-slate-100">Recent Submissions</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-start p-3 bg-slate-800/50 rounded">
                <div className="flex-1">
                  <p className="font-medium text-slate-100 text-sm">Course Syllabus</p>
                  <p className="text-xs text-slate-400">CCS 101 • June 3, 2024</p>
                </div>
                <span className="px-2 py-1 text-xs font-semibold bg-green-500/10 text-green-400 rounded">Approved</span>
              </div>
              <div className="flex justify-between items-start p-3 bg-slate-800/50 rounded">
                <div className="flex-1">
                  <p className="font-medium text-slate-100 text-sm">Final Grades</p>
                  <p className="text-xs text-slate-400">CCS 201 • June 1, 2024</p>
                </div>
                <span className="px-2 py-1 text-xs font-semibold bg-blue-500/10 text-blue-400 rounded">Under Review</span>
              </div>
              <div className="flex justify-between items-start p-3 bg-slate-800/50 rounded">
                <div className="flex-1">
                  <p className="font-medium text-slate-100 text-sm">PDF Presentations</p>
                  <p className="text-xs text-slate-400">CCS 201 • May 30, 2024</p>
                </div>
                <span className="px-2 py-1 text-xs font-semibold bg-red-500/10 text-red-400 rounded">Returned</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/faculty-requirements/archive")}
              className="w-full mt-4 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              View All Submissions
            </Button>
          </div>

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
            <Button 
              variant="outline" 
              size="sm"
              className="w-full mt-4 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
