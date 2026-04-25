import React, { useMemo } from "react";

export default function SectionAttendanceTable({ rawLogs = [] }) {

    const tableData = useMemo(() => {
        if (!rawLogs || rawLogs.length === 0) return [];

        const sectionsData = {};

        // Group logs by section and count daily attendance
        rawLogs.forEach(log => {
            if (!log.time_in) return;

            // STITCHING LOGIC: Combine Course, Year, and Block
            const student = log.students_lists_lm;
            const section = student
                ? `${student.course || ''}${student.year_level || ''}${student.section_block || ''}`
                : "Unknown";

            const dateKey = new Date(log.time_in).toISOString().split('T')[0];

            if (!sectionsData[section]) {
                sectionsData[section] = {
                    total: 0,
                    days: new Set(),
                    dailyCounts: {}
                };
            }

            sectionsData[section].total += 1;
            sectionsData[section].days.add(dateKey);
            sectionsData[section].dailyCounts[dateKey] = (sectionsData[section].dailyCounts[dateKey] || 0) + 1;
        });

        // Calculate the metrics for each section
        return Object.keys(sectionsData).map(section => {
            const data = sectionsData[section];
            const uniqueDays = data.days.size || 1;
            const avg = (data.total / uniqueDays).toFixed(1); // e.g. 34.6

            // Clever Rate Calculation: 
            // Assume the day with the absolute highest attendance represents the 100% enrolled class size.
            const estimatedClassSize = Math.max(...Object.values(data.dailyCounts));
            const expectedTotal = estimatedClassSize * uniqueDays;

            const rateStr = expectedTotal > 0
                ? Math.round((data.total / expectedTotal) * 100) + "%"
                : "—";

            return {
                section,
                total: data.total,
                avg,
                rate: rateStr,
                // Trend comparison would require historical data; using a visual dash for now
                trend: "-"
            };
        })
            .sort((a, b) => b.total - a.total) // Sort by highest total sessions
            .slice(0, 5); // Perfectly fits your UI card

    }, [rawLogs]);

    if (!tableData.length) {
        return (
            <div className="w-full h-[200px] flex items-center justify-center text-neutral-500 font-mono text-xs uppercase tracking-widest border border-dashed border-neutral-200 rounded-lg">
                No Data Available
            </div>
        );
    }

    return (
        <div className="overflow-hidden">
            <div className="grid grid-cols-5 gap-2 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-neutral-600 border-b border-neutral-200">
                <span>Section</span>
                <span className="text-right">Total</span>
                <span className="text-right">Avg/Day</span>
                <span className="text-right">Rate</span>
                <span className="text-right">Trend</span>
            </div>
            {tableData.map((s, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 px-3 py-2.5 text-xs border-b border-neutral-200/50 last:border-b-0 hover:bg-neutral-100 transition-colors">
                    <span className="font-bold text-neutral-900">{s.section}</span>
                    <span className="text-right text-neutral-700 font-mono">{s.total}</span>
                    <span className="text-right text-neutral-700 font-mono">{s.avg}</span>
                    <span className="text-right text-neutral-800 font-bold">{s.rate}</span>
                    <span className="text-right font-bold text-neutral-600">{s.trend}</span>
                </div>
            ))}
        </div>
    );
}