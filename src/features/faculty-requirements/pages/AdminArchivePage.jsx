import React, { useState, useMemo, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);
import {
  Search, Download, Archive, FileText, RefreshCw, AlertCircle,
  ExternalLink, FileArchive, CheckSquare, Clock, Filter, HardDrive, File
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

// Import our new Hook
import { useAdminArchive } from '../hooks/AdminArchiveHook';

// Custom theme using AG Grid v33+ Theming API
const customTheme = themeQuartz.withParams({
  accentColor: '#3b82f6',
  backgroundColor: '#0f172a',
  foregroundColor: '#e2e8f0',
  borderColor: '#1e293b',
  headerBackgroundColor: '#1e293b',
  headerTextColor: '#94a3b8',
  oddRowBackgroundColor: '#0f172a',
  rowHoverColor: '#1e293b',
  inputFocusBorderColor: '#3b82f6',
});

export default function AdminArchivePage() {
  const {
    loading,
    error,
    success,
    documents,
    stats,
    filters,
    options,
    updateFilter,
    clearFilters,
    handleDownload,
    refresh
  } = useAdminArchive();

  // State for Bulk Operations (UI Only)
  const [bulkConfig, setBulkConfig] = useState({
    semester: 'Semester 2, AY 2023-2024',
    department: 'All Departments',
    include_syllabi: true,
    include_grades: true,
    include_presentations: false,
    include_exams: false
  });


  // Grid Columns Configuration
  const colDefs = useMemo(() => [
    {
      field: "archived_filename",
      headerName: "File Name",
      flex: 2,
      filter: true,
      cellRenderer: (params) => (
        <div className="flex items-center">
          <div className="p-1.5 bg-slate-800 rounded mr-3 text-blue-400">
            <FileText className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <span className="block truncate text-slate-200 font-medium text-xs" title={params.value}>{params.value}</span>
          </div>
        </div>
      )
    },
    {
      field: "faculty_name",
      headerName: "Faculty",
      width: 140,
      cellClass: "text-slate-400 text-xs"
    },
    {
      field: "course_code",
      headerName: "Course",
      width: 100,
      cellRenderer: (p) => (
        <span className="font-mono text-xs bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-400">
          {p.value}
        </span>
      )
    },
    {
      field: "document_type",
      headerName: "Type",
      width: 130,
      cellRenderer: (params) => (
        <Badge variant="outline" className="border-slate-700 text-slate-400 font-normal text-[10px]">
          {params.value}
        </Badge>
      )
    },
    {
      field: "archive_date",
      headerName: "Date",
      width: 100,
      cellRenderer: (params) => (
        <span className="text-slate-500 text-xs font-mono">
          {params.value?.split(' ')[0] || '-'}
        </span>
      )
    },
    {
      headerName: "Actions",
      width: 90,
      cellRenderer: (params) => (
        <div className="flex gap-1 items-center h-full">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-400 hover:text-blue-400 hover:bg-slate-800"
            onClick={() => handleDownload(params.data)}
            title="Download"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          {params.data.gdrive_web_view_link && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
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

  // Helper for Stats Display
  const formatStorage = (bytes) => {
    if (!bytes) return '0 B';
    const gb = bytes / (1024 * 1024 * 1024);
    return gb >= 1 ? `${gb.toFixed(2)} GB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Document Archive</h1>
          <p className="text-slate-400 text-sm">Centralized repository for all submitted documents</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={loading}
          className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Archive
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

        {/* LEFT COLUMN (Span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">

          {/* 1. Search Documents Card */}
          <Card className="bg-slate-900 border-slate-800 shadow-none flex-1 flex flex-col min-h-[500px]">
            <CardHeader className="flex flex-col gap-4 border-b border-slate-800 py-4 shrink-0 bg-slate-950/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-600/20 p-1.5 rounded text-emerald-400">
                    <Archive className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-base text-slate-100">Archive Explorer</CardTitle>
                </div>
                {filters.search_query && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearFilters}
                    className="h-7 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Search by filename, faculty, or course code..."
                    className="pl-9 bg-slate-950 border-slate-700 text-slate-200 placeholder:text-slate-500 focus-visible:ring-blue-500"
                    value={filters.search_query}
                    onChange={(e) => updateFilter('search_query', e.target.value)}
                  />
                </div>

                {/* Compact Filter Group */}
                <div className="flex gap-2">
                  <Select value={filters.department} onValueChange={(v) => updateFilter('department', v)}>
                    <SelectTrigger className="w-[140px] bg-slate-950 border-slate-700 text-slate-200 text-xs">
                      <SelectValue placeholder="Dept" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                      <SelectItem value="All Departments">All Depts</SelectItem>
                      {options.departments?.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={filters.doc_type} onValueChange={(v) => updateFilter('doc_type', v)}>
                    <SelectTrigger className="w-[140px] bg-slate-950 border-slate-700 text-slate-200 text-xs">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                      <SelectItem value="All Document Types">All Types</SelectItem>
                      {options.types?.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 relative flex flex-col">
              {error && (
                <div className="p-4 shrink-0">
                  <Alert variant="destructive" className="border-red-900/50 bg-red-900/10 text-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Grid */}
              <div className="absolute inset-0">
                <AgGridReact
                  theme={customTheme}
                  rowData={documents}
                  columnDefs={colDefs}
                  pagination={true}
                  paginationPageSize={20}
                  loading={loading}
                  suppressCellFocus={true}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN (Span 1) */}
        <div className="flex flex-col gap-6">

          {/* 2. Stats Card */}
          <Card className="bg-slate-900 border-slate-800 shadow-none">
            <CardHeader className="border-b border-slate-800 py-3">
              <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-slate-400" />
                Storage Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-2xl font-bold text-slate-100">{formatStorage(stats.storage_used_bytes)}</p>
                    <p className="text-xs text-slate-500">Used of 15 GB Quota</p>
                  </div>
                  <span className={`text-sm font-bold ${stats.storage_percentage > 80 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {stats.storage_percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${stats.storage_percentage > 80 ? 'bg-rose-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(stats.storage_percentage, 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <div className="bg-slate-950/50 p-2 rounded border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Total Files</p>
                  <p className="text-lg font-mono text-slate-200">{stats.total_documents.toLocaleString()}</p>
                </div>
                <div className="bg-slate-950/50 p-2 rounded border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">This Sem</p>
                  <p className="text-lg font-mono text-slate-200">{documents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Bulk Archive Operations */}
          <Card className="bg-slate-900 border-slate-800 shadow-none">
            <CardHeader className="border-b border-slate-800 py-3">
              <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                <FileArchive className="h-4 w-4 text-slate-400" />
                Bulk Export
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400 uppercase">Target Semester</Label>
                  <Select
                    value={bulkConfig.semester}
                    onValueChange={(v) => setBulkConfig({ ...bulkConfig, semester: v })}
                  >
                    <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-200 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                      <SelectItem value="Semester 2, AY 2023-2024">Current Semester</SelectItem>
                      <SelectItem value="Semester 1, AY 2023-2024">Previous Semester</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-slate-950/30 p-3 rounded border border-slate-800">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Include</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <CheckboxItem
                      label="Syllabi"
                      checked={bulkConfig.include_syllabi}
                      onChange={(c) => setBulkConfig({ ...bulkConfig, include_syllabi: c })}
                    />
                    <CheckboxItem
                      label="Grades"
                      checked={bulkConfig.include_grades}
                      onChange={(c) => setBulkConfig({ ...bulkConfig, include_grades: c })}
                    />
                    <CheckboxItem
                      label="Exams"
                      checked={bulkConfig.include_exams}
                      onChange={(c) => setBulkConfig({ ...bulkConfig, include_exams: c })}
                    />
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20"
                onClick={() => alert("Exporting archive...")}
              >
                <Download className="mr-2 h-4 w-4" /> Download .ZIP Archive
              </Button>
            </CardContent>
          </Card>

          {/* 4. Recent Downloads List */}
          <Card className="bg-slate-900 border-slate-800 shadow-none flex-1">
            <CardHeader className="border-b border-slate-800 py-3">
              <CardTitle className="text-base text-slate-100">Download History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-800/50">
                <RecentDownloadItem name="CS Dept Archive" meta="Today • 240 MB" />
                <RecentDownloadItem name="Syllabus Collection" meta="Yesterday • 180 MB" />
                <RecentDownloadItem name="IT Faculty Docs" meta="June 1 • 95 MB" />
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
  <div className="flex items-center space-x-2">
    <Checkbox
      id={label}
      checked={checked}
      onCheckedChange={onChange}
      className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-3.5 w-3.5"
    />
    <label
      htmlFor={label}
      className="text-xs font-medium leading-none text-slate-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
    >
      {label}
    </label>
  </div>
);

const RecentDownloadItem = ({ name, meta }) => (
  <div className="flex items-center justify-between p-3 hover:bg-slate-800/30 transition-colors group">
    <div className="flex items-center gap-2.5">
      <div className="p-1.5 bg-slate-950 rounded text-slate-500 group-hover:text-blue-400 transition-colors">
        <File className="h-3.5 w-3.5" />
      </div>
      <div>
        <p className="font-medium text-xs text-slate-200">{name}</p>
        <p className="text-[10px] text-slate-500">{meta}</p>
      </div>
    </div>
    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-600 hover:text-slate-300">
      <Download className="h-3 w-3" />
    </Button>
  </div>
);