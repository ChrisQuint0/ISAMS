import React, { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

const chartConfig = {
    count: { label: "Sessions", color: "#38bdf8" }, // Sky blue
};

export default function SessionDurationChart({ rawLogs = [] }) {
    
    // Process the raw logs to calculate session durations
    const chartData = useMemo(() => {
        if (!rawLogs || rawLogs.length === 0) return [];

        // Set up our empty buckets
        const buckets = {
            "< 30m": 0,
            "30m-1h": 0,
            "1h-2h": 0,
            "2h-3h": 0,
            "3h+": 0,
        };

        let validSessions = 0;

        rawLogs.forEach(log => {
            // We can only calculate duration if they have successfully logged out
            if (log.time_in && log.time_out) {
                const timeIn = new Date(log.time_in);
                const timeOut = new Date(log.time_out);
                
                // Calculate duration in minutes
                const durationMins = (timeOut - timeIn) / 60000;

                // Ignore glitched logs (negative time or someone left logged in for > 24 hours)
                if (durationMins >= 0 && durationMins < 1440) {
                    validSessions++;
                    
                    if (durationMins < 30) buckets["< 30m"]++;
                    else if (durationMins < 60) buckets["30m-1h"]++;
                    else if (durationMins < 120) buckets["1h-2h"]++;
                    else if (durationMins < 180) buckets["2h-3h"]++;
                    else buckets["3h+"]++;
                }
            }
        });

        // If no one has logged out yet in this date range, return empty
        if (validSessions === 0) return [];

        // Convert to the exact array format Recharts wants, preserving the logical order
        const order = ["< 30m", "30m-1h", "1h-2h", "2h-3h", "3h+"];
        return order.map(range => ({
            range,
            count: buckets[range]
        }));
    }, [rawLogs]);

    // Fallback UI if there are no completed sessions
    if (!chartData.length) {
        return (
            <div className="w-full h-[250px] mt-4 flex items-center justify-center text-slate-500 font-mono text-xs uppercase tracking-widest border border-dashed border-slate-800 rounded-lg">
                No Completed Sessions Available
            </div>
        );
    }

    // Find the max value so we can highlight the most common duration!
    const maxCount = Math.max(...chartData.map(d => d.count));

    return (
        <div className="space-y-4 mt-2">
            <ChartContainer config={chartConfig} className="w-full h-[250px]">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                        dataKey="range" 
                        stroke="#94a3b8" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={10} 
                    />
                    <YAxis 
                        stroke="#94a3b8" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                    />
                    <ChartTooltip
                        cursor={{ fill: "#0f172a" }}
                        content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            return (
                                <div style={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                                    <p style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4, fontWeight: 700 }}>{label}</p>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: "#38bdf8" }} />
                                        <span style={{ color: "#e2e8f0", fontSize: 12 }}>Sessions</span>
                                        <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginLeft: 4 }}>{payload[0].value}</span>
                                    </div>
                                </div>
                            );
                        }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36}>
                        {chartData.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                // Make the most common duration bright blue, and the others a darker muted blue
                                fill={entry.count === maxCount && maxCount > 0 ? "#38bdf8" : "#0284c7"} 
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ChartContainer>
        </div>
    );
}