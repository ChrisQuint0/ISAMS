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
        color: "#006B35", 
    },
};


export default function OccupancyChart() {
    return (
        <ChartContainer config={chartConfig} className="w-full h-full">
            <AreaChart data={hourlyData} margin={{ top: 5, right: 15, left: -30, bottom: 5 }}>
                <defs>
                    <linearGradient id="occupancyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#006B35" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#006B35" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                    dataKey="hour"
                    stroke="#6b7280"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={8}
                />
                <YAxis
                    stroke="#6b7280"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 45]}
                />
                <ChartTooltip
                    cursor={{ stroke: "#e5e7eb", strokeWidth: 1, strokeDasharray: "4 4" }}
                    content={
                        <ChartTooltipContent
                            className="bg-white border-neutral-200 shadow-lg [&_.text-foreground]:text-neutral-900 [&_.text-muted-foreground]:text-neutral-500"
                        />
                    }
                />
                <Area
                    type="monotone"
                    dataKey="occupancy"
                    stroke="#006B35"
                    strokeWidth={2.5}
                    fill="url(#occupancyGrad)"
                    dot={{ r: 3, fill: "#f9fafb", stroke: "#006B35", strokeWidth: 2 }}
                    activeDot={{ r: 5, fill: "#006B35", stroke: "#fff", strokeWidth: 2 }}
                />
            </AreaChart>
        </ChartContainer>
    );
}
