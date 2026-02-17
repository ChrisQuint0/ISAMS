import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Archive,
  Search,
  Filter,
  FileText,
  Download,
  Calendar,
  Loader2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  History,
  Clock
} from "lucide-react";
import { useFacultyResources } from "../hooks/FacultyResourcesHook";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function FacultyArchivePage() {
  const {
    courseList,
    history,
    loading,
    error,
    loadArchivedCourses,
    loadCourseHistory
  } = useFacultyResources();

  const [selectedSemester, setSelectedSemester] = useState("2023-2"); // Default to current
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [expandedDocType, setExpandedDocType] = useState(null);
  const [query, setQuery] = useState("");

  // Filter courses based on search query
  const filteredCourses = courseList.filter(course =>
    course.course_code.toLowerCase().includes(query.toLowerCase()) ||
    course.course_name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    loadArchivedCourses(selectedSemester);
  }, [selectedSemester]);

  const handleCourseClick = async (courseId) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
      setExpandedDocType(null);
    } else {
      setExpandedCourse(courseId);
      setExpandedDocType(null); // Reset doc type selection
      await loadCourseHistory(courseId);
    }
  };

  const handleDocTypeClick = (docTypeId) => {
    if (expandedDocType === docTypeId) {
      setExpandedDocType(null);
    } else {
      setExpandedDocType(docTypeId);
    }
  };

  // Group history by Document Type
  const groupedHistory = history.reduce((acc, item) => {
    if (!acc[item.doc_type_id]) {
      acc[item.doc_type_id] = {
        doc_type_id: item.doc_type_id,
        type_name: item.type_name,
        versions: []
      };
    }
    acc[item.doc_type_id].versions.push(item);
    return acc;
  }, {});

  const downloadFile = (sub) => {
    // Use the web view link if available, otherwise fallback to alert or other logic
    if (sub.gdrive_web_view_link) {
      window.open(sub.gdrive_web_view_link, '_blank');
    } else if (sub.gdrive_download_link) {
      window.open(sub.gdrive_download_link, '_blank');
    } else {
      // Fallback if no link is present (e.g. local dev mock)
      alert(`Opening ${sub.original_filename}... (No valid link found)`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Submission Archive</h1>
          <p className="text-slate-400">Access your historical submissions and file versions</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search courses..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[180px]"
            >
              <option value="2023-2">2nd Sem, 2023-2024</option>
              <option value="2023-1">1st Sem, 2023-2024</option>
              <option value="2022-2">2nd Sem, 2022-2023</option>
              <option value="2022-1">1st Sem, 2022-2023</option>
            </select>
          </div>
        </div>
      </div>

      {loading && !expandedCourse && (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-slate-400">Loading archives...</p>
        </div>
      )}

      {!loading && courseList.length === 0 && (
        <div className="text-center py-12 bg-slate-900/50 rounded-lg border border-slate-800 border-dashed">
          <Archive className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No submissions found for this semester.</p>
        </div>
      )}

      {/* Course List */}
      <div className="space-y-4">
        {filteredCourses.length === 0 && !loading && (
          <p className="text-center text-slate-500">No courses match your search.</p>
        )}
        {filteredCourses.map(course => (
          <div key={course.course_id} className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden transition-all duration-200 hover:border-slate-700">
            <div
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50"
              onClick={(e) => {
                // Prevent expanding if clicking the download button logic is separate? 
                // Actually, let's just let it expand unless we click download specifically
                handleCourseClick(course.course_id);
              }}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${expandedCourse === course.course_id ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100">{course.course_code} - {course.course_name}</h3>
                  <p className="text-sm text-slate-400">{course.submission_count} document types submitted</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Call download service
                    // For now just alert
                    alert(`Initiating bulk download for ${course.course_code}... (Service Stub)`);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
                {expandedCourse === course.course_id ? <ChevronDown className="h-5 w-5 text-slate-500" /> : <ChevronRight className="h-5 w-5 text-slate-500" />}
              </div>
            </div>

            {/* Expanded Content: Document Types */}
            {expandedCourse === course.course_id && (
              <div className="border-t border-slate-800 bg-slate-950/30 p-4 space-y-3">
                {loading && history.length === 0 ? (
                  <div className="text-center py-4 text-slate-500">Loading course history...</div>
                ) : Object.keys(groupedHistory).length === 0 ? (
                  <div className="text-center py-4 text-slate-500">No history details available.</div>
                ) : (
                  Object.values(groupedHistory).map(doc => (
                    <div key={doc.doc_type_id} className="border border-slate-800 rounded-lg bg-slate-900/80">
                      <div
                        onClick={() => handleDocTypeClick(doc.doc_type_id)}
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-800"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-indigo-400" />
                          <span className="font-medium text-slate-200">{doc.type_name}</span>
                          <Badge variant="outline" className="text-xs bg-slate-800 text-slate-400 border-slate-700">
                            {doc.versions.length} version{doc.versions.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        {expandedDocType === doc.doc_type_id ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
                      </div>

                      {/* Expanded Versions */}
                      {expandedDocType === doc.doc_type_id && (
                        <div className="border-t border-slate-800 bg-slate-950 p-2">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-slate-500 text-xs border-b border-slate-800">
                                <th className="text-left font-normal pb-2 pl-2">Version</th>
                                <th className="text-left font-normal pb-2">Date Submitted</th>
                                <th className="text-left font-normal pb-2">Status</th>
                                <th className="text-right font-normal pb-2 pr-2">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {doc.versions.map((ver, idx) => (
                                <tr key={ver.submission_id} className="hover:bg-slate-900">
                                  <td className="py-2 pl-2 text-slate-300">
                                    <div className="flex items-center gap-2">
                                      <span className="bg-slate-800 text-slate-400 px-1.5 rounded text-[10px]">v{doc.versions.length - idx}</span>
                                      <span className="truncate max-w-[150px]">{ver.original_filename}</span>
                                    </div>
                                  </td>
                                  <td className="py-2 text-slate-400">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(ver.submitted_at).toLocaleDateString()}
                                    </div>
                                  </td>
                                  <td className="py-2">
                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${ver.submission_status === 'APPROVED' ? 'bg-green-900/30 text-green-400' :
                                      ver.submission_status === 'REJECTED' ? 'bg-red-900/30 text-red-400' :
                                        'bg-blue-900/30 text-blue-400'
                                      }`}>
                                      {ver.submission_status}
                                    </span>
                                  </td>
                                  <td className="py-2 pr-2 text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 hover:text-blue-400"
                                      onClick={(e) => { e.stopPropagation(); downloadFile(ver); }}
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
