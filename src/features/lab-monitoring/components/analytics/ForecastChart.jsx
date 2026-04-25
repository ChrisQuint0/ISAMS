import React, { useMemo } from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

const chartConfig = {
    actual: { label: "Actual", color: "var(--primary-500)" },
    predicted: { label: "Predicted", color: "var(--warning)" },
};

export default function ForecastChart({ rawLogs = [] }) {
    
    const chartData = useMemo(() => {
        if (!rawLogs.length) return [];

        // Group logs by Week
        const weeklyCounts = {};
        
        rawLogs.forEach(log => {
            if (!log.time_in) return;
            const dateObj = new Date(log.time_in);
            
            // Get the Monday of this week to use as a generic "Week Of" label
            const day = dateObj.getDay();
            const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
            const monday = new Date(dateObj.setDate(diff));
            const weekKey = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            weeklyCounts[weekKey] = (weeklyCounts[weekKey] || 0) + 1;
        });

        // Convert to array and sort chronologically
        const actualWeeks = Object.keys(weeklyCounts)
            .sort((a, b) => new Date(a) - new Date(b))
            .map(week => ({
                week,
                actual: weeklyCounts[week],
                predicted: Math.round(weeklyCounts[week] * (1 + (Math.random() * 0.05 - 0.02))) // Dummy historical prediction
            }));

        // We need at least 2 weeks of data to draw a meaningful trend line
        if (actualWeeks.length < 2) return [];

        // The "Forecast Engine": Generate 3 future weeks using a simple Moving Average
        const futureWeeks = [];
        let lastActualWeekDate = new Date(actualWeeks[actualWeeks.length - 1].week + " 2026"); // Assuming current year for simplicity
        
        for (let i = 1; i <= 3; i++) {
            // Calculate the date for the next week
            const nextWeekDate = new Date(lastActualWeekDate);
            nextWeekDate.setDate(lastActualWeekDate.getDate() + (7 * i));
            const weekStr = nextWeekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            // Calculate predicted value based on the average of the last 2 actual weeks + a slight upward trend
            const prev1 = actualWeeks[actualWeeks.length - 1].actual;
            const prev2 = actualWeeks[actualWeeks.length - 2].actual;
            const movingAvg = (prev1 + prev2) / 2;
            
            // Add a synthetic 3% growth trend per week
            const forecastedValue = Math.round(movingAvg * (1 + (0.03 * i)));

            futureWeeks.push({
                week: weekStr,
                actual: null, // It's in the future, so Actual is null (which stops the solid blue line from drawing)
                predicted: forecastedValue
            });
        }

        return [...actualWeeks, ...futureWeeks];
    }, [rawLogs]);

    if (!chartData.length) {
        return (
            <div className="w-full h-[250px] mt-4 flex items-center justify-center text-neutral-500 font-mono text-xs uppercase tracking-widest border border-dashed border-neutral-200 rounded-lg">
                Not enough data to generate forecast
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1 w-full">
            <ChartContainer config={chartConfig} className="w-full h-[200px]">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-200)" vertical={false} />
                    <XAxis dataKey="week" stroke="var(--neutral-500)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="var(--neutral-500)" fontSize={11} tickLine={false} axisLine={false} />
                    <ChartTooltip
                        cursor={{ stroke: "var(--neutral-300)", strokeWidth: 1, strokeDasharray: "4 4" }}
                        content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            return (
                                <div style={{ backgroundColor: "#ffffff", border: "1px solid var(--neutral-200)", borderRadius: 8, padding: "8px 12px", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
                                    <p style={{ color: "var(--neutral-500)", fontSize: 11, marginBottom: 4, fontWeight: 700 }}>Week of {label}</p>
                                    {payload.map((entry, i) => (
                                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: entry.color }} />
                                            <span style={{ color: "var(--neutral-900)", fontSize: 12 }}>{entry.name}</span>
                                            <span style={{ color: "var(--neutral-900)", fontSize: 13, fontWeight: 700, marginLeft: 4 }}>{entry.value ?? "—"}</span>
                                        </div>
                                    ))}
                                </div>
                            );
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="actual"
                        name="Actual Traffic"
                        stroke="var(--color-actual)"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#ffffff", stroke: "var(--color-actual)", strokeWidth: 2 }}
                        connectNulls={false}
                    />
                    <Line
                        type="monotone"
                        dataKey="predicted"
                        name="Forecasted Traffic"
                        stroke="var(--color-predicted)"
                        strokeWidth={2}
                        strokeDasharray="6 4"
                        dot={{ r: 3, fill: "#ffffff", stroke: "var(--color-predicted)", strokeWidth: 2 }}
                    />
                </LineChart>
            </ChartContainer>

            <div className="flex items-center gap-6 justify-start w-full px-3 pt-1">
                <div className="flex items-center gap-2">
                    <svg width="18" height="10" viewBox="0 0 18 10" className="flex-shrink-0">
                        <line x1="0" y1="5" x2="18" y2="5" stroke="var(--primary-500)" strokeWidth="3" />
                    </svg>
                    <span className="text-xs font-medium text-neutral-700">Actual</span>
                </div>

                <div className="flex items-center gap-2">
                    <svg width="18" height="10" viewBox="0 0 18 10" className="flex-shrink-0">
                        <line x1="0" y1="5" x2="18" y2="5" stroke="var(--warning)" strokeWidth="2" strokeDasharray="4 2" />
                    </svg>
                    <span className="text-xs font-medium text-neutral-700">Predicted</span>
                </div>
            </div>
        </div>
    );
}