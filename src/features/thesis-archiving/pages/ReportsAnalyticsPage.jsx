import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ThesisArchivingHeader } from "../components/ThesisArchivingHeader";
import { ProtectedReportsRoute } from "../components/ProtectedReportsRoute";
import ReportsToastProvider from "@/providers/ReportsToastProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/toast/toaster";
import {
  exportToExcel,
  exportToCSV,
  exportToPDF,
  generateFilename,
  getFilterSummary,
} from "../utils/reportExportUtils";

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const REPORT_TYPES = [
  { value: "thesis", label: "Thesis", description: "Archive & Submissions" },
  { value: "similarity", label: "Similarity", description: "Plagiarism & Flags" },
  { value: "ojt", label: "HTE / OJT", description: "Trainee Completion" },
];

const DEPARTMENTS = ["Computer Science", "Information Technology", "Computer Engineering"];
const CATEGORIES = ["Thesis", "Research", "Capstone Project"];
const COORDINATORS = ["Dr. Juan Santos", "Dr. Maria Cruz", "Dr. Antonio Reyes"];
const STATUSES = ["All", "Complete", "Incomplete"];
const PER_PAGE = 10;

// ─────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────
function generateMockThesisData() {
  return {
    submissionSummary: [
      { year: 2022, category: "Thesis", count: 25 },
      { year: 2022, category: "Research", count: 12 },
      { year: 2022, category: "Capstone", count: 8 },
      { year: 2023, category: "Thesis", count: 32 },
      { year: 2023, category: "Research", count: 18 },
      { year: 2023, category: "Capstone", count: 14 },
      { year: 2024, category: "Thesis", count: 28 },
      { year: 2024, category: "Research", count: 15 },
      { year: 2024, category: "Capstone", count: 10 },
      { year: 2025, category: "Thesis", count: 5 },
      { year: 2025, category: "Research", count: 2 },
      { year: 2025, category: "Capstone", count: 1 },
    ],
    archiveInventory: Array.from({ length: 45 }, (_, i) => ({
      id: i + 1,
      title: [
        "Automated Crops Monitoring using IoT Sensors",
        "Library Management System with RFID Technology",
        "AI-Powered Traffic Management System",
        "Blockchain for Secure Medical Records",
        "Machine Learning in Financial Forecasting",
        "Deep Learning for Image Classification",
        "Real-Time Object Detection using YOLO",
        "NLP-Based Sentiment Analysis Framework",
        "Cybersecurity Framework for SMEs",
        "Cloud-Based Inventory Management System",
      ][i % 10] + (i >= 10 ? ` (Vol. ${Math.floor(i / 10) + 1})` : ""),
      authors: `${["C. Quinto", "A. Brown", "S. Smith", "E. Garcia", "M. Cruz"][i % 5]} · ${["J. Doe", "B. Clark", "M. Johnson", "F. White", "A. Reyes"][i % 5]}`,
      category: ["Thesis", "Research", "Capstone Project"][i % 3],
      year: 2020 + (i % 5),
      dateAdded: `2024-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
    })),
  };
}

function generateMockSimilarityData() {
  return {
    flaggedSubmissions: Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      title: `Research Paper ${i + 1}: ${["Advanced Computing Systems", "Distributed Database Architecture", "Neural Network Optimization", "Quantum Computing Applications", "Edge Computing for IoT"][i % 5]}`,
      authors: `${["A. Santos", "M. Cruz", "J. Reyes", "C. Quinto", "R. Lopez"][i % 5]} · Co-Author ${i + 1}`,
      submissionDate: `2024-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
      similarityScore: ((i * 13 + 7) % 100) + 0.42,
      reviewStatus: ["Pending", "Reviewed", "Cleared"][i % 3],
    })),
    similarityDistribution: [
      { category: "Thesis", avgSimilarity: 15.2 },
      { category: "Research", avgSimilarity: 12.8 },
      { category: "Capstone Project", avgSimilarity: 18.5 },
      { category: "Other", avgSimilarity: 22.1 },
    ],
  };
}

function generateMockOJTData() {
  return {
    traineeStatus: Array.from({ length: 35 }, (_, i) => {
      const uploaded = (i * 7 + 3) % 15 + 1;
      return {
        id: i + 1,
        studentName: `${["Alice", "Bob", "Carlos", "Diana", "Ethan", "Fiona", "George"][i % 7]} ${["Santos", "Cruz", "Reyes", "Lopez", "Garcia", "Quinto", "Rivera"][i % 7]}`,
        studentId: `2024${String(i + 1).padStart(5, "0")}`,
        academicYear: `AY ${2023 + Math.floor(i / 12)}–${2024 + Math.floor(i / 12)}`,
        semester: ["1st Sem", "2nd Sem", "Summer"][i % 3],
        coordinator: ["Dr. Juan Santos", "Dr. Maria Cruz", "Dr. Antonio Reyes"][i % 3],
        totalRequired: 15,
        totalUploaded: uploaded,
        overallStatus: uploaded === 15 ? "Complete" : "Incomplete",
      };
    }),
  };
}

