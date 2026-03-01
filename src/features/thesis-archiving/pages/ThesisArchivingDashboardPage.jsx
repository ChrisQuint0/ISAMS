import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
    const [isSubmissionsModalOpen, setIsSubmissionsModalOpen] = useState(false);
    const [userRole, setUserRole] = useState("Administrator");
    const [globalFilter, setGlobalFilter] = useState("All Departments");
    const [lastRefresh, setLastRefresh] = useState(new Date());

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
        {
            title: "Virtual Reality Therapy Environment",
            group: "BSCS-4B • 2025",
            status: "For Similarity Review",
            statusClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        },
        {
            title: "Machine Learning in Crop Disease Detection",
            group: "BSIT-4A • 2025",
            status: "Ready for Archiving",
            statusClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        },
    ];

    const recentActivity = [
        { text: "New thesis entry added to repository", time: "5 mins ago" },
        { text: "Similarity check completed for 2 submissions", time: "22 mins ago" },
        { text: "HTE archive batch updated", time: "1 hour ago" },
        { text: "Reports analytics viewed by coordinator", time: "Today" },
        { text: "System daily backup completed", time: "Yesterday" },
        { text: "Coordinator updated plagiarism thresholds", time: "Yesterday" },
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

            <main className="flex-1 p-4 md:p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header... */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-100">
                                Command Center
                                <Badge variant="outline" className="hidden sm:inline-flex bg-slate-900/50 text-slate-300 border-slate-700/50 text-xs font-medium px-2 py-0.5 rounded-full shadow-sm">
                                    <span className="mr-1.5 flex h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                                    {userRole}
                                </Badge>
                            </h1>
                            <p className="text-sm text-slate-400">Thesis, Capstone, and HTE Overview</p>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                            {userRole === "Administrator" && (
                                <Select value={globalFilter} onValueChange={setGlobalFilter}>
                                    <SelectTrigger className="h-[42px] w-full md:w-[200px] bg-slate-900/80 border-slate-700/50 text-slate-300 hover:border-slate-600 rounded-xl transition-colors shadow-sm">
                                        <SelectValue placeholder="All Departments" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-700 text-slate-100 rounded-xl">
                                        <SelectItem value="All Departments">All Departments</SelectItem>
                                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                                        <SelectItem value="Information Technology">Information Technology</SelectItem>
                                        <SelectItem value="Computer Engineering">Computer Engineering</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}

                            <div className="flex items-center justify-between gap-3 w-full md:w-auto bg-slate-900/70 border border-slate-700/50 rounded-xl px-4 py-2.5 shadow-lg shadow-black/20 backdrop-blur-sm">
                                <div className="flex items-center gap-2">
                                    <span className="relative flex size-2 shrink-0">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
                                        <span className="relative inline-flex size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
                                    </span>
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 leading-none mb-0.5">Live</p>
                                        <p className="font-mono text-sm font-semibold text-emerald-400 leading-none">{lastRefresh.toLocaleTimeString()}</p>
                                    </div>
                                </div>
                                <div className="h-5 w-px bg-slate-700/60 mx-1 hidden md:block" />
                                <Button size="sm" onClick={() => setLastRefresh(new Date())}
                                    className="h-7 px-3 text-xs font-bold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 border-0 shadow-[0_2px_10px_rgba(34,211,238,0.2)] hover:shadow-[0_2px_15px_rgba(34,211,238,0.4)] transition-all duration-200 rounded-lg"
                                >
                                    ↻ Refresh
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions - Full Width */}
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-slate-100 text-base flex items-center gap-2">
                                <LayoutDashboard className="h-4 w-4 text-blue-400" />
                                Quick Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {quickActions.map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className="text-left rounded-lg border border-slate-800 bg-slate-950/70 p-4 hover:bg-slate-900 hover:border-slate-700 transition-colors group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className={`p-2 rounded-md bg-slate-800/50 ${item.accent}`}>
                                            <item.icon className="h-5 w-5" />
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-100">{item.label}</p>
                                    <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                                </button>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Main Content Grid: 3 columns on desktop, 1 on mobile */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Left Column (Main Content) - Spans 2 cols */}
                        <div className="lg:col-span-2 space-y-6 flex flex-col">
                            {/* Chart */}
                            <Card className="bg-slate-900 border-slate-800 h-[380px] flex flex-col shrink-0">
                                <CardHeader className="pb-2 flex-none">
                                    <CardTitle className="text-slate-100 text-base flex justify-between items-center">
                                        {selectedMetric.chartTitle}
                                    </CardTitle>
                                    <p className="text-xs text-slate-400">{selectedMetric.chartDescription}</p>
                                </CardHeader>
                                <CardContent className="flex-1 min-h-0">
                                    {/* Chart internal code remains intact */}
                                    <ChartContainer config={chartConfig} className="h-full w-full">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="archiveTrendFill" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={selectedMetric.chartColor} stopOpacity={0.35} />
                                                    <stop offset="100%" stopColor={selectedMetric.chartColor} stopOpacity={0.02} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="month" stroke="#64748b" tickLine={false} axisLine={false} fontSize={11} />
                                            <YAxis stroke="#64748b" tickLine={false} axisLine={false} fontSize={11} domain={selectedMetric.yDomain} />
                                            <ChartTooltip cursor={{ stroke: "#334155", strokeWidth: 1, strokeDasharray: "4 4" }} content={<ChartTooltipContent className="bg-slate-900 border-slate-700 [&_.text-foreground]:text-slate-100 [&_.text-muted-foreground]:text-slate-400" />} />
                                            <Area type="monotone" dataKey="value" stroke={selectedMetric.chartColor} strokeWidth={2.5} fill="url(#archiveTrendFill)" dot={{ r: 3, fill: "#0f172a", stroke: selectedMetric.chartColor, strokeWidth: 2 }} activeDot={{ r: 5, fill: selectedMetric.chartColor, stroke: "#e2e8f0", strokeWidth: 2 }} />
                                        </AreaChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>

                            {/* Recent Submissions */}
                            <Card className="bg-slate-900 border-slate-800 flex-1 flex flex-col min-h-0">
                                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-800/50">
                                    <div>
                                        <CardTitle className="text-slate-100 text-base">Recent Submissions</CardTitle>
                                        <p className="text-xs text-slate-400 mt-1">Latest thesis documents added for review</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-slate-950/50 border-slate-700 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                                        onClick={() => navigate('/thesis-archiving/digital-repository')}
                                    >
                                        View All
                                    </Button>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                    {recentSubmissions.map((item) => (
                                        <div
                                            key={item.title}
                                            className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-800/60 bg-slate-950/40 p-4 hover:bg-slate-800/40 hover:border-slate-700/60 transition-all"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${item.status === 'Archived'
                                                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                                    : item.status === 'Ready for Archiving'
                                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                    }`}>
                                                    {item.status === 'Archived' ? <Archive className="h-5 w-5" /> :
                                                        item.status === 'Ready for Archiving' ? <CheckCircle className="h-5 w-5" /> :
                                                            <FileSearch className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-1">{item.title}</p>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <Badge variant="secondary" className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] px-1.5 py-0 rounded font-normal">
                                                            {item.group.split(' • ')[0]}
                                                        </Badge>
                                                        <span className="text-xs text-slate-500">•</span>
                                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {item.group.split(' • ')[1] || 'Recent'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-end sm:w-auto w-full border-t sm:border-t-0 border-slate-800/50 pt-3 sm:pt-0 mt-1 sm:mt-0">
                                                <Badge variant="outline" className={`${item.statusClass} px-2.5 py-1 text-xs font-medium rounded-md border shadow-sm`}>
                                                    {item.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column (Sidebar) - Spans 1 col */}
                        <div className="space-y-6">
                            {/* Dashboard Metrics Panel */}
                            <Card className="bg-slate-900 border-slate-800 h-full">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-slate-100 text-base">Key Metrics</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
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
                                </CardContent>
                            </Card>
                        </div>

                    </div>

                    {/* Bottom Full-Width Recent Activity */}
                    <Card className="bg-slate-900 border-slate-800 w-full xl:max-h-[300px] flex flex-col">
                        <CardHeader className="pb-4 border-b border-slate-800/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-slate-100 text-base">Recent Activity</CardTitle>
                                    <p className="text-xs text-slate-400 mt-1">System-wide activity log for archiving and reviews</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs text-blue-400 hover:text-blue-300 hover:bg-slate-800"
                                        onClick={() => navigate('/thesis-archiving/insights/audit-trail')}
                                    >
                                        View Full Trail <ArrowRight className="ml-1 h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar-themed">
                            <div className="flex flex-col">
                                {recentActivity.map((activity, i) => (
                                    <div key={i} className="group flex gap-4 p-5 hover:bg-slate-800/30 transition-colors relative border-b border-slate-800/30 last:border-0">
                                        <div className="relative flex flex-col items-center">
                                            <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] flex-shrink-0 mt-1.5 z-10" />
                                            {i !== recentActivity.length - 1 && (
                                                <div className="w-[1px] h-full bg-slate-800 group-hover:bg-slate-700 absolute top-5 bottom-[-1.5rem] transition-colors" />
                                            )}
                                        </div>
                                        <div className="space-y-1.5 pb-1">
                                            <p className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors leading-snug">{activity.text}</p>
                                            <p className="text-xs text-slate-500 font-medium">{activity.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </main>
        </div>
    );
}

function StatCard({ title, value, sub, icon: Icon, color, isActive, onClick }) {
    return (
        <Card
            onClick={onClick}
            className={`bg-slate-900 border cursor-pointer transition-all duration-200 group ${isActive
                ? "border-slate-500 shadow-md shadow-slate-900/50"
                : "border-slate-800 hover:border-slate-600 hover:bg-slate-800/50"
                }`}
        >
            <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <p className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">{title}</p>
                    <div className={`p-2 rounded-md bg-slate-950 border transition-colors ${isActive ? "border-slate-700" : "border-slate-800 group-hover:border-slate-700"
                        }`}>
                        <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                </div>
                <div>
                    <h3 className="text-3xl font-bold text-slate-100 tracking-tight">{value}</h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700 inline-block"></span>
                        {sub}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
