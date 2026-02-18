import React from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { 
    ChartContainer, 
    ChartTooltip, 
    ChartTooltipContent 
} from "@/components/ui/chart";

const dummyUsageData = [
    { day: "Mon", total_users: 185 },
    { day: "Tue", total_users: 215 },
    { day: "Wed", total_users: 205 },
    { day: "Thu", total_users: 220 },
    { day: "Fri", total_users: 210 },
    { day: "Sat", total_users: 95 },
];

const chartConfig = {
    total_users: {
        label: "Total Logins",
        color: "#38bdf8", 
    },
};

export default function UsageChart() {
    return (
        <ChartContainer config={chartConfig} className="w-full h-[250px] mt-4">
            <LineChart data={dummyUsageData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                
                <XAxis 
                    dataKey="day" 
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
                    cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }} 
                    content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                            <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                                <p style={{ color: '#94a3b8', fontSize: 11, marginBottom: 4, fontWeight: 700 }}>{label}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#38bdf8' }} />
                                    <span style={{ color: '#e2e8f0', fontSize: 12 }}>Total Logins</span>
                                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, marginLeft: 4 }}>{payload[0].value}</span>
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
                    dot={{ r: 4, fill: "#020617", stroke: "var(--color-total_users)", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "var(--color-total_users)", stroke: "#fff", strokeWidth: 2 }}
                />
            </LineChart>
        </ChartContainer>
    );
}