import React, { useState, useEffect, useMemo, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Archive,
  Search,
  Filter,
  FileText,
  Download,
  Calendar,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  History,
  Clock
} from "lucide-react";
import { useFacultyArchive } from "../hooks/FacultyArchiveHook";
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

export default function FacultyArchivePage() {
  const {
    courseList,
    history,
    loading,
    error,
    success,
    loadArchivedCourses,
    loadCourseHistory,
    loadSubmissionVersions,
    submissionVersions,
    handleDownloadAll,
    downloadingCourseId,
    downloadingBulk,
    handleDownloadBulk,
    options
  } = useFacultyArchive();

  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [query, setQuery] = useState("");

  const [expandedCourse, setExpandedCourse] = useState(null);
  const [expandedDocType, setExpandedDocType] = useState(null);
  const [expandedSubmission, setExpandedSubmission] = useState(null);

  const [localError, setLocalError] = useState(null);

  const triggerLocalError = (msg) => {
    setLocalError(msg);
    setTimeout(() => setLocalError(null), 3500);
  };

  // Filter courses based on search query
  const filteredCourses = courseList.filter(course =>
    course.course_code.toLowerCase().includes(query.toLowerCase()) ||
    course.course_name.toLowerCase().includes(query.toLowerCase()) ||
    (course.section && course.section.toLowerCase().includes(query.toLowerCase()))
  );

  // Default to the active semester/year when options load
  useEffect(() => {
    if (options?.currentAcademicYear && !selectedYear) {
      setSelectedYear(options.currentAcademicYear);
    } else if (options?.academic_years?.length > 0 && !selectedYear) {
      setSelectedYear(options.academic_years[0]);
    }
    if (options?.currentSemester && !selectedSemester) {
      setSelectedSemester(options.currentSemester);
    } else if (options?.semesters?.length > 0 && !selectedSemester) {
      setSelectedSemester(options.semesters[0]);
    }
  }, [options]);

  // Dynamically filter semesters based on selected academic year
  const filteredSemesters = useMemo(() => {
    if (!options?.semesterPeriods?.length) return options?.semesters || [];
    if (!selectedYear) return [...new Set(options.semesterPeriods.map(p => p.semester))].filter(Boolean);
    return options.semesterPeriods.filter(p => p.academic_year === selectedYear);
  }, [options, selectedYear]);

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
      setExpandedDocType(null);
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
    if (sub.gdrive_web_view_link) {
      window.open(sub.gdrive_web_view_link, '_blank');
    } else if (sub.gdrive_download_link) {
      window.open(sub.gdrive_download_link, '_blank');
    } else {
      triggerLocalError(`${sub.original_filename} could not be downloaded. No valid link found.`);
    }
  };

  return (
    <ToastProvider>
      <FacultyToastHandler error={error || localError} success={success} />
      <div className="space-y-6 flex flex-col h-full bg-neutral-50/30">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">My Archive</h1>
            <p className="text-neutral-500 text-sm font-medium">Access your historical submissions and file versions</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={downloadingBulk || courseList.length === 0}
            onClick={() => handleDownloadBulk(selectedSemester, selectedYear)}
            className="h-9 bg-primary-600 border-primary-600 text-white hover:bg-primary-700 hover:text-white shadow-sm font-bold text-xs"
          >
            {downloadingBulk ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {downloadingBulk ? 'Preparing Bulk Zip...' : 'Bulk Export All Docs'}
          </Button>
        </div>

        {/* Standardized Filter Widget */}
        <Card className="bg-white border-neutral-200 shadow-sm shrink-0 overflow-hidden">
          <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-3.5 px-4 flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary-600" />
              Filter Archive
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 bg-white">
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex flex-col md:flex-row flex-wrap gap-3 items-start md:items-end shadow-sm">

              <div className="flex-[2] space-y-1 w-full min-w-[200px]">
                <Label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-0.5">Search Courses</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder="Find by course code, name, or section..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-8 bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs focus-visible:ring-primary-500 focus-visible:border-primary-500 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex-1 space-y-1 w-full min-w-[130px]">
                <Label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-0.5">Academic Year</Label>
                <Select
                  value={selectedYear}
                  onValueChange={(val) => {
                    setSelectedYear(val);
                    setSelectedSemester(''); // reset semester when year changes
                  }}
                >
                  <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs focus:ring-primary-500/20 font-medium">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-neutral-200">
                    {options?.academic_years?.map(year => {
                      const isActive = year === options?.currentAcademicYear;
                      return (
                        <SelectItem key={year} value={year} className="text-xs font-medium">
                          <span className="flex items-center gap-2">
                            {year}
                            {isActive && (
                              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20">
                                Active
                              </span>
                            )}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 space-y-1 w-full min-w-[130px]">
                <Label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-0.5">Semester</Label>
                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                  <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs focus:ring-primary-500/20 font-medium">
                    <SelectValue placeholder="Select Semester" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-neutral-200">
                    {filteredSemesters.map(item => {
                      const sem = typeof item === 'string' ? item : item.semester;
                      const status = typeof item === 'object' ? item.status : null;
                      const isActive = status === 'Active';
                      return (
                        <SelectItem key={sem} value={sem} className="text-xs font-medium">
                          <span className="flex items-center gap-2">
                            {sem}
                            {isActive && (
                              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20">
                                Active
                              </span>
                            )}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <div className="flex-1 space-y-4">

          {/* Loading State */}
          {loading && !expandedCourse && (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-400 gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Loading Archives...</p>
            </div>
          )}

          {/* Empty State - No Submissions */}
          {!loading && courseList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-neutral-200 shadow-sm">
              <div className="p-4 bg-neutral-50 rounded-full mb-3 border border-neutral-100">
                <Archive className="h-8 w-8 text-neutral-300" />
              </div>
              <p className="font-bold text-neutral-900 text-base">No Submissions Found</p>
              <p className="text-sm font-medium text-neutral-500 mt-1">There are no archived records for the selected term.</p>
            </div>
          )}

          {/* Empty State - Search Mismatch */}
          {filteredCourses.length === 0 && !loading && courseList.length > 0 && (
            <div className="text-center py-10 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
              <p className="text-sm font-bold text-neutral-500">No courses match your search.</p>
            </div>
          )}

          {/* Course List Accordion */}
          {filteredCourses.map(course => (
            <Card key={course.course_id} className="bg-white border-neutral-200 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md group">

              {/* Accordion Header */}
              <div
                className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${expandedCourse === course.course_id ? 'bg-primary-50/30' : 'hover:bg-neutral-50'}`}
                onClick={() => handleCourseClick(course.course_id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-lg border shadow-sm transition-colors shrink-0 ${expandedCourse === course.course_id ? 'bg-primary-600 text-white border-primary-700' : 'bg-white text-neutral-500 border-neutral-200 group-hover:border-primary-200 group-hover:text-primary-600'}`}>
                    <Archive className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-base transition-colors ${expandedCourse === course.course_id ? 'text-primary-900' : 'text-neutral-900 group-hover:text-primary-700'}`}>
                      {course.course_code} - {course.course_name} {course.section ? `(${course.section})` : ''}
                    </h3>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-0.5">
                      {course.submission_count} Document{course.submission_count !== 1 ? 's' : ''} Archived
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 bg-white border-neutral-200 text-neutral-700 hover:text-primary-700 hover:bg-primary-50 hover:border-primary-200 shadow-sm transition-all font-bold text-xs"
                    disabled={!!downloadingCourseId}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadAll(course, selectedSemester, selectedYear);
                    }}
                  >
                    {downloadingCourseId === course.course_id ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5 text-primary-600" />}
                    {downloadingCourseId === course.course_id ? 'Zipping...' : 'Export All'}
                  </Button>
                  <div className={`p-1 transition-colors ${expandedCourse === course.course_id ? 'text-primary-600' : 'text-neutral-400 group-hover:text-primary-500'}`}>
                    {expandedCourse === course.course_id ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </div>
                </div>
              </div>

              {/* Expanded Content: Document Types */}
              {expandedCourse === course.course_id && (
                <div className="border-t border-neutral-200 bg-neutral-50/50 p-4 space-y-3 shadow-inner">
                  {loading && history.length === 0 ? (
                    <div className="flex items-center justify-center py-6 text-neutral-500 text-xs font-bold uppercase tracking-widest gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-primary-500" /> Loading History...
                    </div>
                  ) : Object.keys(groupedHistory).length === 0 ? (
                    <div className="text-center py-6 text-neutral-500 font-medium bg-white rounded-lg border border-neutral-200 shadow-sm">No history details available.</div>
                  ) : (
                    Object.values(groupedHistory).map(doc => (
                      <div key={doc.doc_type_id} className="border border-neutral-200 rounded-xl bg-white shadow-sm overflow-hidden transition-all">

                        {/* Document Type Header */}
                        <div
                          onClick={() => handleDocTypeClick(doc.doc_type_id)}
                          className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${expandedDocType === doc.doc_type_id ? 'bg-primary-50/50 border-b border-neutral-100' : 'hover:bg-neutral-50'}`}
                        >
                          <div className="flex items-center gap-3">
                            <FileText className={`h-4 w-4 ${expandedDocType === doc.doc_type_id ? 'text-primary-600' : 'text-neutral-400'}`} />
                            <span className={`font-bold text-sm ${expandedDocType === doc.doc_type_id ? 'text-primary-900' : 'text-neutral-900'}`}>
                              {doc.type_name}
                            </span>
                            <Badge className="text-[10px] bg-neutral-100 text-neutral-600 border border-neutral-200 font-bold px-2 py-0 shadow-none uppercase tracking-widest">
                              {doc.versions.length} File{doc.versions.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          {expandedDocType === doc.doc_type_id ? <ChevronDown className="h-4 w-4 text-primary-500" /> : <ChevronRight className="h-4 w-4 text-neutral-400" />}
                        </div>

                        {/* Expanded Versions Table */}
                        {expandedDocType === doc.doc_type_id && (
                          <div className="bg-white overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-neutral-50/80 border-b border-neutral-200">
                                  <th className="text-left text-[10px] font-bold py-3 pl-4 uppercase tracking-widest text-neutral-500 w-1/2">File Name</th>
                                  <th className="text-left text-[10px] font-bold py-3 uppercase tracking-widest text-neutral-500">Date Stamped</th>
                                  <th className="text-left text-[10px] font-bold py-3 uppercase tracking-widest text-neutral-500">Status</th>
                                  <th className="text-right text-[10px] font-bold py-3 pr-4 uppercase tracking-widest text-neutral-500">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {doc.versions.map((ver) => (
                                  <Fragment key={ver.submission_id}>
                                    <tr className="hover:bg-neutral-50 border-b border-neutral-100 last:border-0 transition-colors group/row">
                                      <td className="py-3 pl-4">
                                        <span className="text-xs font-bold text-neutral-900 truncate block max-w-[250px] lg:max-w-md">
                                          {ver.original_filename}
                                        </span>
                                      </td>
                                      <td className="py-3">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-tight">
                                          <Clock className="h-3.5 w-3.5" />
                                          {new Date(ver.updated_at || ver.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                      </td>
                                      <td className="py-3">
                                        {(() => {
                                          const status = ver.submission_status || '';
                                          let colorClass = "bg-neutral-100 text-neutral-600 border-neutral-200";
                                          let displayValue = status.split('_').join(' ').toLowerCase().split(' ').map(word =>
                                            word.charAt(0).toUpperCase() + word.slice(1)
                                          ).join(' ');

                                          const isCompleted = status === 'APPROVED' || status === 'SUBMITTED' || status === 'RESUBMITTED' || status === 'VALIDATED';

                                          if (ver.is_submitted_late && isCompleted) {
                                            colorClass = "bg-warning/10 text-warning border-warning/20";
                                            displayValue = "Late";
                                          } else if (isCompleted) {
                                            colorClass = "bg-success/10 text-success border-success/20";
                                          } else if (status === 'REJECTED' || status === 'REVISION REQUESTED' || status === 'REVISION_REQUESTED') {
                                            colorClass = "bg-destructive/10 text-destructive border-destructive/20";
                                          } else if (status === 'PENDING') {
                                            colorClass = "bg-warning/10 text-warning border-warning/20";
                                          }

                                          return (
                                            <Badge className={`font-bold text-xs px-2.5 py-0.5 rounded-full border shadow-none ${colorClass}`}>
                                              {displayValue === 'Revision Requested' ? 'Revision' : displayValue}
                                            </Badge>
                                          );
                                        })()}
                                      </td>
                                      <td className="py-3 pr-4 text-right">
                                        <div className="flex justify-end gap-1.5">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`h-7 px-2.5 text-[10px] font-bold uppercase tracking-widest transition-all ${expandedSubmission === `${ver.submission_id}-${ver.original_filename}` ? 'bg-primary-100 text-primary-700' : 'text-neutral-500 hover:text-primary-600 hover:bg-primary-50'}`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const subKey = `${ver.submission_id}-${ver.original_filename}`;
                                              if (expandedSubmission === subKey) {
                                                setExpandedSubmission(null);
                                              } else {
                                                setExpandedSubmission(subKey);
                                                loadSubmissionVersions(ver.submission_id, ver.original_filename);
                                              }
                                            }}
                                          >
                                            <History className="h-3.5 w-3.5 mr-1" />
                                            Log
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 w-7 p-0 bg-white border-neutral-200 text-neutral-600 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 shadow-sm"
                                            title="Download Document"
                                            onClick={(e) => { e.stopPropagation(); downloadFile(ver); }}
                                          >
                                            <Download className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>

                                    {/* Expanded Version History Timeline */}
                                    {expandedSubmission === `${ver.submission_id}-${ver.original_filename}` && (
                                      <tr>
                                        <td colSpan={4} className="bg-neutral-50/80 p-0 border-b border-neutral-200 shadow-inner">
                                          <div className="p-4 pl-6 ml-2 border-l-2 border-primary-200 bg-neutral-50/50">
                                            <div className="text-[10px] text-neutral-500 mb-3 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                              <History className="h-3.5 w-3.5 text-primary-400" /> File Version Timeline
                                            </div>
                                            {submissionVersions.length === 0 ? (
                                              <div className="text-neutral-500 italic text-xs font-medium bg-white p-3 rounded-lg border border-neutral-200 shadow-sm">No previous versions registered.</div>
                                            ) : (
                                              <ul className="space-y-2">
                                                {submissionVersions.map((v) => (
                                                  <li key={v.version_id} className="flex justify-between items-center text-xs bg-white p-3 rounded-xl border border-neutral-200 shadow-sm hover:border-primary-300 transition-colors group/version">
                                                    <div className="flex items-center gap-3">
                                                      <Badge className="text-[10px] h-5 px-2 bg-neutral-100 border border-neutral-200 text-neutral-600 font-black shadow-none rounded-md">
                                                        v{v.version_number}
                                                      </Badge>
                                                      <span className="truncate max-w-[200px] lg:max-w-sm font-bold text-neutral-800">
                                                        {v.original_filename}
                                                      </span>
                                                      <span className="text-neutral-400 flex items-center gap-1.5 font-medium ml-2 border-l border-neutral-200 pl-3 text-[10px] uppercase tracking-wider">
                                                        <Clock className="h-3 w-3" /> {new Date(v.archived_at).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                      </span>
                                                    </div>
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
            </Card>
          ))}
        </div>
      </div>
    </ToastProvider>
  );
}