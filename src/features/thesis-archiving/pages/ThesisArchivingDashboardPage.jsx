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
    Cpu,
    ShieldCheck,
    Wifi,
    HardDrive,
    Network,
    ScanEye,
    Languages,
} from "lucide-react";
import { ThesisArchivingHeader } from "../components/ThesisArchivingHeader";

const getCategoryConfig = (category) => {
    const configs = {
        "Artificial Intelligence": {
            icon: Cpu,
            class: "bg-blue-50 text-blue-700 border-blue-200"
        },
        "Cybersecurity": {
            icon: ShieldCheck,
            class: "bg-purple-50 text-purple-700 border-purple-200"
        },
        "Internet of Things": {
            icon: Wifi,
            class: "bg-emerald-50 text-emerald-700 border-emerald-200"
        },
        "Information Systems": {
            icon: HardDrive,
            class: "bg-amber-50 text-amber-700 border-amber-200"
        },
        "Machine Learning": {
            icon: Network,
            class: "bg-indigo-50 text-indigo-700 border-indigo-200"
        },
        "Computer Vision": {
            icon: ScanEye,
            class: "bg-cyan-50 text-cyan-700 border-cyan-200"
        },
        "Natural Language Processing": {
            icon: Languages,
            class: "bg-rose-50 text-rose-700 border-rose-200"
        }
    };

    return configs[category] || {
        icon: BookOpen,
        class: "bg-neutral-50 text-neutral-700 border-neutral-200"
    };
};

