import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

ModuleRegistry.registerModules([AllCommunityModule]);

import {
  FileText, Download, Calendar, ShieldAlert, Scale, Users,
  Loader2, Filter, FileSpreadsheet, SlidersHorizontal
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

// Assets
import plpLogo from "@/assets/images/plp_logo.png";
import ccsLogo from "@/assets/images/ccs_logo.png";

// Helper: Convert URL/Asset to Base64 for PDF/Excel logos
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
    console.error("Error converting image to base64:", error);
    return null;
  }
};


// AG Grid theme
const customTheme = themeQuartz.withParams({
  accentColor: 'var(--primary-600)',
  backgroundColor: 'var(--neutral-50)',
  foregroundColor: 'var(--neutral-900)',
  borderColor: 'var(--neutral-200)',
  headerBackgroundColor: 'var(--neutral-100)',
  headerTextColor: 'var(--neutral-900)',
  oddRowBackgroundColor: '#ffffff',
  rowHoverColor: 'var(--neutral-100)',
  selectedRowBackgroundColor: 'color-mix(in srgb, var(--primary-500) 10%, transparent)',
  rowHeight: 48,
  headerHeight: 40,
  headerFontWeight: '700',
  fontSize: '13px',
});

// --- Report Type Configs ---
const REPORT_TYPES = [
  {
    id: "violations",
    icon: ShieldAlert,
    title: "Violation Summary",
    description: "All violations with student info, offense type, severity, status, and incident date.",
    color: "text-destructive-semantic",
  },
  {
    id: "sanctions",
    icon: Scale,
    title: "Student Sanctions",
    description: "All sanctions with student, penalty, type, status, and deadline information.",
    color: "text-info",
  },
  {
    id: "students",
    icon: Users,
    title: "Student Records",
    description: "Student enrollment overview including course, status, and guardian info.",
    color: "text-primary-600",
  },
];


// --- Status options per report type ---
const STATUS_OPTIONS = {
  violations: ["Pending", "Under Investigation", "Sanctioned", "Resolved", "Dismissed"],
  sanctions: ["In Progress", "Completed", "Overdue"],
  students: ["Enrolled", "LOA", "Dropped", "Expelled", "Graduated"],
};

const SEVERITY_OPTIONS = ["Minor", "Major", "Compliance"];


// --- Report Option Card ---
const ReportOption = ({ icon: Icon, title, description, active, onClick, color }) => (
  <button
    onClick={onClick}
    className={`flex items-start gap-4 p-5 rounded-xl border transition-all text-left w-full ${active
      ? "bg-white border-primary-300 shadow-md ring-1 ring-primary-100"
      : "bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-sm"
      }`}
  >
    <div className={`p-3 rounded-lg shrink-0 ${active ? "bg-primary-600 text-white shadow-sm shadow-emerald-900/10" : "bg-neutral-50 text-neutral-500 border border-neutral-100"}`}>
      <Icon size={22} />
    </div>
    <div>
      <h4 className={`text-[14px] font-bold tracking-tight ${active ? "text-neutral-900" : "text-neutral-700"}`}>
        {title}
      </h4>
      <p className="text-[13px] text-neutral-500 font-medium leading-relaxed mt-1">{description}</p>
    </div>
  </button>
);


// --- Select Dropdown Component ---
const SelectDropdown = ({ label, value, onChange, options, placeholder }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 px-3 rounded-lg border border-neutral-200 bg-white text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
    >
      <option value="">{placeholder}</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);


