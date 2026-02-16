import React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const data = [
    { month: "Aug", hours: 1820 },
    { month: "Sep", hours: 2150 },
    { month: "Oct", hours: 2340 },
    { month: "Nov", hours: 2080 },
    { month: "Dec", hours: 1250 },
    { month: "Jan", hours: 2420 },
    { month: "Feb", hours: 2580 },
];

const chartConfig = {
    hours: { label: "Total Hours", color: "#38bdf8" },
};

export default function PCUsageHistoryChart() {
    return (
        <ChartContainer config={chartConfig} className="w-full h-[250px]">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <defs>
                    <linearGradient id="pcUsageGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <ChartTooltip
                    cursor={{ stroke: "#334155", strokeWidth: 1, strokeDasharray: "4 4" }}
                    content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                            <div style={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                                <p style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4, fontWeight: 700 }}>{label}</p>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: "#38bdf8" }} />
                                    <span style={{ color: "#e2e8f0", fontSize: 12 }}>Total Hours</span>
                                    <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginLeft: 4 }}>{payload[0].value}</span>
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
                    dot={{ r: 4, fill: "#020617", stroke: "var(--color-hours)", strokeWidth: 2 }}
                />
            </AreaChart>
        </ChartContainer>
    );
}
