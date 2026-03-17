import React, { useState, useMemo, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);
import {
  Search, Download, Archive, FileText, RefreshCw, AlertCircle,
  ExternalLink, FileArchive, CheckSquare, Clock, Filter, HardDrive, File,
  Database, History, Settings, X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ToastProvider, useToast } from "@/components/ui/toast/toaster";

// Import our new Hook
import { useAdminArchive } from '../hooks/AdminArchiveHook';
import { archiveService } from '../services/AdminArchiveService';

// Custom theme using AG Grid v33+ Theming API with Quartz theme for a modern institutional look
const customTheme = themeQuartz.withParams({
  accentColor: 'var(--primary-600)',
  backgroundColor: '#ffffff',
  foregroundColor: 'var(--neutral-900)',
  borderColor: 'var(--neutral-200)',
  headerBackgroundColor: 'var(--neutral-50)',
  headerTextColor: 'var(--neutral-500)',
  oddRowBackgroundColor: '#ffffff',
  rowHoverColor: 'var(--neutral-50)',
  selectedRowBackgroundColor: 'color-mix(in srgb, var(--primary-500) 10%, transparent)',
  rowHeight: 48,
  headerHeight: 40,
  headerFontWeight: '700',
  fontSize: '13px',
});

export default function AdminArchivePage() {
  const {
    loading,
    error,
    success,
    documents,
    recentDownloads,
    stats,
    filters,
    options,
    filteredOptions,
    setFilteredOptions,
    updateFilter,
    clearFilters,
    handleDownload,
    refresh,
    reExportArchive
  } = useAdminArchive();

  const { addToast } = useToast();

  // State for Bulk Operations (UI Only)
  const [bulkConfig, setBulkConfig] = useState({
    semester: 'All Semesters',
    academic_year: 'All Years',
    faculty: 'All Faculty',
    course: 'All Courses',
    section: 'All Sections',
    doc_type: 'All Document Types'
  });

  // Dynamically filter which semesters apply to the selected academic year
  const filteredSemesters = useMemo(() => {
    if (!options?.semesterPeriods) return options?.semesters || [];
    if (bulkConfig.academic_year === 'All Years') {
      return [...new Set(options.semesterPeriods.map(p => p.semester))].filter(Boolean);
    }
    return [...new Set(
      options.semesterPeriods
        .filter(p => p.academic_year === bulkConfig.academic_year)
        .map(p => p.semester)
    )].filter(Boolean);
  }, [options, bulkConfig.academic_year]);

  const [downloading, setDownloading] = useState(false);

  const handleBulkExport = async () => {
    setDownloading(true);
    try {
      const result = await archiveService.downloadArchiveZip(bulkConfig);
      if (result.success) {
        addToast({
          title: "Export Successful",
          description: result.message,
          variant: "success",
        });
      } else {
        addToast({
          title: "Export Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      addToast({
        title: "Download Failed",
        description: err.message || "An unexpected error occurred during zip export.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const hasActiveFilters = filters.search_query !== '' || filters.academic_year !== 'All Years' || filters.semester !== 'All Semesters' || filters.doc_type !== 'All Document Types';

  // Grid Columns Configuration
  const colDefs = useMemo(() => [
    {
      field: "original_filename",
      headerName: "File Name",
      flex: 2,
      filter: true,
      cellClass: "font-semibold text-neutral-900"
    },
    {
      field: "faculty_name",
      headerName: "Faculty",
      width: 140,
      cellClass: "text-neutral-500 font-medium"
    },
    {
      field: "course_code",
      headerName: "Course",
      width: 110,
      cellClass: "font-mono text-neutral-500 font-medium tracking-wide text-[11px]"
    },
    {
      field: "document_type",
      headerName: "Type",
      width: 140,
      cellRenderer: (p) => (
        <span className="font-bold text-[10px] px-2 py-0.5 rounded-full border bg-neutral-50 text-neutral-600 border-neutral-200 uppercase tracking-widest">
          {p.value}
        </span>
      )
    },
    {
      field: "archive_date",
      headerName: "Archived On",
      width: 120,
      cellRenderer: (p) => (
        <span className="font-bold text-[11px] px-2 py-0.5 rounded-full border bg-neutral-50 text-neutral-500 border-neutral-200">
          {p.value || '-'}
        </span>
      )
    },
    {
      headerName: "Actions",
      width: 100,
      cellRenderer: (params) => (
        <div className="flex gap-1.5 items-center h-full">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            onClick={() => handleDownload(params.data)}
            title="Download"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          {params.data.gdrive_web_view_link && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
              onClick={() => window.open(params.data.gdrive_web_view_link, '_blank')}
              title="View in Drive"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )
    }
  ], [handleDownload]);

  const CheckboxItem = ({ label, checked, onChange }) => (
    <div
      className={`flex items-center space-x-3 border rounded-lg p-2.5 cursor-pointer transition-all ${checked ? 'bg-primary-50/50 border-primary-200' : 'bg-white border-neutral-200 hover:border-neutral-300'}`}
      onClick={onChange}
    >
      <Checkbox
        id={label}
        checked={checked}
        onCheckedChange={onChange}
        className="border-neutral-300 data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600 h-4 w-4 rounded pointer-events-none"
      />
      <label
        htmlFor={label}
        className={`text-xs font-bold cursor-pointer select-none ${checked ? 'text-primary-900' : 'text-neutral-700'}`}
      >
        {label}
      </label>
    </div>
  );

  return (
    <div className="space-y-6 flex flex-col h-full bg-neutral-50/30">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Document Archive</h1>
          <p className="text-neutral-500 text-sm font-medium">Centralized institutional repository for all validated documents</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={loading}
          className="bg-primary-500 border-primary-500 text-neutral-50 hover:bg-primary-600 hover:text-neutral-50 shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Archive
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

        {/* LEFT COLUMN (Span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">

          {/* 1. Global Filter Widget */}
          <Card className="bg-white border-neutral-200 shadow-sm shrink-0 overflow-hidden">
            <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-3.5 px-4">
              <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary-600" />
                Filter Archive
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 bg-white">
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex flex-col lg:flex-row flex-wrap gap-3 items-start lg:items-end shadow-sm">

                <div className="flex-[2] space-y-1 w-full min-w-[200px]">
                  <Label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-0.5">Search Documents</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
                    <Input
                      placeholder="Find by filename, faculty, or course..."
                      className="pl-8 bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs focus-visible:ring-primary-500 font-medium"
                      value={filters.search_query}
                      onChange={(e) => updateFilter('search_query', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-1 space-y-1 w-full min-w-[130px]">
                  <Label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-0.5">Academic Year</Label>
                  <Select value={filters.academic_year} onValueChange={(v) => updateFilter('academic_year', v)}>
                    <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs focus:ring-primary-500/20 font-medium">
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-neutral-200">
                      <SelectItem value="All Years" className="text-xs font-medium">All Years</SelectItem>
                      {options.years?.map(y => <SelectItem key={y} value={y} className="text-xs font-medium">{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 space-y-1 w-full min-w-[130px]">
                  <Label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-0.5">Semester</Label>
                  <Select value={filters.semester} onValueChange={(v) => updateFilter('semester', v)}>
                    <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs focus:ring-primary-500/20 font-medium">
                      <SelectValue placeholder="All Semesters" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-neutral-200">
                      <SelectItem value="All Semesters" className="text-xs font-medium">All Semesters</SelectItem>
                      {options.semesters?.map(s => <SelectItem key={s} value={s} className="text-xs font-medium">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 space-y-1 w-full min-w-[130px]">
                  <Label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-0.5">Document Type</Label>
                  <Select value={filters.doc_type} onValueChange={(v) => updateFilter('doc_type', v)}>
                    <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs focus:ring-primary-500/20 font-medium">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-neutral-200">
                      <SelectItem value="All Document Types" className="text-xs font-medium">All Types</SelectItem>
                      {options.types?.map(t => <SelectItem key={t} value={t} className="text-xs font-medium">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-9 px-3 bg-destructive-semantic text-white hover:text-neutral-100 hover:bg-destructive-semantic/80 font-bold text-xs shadow-sm transition-all shrink-0"
                  >
                    <X className="h-4 w-4 mr-1" /> Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 2. Documents Grid Card */}
          <Card className="bg-white border-neutral-200 shadow-sm flex-1 flex flex-col min-h-[400px] overflow-hidden">
            <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-3.5 px-4 shrink-0 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Database className="h-4 w-4 text-primary-600" />
                Repository Index
              </CardTitle>
              <Badge className="bg-primary-50 text-primary-600 border-primary-100 text-[10px] font-black px-2 py-0 ml-1 shadow-none">
                {documents.length} Files
              </Badge>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative flex flex-col bg-white">
              {error && (
                <div className="p-4 shrink-0">
                  <Alert variant="destructive" className="border-destructive/30 bg-destructive/5 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="font-bold">{error}</AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="absolute inset-0">
                <AgGridReact
                  theme={customTheme}
                  rowData={documents}
                  columnDefs={colDefs}
                  pagination={true}
                  paginationPageSize={20}
                  loading={loading}
                  suppressCellFocus={true}
                  overlayNoRowsTemplate='<div class="text-[10px] font-black uppercase tracking-widest text-neutral-400 p-8 text-center">No documents found.</div>'
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN (Span 1) */}
        <div className="flex flex-col gap-6">

          {/* 4. Bulk Archive Operations */}
          <Card className="bg-white border-neutral-200 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-3.5 px-4">
              <CardTitle className="text-base text-neutral-900 flex items-center gap-2 font-bold tracking-tight">
                <FileArchive className="h-4 w-4 text-primary-600" />
                Bulk Export
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5 bg-white">
              <div className="space-y-4">
                <div className="space-y-1.5 flex-1 min-w-[130px]">
                  <Label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-0.5">Academic Year</Label>
                  <Select
                    value={bulkConfig.academic_year}
                    onValueChange={(v) => {
                      setBulkConfig({ ...bulkConfig, academic_year: v, semester: 'All Semesters' });
                    }}
                  >
                    <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs focus:ring-primary-500/20 font-medium">
                      <SelectValue placeholder="All Academic Years" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-neutral-200">
                      <SelectItem value="All Years" className="text-xs font-medium font-bold text-primary-600">All Academic Years</SelectItem>
                      {options?.years?.map(year => (
                        <SelectItem key={year} value={year} className="text-xs font-medium">
                          {year}
                          {options?.currentAcademicYear === year && (
                            <span className="ml-1.5 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20"> Active</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 flex-1 min-w-[130px]">
                  <Label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-0.5">Semester</Label>
                  <Select
                    value={bulkConfig.semester}
                    onValueChange={(v) => setBulkConfig({ ...bulkConfig, semester: v })}
                  >
                    <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs focus:ring-primary-500/20 font-medium">
                      <SelectValue placeholder="All Semesters" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-neutral-200">
                      <SelectItem value="All Semesters" className="text-xs font-medium font-bold text-primary-600">All Semesters</SelectItem>
                      {filteredSemesters.map(sem => {
                        // Find the status of this semester within the selected year
                        const period = options?.semesterPeriods?.find(
                          p => p.semester === sem && (bulkConfig.academic_year === 'All Years' || p.academic_year === bulkConfig.academic_year)
                        );
                        const isActive = period?.status === 'Active';
                        return (
                          <SelectItem key={sem} value={sem} className="text-xs font-medium">
                            {sem}
                            {isActive && (
                              <span className="ml-1.5 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20"> Active</span>
                            )}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 flex-1 min-w-[130px]">
                  <Label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-0.5">Faculty Member</Label>
                  <Select
                    value={bulkConfig.faculty}
                    onValueChange={(v) => {
                      setBulkConfig({ ...bulkConfig, faculty: v, course: 'All Courses', section: 'All Sections' });

                      if (v === 'All Faculty') {
                        setFilteredOptions({
                          courses: [...new Set(options.rawCourses?.map(c => c.course_code))].filter(Boolean),
                          sections: [...new Set(options.rawCourses?.map(c => c.section))].filter(Boolean)
                        });
                      } else {
                        const profCourses = options.rawCourses?.filter(c => c.faculty_id === v) || [];
                        setFilteredOptions({
                          courses: [...new Set(profCourses.map(c => c.course_code))].filter(Boolean),
                          sections: [...new Set(profCourses.map(c => c.section))].filter(Boolean)
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs focus:ring-primary-500/20 font-medium">
                      <SelectValue placeholder="All Faculty" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-neutral-200">
                      <SelectItem value="All Faculty" className="text-xs font-medium font-bold text-primary-600">All Faculty</SelectItem>
                      {options?.faculties?.map(f => <SelectItem key={f.id} value={f.id} className="text-xs font-medium">{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 flex-1 min-w-[130px]">
                  <Label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-0.5">Document Type</Label>
                  <Select value={bulkConfig.doc_type} onValueChange={(v) => setBulkConfig({ ...bulkConfig, doc_type: v })}>
                    <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs focus:ring-primary-500/20 font-medium">
                      <SelectValue placeholder="All Document Types" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-neutral-200">
                      <SelectItem value="All Document Types" className="text-xs font-medium font-bold text-primary-600">All Document Types</SelectItem>
                      {options.types?.map(t => <SelectItem key={t} value={t} className="text-xs font-medium">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 flex-1 min-w-[130px]">
                    <Label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-0.5">Course</Label>
                    <Select value={bulkConfig.course} onValueChange={(v) => setBulkConfig({ ...bulkConfig, course: v })}>
                      <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs focus:ring-primary-500/20 font-medium">
                        <SelectValue placeholder="All Courses" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-neutral-200">
                        <SelectItem value="All Courses" className="text-xs font-medium font-bold text-primary-600">All Courses</SelectItem>
                        {filteredOptions?.courses?.map(c => <SelectItem key={c} value={c} className="text-xs font-medium">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-[130px]">
                    <Label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-0.5">Section</Label>
                    <Select value={bulkConfig.section} onValueChange={(v) => setBulkConfig({ ...bulkConfig, section: v })}>
                      <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs focus:ring-primary-500/20 font-medium">
                        <SelectValue placeholder="All Sections" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-neutral-200">
                        <SelectItem value="All Sections" className="text-xs font-medium font-bold text-primary-600">All Sections</SelectItem>
                        {filteredOptions?.sections?.map(s => <SelectItem key={s} value={s} className="text-xs font-medium">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white shadow-sm transition-all font-bold h-10 active:scale-95"
                  onClick={handleBulkExport}
                  disabled={downloading}
                >
                  {downloading ? (
                    <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Processing Archive...</>
                  ) : (
                    <><Download className="mr-2 h-4 w-4" /> Download Archive ZIP</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 5. Recent Downloads List */}
          <Card className="bg-white border-neutral-200 shadow-sm flex-1 overflow-hidden">
            <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-3.5 px-4">
              <CardTitle className="text-base text-neutral-900 font-bold tracking-tight flex items-center gap-2">
                <History className="h-4 w-4 text-primary-600" />
                Download History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 bg-white">
              <div className="divide-y divide-neutral-100">
                {recentDownloads && recentDownloads.length > 0 ? (
                  recentDownloads.map((item) => (
                    <RecentExportItem
                      key={item.history_id}
                      name={item.report_name}
                      date={new Date(item.generated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      type={item.report_type}
                      onDownload={() => reExportArchive(item)}
                      loading={downloading}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center flex flex-col items-center justify-center">
                    <Clock className="h-6 w-6 text-neutral-300 mb-2" />
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">No recent downloads found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// --- Sub-Components ---

const CheckboxItem = ({ label, checked, onChange }) => (
  <div
    className={`flex items-center space-x-3 border rounded-lg p-2.5 cursor-pointer transition-all ${checked ? 'bg-primary-50/50 border-primary-200' : 'bg-white border-neutral-200 hover:border-neutral-300'}`}
    onClick={onChange}
  >
    <Checkbox
      id={label}
      checked={checked}
      onCheckedChange={onChange}
      className="border-neutral-300 data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600 h-4 w-4 rounded pointer-events-none"
    />
    <label
      htmlFor={label}
      className={`text-xs font-bold cursor-pointer select-none ${checked ? 'text-primary-900' : 'text-neutral-700'}`}
    >
      {label}
    </label>
  </div>
);

const RecentExportItem = ({ name, date, type, onDownload, loading }) => (
  <div className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors group cursor-pointer" onClick={onDownload}>
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-md bg-white border border-neutral-200 shadow-sm ${type === 'PDF' ? 'text-rose-500' : 'text-emerald-500'}`}>
        <FileArchive className="h-4 w-4" />
      </div>
      <div>
        <p className="font-bold text-sm text-neutral-900 truncate max-w-[180px] leading-tight">{name}</p>
        <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">{date} • {type === 'ZIP_ARCHIVE_EXPORT' ? 'ZIP Archive' : type}</p>
      </div>
    </div>
    <Button
      variant="ghost"
      size="icon"
      disabled={loading}
      className="h-7 w-7 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
      onClick={(e) => {
        e.stopPropagation();
        onDownload();
      }}
    >
      <Download className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
    </Button>
  </div>
);