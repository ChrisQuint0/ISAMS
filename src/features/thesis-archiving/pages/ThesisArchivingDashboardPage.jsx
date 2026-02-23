import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import {
    Area,
    AreaChart,
    CartesianGrid,
    XAxis,
    YAxis,
} from "recharts";
import {
    LayoutDashboard,
    Database,
    FileSearch,
    Archive,
    BarChart3,
    BookOpen,
    Clock,
    FolderOpen,
    CheckCircle,
    RefreshCw,
    ArrowRight,
} from "lucide-react";
import { ThesisArchivingHeader } from "../components/ThesisArchivingHeader";

const dashboardMetrics = [
    {
        key: "totalRecords",
        title: "Total Records",
        value: "248",
        sub: "Thesis and capstone",
        icon: BookOpen,
        color: "text-blue-400",
        chartTitle: "Total Records Trend",
        chartDescription: "Monthly thesis and capstone record count",
        chartLabel: "Records",
        chartColor: "#60a5fa",
        yDomain: [0, 260],
        chartData: [
            { month: "Sep", value: 186 },
            { month: "Oct", value: 198 },
            { month: "Nov", value: 211 },
            { month: "Dec", value: 220 },
            { month: "Jan", value: 236 },
            { month: "Feb", value: 248 },
        ],
    },
    {
        key: "pendingReviews",
        title: "Pending Reviews",
        value: "14",
        sub: "Similarity and validation",
        icon: Clock,
        color: "text-amber-400",
        chartTitle: "Pending Reviews Trend",
        chartDescription: "Monthly queue for similarity and validation",
        chartLabel: "Pending",
        chartColor: "#f59e0b",
        yDomain: [0, 24],
        chartData: [
            { month: "Sep", value: 20 },
            { month: "Oct", value: 18 },
            { month: "Nov", value: 17 },
            { month: "Dec", value: 16 },
            { month: "Jan", value: 15 },
            { month: "Feb", value: 14 },
        ],
    },
    {
        key: "archivedTerm",
        title: "Archived This Term",
        value: "62",
        sub: "Completed entries",
        icon: FolderOpen,
        color: "text-emerald-400",
        chartTitle: "Archive Volume Trend",
        chartDescription: "Monthly archived thesis and capstone records",
        chartLabel: "Archived",
        chartColor: "#34d399",
        yDomain: [0, 70],
        chartData: [
            { month: "Sep", value: 22 },
            { month: "Oct", value: 28 },
            { month: "Nov", value: 35 },
            { month: "Dec", value: 18 },
            { month: "Jan", value: 26 },
            { month: "Feb", value: 31 },
        ],
    },
    {
        key: "completionRate",
        title: "Completion Rate",
        value: "91%",
        sub: "Current cycle",
        icon: CheckCircle,
        color: "text-purple-400",
        chartTitle: "Completion Rate Trend",
        chartDescription: "Monthly completion percentage",
        chartLabel: "Completion %",
        chartColor: "#a78bfa",
        yDomain: [70, 100],
        chartData: [
            { month: "Sep", value: 79 },
            { month: "Oct", value: 82 },
            { month: "Nov", value: 84 },
            { month: "Dec", value: 86 },
            { month: "Jan", value: 89 },
            { month: "Feb", value: 91 },
        ],
    },
];