// ─────────────────────────────────────────────────────────────
// GSDS DESIGN TOKENS (Green School Design System)
// ─────────────────────────────────────────────────────────────
const ACCENT = {
  thesis: { gradFrom: "from-green-600", gradTo: "to-green-700", text: "text-green-700", border: "border-green-400/30", activeBg: "bg-green-50", glow: "rgba(0,138,69,0.12)", glowHover: "rgba(0,138,69,0.22)" },
  similarity: { gradFrom: "from-green-500", gradTo: "to-green-600", text: "text-green-700", border: "border-green-400/30", activeBg: "bg-green-50", glow: "rgba(16,185,129,0.12)", glowHover: "rgba(16,185,129,0.22)" },
  ojt: { gradFrom: "from-green-700", gradTo: "to-green-800", text: "text-green-800", border: "border-green-400/30", activeBg: "bg-green-50", glow: "rgba(27,122,79,0.12)", glowHover: "rgba(27,122,79,0.22)" },
};

// ─────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────

function Panel({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white backdrop-blur-sm shadow-xl shadow-gray-300/10 p-7 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children, count, reportType = "thesis" }) {
  const a = ACCENT[reportType] ?? ACCENT.thesis;
  return (
    <div className="flex items-center justify-between mb-7">
      <div className="flex items-center gap-3.5">
        <div className={`h-7 w-[3px] rounded-full bg-gradient-to-b ${a.gradFrom} ${a.gradTo} shadow-sm`} />
        <h3 className="text-lg font-bold text-gray-900 tracking-tight">{children}</h3>
      </div>
      {count !== undefined && (
        <span className="font-mono text-xs text-gray-9000 bg-gray-100 border border-gray-300 px-3 py-1.5 rounded-full shadow-sm">
          {count}
        </span>
      )}
    </div>
  );
}

function ProgressRow({ label, sub, pct, displayValue, colorClass, valueClass }) {
  return (
    <div className="group flex items-center gap-5 py-3 px-3 rounded-lg hover:bg-green-50/50 transition-all duration-150 cursor-default">
      <div className="w-36 shrink-0">
        <p className="text-sm font-semibold text-gray-700 group-hover:text-white transition-colors leading-tight">{label}</p>
        {sub && <p className="text-xs text-gray-9000 mt-0.5 font-medium">{sub}</p>}
      </div>
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`w-14 text-right font-mono text-sm font-bold shrink-0 tabular-nums ${valueClass}`}>
        {displayValue}
      </span>
    </div>
  );
}

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-5 mt-5 border-t border-gray-200">
      <p className="text-xs text-gray-9000 font-mono">Page {page} of {totalPages}</p>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPage(page - 1)}
          className="h-8 w-8 p-0 text-base border-gray-300 text-gray-600 bg-gray-50 hover:text-gray-900 hover:bg-gray-200 hover:border-gray-400 disabled:opacity-20 transition-all rounded-lg"
        >‹</Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <Button key={p} size="sm" onClick={() => onPage(p)}
            className={`h-8 w-8 p-0 text-xs font-bold transition-all rounded-lg ${p === page
                ? "bg-gradient-to-br from-green-600 to-emerald-700 text-white border-0 shadow-[0_2px_14px_rgba(34,211,238,0.4)]"
                : "bg-gray-50 border border-gray-300 text-gray-900 hover:text-gray-900 hover:bg-gray-200 hover:border-gray-400"
              }`}
          >{p}</Button>
        ))}
        <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => onPage(page + 1)}
          className="h-8 w-8 p-0 text-base border-gray-300 text-gray-600 bg-gray-50 hover:text-gray-900 hover:bg-gray-200 hover:border-gray-400 disabled:opacity-20 transition-all rounded-lg"
        >›</Button>
      </div>
    </div>
  );
}

function ExportToolbar({ onExcel, onCSV, onPDF, exporting }) {
  const Spin = () => <span className="mr-1.5 size-3 rounded-full border border-white/30 border-t-white animate-spin inline-block" />;
  const btns = [
    { key: "excel", label: "XLSX", fn: onExcel, cls: "from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-[0_2px_10px_rgba(16,185,129,0.25)] hover:shadow-[0_2px_20px_rgba(16,185,129,0.45)]" },
    { key: "csv", label: "CSV", fn: onCSV, cls: "from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-[0_2px_10px_rgba(59,130,246,0.25)] hover:shadow-[0_2px_20px_rgba(59,130,246,0.45)]" },
    { key: "pdf", label: "PDF", fn: onPDF, cls: "from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-[0_2px_10px_rgba(244,63,94,0.25)] hover:shadow-[0_2px_20px_rgba(244,63,94,0.45)]" },
  ];
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mr-1.5">Export</span>
      {btns.map(({ key, label, fn, cls }) => (
        <Button key={key} size="sm" disabled={!!exporting} onClick={fn}
          className={`h-8 px-4 text-xs font-bold bg-gradient-to-r ${cls} text-white border-0 transition-all duration-200 disabled:opacity-40 rounded-lg`}
        >
          {exporting === key ? <><Spin />{label}</> : label}
        </Button>
      ))}
    </div>
  );
}

