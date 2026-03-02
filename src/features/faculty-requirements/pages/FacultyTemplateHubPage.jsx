import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Archive,
  Copy,
  Download,
  Eye,
  File as FileIcon, // Aliased to prevent window.File constructor collision
  FileSpreadsheet,
  FileText,
  Presentation,
  Search,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useFacultyResources } from "../hooks/FacultyResourcesHook";
import { FacultySubmissionService } from "../services/FacultySubmissionService";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Map category names to icons
const iconMap = {
  'Spreadsheet': FileSpreadsheet,
  'Presentation': Presentation,
  'Archive': Archive,
};

export default function FacultyTemplateHubPage() {
  const navigate = useNavigate();
  const {
    templates,
    archives: archivedDocs,
    courseList, // archived courses
    history: courseHistory, // submissions for a specific archived course
    loading,
    error,
    loadArchives,
    loadArchivedCourses,
    loadCourseHistory,
    faqs,
    categories,
    handleDownloadAll,
    options,
    cloning,
    handleClone
  } = useFacultyResources();

  // Separate states for search and category filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // States for active filtering
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  // States for Cloning feature
  const [sourceCourseId, setSourceCourseId] = useState("");
  const [targetCourseId, setTargetCourseId] = useState("");
  const [selectedDocsToClone, setSelectedDocsToClone] = useState([]);
  const [activeCourses, setActiveCourses] = useState([]);
  const [cloneStatus, setCloneStatus] = useState(null);

  const quickFilters = useMemo(
    () => ["All", ...categories],
    [categories]
  );

  // Filter templates by both search query and active category independently
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesCategory = selectedCategory === "All" || t.category === selectedCategory;
      const matchesSearch = !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [templates, searchQuery, selectedCategory]);

  useEffect(() => {
    if (options?.semesters?.length > 0 && !selectedSemester) {
      setSelectedSemester(options.semesters[0]);
    }
    if (options?.academic_years?.length > 0 && !selectedYear) {
      setSelectedYear(options.academic_years[0]);
    }
  }, [options]);

  // Load active courses for the Target Course dropdown
  useEffect(() => {
    const fetchActiveCourses = async () => {
      try {
        const courses = await FacultySubmissionService.getFacultyCourses();
        setActiveCourses(courses || []);
      } catch (err) {
        console.error("Failed to load active courses:", err);
      }
    };
    fetchActiveCourses();
  }, []);

  // When options load, set initial archive filters and load archived courses
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
      loadArchives(selectedSemester, selectedYear); // Existing flat list
      loadArchivedCourses(selectedSemester); // Populate source course dropdown
    }
  }, [selectedSemester, selectedYear]);

  // When source course changes, load its specific documents
  useEffect(() => {
    if (sourceCourseId) {
      loadCourseHistory(sourceCourseId);
      setSelectedDocsToClone([]); // reset selections
    }
  }, [sourceCourseId]);

  const toggleDocSelection = (submissionId) => {
    setSelectedDocsToClone(prev =>
      prev.includes(submissionId)
        ? prev.filter(id => id !== submissionId)
        : [...prev, submissionId]
    );
  };

  const toggleAllDocs = () => {
    if (selectedDocsToClone.length === courseHistory.length) {
      setSelectedDocsToClone([]);
    } else {
      setSelectedDocsToClone(courseHistory.map(doc => doc.submission_id));
    }
  };

  const executeClone = async () => {
    if (!sourceCourseId || !targetCourseId || selectedDocsToClone.length === 0 || !selectedSemester || !selectedYear) {
      return;
    }

    setCloneStatus({ type: 'info', message: 'Cloning in progress... this may take a moment.' });

    const result = await handleClone(
      selectedDocsToClone,
      targetCourseId,
      selectedSemester, // Assuming cloning into current active semester logic exists
      selectedYear
    );

    if (result.failCount === 0 && result.successCount > 0) {
      setCloneStatus({ type: 'success', message: `Successfully cloned ${result.successCount} document(s)!` });
      setSelectedDocsToClone([]);
      setTimeout(() => setCloneStatus(null), 5000);
    } else if (result.failCount > 0) {
      setCloneStatus({ type: 'error', message: `Cloned ${result.successCount} docs. Failed ${result.failCount} docs.` });
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full bg-neutral-50/30">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-1">Template Hub</h1>
          <p className="text-neutral-500 text-sm font-medium">
            Download official templates and clone previous documents
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search templates..."
              className="pl-9 bg-white border-neutral-200 text-neutral-900 focus-visible:ring-primary-500 shadow-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar shrink-0">
        {quickFilters.map((f) => (
          <Button
            key={f}
            variant={selectedCategory === f ? "default" : "outline"}
            className={`whitespace-nowrap font-bold shadow-sm transition-all rounded-full ${selectedCategory === f
              ? "bg-primary-600 hover:bg-primary-700 text-white"
              : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
              }`}
            onClick={() => setSelectedCategory(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left Column (2/3 width on large screens) */}
        <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-1">

          {/* Official Templates Section */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
              <h3 className="font-bold text-lg text-neutral-900 flex items-center gap-2">
                <FileIcon className="h-5 w-5 text-primary-600" /> Official Templates
              </h3>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-100 px-3 py-1 rounded-full">
                {templates.length > 0
                  ? `Updated: ${new Date(Math.max(...templates.map(t => new Date(t.created_at || t.updated_at || Date.now()).getTime()))).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : 'Last updated: N/A'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredTemplates.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-neutral-500 bg-neutral-50 border border-neutral-200 border-dashed rounded-xl">
                  <FileIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium text-sm">No templates match your filters.</p>
                </div>
              ) : (
                filteredTemplates.map((t) => {
                  const Icon = iconMap[t.category] || FileText;
                  return (
                    <div
                      key={t.template_id}
                      className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-md transition-all group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start mb-3">
                          <div className="bg-white p-2.5 rounded-lg border border-neutral-100 shadow-sm mr-3">
                            <Icon className="h-6 w-6 text-primary-500" />
                          </div>
                          <div>
                            <h4 className="font-bold text-neutral-900 leading-tight">{t.title}</h4>
                            <p className="text-[11px] text-neutral-500 font-medium mt-1 line-clamp-2">{t.description}</p>
                          </div>
                        </div>
                        <div className="mb-4">
                          <span className="bg-white border border-neutral-200 text-[9px] font-bold uppercase tracking-wider text-neutral-500 px-2.5 py-0.5 rounded shadow-sm inline-block">
                            {t.category || 'General'}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full bg-white border-neutral-200 text-neutral-700 hover:text-primary-700 hover:bg-primary-50 shadow-sm font-bold active:scale-95 transition-all"
                        onClick={() => {
                          if (t.file_url) window.open(t.file_url, '_blank');
                        }}
                        disabled={!t.file_url}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Clone from Previous Semester Section */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 lg:p-8">
            <h3 className="font-bold text-lg mb-2 text-neutral-900 flex items-center gap-2">
              <Copy className="h-5 w-5 text-primary-600" />
              Clone from Previous Semester
            </h3>
            <p className="text-neutral-500 text-sm font-medium mb-6 leading-relaxed">
              Select an archived course from a past semester to duplicate its approved documents into your current active courses. System will automatically recalibrate the deadlines.
            </p>

            <div className="space-y-6">
              {/* Source Selection */}
              <div className="bg-neutral-50 p-5 rounded-xl border border-neutral-200 shadow-inner">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2.5 block">1. Select Source Archived Course</label>
                <Select value={sourceCourseId} onValueChange={setSourceCourseId}>
                  <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 focus:ring-primary-500 shadow-sm font-medium">
                    <SelectValue placeholder="Choose an archived course..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-neutral-200 text-neutral-900 shadow-md">
                    {courseList && courseList.length > 0 ? (
                      courseList.map(course => (
                        <SelectItem key={course.course_id} value={course.course_id}>
                          {course.course_code} - {course.course_name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-neutral-500 text-center font-medium italic">No archived courses found for selected semester.</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic Checklist */}
              {sourceCourseId && (
                <div className="border border-neutral-200 rounded-xl p-5 bg-white shadow-sm">
                  <div className="flex justify-between items-center mb-4 border-b border-neutral-100 pb-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-600">2. Select Documents to Clone</label>
                    {courseHistory.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={toggleAllDocs} className="h-7 text-[10px] font-bold uppercase tracking-wider text-primary-600 hover:text-primary-700 hover:bg-primary-50">
                        {selectedDocsToClone.length === courseHistory.length ? "Deselect All" : "Select All"}
                      </Button>
                    )}
                  </div>

                  {loading && courseHistory.length === 0 ? (
                    <div className="text-center py-6 text-neutral-500 text-sm font-medium">Loading documents...</div>
                  ) : courseHistory.length === 0 ? (
                    <div className="text-center py-6 text-neutral-500 text-sm font-medium bg-neutral-50 rounded-lg border border-neutral-200 border-dashed">No documents found for this course.</div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-3 custom-scrollbar">
                      {courseHistory.map(doc => (
                        <div key={doc.submission_id} className="flex items-start space-x-3 p-3 bg-neutral-50 hover:bg-neutral-100 border border-transparent hover:border-neutral-200 rounded-lg transition-colors group">
                          <Checkbox
                            id={`doc-${doc.submission_id}`}
                            checked={selectedDocsToClone.includes(doc.submission_id)}
                            onCheckedChange={() => toggleDocSelection(doc.submission_id)}
                            className="mt-1 border-neutral-300 data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600 shadow-sm"
                          />
                          <div className="grid gap-1 leading-none cursor-pointer flex-1" onClick={() => toggleDocSelection(doc.submission_id)}>
                            <label className="text-sm font-bold text-neutral-900 cursor-pointer group-hover:text-primary-700 transition-colors">
                              {doc.documenttypes_fs?.type_name || "Document"}
                            </label>
                            <p className="text-[11px] font-medium text-neutral-500">
                              {doc.original_filename}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Target Selection & Execute Button */}
              {sourceCourseId && courseHistory.length > 0 && (
                <div className="pt-4 border-t border-neutral-100">
                  <div className="bg-neutral-50 p-5 rounded-xl border border-neutral-200 shadow-inner mb-6">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2.5 block">3. Select Target Active Course</label>
                    <Select value={targetCourseId} onValueChange={setTargetCourseId}>
                      <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 focus:ring-primary-500 shadow-sm font-medium">
                        <SelectValue placeholder="Choose current semester course..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-neutral-200 text-neutral-900 shadow-md">
                        {activeCourses && activeCourses.length > 0 ? (
                          activeCourses.map(course => (
                            <SelectItem key={course.course_id} value={course.course_id}>
                              {course.course_code} - {course.course_name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-neutral-500 text-center font-medium italic">No active courses configured.</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {cloneStatus && (
                    <div className={`p-4 mb-5 rounded-lg text-sm font-bold flex items-start shadow-sm border ${cloneStatus.type === 'error' ? 'bg-destructive/5 text-destructive border-destructive/20' :
                        cloneStatus.type === 'success' ? 'bg-success/5 text-success border-success/20' :
                          'bg-info/5 text-info border-info/20'
                      }`}>
                      {cloneStatus.type === 'error' ? <AlertCircle className="h-4 w-4 mr-2.5 mt-0.5 shrink-0" /> :
                        cloneStatus.type === 'success' ? <CheckCircle2 className="h-4 w-4 mr-2.5 mt-0.5 shrink-0" /> :
                          <Copy className="h-4 w-4 mr-2.5 mt-0.5 shrink-0 animate-pulse" />}
                      {cloneStatus.message}
                    </div>
                  )}

                  <Button
                    onClick={executeClone}
                    disabled={!targetCourseId || selectedDocsToClone.length === 0 || cloning}
                    className={`w-full font-bold h-12 shadow-sm transition-all active:scale-95 ${!targetCourseId || selectedDocsToClone.length === 0
                        ? "bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed"
                        : "bg-primary-600 hover:bg-primary-700 text-white"
                      }`}
                  >
                    {cloning ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cloning Documents...
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Clone {selectedDocsToClone.length > 0 ? selectedDocsToClone.length : ""} Document(s)
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column (1/3 width) */}
        <div className="flex flex-col gap-6">
          {/* Archived Documents */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 max-h-[600px] flex flex-col">
            <h3 className="font-bold mb-4 text-neutral-900 border-b border-neutral-100 pb-3 shrink-0 flex items-center gap-2">
              <Archive className="h-5 w-5 text-primary-600" /> Your Archives
            </h3>

            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {archivedDocs && archivedDocs.length > 0 ? (
                archivedDocs.map((d) => (
                  <div
                    key={d.submission_id}
                    className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 hover:border-primary-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center min-w-0">
                      <div className="bg-white p-2 rounded-lg border border-neutral-100 shadow-sm mr-3 shrink-0">
                        <FileIcon className="h-4 w-4 text-neutral-400 group-hover:text-primary-500 transition-colors" />
                      </div>
                      <div className="min-w-0 pr-3">
                        <p className="font-bold text-neutral-900 text-sm truncate">
                          {d.documenttypes_fs?.type_name || d.standardized_filename}
                        </p>
                        <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mt-0.5 truncate">
                          {d.courses_fs?.course_code} · {new Date(d.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-white border-neutral-200 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 hover:border-primary-200 shadow-sm shrink-0 transition-colors h-8 w-8"
                      onClick={() => d.gdrive_web_view_link && window.open(d.gdrive_web_view_link, '_blank')}
                      disabled={!d.gdrive_web_view_link}
                      title="View Archive"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-neutral-50 rounded-xl border border-dashed border-neutral-200 text-neutral-500">
                  <Archive className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No archives found</p>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full mt-4 bg-white border-neutral-200 text-neutral-700 hover:text-primary-700 hover:bg-primary-50 shadow-sm font-bold active:scale-95 transition-all shrink-0"
              onClick={() => navigate("/faculty-requirements/archive")}
            >
              <Archive className="h-4 w-4 mr-2" />
              View All Archives
            </Button>
          </div>

          {/* FAQ Section */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 shrink-0">
            <h3 className="font-bold mb-2 text-neutral-900 flex items-center gap-2">
              FAQ
            </h3>
            <Accordion type="single" collapsible className="w-full">
              {faqs.length === 0 ? (
                <div className="text-center py-4 text-neutral-500 text-sm font-medium italic">No FAQs available.</div>
              ) : (
                faqs.map((faq) => (
                  <AccordionItem
                    key={faq.faq_id}
                    value={`item-${faq.faq_id}`}
                    className="border-neutral-100"
                  >
                    <AccordionTrigger className="text-neutral-800 hover:text-primary-600 font-bold text-left text-sm py-3 transition-colors">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-neutral-600 font-medium text-sm leading-relaxed pb-3">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))
              )}
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}