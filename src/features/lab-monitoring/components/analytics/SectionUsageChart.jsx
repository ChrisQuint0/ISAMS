import React, { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const periodData = {
    today: [
        { section: "BSCS-1A", sessions: 28 },
        { section: "BSIT-3A", sessions: 34 },
        { section: "BSCS-2B", sessions: 22 },
        { section: "BSIT-4A", sessions: 18 },
        { section: "BSIT-1C", sessions: 30 },
    ],
    week: [
        { section: "BSCS-1A", sessions: 142 },
        { section: "BSIT-3A", sessions: 168 },
        { section: "BSCS-2B", sessions: 115 },
        { section: "BSIT-4A", sessions: 96 },
        { section: "BSIT-1C", sessions: 155 },
    ],
    month: [
        { section: "BSCS-1A", sessions: 580 },
        { section: "BSIT-3A", sessions: 692 },
        { section: "BSCS-2B", sessions: 478 },
        { section: "BSIT-4A", sessions: 410 },
        { section: "BSIT-1C", sessions: 625 },
    ],
    year: [
        { section: "BSCS-1A", sessions: 4820 },
        { section: "BSIT-3A", sessions: 5340 },
        { section: "BSCS-2B", sessions: 3950 },
        { section: "BSIT-4A", sessions: 3480 },
        { section: "BSIT-1C", sessions: 4690 },
    ],
};

const tabs = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "year", label: "School Year" },
];

const chartConfig = {
    sessions: { label: "Sessions", color: "#a78bfa" },
};

export default function SectionUsageChart() {
    const [period, setPeriod] = useState("week");

    return (
        <div className="space-y-4">
            {/* Period Tabs */}
            <div className="flex gap-1 bg-[#020617] rounded-lg p-1 border border-[#1e293b] w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setPeriod(tab.key)}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
                            period === tab.key
                                ? "bg-[#1e293b] text-white"
                                : "text-slate-500 hover:text-slate-300"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <ChartContainer config={chartConfig} className="w-full h-[250px]">
                <BarChart data={periodData[period]} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="section" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <ChartTooltip
                        cursor={{ fill: "#0f172a" }}
                        content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            return (
                                <div style={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                                    <p style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4, fontWeight: 700 }}>{label}</p>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: "#a78bfa" }} />
                                        <span style={{ color: "#e2e8f0", fontSize: 12 }}>Sessions</span>
                                        <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginLeft: 4 }}>{payload[0].value}</span>
                                    </div>
                                </div>
                            );
                        }}
                    />
                    <Bar dataKey="sessions" fill="var(--color-sessions)" radius={[6, 6, 0, 0]} barSize={36} />
                </BarChart>
            </ChartContainer>
        </div>
    );
}