const dashboardMetrics = [
    {
        key: "totalRecords",
        title: "Total Records",
        value: "248",
        sub: "Thesis and capstone",
        icon: BookOpen,
        color: "text-blue-600",
        chartTitle: "Total Records Trend",
        chartDescription: "Monthly thesis and capstone record count",
        chartLabel: "Records",
        chartColor: "#2563eb",
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
        key: "archivedTerm",
        title: "Archived This Year",
        value: "148",
        change: "+12",
        isIncrease: true,
        icon: Archive,
        color: "blue",
        chartTitle: "Archive Volume Trend",
        chartDescription: "Monthly archived thesis and capstone records",
        chartLabel: "Archived",
        chartColor: "#059669",
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
        sub: "Current year",
        icon: CheckCircle,
        color: "text-purple-600",
        chartTitle: "Completion Rate Trend",
        chartDescription: "Monthly completion percentage",
        chartLabel: "Completion %",
        chartColor: "#7c3aed",
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
            accent: "text-blue-600",
            bgAccent: "bg-blue-50"
        },
        {
            label: "Similarity Check",
            description: "Review similarity results",
            icon: FileSearch,
            path: "/thesis-archiving/similarity-check",
            accent: "text-amber-600",
            bgAccent: "bg-amber-50"
        },
        {
            label: "HTE Document Archive",
            description: "Access internship document archives",
            icon: Archive,
            path: "/thesis-archiving/hte-archiving/document-archive",
            accent: "text-emerald-600",
            bgAccent: "bg-emerald-50"
        },
        {
            label: "Reports & Analytics",
            description: "View insights and trend reports",
            icon: BarChart3,
            path: "/thesis-archiving/insights/reports",
            accent: "text-purple-600",
            bgAccent: "bg-purple-50"
        },
    ];

    const recentSubmissions = [
        {
            title: "AI-Powered Traffic Management System",
            year: "2025",
            category: "Artificial Intelligence",
        },
        {
            title: "Blockchain for Secure Medical Records",
            year: "2024",
            category: "Cybersecurity",
        },
        {
            title: "IoT Smart Crop Monitoring",
            year: "2025",
            category: "Internet of Things",
        },
        {
            title: "Virtual Reality Therapy Environment",
            year: "2025",
            category: "Information Systems",
        },
        {
            title: "Machine Learning in Crop Disease Detection",
            year: "2025",
            category: "Machine Learning",
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

    const selectedMetric = dashboardMetrics.find((metric) => metric.key === activeMetric) || dashboardMetrics[1];

    const chartData = selectedMetric.chartData;
    const chartConfig = {
        value: {
            label: selectedMetric.chartLabel,
            color: selectedMetric.chartColor,
        },
    };

    return (
        <div className="flex flex-col min-h-screen w-full bg-neutral-100 text-neutral-900">
            <ThesisArchivingHeader title="Dashboard" variant="light" />

            <main className="flex-1 p-4 md:p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header... */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="flex items-center gap-3 text-2xl font-bold text-neutral-900">
                                Command Center
                                <Badge variant="outline" className="hidden sm:inline-flex bg-neutral-50 text-neutral-600 border-neutral-200 text-xs font-medium px-2 py-0.5 rounded-full shadow-sm">
                                    <span className="mr-1.5 flex h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                                    {userRole}
                                </Badge>
                            </h1>
                            <p className="text-sm text-neutral-500">Thesis, Capstone, and HTE Overview</p>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                            {userRole === "Administrator" && (
                                <Select value={globalFilter} onValueChange={setGlobalFilter}>
                                    <SelectTrigger className="h-[42px] w-full md:w-[200px] bg-white border-neutral-200 text-neutral-900 hover:border-neutral-300 rounded-xl transition-colors shadow-sm">
                                        <SelectValue placeholder="All Departments" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-neutral-200 text-neutral-900 rounded-xl">
                                        <SelectItem value="All Departments">All Departments</SelectItem>
                                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                                        <SelectItem value="Information Technology">Information Technology</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}

                            <div className="flex items-center gap-3 bg-white border border-neutral-200 rounded-lg px-4 py-2.5 shadow-sm w-full md:w-auto">
                                <div className="flex items-center gap-2">
                                    <span className="relative flex size-2 shrink-0">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-40" />
                                        <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                                    </span>
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 leading-none mb-0.5">Live</p>
                                        <p className="font-mono text-sm font-semibold text-green-700 leading-none">{lastRefresh.toLocaleTimeString()}</p>
                                    </div>
                                </div>
                                <div className="h-5 w-px bg-neutral-200 mx-0.5" />
                                <Button size="sm" onClick={() => setLastRefresh(new Date())}
                                    className="h-8 px-4 text-xs font-bold bg-green-700 hover:bg-green-800 text-white border-0 shadow-sm transition-all duration-200 rounded-md"
                                >
                                    ↻ Refresh
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions - Full Width */}
                    <Card className="bg-white border-neutral-200 shadow-sm">
                        <CardHeader className="pb-3 border-b border-neutral-100 mb-4">
                            <CardTitle className="text-neutral-900 text-base flex items-center gap-2">
                                <LayoutDashboard className="h-4 w-4 text-primary-500" />
                                Quick Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-6 px-6">
                            {quickActions.map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className="text-left rounded-xl border border-neutral-200 bg-white p-4 hover:bg-neutral-50 hover:border-neutral-300 transition-colors shadow-sm hover:shadow group"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`p-2 rounded-lg ${item.bgAccent} ${item.accent}`}>
                                            <item.icon className="h-5 w-5" />
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-primary-500 transition-colors" />
                                    </div>
                                    <p className="text-sm font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">{item.label}</p>
                                    <p className="text-xs text-neutral-500 mt-1">{item.description}</p>
                                </button>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Main Content Grid: 3 columns on desktop, 1 on mobile */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Left Column (Main Content) - Spans 2 cols */}
                        <div className="lg:col-span-2 space-y-6 flex flex-col">
                            {/* Chart */}
                            <Card className="bg-white border-neutral-200 shadow-sm h-[380px] flex flex-col shrink-0">
                                <CardHeader className="pb-2 flex-none border-b border-neutral-100 mb-2">
                                    <CardTitle className="text-neutral-900 text-base flex justify-between items-center">
                                        {selectedMetric.chartTitle}
                                    </CardTitle>
                                    <p className="text-xs text-neutral-500">{selectedMetric.chartDescription}</p>
                                </CardHeader>
                                <CardContent className="flex-1 min-h-0 pt-2 pr-6">
                                    {/* Chart internal code */}
                                    <ChartContainer config={chartConfig} className="h-full w-full">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="archiveTrendFill" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={selectedMetric.chartColor} stopOpacity={0.2} />
                                                    <stop offset="100%" stopColor={selectedMetric.chartColor} stopOpacity={0.01} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid stroke="#f5f5f5" strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="month" stroke="#a3a3a3" tickLine={false} axisLine={false} fontSize={11} tickMargin={10} />
                                            <YAxis stroke="#a3a3a3" tickLine={false} axisLine={false} fontSize={11} domain={selectedMetric.yDomain} tickMargin={10} />
                                            <ChartTooltip cursor={{ stroke: "#d4d4d4", strokeWidth: 1, strokeDasharray: "4 4" }} content={<ChartTooltipContent className="bg-white border border-neutral-200 shadow-md rounded-lg [&_.text-foreground]:text-neutral-900 [&_.text-muted-foreground]:text-neutral-500" />} />
                                            <Area type="monotone" dataKey="value" stroke={selectedMetric.chartColor} strokeWidth={2.5} fill="url(#archiveTrendFill)" dot={{ r: 3, fill: "#ffffff", stroke: selectedMetric.chartColor, strokeWidth: 2 }} activeDot={{ r: 5, fill: selectedMetric.chartColor, stroke: "#ffffff", strokeWidth: 2 }} />
                                        </AreaChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>

                            {/* Recent Submissions */}
                            <Card className="bg-white border-neutral-200 shadow-sm flex-1 flex flex-col min-h-0">
                                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-neutral-100">
                                    <div>
                                        <CardTitle className="text-neutral-900 text-base">Recent Submissions</CardTitle>
                                        <p className="text-xs text-neutral-500 mt-1">Latest thesis documents added for review</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-white border-neutral-200 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                                        onClick={() => navigate('/thesis-archiving/digital-repository')}
                                    >
                                        View All
                                    </Button>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                    {recentSubmissions.map((item) => {
                                        const config = getCategoryConfig(item.category);
                                        const CategoryIcon = config.icon;

                                        return (
                                            <div
                                                key={item.title}
                                                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 hover:bg-white hover:border-neutral-200 hover:shadow-sm transition-all"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.class.split(' ').filter(c => c.startsWith('bg-') || c.startsWith('text-')).join(' ')} bg-opacity-30`}>
                                                        <CategoryIcon className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-neutral-800 group-hover:text-primary-600 transition-colors line-clamp-1">{item.title}</p>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <span className="text-xs text-neutral-500 flex items-center gap-1 font-medium">
                                                                <Clock className="h-3 w-3" />
                                                                {item.year}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-end sm:w-auto w-full border-t border-neutral-200 sm:border-t-0 pt-3 sm:pt-0 mt-2 sm:mt-0">
                                                    <Badge variant="outline" className={`${config.class} px-2.5 py-1 text-xs font-medium rounded-md border shadow-sm`}>
                                                        {item.category}
                                                    </Badge>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column (Sidebar) - Spans 1 col */}
                        <div className="space-y-6">
                            {/* Dashboard Metrics Panel */}
                            <Card className="bg-white border-neutral-200 shadow-sm h-full">
                                <CardHeader className="pb-4 border-b border-neutral-100">
                                    <CardTitle className="text-neutral-900 text-base">Key Metrics</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 pt-4">
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
                    <Card className="bg-white border-neutral-200 shadow-sm w-full xl:max-h-[300px] flex flex-col">
                        <CardHeader className="pb-4 border-b border-neutral-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-neutral-900 text-base">Recent Activity</CardTitle>
                                    <p className="text-xs text-neutral-500 mt-1">Activity log for Thesis/HTE Archiving</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                                        onClick={() => navigate('/thesis-archiving/insights/audit-trail')}
                                    >
                                        View Full Trail <ArrowRight className="ml-1 h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-y-auto">
                            <div className="flex flex-col">
                                {recentActivity.map((activity, i) => (
                                    <div key={i} className="group flex gap-4 px-6 py-4 hover:bg-neutral-50 transition-colors relative border-b border-neutral-100 last:border-0">
                                        <div className="relative flex flex-col items-center">
                                            <div className="h-2.5 w-2.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(34,197,94,0.3)] flex-shrink-0 mt-1.5 z-10" />
                                            {i !== recentActivity.length - 1 && (
                                                <div className="w-[1px] h-full bg-neutral-200 group-hover:bg-neutral-300 absolute top-5 bottom-[-1.5rem] transition-colors" />
                                            )}
                                        </div>
                                        <div className="space-y-1 pb-0.5">
                                            <p className="text-sm font-medium text-neutral-800 group-hover:text-primary-600 transition-colors leading-snug">{activity.text}</p>
                                            <p className="text-xs text-neutral-400 font-medium">{activity.time}</p>
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
            className={`bg-white border cursor-pointer transition-all duration-200 group ${isActive
                ? "border-primary-500 shadow-md shadow-primary-500/10 ring-1 ring-primary-500"
                : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50 hover:shadow-sm"
                }`}
        >
            <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <p className={`text-sm font-semibold transition-colors ${isActive ? "text-primary-700" : "text-neutral-500 group-hover:text-neutral-700"}`}>
                        {title}
                    </p>
                    <div className={`p-2 rounded-lg transition-colors ${isActive ? "bg-primary-50 text-primary-600" : "bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200 group-hover:text-neutral-700"
                        }`}>
                        <Icon className="h-4 w-4" />
                    </div>
                </div>
                <div>
                    <h3 className="text-3xl font-bold text-neutral-900 tracking-tight">{value}</h3>
                    <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1 font-medium">
                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${isActive ? "bg-primary-400" : "bg-neutral-300"}`}></span>
                        {sub}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
