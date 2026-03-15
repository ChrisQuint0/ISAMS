import React, { useMemo } from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

const chartConfig = {
    score: { label: "Avg Health Score", color: "#34d399" }, // Emerald green
};

export default function PCHealthChart({ rawLogs = [] }) {
    
    // Generate Synthetic Telemetry based on actual usage wear-and-tear
    const chartData = useMemo(() => {
        if (!rawLogs || rawLogs.length === 0) return [];

        const weeklyStats = {};

        // Group logs by Week and calculate total running hours
        rawLogs.forEach(log => {
            // Only calculate wear-and-tear for actual PCs (ignore Laptops)
            if (!log.time_in || log.log_type !== 'PC') return;
            
            const dateObj = new Date(log.time_in);
            
            // Get the Monday of this week to use as a label
            const day = dateObj.getDay();
            const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(dateObj.setDate(diff));
            const weekKey = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            if (!weeklyStats[weekKey]) {
                weeklyStats[weekKey] = { usageHours: 0 };
            }

            // Calculate duration of the session
            if (log.time_out) {
                const hours = (new Date(log.time_out) - new Date(log.time_in)) / 3600000;
                if (hours > 0 && hours < 12) {
                    weeklyStats[weekKey].usageHours += hours;
                }
            }
        });

        // Sort chronologically
        const sortedWeeks = Object.keys(weeklyStats).sort((a, b) => new Date(a + " 2026") - new Date(b + " 2026"));

        // Simulate the hardware health curve
        // Start at a realistic 98% health. For every 50 hours of collective lab usage, health drops by ~0.5%
        let currentHealth = 98.5;

        return sortedWeeks.map(week => {
            const hours = weeklyStats[week].usageHours;
            
            // The heavier the lab is used, the more the health drops
            const wearAndTear = (hours / 50) * 0.5;
            currentHealth = Math.max(70, currentHealth - wearAndTear); // Floor it at 70% so it doesn't drop to 0

            // Occasionally simulate a "maintenance bump" if usage was very low (IT admins cleaned the PCs)
            if (hours < 10 && currentHealth < 95) {
                currentHealth += 1.5; 
            }

            return {
                timeframe: week,
                score: parseFloat(currentHealth.toFixed(1))
            };
        });

    }, [rawLogs]);

    if (!chartData.length) {
        return (
            <div className="w-full h-[250px] mt-4 flex items-center justify-center text-slate-500 font-mono text-xs uppercase tracking-widest border border-dashed border-slate-800 rounded-lg">
                Insufficient PC Data
            </div>
        );
    }

    return (
        <ChartContainer config={chartConfig} className="w-full h-[250px] mt-4">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                    dataKey="timeframe" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10} 
                />
                {/* Fixed the domain from 70 to 100 so the line movements look drastic and readable */}
                <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    domain={[70, 100]} 
                />
                <ChartTooltip
                    cursor={{ stroke: "#334155", strokeWidth: 1, strokeDasharray: "4 4" }}
                    content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                            <div style={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                                <p style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4, fontWeight: 700 }}>Week of {label}</p>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: "#34d399" }} />
                                    <span style={{ color: "#e2e8f0", fontSize: 12 }}>Avg. Health</span>
                                    <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginLeft: 4 }}>{payload[0].value}%</span>
                                </div>
                            </div>
                        );
                    }}
                />
                <Line
                    type="monotone"
                    dataKey="score"
                    stroke="var(--color-score)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#020617", stroke: "var(--color-score)", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "var(--color-score)", stroke: "#fff", strokeWidth: 2 }}
                />
            </LineChart>
        </ChartContainer>
    );
}