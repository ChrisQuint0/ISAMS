import React, { useState } from 'react';
import {
  PieChart, FileText, Download, Eye, BarChart3, RefreshCw,
  CheckCircle, Clock, FileBadge, AlertTriangle, File, ArrowRight,
  Filter, Calendar
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
// Components
import { DataTable } from "@/components/DataTable";
import { useAdminReports } from '../hooks/AdminReportHook';

export default function AdminReportsPage() {
  const { loading, error, reportData, settings, recentExports, generateReport, exportCSV } = useAdminReports();

  // Consistent options for Select components
  const options = {
    academic_years: ['2023-2024', '2024-2025', '2025-2026'],
    departments: ['CITE', 'CAS', 'CBA', 'COE', 'CON', 'CHS', 'CTE', 'CCJE']
  };

  // Form State matching Rust 'ReportRequest' struct
  const [config, setConfig] = useState({
    reportType: 'Submission Status Summary',
    timePeriod: 'Current Semester',
    semester: '', // Default fallback
    academicYear: '', // Default fallback
    // Checkboxes
    include_faculty_names: true,
    include_department_data: true,
    include_course_info: true,
    include_submission_dates: true,
    include_validation_details: false,
    include_status_indicators: true,
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

  const handleCheckboxChange = (key) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerate = () => {
    generateReport(config);
  };

  // Quick Report Handler
  const handleQuickReport = (type) => {
    const quickConfig = { ...config, reportType: type };
    setConfig(quickConfig);
    // FIX: Actually trigger the report generation instantly
    generateReport(quickConfig);
  };

  // Filter Data based on Configuration
  const filteredData = React.useMemo(() => {
    if (!reportData || !reportData.data_preview) return null;

    return reportData.data_preview.map(row => {
      const newRow = {};

      // Always include these or strict mapping? Let's map config to keys.
      // Mapping: Config Key -> Array of related data keys
      if (config.include_faculty_names) {
        if (row.faculty_name) newRow['Faculty Name'] = row.faculty_name;
      }
      if (config.include_department_data) {
        if (row.department) newRow['Department'] = row.department;
      }
      if (config.include_course_info) {
        if (row.original_filename) newRow['Filename'] = row.original_filename;
        if (row.document_type) newRow['Document Type'] = row.document_type;
        if (row.type_name) newRow['Document Type'] = row.type_name;
      }
      if (config.include_submission_dates) {
        if (row.submitted_at) newRow['Submitted Date'] = new Date(row.submitted_at).toLocaleDateString();
        if (row.deadline_date) newRow['Deadline'] = new Date(row.deadline_date).toLocaleDateString();
      }
      if (config.include_validation_details) {
        if (row.validation_issues && row.validation_issues.length > 0) newRow['Validation Issues'] = row.validation_issues.join(', ');
        if (row.bot_issues) newRow['AI Analysis'] = row.bot_issues;
      }
      if (config.include_status_indicators) {
        if (row.submission_status) newRow['Status'] = row.submission_status;
        if (row.status) newRow['Clearance'] = row.status; // For Clearance Report
        if (row.progress_percentage) newRow['Progress'] = row.progress_percentage;
      }

    });
  }, [reportData, config]);

  // Column Definitions for DataTable
  const columnDefs = React.useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    return Object.keys(filteredData[0]).map(key => ({
      field: key,
      headerName: key,
      flex: 1,
      minWidth: 150,
      filter: true,
      sortable: true,
      resizable: true,
    }));
  }, [filteredData]);

  const handleExport = () => {
    if (filteredData) {
      // Pass the filtered data structure to the export function
      // We need to mimic the original structure but with filtered data
      const exportPayload = {
        ...reportData,
        data_preview: filteredData
      };
      // Pass config to track the export history
      exportCSV(exportPayload, config);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full bg-neutral-50">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Reports & Analytics</h1>
            <p className="text-neutral-500 text-sm font-medium">Generate detailed insights for faculty submissions</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

        {/* LEFT COLUMN: Generator & Preview (Span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">

          {/* 1. Generate Report Configuration */}
          <Card className="bg-white border-neutral-200 shadow-sm shrink-0">
            <CardHeader className="border-b border-neutral-100 py-3 bg-neutral-50/50">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Report Configuration</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Selectors - FIX: Changed to 3 columns and added real database parameters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest pl-1">Report Type</Label>
                  <Select
                    value={config.reportType}
                    onValueChange={(v) => setConfig({ ...config, reportType: v })}
                  >
                    <SelectTrigger className="bg-white border-neutral-200 text-neutral-900 focus:ring-primary-500/20 focus:border-primary-500 text-sm">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Submission Status Summary">Submission Status Summary</SelectItem>
                      <SelectItem value="Late Submission Analysis">Late Submission Analysis</SelectItem>
                      <SelectItem value="Validation Failure Report">Validation Failure Report</SelectItem>
                      <SelectItem value="Clearance Status Report">Clearance Status Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest pl-1">Semester</Label>
                  <Select
                    value={config.semester}
                    onValueChange={(v) => setConfig({ ...config, semester: v })}
                  >
                    <SelectTrigger className="bg-white border-neutral-200 text-neutral-900 focus:ring-primary-500/20 focus:border-primary-500 text-sm">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st Semester">1st Semester</SelectItem>
                      <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                      <SelectItem value="Summer">Summer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest pl-1">Academic Year</Label>
                  <Select
                    value={config.academicYear}
                    onValueChange={(v) => setConfig({ ...config, academicYear: v })}
                  >
                    <SelectTrigger className="bg-white border-neutral-200 text-neutral-900 focus:ring-primary-500/20 focus:border-primary-500 text-sm">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Years">All Academic Years</SelectItem>
                      {options ? options.academic_years?.map(y => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      )) : (
                        // Fallback if options aren't available in this hook (using a placeholder range)
                        ['2023-2024', '2024-2025', '2025-2026'].map(y => (
                          <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="mb-6 bg-neutral-50/50 p-4 rounded-lg border border-neutral-100">
                <Label className="mb-3 block text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest">Include Data Columns</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4">
                  <CheckboxItem
                    label="Faculty Names"
                    checked={config.include_faculty_names}
                    onChange={() => handleCheckboxChange('include_faculty_names')}
                  />
                  <CheckboxItem
                    label="Department Data"
                    checked={config.include_department_data}
                    onChange={() => handleCheckboxChange('include_department_data')}
                  />
                  <CheckboxItem
                    label="Course Information"
                    checked={config.include_course_info}
                    onChange={() => handleCheckboxChange('include_course_info')}
                  />
                  <CheckboxItem
                    label="Submission Dates"
                    checked={config.include_submission_dates}
                    onChange={() => handleCheckboxChange('include_submission_dates')}
                  />
                  <CheckboxItem
                    label="Validation Details"
                    checked={config.include_validation_details}
                    onChange={() => handleCheckboxChange('include_validation_details')}
                  />
                  <CheckboxItem
                    label="Status Indicators"
                    checked={config.include_status_indicators}
                    onChange={() => handleCheckboxChange('include_status_indicators')}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="h-9 border-neutral-200 text-neutral-600 hover:bg-white"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Preview Report
                </Button>
                <Button
                  className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/10 font-bold"
                  onClick={handleExport}
                  disabled={!reportData || !filteredData || filteredData.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 2. Preview Card */}
          <Card className="bg-white border-neutral-200 shadow-sm flex-1 flex flex-col min-h-[400px] overflow-hidden">
            <CardHeader className="border-b border-neutral-100 py-3 bg-neutral-50/50">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Report Preview</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative flex flex-col">
              {error && (
                <div className="p-4 shrink-0">
                  <Alert variant="destructive" className="border-red-900/50 bg-red-900/10 text-red-200">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}

              {reportData && filteredData ? (
                <div className="flex-1 flex flex-col h-full">
                  {/* Summary Stats Row */}
                  {reportData.summary && (
                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white border-b border-neutral-100">
                      {Object.entries(reportData.summary).map(([key, value]) => (
                        <div key={key} className="bg-neutral-50/50 p-3 rounded border border-neutral-100">
                          <p className="text-[10px] text-neutral-400 uppercase font-bold mb-1">{key}</p>
                          <p className="text-lg font-bold text-neutral-900">{value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Data Table */}
                  <div className="flex-1 overflow-hidden p-0 h-[400px]">
                    <div style={{ height: '100%', width: '100%' }}>
                      <DataTable
                        rowData={filteredData}
                        columnDefs={columnDefs}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-neutral-400 min-h-[300px] bg-white">
                  <div className="h-20 w-20 bg-neutral-50 rounded-full flex items-center justify-center mb-4 border border-neutral-100">
                    <BarChart3 className="h-10 w-10 text-neutral-200" />
                  </div>
                  <p className="font-bold text-neutral-900 text-lg">No report generated</p>
                  <p className="text-sm text-neutral-500 max-w-xs text-center mt-1">
                    Select a report type above and click "Preview Report" to generate data.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Sidebar Widgets (Span 1) */}
        <div className="flex flex-col gap-6">

          {/* 3. Quick Reports Widget */}
          <Card className="bg-white border-neutral-200 shadow-sm">
            <CardHeader className="border-b border-neutral-100 py-3 bg-neutral-50/50">
              <CardTitle className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Quick Templates</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 px-4">
              <QuickReportBtn
                icon={PieChart}
                label="Current Status"
                sub="Snapshot of current semester"
                color="text-emerald-600"
                bg="bg-white hover:bg-neutral-50 border-neutral-200"
                onClick={() => handleQuickReport('Submission Status Summary')}
              />
              <QuickReportBtn
                icon={Clock}
                label="Late Submissions"
                sub="All overdue documents"
                color="text-rose-600"
                bg="bg-white hover:bg-neutral-50 border-neutral-200"
                onClick={() => handleQuickReport('Late Submission Analysis')}
              />
              <QuickReportBtn
                icon={CheckCircle}
                label="Validation Stats"
                sub="Success/failure rates"
                color="text-primary-600"
                bg="bg-white hover:bg-neutral-50 border-neutral-200"
                onClick={() => handleQuickReport('Validation Failure Report')}
              />
              <QuickReportBtn
                icon={FileBadge}
                label="Clearance Report"
                sub="Faculty clearance status"
                color="text-purple-600"
                bg="bg-white hover:bg-neutral-50 border-neutral-200"
                onClick={() => handleQuickReport('Clearance Status Report')}
              />
            </CardContent>
          </Card>

          {/* 4. Recent Exports Widget */}
          <Card className="bg-white border-neutral-200 shadow-sm">
            <CardHeader className="border-b border-neutral-100 py-3 bg-neutral-50/50">
              <CardTitle className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Recent Exports</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-800/50">
                {recentExports && recentExports.length > 0 ? (
                  recentExports.map((exp, idx) => (
                    <RecentExportItem
                      key={idx}
                      name={exp.report_name}
                      date={new Date(exp.generated_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      type={exp.report_type}
                    />
                  ))
                ) : (
                  <div className="p-6 text-center text-neutral-400 text-sm">
                    No export history yet.
                  </div>
                )}
                {recentExports && recentExports.length > 0 && (
                  <div className="p-3 text-center">
                    <Button variant="link" className="text-xs text-slate-500 h-auto p-0 hover:text-blue-400">
                      View All History
                    </Button>
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
  <div className="flex items-center space-x-2.5">
    <Checkbox
      id={label}
      checked={checked}
      onCheckedChange={onChange}
      className="border-neutral-300 data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600 h-4 w-4"
    />
    <label
      htmlFor={label}
      className="text-sm font-bold text-neutral-600 cursor-pointer select-none"
    >
      {label}
    </label>
  </div>
);

const QuickReportBtn = ({ icon: Icon, label, sub, color, bg, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full p-3 rounded-lg border transition-all text-left group ${bg}`}
  >
    <div className={`mr-3 p-1.5 rounded bg-neutral-50 group-hover:bg-white transition-colors border border-transparent group-hover:border-neutral-100 shadow-sm`}>
      <Icon className={`h-4 w-4 ${color}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-bold text-sm text-neutral-900 truncate">{label}</p>
      <p className="text-[10px] text-neutral-400 font-medium truncate">{sub}</p>
    </div>
    <ArrowRight className="h-3 w-3 text-neutral-300 group-hover:text-primary-600 transition-colors" />
  </button>
);

const RecentExportItem = ({ name, date, type }) => (
  <div className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors group">
    <div className="flex items-center gap-3">
      <div className={`p-1.5 rounded bg-white border border-neutral-100 shadow-sm ${type === 'PDF' ? 'text-rose-600' : 'text-emerald-600'}`}>
        <File className="h-3.5 w-3.5" />
      </div>
      <div>
        <p className="font-bold text-sm text-neutral-900">{name}</p>
        <p className="text-[10px] text-neutral-400 font-medium">{date} • {type}</p>
      </div>
    </div>
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-neutral-400 hover:text-primary-600 hover:bg-white opacity-0 group-hover:opacity-100 transition-all"
    >
      <Download className="h-3.5 w-3.5" />
    </Button>
  </div>
);