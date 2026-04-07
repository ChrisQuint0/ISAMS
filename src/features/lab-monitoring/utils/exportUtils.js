import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// --- UTILITIES ---

const formatAMPM = (timeStr) => {
    if (!timeStr) return "N/A";
    let [h, m] = timeStr.split(':');
    let hours = parseInt(h);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${(hours % 12 || 12).toString().padStart(2, '0')}:${m} ${ampm}`;
};

const getMinutesEarly = (log) => {
    const schedTime = log.lab_schedules_lm?.time_end;
    if (!log.time_out || !schedTime) return 0;
    const actualOut = new Date(log.time_out);
    const manilaOut = new Date(actualOut.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
    const outMins = (manilaOut.getHours() * 60) + manilaOut.getMinutes();
    const [h, m] = schedTime.split(':');
    const schedMins = (parseInt(h) * 60) + parseInt(m);
    return Math.max(0, schedMins - outMins);
};

const getReportMonth = (logs) => logs?.length ? new Date(logs[0].time_in).toLocaleString('default', { month: 'long', year: 'numeric' }) : "N/A";

const calculateForecastingMetrics = (rawLogs) => {
    const daysMap = { 'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 'Thursday': 0, 'Friday': 0, 'Saturday': 0 };
    const hoursMap = {};
    const weeks = {};

    rawLogs.forEach(l => {
        const d = new Date(l.time_in);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        const hour = d.getHours();

        daysMap[dayName]++;
        hoursMap[hour] = (hoursMap[hour] || 0) + 1;

        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay());
        const weekKey = startOfWeek.toLocaleDateString();
        if (!weeks[weekKey]) weeks[weekKey] = { actual: 0 };
        weeks[weekKey].actual++;
    });

    const peakDay = Object.keys(daysMap).reduce((a, b) => daysMap[a] > daysMap[b] ? a : b);
    const peakHourRaw = Object.keys(hoursMap).reduce((a, b) => hoursMap[a] > hoursMap[b] ? a : b, "0");
    const totalLogs = rawLogs.length;

    return {
        summary: {
            peakDay: peakDay.substring(0, 3),
            peakHour: formatAMPM(`${peakHourRaw}:00`),
            totalSessions: totalLogs,
            laptopProjection: Math.round(totalLogs * 0.06)
        },
        table: Object.entries(weeks).sort((a, b) => new Date(a[0]) - new Date(b[0])).map(([week, data]) => {
            const prediction = data.actual + Math.ceil(data.actual * 0.04);
            const util = Math.round((data.actual / 200) * 100);

            return [
                `Week of ${week}`,
                data.actual,
                prediction,
                `${util}%`,
                util > 80 ? "PEAK SURGE" : "OPTIMAL"
            ];
        })
    };
};

const calculateLifecycleData = (rawLogs, maintenanceThreshold = 500) => {
    const pcMap = {};
    for (let i = 1; i <= 40; i++) pcMap[`PC-${i.toString().padStart(2, '0')}`] = 0;
    rawLogs.forEach(l => {
        if (l.pc_no && l.time_in && l.time_out && l.log_type === 'PC') {
            const hrs = (new Date(l.time_out) - new Date(l.time_in)) / 3600000;
            const k = l.pc_no.includes('PC-') ? l.pc_no : `PC-${l.pc_no.padStart(2, '0')}`;
            if (pcMap[k] !== undefined) pcMap[k] += hrs;
        }
    });
    return Object.entries(pcMap).sort(([a], [b]) => a.localeCompare(b)).map(([no, hrs]) => {
        const health = Math.max(0, 100 - (hrs / (maintenanceThreshold / 100))).toFixed(1);
        const availableRunway = Math.max(0, Math.round(maintenanceThreshold - hrs));

        let status = "GOOD";
        if (hrs >= maintenanceThreshold) status = "CRITICAL";
        else if (hrs >= maintenanceThreshold * 0.8) status = "FAIR";

        return { no, hrs: Math.round(hrs), health: `${health}%`, runway: availableRunway, status };
    });
};

// --- STANDARDIZED HEADERS ---

const drawPDFHeader = (doc, labName, month, isOverflow = false, subtitle = null) => {
    const centerX = 105;
    doc.setFont("helvetica", "bold").setFontSize(16);
    doc.text("INTEGRATED SMART ACADEMIC MANAGEMENT SYSTEM", centerX, 12, { align: "center" });
    if (!isOverflow) {
        doc.setFontSize(9).setFont("helvetica", "normal");
        doc.text(subtitle || "Laboratory Management Module — Official Attendance Documentation", centerX, 18, { align: "center" });
        doc.line(10, 21, 200, 21);
        doc.setFontSize(10).setFont("helvetica", "bold").text(`MONTHLY AUDIT: ${month.toUpperCase()}`, 10, 27);
        doc.setFontSize(8).setFont("helvetica", "normal").text(`LABORATORY: ${labName}`, 10, 31);
        doc.text(`GENERATED: ${new Date().toLocaleString()}`, 200, 31, { align: "right" });
    }
};

const drawExcelHeader = (sheet, title, lastCol, month, labName) => {
    sheet.mergeCells(1, 1, 1, lastCol);
    const t1 = sheet.getCell(1, 1);
    t1.value = "INTEGRATED SMART ACADEMIC MANAGEMENT SYSTEM";
    t1.font = { bold: true, size: 14 };
    t1.alignment = { horizontal: 'center' };
    sheet.mergeCells(2, 1, 2, lastCol);
    const t2 = sheet.getCell(2, 1);
    t2.value = title;
    t2.font = { size: 10 };
    t2.alignment = { horizontal: 'center' };
    sheet.getRow(4).getCell(1).value = `MONTHLY AUDIT: ${month.toUpperCase()}`;
    sheet.getRow(4).getCell(1).font = { bold: true };
    sheet.getRow(5).getCell(1).value = `LABORATORY: ${labName}`;
    sheet.getRow(5).getCell(lastCol).value = `GENERATED: ${new Date().toLocaleString()}`;
    sheet.getRow(5).getCell(lastCol).alignment = { horizontal: 'right' };
};

// --- PDF EXPORTS ---

export const handleAttendancePDF = (rawLogs, labName) => {
    const doc = new jsPDF({ orientation: "portrait", format: "a4", unit: "mm" });
    const month = getReportMonth(rawLogs);
    const grouped = rawLogs.reduce((acc, log) => {
        const d = new Date(log.time_in).toLocaleDateString();
        if (!acc[d]) acc[d] = [];
        acc[d].push(log);
        return acc;
    }, {});

    Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b)).forEach((date, i) => {
        if (i > 0) doc.addPage();
        drawPDFHeader(doc, labName, month);
        doc.setFillColor(30, 41, 59).rect(10, 35, 190, 6, 'F');
        doc.setTextColor(255, 255, 255).setFontSize(8).setFont("helvetica", "bold").text(`DATE: ${date}`, 14, 39);
        doc.setTextColor(0, 0, 0);
        const sorted = grouped[date].sort((a, b) => (a.students_lists_lm?.full_name || "").localeCompare(b.students_lists_lm?.full_name || ""));
        autoTable(doc, {
            startY: 41,
            head: [["Student ID", "Full Name", "Section", "PC No", "Time In", "Time Out"]],
            body: sorted.map(l => [l.students_lists_lm?.student_no, l.students_lists_lm?.full_name, `${l.students_lists_lm?.course}${l.students_lists_lm?.year_level}${l.students_lists_lm?.section_block}`, l.pc_no, new Date(l.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), l.time_out ? new Date(l.time_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Ongoing"]),
            theme: 'grid', headStyles: { fillColor: [51, 65, 85] }, tableWidth: 190, margin: { left: 10 }
        });
    });
    doc.save(`Attendance_${labName}.pdf`);
};

export const handleHardwareHealthPDF = (rawLogs, labName, monthLabel) => {
    const doc = new jsPDF({ orientation: "portrait", format: "a4", unit: "mm" });
    const month = monthLabel || getReportMonth(rawLogs);
    const pcMap = {};
    for (let i = 1; i <= 40; i++) pcMap[`PC-${i.toString().padStart(2, '0')}`] = 0;
    rawLogs.forEach(l => {
        if (l.pc_no && l.time_in && l.time_out && l.log_type === 'PC') {
            const hrs = (new Date(l.time_out) - new Date(l.time_in)) / 3600000;
            if (hrs > 0 && hrs < 12) {
                const k = l.pc_no.includes('PC-') ? l.pc_no : `PC-${l.pc_no.padStart(2, '0')}`;
                if (pcMap[k] !== undefined) pcMap[k] += hrs;
            }
        }
    });
    const data = Object.entries(pcMap).sort(([a], [b]) => a.localeCompare(b)).map(([n, h]) => [n, Math.round(h), h > 200 ? "MAINTENANCE REQUIRED" : "OPERATIONAL"]);
    drawPDFHeader(doc, labName, month, false, "Laboratory Management Module — Hardware Usage Audit");
    autoTable(doc, {
        startY: 41, head: [["PC Unit", "Accumulated Hrs", "Status"]], body: data,
        theme: 'grid', headStyles: { fillColor: [51, 65, 85] }, tableWidth: 190, margin: { left: 10 },
        didParseCell: (d) => { if (d.section === 'body' && d.column.index === 2 && d.cell.raw === "MAINTENANCE REQUIRED") d.cell.styles.textColor = [220, 38, 38]; }
    });
    doc.save(`Hardware_Audit_${labName}.pdf`);
};

export const handleEarlyDismissalPDF = (rawLogs, labName) => {
    const doc = new jsPDF({ orientation: "portrait", format: "a4", unit: "mm" });
    const month = getReportMonth(rawLogs);
    const early = rawLogs.filter(l => getMinutesEarly(l) > 5);
    const grouped = early.reduce((acc, log) => {
        const d = new Date(log.time_in).toLocaleDateString();
        if (!acc[d]) acc[d] = [];
        acc[d].push(log);
        return acc;
    }, {});

    const keys = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));

    if (keys.length === 0) {
        drawPDFHeader(doc, labName, month, false, "Laboratory Management Module — Early Dismissal Audit Log");
        doc.setFontSize(10).setFont("helvetica", "italic").text("No early dismissals recorded for this period.", 105, 50, { align: "center" });
    } else {
        keys.forEach((date, i) => {
            if (i > 0) doc.addPage();
            drawPDFHeader(doc, labName, month, false, "Laboratory Management Module — Early Dismissal Audit Log");
            doc.setFillColor(30, 41, 59).rect(10, 35, 190, 6, 'F');
            doc.setTextColor(255, 255, 255).setFontSize(8).setFont("helvetica", "bold").text(`SESSION DATE: ${date}`, 14, 39);
            doc.setTextColor(0, 0, 0);
            const sorted = grouped[date].sort((a, b) => (a.students_lists_lm?.full_name || "").localeCompare(b.students_lists_lm?.full_name || ""));
            autoTable(doc, {
                startY: 41,
                head: [["Student Name", "Section", "Actual Out", "Sched. End", "Early By (Mins)"]],
                body: sorted.map(l => [l.students_lists_lm?.full_name, `${l.students_lists_lm?.course}${l.students_lists_lm?.year_level}${l.students_lists_lm?.section_block}`, new Date(l.time_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), formatAMPM(l.lab_schedules_lm?.time_end), getMinutesEarly(l)]),
                theme: 'grid', headStyles: { fillColor: [51, 65, 85] }, tableWidth: 190, margin: { left: 10 }
            });
        });
    }

    doc.save(`Early_Dismissal_${labName}.pdf`);
};

export const handleSectionSummaryPDF = (rawLogs, labName) => {
    const doc = new jsPDF({ orientation: "portrait", format: "a4", unit: "mm" });
    const month = getReportMonth(rawLogs);
    const sections = {};
    rawLogs.forEach(log => {
        const s = log.students_lists_lm;
        if (!s) return;
        const key = `${s.course}${s.year_level}${s.section_block}`;
        if (!sections[key]) sections[key] = { sessions: 0, students: new Set() };
        sections[key].sessions++;
        sections[key].students.add(s.student_no);
    });
    const sortedData = Object.entries(sections).sort(([a], [b]) => a.localeCompare(b)).map(([name, d]) => [name, d.sessions, d.students.size, d.sessions > 50 ? "HIGH" : "MODERATE"]);

    drawPDFHeader(doc, labName, month, false, "Laboratory Management Module — Section Attendance Summary");
    doc.setFillColor(30, 41, 59).rect(10, 35, 190, 6, 'F');
    doc.setTextColor(255, 255, 255).setFontSize(8).setFont("helvetica", "bold").text("OVERALL SECTION ACTIVITY ANALYSIS", 14, 39);
    doc.setTextColor(0, 0, 0);

    autoTable(doc, {
        startY: 41,
        head: [["Section Name", "Total Lab Sessions", "Unique Students", "Activity Status"]],
        body: sortedData,
        theme: 'grid', headStyles: { fillColor: [51, 65, 85] }, tableWidth: 190, margin: { left: 10 }
    });
    doc.save(`Section_Summary_${labName}.pdf`);
};

export const handleForecastingPDF = (rawLogs, labName) => {
    const doc = new jsPDF({ orientation: "portrait", format: "a4", unit: "mm" });
    const month = getReportMonth(rawLogs);
    const data = calculateForecastingMetrics(rawLogs);
    drawPDFHeader(doc, labName, month, false, "Laboratory Management Module — Usage Forecasting & Predictive Analytics");
    doc.setFillColor(30, 41, 59).rect(10, 35, 190, 20, 'F');
    doc.setTextColor(255, 255, 255).setFontSize(7).setFont("helvetica", "bold");
    doc.text("CORE PREDICTIVE INSIGHTS", 14, 40);
    doc.setFontSize(10);
    doc.text(`PEAK DAY: ${data.summary.peakDay.toUpperCase()}`, 14, 48);
    doc.text(`PEAK HOUR: ${data.summary.peakHour}`, 60, 48);
    doc.text(`EST. LAPTOP USERS: ~${data.summary.laptopProjection}`, 110, 48);
    doc.text(`TOTAL SESSIONS: ${data.summary.totalSessions}`, 160, 48);
    doc.setTextColor(0, 0, 0);
    autoTable(doc, {
        startY: 58,
        head: [["Assessment Period", "Actual Traffic", "System Prediction", "Utilization", "Status"]],
        body: data.table,
        theme: 'grid', headStyles: { fillColor: [51, 65, 85] }, tableWidth: 190, margin: { left: 10 },
        didParseCell: (d) => {
            if (d.column.index === 4 && d.cell.raw === "PEAK SURGE") d.cell.styles.textColor = [185, 28, 28];
        }
    });
    doc.save(`Forecasting_${labName}.pdf`);
};

export const handlePCLifecyclePDF = (rawLogs, labName, monthLabel, threshold) => {
    const doc = new jsPDF({ orientation: "portrait", format: "a4", unit: "mm" });
    const month = monthLabel || getReportMonth(rawLogs);
    const data = calculateLifecycleData(rawLogs, threshold).map(p => [p.no, p.hrs, p.health, p.runway, p.status]);
    drawPDFHeader(doc, labName, month, false, "Laboratory Management Module — PC Lifecycle History Audit");
    doc.setFillColor(30, 41, 59).rect(10, 35, 190, 6, 'F');
    doc.setTextColor(255, 255, 255).setFontSize(8).setFont("helvetica", "bold").text("HARDWARE LONGEVITY & DEGRADATION TRACKING", 14, 39);
    doc.setTextColor(0, 0, 0);
    autoTable(doc, {
        startY: 41,
        head: [["Workstation", "Total Usage (Hrs)", "Health Score", "Available Runway (Hrs)", "Reliability"]],
        body: data,
        theme: 'grid',
        headStyles: { fillColor: [51, 65, 85] },
        tableWidth: 190,
        margin: { left: 10 },
        didParseCell: (d) => {
            if (d.section === 'body' && d.column.index === 4 && d.cell.raw === "CRITICAL") d.cell.styles.textColor = [220, 38, 38];
            if (d.section === 'body' && d.column.index === 4 && d.cell.raw === "FAIR") d.cell.styles.textColor = [202, 138, 4];
        }
    });
    doc.save(`PC_Lifecycle_History_${labName}.pdf`);
};

export const handleAuditTrailPDF = (formattedData, labName, dateFrom, dateTo) => {
    const doc = new jsPDF({ orientation: "landscape", format: "a4", unit: "mm" });

    // Header
    const centerX = 148.5; // A4 Landscape center
    doc.setFont("helvetica", "bold").setFontSize(16);
    doc.text("INTEGRATED SMART ACADEMIC MANAGEMENT SYSTEM", centerX, 12, { align: "center" });
    doc.setFontSize(9).setFont("helvetica", "normal");
    doc.text("Laboratory Management Module — Audit Trail Log", centerX, 18, { align: "center" });
    doc.line(10, 21, 287, 21);

    doc.setFontSize(10).setFont("helvetica", "bold").text(`DATE RANGE: ${dateFrom} to ${dateTo}`, 10, 27);
    doc.setFontSize(8).setFont("helvetica", "normal").text(`LABORATORY: ${labName}`, 10, 31);
    doc.text(`GENERATED: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })}`, 287, 31, { align: "right" });

    doc.setFillColor(30, 41, 59).rect(10, 35, 277, 6, 'F');
    doc.setTextColor(255, 255, 255).setFontSize(8).setFont("helvetica", "bold").text("SYSTEM AUDIT EVENTS", 14, 39);
    doc.setTextColor(0, 0, 0);

    const bodyData = formattedData.map(row => [
        row.timestamp,
        row.user,
        row.category,
        row.action,
        row.severity,
        row.description
    ]);

    autoTable(doc, {
        startY: 41,
        head: [["Timestamp", "Actor", "Category", "Action", "Severity", "Description"]],
        body: bodyData,
        theme: 'grid',
        headStyles: { fillColor: [51, 65, 85] },
        tableWidth: 277,
        margin: { left: 10 },
        columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 40 },
            2: { cellWidth: 30 },
            3: { cellWidth: 40 },
            4: { cellWidth: 25 },
            5: { cellWidth: 107 }
        },
        didParseCell: (d) => {
            if (d.section === 'body' && d.column.index === 4) {
                const val = d.cell.raw;
                if (val === "Critical") d.cell.styles.textColor = [220, 38, 38]; // Red
                else if (val === "Warning") d.cell.styles.textColor = [202, 138, 4]; // Amber
                else if (val === "Success") d.cell.styles.textColor = [16, 185, 129]; // Emerald
                else if (val === "Info") d.cell.styles.textColor = [14, 165, 233]; // Sky
            }
        }
    });

    doc.save(`Audit_Trail_${labName}_${new Date().toISOString().split('T')[0]}.pdf`);
};

// --- EXCEL EXPORTS ---

export const exportAttendanceExcel = async (rawLogs, labName) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Attendance');
    const month = getReportMonth(rawLogs);
    sheet.columns = [{ width: 18 }, { width: 35 }, { width: 15 }, { width: 10 }, { width: 15 }, { width: 15 }];
    drawExcelHeader(sheet, "Laboratory Management Module — Official Attendance Documentation", 6, month, labName);
    const grouped = rawLogs.reduce((acc, log) => {
        const d = new Date(log.time_in).toLocaleDateString();
        if (!acc[d]) acc[d] = [];
        acc[d].push(log);
        return acc;
    }, {});
    let cur = 7;
    Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b)).forEach(date => {
        sheet.mergeCells(cur, 1, cur, 6);
        const r = sheet.getCell(cur, 1);
        r.value = `DATE: ${date}`;
        r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
        r.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cur++;
        sheet.getRow(cur).values = ['STUDENT ID', 'FULL NAME', 'SECTION', 'PC NO', 'TIME IN', 'TIME OUT'];
        sheet.getRow(cur).font = { bold: true };
        cur++;
        grouped[date].sort((a, b) => (a.students_lists_lm?.full_name || "").localeCompare(b.students_lists_lm?.full_name || "")).forEach(l => {
            sheet.addRow([l.students_lists_lm?.student_no, l.students_lists_lm?.full_name, `${l.students_lists_lm?.course}${l.students_lists_lm?.year_level}${l.students_lists_lm?.section_block}`, l.pc_no, new Date(l.time_in).toLocaleTimeString(), l.time_out ? new Date(l.time_out).toLocaleTimeString() : "Ongoing"]);
            cur++;
        });
        cur++;
    });
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Attendance_${labName}.xlsx`);
};

