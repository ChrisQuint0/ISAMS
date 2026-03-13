import React, { useState } from 'react';
import {
  PieChart, FileText, Download, Eye, BarChart3, RefreshCw,
  CheckCircle, Clock, FileBadge, AlertTriangle, File, ArrowRight,
  Filter, Calendar, History, Settings
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast/toaster";

// Components
import { DataTable } from "@/components/DataTable";
import { useAdminReports } from '../hooks/AdminReportHook';

const REPORT_COLUMNS_CONFIG = {
  'Submission Status Summary': ['include_faculty_names', 'include_course_info', 'include_submission_dates', 'include_status_indicators'],
  'Late Submission Analysis': ['include_faculty_names', 'include_course_info', 'include_submission_dates', 'include_status_indicators'],
  'Faculty Performance Leaderboard': ['include_faculty_names', 'include_status_indicators', 'include_performance_stats'],
  'Clearance Status Report': ['include_faculty_names', 'include_status_indicators', 'include_performance_stats']
};

export default function AdminReportsPage() {
  const { loading, error, reportData, settings, recentExports, options, generateReport, exportCSV, reExportReport } = useAdminReports();
  const { toast, addToast } = useToast();

  // Form State matching Rust 'ReportRequest' struct
  const [config, setConfig] = useState({
    reportType: 'Submission Status Summary',
    timePeriod: 'Current Semester',
    semester: '',
    academicYear: '',
    // Checkboxes
    include_faculty_names: true,
    include_course_info: true,
    include_submission_dates: true,
    include_validation_details: false,
    include_status_indicators: true,
    include_performance_stats: true,
  });

  // Update config defaults when settings load
  React.useEffect(() => {
    if (settings && settings.semester && settings.academic_year) {
      setConfig(prev => ({
        ...prev,
        semester: settings.semester,
        academicYear: settings.academic_year
      }));
    }
  }, [settings]);

  // Handle errors via Toast
  React.useEffect(() => {
    if (error) {
      // Assuming addToast or toast is available based on your provider
      if (addToast) {
        addToast({ title: "Report Error", description: error, variant: "destructive" });
      } else if (toast) {
        toast({ title: "Report Error", description: error, variant: "destructive" });
      }
    }
  }, [error, addToast, toast]);

  const handleCheckboxChange = (key) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerate = () => {
    generateReport(config);
  };

  // Auto-regenerate report on config change if already generated
  React.useEffect(() => {
    if (reportData && !loading) {
      generateReport(config);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.reportType, config.semester, config.academicYear]);

  // Filter Data based on Configuration
  const filteredData = React.useMemo(() => {
    if (!reportData || !reportData.data_preview) return null;

    return reportData.data_preview.map(row => {
      const newRow = {};

      if (config.include_faculty_names) {
        if (row.faculty_name) newRow['Faculty Name'] = row.faculty_name;
      }
      if (config.include_course_info) {
        if (row.original_filename) newRow['Filename'] = row.original_filename;
        const docType = row.document_type || row.type_name;
        if (docType) newRow['Document Type'] = docType;
      }
      if (config.include_submission_dates) {
        if (row.submitted_at) newRow['Submitted Date'] = new Date(row.submitted_at).toLocaleDateString('en-US');
        if (row.deadline_date) newRow['Deadline'] = new Date(row.deadline_date).toLocaleDateString('en-US');
      }
      if (config.include_validation_details) {
        if (row.validation_issues && row.validation_issues.length > 0) newRow['Validation Issues'] = row.validation_issues.join(', ');
        if (row.bot_issues) newRow['AI Analysis'] = row.bot_issues;
      }
      if (config.include_status_indicators) {
        if (row.submission_status) newRow['Status'] = row.submission_status;
        if (row.status) newRow['Clearance'] = row.status;
      }
      if (config.include_performance_stats) {
        if (row.items_submitted !== undefined) newRow['Items Submitted'] = row.items_submitted;
        if (row.completion) newRow['Progress'] = row.completion;
        if (row.progress_percentage) newRow['Progress'] = row.progress_percentage;
      }

      return newRow;
    });
  }, [reportData, config]);

  const calculatedSummary = React.useMemo(() => {
    if (!reportData || !reportData.data_preview) return null;

    if (config.reportType === 'Submission Status Summary') {
      const rows = reportData.data_preview;
      const counts = {
        'APPROVED': 0,
        'SUBMITTED': 0,
        'REVISION REQUESTED': 0,
        'TOTAL FACULTY': 0
      };

      const uniqueFaculty = new Set();

      rows.forEach(row => {
        const status = (row.submission_status || row.status || '').toUpperCase();
        if (status === 'APPROVED' || status === 'CLEARED') counts['APPROVED']++;
        else if (status === 'SUBMITTED') counts['SUBMITTED']++;
        else if (status === 'REVISION_REQUESTED' || status === 'REVISION REQUESTED') counts['REVISION REQUESTED']++;

        if (row.faculty_name) uniqueFaculty.add(row.faculty_name);
      });

      counts['TOTAL FACULTY'] = uniqueFaculty.size;
      return counts;
    }

    return reportData.summary;
  }, [reportData, config.reportType]);

  // Column Definitions for DataTable
  const columnDefs = React.useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    return Object.keys(filteredData[0]).map(key => {
      const baseCol = {
        field: key,
        headerName: key,
        flex: 1,
        minWidth: 150,
        filter: true,
        sortable: true,
        resizable: true,
        cellClass: "text-sm",
      };

      // --- Premium Renderers ---
      if (key === 'Faculty Name') {
        baseCol.cellRenderer = (p) => <span className="font-bold text-neutral-900">{p.value}</span>;
      }

      if (key === 'Status' || key === 'Clearance') {
        baseCol.cellRenderer = (p) => {
          if (!p.value) return null;
          const val = p.value.toUpperCase();
          let colorClass = "bg-neutral-100 text-neutral-600 border-neutral-200";

          if (val === 'APPROVED' || val === 'CLEARED' || val === 'ON TRACK' || val === 'ON TIME' || val === 'SUBMITTED') {
            colorClass = "bg-success/10 text-success border-success/20";
          } else if (val === 'AT RISK' || val === 'LATE' || val === 'REJECTED' || val === 'REVISION_REQUESTED') {
            colorClass = "bg-destructive/10 text-destructive border-destructive/20";
          } else if (val === 'DELAYED' || val === 'PENDING' || val === 'NO SUBMISSIONS' || val === 'FAILED') {
            colorClass = "bg-warning/10 text-warning border-warning/20";
          }

          // Format: Capitalize first letter of each word
          const displayValue = p.value.split('_').join(' ').toLowerCase().split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');

          return (
            <div className="flex items-center h-full">
              <Badge className={`font-bold text-xs px-2.5 py-0.5 rounded-full border shadow-none flex items-center gap-1.5 ${colorClass}`}>
                {displayValue}
              </Badge>
            </div>
          );
        };
      }

      if (key === 'Progress') {
        baseCol.cellRenderer = (p) => {
          const percentage = parseInt(p.value) || 0;
          return (
            <div className="flex items-center gap-2 h-full w-full pr-4">
              <div className="flex-1 bg-neutral-100 border border-neutral-200 rounded-full h-1.5 overflow-hidden shadow-inner">
                <div
                  className={`h-full transition-all duration-500 ease-out ${percentage >= 100 ? 'bg-success' : 'bg-primary-500'}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <span className="text-[10px] font-black text-neutral-600 w-8 text-right">{percentage}%</span>
            </div>
          );
        };
      }

      if (key === 'Document Type' || key === 'Filename') {
        baseCol.cellRenderer = (p) => <span className="text-xs text-neutral-600 font-bold truncate">{p.value}</span>;
      }

      if (key === 'Submitted Date' || key === 'Deadline') {
        baseCol.cellRenderer = (p) => <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-tight">{p.value}</span>;
      }

      return baseCol;
    });
  }, [filteredData]);

  const handleExport = () => {
    if (filteredData) {
      const exportPayload = {
        ...reportData,
        data_preview: filteredData
      };
      exportCSV(exportPayload, config);
      if (addToast) {
        addToast({ title: "Export Success", description: "Your report has been downloaded successfully.", variant: "success" });
      }
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full bg-neutral-50/30">

      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Reports & Analytics</h1>
        <p className="text-neutral-500 text-sm font-medium">Generate and analyze faculty submission data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

        {/* LEFT COLUMN: Generator & Preview (Span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">

          {/* 1. Generate Report Configuration */}
          <Card className="bg-white border-neutral-200 shadow-sm overflow-hidden h-full flex flex-col">
            <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-3.5 px-4">
              <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary-600" />
                Report Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 bg-white">

              {/* Selectors - Signature Grey Container */}
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex flex-col lg:flex-row flex-wrap gap-3 items-start lg:items-end shadow-sm mb-5">
                <div className="flex-[1.5] space-y-1 w-full min-w-[200px]">
                  <Label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-0.5">Report Type</Label>
                  <Select value={config.reportType} onValueChange={(v) => setConfig({ ...config, reportType: v })}>
                    <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs focus:ring-primary-500/20 font-medium">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-neutral-200">
                      <SelectItem value="Submission Status Summary" className="text-xs font-medium">Submission Status Summary</SelectItem>
                      <SelectItem value="Late Submission Analysis" className="text-xs font-medium">Late Submission Analysis</SelectItem>
                      <SelectItem value="Faculty Performance Leaderboard" className="text-xs font-medium">Faculty Performance Leaderboard</SelectItem>
                      <SelectItem value="Clearance Status Report" className="text-xs font-medium">Clearance Status Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 space-y-1 w-full min-w-[130px]">
                  <Label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-0.5">Semester</Label>
                  <Select value={config.semester} onValueChange={(v) => setConfig({ ...config, semester: v })}>
                    <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs focus:ring-primary-500/20 font-medium">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-neutral-200">
                      <SelectItem value="1st Semester" className="text-xs font-medium">1st Semester</SelectItem>
                      <SelectItem value="2nd Semester" className="text-xs font-medium">2nd Semester</SelectItem>
                      <SelectItem value="Summer" className="text-xs font-medium">Summer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 space-y-1 w-full min-w-[130px]">
                  <Label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-0.5">Academic Year</Label>
                  <Select value={config.academicYear} onValueChange={(v) => setConfig({ ...config, academicYear: v })}>
                    <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs focus:ring-primary-500/20 font-medium">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-neutral-200">
                      <SelectItem value="All Years" className="text-xs font-medium">All Years</SelectItem>
                      {options?.academic_years?.map(y => (
                        <SelectItem key={y} value={y} className="text-xs font-medium">{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Checkboxes Section */}
              <div className="mb-6">
                <Label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2 pl-0.5">Include Data Columns</Label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {REPORT_COLUMNS_CONFIG[config.reportType]?.includes('include_faculty_names') && (
                    <CheckboxItem
                      label="Faculty Detail"
                      checked={config.include_faculty_names}
                      onChange={() => handleCheckboxChange('include_faculty_names')}
                    />
                  )}
                  {REPORT_COLUMNS_CONFIG[config.reportType]?.includes('include_course_info') && (
                    <CheckboxItem
                      label="File & Type"
                      checked={config.include_course_info}
                      onChange={() => handleCheckboxChange('include_course_info')}
                    />
                  )}
                  {REPORT_COLUMNS_CONFIG[config.reportType]?.includes('include_submission_dates') && (
                    <CheckboxItem
                      label="Submission Timeline"
                      checked={config.include_submission_dates}
                      onChange={() => handleCheckboxChange('include_submission_dates')}
                    />
                  )}
                  {REPORT_COLUMNS_CONFIG[config.reportType]?.includes('include_status_indicators') && (
                    <CheckboxItem
                      label="Clearance Status"
                      checked={config.include_status_indicators}
                      onChange={() => handleCheckboxChange('include_status_indicators')}
                    />
                  )}
                  {REPORT_COLUMNS_CONFIG[config.reportType]?.includes('include_performance_stats') && (
                    <CheckboxItem
                      label="Completion Stats"
                      checked={config.include_performance_stats}
                      onChange={() => handleCheckboxChange('include_performance_stats')}
                    />
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-neutral-100">
                <Button
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="h-9 px-4 bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 shadow-sm text-xs font-bold transition-all"
                >
                  <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Generating...' : 'Preview Report'}
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={!reportData || !filteredData || filteredData.length === 0 || loading}
                  className="h-9 px-4 bg-primary-600 hover:bg-primary-700 text-white shadow-sm text-xs font-bold transition-all active:scale-95"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* RIGHT COLUMN: Sidebar Widgets (Span 1) */}
        <div className="flex flex-col gap-6">

          {/* Recent Exports Widget */}
          <Card className="bg-white border-neutral-200 shadow-sm overflow-hidden h-full flex flex-col">
            <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-3.5 px-4">
              <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <History className="h-4 w-4 text-primary-600" /> Recent Exports
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 bg-white flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-neutral-100 gsds-scrollbar">
                {recentExports && recentExports.length > 0 ? (
                  recentExports.map((exp, idx) => (
                    <RecentExportItem
                      key={idx}
                      name={exp.report_name}
                      date={new Date(exp.generated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      type={exp.report_type}
                      onDownload={() => reExportReport(exp)}
                      loading={loading}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                    <Clock className="h-6 w-6 text-neutral-300 mb-2" />
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">No export history yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* 2. Full Width Preview Area */}
      <Card className="bg-white border-neutral-200 shadow-sm flex flex-col min-h-[500px] overflow-hidden mb-8">
        <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-3.5 px-4 shrink-0">
          <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary-600" /> Report Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 relative flex flex-col bg-white">
          <div className="flex-1 bg-neutral-50/30 min-h-[500px] relative">
            {reportData && filteredData && filteredData.length > 0 ? (
              <div className="flex flex-col h-full">
                {/* Summary Row */}
                {calculatedSummary && (
                  <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white border-b border-neutral-100 shadow-sm z-10">
                    {Object.entries(calculatedSummary).map(([key, value]) => (
                      <div key={key} className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 shadow-inner text-center">
                        <p className="text-xl font-black text-neutral-900 tracking-tight leading-none mb-1">{value}</p>
                        <p className="text-[9px] text-neutral-400 uppercase font-bold tracking-widest truncate" title={key}>{key}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex-1">
                  <DataTable
                    rowData={filteredData}
                    columnDefs={columnDefs}
                    className="h-[500px] border-0 rounded-none shadow-none"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-20 opacity-40">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-neutral-300" />
                </div>
                <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest leading-loose">No report generated</p>
                <p className="text-xs text-neutral-400 mt-1">Configure filters above and click Preview</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
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
        <File className="h-4 w-4" />
      </div>
      <div>
        <p className="font-bold text-sm text-neutral-900 truncate max-w-[180px] leading-tight">{name}</p>
        <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">{date} • {type}</p>
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