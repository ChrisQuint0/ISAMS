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
import { useLogo } from "../../settings/hooks/useLogo";
import { useSettings } from "../../settings/hooks/useSettings";

import { fetchThesisReport, fetchSimilarityReport, fetchOJTReport, fetchCoordinators } from "../services/reportService";
import { thesisService } from "../services/thesisService";
import { supabase } from "@/lib/supabaseClient";

import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule, themeAlpine } from 'ag-grid-community';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Custom theme using AG Grid v33+ Theming API with Alpine theme and green accents matching GSDS
const customTheme = themeAlpine.withParams({
  accentColor: '#15803d', // green-700
  backgroundColor: '#ffffff',
  foregroundColor: '#1f2937', // gray-800
  borderColor: '#e5e7eb', // gray-200
  headerBackgroundColor: '#f9fafb', // gray-50
  headerTextColor: '#4b5563', // gray-600
});

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const REPORT_TYPES = [
  { value: "thesis", label: "Thesis", description: "Archive & Submissions" },
  { value: "similarity", label: "Similarity", description: "Plagiarism & Flags" },
  { value: "ojt", label: "HTE / OJT", description: "Trainee Completion" },
];

const DEPARTMENTS = ["Information Technology", "Computer Science"];
const STATUSES = ["All", "Complete", "Incomplete"];
const PER_PAGE = 10;

// ─────────────────────────────────────────────────────────────
// GSDS DESIGN TOKENS (Green School Design System)
// ─────────────────────────────────────────────────────────────
const ACCENT = {
  thesis: { gradFrom: "from-green-600", gradTo: "to-green-700", glow: "rgba(0,138,69,0.15)" },
  similarity: { gradFrom: "from-green-500", gradTo: "to-green-600", glow: "rgba(22,163,74,0.15)" },
  ojt: { gradFrom: "from-green-700", gradTo: "to-green-800", glow: "rgba(20,83,45,0.15)" },
};

// ─────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────

function Panel({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm p-7 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children, count, reportType = "thesis" }) {
  const a = ACCENT[reportType] ?? ACCENT.thesis;
  return (
    <div className="flex items-center justify-between mb-7">
      <div className="flex items-center gap-3.5">
        <div className={`h-7 w-[3px] rounded-full bg-gradient-to-b ${a.gradFrom} ${a.gradTo}`} />
        <h3 className="text-lg font-bold text-gray-900 tracking-tight">{children}</h3>
      </div>
      {count !== undefined && (
        <span className="font-mono text-xs text-gray-500 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  );
}

function ProgressRow({ label, sub, pct, displayValue, colorClass, valueClass }) {
  return (
    <div className="group flex items-center gap-5 py-3 px-3 rounded-lg hover:bg-green-50/60 transition-all duration-150 cursor-default">
      <div className="w-36 shrink-0">
        <p className="text-sm font-semibold text-gray-700 leading-tight">{label}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5 font-medium">{sub}</p>}
      </div>
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
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
      <p className="text-xs text-gray-500 font-mono">Page {page} of {totalPages}</p>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPage(page - 1)}
          className="h-8 w-8 p-0 text-base border-gray-300 text-gray-600 bg-white hover:bg-gray-100 hover:border-gray-400 disabled:opacity-30 transition-all rounded-lg"
        >‹</Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <Button key={p} size="sm" onClick={() => onPage(p)}
            className={`h-8 w-8 p-0 text-xs font-bold transition-all rounded-lg ${p === page
              ? "bg-green-700 hover:bg-green-800 text-white border-0 shadow-sm"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
              }`}
          >{p}</Button>
        ))}
        <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => onPage(page + 1)}
          className="h-8 w-8 p-0 text-base border-gray-300 text-gray-600 bg-white hover:bg-gray-100 hover:border-gray-400 disabled:opacity-30 transition-all rounded-lg"
        >›</Button>
      </div>
    </div>
  );
}

function ExportToolbar({ onExcel, onCSV, onPDF, exporting }) {
  const Spin = () => <span className="mr-1.5 size-3 rounded-full border border-white/30 border-t-white animate-spin inline-block" />;
  const btns = [
    { key: "excel", label: "XLSX", fn: onExcel, cls: "bg-green-700 hover:bg-green-800 shadow-sm" },
    { key: "csv", label: "CSV", fn: onCSV, cls: "bg-gray-700 hover:bg-gray-800 shadow-sm" },
    { key: "pdf", label: "PDF", fn: onPDF, cls: "bg-rose-600 hover:bg-rose-700 shadow-sm" },
  ];
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mr-1.5">Export</span>
      {btns.map(({ key, label, fn, cls }) => (
        <Button key={key} size="sm" disabled={!!exporting} onClick={fn}
          className={`h-8 px-4 text-xs font-bold ${cls} text-white border-0 transition-all duration-200 disabled:opacity-40 rounded-lg`}
        >
          {exporting === key ? <><Spin />{label}</> : label}
        </Button>
      ))}
    </div>
  );
}

