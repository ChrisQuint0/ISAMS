import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// ─────────────────────────────────────────────────────────────
// BRAND CONSTANTS
// ─────────────────────────────────────────────────────────────
const BRAND = {
  green:      [0,   138,  69],
  greenDark:  [0,   100,  48],
  greenLight: [230, 247,  237],
  greenMid:   [0,   160,  80],
  white:      [255, 255, 255],
  gray50:     [248, 250, 249],
  gray100:    [236, 240, 238],
  gray300:    [200, 210, 205],
  gray500:    [120, 135, 128],
  gray700:    [65,  80,  72],
  gray900:    [25,  35,  30],
  amber:      [245, 158,  11],
  rose:       [244,  63,  94],
  emerald:    [ 16, 185, 129],
  violet:     [124,  58, 237],
};

// ─────────────────────────────────────────────────────────────
// EXCEL EXPORT  –  multi-sheet workbook with summary + data
// ─────────────────────────────────────────────────────────────
export function exportToExcel(data, filename, sheetName = "Data") {
  try {
    const wb = XLSX.utils.book_new();

    // ── 1.  SUMMARY sheet ────────────────────────────────────
    const now      = new Date();
    const dateStr  = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const timeStr  = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const summaryRows = [
      ["REPORT SUMMARY"],
      [],
      ["Report Type",    sheetName],
      ["Generated On",   dateStr],
      ["Generated At",   timeStr],
      ["Total Records",  data.length],
      ["Columns",        Object.keys(data[0] || {}).length],
      [],
      ["COLUMN INDEX"],
      ...Object.keys(data[0] || {}).map((col, i) => [i + 1, col]),
    ];

    const ws_summary = XLSX.utils.aoa_to_sheet(summaryRows);

    // Style the title cell
    ws_summary["A1"].s = {
      fill: { fgColor: { rgb: "00008A45" } },
      font: { bold: true, color: { rgb: "FFFFFFFF" }, sz: 14, name: "Arial" },
      alignment: { horizontal: "left", vertical: "center", wrapText: false },
      border: {
        bottom: { style: "double", color: { rgb: "00006B35" } },
      },
    };

    // Style section headers
    ["A9"].forEach((cell) => {
      if (ws_summary[cell]) {
        ws_summary[cell].s = {
          fill: { fgColor: { rgb: "00F5FAF7" } },
          font: { bold: true, color: { rgb: "00006B35" }, sz: 10, name: "Arial" },
          alignment: { horizontal: "left", vertical: "center" },
          border: {
            top: { style: "medium", color: { rgb: "008A45" } },
            bottom: { style: "medium", color: { rgb: "008A45" } },
          },
        };
      }
    });

    // Style label cells (left column)
    for (let i = 2; i <= 7; i++) {
      const cell = `A${i}`;
      if (ws_summary[cell]) {
        ws_summary[cell].s = {
          font: { bold: true, color: { rgb: "00333333" }, sz: 9, name: "Arial" },
          alignment: { horizontal: "left", vertical: "center" },
          fill: { fgColor: { rgb: "00F8F9F9" } },
        };
      }
      const valCell = `B${i}`;
      if (ws_summary[valCell]) {
        ws_summary[valCell].s = {
          font: { color: { rgb: "00333333" }, sz: 9, name: "Arial" },
          alignment: { horizontal: "left", vertical: "center" },
          fill: { fgColor: { rgb: "00FFFFFF" } },
        };
      }
    }

    // Style column index rows
    for (let i = 9; i < summaryRows.length; i++) {
      const cell = `A${i}`;
      if (ws_summary[cell]) {
        ws_summary[cell].s = {
          font: { bold: true, color: { rgb: "00006B35" }, sz: 8, name: "Arial" },
          alignment: { horizontal: "center", vertical: "center" },
          fill: { fgColor: { rgb: "00F5FAF7" } },
          border: { right: { style: "thin", color: { rgb: "00E0E0E0" } } },
        };
      }
      const colCell = `B${i}`;
      if (ws_summary[colCell]) {
        ws_summary[colCell].s = {
          font: { color: { rgb: "00333333" }, sz: 8, name: "Arial" },
          alignment: { horizontal: "left", vertical: "center" },
          fill: { fgColor: { rgb: "00FFFFFF" } },
        };
      }
    }

    // Column widths and row heights
    ws_summary["!cols"] = [{ wch: 18 }, { wch: 38 }];
    ws_summary["!rows"] = [
      { hpt: 28 },  // Title
      { hpt: 3 },   // Spacer
      { hpt: 18 },  // Report Type
      { hpt: 18 },  // Generated On
      { hpt: 18 },  // Generated At
      { hpt: 18 },  // Total Records
      { hpt: 18 },  // Columns
      { hpt: 3 },   // Spacer
      { hpt: 20 },  // Column Index header
    ];

    XLSX.utils.book_append_sheet(wb, ws_summary, "Summary");

    // ── 2.  DATA sheet ───────────────────────────────────────
    const ws = XLSX.utils.json_to_sheet(data);
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    const keys  = Object.keys(data[0] || {});

    // Column widths: content-aware, capped
    ws["!cols"] = keys.map((key) => ({
      wch: Math.min(
        Math.max(key.length + 4, ...(data || []).map((r) => String(r[key] ?? "").length + 2)),
        52
      ),
    }));

    // Row heights
    ws["!rows"] = [{ hpt: 26 }]; // header
    for (let r = 1; r <= range.e.r; r++) ws["!rows"][r] = { hpt: 19 };

    // Freeze pane
    ws["!freeze"] = { xSplit: 0, ySplit: 1 };

    // ── Header row styles ────────────────────────────────────
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c });
      if (!ws[addr]) continue;
      ws[addr].s = {
        fill: { fgColor: { rgb: "00008A45" } },
        font: { bold: true, color: { rgb: "FFFFFFFF" }, sz: 10, name: "Arial" },
        alignment: { horizontal: "center", vertical: "center", wrapText: false },
        border: {
          top:    { style: "medium", color: { rgb: "00006B35" } },
          bottom: { style: "medium", color: { rgb: "00006B35" } },
          left:   { style: "thin",   color: { rgb: "00006B35" } },
          right:  { style: "thin",   color: { rgb: "00006B35" } },
        },
      };
    }

    // ── Data row styles ──────────────────────────────────────
    for (let r = 1; r <= range.e.r; r++) {
      const even = r % 2 === 0;
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        if (!ws[addr]) continue;

        // Right-align numeric / percentage cells
        const val  = ws[addr].v;
        const isNum = typeof val === "number" ||
          (typeof val === "string" && /^\d+(\.\d+)?%?$/.test(val.trim()));

        ws[addr].s = {
          fill:      { fgColor: { rgb: even ? "00F5FAF7" : "00FFFFFF" } },
          font:      { color: { rgb: "00333333" }, sz: 9.5, name: "Arial" },
          alignment: { horizontal: isNum ? "right" : "left", vertical: "center" },
          border: {
            top:    { style: "thin", color: { rgb: "00EEEEEE" } },
            bottom: { style: "thin", color: { rgb: "00EEEEEE" } },
            left:   { style: "thin", color: { rgb: "00EEEEEE" } },
            right:  { style: "thin", color: { rgb: "00EEEEEE" } },
          },
        };
      }
    }

    // ── Totals row (if numeric columns exist) ────────────────
    const numericKeys = keys.filter((k) =>
      data.every((row) => row[k] === undefined || row[k] === null ||
        typeof row[k] === "number" || /^\d+(\.\d+)?$/.test(String(row[k])))
      && data.some((row) => typeof row[k] === "number")
    );

    if (numericKeys.length > 0) {
      const totalsRow = {};
      keys.forEach((k, i) => {
        if (i === 0) { totalsRow[k] = "TOTAL"; return; }
        if (numericKeys.includes(k)) {
          totalsRow[k] = data.reduce((s, row) => s + (Number(row[k]) || 0), 0);
        } else {
          totalsRow[k] = "";
        }
      });
      XLSX.utils.sheet_add_json(ws, [totalsRow], { skipHeader: true, origin: -1 });

      const totalsR = range.e.r + 1;
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r: totalsR, c });
        if (!ws[addr]) continue;
        
        const showBorder = true;
        ws[addr].s = {
          fill: { fgColor: { rgb: "00008A45" } },
          font: { bold: true, color: { rgb: "FFFFFFFF" }, sz: 10, name: "Arial" },
          alignment: { horizontal: c === 0 ? "left" : "right", vertical: "center" },
          border: showBorder ? {
            top:    { style: "double", color: { rgb: "00006B35" } },
            bottom: { style: "double", color: { rgb: "00006B35" } },
            left:   { style: "thin",   color: { rgb: "00006B35" } },
            right:  { style: "thin",   color: { rgb: "00006B35" } },
          } : {},
        };
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
    return { success: true };
  } catch (error) {
    console.error("Excel export error:", error);
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────────────────────
// CSV EXPORT  –  BOM + metadata header + clean quoting
// ─────────────────────────────────────────────────────────────
export function exportToCSV(data, filename, meta = {}) {
  try {
    if (!data || data.length === 0) throw new Error("No data to export");

    const now      = new Date();
    const dateStr  = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const timeStr  = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const headers  = Object.keys(data[0]);

    const quote = (v) => {
      if (v === null || v === undefined) return '""';
      const s = String(v).replace(/"/g, '""');
      return /[,"\n\r]/.test(s) ? `"${s}"` : `"${s}"`;
    };

    const lines = [
      // ── Minimal header info ──
      `# Thesis Report | Generated: ${dateStr} ${timeStr} | Records: ${data.length}`,
      // ── Column headers ──
      headers.map(quote).join(","),
      // ── Data rows ──
      ...data.map((row) => headers.map((h) => quote(row[h])).join(",")),
    ];

    // UTF-8 BOM for Excel auto-detection
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
// PDF EXPORT  –  professional branded A4 layout
// ─────────────────────────────────────────────────────────────
export function exportToPDF({ title, subtitle, filters, timestamp, data, columns }, filename) {
  try {
    const doc       = new jsPDF("p", "mm", "a4");
    const PW        = doc.internal.pageSize.getWidth();   // 210
    const PH        = doc.internal.pageSize.getHeight();  // 297
    const ML        = 15;   // margin left
    const MR        = 15;   // margin right
    const CW        = PW - ML - MR;
    let   Y         = 0;

    // ── Helpers ──────────────────────────────────────────────
    const rgb  = (arr) => ({ r: arr[0], g: arr[1], b: arr[2] });
    const setFill   = (c) => doc.setFillColor(...c);
    const setStroke = (c) => doc.setDrawColor(...c);
    const setColor  = (c) => doc.setTextColor(...c);
    const setFont   = (style, size) => { doc.setFont("helvetica", style); doc.setFontSize(size); };

    // ─────────────────────────────────────────────────────────
    // HEADER  –  minimal, clean
    // ─────────────────────────────────────────────────────────

    // Thin green top border — only decoration
    setFill(BRAND.green);
    doc.rect(0, 0, PW, 2, "F");

    // Title — dark, large, left-aligned
    setFont("bold", 20);
    setColor(BRAND.gray900);
    doc.text(title, ML, 18);

    // Subtitle — muted green, smaller
    if (subtitle) {
      setFont("normal", 9);
      setColor(BRAND.green);
      doc.text(subtitle, ML, 26);
    }

    // Hairline divider
    setStroke(BRAND.gray100);
    doc.setLineWidth(0.4);
    doc.line(ML, subtitle ? 31 : 23, PW - MR, subtitle ? 31 : 23);

    Y = subtitle ? 38 : 30;

    // ─────────────────────────────────────────────────────────
    // META ROW  (Generated · Records · Status)
    // ─────────────────────────────────────────────────────────
    const META_H = 12;
    setFill(BRAND.gray50);
    setStroke(BRAND.gray100);
    doc.setLineWidth(0.3);
    doc.rect(ML, Y, CW, META_H, "FD");

    const metaItems = [
      { label: "Generated",     value: timestamp },
      { label: "Total Records", value: String(data?.length ?? 0) },
    ];
    const colW = CW / metaItems.length;
    metaItems.forEach(({ label, value, highlight }, i) => {
      const x = ML + i * colW + 4;
      setFont("bold", 6.5);
      setColor(BRAND.gray500);
      doc.text(label.toUpperCase(), x, Y + 4);
      setFont("bold", 8);
      setColor(highlight ? BRAND.green : BRAND.gray900);
      doc.text(value, x, Y + 9.5);
    });

    Y += META_H + 6;

    // ─────────────────────────────────────────────────────────
    // FILTERS  (only if active)
    // ─────────────────────────────────────────────────────────
    const activeFilters = filters && Object.entries(filters)
      .filter(([, v]) => v && v !== "All" && v !== "");

    if (activeFilters && activeFilters.length > 0) {
      // Section label
      setFont("bold", 8);
      setColor(BRAND.greenDark);
      doc.text("APPLIED FILTERS", ML, Y);
      Y += 5;

      // Display filters as clean, simple list
      setFont("normal", 7.5);
      setColor(BRAND.gray700);

      let filterY = Y;
      let filterCol = 0;
      const colWidth = (CW - 10) / 2; // Two-column layout

      activeFilters.forEach(([key, value]) => {
        const displayKey = key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (s) => s.toUpperCase())
          .trim();

        const displayValue = value.length > 25 ? value.substring(0, 22) + "…" : value;
        const filterText = `${displayKey}: `;

        const xPos = ML + (filterCol * colWidth);

        // Key in bold green
        setColor(BRAND.greenDark);
        setFont("bold", 7.5);
        doc.text(filterText, xPos, filterY);

        // Value in regular gray
        const keyWidth = doc.getTextWidth(filterText);
        setColor(BRAND.gray700);
        setFont("normal", 7.5);
        doc.text(displayValue, xPos + keyWidth, filterY);

        filterCol++;
        if (filterCol >= 2) {
          filterCol = 0;
          filterY += 4.5;
        }
      });

      if (filterCol !== 0) filterY += 4.5;
      Y = filterY + 1;
    }

    // Divider above table
    setStroke(BRAND.gray300);
    doc.setLineWidth(0.3);
    doc.line(ML, Y, PW - MR, Y);
    Y += 4;

    // ─────────────────────────────────────────────────────────
    // DATA TABLE
    // ─────────────────────────────────────────────────────────
    if (data && data.length > 0) {
      // Truncate long cell values
      const tableData = data.map((row) =>
        columns.map((col, i) => {
          const v = Array.isArray(row) ? row[i] : row[col];
          if (v == null) return "";
          if (Array.isArray(v)) return v.join(", ");
          const s = String(v);
          return s.length > 40 ? s.slice(0, 37) + "…" : s;
        })
      );

      // Detect numeric columns for right-alignment
      const numericCols = columns.reduce((acc, col, i) => {
        const isNum = tableData.every((r) => r[i] === "" || /^[\d,.\-%]+$/.test(r[i]));
        if (isNum) acc.push(i);
        return acc;
      }, []);

      const colStyles = {};
      numericCols.forEach((i) => {
        colStyles[i] = { halign: "right", fontStyle: "bold" };
      });

      autoTable(doc, {
        startY: Y,
        head: [columns],
        body: tableData,
        margin: { top: 5, right: MR, bottom: 22, left: ML },

        // ── Overall styles ───────────────────────────────────
        styles: {
          font:           "helvetica",
          fontSize:       8,
          cellPadding:    { top: 3.5, right: 4, bottom: 3.5, left: 4 },
          overflow:       "linebreak",
          halign:         "left",
          valign:         "middle",
          textColor:      BRAND.gray700,
          lineColor:      BRAND.gray100,
          lineWidth:      0.15,
          minCellHeight:  7,
        },

        // ── Header row ───────────────────────────────────────
        headStyles: {
          fillColor:      BRAND.green,
          textColor:      BRAND.white,
          fontStyle:      "bold",
          fontSize:       8.5,
          halign:         "left",
          valign:         "middle",
          cellPadding:    { top: 4, right: 4, bottom: 4, left: 4 },
          minCellHeight:  9,
          lineColor:      BRAND.greenDark,
          lineWidth:      0.3,
        },

        // ── Alternating rows ─────────────────────────────────
        alternateRowStyles: {
          fillColor: BRAND.gray50,
        },
        bodyStyles: {
          textColor:  BRAND.gray700,
          lineColor:  BRAND.gray100,
          lineWidth:  0.15,
        },

        // ── Per-column styles ─────────────────────────────────
        columnStyles: colStyles,

        rowPageBreak: "avoid",


        // ── Page header & footer ──────────────────────────────
        didDrawPage: ({ pageNumber }) => {
          const total = doc.getNumberOfPages();

          // Minimal top border on continuation pages
          if (pageNumber > 1) {
            setFill(BRAND.green);
            doc.rect(0, 0, PW, 2, "F");
          }

          // Footer
          setFill(BRAND.gray50);
          doc.rect(0, PH - 14, PW, 14, "F");
          setStroke(BRAND.gray300);
          doc.setLineWidth(0.25);
          doc.line(ML, PH - 14, PW - MR, PH - 14);

          setFont("normal", 7);
          setColor(BRAND.gray500);
          doc.text("College of Computing and Information Sciences", ML, PH - 7.5);

          setFont("bold", 7);
          setColor(BRAND.gray700);
          doc.text(
            `Page ${pageNumber} of ${total}`,
            PW / 2,
            PH - 7.5,
            { align: "center" }
          );

          setFont("normal", 7);
          setColor(BRAND.gray500);
          const genText = `Generated ${timestamp}`;
          doc.text(genText, PW - MR - doc.getTextWidth(genText), PH - 7.5);
        },
      });
    } else {
      // Empty-state message
      setFont("normal", 10);
      setColor(BRAND.gray500);
      doc.text("No records match the current filters.", PW / 2, Y + 20, { align: "center" });
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
  const t    = date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })
                   .replace(/:/g, "-");
  return `${reportType}_Report_${d}_${t}`;
}

export function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function getFilterSummary(filters) {
  const map = {
    dateFrom:         (v, f) => f.dateTo ? `${v} → ${f.dateTo}` : `From ${v}`,
    dateTo:           (v, f) => f.dateFrom ? null : `Until ${v}`,   // handled above
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