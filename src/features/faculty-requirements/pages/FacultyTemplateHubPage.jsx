import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Archive,
  Download,
  File as FileIcon,
  FileSpreadsheet,
  FileText,
  Presentation,
  Search,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Sheet,
  ClipboardList,
  Info,
} from "lucide-react";
import { useFacultyResources } from "../hooks/FacultyResourcesHook";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatTimeAgo } from "@/lib/utils";

// Map category names to icons
const iconMap = {
  Syllabus: BookOpen,
  "Grade Sheet": Sheet,
  Spreadsheet: Sheet,
  Reports: ClipboardList,
  Examinations: FileSpreadsheet,
  Guides: Info,
  Other: FileText,
  Presentation: Presentation,
  Default: FileText,
};

export default function FacultyTemplateHubPage() {
  const navigate = useNavigate();
  const {
    templates,
    loading,
    faqs,
    categories,
  } = useFacultyResources();

  // Separate states for search and category filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const quickFilters = useMemo(
    () => ["All", ...categories],
    [categories]
  );

  // Filter templates by both search query and active category independently
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesCategory = selectedCategory === "All" || t.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      
      // If search query is short (1-2 chars), only match title for accuracy
      const matchesSearch = !searchQuery || 
        t.title.toLowerCase().includes(q) || 
        (searchQuery.length > 2 && t.description?.toLowerCase().includes(q));
        
      return matchesCategory && matchesSearch;
    });
  }, [templates, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6 flex flex-col h-full bg-neutral-50/30">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-1">Template Hub</h1>
          <p className="text-neutral-500 text-sm font-medium">
            Download official templates and find answers to frequently asked questions
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
        {/* Left Column (2/3 width on large screens) - Official Templates */}
        <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-1">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
              <h3 className="font-bold text-lg text-neutral-900 flex items-center gap-2">
                <FileIcon className="h-5 w-5 text-primary-600" /> Official Templates
              </h3>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-100 px-3 py-1 rounded-full">
                {templates.length > 0
                  ? `Updated: ${formatTimeAgo(Math.max(...templates.map(t => new Date(t.updated_at || t.created_at || Date.now()).getTime())))}`
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
        </div>

        {/* Right Column (1/3 width) - FAQ Section */}
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 flex flex-col h-fit">
            <h3 className="font-bold mb-4 text-neutral-900 border-b border-neutral-100 pb-3 flex items-center gap-2">
              <Archive className="h-5 w-5 text-primary-600" /> Frequently Asked Questions
            </h3>

            <div className="overflow-y-auto pr-2 custom-scrollbar">
              <Accordion type="single" collapsible className="w-full">
                {faqs.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500 text-sm font-medium italic bg-neutral-50 border border-neutral-200 border-dashed rounded-xl">
                    <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>No FAQs available at the moment.</p>
                  </div>
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

            <div className="mt-6 pt-4 border-t border-neutral-100 text-center">
              <p className="text-[11px] text-neutral-600 font-bold uppercase tracking-widest">
                Still have questions? <span className="text-primary-600">Contact your Admin</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}