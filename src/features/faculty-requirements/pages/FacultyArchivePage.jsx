import React from "react";
import { useState, useEffect, Fragment } from "react";
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
    loadCourseHistory,
    loadSubmissionVersions,
    submissionVersions,
    handleDownloadAll,
    downloading,
    options
  } = useFacultyResources();

  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [expandedDocType, setExpandedDocType] = useState(null);
  const [expandedSubmission, setExpandedSubmission] = useState(null);
  const [query, setQuery] = useState("");

  // Filter courses based on search query
  const filteredCourses = courseList.filter(course =>
    course.course_code.toLowerCase().includes(query.toLowerCase()) ||
    course.course_name.toLowerCase().includes(query.toLowerCase())
  );

  // Set default semester and year when options are loaded
  useEffect(() => {
    if (options?.semesters?.length > 0 && !selectedSemester) {
      setSelectedSemester(options.semesters[0]);
    }
    if (options?.academic_years?.length > 0 && !selectedYear) {
      setSelectedYear(options.academic_years[0]);
    }
  }, [options]);

  useEffect(() => {
    if (selectedSemester && selectedYear) {
      loadArchivedCourses(selectedSemester, selectedYear);
    }
  }, [selectedSemester, selectedYear]);

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
          <h1 className="text-2xl font-bold text-neutral-900">Submission Archive</h1>
          <p className="text-neutral-500 font-medium">Access your historical submissions and file versions</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm font-medium w-full md:w-64"
            />
          </div>

          {/* Semester Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <select
              value={`${selectedSemester}||${selectedYear}`}
              onChange={(e) => {
                const [sem, yr] = e.target.value.split("||");
                setSelectedSemester(sem);
                setSelectedYear(yr);
              }}
              className="pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none shadow-sm font-medium min-w-[200px] cursor-pointer"
            >
              {options?.academic_years?.map(year => (
                options?.semesters?.map(sem => (
                  <option key={`${sem}-${year}`} value={`${sem}||${year}`}>{sem}, {year}</option>
                ))
              ))}
              {(!options?.academic_years?.length) && <option value="">Loading options...</option>}
            </select>
          </div>
        </div>
      </div>

      {loading && !expandedCourse && (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-3" />
          <p className="text-neutral-500 font-medium">Loading archives...</p>
        </div>
      )}

      {!loading && courseList.length === 0 && (
        <div className="text-center py-16 bg-neutral-50 rounded-xl border border-neutral-200 border-dashed">
          <Archive className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500 font-medium">No submissions found for this semester.</p>
        </div>
      )}

      {/* Course List */}
      <div className="space-y-4">
        {filteredCourses.length === 0 && !loading && courseList.length > 0 && (
          <p className="text-center text-neutral-500 font-medium">No courses match your search.</p>
        )}
        {filteredCourses.map(course => (
          <div key={course.course_id} className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:border-primary-300 hover:shadow-md">
            <div
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-colors"
              onClick={() => handleCourseClick(course.course_id)}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-lg border shadow-sm transition-colors ${expandedCourse === course.course_id ? 'bg-primary-50 text-primary-600 border-primary-200' : 'bg-neutral-50 text-neutral-500 border-neutral-200'}`}>
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900">{course.course_code} - {course.course_name}</h3>
                  <p className="text-sm text-neutral-500 font-medium">{course.submission_count} document types submitted</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 bg-white border-neutral-200 text-neutral-700 hover:text-primary-700 hover:bg-primary-50 hover:border-primary-200 shadow-sm transition-all"
                  disabled={downloading}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadAll(course.course_id, selectedSemester, selectedYear);
                  }}
                >
                  {downloading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {downloading ? 'Zipping...' : 'Download All'}
                </Button>
                <div className="p-1 text-neutral-400 group-hover:text-primary-600 transition-colors">
                  {expandedCourse === course.course_id ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </div>
              </div>
            </div>

            {/* Expanded Content: Document Types */}
            {expandedCourse === course.course_id && (
              <div className="border-t border-neutral-100 bg-neutral-50/50 p-4 space-y-3 shadow-inner">
                {loading && history.length === 0 ? (
                  <div className="text-center py-6 text-neutral-500 font-medium">Loading course history...</div>
                ) : Object.keys(groupedHistory).length === 0 ? (
                  <div className="text-center py-6 text-neutral-500 font-medium bg-white rounded-lg border border-neutral-200">No history details available.</div>
                ) : (
                  Object.values(groupedHistory).map(doc => (
                    <div key={doc.doc_type_id} className="border border-neutral-200 rounded-lg bg-white shadow-sm overflow-hidden">
                      <div
                        onClick={() => handleDocTypeClick(doc.doc_type_id)}
                        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-primary-500" />
                          <span className="font-bold text-neutral-900">{doc.type_name}</span>
                          <Badge variant="outline" className="text-xs bg-neutral-100 text-neutral-600 border-neutral-200 font-bold px-2 py-0">
                            {doc.versions.length} version{doc.versions.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        {expandedDocType === doc.doc_type_id ? <ChevronDown className="h-4 w-4 text-neutral-400" /> : <ChevronRight className="h-4 w-4 text-neutral-400" />}
                      </div>

                      {/* Expanded Versions */}
                      {expandedDocType === doc.doc_type_id && (
                        <div className="border-t border-neutral-100 bg-white">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-neutral-500 text-xs border-b border-neutral-100 bg-neutral-50/50">
                                <th className="text-left font-bold py-2.5 pl-4 uppercase tracking-wider">Version</th>
                                <th className="text-left font-bold py-2.5 uppercase tracking-wider">Date Submitted</th>
                                <th className="text-left font-bold py-2.5 uppercase tracking-wider">Status</th>
                                <th className="text-right font-bold py-2.5 pr-4 uppercase tracking-wider">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {doc.versions.map((ver, idx) => (
                                <Fragment key={ver.submission_id}>
                                  <tr className="hover:bg-neutral-50/80 border-b border-neutral-100 last:border-0 transition-colors">
                                    <td className="py-3 pl-4 text-neutral-900 font-medium">
                                      <div className="flex items-center gap-2">
                                        <span className="truncate max-w-[200px]">{ver.original_filename}</span>
                                      </div>
                                    </td>
                                    <td className="py-3 text-neutral-600 font-medium">
                                      <div className="flex items-center gap-1.5 text-xs">
                                        <Clock className="h-3.5 w-3.5 text-neutral-400" />
                                        {new Date(ver.updated_at || ver.submitted_at).toLocaleDateString()}
                                      </div>
                                    </td>
                                    <td className="py-3">
                                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border shadow-sm ${ver.submission_status === 'APPROVED' ? 'bg-success/10 text-success border-success/20' :
                                          ver.submission_status === 'REJECTED' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                            'bg-info/10 text-info border-info/20'
                                        }`}>
                                        {ver.submission_status}
                                      </span>
                                    </td>
                                    <td className="py-3 pr-4 text-right">
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className={`h-7 px-2.5 text-[11px] font-bold transition-colors ${expandedSubmission === ver.submission_id ? 'bg-primary-50 text-primary-700' : 'text-neutral-500 hover:text-primary-600 hover:bg-primary-50'}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (expandedSubmission === ver.submission_id) {
                                              setExpandedSubmission(null);
                                            } else {
                                              setExpandedSubmission(ver.submission_id);
                                              loadSubmissionVersions(ver.submission_id);
                                            }
                                          }}
                                        >
                                          <History className="h-3.5 w-3.5 mr-1.5" />
                                          History
                                          {expandedSubmission === ver.submission_id ? <ChevronDown className="h-3 w-3 ml-1" /> : <ChevronRight className="h-3 w-3 ml-1" />}
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 w-7 p-0 border-neutral-200 text-neutral-600 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 shadow-sm"
                                          title="Download Document"
                                          onClick={(e) => { e.stopPropagation(); downloadFile(ver); }}
                                        >
                                          <Download className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>

                                  {/* Expanded Version History List */}
                                  {expandedSubmission === ver.submission_id && (
                                    <tr>
                                      <td colSpan={4} className="bg-neutral-50/80 p-4 border-b border-neutral-100 shadow-inner">
                                        <div className="pl-6 border-l-2 border-primary-200 ml-2">
                                          <div className="text-[10px] text-neutral-500 mb-3 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                            <History className="h-3 w-3" /> Previous Versions
                                          </div>
                                          {submissionVersions.length === 0 ? (
                                            <div className="text-neutral-500 italic text-xs font-medium bg-white p-3 rounded-lg border border-neutral-200">No previous versions registered.</div>
                                          ) : (
                                            <ul className="space-y-2.5">
                                              {submissionVersions.map((v) => (
                                                <li key={v.version_id} className="flex justify-between items-center text-xs text-neutral-700 bg-white p-2.5 rounded-lg border border-neutral-200 shadow-sm hover:border-primary-200 transition-colors">
                                                  <div className="flex items-center gap-3">
                                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-neutral-100 border-neutral-200 text-neutral-600 font-bold shadow-sm">v{v.version_number}</Badge>
                                                    <span className="truncate max-w-[200px] font-medium">{v.original_filename}</span>
                                                    <span className="text-neutral-400 flex items-center gap-1.5 font-medium ml-2 border-l border-neutral-200 pl-3">
                                                      <Clock className="h-3 w-3" /> {new Date(v.archived_at).toLocaleString()}
                                                    </span>
                                                  </div>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                                                    title="Download Version"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      if (v.gdrive_web_view_link) window.open(v.gdrive_web_view_link, '_blank');
                                                      else alert('Link not available');
                                                    }}
                                                  >
                                                    <Download className="h-3.5 w-3.5" />
                                                  </Button>
                                                </li>
                                              ))}
                                            </ul>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </Fragment>
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