function DataTable({ columns, children }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-inner shadow-gray-300/5">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50/70">
            {columns.map((col, i) => (
              <th key={i} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-gray-9000 whitespace-nowrap border-b border-gray-200">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">{children}</tbody>
      </table>
    </div>
  );
}

function CategoryBadge({ category }) {
  const map = {
    "Thesis": "bg-green-500/[0.08] text-green-600 border-green-400/25",
    "Research": "bg-violet-500/[0.08] text-violet-300 border-violet-500/25",
    "Capstone Project": "bg-blue-500/[0.08] text-blue-300 border-blue-500/25",
  };
  return (
    <Badge className={`border text-xs font-semibold px-2.5 py-0.5 rounded-lg ${map[category] ?? "border-gray-300 text-gray-600"}`}>
      {category}
    </Badge>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-5">
      {[5, 8].map((rows, ci) => (
        <div key={ci} className="rounded-2xl border border-gray-200 bg-white p-7 space-y-5">
          <Skeleton className="h-6 w-52 bg-gray-100 rounded-lg" />
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex items-center gap-5">
              <Skeleton className="h-4 w-32 bg-gray-100 rounded" />
              <Skeleton className="flex-1 h-1.5 bg-gray-100 rounded-full" />
              <Skeleton className="h-4 w-12 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SHARED FORM STYLES
// ─────────────────────────────────────────────────────────────
const inputCls =
  "h-10 text-sm bg-white border-gray-300 text-gray-900 placeholder:text-gray-600 " +
  "focus:border-green-400/60 focus:ring-1 focus:ring-cyan-500/20 hover:border-gray-300/70 transition-colors rounded-lg shadow-sm";

const triggerCls =
  "h-10 text-sm bg-white border-gray-300 text-gray-900 " +
  "focus:border-green-400/60 focus:ring-1 focus:ring-cyan-500/20 hover:border-gray-300/70 transition-colors rounded-lg shadow-sm";

const dropdownCls = "bg-white border-gray-300 text-gray-900 rounded-lg shadow-2xl";
const labelCls = "text-[10px] font-bold uppercase tracking-widest text-gray-9000 mb-2 block";

// ─────────────────────────────────────────────────────────────
// FILTERS
// ─────────────────────────────────────────────────────────────
function defaultFilters() {
  return { dateFrom: "", dateTo: "", department: "All", category: "All", coordinator: "All", completionStatus: "All" };
}

function ReportsFilters({ onFilterChange, showOJTFilters = false, reportType = "thesis" }) {
  const [filters, setFilters] = useState(() => {
    try {
      const s = sessionStorage.getItem(`reportFilters_${reportType}`);
      return s ? JSON.parse(s) : defaultFilters();
    } catch { return defaultFilters(); }
  });

  useEffect(() => {
    sessionStorage.setItem(`reportFilters_${reportType}`, JSON.stringify(filters));
    onFilterChange(filters);
  }, [filters, reportType, onFilterChange]);

  const set = (k) => (v) => setFilters((p) => ({ ...p, [k]: v }));
  const setEv = (k) => (e) => setFilters((p) => ({ ...p, [k]: e.target.value }));
  const hasActive = Object.values(filters).some((v) => v && v !== "All");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white backdrop-blur-sm shadow-lg shadow-gray-300/5">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-9000">Filters</span>
          {hasActive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/[0.08] border border-green-400/30 px-3 py-1 text-[10px] font-bold text-green-600 tracking-wide shadow-sm">
              <span className="size-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
              ACTIVE
            </span>
          )}
        </div>
        {hasActive && (
          <button
            onClick={() => { setFilters(defaultFilters()); sessionStorage.removeItem(`reportFilters_${reportType}`); }}
            className="text-xs text-gray-9000 hover:text-rose-400 transition-colors font-medium"
          >
            Reset all
          </button>
        )}
      </div>

      <div className={`p-6 grid gap-4 ${showOJTFilters ? "grid-cols-1 sm:grid-cols-3 lg:grid-cols-6" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
        <div>
          <Label className={labelCls}>From Date</Label>
          <Input type="date" value={filters.dateFrom} onChange={setEv("dateFrom")} className={inputCls} />
        </div>
        <div>
          <Label className={labelCls}>To Date</Label>
          <Input type="date" value={filters.dateTo} onChange={setEv("dateTo")} className={inputCls} />
        </div>
        <div>
          <Label className={labelCls}>Department</Label>
          <Select value={filters.department} onValueChange={set("department")}>
            <SelectTrigger className={triggerCls}><SelectValue placeholder="All Departments" /></SelectTrigger>
            <SelectContent className={dropdownCls}>
              <SelectItem value="All">All Departments</SelectItem>
              {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className={labelCls}>Category</Label>
          <Select value={filters.category} onValueChange={set("category")}>
            <SelectTrigger className={triggerCls}><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent className={dropdownCls}>
              <SelectItem value="All">All Categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {showOJTFilters && (
          <>
            <div>
              <Label className={labelCls}>Coordinator</Label>
              <Select value={filters.coordinator} onValueChange={set("coordinator")}>
                <SelectTrigger className={triggerCls}><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent className={dropdownCls}>
                  <SelectItem value="All">All Coordinators</SelectItem>
                  {COORDINATORS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={labelCls}>Status</Label>
              <Select value={filters.completionStatus} onValueChange={set("completionStatus")}>
                <SelectTrigger className={triggerCls}><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent className={dropdownCls}>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// THESIS REPORT
// ─────────────────────────────────────────────────────────────
function ReportsThesis({ filters }) {
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      setError(null);
      try {
        const mockData = generateMockThesisData();
        
        // Filter and paginate the data
        let filtered = mockData.archiveInventory;
        
        if (filters.category !== "All") {
          filtered = filtered.filter(item => item.category === filters.category);
        }
        
        const totalCount = filtered.length;
        const start = (page - 1) * PER_PAGE;
        const end = start + PER_PAGE;
        const paginated = filtered.slice(start, end);
        
        setData({
          submissionSummary: mockData.submissionSummary,
          archiveInventory: paginated,
          totalCount,
        });
      } catch (err) {
        console.error("Error loading thesis report:", err);
        setError(err.message || "Failed to load thesis report");
        addToast({
          title: "Error",
          description: err.message || "Failed to load thesis report",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [filters, page, addToast]);

  const paginated = useMemo(() => data?.archiveInventory ?? [], [data]);
  const totalPages = data ? Math.ceil(data.totalCount / PER_PAGE) : 1;

  const withExport = async (key, label, fn) => {
    setExporting(key);
    try {
      // Use full mock dataset for export
      const fullData = generateMockThesisData();
      
      let filtered = fullData.archiveInventory;
      if (filters.category !== "All") {
        filtered = filtered.filter(item => item.category === filters.category);
      }

      const result = fn({ ...fullData, archiveInventory: filtered });
      if (result?.success) {
        addToast({ title: "Exported", description: `Thesis report saved as ${label}` });
      } else {
        addToast({ title: "Export failed", description: `Could not export`, variant: "destructive" });
      }
    } catch (err) {
      console.error("Export error:", err);
      addToast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  if (loading) return <ReportSkeleton />;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

  const maxCount = data?.submissionSummary?.length > 0
    ? Math.max(...data.submissionSummary.map((s) => s.count))
    : 1;

  const BAR = {
    Thesis: { bar: "bg-gradient-to-r from-green-800 via-green-600 to-green-500", val: "text-green-600" },
    Research: { bar: "bg-gradient-to-r from-violet-900/60 via-violet-700 to-violet-400", val: "text-violet-400" },
    Capstone: { bar: "bg-gradient-to-r from-blue-900/60 via-blue-700 to-blue-400", val: "text-blue-400" },
  };

  const csvExportData = (fullData) => (fullData?.archiveInventory ?? []).map((i) => ({
    Title: i.title,
    Authors: i.authors,
    Category: i.category,
    Year: i.year,
    "Date Added": i.dateAdded,
  }));

  return (
    <div className="space-y-5">
      <Panel>
        <SectionTitle count={`${data?.submissionSummary?.length ?? 0} entries`} reportType="thesis">
          Submission Summary
        </SectionTitle>
        <div className="space-y-0.5">
          {(data?.submissionSummary ?? []).map((item, idx) => (
            <ProgressRow
              key={idx}
              label={String(item.year)}
              sub={item.category}
              pct={(item.count / maxCount) * 100}
              displayValue={item.count}
              colorClass={(BAR[item.category] ?? BAR.Thesis).bar}
              valueClass={(BAR[item.category] ?? BAR.Thesis).val}
            />
          ))}
        </div>
        <div className="flex items-center gap-6 mt-6 pt-5 border-t border-gray-200">
          {[["Thesis", "cyan-400"], ["Research", "violet-400"], ["Capstone", "blue-400"]].map(([label, color]) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`size-2 rounded-full bg-${color} shadow-[0_0_6px] shadow-inherit`} />
              <span className="text-xs text-gray-600 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <div className="flex items-center justify-between mb-7 gap-4 flex-wrap">
          <div className="flex items-center gap-3.5">
            <div className="h-7 w-[3px] rounded-full bg-gradient-to-b from-green-600 to-green-700" />
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Archive Inventory</h3>
            <span className="font-mono text-xs text-gray-9000 bg-gray-100 border border-gray-300 px-3 py-1.5 rounded-full shadow-sm">
              {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, data?.totalCount ?? 0)} of {data?.totalCount ?? 0}
            </span>
          </div>
          <ExportToolbar
            exporting={exporting}
            onExcel={() => withExport("excel", "Excel", (fullData) => exportToExcel(csvExportData(fullData), `${generateFilename("Thesis")}.xlsx`, "Thesis Reports"))}
            onCSV={() => withExport("csv", "CSV", (fullData) => exportToCSV(csvExportData(fullData), `${generateFilename("Thesis")}.csv`))}
            onPDF={() => withExport("pdf", "PDF", (fullData) => exportToPDF({ title: "Thesis Report", subtitle: "Archive Inventory", filters, timestamp: new Date().toLocaleString(), columns: ["Title", "Authors", "Category", "Year", "Date Added"], data: (fullData?.archiveInventory ?? []).map((i) => [i.title, i.authors, i.category, i.year, i.dateAdded]) }, `${generateFilename("Thesis")}.pdf`))}
          />
        </div>
        <DataTable columns={["Title", "Authors", "Category", "Year", "Date Added"]}>
          {paginated.map((item, idx) => (
            <tr key={idx} className="hover:bg-gray-50 transition-colors duration-100 group">
              <td className="px-5 py-4 max-w-xs">
                <a href="#" className="text-gray-900 hover:text-green-700 font-semibold text-sm group-hover:underline underline-offset-2 transition-colors line-clamp-1">
                  {item.title}
                </a>
              </td>
              <td className="px-5 py-4 text-gray-600 text-sm">{item.authors}</td>
              <td className="px-5 py-4"><CategoryBadge category={item.category} /></td>
              <td className="px-5 py-4 font-mono text-gray-600 text-xs tabular-nums">{item.year}</td>
              <td className="px-5 py-4 font-mono text-gray-700 text-xs tabular-nums">{item.dateAdded}</td>
            </tr>
          ))}
        </DataTable>
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      </Panel>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SIMILARITY REPORT
// ─────────────────────────────────────────────────────────────
function ReportsSimilarity({ filters }) {
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      setError(null);
      try {
        const mockData = generateMockSimilarityData();
        
        // Filter and paginate the data
        let filtered = mockData.flaggedSubmissions;
        
        if (filters.category !== "All") {
          filtered = filtered.filter(item => item.category === filters.category);
        }
        
        const totalCount = filtered.length;
        const start = (page - 1) * PER_PAGE;
        const end = start + PER_PAGE;
        const paginated = filtered.slice(start, end);
        
        setData({
          flaggedSubmissions: paginated,
          similarityDistribution: mockData.similarityDistribution,
          totalCount,
        });
      } catch (err) {
        console.error("Error loading similarity report:", err);
        setError(err.message || "Failed to load similarity report");
        addToast({
          title: "Error",
          description: err.message || "Failed to load similarity report",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [filters, page, addToast]);

  const paginated = useMemo(() => data?.flaggedSubmissions ?? [], [data]);
  const totalPages = data ? Math.ceil(data.totalCount / PER_PAGE) : 1;

  const withExport = async (key, label, fn) => {
    setExporting(key);
    try {
      // Use full mock dataset for export
      const fullData = generateMockSimilarityData();
      
      let filtered = fullData.flaggedSubmissions;
      if (filters.category !== "All") {
        filtered = filtered.filter(item => item.category === filters.category);
      }

      const result = fn({ ...fullData, flaggedSubmissions: filtered });
      if (result?.success) {
        addToast({ title: "Exported", description: `Similarity report saved as ${label}` });
      } else {
        addToast({ title: "Export failed", description: `Could not export`, variant: "destructive" });
      }
    } catch (err) {
      console.error("Export error:", err);
      addToast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  if (loading) return <ReportSkeleton />;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

  const maxSim = data?.similarityDistribution?.length > 0
    ? Math.max(...data.similarityDistribution.map((s) => s.avgSimilarity))
    : 1;

  const simCls = (v) => v > 50 ? "bg-rose-500/[0.08] text-rose-300 border-rose-500/25"
    : v > 25 ? "bg-amber-500/[0.08] text-amber-300 border-amber-500/25"
      : "bg-emerald-500/[0.08] text-emerald-300 border-emerald-500/25";
  const statusCls = (s) => s === "Pending" ? "bg-amber-500/[0.08] text-amber-300 border-amber-500/25"
    : s === "Reviewed" ? "bg-blue-500/[0.08] text-blue-300 border-blue-500/25"
      : "bg-emerald-500/[0.08] text-emerald-300 border-emerald-500/25";

  const exportData = (fullData) => (fullData?.flaggedSubmissions ?? []).map((i) => ({
    "Paper Title": i.title,
    Authors: i.authors,
    "Submission Date": i.submissionDate,
    "Similarity Score": `${(i.similarityScore || 0).toFixed(2)}%`,
    "Review Status": i.reviewStatus,
  }));

  return (
    <div className="space-y-5">
      <Panel>
        <SectionTitle reportType="similarity">Similarity Distribution</SectionTitle>
        <div className="space-y-0.5">
          {(data?.similarityDistribution ?? []).map((item, idx) => (
            <ProgressRow
              key={idx}
              label={item.category}
              pct={(parseFloat(item.avgSimilarity) / maxSim) * 100}
              displayValue={`${item.avgSimilarity}%`}
              colorClass="bg-gradient-to-r from-violet-900/60 via-violet-700 to-violet-400"
              valueClass="text-violet-400"
            />
          ))}
        </div>
      </Panel>

      <Panel>
        <div className="flex items-center justify-between mb-7 gap-4 flex-wrap">
          <div className="flex items-center gap-3.5">
            <div className="h-7 w-[3px] rounded-full bg-gradient-to-b from-violet-400 to-indigo-500" />
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Flagged Submissions</h3>
            <span className="font-mono text-xs text-gray-9000 bg-gray-100 border border-gray-300 px-3 py-1.5 rounded-full shadow-sm">
              {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, data?.totalCount ?? 0)} of {data?.totalCount ?? 0}
            </span>
          </div>
          <ExportToolbar
            exporting={exporting}
            onExcel={() => withExport("excel", "Excel", (fullData) => exportToExcel(exportData(fullData), `${generateFilename("Similarity")}.xlsx`, "Similarity Reports"))}
            onCSV={() => withExport("csv", "CSV", (fullData) => exportToCSV(exportData(fullData), `${generateFilename("Similarity")}.csv`))}
            onPDF={() => withExport("pdf", "PDF", (fullData) => exportToPDF({ title: "Similarity Check Reports", subtitle: "Flagged Submissions", filters, timestamp: new Date().toLocaleString(), columns: ["Paper Title", "Authors", "Submission Date", "Similarity Score", "Review Status"], data: (fullData?.flaggedSubmissions ?? []).map((i) => [i.title, i.authors, i.submissionDate, `${(i.similarityScore || 0).toFixed(2)}%`, i.reviewStatus]) }, `${generateFilename("Similarity")}.pdf`))}
          />
        </div>
        <DataTable columns={["Paper Title", "Authors", "Submitted", "Similarity", "Status"]}>
          {paginated.map((item, idx) => (
            <tr key={idx} className="hover:bg-gray-50 transition-colors duration-100 group">
              <td className="px-5 py-4 max-w-xs">
                <a href="#" className="text-gray-900 hover:text-green-700 font-semibold text-sm group-hover:underline underline-offset-2 transition-colors line-clamp-1">
                  {item.title}
                </a>
              </td>
              <td className="px-5 py-4 text-gray-600 text-sm">{item.authors}</td>
              <td className="px-5 py-4 font-mono text-gray-700 text-xs tabular-nums">{item.submissionDate}</td>
              <td className="px-5 py-4">
                <Badge className={`font-mono text-xs font-bold border rounded-lg px-2.5 py-1 ${simCls(item.similarityScore || 0)}`}>
                  {(item.similarityScore || 0).toFixed(2)}%
                </Badge>
              </td>
              <td className="px-5 py-4">
                <Badge className={`text-xs font-semibold border rounded-lg px-2.5 py-1 ${statusCls(item.reviewStatus)}`}>
                  {item.reviewStatus}
                </Badge>
              </td>
            </tr>
          ))}
        </DataTable>
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      </Panel>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OJT REPORT
// ─────────────────────────────────────────────────────────────
function ReportsOJT({ filters }) {
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      setError(null);
      try {
        const mockData = generateMockOJTData();
        
        // Filter and paginate the data
        let filtered = mockData.traineeStatus;
        
        if (filters.coordinator !== "All") {
          filtered = filtered.filter(item => item.coordinator === filters.coordinator);
        }
        if (filters.completionStatus !== "All") {
          filtered = filtered.filter(item => item.overallStatus === filters.completionStatus);
        }
        
        const totalCount = filtered.length;
        const start = (page - 1) * PER_PAGE;
        const end = start + PER_PAGE;
        const paginated = filtered.slice(start, end);
        
        // Calculate stats
        const complete = filtered.filter(t => t.overallStatus === "Complete").length;
        const incomplete = filtered.filter(t => t.overallStatus === "Incomplete").length;
        const rate = totalCount > 0 ? ((complete / totalCount) * 100).toFixed(1) : "0.0";
        
        setData({
          traineeStatus: paginated,
          totalCount,
          stats: {
            total: totalCount,
            complete,
            incomplete,
            rate,
          },
        });
      } catch (err) {
        console.error("Error loading OJT report:", err);
        setError(err.message || "Failed to load OJT report");
        addToast({
          title: "Error",
          description: err.message || "Failed to load OJT report",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [filters, page, addToast]);

  const paginated = useMemo(() => data?.traineeStatus ?? [], [data]);
  const totalPages = data ? Math.ceil(data.totalCount / PER_PAGE) : 1;

  const stats = useMemo(() => {
    return data?.stats ?? { total: 0, complete: 0, incomplete: 0, rate: "0.0" };
  }, [data]);

  const withExport = async (key, label, fn) => {
    setExporting(key);
    try {
      // Use full mock dataset for export
      const fullData = generateMockOJTData();
      
      let filtered = fullData.traineeStatus;
      if (filters.coordinator !== "All") {
        filtered = filtered.filter(item => item.coordinator === filters.coordinator);
      }
      if (filters.completionStatus !== "All") {
        filtered = filtered.filter(item => item.overallStatus === filters.completionStatus);
      }

      const result = fn({ ...fullData, traineeStatus: filtered });
      if (result?.success) {
        addToast({ title: "Exported", description: `OJT report saved as ${label}` });
      } else {
        addToast({ title: "Export failed", description: `Could not export`, variant: "destructive" });
      }
    } catch (err) {
      console.error("Export error:", err);
      addToast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  if (loading) return <ReportSkeleton />;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

  const exportData = (fullData) => (fullData?.traineeStatus ?? []).map((i) => ({
    "Student Name": i.studentName,
    "Student ID": i.studentId,
    "Academic Year": i.academicYear,
    Semester: i.semester,
    "Assigned Coordinator": i.coordinator,
    "Total Required": i.totalRequired,
    "Total Uploaded": i.totalUploaded,
    "Overall Status": i.overallStatus,
  }));

  const STAT_CARDS = [
    { label: "Total Trainees", value: stats.total, sub: "enrolled trainees", color: "cyan" },
    { label: "Completed", value: stats.complete, sub: "met requirements", color: "emerald" },
    { label: "Incomplete", value: stats.incomplete, sub: "still pending", color: "rose" },
    { label: "Completion Rate", value: `${stats.rate}%`, sub: "overall completion", color: "violet" },
  ];

  const colorMap = {
    cyan: { border: "border-green-400/20", bg: "bg-green-500/[0.04]", glow: "shadow-cyan-500/10", val: "text-green-600", sub: "text-cyan-700", dot: "bg-green-400", dotGlow: "shadow-cyan-400" },
    emerald: { border: "border-emerald-500/20", bg: "bg-emerald-500/[0.04]", glow: "shadow-emerald-500/10", val: "text-emerald-300", sub: "text-emerald-700", dot: "bg-emerald-400", dotGlow: "shadow-emerald-400" },
    rose: { border: "border-rose-500/20", bg: "bg-rose-500/[0.04]", glow: "shadow-rose-500/10", val: "text-rose-300", sub: "text-rose-700", dot: "bg-rose-400", dotGlow: "shadow-rose-400" },
    violet: { border: "border-violet-500/20", bg: "bg-violet-500/[0.04]", glow: "shadow-violet-500/10", val: "text-violet-300", sub: "text-violet-700", dot: "bg-violet-400", dotGlow: "shadow-violet-400" },
  };

  return (
    <div className="space-y-5">
      {/* KPI stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((s) => {
          const c = colorMap[s.color];
          return (
            <div key={s.label} className={`rounded-2xl border ${c.border} ${c.bg} bg-white backdrop-blur-sm p-6 shadow-xl ${c.glow} hover:shadow-2xl transition-all duration-200 group`}>
              <div className="flex items-center gap-2 mb-5">
                <span className={`size-2 rounded-full ${c.dot} shadow-sm shadow-${c.dotGlow}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-9000">{s.label}</span>
              </div>
              <p className={`text-5xl font-bold tracking-tight leading-none mb-2 ${c.val} group-hover:brightness-110 transition-all`}>{s.value}</p>
              <p className={`text-xs font-medium ${c.sub}`}>{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Trainee Table */}
      <Panel>
        <div className="flex items-center justify-between mb-7 gap-4 flex-wrap">
          <div className="flex items-center gap-3.5">
            <div className="h-7 w-[3px] rounded-full bg-gradient-to-b from-emerald-400 to-teal-500" />
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Trainee Completion Status</h3>
            <span className="font-mono text-xs text-gray-9000 bg-gray-100 border border-gray-300 px-3 py-1.5 rounded-full shadow-sm">
              {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, data?.totalCount ?? 0)} of {data?.totalCount ?? 0}
            </span>
          </div>
          <ExportToolbar
            exporting={exporting}
            onExcel={() => withExport("excel", "Excel", (fullData) => exportToExcel(exportData(fullData), `${generateFilename("OJT")}.xlsx`, "OJT Reports"))}
            onCSV={() => withExport("csv", "CSV", (fullData) => exportToCSV(exportData(fullData), `${generateFilename("OJT")}.csv`))}
            onPDF={() => withExport("pdf", "PDF", (fullData) => exportToPDF({ title: "HTE / OJT Reports", subtitle: "Trainee Completion Status", filters, timestamp: new Date().toLocaleString(), columns: ["Student Name", "Student ID", "Acad. Year", "Semester", "Coordinator", "Req.", "Uploaded", "Status"], data: (fullData?.traineeStatus ?? []).map((i) => [i.studentName, i.studentId, i.academicYear, i.semester, i.coordinator, i.totalRequired, i.totalUploaded, i.overallStatus]) }, `${generateFilename("OJT")}.pdf`))}
          />
        </div>
        <DataTable columns={["Student Name", "Student ID", "Academic Year", "Coordinator", "Progress", "Status"]}>
          {paginated.map((item, idx) => {
            const isOk = item.overallStatus === "Complete";
            const pct = (item.totalUploaded / item.totalRequired) * 100;
            return (
              <tr key={idx} className={`transition-colors duration-100 ${isOk ? "hover:bg-gray-50" : "bg-rose-950/[0.04] hover:bg-rose-950/[0.10]"}`}>
                <td className="px-5 py-4 text-sm font-semibold text-gray-900">{item.studentName}</td>
                <td className="px-5 py-4 font-mono text-gray-9000 text-xs tabular-nums">{item.studentId}</td>
                <td className="px-5 py-4">
                  <p className="text-sm text-gray-700 font-medium leading-tight">{item.academicYear}</p>
                  <p className="text-xs text-gray-9000 mt-0.5">{item.semester}</p>
                </td>
                <td className="px-5 py-4 text-gray-600 text-sm">{item.coordinator}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden shrink-0">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isOk ? "bg-gradient-to-r from-emerald-700 to-emerald-400" : "bg-gradient-to-r from-rose-900 to-rose-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`font-mono text-xs font-bold whitespace-nowrap tabular-nums ${isOk ? "text-emerald-400" : "text-rose-400"}`}>
                      {item.totalUploaded}/{item.totalRequired}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <Badge className={`text-xs font-semibold border rounded-lg px-2.5 py-1 ${isOk ? "bg-emerald-500/[0.08] text-emerald-300 border-emerald-500/25" : "bg-rose-500/[0.08] text-rose-300 border-rose-500/25"}`}>
                    {item.overallStatus}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </DataTable>
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      </Panel>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function ReportsAnalyticsPage() {
  const [reportType, setReportType] = useState("thesis");
  const [filters, setFilters] = useState(defaultFilters);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const handleFilterChange = useCallback((f) => setFilters(f), []);
  const hasActive = Object.values(filters).some((v) => v && v !== "All");
  const clearAll = useCallback(() => {
    setFilters(defaultFilters());
    REPORT_TYPES.forEach((t) => sessionStorage.removeItem(`reportFilters_${t.value}`));
  }, []);

  return (
    <ProtectedReportsRoute>
      <ReportsToastProvider>
        <div className="flex flex-col min-h-screen bg-white">
          <ThesisArchivingHeader title="Reports & Analytics" />

          <main className="flex-1 px-8 py-10 lg:px-12 lg:py-12">
            <div className="max-w-7xl mx-auto space-y-6">

              {/* ── PAGE HEADER ── */}
              <div className="flex items-end justify-between gap-6 pb-5 border-b border-gray-200">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-9000 mb-2">Analytics Dashboard</p>
                  <h1 className="text-4xl font-bold text-gray-900 tracking-tight leading-none">Reports</h1>
                </div>

                <div className="flex items-center gap-3 pb-1">
                  {hasActive && (
                    <button onClick={clearAll} className="text-xs text-gray-9000 hover:text-rose-400 transition-colors font-medium">
                      Clear filters
                    </button>
                  )}
                  <div className="flex items-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-2.5 shadow-lg shadow-gray-300/10 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <span className="relative flex size-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
                        <span className="relative inline-flex size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
                      </span>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 leading-none mb-0.5">Live</p>
                        <p className="font-mono text-sm font-semibold text-emerald-400 leading-none">{lastRefresh.toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <div className="h-5 w-px bg-gray-200 mx-0.5" />
                    <Button size="sm" onClick={() => setLastRefresh(new Date())}
                      className="h-8 px-4 text-xs font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-cyan-500 hover:to-cyan-400 text-gray-900 border-0 shadow-[0_2px_14px_rgba(34,211,238,0.3)] hover:shadow-[0_2px_22px_rgba(34,211,238,0.5)] transition-all duration-200"
                    >
                      ↻ Refresh
                    </Button>
                  </div>
                </div>
              </div>

              {/* ── REPORT TYPE TABS ── */}
              <div className="flex gap-3">
                {REPORT_TYPES.map((t) => {
                  const active = reportType === t.value;
                  const a = ACCENT[t.value];
                  return (
                    <button
                      key={t.value}
                      onClick={() => setReportType(t.value)}
                      className={`relative flex-1 flex flex-col items-center justify-center gap-1.5 rounded-2xl border py-6 px-4 transition-all duration-200 outline-none cursor-pointer select-none ${active
                          ? "border-gray-300 bg-white shadow-xl shadow-gray-300/10 backdrop-blur-sm"
                          : "border-gray-200 bg-white hover:bg-white hover:border-gray-300 hover:shadow-lg hover:shadow-gray-300/10"
                        }`}
                    >
                      {/* Top accent bar — active only */}
                      <div
                        className={`absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-20 rounded-full bg-gradient-to-r ${a.gradFrom} ${a.gradTo} transition-opacity duration-200 ${active ? "opacity-100" : "opacity-0"}`}
                        style={active ? { boxShadow: `0 0 16px 2px ${a.glow}` } : {}}
                      />
                      <span className={`text-base font-bold leading-tight transition-colors ${active ? "text-gray-900" : "text-gray-600"}`}>
                        {t.label}
                      </span>
                      <span className={`text-xs font-medium transition-colors ${active ? "text-gray-600" : "text-gray-600"}`}>
                        {t.description}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active filter indicator */}
              {hasActive && (
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Filtered:</span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-green-500/[0.07] border border-green-400/25 px-3 py-1 text-xs font-semibold text-green-600 shadow-sm">
                    <span className="size-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(34,211,238,0.7)]" />
                    {getFilterSummary(filters)}
                  </span>
                </div>
              )}

              {/* ── FILTERS ── */}
              <ReportsFilters
                onFilterChange={handleFilterChange}
                showOJTFilters={reportType === "ojt"}
                reportType={reportType}
              />

              {/* ── REPORT CONTENT ── */}
              {reportType === "thesis" && <ReportsThesis filters={filters} />}
              {reportType === "similarity" && <ReportsSimilarity filters={filters} />}
              {reportType === "ojt" && <ReportsOJT filters={filters} />}

            </div>
          </main>
        </div>
      </ReportsToastProvider>
    </ProtectedReportsRoute>
  );
}


