import React, { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

const chartConfig = {
    sessions: { label: "Sessions", color: "var(--primary-500)" }, // Primary Green
};

export default function SectionUsageChart({ rawLogs = [] }) {
    
    // Process the raw logs directly from your Supabase hook
    const chartData = useMemo(() => {
        if (!rawLogs || rawLogs.length === 0) return [];

        const sectionCounts = {};

        rawLogs.forEach(log => {
            // Safely grab and stitch the section block together
            const student = log.students_lists_lm;
            const section = student 
                ? `${student.course || ''}${student.year_level || ''}${student.section_block || ''}` 
                : "Unknown";
                
            sectionCounts[section] = (sectionCounts[section] || 0) + 1;
        });

        // Convert to array, sort highest to lowest, and take the Top 8
        return Object.keys(sectionCounts)
            .map(section => ({
                section: section,
                sessions: sectionCounts[section]
            }))
            .sort((a, b) => b.sessions - a.sessions)
            .slice(0, 8); // Keep it to top 8 so the bars don't get too thin
    }, [rawLogs]);

    // Fallback state
    if (!chartData.length) {
        return (
            <div className="w-full h-[250px] mt-4 flex items-center justify-center text-neutral-500 font-mono text-xs uppercase tracking-widest border border-dashed border-neutral-200 rounded-lg">
                No Data Available
            </div>
        );
    }

    return (
        <div className="space-y-4 mt-2">
            {/* Added a subtle dynamic subtitle to explain the data */}
            <div className="flex items-center gap-2 px-1">
                <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                    Top {chartData.length} Active Sections
                </span>
            </div>

            <ChartContainer config={chartConfig} className="w-full h-[250px]">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-200)" vertical={false} />
                    
                    <XAxis 
                        dataKey="section" 
                        stroke="var(--neutral-500)" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={10} 
                    />
                    <YAxis 
                        stroke="var(--neutral-500)" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                    />
                    
                    <ChartTooltip
                        cursor={{ fill: "var(--neutral-100)" }}
                        content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            return (
                                <div style={{ backgroundColor: "#ffffff", border: "1px solid var(--neutral-200)", borderRadius: 8, padding: "8px 12px", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
                                    <p style={{ color: "var(--neutral-500)", fontSize: 11, marginBottom: 4, fontWeight: 700 }}>{label}</p>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: "var(--primary-500)" }} />
                                        <span style={{ color: "var(--neutral-900)", fontSize: 12 }}>Sessions</span>
                                        <span style={{ color: "var(--neutral-900)", fontSize: 13, fontWeight: 700, marginLeft: 4 }}>{payload[0].value}</span>
                                    </div>
                                </div>
                            );
                        }}
                    />
                    
                    <Bar dataKey="sessions" radius={[6, 6, 0, 0]} barSize={36}>
                        {chartData.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                // Highlight the #1 top section with a brighter primary, rest are slightly muted
                                fill={index === 0 ? "var(--primary-500)" : "var(--primary-600)"} 
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ChartContainer>
        </div>
    );
}