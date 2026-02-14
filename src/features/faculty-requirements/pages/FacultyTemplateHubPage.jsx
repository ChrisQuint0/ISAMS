import { useMemo, useState } from "react";
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

export default function FacultyTemplateHubPage() {
  const navigate = useNavigate();

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
      },
      {
        id: "ppt",
        title: "Presentation Template",
        description: "CCS-branded PowerPoint template",
        version: "1.5",
        size: "2.4 MB",
        icon: Presentation,
        iconClass: "text-orange-400"
      },
      {
        id: "exam",
        title: "Exam Paper Template",
        description: "Standard format for midterm/final exams",
        version: "2.0",
        size: "0.5 MB",
        icon: FileType2,
        iconClass: "text-purple-400"
      }
    ],
    []
  );

  const archivedDocs = useMemo(
    () => [
      {
        id: 1,
        title: "CCS 101 Syllabus",
        subtitle: "S1, AY 2023-2024",
        icon: FileText,
        iconClass: "text-blue-400"
      },
      {
        id: 2,
        title: "CCS 201 Grades",
        subtitle: "S1, AY 2023-2024",
        icon: FileSpreadsheet,
        iconClass: "text-green-400"
      },
      {
        id: 3,
        title: "CCS 102 Presentations",
        subtitle: "S2, AY 2022-2023",
        icon: File,
        iconClass: "text-red-400"
      }
    ],
    []
  );

  const handleSearch = () => {
    // Frontend-only demo behavior for now
    alert(`Searching archived documents for: ${query || "(empty)"}`);
  };

  const handleDownloadTemplate = (templateTitle) => {
    alert(`Downloading: ${templateTitle}`);
  };

  const handlePreview = (title) => {
    alert(`Preview: ${title}`);
  };

  const handleClone = () => {
    alert("Clone Document for Current Semester");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">
          Syllabus &amp; Template Hub
        </h1>
        <p className="text-slate-400">
          Official templates, resources, and document management
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search + Quick Filters */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search archived documents by course code, year, or keyword..."
                  className="pl-10 bg-slate-800 border-slate-700 text-slate-200"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
              </div>
              <Button
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-400 mr-2">Quick filters:</span>
              {quickFilters.map((f) => (
                <button
                  key={f}
                  type="button"
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-sm text-slate-200 transition-colors"
                  onClick={() => setQuery(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Official Templates */}
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

          {/* Clone from Previous Semester */}
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

        {/* Right Column */}
        <div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6 mb-6">
            <h3 className="font-semibold mb-4 text-slate-100">Your Archived Documents</h3>
            <div className="space-y-3">
              {archivedDocs.map((d) => {
                const Icon = d.icon;
                return (
                  <div
                    key={d.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded"
                  >
                    <div className="flex items-center">
                      <Icon className={`h-5 w-5 ${d.iconClass} mr-3`} />
                      <div>
                        <p className="font-medium text-slate-100">{d.title}</p>
                        <p className="text-sm text-slate-400">{d.subtitle}</p>
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
              })}
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
