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

export default function FacultyTemplateHubPage() {
  const navigate = useNavigate();
  // Using renamed archives -> archivedDocs to match original variable naming
  const { templates, archives: archivedDocs, loading, error, loadTemplates, loadArchives } = useFacultyResources();

  const [query, setQuery] = useState("");

  const quickFilters = useMemo(
    () => ["CCS 101", "Syllabus", "AY 2022-2023", "Exam Papers"],
    []
  );

  const officialTemplates = useMemo(
    () => [
      {
        id: "syllabus",
        title: "Course Syllabus Template",
        description: "Official CCS format with required sections",
        version: "3.2",
        size: "1.2 MB",
        icon: FileText,
        iconClass: "text-blue-400"
      },
      {
        id: "grades",
        title: "Final Grades Template",
        description: "Excel sheet with automatic calculations",
        version: "2.1",
        size: "0.8 MB",
        icon: FileSpreadsheet,
        iconClass: "text-green-400"
      }
    ],
    []
  );

  // Load archives on mount
  useEffect(() => {
    // Ideally we would get current semester info here, but hardcoding based on existing patterns for now
    loadArchives('1', '2023-2024');
  }, []);

  const handleDownloadTemplate = (title) => {
    console.log("Download", title);
    // Implementation would go here
  };

  const handlePreview = (title) => {
    console.log("Preview", title);
    // Implementation would go here
  };

  const handleClone = () => {
    console.log("Clone");
    // Implementation would go here
  };

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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {quickFilters.map((f) => (
          <Button
            key={f}
            variant={query === f ? "default" : "outline"}
            className={`whitespace-nowrap ${query === f
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              }`}
            onClick={() => setQuery(query === f ? "" : f)}
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
                Last updated: June 1, 2024
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {officialTemplates.map((t) => {
                const Icon = t.icon;
                return (
                  <div
                    key={t.id}
                    className="border border-slate-700 rounded-lg p-4 hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-start mb-3">
                      <Icon className={`h-8 w-8 mr-3 ${t.iconClass}`} />
                      <div>
                        <h4 className="font-medium text-slate-100">{t.title}</h4>
                        <p className="text-sm text-slate-400">{t.description}</p>
                      </div>
                    </div>

                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Version {t.version}</span>
                      <span>{t.size}</span>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full mt-3 bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                      onClick={() => handleDownloadTemplate(t.title)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clone from Previous Semester Section */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
            <h3 className="font-semibold mb-4 text-slate-100">
              Clone from Previous Semester
            </h3>

            <div className="mb-4">
              <p className="text-slate-400 mb-3">
                Select a previous document to clone and edit for the current semester:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    Document Type
                  </label>
                  <select className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Course Syllabus</option>
                    <option>Exam Questionnaire</option>
                    <option>Course Portfolio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    From Semester
                  </label>
                  <select className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Semester 1, AY 2023-2024</option>
                    <option>Semester 2, AY 2022-2023</option>
                    <option>Semester 1, AY 2022-2023</option>
                    <option>Semester 2, AY 2021-2022</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border border-slate-700 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-slate-100">CCS 101 Course Syllabus</h4>
                  <p className="text-sm text-slate-400">
                    From Semester 1, AY 2023-2024
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                  onClick={() => handlePreview("CCS 101 Course Syllabus")}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
              <div className="text-sm text-slate-400">
                <p className="mb-1">Last modified: December 15, 2023</p>
                <p>
                  Contains: Course description, outcomes, grading system, weekly schedule
                </p>
              </div>
            </div>

            <Button
              onClick={handleClone}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Copy className="h-4 w-4 mr-2" />
              Clone Document for Current Semester
            </Button>
          </div>
        </div>

        {/* Right Column (1/3 width) - Archived Documents */}
        <div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6 sticky top-6">
            <h3 className="font-semibold mb-4 text-slate-100">Your Archived Documents</h3>
            <div className="space-y-3">
              {archivedDocs && archivedDocs.length > 0 ? (
                archivedDocs.map((d) => {
                  const Icon = d.icon || FileText;
                  return (
                    <div
                      key={d.id}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded"
                    >
                      <div className="flex items-center">
                        <Icon className={`h-5 w-5 ${d.iconClass || 'text-slate-400'} mr-3`} />
                        <div>
                          <p className="font-medium text-slate-100">{d.title}</p>
                          <p className="text-sm text-slate-400">{d.subtitle || d.date}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                        onClick={() => handlePreview(d.title)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-slate-500">
                  <Archive className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No archives found</p>
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
        </div>
      </div>
    </div>
  );
}
