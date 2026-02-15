import React from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { 
    ChartContainer, 
    ChartTooltip, 
    ChartTooltipContent 
} from "@/components/ui/chart";

// Merged Dummy Data (Total Users per day)
const dummyUsageData = [
    { day: "Mon", total_users: 185 },
    { day: "Tue", total_users: 215 },
    { day: "Wed", total_users: 205 },
    { day: "Thu", total_users: 220 },
    { day: "Fri", total_users: 210 },
    { day: "Sat", total_users: 95 },
];

// 🎨 Shadcn Chart Configuration 
const chartConfig = {
    total_users: {
        label: "Total Logins",
        color: "#38bdf8", // Tailwind sky-400
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
                
                {/* Forced high-contrast tooltip text */}
                <ChartTooltip 
                    cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }} 
                    content={
                        <ChartTooltipContent 
                            className="bg-[#1e293b] border-[#334155] shadow-2xl [&_.text-foreground]:text-white [&_.text-muted-foreground]:text-slate-400" 
                        />
                    } 
                />
                
                {/* Single Smooth Trend Line */}
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