export const exportHardwareHealthExcel = async (rawLogs, labName, monthLabel) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Hardware Health');
    const month = monthLabel || getReportMonth(rawLogs);

    sheet.columns = [{ width: 20 }, { width: 20 }, { width: 25 }];

    drawExcelHeader(sheet, "Laboratory Management Module — Hardware Usage Audit", 3, month, labName);

    const headerRow = sheet.getRow(7);
    headerRow.values = ['PC UNIT NO.', 'USAGE (HRS)', 'STATUS'];

    for (let i = 1; i <= 3; i++) {
        const cell = headerRow.getCell(i);
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF334155' }
        };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    }

    const pcMap = {};
    for (let i = 1; i <= 40; i++) pcMap[`PC-${i.toString().padStart(2, '0')}`] = 0;

    rawLogs.forEach(l => {
        if (l.pc_no && l.time_in && l.time_out && l.log_type === 'PC') {
            const hrs = (new Date(l.time_out) - new Date(l.time_in)) / 3600000;
            if (hrs > 0 && hrs < 12) {
                const k = l.pc_no.includes('PC-') ? l.pc_no : `PC-${l.pc_no.padStart(2, '0')}`;
                if (pcMap[k] !== undefined) pcMap[k] += hrs;
            }
        }
    });

    Object.entries(pcMap).sort(([a], [b]) => a.localeCompare(b)).forEach(([n, h]) => {
        const s = h > 200 ? "MAINTENANCE REQUIRED" : "OPERATIONAL";
        const r = sheet.addRow([n, Math.round(h), s]);
        if (s === "MAINTENANCE REQUIRED") r.getCell(3).font = { color: { argb: 'FFDC2626' }, bold: true };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Hardware_Excel_${labName}.xlsx`);
};

export const exportEarlyDismissalExcel = async (rawLogs, labName) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Early Dismissals');
    const month = getReportMonth(rawLogs);
    const early = rawLogs.filter(l => getMinutesEarly(l) > 5);
    sheet.columns = [{ width: 35 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 12 }];
    drawExcelHeader(sheet, "Laboratory Management Module — Early Dismissal Audit Log", 5, month, labName);
    const grouped = early.reduce((acc, log) => {
        const d = new Date(log.time_in).toLocaleDateString();
        if (!acc[d]) acc[d] = [];
        acc[d].push(log);
        return acc;
    }, {});
    const keys = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));
    let cur = 7;
    
    if (keys.length === 0) {
        sheet.mergeCells(cur, 1, cur, 5);
        const r = sheet.getCell(cur, 1);
        r.value = 'No early dismissals recorded for this period.';
        r.font = { italic: true };
        r.alignment = { horizontal: 'center' };
    } else {
        keys.forEach(date => {
            sheet.mergeCells(cur, 1, cur, 5);
            const r = sheet.getCell(cur, 1);
            r.value = `SESSION DATE: ${date}`;
            r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
            r.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            cur++;
            sheet.getRow(cur).values = ['STUDENT NAME', 'SECTION', 'ACTUAL OUT', 'SCHED. END', 'MINS EARLY'];
            sheet.getRow(cur).font = { bold: true };
            cur++;
            grouped[date].sort((a, b) => (a.students_lists_lm?.full_name || "").localeCompare(b.students_lists_lm?.full_name || "")).forEach(l => {
                sheet.addRow([l.students_lists_lm?.full_name, `${l.students_lists_lm?.course}${l.students_lists_lm?.year_level}`, new Date(l.time_out).toLocaleTimeString(), formatAMPM(l.lab_schedules_lm?.time_end), getMinutesEarly(l)]);
                cur++;
            });
            cur++;
        });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Early_Dismissal_${labName}.xlsx`);
};

