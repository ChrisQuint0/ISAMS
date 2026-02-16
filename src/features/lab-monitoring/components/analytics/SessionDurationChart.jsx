import React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const data = [
    { range: "< 30m", count: 18 },
    { range: "30m-1h", count: 45 },
    { range: "1h-2h", count: 82 },
    { range: "2h-3h", count: 64 },
    { range: "3h+", count: 39 },
];

const chartConfig = {
    count: { label: "Sessions", color: "#38bdf8" },
};

export default function SessionDurationChart() {
    return (
        <ChartContainer config={chartConfig} className="w-full h-[250px]">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="range" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
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
                <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} barSize={36} />
            </BarChart>
        </ChartContainer>
    );
}
