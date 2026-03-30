import React, { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

const chartConfig = {
    hours: { label: "Total Hours", color: "var(--primary-500)" },
};

export default function PCUsageHistoryChart({ rawLogs = [] }) {
    
    const chartData = useMemo(() => {
        if (!rawLogs || rawLogs.length === 0) return [];

        const monthlyStats = {};

        rawLogs.forEach(log => {
            // Only calculate for completed PC sessions
            if (!log.time_in || !log.time_out || log.log_type !== 'PC') return;

            const dateObj = new Date(log.time_in);
            const monthKey = dateObj.toLocaleDateString('en-US', { month: 'short' }); // "Jan", "Feb"
            const yearKey = dateObj.getFullYear();
            
            // Create a sortable key like "2026-01" so the months stay in chronological order
            const sortKey = `${yearKey}-${dateObj.getMonth().toString().padStart(2, '0')}`;

            if (!monthlyStats[sortKey]) {
                monthlyStats[sortKey] = { month: monthKey, hours: 0, sortKey };
            }

            // Calculate duration in hours
            const hours = (new Date(log.time_out) - dateObj) / 3600000;
            
            // Ignore glitched logs (e.g., someone left logged in for 40 hours)
            if (hours > 0 && hours < 24) {
                monthlyStats[sortKey].hours += hours;
            }
        });

        // Convert to array, sort chronologically, and round the hours
        return Object.values(monthlyStats)
            .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
            .map(stat => ({
                month: stat.month,
                hours: Math.round(stat.hours)
            }));
    }, [rawLogs]);

    if (!chartData.length) {
        return (
            <div className="w-full h-[250px] mt-4 flex items-center justify-center text-neutral-500 font-mono text-xs uppercase tracking-widest border border-dashed border-neutral-200 rounded-lg">
                Insufficient Historical Data
            </div>
        );
    }

    return (
        <div className="space-y-4 mt-2">
            <ChartContainer config={chartConfig} className="w-full h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                        <defs>
                            <linearGradient id="pcUsageGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary-500)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--primary-500)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-200)" vertical={false} />
                        <XAxis 
                            dataKey="month" 
                            stroke="var(--neutral-500)" 
                            fontSize={11} 
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
                            cursor={{ stroke: "var(--neutral-300)", strokeWidth: 1, strokeDasharray: "4 4" }}
                            content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null;
                                return (
                                    <div style={{ backgroundColor: "#ffffff", border: "1px solid var(--neutral-200)", borderRadius: 8, padding: "8px 12px", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
                                        <p style={{ color: "var(--neutral-500)", fontSize: 11, marginBottom: 4, fontWeight: 700 }}>{label}</p>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: "var(--primary-500)" }} />
                                            <span style={{ color: "var(--neutral-900)", fontSize: 12 }}>Total Hours</span>
                                            <span style={{ color: "var(--neutral-900)", fontSize: 13, fontWeight: 700, marginLeft: 4 }}>{payload[0].value}</span>
                                        </div>
                                    </div>
                                );
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="hours"
                            stroke="var(--color-hours)"
                            strokeWidth={3}
                            fill="url(#pcUsageGradient)"
                            dot={{ r: 4, fill: "#ffffff", stroke: "var(--color-hours)", strokeWidth: 2 }}
                            activeDot={{ r: 6, fill: "var(--color-hours)", stroke: "#ffffff", strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartContainer>
        </div>
    );
}