// Removed static DataTable function since AG-Grid will be used

// ─────────────────────────────────────────────────────────────
// DYNAMIC CATEGORY THEME GENERATOR
// ─────────────────────────────────────────────────────────────
const PRESET_CATEGORIES = {
  "thesis": { bar: "from-green-700 to-green-500", val: "text-green-700", badge: "bg-green-50 text-green-700 border-green-200" },
  "research": { bar: "from-blue-700 to-blue-500", val: "text-blue-700", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  "capstone project": { bar: "from-purple-700 to-purple-500", val: "text-purple-700", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  "capstone": { bar: "from-purple-700 to-purple-500", val: "text-purple-700", badge: "bg-purple-50 text-purple-700 border-purple-200" },
};

const FALLBACK_THEMES = [
  { bar: "from-orange-600 to-orange-400", val: "text-orange-700", badge: "bg-orange-50 text-orange-700 border-orange-200" },
  { bar: "from-teal-600 to-teal-400", val: "text-teal-700", badge: "bg-teal-50 text-teal-700 border-teal-200" },
  { bar: "from-rose-600 to-rose-400", val: "text-rose-700", badge: "bg-rose-50 text-rose-700 border-rose-200" },
  { bar: "from-indigo-600 to-indigo-400", val: "text-indigo-700", badge: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { bar: "from-amber-600 to-amber-400", val: "text-amber-700", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  { bar: "from-cyan-600 to-cyan-400", val: "text-cyan-700", badge: "bg-cyan-50 text-cyan-700 border-cyan-200" },
];

function getCategoryTheme(category) {
  if (!category) return { bar: "from-gray-600 to-gray-400", val: "text-gray-700", badge: "bg-gray-50 border-gray-200 text-gray-700" };

  const lower = String(category).toLowerCase().trim();
  if (PRESET_CATEGORIES[lower]) return PRESET_CATEGORIES[lower];

  // Deterministic stable hash for unknown categories
  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = lower.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FALLBACK_THEMES[Math.abs(hash) % FALLBACK_THEMES.length];
}

function CategoryBadge({ category }) {
  const theme = getCategoryTheme(category);
  return (
    <Badge className={`border text-xs font-semibold px-2.5 py-0.5 rounded-lg ${theme.badge}`}>
      {category || "Unknown"}
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
  "h-10 text-sm bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 " +
  "focus:border-green-500 focus:ring-1 focus:ring-green-500/20 hover:border-gray-400 transition-colors rounded-lg shadow-sm";

const triggerCls =
  "w-full h-10 text-sm bg-white border-gray-300 text-gray-900 " +
  "focus:border-green-500 focus:ring-1 focus:ring-green-500/20 hover:border-gray-400 transition-colors rounded-lg shadow-sm";

const dropdownCls = "bg-white border-gray-200 text-gray-900 rounded-lg shadow-xl";
const labelCls = "text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 block";

// ─────────────────────────────────────────────────────────────
// FILTERS
// ─────────────────────────────────────────────────────────────
function defaultFilters() {
  return { dateFrom: "", dateTo: "", year: "All", academicYear: "All", program: "All", section: "All", department: "All", category: "All", coordinator: "All", completionStatus: "All" };
}

function ReportsFilters({ onFilterChange, showOJTFilters = false, reportType = "thesis", categories = [], coordinators = [], academicYears = [], sections = [], thesisYears = [], dateBounds = { min: "", max: "" } }) {
  const [filters, setFilters] = useState(defaultFilters);

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const set = (k) => (v) => setFilters((p) => ({ ...p, [k]: v }));
  const setEv = (k) => (e) => setFilters((p) => ({ ...p, [k]: e.target.value }));
  const hasActive = Object.values(filters).some((v) => v && v !== "All");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Filters</span>
          {hasActive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-[10px] font-bold text-green-700 tracking-wide">
              <span className="size-1.5 rounded-full bg-green-500" />
              ACTIVE
            </span>
          )}
        </div>
        {hasActive && (
          <button
            onClick={() => { setFilters(defaultFilters()); sessionStorage.removeItem(`reportFilters_${reportType}`); }}
            className="text-xs text-gray-500 hover:text-rose-500 transition-colors font-medium"
          >
            Reset all
          </button>
        )}
      </div>

      <div className={`p-6 grid gap-4 ${showOJTFilters ? "grid-cols-1 sm:grid-cols-3 lg:grid-cols-6" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
        {reportType === "thesis" ? (
          <div>
            <Label className={labelCls}>Publication Year</Label>
            <Select value={filters.year} onValueChange={set("year")}>
              <SelectTrigger className={triggerCls}><SelectValue placeholder="All Years" /></SelectTrigger>
              <SelectContent className={dropdownCls}>
                <SelectItem value="All">All Years</SelectItem>
                {thesisYears.length > 0 ? (
                  thesisYears.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))
                ) : (
                  Array.from({ length: new Date().getFullYear() - 2000 + 1 }, (_, i) => String(new Date().getFullYear() - i)).map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        ) : reportType === "ojt" ? (
          <div>
            <Label className={labelCls}>Academic Year</Label>
            <Select value={filters.academicYear} onValueChange={set("academicYear")}>
              <SelectTrigger className={triggerCls}><SelectValue placeholder="All School Years" /></SelectTrigger>
              <SelectContent className={dropdownCls}>
                <SelectItem value="All">All School Years</SelectItem>
                {academicYears.map((ay) => (
                  <SelectItem key={ay} value={ay}>{ay}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <>
            <div>
              <Label className={labelCls}>From Date</Label>
              <Input type="date" value={filters.dateFrom} onChange={setEv("dateFrom")} className={inputCls} min={dateBounds.min || undefined} max={dateBounds.max || undefined} />
            </div>
            <div>
              <Label className={labelCls}>To Date</Label>
              <Input type="date" value={filters.dateTo} onChange={setEv("dateTo")} className={inputCls} min={dateBounds.min || undefined} max={dateBounds.max || undefined} />
            </div>
          </>
        )}

        {showOJTFilters && (
          <>
            <div>
              <Label className={labelCls}>Programs</Label>
              <Select value={filters.program} onValueChange={set("program")}>
                <SelectTrigger className={triggerCls}><SelectValue placeholder="All Programs" /></SelectTrigger>
                <SelectContent className={dropdownCls}>
                  <SelectItem value="All">All Programs</SelectItem>
                  <SelectItem value="Information Technology">Information Technology</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className={labelCls}>Section</Label>
              <Select value={filters.section} onValueChange={set("section")}>
                <SelectTrigger className={triggerCls}><SelectValue placeholder="All Sections" /></SelectTrigger>
                <SelectContent className={dropdownCls}>
                  <SelectItem value="All">All Sections</SelectItem>
                  {sections.map((sec) => (
                    <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {reportType === "thesis" && (
          <div>
            <Label className={labelCls}>Category</Label>
            <Select value={filters.category} onValueChange={set("category")}>
              <SelectTrigger className={triggerCls}><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent className={dropdownCls}>
                <SelectItem value="All">All Categories</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {showOJTFilters && (
          <>
            <div>
              <Label className={labelCls}>Coordinator</Label>
              <Select value={filters.coordinator} onValueChange={set("coordinator")}>
                <SelectTrigger className={triggerCls}><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent className={dropdownCls}>
                  <SelectItem value="All">All Coordinators</SelectItem>
                  {coordinators.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
  const { logoUrl } = useLogo();
  const { settings } = useSettings();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadReport() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchThesisReport({ ...filters, page, limit: PER_PAGE });
        if (active) setData(result);
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load thesis report");
          addToast({ title: "Error", description: err.message, variant: "destructive" });
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadReport();
    return () => { active = false; };
  }, [filters, page, addToast]);

  const archiveInventory = useMemo(() => data?.archiveInventory ?? [], [data]);
  const totalPages = data?.totalPages ?? 1;

  const brandOpts = { logoUrl, collegeName: settings.college_name };

  const withExport = async (key, label, fn) => {
    setExporting(key);
    try {
      const result = await fetchThesisReport({ ...filters, page: 1, limit: 1000, fullDataset: true });
      const exportRes = await fn(result);
      if (exportRes?.success) addToast({ title: "Exported", description: `Thesis report saved as ${label}` });
      else addToast({ title: "Export failed", description: "Could not export", variant: "destructive" });
    } catch (err) {
      addToast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  if (loading) return <ReportSkeleton />;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

  const maxCount = data?.submissionSummary?.length > 0
    ? Math.max(...data.submissionSummary.map((s) => s.count)) : 1;



  const csvExportData = (fullData) => (fullData?.archiveInventory ?? []).map((i) => ({
    Title: i.title, Authors: i.authors, Category: i.category, Year: i.year, "Date Added": i.dateAdded,
  }));

  const colDefs = [
    { field: "title", headerName: "Title", flex: 2, sortable: true, filter: true, minWidth: 200 },
    { field: "authors", headerName: "Authors", flex: 1.5, sortable: true, filter: true },
    {
      field: "category",
      headerName: "Category",
      flex: 1,
      sortable: true,
      filter: true,
      cellRenderer: (params) => <CategoryBadge category={params.value} />
    },
    { field: "year", headerName: "Year", flex: 0.8, sortable: true, filter: true, cellClass: "font-mono tabular-nums text-xs" },
    { field: "dateAdded", headerName: "Date Added", flex: 1, sortable: true, filter: true, cellClass: "font-mono tabular-nums text-xs" },
  ];

  return (
    <div className="space-y-5">
      <Panel>
        <SectionTitle count={`${data?.submissionSummary?.length ?? 0} entries`} reportType="thesis">
          Submission Summary
        </SectionTitle>
        <div className="space-y-0.5">
          {[...(data?.submissionSummary ?? [])]
            .sort((a, b) => b.year - a.year || String(a.category).localeCompare(String(b.category)))
            .map((item, idx) => {
              const YEAR_THEMES = [
                { bar: "from-green-700 to-green-500", val: "text-green-700" },      // year % 5 == 0
                { bar: "from-blue-700 to-blue-500", val: "text-blue-700" },        // year % 5 == 1
                { bar: "from-purple-700 to-purple-500", val: "text-purple-700" },  // year % 5 == 2
                { bar: "from-rose-700 to-rose-500", val: "text-rose-700" },        // year % 5 == 3
                { bar: "from-amber-700 to-amber-500", val: "text-amber-700" },      // year % 5 == 4
              ];
              const yearNum = parseInt(item.year, 10) || 0;
              const theme = YEAR_THEMES[yearNum % 5];
              return (
                <ProgressRow
                  key={idx}
                  label={String(item.year)}
                  sub={item.category}
                  pct={(item.count / maxCount) * 100}
                  displayValue={item.count}
                  colorClass={`bg-gradient-to-r ${theme.bar}`}
                  valueClass={theme.val}
                />
              );
            })}
        </div>
      </Panel>

      <Panel>
        <div className="flex items-center justify-between mb-7 gap-4 flex-wrap">
          <div className="flex items-center gap-3.5">
            <div className="h-7 w-[3px] rounded-full bg-gradient-to-b from-green-600 to-green-700" />
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Archive Inventory</h3>
            <span className="font-mono text-xs text-gray-500 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full">
              {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, data?.totalCount ?? 0)} of {data?.totalCount ?? 0}
            </span>
          </div>
          <ExportToolbar
            exporting={exporting}
            onExcel={() => withExport("excel", "Excel", (fullData) => exportToExcel(csvExportData(fullData), `${generateFilename("Thesis")}.xlsx`, "Thesis Reports", brandOpts))}
            onCSV={() => withExport("csv", "CSV", (fullData) => Promise.resolve(exportToCSV(csvExportData(fullData), `${generateFilename("Thesis")}.csv`, brandOpts)))}
            onPDF={() => withExport("pdf", "PDF", (fullData) => exportToPDF({ title: "Thesis Report", subtitle: "Archive Inventory", filters, timestamp: new Date().toLocaleString(), columns: ["Title", "Authors", "Category", "Year", "Date Added"], data: (fullData?.archiveInventory ?? []).map((i) => [i.title, i.authors, i.category, i.year, i.dateAdded]) }, `${generateFilename("Thesis")}.pdf`, brandOpts))}
          />
        </div>
        <div className="w-full h-[400px]">
          <AgGridReact
            theme={customTheme}
            rowData={archiveInventory}
            columnDefs={colDefs}
            pagination={false}
            domLayout="normal"
          />
        </div>
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      </Panel>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SIMILARITY REPORT
// ─────────────────────────────────────────────────────────────
function ReportsSimilarity({ filters, categories = [] }) {
  const { addToast } = useToast();
  const { logoUrl } = useLogo();
  const { settings } = useSettings();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadReport() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchSimilarityReport({ ...filters, page, limit: PER_PAGE });
        if (active) setData(result);
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load similarity report");
          addToast({ title: "Error", description: err.message, variant: "destructive" });
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadReport();
    return () => { active = false; };
  }, [filters, page, addToast]);

  const paginated = useMemo(() => data?.flaggedSubmissions ?? [], [data]);
  const totalPages = data ? Math.ceil(data.totalCount / PER_PAGE) : 1;

  const brandOpts = { logoUrl, collegeName: settings.college_name };

  const withExport = async (key, label, fn) => {
    setExporting(key);
    try {
      const result = await fetchSimilarityReport({ ...filters, page: 1, limit: 1000, fullDataset: true });
      const exportRes = await fn(result);
      if (exportRes?.success) addToast({ title: "Exported", description: `Similarity report saved as ${label}` });
      else addToast({ title: "Export failed", description: "Could not export", variant: "destructive" });
    } catch (err) {
      addToast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  const distributionData = useMemo(() => {
    const apiDist = data?.similarityDistribution || [];
    const distMap = new Map(apiDist.map(d => [d.category, parseFloat(d.avgSimilarity) || 0]));

    if (!categories || categories.length === 0) return apiDist;

    return categories.map(cat => ({
      category: cat,
      avgSimilarity: distMap.get(cat) || 0
    })).sort((a, b) => b.avgSimilarity - a.avgSimilarity);
  }, [data, categories]);

  if (loading) return <ReportSkeleton />;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

  const maxSim = distributionData?.length > 0
    ? Math.max(...distributionData.map((s) => s.avgSimilarity)) : 1;

  // Readable badge colors on white backgrounds
  const simCls = (v) => v > 50
    ? "bg-red-50 text-red-700 border-red-200"
    : v > 25
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-green-50 text-green-700 border-green-200";

  const statusCls = (s) => s === "Flagged"
    ? "bg-red-50 text-red-700 border-red-200"
    : "bg-green-50 text-green-700 border-green-200";

  const exportData = (fullData) => (fullData?.flaggedSubmissions ?? []).map((i) => ({
    "Paper Title": i.title, "Submission Date": i.submissionDate,
    "Similarity Score": `${(i.similarityScore || 0).toFixed(2)}%`, Status: i.reviewStatus,
  }));

  return (
    <div className="space-y-5">
      <Panel>
        <div className="flex items-center justify-between mb-7 gap-4 flex-wrap">
          <div className="flex items-center gap-3.5">
            <div className="h-7 w-[3px] rounded-full bg-gradient-to-b from-green-600 to-green-700" />
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Submission checks</h3>
            <span className="font-mono text-xs text-gray-500 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full">
              {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, data?.totalCount ?? 0)} of {data?.totalCount ?? 0}
            </span>
          </div>
          <ExportToolbar
            exporting={exporting}
            onExcel={() => withExport("excel", "Excel", (fullData) => exportToExcel(exportData(fullData), `${generateFilename("Similarity")}.xlsx`, "Similarity Reports", brandOpts))}
            onCSV={() => withExport("csv", "CSV", (fullData) => Promise.resolve(exportToCSV(exportData(fullData), `${generateFilename("Similarity")}.csv`, brandOpts)))}
            onPDF={() => withExport("pdf", "PDF", (fullData) => exportToPDF({ title: "Similarity Check Reports", subtitle: "Submission checks", filters, timestamp: new Date().toLocaleString(), columns: ["Paper Title", "Submission Date", "Similarity Score", "Status"], data: (fullData?.flaggedSubmissions ?? []).map((i) => [i.title, i.submissionDate, `${(i.similarityScore || 0).toFixed(2)}%`, i.reviewStatus]) }, `${generateFilename("Similarity")}.pdf`, brandOpts))}
          />
        </div>
        <div className="w-full h-[400px]">
          <AgGridReact
            theme={customTheme}
            rowData={paginated}
            columnDefs={[
              { field: "title", headerName: "Paper Title", flex: 2, sortable: true, filter: true },
              { field: "submissionDate", headerName: "Submitted", flex: 1, sortable: true, filter: true, cellClass: "font-mono tabular-nums text-xs" },
              {
                field: "similarityScore",
                headerName: "Similarity",
                width: 120,
                sortable: true,
                cellRenderer: (params) => (
                  <Badge className={`font-mono text-xs font-bold border rounded-lg px-2.5 py-1 ${simCls(params.value || 0)}`}>
                    {(params.value || 0).toFixed(2)}%
                  </Badge>
                )
              },
              {
                field: "reviewStatus",
                headerName: "Status",
                width: 120,
                sortable: true,
                filter: true,
                cellRenderer: (params) => (
                  <Badge className={`text-xs font-semibold border rounded-lg px-2.5 py-1 ${statusCls(params.value)}`}>
                    {params.value}
                  </Badge>
                )
              }
            ]}
            pagination={false}
            domLayout="normal"
          />
        </div>
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
  const { logoUrl } = useLogo();
  const { settings } = useSettings();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const [docFields, setDocFields] = useState([]);

  // Fetch document fields on mount
  useEffect(() => {
    async function loadFields() {
      try {
        const fields = await thesisService.getHTEDocumentFieldsAll();
        setDocFields(fields);
      } catch (err) {
        console.error("Failed to load document fields:", err);
      }
    }
    loadFields();
  }, []);

  useEffect(() => {
    let active = true;
    async function loadReport() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchOJTReport({ ...filters, page, limit: PER_PAGE });
        if (active) setData(result);
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load OJT report");
          addToast({ title: "Error", description: err.message, variant: "destructive" });
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadReport();
    return () => { active = false; };
  }, [filters, page, addToast]);

  const paginated = useMemo(() => data?.traineeStatus ?? [], [data]);
  const totalPages = data ? Math.ceil(data.totalCount / PER_PAGE) : 1;
  const stats = useMemo(() => data?.stats ?? { total: 0, complete: 0, incomplete: 0, rate: "0.0" }, [data]);

  // Helper to calculate progress for a specific category
  const getCategoryProgress = useCallback((uploads = [], category) => {
    const activeFields = docFields.filter(f => f.category === category && f.is_active);
    const total = activeFields.length;
    if (total === 0) return { uploaded: 0, total: 0, pct: 0 };

    const uploaded = activeFields.filter(f => 
      uploads.some(u => u.field_id === f.id && u.status === "uploaded")
    ).length;

    return {
      uploaded,
      total,
      pct: Math.round((uploaded / total) * 100)
    };
  }, [docFields]);

  const brandOpts = { logoUrl, collegeName: settings.college_name };

  const withExport = async (key, label, fn) => {
    setExporting(key);
    try {
      const result = await fetchOJTReport({ ...filters, page: 1, limit: 1000, fullDataset: true });
      const exportRes = await fn(result);
      if (exportRes?.success) addToast({ title: "Exported", description: `OJT report saved as ${label}` });
      else addToast({ title: "Export failed", description: "Could not export", variant: "destructive" });
    } catch (err) {
      addToast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  if (loading) return <ReportSkeleton />;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

  const exportData = (fullData) => (fullData?.traineeStatus ?? []).map((i) => {
    const ojt = getCategoryProgress(i.uploads, "ojt");
    const hte = getCategoryProgress(i.uploads, "hte");
    return {
      "Student Name": i.studentName, 
      "Student ID": i.studentId,
      "Program": i.program, 
      "Section": i.section,
      "Academic Year": i.academicYear,
      "Assigned Coordinator": i.coordinator,
      "OJT Docs": `${ojt.uploaded}/${ojt.total} (${ojt.pct}%)`,
      "HTE Docs": `${hte.uploaded}/${hte.total} (${hte.pct}%)`,
      "Overall Status": i.overallStatus
    };
  });

  const STAT_CARDS = [
    { label: "Total Trainees", value: stats.total, sub: "enrolled trainees", border: "border-green-200", bg: "bg-green-50", val: "text-green-800", dot: "bg-green-500" },
    { label: "Completed", value: stats.complete, sub: "met requirements", border: "border-green-200", bg: "bg-green-50", val: "text-green-700", dot: "bg-green-400" },
    { label: "Incomplete", value: stats.incomplete, sub: "still pending", border: "border-red-200", bg: "bg-red-50", val: "text-red-700", dot: "bg-red-400" },
    { label: "Completion Rate", value: `${stats.rate}%`, sub: "overall completion", border: "border-blue-200", bg: "bg-blue-50", val: "text-blue-700", dot: "bg-blue-400" },
  ];

  const ProgressRenderer = ({ uploads, category, colorClass }) => {
    const { uploaded, total, pct } = getCategoryProgress(uploads, category);
    return (
      <div className="flex flex-col justify-center h-full space-y-1">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="text-sm font-semibold text-gray-900">{uploaded}/{total}</span>
          <span className="text-[10px] text-gray-500 font-medium">({pct}%)</span>
        </div>
        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-green-500" : (pct >= 50 ? colorClass : "bg-red-400")}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* KPI stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className={`rounded-2xl border ${s.border} ${s.bg} p-6 shadow-sm hover:shadow-md transition-all duration-200`}>
            <div className="flex items-center gap-2 mb-4">
              <span className={`size-2 rounded-full ${s.dot}`} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{s.label}</span>
            </div>
            <p className={`text-5xl font-bold tracking-tight leading-none mb-2 ${s.val}`}>{s.value}</p>
            <p className="text-xs font-medium text-gray-500">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Trainee Table */}
      <Panel>
        <div className="flex items-center justify-between mb-7 gap-4 flex-wrap">
          <div className="flex items-center gap-3.5">
            <div className="h-7 w-[3px] rounded-full bg-gradient-to-b from-green-600 to-green-700" />
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Trainee Completion Status</h3>
            <span className="font-mono text-xs text-gray-500 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full">
              {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, data?.totalCount ?? 0)} of {data?.totalCount ?? 0}
            </span>
          </div>
          <ExportToolbar
            exporting={exporting}
            onExcel={() => withExport("excel", "Excel", (fullData) => exportToExcel(exportData(fullData), `${generateFilename("OJT")}.xlsx`, "OJT Reports"))}
            onCSV={() => withExport("csv", "CSV", (fullData) => exportToCSV(exportData(fullData), `${generateFilename("OJT")}.csv`))}
            onPDF={() => withExport("pdf", "PDF", (fullData) => {
              const rows = (fullData?.traineeStatus ?? []).map((i) => {
                const ojt = getCategoryProgress(i.uploads, "ojt");
                const hte = getCategoryProgress(i.uploads, "hte");
                return [
                  i.studentName, i.studentId, i.program, i.section, i.academicYear, i.coordinator, 
                  `${ojt.uploaded}/${ojt.total}`, `${hte.uploaded}/${hte.total}`, i.overallStatus
                ];
              });
              return exportToPDF({ 
                title: "HTE / OJT Reports", 
                subtitle: "Trainee Completion Status", 
                filters, 
                timestamp: new Date().toLocaleString(), 
                columns: ["Student Name", "Student ID", "Prog.", "Sec.", "Year", "Coordinator", "OJT Docs", "HTE Docs", "Status"], 
                data: rows 
              }, `${generateFilename("OJT")}.pdf`);
            })}
          />
        </div>
        <div className="w-full h-[400px]">
          <AgGridReact
            theme={customTheme}
            rowData={paginated}
            columnDefs={[
              { field: "studentName", headerName: "Student Name", flex: 1.5, sortable: true, filter: true },
              { field: "studentId", headerName: "Student ID", width: 130, sortable: true, filter: true, cellClass: "font-mono tabular-nums text-xs" },
              { field: "program", headerName: "Program", width: 140, sortable: true, filter: true },
              { field: "section", headerName: "Section", width: 90, sortable: true, filter: true },
              { field: "academicYear", headerName: "Year", width: 120, sortable: true, filter: true },
              { field: "coordinator", headerName: "Coordinator", flex: 1.2, sortable: true, filter: true },
              {
                headerName: "OJT Docs",
                width: 140,
                cellRenderer: (params) => <ProgressRenderer uploads={params.data.uploads} category="ojt" colorClass="bg-green-600" />
              },
              {
                headerName: "HTE Docs",
                width: 140,
                cellRenderer: (params) => <ProgressRenderer uploads={params.data.uploads} category="hte" colorClass="bg-yellow-500" />
              },
              {
                field: "overallStatus",
                headerName: "Status",
                width: 110,
                cellRenderer: (params) => (
                  <Badge className={`text-[10px] font-bold border rounded-lg px-2 py-0.5 ${params.value === "Complete" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                    {params.value}
                  </Badge>
                )
              }
            ]}
            pagination={false}
            domLayout="normal"
          />
        </div>
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
  const [dbCategories, setDbCategories] = useState([]);
  const [dbCoordinators, setDbCoordinators] = useState([]);
  const [dbAcademicYears, setDbAcademicYears] = useState([]);
  const [dbSections, setDbSections] = useState([]);
  const [dbThesisYears, setDbThesisYears] = useState([]);
  const [dateBounds, setDateBounds] = useState({ min: "", max: "" });

  useEffect(() => {
    let active = true;

    async function loadDateBounds() {
      try {
        const { data } = await supabase
          .from("similarity_scan_queue")
          .select("submitted_at")
          .not("submitted_at", "is", null)
          .order("submitted_at", { ascending: true })
          .limit(1);

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const maxDate = `${year}-${month}-${day}`;

        let minDate = maxDate;
        if (active && data && data.length > 0) {
          const earliestYear = new Date(data[0].submitted_at).getFullYear();
          minDate = `${earliestYear}-01-01`;
        }
        
        if (active) {
          setDateBounds({ min: minDate, max: maxDate });
        }
      } catch (err) {
        console.error("Failed to load date bounds:", err);
      }
    }
    loadDateBounds();

    thesisService.getCategories().then(data => {
      if (active && data) setDbCategories(data.map(c => c.name));
    }).catch(err => console.error("Failed to fetch DB categories:", err));

    fetchCoordinators().then(data => {
      if (active && data) setDbCoordinators(data);
    }).catch(err => console.error("Failed to fetch coordinators:", err));

    thesisService.getAcademicYears().then(data => {
      if (active && data) setDbAcademicYears(data.map(ay => ay.name));
    }).catch(err => console.error("Failed to fetch academic years:", err));

    thesisService.getSections().then(data => {
      if (active && data) {
        const uniqueSections = [...new Set(data.map(s => s.name))].sort();
        setDbSections(uniqueSections);
      }
    }).catch(err => console.error("Failed to fetch sections:", err));

    thesisService.getPublicationYears().then(data => {
      if (active && data) setDbThesisYears(data);
    }).catch(err => console.error("Failed to fetch publication years:", err));

    return () => { active = false; };
  }, []);

  const handleFilterChange = useCallback((f) => setFilters(f), []);
  const hasActive = Object.values(filters).some((v) => v && v !== "All");
  const clearAll = useCallback(() => {
    setFilters(defaultFilters());
    REPORT_TYPES.forEach((t) => sessionStorage.removeItem(`reportFilters_${t.value}`));
  }, []);

  return (
    <ProtectedReportsRoute>
      <ReportsToastProvider>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <ThesisArchivingHeader title="Reports & Analytics" variant="light" />

          <main className="flex-1 px-8 py-10 lg:px-12 lg:py-12">
            <div className="max-w-7xl mx-auto space-y-6">

              {/* ── PAGE HEADER ── */}
              <div className="flex items-end justify-between gap-6 pb-5 border-b border-gray-200">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Analytics Dashboard</p>
                  <h1 className="text-4xl font-bold text-gray-900 tracking-tight leading-none">Reports</h1>
                </div>

                <div className="flex items-center gap-3 pb-1">
                  {hasActive && (
                    <button onClick={clearAll} className="text-xs text-gray-500 hover:text-rose-500 transition-colors font-medium">
                      Clear filters
                    </button>
                  )}
                  <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2.5 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="relative flex size-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-40" />
                        <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                      </span>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500 leading-none mb-0.5">Live</p>
                        <p className="font-mono text-sm font-semibold text-green-700 leading-none">{lastRefresh.toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <div className="h-5 w-px bg-gray-200 mx-0.5" />
                    <Button size="sm" onClick={() => setLastRefresh(new Date())}
                      className="h-8 px-4 text-xs font-bold bg-green-700 hover:bg-green-800 text-white border-0 shadow-sm transition-all duration-200"
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
                      onClick={() => {
                        setReportType(t.value);
                        setFilters(defaultFilters());
                      }}
                      className={`relative flex-1 flex flex-col items-center justify-center gap-1.5 rounded-2xl border py-6 px-4 transition-all duration-200 outline-none cursor-pointer select-none overflow-hidden ${active
                        ? "border-green-300 bg-gradient-to-b from-green-50 to-white shadow-md shadow-green-100"
                        : "border-gray-200 bg-white hover:border-green-200 hover:bg-green-50/40 hover:shadow-sm"
                        }`}
                    >
                      {/* Full-width top accent bar */}
                      <div
                        className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${a.gradFrom} ${a.gradTo} transition-opacity duration-200 ${active ? "opacity-100" : "opacity-0"}`}
                      />
                      {/* Decorative background circle */}
                      {active && (
                        <div className="absolute -bottom-5 -right-5 w-20 h-20 rounded-full bg-green-100/50 pointer-events-none" />
                      )}
                      <span className={`relative text-base font-bold leading-tight transition-colors ${active ? "text-green-800" : "text-gray-500"}`}>
                        {t.label}
                      </span>
                      <span className={`relative text-xs font-medium transition-colors ${active ? "text-green-600" : "text-gray-400"}`}>
                        {t.description}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active filter indicator */}
              {hasActive && (
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Filtered:</span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-semibold text-green-700">
                    <span className="size-1.5 rounded-full bg-green-500" />
                    {getFilterSummary(filters)}
                  </span>
                </div>
              )}

              {/* ── FILTERS ── */}
              <ReportsFilters
                key={reportType}
                onFilterChange={handleFilterChange}
                showOJTFilters={reportType === "ojt"}
                reportType={reportType}
                categories={dbCategories}
                coordinators={dbCoordinators}
                academicYears={dbAcademicYears}
                sections={dbSections}
                thesisYears={dbThesisYears}
                dateBounds={dateBounds}
              />

              {/* ── REPORT CONTENT ── */}
              {reportType === "thesis" && <ReportsThesis filters={filters} />}
              {reportType === "similarity" && <ReportsSimilarity filters={filters} categories={dbCategories} />}
              {reportType === "ojt" && <ReportsOJT filters={filters} />}

            </div>
          </main>
        </div>
      </ReportsToastProvider>
    </ProtectedReportsRoute>
  );
}