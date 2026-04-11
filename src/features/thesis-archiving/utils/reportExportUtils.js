import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// Assets
import plpLogo from "@/assets/images/plp_logo.png";
import ccsLogo from "@/assets/images/ccs_logo.png";

// ─────────────────────────────────────────────────────────────
// HELPER: Convert image URL/asset to Base64
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// BRAND COLORS (matching student-violations PDF palette)
// ─────────────────────────────────────────────────────────────
const C = {
  primary:      [17,  58,  26],   // Ivy green – banner, headers
  primaryLight: [22, 101,  52],   // Lighter green for accents
  accent:       [34, 130,  68],   // Medium green for lines
  white:        [255, 255, 255],
  offWhite:     [245, 249, 246],
  lightGreen:   [232, 245, 235],
  lightGray:    [230, 232, 230],
  midGray:      [150, 155, 152],
  textDark:     [35,  40,  38],
  textMuted:    [110, 118, 114],
};

// ─────────────────────────────────────────────────────────────
// EXCEL (XLSX) EXPORT  –  ExcelJS, branded with logos
// ─────────────────────────────────────────────────────────────
export async function exportToExcel(
  data,
  filename,
  sheetName = "Data",
  { logoUrl = null, collegeName = "College of Computing and Information Sciences" } = {}
) {
  try {
    if (!data || data.length === 0) throw new Error("No data to export");

    const headers = Object.keys(data[0]);

    // Load logos
    const [plpBase64, ccsBase64] = await Promise.all([
      imageUrlToBase64(plpLogo),
      imageUrlToBase64(logoUrl || ccsLogo),
    ]);

    const wb = new ExcelJS.Workbook();
    wb.creator = "ISAMS";
    wb.created = new Date();

    const ws = wb.addWorksheet(sheetName);

    const numCols = headers.length;

    // ── Row 1: School Name ───────────────────────────────────
    ws.mergeCells(1, 1, 1, numCols);
    const schoolCell = ws.getCell(1, 1);
    schoolCell.value = "Pamantasan ng Lungsod ng Pasig";
    schoolCell.font = { bold: true, size: 16 };
    schoolCell.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(1).height = 24;

    // ── Row 2: College Name ──────────────────────────────────
    ws.mergeCells(2, 1, 2, numCols);
    const collegeCell = ws.getCell(2, 1);
    collegeCell.value = collegeName;
    collegeCell.font = { size: 12 };
    collegeCell.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(2).height = 18;

    // ── Row 3: System Name ───────────────────────────────────
    ws.mergeCells(3, 1, 3, numCols);
    const systemCell = ws.getCell(3, 1);
    systemCell.value = "Thesis Archiving Module  //  ISAMS";
    systemCell.font = { size: 10, italic: true, color: { argb: "FF666666" } };
    systemCell.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(3).height = 16;

    // ── Row 4: spacer ────────────────────────────────────────
    ws.getRow(4).height = 6;

    // ── Row 5: Report Title ──────────────────────────────────
    ws.mergeCells(5, 1, 5, numCols);
    const titleCell = ws.getCell(5, 1);
    titleCell.value = sheetName.toUpperCase();
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(5).height = 22;

    // ── Row 6: Generation info ───────────────────────────────
    ws.mergeCells(6, 1, 6, numCols);
    const genCell = ws.getCell(6, 1);
    genCell.value = `Date Generated: ${new Date().toLocaleString()}  ·  Total Records: ${data.length}`;
    genCell.font = { size: 9, color: { argb: "FF666666" } };
    genCell.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(6).height = 14;

    // ── Row 7: spacer ────────────────────────────────────────
    ws.getRow(7).height = 6;

    // ── Logos ────────────────────────────────────────────────
    if (plpBase64) {
      const plpImg = wb.addImage({
        base64: plpBase64.split(",")[1],
        extension: "png",
      });
      ws.addImage(plpImg, {
        tl: { col: 0, row: 0 },
        ext: { width: 80, height: 80 },
        editAs: "oneCell",
      });
    }

    if (ccsBase64) {
      const ccsImg = wb.addImage({
        base64: ccsBase64.split(",")[1],
        extension: "png",
      });
      ws.addImage(ccsImg, {
        tl: { col: numCols - 1, row: 0 },
        ext: { width: 80, height: 80 },
        editAs: "oneCell",
      });
    }

    // ── Row 8: Column Headers ────────────────────────────────
    const headerRow = ws.getRow(8);
    headerRow.values = headers;
    headerRow.height = 20;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF113A1A" }, // C.primary
      };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: false };
      cell.border = {
        top:    { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        left:   { style: "thin", color: { argb: "FF000000" } },
        right:  { style: "thin", color: { argb: "FF000000" } },
      };
    });

    // ── Data Rows ────────────────────────────────────────────
    data.forEach((row, idx) => {
      const dataRow = ws.addRow(headers.map((h) => row[h] ?? ""));
      const isEven = idx % 2 === 0;
      dataRow.height = 17;
      dataRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: isEven ? "FFF5F9F6" : "FFFFFFFF" },
        };
        cell.font = { size: 10, color: { argb: "FF232826" } };
        cell.alignment = { vertical: "middle", horizontal: "left" };
        cell.border = {
          top:    { style: "thin", color: { argb: "FFE6E8E6" } },
          bottom: { style: "thin", color: { argb: "FFE6E8E6" } },
          left:   { style: "thin", color: { argb: "FFE6E8E6" } },
          right:  { style: "thin", color: { argb: "FFE6E8E6" } },
        };
      });
    });

    // ── Auto-width columns ───────────────────────────────────
    ws.columns.forEach((col, i) => {
      let maxLen = (headers[i] || "").length + 4;
      data.forEach((row) => {
        const val = String(row[headers[i]] ?? "");
        if (val.length + 2 > maxLen) maxLen = val.length + 2;
      });
      col.width = Math.min(maxLen, 52);
    });

    // ── Write file ───────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, filename);
    return { success: true };
  } catch (error) {
    console.error("Excel export error:", error);
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────────────────────
// CSV EXPORT  –  BOM, branded metadata header, clean quoting
// ─────────────────────────────────────────────────────────────
export function exportToCSV(data, filename, { collegeName = "College of Computing and Information Sciences" } = {}) {
  try {
    if (!data || data.length === 0) throw new Error("No data to export");

    const now     = new Date();
    const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const headers = Object.keys(data[0]);

    const quote = (v) => {
      if (v === null || v === undefined) return '""';
      const s = String(v).replace(/"/g, '""');
      return `"${s}"`;
    };

    const commas = headers.length > 1 ? ",".repeat(headers.length - 1) : "";

    const lines = [
      `"Pamantasan ng Lungsod ng Pasig"${commas}`,
      `"${collegeName}"${commas}`,
      `"Thesis Archiving Module  //  ISAMS"${commas}`,
      `""${commas}`,
      `"${filename.replace(/\.csv$/i, "").replace(/_/g, " ").toUpperCase()}"${commas}`,
      `"Date Generated: ${dateStr} ${timeStr}  ·  Total Records: ${data.length}"${commas}`,
      `""${commas}`,
      // ── Column headers ──
      headers.map(quote).join(","),
      // ── Data rows ──
      ...data.map((row) => headers.map((h) => quote(row[h])).join(",")),
    ];

    // UTF-8 BOM so Excel auto-detects encoding
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    saveAs(blob, filename);
    return { success: true };
  } catch (error) {
    console.error("CSV export error:", error);
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────────────────────
// PDF EXPORT  –  branded A4 layout matching student-violations
// ─────────────────────────────────────────────────────────────
export async function exportToPDF(
  { title, subtitle, filters, timestamp, data, columns },
  filename,
  { logoUrl = null, collegeName = "College of Computing and Information Sciences" } = {}
) {
  try {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageWidth  = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin     = 14;
    const footerH    = 18;
    const headerH1   = 62;   // first page header height
    const headerHn   = 16;   // subsequent page compact header

    const now = timestamp || new Date().toLocaleString(undefined, {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    // Load logos
    const [plpBase64, ccsBase64] = await Promise.all([
      imageUrlToBase64(plpLogo),
      imageUrlToBase64(logoUrl || ccsLogo),
    ]);

    // ── HELPER: First-page header ────────────────────────────
    const drawFirstPageHeader = () => {
      // Green banner background
      doc.setFillColor(...C.primary);
      doc.rect(0, 0, pageWidth, 38, "F");

      // White accent line at bottom of banner
      doc.setFillColor(...C.white);
      doc.rect(0, 38, pageWidth, 0.6, "F");

      // Corner markers
      doc.setDrawColor(...C.white);
      doc.setLineWidth(0.6);
      doc.line(margin - 2, 5, margin - 2, 12);
      doc.line(margin - 2, 5, margin + 5, 5);
      doc.line(pageWidth - margin + 2, 5, pageWidth - margin + 2, 12);
      doc.line(pageWidth - margin + 2, 5, pageWidth - margin - 5, 5);

      // Logos
      if (plpBase64) doc.addImage(plpBase64, "PNG", margin + 2, 9, 20, 20);
      if (ccsBase64) doc.addImage(ccsBase64, "PNG", pageWidth - 22 - margin, 9, 20, 20);

      // School name (white on green)
      doc.setTextColor(...C.white);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("PAMANTASAN NG LUNGSOD NG PASIG", pageWidth / 2, 16, { align: "center" });

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(220, 235, 225);
      doc.text(collegeName.toUpperCase(), pageWidth / 2, 22, { align: "center" });

      doc.setFontSize(7);
      doc.setTextColor(180, 220, 190);
      doc.text("THESIS ARCHIVING MODULE  //  ISAMS", pageWidth / 2, 27.5, { align: "center" });

      // Data strip
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(170, 210, 180);
      doc.text(`GENERATED: ${now}`, margin + 2, 34.5);
      doc.text(`${data?.length ?? 0} RECORDS`, pageWidth - margin - 2, 34.5, { align: "right" });

      // Report title (below banner)
      doc.setTextColor(...C.primary);
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.text(title.toUpperCase(), margin, 48);

      // Green accent under title
      doc.setDrawColor(...C.accent);
      doc.setLineWidth(0.4);
      doc.line(margin, 51, margin + 50, 51);

      // Subtitle on right
      if (subtitle) {
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.textMuted);
        doc.text(subtitle, pageWidth - margin, 48, { align: "right" });
      }
    };

    // ── HELPER: Compact header (pages 2+) ────────────────────
    const drawSubPageHeader = () => {
      doc.setFillColor(...C.primary);
      doc.rect(0, 0, pageWidth, 11, "F");

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.white);
      doc.text(`ISAMS  //  ${title.toUpperCase()}`, margin, 7);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(180, 220, 190);
      doc.text(`${now}`, pageWidth - margin, 7, { align: "right" });
    };

    // ── HELPER: Footer ───────────────────────────────────────
    const drawFooter = (pageNumber, totalPages) => {
      const fy = pageHeight - footerH;

      doc.setFillColor(...C.accent);
      doc.rect(margin, fy, pageWidth - margin * 2, 0.3, "F");

      doc.setFontSize(5.5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(...C.midGray);
      doc.text(
        "Electronically generated  ·  No signature required for internal circulation",
        margin, fy + 5
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(...C.primary);
      doc.text(
        "PLP-ISAMS  //  THESIS ARCHIVING MODULE",
        pageWidth / 2, fy + 5, { align: "center" }
      );

      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.textMuted);
      doc.setFontSize(7);
      doc.text(
        `${String(pageNumber).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}`,
        pageWidth - margin, fy + 5, { align: "right" }
      );

      // Bottom bar
      doc.setFillColor(...C.primary);
      doc.rect(0, pageHeight - 2, pageWidth, 2, "F");
    };

    // ── Draw first page header ───────────────────────────────
    drawFirstPageHeader();

    // ── Optional active filters strip ───────────────────────
    let startY = headerH1;

    const activeFilters = filters
      ? Object.entries(filters).filter(([, v]) => v && v !== "All" && v !== "")
      : [];

    if (activeFilters.length > 0) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.primaryLight);
      doc.text("APPLIED FILTERS", margin, startY);
      startY += 5;

      let filterCol = 0;
      const colW = (pageWidth - margin * 2 - 10) / 2;
      let filterY = startY;

      activeFilters.forEach(([key, value]) => {
        const displayKey = key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (s) => s.toUpperCase())
          .trim();
        const displayValue = String(value).length > 25 ? String(value).slice(0, 22) + "…" : String(value);
        const filterText = `${displayKey}: `;
        const xPos = margin + filterCol * colW;

        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...C.primaryLight);
        doc.text(filterText, xPos, filterY);

        const kw = doc.getTextWidth(filterText);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.textMuted);
        doc.text(displayValue, xPos + kw, filterY);

        filterCol++;
        if (filterCol >= 2) { filterCol = 0; filterY += 4.5; }
      });

      if (filterCol !== 0) filterY += 4.5;
      startY = filterY + 2;
    }

    // Divider above table
    doc.setDrawColor(...C.lightGray);
    doc.setLineWidth(0.3);
    doc.line(margin, startY, pageWidth - margin, startY);
    startY += 3;

    // ── Data Table ───────────────────────────────────────────
    if (data && data.length > 0) {
      const tableData = data.map((row) =>
        columns.map((col, i) => {
          const v = Array.isArray(row) ? row[i] : row[col];
          if (v == null) return "";
          if (Array.isArray(v)) return v.join(", ");
          const s = String(v);
          return s.length > 40 ? s.slice(0, 37) + "…" : s;
        })
      );

      autoTable(doc, {
        head: [columns.map((c) => c.toUpperCase())],
        body: tableData,
        startY: startY,
        styles: {
          font: "helvetica",
          fontSize: 7.5,
          cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
          textColor: C.textDark,
          lineColor: C.lightGray,
          lineWidth: 0.15,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: C.primary,
          textColor: C.white,
          fontStyle: "bold",
          fontSize: 7,
          halign: "center",
          valign: "middle",
          cellPadding: { top: 4, right: 4, bottom: 4, left: 4 },
        },
        alternateRowStyles: {
          fillColor: C.offWhite,
        },
        bodyStyles: {
          textColor: C.textDark,
          lineColor: C.lightGray,
          lineWidth: 0.15,
        },
        margin: {
          top: headerHn,
          left: margin,
          right: margin,
          bottom: footerH + 4,
        },
        didDrawPage: ({ pageNumber }) => {
          if (pageNumber > 1) drawSubPageHeader();
        },
      });
    } else {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.midGray);
      doc.text(
        "No records match the current filters.",
        pageWidth / 2, startY + 20, { align: "center" }
      );
    }

    // ── Footers on all pages ─────────────────────────────────
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawFooter(i, totalPages);
    }

    doc.save(filename);
    return { success: true };
  } catch (error) {
    console.error("PDF export error:", error);
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────
export function generateFilename(reportType) {
  const date = new Date();
  const d    = date.toISOString().split("T")[0];
  const t    = date
    .toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })
    .replace(/:/g, "-");
  return `${reportType}_Report_${d}_${t}`;
}

export function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function getFilterSummary(filters) {
  const map = {
    dateFrom:         (v, f) => f.dateTo ? `${v} → ${f.dateTo}` : `From ${v}`,
    dateTo:           (v, f) => f.dateFrom ? null : `Until ${v}`,
    year:             (v) => `Year: ${v}`,
    academicYear:     (v) => `SY: ${v}`,
    program:          (v) => `Program: ${v}`,
    section:          (v) => `Section: ${v}`,
    department:       (v) => `Dept: ${v}`,
    category:         (v) => `Category: ${v}`,
    coordinator:      (v) => `Coordinator: ${v}`,
    completionStatus: (v) => `Status: ${v}`,
  };
  const parts = [];
  for (const [k, fn] of Object.entries(map)) {
    const v = filters[k];
    if (!v || v === "All" || v === "") continue;
    const label = fn(v, filters);
    if (label) parts.push(label);
  }
  return parts.length > 0 ? parts.join(" · ") : "No filters applied";
}