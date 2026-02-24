import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function exportToExcel(data, filename, sheetName = "Data") {
  try {
    // Create a new workbook
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Write the file
    XLSX.writeFile(wb, filename);
    return { success: true };
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    return { success: false, error: error.message };
  }
}

export function exportToCSV(data, filename) {
  try {
    const csv = XLSX.utils.json_to_csv(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, filename);
    return { success: true };
  } catch (error) {
    console.error("Error exporting to CSV:", error);
    return { success: false, error: error.message };
  }
}

export function exportToPDF(
  {
    title,
    subtitle,
    filters,
    timestamp,
    data,
    columns,
  },
  filename
) {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 15;

    // Add title
    doc.setFontSize(18);
    doc.text(title, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;

    // Add subtitle if provided
    if (subtitle) {
      doc.setFontSize(12);
      doc.text(subtitle, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 8;
    }

    // Add metadata
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated: ${timestamp}`, 15, yPosition);
    yPosition += 6;

    // Add filters if provided
    if (filters && Object.keys(filters).length > 0) {
      doc.text("Filters Applied:", 15, yPosition);
      yPosition += 5;
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          doc.text(`  ${key}: ${value}`, 20, yPosition);
          yPosition += 4;
        }
      });
      yPosition += 2;
    }

    // Add table
    if (data && data.length > 0) {
      doc.setTextColor(0);
      doc.autoTable({
        startY: yPosition,
        head: [columns],
        body: data.map((row) =>
          columns.map((col) => {
            const value = row[col];
            if (Array.isArray(value)) return value.join(", ");
            if (typeof value === "object") return JSON.stringify(value);
            return value || "";
          })
        ),
        margin: { top: 15, right: 15, bottom: 15, left: 15 },
        didDrawPage: function (data) {
          // Footer
          const pageCount = doc.internal.getPages().length;
          doc.setFontSize(9);
          doc.text(
            `Page ${doc.internal.getCurrentPageInfo().pageNumber}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: "center" }
          );
        },
      });
    }

    doc.save(filename);
    return { success: true };
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    return { success: false, error: error.message };
  }
}

export function generateFilename(reportType) {
  const date = new Date().toISOString().split("T")[0];
  const timestamp = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return `${reportType}_Report_${date}_${timestamp}`;
}

export function formatDate(date) {
  if (!date) return "";
  if (typeof date === "string") {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getFilterSummary(filters) {
  const summary = [];
  if (filters.dateFrom && filters.dateTo) {
    summary.push(`${filters.dateFrom} to ${filters.dateTo}`);
  }
  if (filters.department && filters.department !== "All") {
    summary.push(`Department: ${filters.department}`);
  }
  if (filters.category && filters.category !== "All") {
    summary.push(`Category: ${filters.category}`);
  }
  if (filters.coordinator && filters.coordinator !== "All") {
    summary.push(`Coordinator: ${filters.coordinator}`);
  }
  if (filters.completionStatus && filters.completionStatus !== "All") {
    summary.push(`Status: ${filters.completionStatus}`);
  }
  return summary.length > 0 ? summary.join(" | ") : "No filters applied";
}
