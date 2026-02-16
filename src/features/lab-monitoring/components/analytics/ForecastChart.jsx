import React from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const data = [
    { week: "W1", actual: 820, predicted: 810 },
    { week: "W2", actual: 910, predicted: 890 },
    { week: "W3", actual: 875, predicted: 920 },
    { week: "W4", actual: 960, predicted: 950 },
    { week: "W5", actual: null, predicted: 985 },
    { week: "W6", actual: null, predicted: 1020 },
    { week: "W7", actual: null, predicted: 970 },
    { week: "W8", actual: null, predicted: 1050 },
];

const chartConfig = {
    actual: { label: "Actual", color: "#38bdf8" },
    predicted: { label: "Predicted", color: "#f59e0b" },
};

export default function ForecastChart() {
    return (
        <ChartContainer config={chartConfig} className="w-full h-[250px]">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <ChartTooltip
                    cursor={{ stroke: "#334155", strokeWidth: 1, strokeDasharray: "4 4" }}
                    content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                            <div style={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                                <p style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4, fontWeight: 700 }}>{label}</p>
                                {payload.map((entry, i) => (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: entry.color }} />
                                        <span style={{ color: "#e2e8f0", fontSize: 12 }}>{entry.name}</span>
                                        <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginLeft: 4 }}>{entry.value ?? "—"}</span>
                                    </div>
                                ))}
                            </div>
                        );
                    }}
                />
                <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="var(--color-actual)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#020617", stroke: "var(--color-actual)", strokeWidth: 2 }}
                    connectNulls={false}
                />
                <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="var(--color-predicted)"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={{ r: 3, fill: "#020617", stroke: "var(--color-predicted)", strokeWidth: 2 }}
                />
            </LineChart>
        </ChartContainer>
    );
}