export const exportSectionSummaryExcel = async (rawLogs, labName) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Section Summary');
    const month = getReportMonth(rawLogs);
    sheet.columns = [{ width: 25 }, { width: 20 }, { width: 20 }, { width: 20 }];
    drawExcelHeader(sheet, "Laboratory Management Module — Section Attendance Summary", 4, month, labName);
    const sections = {};
    rawLogs.forEach(log => {
        const s = log.students_lists_lm;
        if (!s) return;
        const key = `${s.course}${s.year_level}${s.section_block}`;
        if (!sections[key]) sections[key] = { s: 0, u: new Set() };
        sections[key].s++;
        sections[key].u.add(s.student_no);
    });
    sheet.mergeCells(7, 1, 7, 4);
    const b = sheet.getCell(7, 1);
    b.value = "OVERALL SECTION ACTIVITY ANALYSIS";
    b.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
    b.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    sheet.getRow(8).values = ['SECTION NAME', 'TOTAL SESSIONS', 'UNIQUE STUDENTS', 'STATUS'];
    sheet.getRow(8).font = { bold: true };
    Object.entries(sections).sort(([a], [b]) => a.localeCompare(b)).forEach(([n, d]) => {
        sheet.addRow([n, d.s, d.u.size, d.s > 50 ? "HIGH" : "MODERATE"]);
    });
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Section_Summary_${labName}.xlsx`);
};

export const exportForecastingExcel = async (rawLogs, labName) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Usage Forecast');
    const month = getReportMonth(rawLogs);
    const data = calculateForecastingMetrics(rawLogs);

    sheet.columns = [{ width: 25 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 20 }];
    drawExcelHeader(sheet, "Laboratory Management Module — Usage Forecasting & Predictive Analytics", 5, month, labName);

    // Summary Block
    sheet.mergeCells(7, 1, 7, 5);
    const sb = sheet.getCell(7, 1);
    sb.value = "DASHBOARD SUMMARY INSIGHTS";
    sb.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    sb.font = { color: { argb: 'FFFFFFFF' }, bold: true };

    sheet.getRow(8).values = [`PEAK DAY: ${data.summary.peakDay}`, `PEAK HOUR: ${data.summary.peakHour}`, `EST. LAPTOPS: ${data.summary.laptopProjection}`, "", `TOTAL: ${data.summary.totalSessions}`];
    sheet.getRow(8).font = { bold: true, size: 9 };

    sheet.getRow(10).values = ['PERIOD', 'ACTUAL TRAFFIC', 'PREDICTION', 'UTILIZATION', 'STATUS'];
    sheet.getRow(10).font = { bold: true };
    sheet.getRow(10).eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } }; c.font = { color: { argb: 'FFFFFFFF' } }; });

    data.table.forEach(row => {
        const r = sheet.addRow(row);
        if (row[4] === "PEAK SURGE") r.getCell(5).font = { color: { argb: 'FFB91C1C' }, bold: true };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Forecasting_${labName}.xlsx`);
};

