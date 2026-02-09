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

// Hook
import { useAdminReports } from '../hooks/AdminReportHook';

export default function AdminReportsPage() {
  const { loading, error, reportData, generateReport, exportCSV } = useAdminReports();

  // Form State matching Rust 'ReportRequest' struct
  const [config, setConfig] = useState({
    reportType: 'Submission Status Summary',
    timePeriod: 'Current Semester',
    semester: '2nd Sem',
    academicYear: '2023-2024',
    // Checkboxes
    include_faculty_names: true,
    include_department_data: true,
    include_course_info: true,
    include_submission_dates: true,
    include_validation_details: false,
    include_status_indicators: true,
  });

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
    // In a real app, you might auto-trigger generation here
    // generateReport(quickConfig); 
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Reports & Analytics</h1>
          <p className="text-slate-400 text-sm">Generate detailed insights for faculty submissions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* LEFT COLUMN: Generator & Preview (Span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
          
          {/* 1. Generate Report Configuration */}
          <Card className="bg-slate-900 border-slate-800 shadow-none shrink-0">
            <CardHeader className="border-b border-slate-800 py-3">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600/20 p-1.5 rounded text-blue-400">
                    <Filter className="h-4 w-4" />
                </div>
                <CardTitle className="text-base text-slate-100">Report Configuration</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400 uppercase">Report Type</Label>
                  <Select 
                    value={config.reportType} 
                    onValueChange={(v) => setConfig({...config, reportType: v})}
                  >
                    <SelectTrigger className="bg-slate-950/50 border-slate-700 text-slate-200 focus:ring-blue-500/20">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                      <SelectItem value="Submission Status Summary" className="focus:bg-slate-800">Submission Status Summary</SelectItem>
                      <SelectItem value="Late Submission Analysis" className="focus:bg-slate-800">Late Submission Analysis</SelectItem>
                      <SelectItem value="Faculty Performance Report" className="focus:bg-slate-800">Faculty Performance Report</SelectItem>
                      <SelectItem value="Department Comparison" className="focus:bg-slate-800">Department Comparison</SelectItem>
                      <SelectItem value="Validation Failure Report" className="focus:bg-slate-800">Validation Failure Report</SelectItem>
                      <SelectItem value="Clearance Status Report" className="focus:bg-slate-800">Clearance Status Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400 uppercase">Time Period</Label>
                  <Select 
                    value={config.timePeriod} 
                    onValueChange={(v) => setConfig({...config, timePeriod: v})}
                  >
                    <SelectTrigger className="bg-slate-950/50 border-slate-700 text-slate-200 focus:ring-blue-500/20">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                      <SelectItem value="Current Semester" className="focus:bg-slate-800">Current Semester</SelectItem>
                      <SelectItem value="Previous Semester" className="focus:bg-slate-800">Previous Semester</SelectItem>
                      <SelectItem value="Academic Year 2023-2024" className="focus:bg-slate-800">Academic Year 2023-2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="mb-6 bg-slate-950/30 p-4 rounded-lg border border-slate-800/50">
                <Label className="mb-3 block text-xs font-semibold text-slate-400 uppercase">Include Data Columns</Label>
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
                  className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <Eye className="mr-2 h-4 w-4" /> Preview Report
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-900/20" 
                  onClick={exportCSV} 
                  disabled={!reportData}
                >
                  <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 2. Preview Card */}
          <Card className="bg-slate-900 border-slate-800 shadow-none flex-1 flex flex-col min-h-[400px]">
            <CardHeader className="border-b border-slate-800 py-3 shrink-0 bg-slate-950/30">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-600/20 p-1.5 rounded text-emerald-400">
                    <FileText className="h-4 w-4" />
                </div>
                <CardTitle className="text-base text-slate-100">Report Preview</CardTitle>
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
              
              {reportData ? (
                <div className="flex-1 flex flex-col h-full">
                  {/* Summary Stats Row */}
                  {reportData.summary && (
                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900 border-b border-slate-800">
                      {Object.entries(reportData.summary).map(([key, value]) => (
                        <div key={key} className="bg-slate-950/50 p-3 rounded border border-slate-800">
                          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">{key}</p>
                          <p className="text-lg font-mono font-bold text-slate-200">{value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Data Table */}
                  <div className="flex-1 overflow-auto p-0">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-slate-950 text-slate-400 font-semibold sticky top-0 z-10 shadow-sm shadow-slate-950">
                        <tr>
                          {reportData.data_preview?.[0] && Object.keys(reportData.data_preview[0]).map(h => (
                            <th key={h} className="px-4 py-3 border-b border-slate-800 whitespace-nowrap text-xs uppercase tracking-wider bg-slate-950">
                                {h.replace(/_/g, ' ')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {reportData.data_preview?.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                            {Object.values(row).map((val, j) => (
                              <td key={j} className="px-4 py-2.5 text-slate-300 whitespace-nowrap font-mono text-xs">
                                {val}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-slate-400 min-h-[300px]">
                  <div className="h-20 w-20 bg-slate-950/50 rounded-full flex items-center justify-center mb-4 border border-slate-800">
                    <BarChart3 className="h-10 w-10 text-slate-700" />
                  </div>
                  <p className="font-medium text-slate-300 text-lg">No report generated</p>
                  <p className="text-sm text-slate-500 max-w-xs text-center mt-1">
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
          <Card className="bg-slate-900 border-slate-800 shadow-none">
            <CardHeader className="border-b border-slate-800 py-3">
              <CardTitle className="text-base text-slate-100">Quick Templates</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 px-4">
              <QuickReportBtn 
                icon={PieChart} 
                label="Current Status" 
                sub="Snapshot of current semester" 
                color="text-emerald-400"
                bg="hover:bg-slate-800 border-slate-800"
                onClick={() => handleQuickReport('Submission Status Summary')}
              />
              <QuickReportBtn 
                icon={Clock} 
                label="Late Submissions" 
                sub="All overdue documents" 
                color="text-rose-400"
                bg="hover:bg-slate-800 border-slate-800"
                onClick={() => handleQuickReport('Late Submission Analysis')}
              />
              <QuickReportBtn 
                icon={CheckCircle} 
                label="Validation Stats" 
                sub="Success/failure rates" 
                color="text-blue-400"
                bg="hover:bg-slate-800 border-slate-800"
                onClick={() => handleQuickReport('Validation Failure Report')}
              />
              <QuickReportBtn 
                icon={FileBadge} 
                label="Clearance Report" 
                sub="Faculty clearance status" 
                color="text-purple-400"
                bg="hover:bg-slate-800 border-slate-800"
                onClick={() => handleQuickReport('Clearance Status Report')}
              />
            </CardContent>
          </Card>

          {/* 4. Recent Exports Widget */}
          <Card className="bg-slate-900 border-slate-800 shadow-none">
            <CardHeader className="border-b border-slate-800 py-3">
              <CardTitle className="text-base text-slate-100">Recent Exports</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-800/50">
                <RecentExportItem name="Submission Summary" date="June 5, 2024" type="CSV" />
                <RecentExportItem name="Late Faculty Report" date="June 3, 2024" type="PDF" />
                <RecentExportItem name="Department Comparison" date="June 1, 2024" type="CSV" />
                <div className="p-3 text-center">
                    <Button variant="link" className="text-xs text-slate-500 h-auto p-0 hover:text-blue-400">
                        View All History
                    </Button>
                </div>
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
      className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-4 w-4"
    />
    <label 
      htmlFor={label} 
      className="text-sm font-medium leading-none text-slate-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
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
    <div className={`mr-3 p-1.5 rounded bg-slate-950/50 group-hover:bg-slate-950 transition-colors`}>
        <Icon className={`h-4 w-4 ${color}`} /> 
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-sm text-slate-200 truncate">{label}</p>
      <p className="text-[10px] text-slate-500 truncate">{sub}</p>
    </div>
    <ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
  </button>
);

const RecentExportItem = ({ name, date, type }) => (
  <div className="flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors group">
    <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded bg-slate-950 border border-slate-800 ${type === 'PDF' ? 'text-rose-400' : 'text-emerald-400'}`}>
            <File className="h-3.5 w-3.5" />
        </div>
        <div>
            <p className="font-medium text-sm text-slate-200">{name}</p>
            <p className="text-[10px] text-slate-500">{date} • {type}</p>
        </div>
    </div>
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-7 w-7 text-slate-500 hover:text-slate-100 hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <Download className="h-3.5 w-3.5" />
    </Button>
  </div>
);