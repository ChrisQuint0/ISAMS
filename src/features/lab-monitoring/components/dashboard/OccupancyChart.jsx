import React from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Area, AreaChart } from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

const hourlyData = [
    { hour: "7AM",  occupancy: 12 },
    { hour: "8AM",  occupancy: 28 },
    { hour: "9AM",  occupancy: 36 },
    { hour: "10AM", occupancy: 40 },
    { hour: "11AM", occupancy: 38 },
    { hour: "12PM", occupancy: 20 },
    { hour: "1PM",  occupancy: 32 },
    { hour: "2PM",  occupancy: 38 },
    { hour: "3PM",  occupancy: 35 },
    { hour: "4PM",  occupancy: 22 },
    { hour: "5PM",  occupancy: 10 },
];

const chartConfig = {
    occupancy: {
        label: "Students",
        color: "#38bdf8", 
    },
};


export default function OccupancyChart() {
    return (
        /* Reduced h-[220px] to h-[180px] */
        <ChartContainer config={chartConfig} className="w-full h-[280px]">
            <AreaChart data={hourlyData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                    <linearGradient id="occupancyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                    dataKey="hour"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={8}
                />
                <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 45]}
                />
                <ChartTooltip
                    cursor={{ stroke: "#334155", strokeWidth: 1, strokeDasharray: "4 4" }}
                    content={
                        <ChartTooltipContent
                            className="bg-[#1e293b] border-[#334155] shadow-2xl [&_.text-foreground]:text-white [&_.text-muted-foreground]:text-slate-400"
                        />
                    }
                />
                <Area
                    type="monotone"
                    dataKey="occupancy"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    fill="url(#occupancyGrad)"
                    dot={{ r: 3, fill: "#0F172A", stroke: "#38bdf8", strokeWidth: 2 }}
                    activeDot={{ r: 5, fill: "#38bdf8", stroke: "#fff", strokeWidth: 2 }}
                />
            </AreaChart>
        </ChartContainer>
    );
}
