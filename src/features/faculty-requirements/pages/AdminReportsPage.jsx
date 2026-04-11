import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
import { useLogo } from '../../settings/hooks/useLogo';
import { useSettings } from '../../settings/hooks/useSettings';
import plpLogo from '@/assets/images/plp_logo.png';
import ccsLogo from '@/assets/images/ccs_logo.png';

// Components
import { DataTable } from "@/components/DataTable";
import { useAdminReports } from '../hooks/AdminReportHook';
import { reportService } from '../services/AdminReportService';

const REPORT_COLUMNS_CONFIG = {
  'Submission Status Summary': ['include_faculty_names', 'include_course_info', 'include_submission_dates', 'include_status_indicators'],
  'Late Submission Analysis': ['include_faculty_names', 'include_course_info', 'include_submission_dates', 'include_status_indicators'],
  'Faculty Performance Leaderboard': ['include_faculty_names', 'include_status_indicators', 'include_performance_stats'],
  'Clearance Status Report': ['include_faculty_names', 'include_status_indicators', 'include_performance_stats']
};

export default function AdminReportsPage() {
  const { loading, error, reportData, settings: reportSettings, recentExports, options, generateReport, exportCSV, reExportReport, loadExports, downloadingItemId } = useAdminReports();
  const { toast, addToast } = useToast();
  const { logoUrl } = useLogo();
  const { settings } = useSettings();

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
    if (reportSettings && reportSettings.semester && reportSettings.academic_year) {
      setConfig(prev => ({
        ...prev,
        semester: reportSettings.semester,
        academicYear: reportSettings.academic_year
      }));
    }
  }, [reportSettings]);

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

  // Dynamically filter semesters based on selected academic year
  const filteredSemesters = React.useMemo(() => {
    if (!options?.semesterPeriods) return options?.semesters || [];
    if (!config.academicYear) return [];
    return [...new Set(
      options.semesterPeriods
        .filter(p => p.academic_year === config.academicYear)
        .map(p => p.semester)
    )].filter(Boolean);
  }, [options, config.academicYear]);

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
        if (row.submission_status) {
          const isCompleted = ['SUBMITTED', 'RESUBMITTED', 'APPROVED', 'VALIDATED'].includes(row.submission_status.toUpperCase());
          newRow['Status'] = (row.is_submitted_late && isCompleted) ? 'LATE' : row.submission_status;
        }
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
        'LATE': 0,
        'SUBMITTED': 0,
        'REVISION REQUESTED': 0,
        'TOTAL FACULTY': 0
      };

      const uniqueFaculty = new Set();

      rows.forEach(row => {
        const status = (row.submission_status || row.status || '').toUpperCase();
        const isCompleted = ['SUBMITTED', 'RESUBMITTED', 'APPROVED', 'VALIDATED', 'CLEARED'].includes(status);
        
        if (row.is_submitted_late && isCompleted) {
          counts['LATE']++;
        } else if (isCompleted) {
          counts['SUBMITTED']++;
        } else if (status === 'REVISION_REQUESTED' || status === 'REVISION REQUESTED') {
          counts['REVISION REQUESTED']++;
        }

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
          let val = p.value.toUpperCase();
          let colorClass = "bg-neutral-100 text-neutral-600 border-neutral-200";

          // Calculate isCompleted for late submission check
          const isCompleted = val === 'SUBMITTED' || val === 'RESUBMITTED' || val === 'APPROVED' || val === 'VALIDATED' || val === 'CLEARED';
          if (p.data?.is_submitted_late && isCompleted) {
            val = 'LATE';
          }

          if (val === 'APPROVED' || val === 'CLEARED' || val === 'ON TRACK' || val === 'ON TIME' || val === 'SUBMITTED' || val === 'RESUBMITTED' || val === 'VALIDATED') {
            colorClass = "bg-success/10 text-success border-success/20";
          } else if (val === 'AT RISK' || val === 'REJECTED' || val === 'REVISION_REQUESTED') {
            colorClass = "bg-destructive/10 text-destructive border-destructive/20";
          } else if (val === 'LATE' || val === 'DELAYED' || val === 'PENDING' || val === 'NO SUBMISSIONS' || val === 'FAILED') {
            colorClass = "bg-warning/10 text-warning border-warning/20";
          }

          // Format: Capitalize first letter of each word
          const displayValue = val.split('_').join(' ').toLowerCase().split(' ').map(word =>
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

  const imageUrlToBase64 = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return null;
    }
  };

  const handleExport = async (overrideData = null, overrideConfig = null) => {
    const dataToUse = overrideData || filteredData;
    const configToUse = overrideConfig || config;

    if (!dataToUse || dataToUse.length === 0) return;

    const doc = new jsPDF({ orientation: 'landscape' });
    const title = configToUse.reportType.toUpperCase();
    const now = new Date().toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const [plpBase64, ccsBase64] = await Promise.all([
      imageUrlToBase64(plpLogo),
      imageUrlToBase64(logoUrl || ccsLogo)
    ]);

    const pageWidth  = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const footerHeight = 18;
    const headerHeightFirstPage = 62;
    const headerHeightSubPages = 16;

    const C = {
      primary:   [17, 58, 26],
      accent:    [34, 130, 68],
      white:     [255, 255, 255],
      offWhite:  [245, 249, 246],
      lightGray: [230, 232, 230],
      midGray:   [150, 155, 152],
      textDark:  [35, 40, 38],
      textMuted: [110, 118, 114],
    };

    const drawFirstPageHeader = () => {
      doc.setFillColor(...C.white);
      doc.rect(0, 0, pageWidth, 38, 'F');
      doc.setFillColor(...C.primary);
      doc.rect(0, 38, pageWidth, 0.8, 'F');

      doc.setDrawColor(...C.primary);
      doc.setLineWidth(0.6);
      doc.line(margin - 2, 5, margin - 2, 12);
      doc.line(margin - 2, 5, margin + 5, 5);
      doc.line(pageWidth - margin + 2, 5, pageWidth - margin + 2, 12);
      doc.line(pageWidth - margin + 2, 5, pageWidth - margin - 5, 5);

      if (plpBase64) doc.addImage(plpBase64, 'PNG', margin + 2, 9, 20, 20);
      if (ccsBase64) doc.addImage(ccsBase64, 'PNG', pageWidth - 22 - margin, 9, 20, 20);

      doc.setTextColor(...C.primary);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('PAMANTASAN NG LUNGSOD NG PASIG', pageWidth / 2, 16, { align: 'center' });

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.textMuted);
      doc.text((settings?.college_name || reportSettings?.college_name || 'COLLEGE OF COMPUTER STUDIES').toUpperCase(), pageWidth / 2, 22, { align: 'center' });

      doc.setFontSize(7);
      doc.setTextColor(...C.midGray);
      doc.text('FACULTY REQUIREMENT MONITORING SYSTEM  //  ISAMS', pageWidth / 2, 27.5, { align: 'center' });

      doc.setFontSize(6.5);
      doc.setTextColor(...C.midGray);
      doc.text(`GENERATED: ${now}`, margin + 2, 34.5);
      doc.text(`${dataToUse.length} RECORDS`, pageWidth - margin - 2, 34.5, { align: 'right' });

      doc.setTextColor(...C.primary);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin, 48);

      doc.setDrawColor(...C.accent);
      doc.setLineWidth(0.4);
      doc.line(margin, 51, margin + 80, 51);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.textMuted);
      doc.text(now, pageWidth - margin, 48, { align: 'right' });
    };

    const drawSubPageHeader = () => {
      doc.setFillColor(...C.white);
      doc.rect(0, 0, pageWidth, 11, 'F');
      doc.setFillColor(...C.primary);
      doc.rect(0, 11, pageWidth, 0.5, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.primary);
      doc.text(`ISAMS  //  ${title}`, margin, 7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.textMuted);
      doc.text(now, pageWidth - margin, 7, { align: 'right' });
    };

    const drawFooter = (pageNumber, totalPages) => {
      const footerY = pageHeight - footerHeight;
      doc.setFillColor(...C.accent);
      doc.rect(margin, footerY, pageWidth - margin * 2, 0.3, 'F');
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...C.midGray);
      doc.text('Electronically generated  ·  No signature required for internal circulation', margin, footerY + 5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(...C.primary);
      doc.text('PLP-ISAMS  //  FACULTY REQUIREMENT MONITORING SYSTEM', pageWidth / 2, footerY + 5, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.textMuted);
      doc.setFontSize(7);
      doc.text(`${String(pageNumber).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}`, pageWidth - margin, footerY + 5, { align: 'right' });
      doc.setFillColor(...C.primary);
      doc.rect(0, pageHeight - 2, pageWidth, 2, 'F');
    };

    drawFirstPageHeader();

    const headers = Object.keys(dataToUse[0] || {}).map(k => k.toUpperCase());
    const fields = Object.keys(dataToUse[0] || {});
    const rows = dataToUse.map(row => fields.map(f => {
      const val = row[f];
      if (val === null || val === undefined) return '';
      if (typeof val === 'string' && val.includes('%')) return val;
      return String(val);
    }));

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: headerHeightFirstPage,
      styles: {
        fontSize: 7.5,
        cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
        font: 'helvetica',
        textColor: C.textDark,
        lineColor: C.lightGray,
        lineWidth: 0.15,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: C.primary, textColor: C.white, fontStyle: 'bold',
        fontSize: 7, halign: 'center', valign: 'middle',
        cellPadding: { top: 4, right: 4, bottom: 4, left: 4 }
      },
      alternateRowStyles: { fillColor: C.offWhite },
      margin: { top: headerHeightSubPages, left: margin, right: margin, bottom: footerHeight + 4 },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) drawSubPageHeader();
      }
    });

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawFooter(i, totalPages);
    }

    const fileName = `${configToUse.reportType.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);

    // Only log the export if it's a new generation (not a history download)
    if (!overrideData) {
      await reportService.logExport(configToUse.reportType, 'PDF', configToUse.semester, configToUse.academicYear);
      // Refresh recent exports list now that the log entry is committed
      loadExports();
    }

    if (addToast && !overrideData) {
      addToast({ title: 'Export Success', description: 'Your PDF report has been downloaded successfully.', variant: 'success' });
    }
  };

  const handleHistoryDownload = async (exp) => {
    const isPDF = exp.report_type === 'PDF';
    const data = await reExportReport(exp);
    if (!data || !data.data_preview) return;

    if (isPDF) {
      const targetConfig = exp.export_config || {
        include_faculty_names: true, include_course_info: true, include_submission_dates: true,
        include_validation_details: true, include_status_indicators: true, include_performance_stats: true,
        reportType: exp.report_name, semester: exp.semester, academicYear: exp.academic_year
      };

      const historyFilteredData = data.data_preview.map(row => {
        const newRow = {};
        if (targetConfig.include_faculty_names && row.faculty_name) newRow['Faculty Name'] = row.faculty_name;
        if (targetConfig.include_course_info) {
          if (row.original_filename) newRow['Filename'] = row.original_filename;
          const docType = row.document_type || row.type_name;
          if (docType) newRow['Document Type'] = docType;
        }
        if (targetConfig.include_submission_dates) {
          if (row.submitted_at) newRow['Submitted Date'] = new Date(row.submitted_at).toLocaleDateString('en-US');
          if (row.deadline_date) newRow['Deadline'] = new Date(row.deadline_date).toLocaleDateString('en-US');
        }
        if (targetConfig.include_validation_details) {
          if (row.validation_issues && row.validation_issues.length > 0) newRow['Validation Issues'] = row.validation_issues.join(', ');
          if (row.bot_issues) newRow['AI Analysis'] = row.bot_issues;
        }
        if (targetConfig.include_status_indicators) {
          if (row.submission_status) {
            const isCompleted = ['SUBMITTED', 'RESUBMITTED', 'APPROVED', 'VALIDATED'].includes(row.submission_status.toUpperCase());
            newRow['Status'] = (row.is_submitted_late && isCompleted) ? 'LATE' : row.submission_status;
          }
          if (row.status) newRow['Clearance'] = row.status;
        }
        if (targetConfig.include_performance_stats) {
          if (row.items_submitted !== undefined) newRow['Items Submitted'] = row.items_submitted;
          if (row.completion) newRow['Progress'] = row.completion;
          if (row.progress_percentage) newRow['Progress'] = row.progress_percentage;
        }
        return newRow;
      });

      await handleExport(historyFilteredData, targetConfig);
      
      if (addToast) {
        addToast({ title: 'Export Success', description: `Re-exported ${exp.report_name} as PDF.`, variant: 'success' });
      }
    } else {
      exportCSV(data);
      if (addToast) {
        addToast({ title: 'Export Success', description: `Re-exported ${exp.report_name} as CSV.`, variant: 'success' });
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 items-start">

        {/* LEFT COLUMN: Generator & Preview (Span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">

          {/* 1. Generate Report Configuration */}
          <Card className="bg-white border-neutral-200 shadow-sm overflow-hidden">
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
                      {filteredSemesters.map(sem => {
                        const period = options?.semesterPeriods?.find(
                          p => p.semester === sem && p.academic_year === config.academicYear
                        );
                        const isActive = period?.status === 'Active';
                        return (
                          <SelectItem key={sem} value={sem} className="text-xs font-medium">
                            <span className="flex items-center gap-2">
                              {sem}
                              {isActive && (
                                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20">Active</span>
                              )}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 space-y-1 w-full min-w-[130px]">
                  <Label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-0.5">Academic Year</Label>
                  <Select value={config.academicYear} onValueChange={(v) => setConfig({ ...config, academicYear: v, semester: '' })}>
                    <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs focus:ring-primary-500/20 font-medium">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-neutral-200">
                      {options?.academic_years?.map(year => (
                        <SelectItem key={year} value={year} className="text-xs font-medium">
                          <span className="flex items-center gap-2">
                            {year}
                            {reportSettings?.academic_year === year && (
                              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20">Active</span>
                            )}
                          </span>
                        </SelectItem>
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
                  onClick={() => handleExport()}
                  disabled={!reportData || !filteredData || filteredData.length === 0 || loading}
                  className="h-9 px-4 bg-primary-600 hover:bg-primary-700 text-white shadow-sm text-xs font-bold transition-all active:scale-95"
                >
                  <FileText className="mr-1.5 h-3.5 w-3.5" /> Export PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* RIGHT COLUMN: Sidebar Widgets (Span 1) */}
        <div className="flex flex-col gap-6">

          {/* Recent Exports Widget */}
          <Card className="bg-white border-neutral-200 shadow-sm max-h-[330px] overflow-hidden flex flex-col">
            <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-3.5 px-4 shrink-0">
              <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <History className="h-4 w-4 text-primary-600" /> Recent Exports
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 bg-white">
              <div className="divide-y divide-neutral-100">
                {recentExports && recentExports.length > 0 ? (
                  recentExports.slice(0, 4).map((exp, idx) => (
                    <RecentExportItem
                      key={idx}
                      name={exp.report_name}
                      date={new Date(exp.generated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      type={exp.report_type}
                      onDownload={() => handleHistoryDownload(exp)}
                      loading={downloadingItemId === exp.history_id}
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
  <div className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors group cursor-pointer" onClick={!loading ? onDownload : undefined}>
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
      className={`h-7 w-7 transition-all shrink-0 ${
        loading
          ? 'text-primary-600 bg-primary-50 opacity-100'
          : 'text-neutral-400 hover:text-primary-600 hover:bg-primary-50 opacity-0 group-hover:opacity-100'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        if (!loading) onDownload();
      }}
    >
      {loading
        ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        : <Download className="h-3.5 w-3.5" />}
    </Button>
  </div>
);