export const exportPCLifecycleExcel = async (rawLogs, labName, monthLabel, threshold) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('PC Lifecycle');
    const month = monthLabel || getReportMonth(rawLogs);
    const data = calculateLifecycleData(rawLogs, threshold);
    sheet.columns = [{ width: 15 }, { width: 20 }, { width: 15 }, { width: 25 }, { width: 20 }];
    drawExcelHeader(sheet, "Laboratory Management Module — PC Lifecycle History Audit", 5, month, labName);
    sheet.getRow(7).values = ['PC UNIT', 'CUMULATIVE HRS', 'HEALTH %', 'AVAILABLE RUNWAY (HRS)', 'RELIABILITY'];
    sheet.getRow(7).eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } }; c.font = { color: { argb: 'FFFFFFFF' }, bold: true }; });
    data.forEach(p => {
        const r = sheet.addRow([p.no, p.hrs, p.health, p.runway, p.status]);
        if (p.status === "CRITICAL") r.getCell(5).font = { color: { argb: 'FFB91C1C' }, bold: true };
        if (p.status === "FAIR") r.getCell(5).font = { color: { argb: 'FFCA8A04' }, bold: true };
    });
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `PC_Lifecycle_History_${labName}.xlsx`);
};

export const handleAuditTrailExcel = async (formattedData, labName, dateFrom, dateTo) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Audit Trail');

    sheet.columns = [
        { width: 25 }, // Timestamp
        { width: 30 }, // Actor
        { width: 20 }, // Category
        { width: 30 }, // Action
        { width: 15 }, // Severity
        { width: 70 }  // Description
    ];

    sheet.mergeCells(1, 1, 1, 6);
    const t1 = sheet.getCell(1, 1);
    t1.value = "INTEGRATED SMART ACADEMIC MANAGEMENT SYSTEM";
    t1.font = { bold: true, size: 14 };
    t1.alignment = { horizontal: 'center' };

    sheet.mergeCells(2, 1, 2, 6);
    const t2 = sheet.getCell(2, 1);
    t2.value = "Laboratory Management Module — Audit Trail Log";
    t2.font = { size: 10 };
    t2.alignment = { horizontal: 'center' };

    sheet.getRow(4).getCell(1).value = `DATE RANGE: ${dateFrom} to ${dateTo}`;
    sheet.getRow(4).getCell(1).font = { bold: true };
    sheet.getRow(5).getCell(1).value = `LABORATORY: ${labName}`;
    sheet.getRow(5).getCell(6).value = `GENERATED: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" })}`;
    sheet.getRow(5).getCell(6).alignment = { horizontal: 'right' };

    const headerRow = sheet.getRow(7);
    headerRow.values = ['TIMESTAMP', 'ACTOR', 'CATEGORY', 'ACTION', 'SEVERITY', 'DESCRIPTION'];
    headerRow.eachCell(c => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
        c.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    });

    formattedData.forEach(row => {
        const r = sheet.addRow([
            row.timestamp,
            row.user,
            row.category,
            row.action,
            row.severity,
            row.description
        ]);

        const sevCell = r.getCell(5);
        if (row.severity === "Critical") sevCell.font = { color: { argb: 'FFDC2626' }, bold: true };
        else if (row.severity === "Warning") sevCell.font = { color: { argb: 'FFCA8A04' }, bold: true };
        else if (row.severity === "Success") sevCell.font = { color: { argb: 'FF10B981' }, bold: true };
        else if (row.severity === "Info") sevCell.font = { color: { argb: 'FF0EA5E9' }, bold: true };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Audit_Trail_${labName}_${new Date().toISOString().split('T')[0]}.xlsx`);
};