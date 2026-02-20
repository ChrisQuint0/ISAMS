import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Archive,
  Copy,
  Download,
  Eye,
  File,
  FileSpreadsheet,
  FileText,
  FileType2,
  Presentation,
  Search
} from "lucide-react";
import { useFacultyResources } from "../hooks/FacultyResourcesHook";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
    loading,
    error,
    loadArchives,
    faqs,
    categories,
    handleDownloadAll,
    options
  } = useFacultyResources();

  // Separate states for search and category filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

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

  // Load archives on mount and when filters change
  useEffect(() => {
    // Only fetch if the semester and year have successfully populated
    if (selectedSemester && selectedYear) {
      loadArchives(selectedSemester, selectedYear);
    }
  }, [selectedSemester, selectedYear, loadArchives]);

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Template Hub</h1>
          <p className="text-slate-400">
            Download official templates and clone previous documents
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search templates..."
              className="pl-9 bg-slate-900/50 border-slate-700 text-slate-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {quickFilters.map((f) => (
          <Button
            key={f}
            variant={selectedCategory === f ? "default" : "outline"}
            className={`whitespace-nowrap ${selectedCategory === f
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              }`}
            onClick={() => setSelectedCategory(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width on large screens) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Official Templates Section */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-100">Official Templates</h3>
              <span className="text-sm text-slate-400">
                {templates.length > 0
                  ? `Last updated: ${new Date(Math.max(...templates.map(t => new Date(t.created_at || t.updated_at || Date.now()).getTime()))).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : 'Last updated: N/A'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-slate-500">
                  <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No templates found.</p>
                </div>
              ) : (
                filteredTemplates.map((t) => {
                  const Icon = iconMap[t.category] || FileText;
                  return (
                    <div
                      key={t.template_id}
                      className="border border-slate-700 rounded-lg p-4 hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-start mb-3">
                        <Icon className="h-8 w-8 mr-3 text-blue-400 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-slate-100">{t.title}</h4>
                          <p className="text-sm text-slate-400 line-clamp-2">{t.description}</p>
                        </div>
                      </div>

                      <div className="flex justify-between text-sm text-slate-500">
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-xs border border-slate-700">
                          {t.category || 'General'}
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full mt-3 bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                        onClick={() => {
                          if (t.file_url) window.open(t.file_url, '_blank');
                        }}
                        disabled={!t.file_url}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Clone from Previous Semester Section */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
            <h3 className="font-semibold mb-4 text-slate-100">
              Clone from Previous Semester
            </h3>
            <p className="text-slate-400 mb-4">
              Select a previous document to clone and edit for the current semester:
            </p>

            {/* Placeholder — clone feature not yet implemented */}
            <div className="border border-slate-700 rounded-lg p-6 mb-4 bg-slate-950/30 text-center">
              <Copy className="h-10 w-10 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400 font-medium">Clone feature coming soon.</p>
              <p className="text-xs text-slate-500 mt-1">
                Select a document type and semester to preview available documents.
              </p>
            </div>

            <Button
              disabled
              className="w-full bg-slate-700 text-slate-500 cursor-not-allowed"
            >
              <Copy className="h-4 w-4 mr-2" />
              Clone Document for Current Semester
            </Button>
          </div>


        </div>

        {/* Right Column (1/3 width) */}
        <div>
          {/* Archived Documents */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6 sticky top-6">
            <h3 className="font-semibold mb-4 text-slate-100">Your Archived Documents</h3>
            <div className="space-y-3">
              {archivedDocs && archivedDocs.length > 0 ? (
                archivedDocs.map((d) => (
                  <div
                    key={d.submission_id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded"
                  >
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-slate-400 mr-3 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-slate-100 text-sm">
                          {d.documenttypes_fs?.type_name || d.standardized_filename}
                        </p>
                        <p className="text-xs text-slate-400">
                          {d.courses_fs?.course_code} · {new Date(d.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 flex-shrink-0"
                      onClick={() => d.gdrive_web_view_link && window.open(d.gdrive_web_view_link, '_blank')}
                      disabled={!d.gdrive_web_view_link}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-slate-500">
                  <Archive className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No archives found</p>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full mt-4 bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
              onClick={() => navigate("/faculty-requirements/archive")}
            >
              <Archive className="h-4 w-4 mr-2" />
              View All Archives
            </Button>
          </div>

          {/* FAQ Section */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6 mt-6">
            <h3 className="font-semibold mb-4 text-slate-100">Frequently Asked Questions</h3>
            <Accordion type="single" collapsible className="w-full">
              {faqs.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-sm">No FAQs available.</div>
              ) : (
                faqs.map((faq) => (
                  <AccordionItem
                    key={faq.faq_id}
                    value={`item-${faq.faq_id}`}
                    className="border-slate-800"
                  >
                    <AccordionTrigger className="text-slate-200 hover:text-slate-100 text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-400">
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