const GenerateReport = () => {
  const [selectedType, setSelectedType] = useState("violations");
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");

  // Reset filters when report type changes
  useEffect(() => {
    setStartDate("");
    setEndDate("");
    setStatusFilter("");
    setSeverityFilter("");
  }, [selectedType]);

  // Fetch preview data
  const fetchPreviewData = useCallback(async () => {
    setIsLoading(true);
    try {
      let data = [];

      if (selectedType === "violations") {
        let query = supabase
          .from("violations_sv")
          .select(`*, students_sv(first_name, last_name), offense_types_sv(name, severity)`)
          .order("incident_date", { ascending: false });

        if (startDate) query = query.gte("incident_date", startDate);
        if (endDate) query = query.lte("incident_date", endDate);
        if (statusFilter) query = query.eq("status", statusFilter);

        const { data: vData, error } = await query;
        if (error) throw error;

        data = (vData || [])
          .filter(v => {
            if (severityFilter && v.offense_types_sv?.severity !== severityFilter) return false;
            return true;
          })
          .map(v => {
              let incidentDisplay = v.incident_date || "N/A";
              if (v.incident_date) {
                  const dateObj = new Date(v.incident_date);
                  let dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                  let timeStr = "";
                  if (v.incident_time) {
                     const [hours, minutes] = v.incident_time.split(':');
                     const h = parseInt(hours, 10);
                     const ampm = h >= 12 ? 'PM' : 'AM';
                     const h12 = h % 12 || 12;
                     timeStr = ` at ${h12}:${minutes} ${ampm}`;
                  }
                  incidentDisplay = `${dateStr}${timeStr}`;
              }

              return {
                student_id: v.student_number,
                student_name: v.students_sv ? `${v.students_sv.first_name} ${v.students_sv.last_name}` : "Unknown",
                section: v.student_course_year_section || "N/A",
                offense: v.offense_types_sv?.name || "N/A",
                severity: v.offense_types_sv?.severity || "N/A",
                incident_display: incidentDisplay,
                location: v.location,
                status: v.status,
              };
          });

      } else if (selectedType === "sanctions") {
        let query = supabase
          .from("student_sanctions_sv")
          .select(`*, violations_sv(student_number, incident_date, students_sv(first_name, last_name))`)
          .order("created_at", { ascending: false });

        if (statusFilter) query = query.eq("status", statusFilter);

        const { data: sData, error } = await query;
        if (error) throw error;

        data = (sData || [])
          .filter(s => {
            if (startDate && s.start_date && s.start_date < startDate) return false;
            if (endDate && s.deadline_date && s.deadline_date > endDate) return false;
            return true;
          })
          .map(s => ({
            sanction_id: s.sanction_id,
            student_name: s.violations_sv?.students_sv
              ? `${s.violations_sv.students_sv.first_name} ${s.violations_sv.students_sv.last_name}`
              : "Unknown",
            student_id: s.violations_sv?.student_number || "N/A",
            penalty: s.penalty_name,
            type: s.type,
            status: s.status,
            start_date: s.start_date || "—",
            deadline: s.deadline_date || "—",
            completed: s.completion_date || "—",
          }));

      } else if (selectedType === "students") {
        let query = supabase.from("students_sv").select("*").order("last_name");

        if (statusFilter) query = query.eq("status", statusFilter);

        const { data: stData, error } = await query;
        if (error) throw error;

        data = (stData || []).map(s => ({
          student_id: s.student_number,
          name: `${s.first_name} ${s.last_name}`,
          email: s.email || "—",
          course: s.course_year_section || "N/A",
          status: s.status,
          guardian: s.guardian_name || "—",
          guardian_contact: s.guardian_contact || "—",
        }));
      }

      setPreviewData(data);
    } catch (err) {
      console.error("Error fetching report data:", err);
      setPreviewData([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedType, startDate, endDate, statusFilter, severityFilter]);

  // Auto-fetch when filters or type change
  useEffect(() => {
    fetchPreviewData();
  }, [fetchPreviewData]);


  // --- AG Grid Column Definitions ---
  const columnDefs = useMemo(() => {
    if (selectedType === "violations") {
      return [
        { headerName: "Student Name", field: "student_name", flex: 1.2 },
        { headerName: "Section", field: "section", width: 100 },
        { headerName: "Offense", field: "offense", flex: 1.5 },
        { headerName: "Severity", field: "severity", width: 110 },
        { headerName: "Incident Date", field: "incident_display", width: 160 },
        { headerName: "Location", field: "location", flex: 1 },
        {
          headerName: "Status", field: "status", width: 140,
          cellRenderer: (p) => <StatusBadge value={p.value} />
        },
      ];
    }
    if (selectedType === "sanctions") {
      return [
        { headerName: "ID", field: "sanction_id", width: 80 },
        { headerName: "Student", field: "student_name", flex: 1.2 },
        { headerName: "Student ID", field: "student_id", width: 130 },
        { headerName: "Penalty", field: "penalty", flex: 1.5 },
        { headerName: "Type", field: "type", width: 110 },
        {
          headerName: "Status", field: "status", width: 130,
          cellRenderer: (p) => <StatusBadge value={p.value} />
        },
        { headerName: "Start", field: "start_date", width: 110 },
        { headerName: "Deadline", field: "deadline", width: 110 },
        { headerName: "Completed", field: "completed", width: 110 },
      ];
    }
    // students
    return [
      { headerName: "Student ID", field: "student_id", width: 140 },
      { headerName: "Full Name", field: "name", flex: 1.5 },
      { headerName: "Email", field: "email", flex: 1.5 },
      { headerName: "Course", field: "course", flex: 1 },
      {
        headerName: "Status", field: "status", width: 130,
        cellRenderer: (p) => <StatusBadge value={p.value} />
      },
      { headerName: "Guardian", field: "guardian", flex: 1.2 },
      { headerName: "Contact", field: "guardian_contact", flex: 1 },
    ];
  }, [selectedType]);

  const defaultColDef = useMemo(() => ({ sortable: true, resizable: true, filter: true }), []);


  // --- Export Functions ---
  const getReportTitle = () => {
    const type = REPORT_TYPES.find(r => r.id === selectedType);
    return type?.title || "Report";
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF({ orientation: "landscape" });
      const title = getReportTitle();

      const now = new Date().toLocaleString(undefined, { 
        month: 'short', day: 'numeric', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      });

      // Load logos
      const [plpBase64, ccsBase64] = await Promise.all([
        imageUrlToBase64(plpLogo),
        imageUrlToBase64(ccsLogo)
      ]);

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const footerHeight = 18;
      const headerHeightFirstPage = 62;
      const headerHeightSubPages = 16;

      // ============================================
      // COLORS
      // ============================================
      const C = {
        primary: [17, 58, 26],       // Ivy green (banner, headers)
        primaryLight: [22, 101, 52],  // Lighter green for accents
        accent: [34, 130, 68],        // Medium green for lines
        white: [255, 255, 255],
        offWhite: [245, 249, 246],
        lightGreen: [232, 245, 235],
        lightGray: [230, 232, 230],
        midGray: [150, 155, 152],
        textDark: [35, 40, 38],
        textMuted: [110, 118, 114],
      };

      // ============================================
      // HELPER: Draw page 1 header
      // ============================================
      const drawFirstPageHeader = () => {
        // Green banner background
        doc.setFillColor(...C.primary);
        doc.rect(0, 0, pageWidth, 38, 'F');

        // White accent line at bottom of banner
        doc.setFillColor(...C.white);
        doc.rect(0, 38, pageWidth, 0.6, 'F');

        // Geometric corner markers (white on green)
        doc.setDrawColor(...C.white);
        doc.setLineWidth(0.6);
        doc.line(margin - 2, 5, margin - 2, 12);
        doc.line(margin - 2, 5, margin + 5, 5);
        doc.line(pageWidth - margin + 2, 5, pageWidth - margin + 2, 12);
        doc.line(pageWidth - margin + 2, 5, pageWidth - margin - 5, 5);

        // Logos
        if (plpBase64) doc.addImage(plpBase64, "PNG", margin + 2, 9, 20, 20);
        if (ccsBase64) doc.addImage(ccsBase64, "PNG", pageWidth - 22 - margin, 9, 20, 20);

        // Institution text (white on green)
        doc.setTextColor(...C.white);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("PAMANTASAN NG LUNGSOD NG PASIG", pageWidth / 2, 16, { align: "center" });

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(220, 235, 225);
        doc.text("COLLEGE OF COMPUTER STUDIES", pageWidth / 2, 22, { align: "center" });

        doc.setFontSize(7);
        doc.setTextColor(180, 220, 190);
        doc.text("STUDENT VIOLATION MANAGEMENT SYSTEM  //  ISAMS", pageWidth / 2, 27.5, { align: "center" });

        // Data strip at bottom of banner
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(170, 210, 180);
        doc.text(`GENERATED: ${now}`, margin + 2, 34.5);
        doc.text(`${previewData.length} RECORDS`, pageWidth - margin - 2, 34.5, { align: "right" });

        // Report title area (below banner)
        doc.setTextColor(...C.primary);
        doc.setFontSize(15);
        doc.setFont("helvetica", "bold");
        doc.text(title.toUpperCase(), margin, 48);

        // Green accent line under title
        doc.setDrawColor(...C.accent);
        doc.setLineWidth(0.4);
        doc.line(margin, 51, margin + 50, 51);

        // Date on right
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.textMuted);
        doc.text(`${now}`, pageWidth - margin, 48, { align: "right" });
      };

      // ============================================
      // HELPER: Compact header (pages 2+)
      // ============================================
      const drawSubPageHeader = () => {
        doc.setFillColor(...C.primary);
        doc.rect(0, 0, pageWidth, 11, 'F');

        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...C.white);
        doc.text(`ISAMS  //  ${title.toUpperCase()}`, margin, 7);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(180, 220, 190);
        doc.text(`${now}`, pageWidth - margin, 7, { align: "right" });
      };

      // ============================================
      // HELPER: Footer
      // ============================================
      const drawFooter = (pageNumber, totalPages) => {
        const footerY = pageHeight - footerHeight;

        // Green accent line
        doc.setFillColor(...C.accent);
        doc.rect(margin, footerY, pageWidth - margin * 2, 0.3, 'F');

        // Disclaimer
        doc.setFontSize(5.5);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(...C.midGray);
        doc.text("Electronically generated  ·  No signature required for internal circulation", margin, footerY + 5);

        // Branding
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6);
        doc.setTextColor(...C.primary);
        doc.text("PLP-ISAMS  //  STUDENT VIOLATION MANAGEMENT SYSTEM", pageWidth / 2, footerY + 5, { align: "center" });

        // Page number
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...C.textMuted);
        doc.setFontSize(7);
        doc.text(`${String(pageNumber).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}`, pageWidth - margin, footerY + 5, { align: "right" });

        // Bottom bar
        doc.setFillColor(...C.primary);
        doc.rect(0, pageHeight - 2, pageWidth, 2, 'F');
      };

      // Draw first page header
      drawFirstPageHeader();

      // --- TABLE ---
      const headers = columnDefs.map(c => c.headerName.toUpperCase());
      const fields = columnDefs.map(c => c.field);
      const rows = previewData.map(row => fields.map(f => row[f] ?? ""));

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: headerHeightFirstPage,
        styles: { 
          fontSize: 7.5, 
          cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
          font: "helvetica",
          textColor: C.textDark,
          lineColor: C.lightGray,
          lineWidth: 0.15,
          overflow: 'linebreak'
        },
        headStyles: { 
          fillColor: C.primary, 
          textColor: C.white, 
          fontStyle: "bold",
          fontSize: 7,
          halign: "center",
          valign: "middle",
          cellPadding: { top: 4, right: 4, bottom: 4, left: 4 }
        },
        alternateRowStyles: { 
          fillColor: C.offWhite
        },
        columnStyles: {
          status: { halign: 'center', fontStyle: 'bold' },
          severity: { halign: 'center' },
          incident_display: { halign: 'center' },
          date: { halign: 'center' },
          deadline: { halign: 'center' }
        },
        margin: { top: headerHeightSubPages, left: margin, right: margin, bottom: footerHeight + 4 },
        didDrawPage: (data) => {
          if (data.pageNumber > 1) {
            drawSubPageHeader();
          }
        }
      });

      // Draw footer on all pages
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawFooter(i, totalPages);
      }

      doc.save(`${selectedType}_report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const title = getReportTitle();
      const wb = new ExcelJS.Workbook();
      wb.creator = "ISAMS";
      wb.created = new Date();

      const ws = wb.addWorksheet(title);

      // Load logos
      const [plpBase64, ccsBase64] = await Promise.all([
        imageUrlToBase64(plpLogo),
        imageUrlToBase64(ccsLogo)
      ]);

      // Add Headers manually to manage space for the formal header
      const headers = columnDefs.map(c => c.headerName);
      const fields = columnDefs.map(c => c.field);
      const startDataRow = 8;

      // School Name
      ws.mergeCells(1, 1, 1, headers.length);
      const schoolCell = ws.getCell(1, 1);
      schoolCell.value = "Pamantasan ng Lungsod ng Pasig";
      schoolCell.font = { bold: true, size: 16 };
      schoolCell.alignment = { horizontal: "center", vertical: "middle" };

      // College name
      ws.mergeCells(2, 1, 2, headers.length);
      const collegeCell = ws.getCell(2, 1);
      collegeCell.value = "College of Computer Studies";
      collegeCell.font = { size: 12 };
      collegeCell.alignment = { horizontal: "center", vertical: "middle" };

      // System name
      ws.mergeCells(3, 1, 3, headers.length);
      const systemCell = ws.getCell(3, 1);
      systemCell.value = "Student Violation Management System";
      systemCell.font = { size: 10, italic: true, color: { argb: "FF666666" } };
      systemCell.alignment = { horizontal: "center", vertical: "middle" };

      // Report Title
      ws.mergeCells(5, 1, 5, headers.length);
      const titleCell = ws.getCell(5, 1);
      titleCell.value = title.toUpperCase();
      titleCell.font = { bold: true, size: 14 };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };

      // Generation Info
      ws.mergeCells(6, 1, 6, headers.length);
      const genCell = ws.getCell(6, 1);
      genCell.value = `Date Generated: ${new Date().toLocaleString()}`;
      genCell.font = { size: 9, color: { argb: "FF666666" } };
      genCell.alignment = { horizontal: "center", vertical: "middle" };

      // Add Logos to Excel if available
      if (plpBase64) {
        const plpImage = wb.addImage({
          base64: plpBase64.split(",")[1],
          extension: "png",
        });
        ws.addImage(plpImage, {
          tl: { col: 0, row: 0 },
          ext: { width: 80, height: 80 },
          editAs: "oneCell"
        });
      }

      if (ccsBase64) {
        const ccsImage = wb.addImage({
          base64: ccsBase64.split(",")[1],
          extension: "png",
        });
        ws.addImage(ccsImage, {
          tl: { col: headers.length - 1, row: 0 },
          ext: { width: 80, height: 80 },
          editAs: "oneCell"
        });
      }

      // Render Table Headers
      const headerRow = ws.getRow(startDataRow);
      headerRow.values = headers;
      headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF16A34A" } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          bottom: { style: "thin", color: { argb: "FF000000" } },
        };
      });

      // Data rows
      previewData.forEach((row, idx) => {
        ws.addRow(fields.map(f => row[f] ?? ""));
      });

      // Auto-width columns
      ws.columns.forEach((col, i) => {
        let maxLen = headers[i]?.length || 10;
        previewData.forEach(row => {
          const val = String(row[fields[i]] ?? "");
          if (val.length > maxLen) maxLen = val.length;
        });
        col.width = Math.min(maxLen + 4, 50);
      });

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `${selectedType}_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error("Excel export error:", err);
    } finally {
      setIsExporting(false);
    }
  };


  return (
    <div className="space-y-8 flex flex-col h-full animate-in fade-in duration-500 text-left bg-neutral-50 px-2">
      {/* PAGE HEADER */}
      <header className="mb-2 text-left shrink-0">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Generate Report</h1>
        <p className="text-neutral-500 text-sm font-medium mt-1">Export disciplinary and student records for documentation and review</p>
      </header>

      {/* CONFIGURATION ROW — Report Type, Filters, Export side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Report Type */}
        <section>
          <h3 className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <SlidersHorizontal size={14} /> Select report type
          </h3>
          <div className="space-y-3">
            {REPORT_TYPES.map(type => (
              <ReportOption
                key={type.id}
                {...type}
                active={selectedType === type.id}
                onClick={() => setSelectedType(type.id)}
              />
            ))}
          </div>
        </section>

        {/* 2. Filters */}
        <section>
          <h3 className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Filter size={14} /> Filters
          </h3>
          <div className="space-y-4 p-5 rounded-xl bg-white border border-neutral-200 shadow-sm">
            {selectedType !== "students" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">From</label>
                  <Input
                    type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="h-9 bg-white border-neutral-200 text-sm font-medium text-neutral-900"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">To</label>
                  <Input
                    type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="h-9 bg-white border-neutral-200 text-sm font-medium text-neutral-900"
                  />
                </div>
              </div>
            )}

            <SelectDropdown
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS[selectedType]}
              placeholder="All statuses"
            />

            {selectedType === "violations" && (
              <SelectDropdown
                label="Severity"
                value={severityFilter}
                onChange={setSeverityFilter}
                options={SEVERITY_OPTIONS}
                placeholder="All severities"
              />
            )}

            <button
              onClick={() => { setStartDate(""); setEndDate(""); setStatusFilter(""); setSeverityFilter(""); }}
              className="text-[12px] font-semibold text-primary-600 hover:text-primary-700 transition-colors mt-1"
            >
              Clear all filters
            </button>
          </div>
        </section>

        {/* 3. Export Actions */}
        <section>
          <h3 className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Download size={14} /> Export
          </h3>
          <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-neutral-900 tracking-tight">{getReportTitle()}</h4>
                <p className="text-[12px] text-neutral-500 font-medium mt-0.5">
                  {isLoading ? "Loading..." : `${previewData.length} record${previewData.length !== 1 ? "s" : ""} found`}
                </p>
              </div>
              {isExporting && <Loader2 className="h-5 w-5 animate-spin text-primary-600" />}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={exportToPDF}
                disabled={previewData.length === 0 || isExporting}
                className="flex-1 bg-destructive-semantic/90 hover:bg-destructive-semantic text-white font-bold text-sm h-10 rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <FileText className="mr-2 h-4 w-4" /> PDF
              </Button>
              <Button
                onClick={exportToExcel}
                disabled={previewData.length === 0 || isExporting}
                className="flex-1 bg-success/90 hover:bg-success text-white font-bold text-sm h-10 rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* FULL-WIDTH DATA PREVIEW */}
      <Card className="bg-white border-neutral-200 shadow-sm flex flex-col rounded-xl overflow-hidden p-0 z-10">
        <div className="px-5 pt-5 pb-2 flex items-center justify-between bg-white relative z-20">
          <div className="flex items-center gap-2">
            <Calendar className="h-[15px] w-[15px] text-neutral-600" />
            <h3 className="text-[15px] font-bold text-neutral-900 uppercase tracking-wider leading-none">Data Preview</h3>
          </div>
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
            {isLoading ? "Loading..." : `${previewData.length} records`}
          </span>
        </div>
        <div className="w-full hide-ag-scrollbars [&_.ag-root-wrapper]:border-none [&_.ag-header]:border-t-0 -mt-[15px]" style={{ height: "520px" }}>
          <style>{`
            .hide-ag-scrollbars .ag-body-viewport::-webkit-scrollbar,
            .hide-ag-scrollbars .ag-body-vertical-scroll-viewport::-webkit-scrollbar,
            .hide-ag-scrollbars .ag-body-horizontal-scroll-viewport::-webkit-scrollbar {
              display: none !important;
              width: 0 !important;
              height: 0 !important;
            }
            .hide-ag-scrollbars .ag-body-viewport,
            .hide-ag-scrollbars .ag-body-vertical-scroll-viewport,
            .hide-ag-scrollbars .ag-body-horizontal-scroll-viewport {
              -ms-overflow-style: none !important;
              scrollbar-width: none !important;
            }
          `}</style>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-neutral-400 pt-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm font-medium">Fetching records...</span>
            </div>
          ) : previewData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-neutral-400 pt-8">
              <FileText size={40} strokeWidth={1.5} />
              <span className="text-sm font-medium">No records match the current filters</span>
            </div>
          ) : (
            <AgGridReact
              theme={customTheme}
              rowData={previewData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              animateRows={true}
              rowHeight={48}
              headerHeight={44}
              pagination={true}
              paginationPageSize={15}
              suppressCellFocus={true}
            />
          )}
        </div>
      </Card>
    </div>
  );
};


// --- Status Badge Helper ---
const StatusBadge = ({ value }) => {
  const colorMap = {
    Pending: "text-warning bg-warning",
    "Under Investigation": "text-info bg-info",
    Sanctioned: "text-purple-600 bg-purple-500",
    Resolved: "text-success bg-success",
    Dismissed: "text-neutral-500 bg-neutral-500",
    "Not Started": "text-neutral-500 bg-neutral-400",
    "In Progress": "text-info bg-info",
    Completed: "text-success bg-success",
    Overdue: "text-destructive-semantic bg-destructive-semantic",
    Enrolled: "text-success bg-success",
    LOA: "text-warning bg-warning",
    Dropped: "text-destructive-semantic bg-destructive-semantic",
    Expelled: "text-destructive-semantic bg-destructive-semantic",
    Graduated: "text-info bg-info",
  };
  const classes = colorMap[value] || "text-neutral-500 bg-neutral-500";
  const [textColor, dotColor] = classes.split(" ");

  return (
    <div className="flex items-center h-full">
      <span className={`flex items-center text-[12px] font-bold ${textColor}`}>
        <span className={`mr-2 h-1.5 w-1.5 rounded-full ${dotColor}`} />
        {value}
      </span>
    </div>
  );
};


export default GenerateReport;