export default function ThesisArchivingDashboardPage() {
    const navigate = useNavigate();
    const [activeMetric, setActiveMetric] = useState("archivedTerm");

    const quickActions = [
        {
            label: "Digital Repository",
            description: "Browse and manage thesis records",
            icon: Database,
            path: "/thesis-archiving/digital-repository",
            accent: "text-blue-400",
        },
        {
            label: "Similarity Check",
            description: "Review plagiarism and similarity results",
            icon: FileSearch,
            path: "/thesis-archiving/similarity-check",
            accent: "text-amber-400",
        },
        {
            label: "HTE Document Archive",
            description: "Access internship document archives",
            icon: Archive,
            path: "/thesis-archiving/hte-archiving/document-archive",
            accent: "text-emerald-400",
        },
        {
            label: "Reports & Analytics",
            description: "View insights and trend reports",
            icon: BarChart3,
            path: "/thesis-archiving/insights/reports",
            accent: "text-purple-400",
        },
    ];

    const recentSubmissions = [
        {
            title: "AI-Powered Traffic Management System",
            group: "BSIT-4A • 2025",
            status: "Ready for Archiving",
            statusClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        },
        {
            title: "Blockchain for Secure Medical Records",
            group: "BSIT-4B • 2024",
            status: "For Similarity Review",
            statusClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        },
        {
            title: "IoT Smart Crop Monitoring",
            group: "BSCS-4A • 2025",
            status: "Archived",
            statusClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        },
    ];

    const recentActivity = [
        { text: "New thesis entry added to repository", time: "5 mins ago" },
        { text: "Similarity check completed for 2 submissions", time: "22 mins ago" },
        { text: "HTE archive batch updated", time: "1 hour ago" },
        { text: "Reports analytics viewed by coordinator", time: "Today" },
    ];

    const selectedMetric = dashboardMetrics.find((metric) => metric.key === activeMetric) || dashboardMetrics[2];

    const chartData = selectedMetric.chartData;
    const chartConfig = {
        value: {
            label: selectedMetric.chartLabel,
            color: selectedMetric.chartColor,
        },
    };

    return (
        <div className="flex flex-col min-h-screen w-full bg-slate-950">
            <ThesisArchivingHeader title="Dashboard" />

            <main className="flex-1 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-100">Thesis Archiving Dashboard</h1>
                            <p className="text-sm text-slate-400">Thesis, Capstone, and HTE Overview</p>
                        </div>
                        <Button
                            variant="outline"
                            className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh data
                        </Button>
                    </div>

                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-slate-100 text-base flex items-center gap-2">
                                <LayoutDashboard className="h-4 w-4 text-blue-400" />
                                Quick Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {quickActions.map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className="text-left rounded-lg border border-slate-800 bg-slate-950/70 p-4 hover:bg-slate-900 hover:border-slate-700 transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <item.icon className={`h-5 w-5 ${item.accent}`} />
                                        <ArrowRight className="h-4 w-4 text-slate-500" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-100">{item.label}</p>
                                    <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                                </button>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {dashboardMetrics.map((metric) => (
                            <StatCard
                                key={metric.key}
                                title={metric.title}
                                value={metric.value}
                                sub={metric.sub}
                                icon={metric.icon}
                                color={metric.color}
                                isActive={activeMetric === metric.key}
                                onClick={() => setActiveMetric(metric.key)}
                            />
                        ))}
                    </div>

                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-slate-100 text-base">{selectedMetric.chartTitle}</CardTitle>
                            <p className="text-xs text-slate-400">{selectedMetric.chartDescription}</p>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig} className="h-[260px] w-full">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="archiveTrendFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={selectedMetric.chartColor} stopOpacity={0.35} />
                                            <stop offset="100%" stopColor={selectedMetric.chartColor} stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        stroke="#64748b"
                                        tickLine={false}
                                        axisLine={false}
                                        fontSize={11}
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        tickLine={false}
                                        axisLine={false}
                                        fontSize={11}
                                        domain={selectedMetric.yDomain}
                                    />
                                    <ChartTooltip
                                        cursor={{ stroke: "#334155", strokeWidth: 1, strokeDasharray: "4 4" }}
                                        content={
                                            <ChartTooltipContent
                                                className="bg-slate-900 border-slate-700 [&_.text-foreground]:text-slate-100 [&_.text-muted-foreground]:text-slate-400"
                                            />
                                        }
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke={selectedMetric.chartColor}
                                        strokeWidth={2.5}
                                        fill="url(#archiveTrendFill)"
                                        dot={{ r: 3, fill: "#0f172a", stroke: selectedMetric.chartColor, strokeWidth: 2 }}
                                        activeDot={{ r: 5, fill: selectedMetric.chartColor, stroke: "#e2e8f0", strokeWidth: 2 }}
                                    />
                                </AreaChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-100 text-base">Recent Submissions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {recentSubmissions.map((item) => (
                                    <div
                                        key={item.title}
                                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-slate-100">{item.title}</p>
                                            <p className="text-xs text-slate-400">{item.group}</p>
                                        </div>
                                        <Badge variant="outline" className={item.statusClass}>
                                            {item.status}
                                        </Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-slate-100 text-base">Recent Activity</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {recentActivity.map((activity) => (
                                    <div key={activity.text} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                                        <p className="text-sm text-slate-200">{activity.text}</p>
                                        <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatCard({ title, value, sub, icon: Icon, color, isActive, onClick }) {
    return (
        <Card
            onClick={onClick}
            className={`bg-slate-900 border cursor-pointer transition-colors ${isActive ? "border-slate-600" : "border-slate-800 hover:border-slate-700"
                }`}
        >
            <CardContent className="p-5 flex justify-between items-start">
                <div className="space-y-1">
                    <p className="text-xs text-slate-400">{title}</p>
                    <p className="text-2xl font-bold text-slate-100">{value}</p>
                    <p className="text-xs text-slate-500">{sub}</p>
                </div>
                <div className="p-2 rounded-md bg-slate-800/70 border border-slate-700">
                    <Icon className={`h-5 w-5 ${color}`} />
                </div>
            </CardContent>
        </Card>
    );
}
