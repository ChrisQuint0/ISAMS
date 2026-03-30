import React, { useMemo } from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { 
    ChartContainer, 
    ChartTooltip 
} from "@/components/ui/chart";

const chartConfig = {
    total_users: {
        label: "Total Logins",
        color: "var(--primary-500)", 
    },
};

export default function UsageChart({ rawLogs = [] }) {

    // Process the raw database logs into daily totals
    const chartData = useMemo(() => {
        if (!rawLogs || rawLogs.length === 0) return [];

        const dailyCounts = {};

        rawLogs.forEach(log => {
            if (!log.time_in) return;
            
            // Extract the date and ignore the time so we can group by day
            const dateObj = new Date(log.time_in);
            const dateKey = dateObj.toISOString().split('T')[0]; // e.g., "2026-03-05"
            
            if (!dailyCounts[dateKey]) {
                dailyCounts[dateKey] = {
                    dateObj: dateObj,
                    total_users: 0
                };
            }
            dailyCounts[dateKey].total_users += 1;
        });

        // Sort chronologically so the line chart flows left-to-right correctly
        return Object.keys(dailyCounts)
            .sort((a, b) => new Date(a) - new Date(b))
            .map(dateKey => {
                const dateObj = dailyCounts[dateKey].dateObj;
                return {
                    // Formats "2026-03-05" into "Mar 5" for a cleaner X-Axis
                    day: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    total_users: dailyCounts[dateKey].total_users
                };
            });
    }, [rawLogs]);

    // Fallback state if the database has no records for the selected date range
    if (!chartData.length) {
        return (
            <div className="w-full h-[250px] mt-4 flex items-center justify-center text-neutral-500 font-mono text-xs uppercase tracking-widest border border-dashed border-neutral-200 rounded-lg">
                No Data Available
            </div>
        );
    }

    return (
        <ChartContainer config={chartConfig} className="w-full h-[250px] mt-4">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-200)" vertical={false} />
                
                <XAxis 
                    dataKey="day" 
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
                    cursor={{ stroke: 'var(--neutral-300)', strokeWidth: 1, strokeDasharray: '4 4' }} 
                    content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                            <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--neutral-200)', borderRadius: 8, padding: '8px 12px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                                <p style={{ color: 'var(--neutral-500)', fontSize: 11, marginBottom: 4, fontWeight: 700 }}>{label}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: 'var(--primary-500)' }} />
                                    <span style={{ color: 'var(--neutral-900)', fontSize: 12 }}>Total Logins</span>
                                    <span style={{ color: 'var(--neutral-900)', fontSize: 13, fontWeight: 700, marginLeft: 4 }}>{payload[0].value}</span>
                                </div>
                            </div>
                        );
                    }}
                />
                
                <Line 
                    type="monotone" 
                    dataKey="total_users" 
                    name="Total Logins"
                    stroke="var(--color-total_users)" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#ffffff", stroke: "var(--color-total_users)", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "var(--color-total_users)", stroke: "#ffffff", strokeWidth: 2 }}
                />
            </LineChart>
        </ChartContainer>
    );
}