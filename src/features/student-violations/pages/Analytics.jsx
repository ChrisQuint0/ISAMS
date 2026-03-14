import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3, TrendingUp, Users, ShieldAlert,
  ArrowUpRight, ArrowDownRight, Activity, FileWarning, Scale,
  Loader2
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";


// --- Color Constants ---
const SEVERITY_COLORS = { Minor: "#f59e0b", Major: "#ef4444", Compliance: "#6366f1" };
const STATUS_COLORS = {
  Pending: "#f59e0b", "Under Investigation": "#3b82f6", Sanctioned: "#8b5cf6",
  Resolved: "#10b981", Dismissed: "#6b7280"
};
const SANCTION_STATUS_COLORS = {
  "Not Started": "#94a3b8", "In Progress": "#3b82f6", Completed: "#10b981", Overdue: "#ef4444"
};
const AREA_GRADIENT_ID = "violationTrendGradient";


// --- Reusable Stat Card (Extra Compact) ---
const StatCard = ({ title, value, icon: Icon, description, trend, isUp, isLoading, borderTopClass = "bg-primary-500", iconClass = "text-primary-600 bg-primary-50 border-primary-100" }) => (
  <Card className="bg-white border-neutral-200 shadow-sm rounded-lg overflow-hidden relative group transition-all hover:shadow-md hover:-translate-y-0.5 h-full flex flex-col">
    <div className={`absolute top-0 left-0 w-full h-1 ${borderTopClass} transition-opacity opacity-70 group-hover:opacity-100`}></div>
    <CardContent className="p-3 flex-1 flex flex-col justify-between relative z-10">
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className={`p-1.5 rounded-md border ${iconClass} transition-transform group-hover:scale-105 duration-300`}>
            <Icon size={16} strokeWidth={2.5} />
          </div>
          {trend !== undefined && !isLoading && (
            <div className={`px-2 py-0.5 rounded-full flex items-center text-[10px] font-bold ${isUp ? 'bg-success/10 text-success' : 'bg-destructive-semantic/10 text-destructive-semantic'}`}>
              {isUp ? <ArrowUpRight size={12} className="mr-0.5" /> : <ArrowDownRight size={12} className="mr-0.5" />}
              {trend}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-2xl font-black text-neutral-900 tracking-tighter leading-none mb-1">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-neutral-300" /> : value}
          </h3>
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{title}</p>
        </div>
      </div>
      {description && (
        <div className="mt-2 pt-2 border-t border-neutral-100/60 hidden">
          <p className="text-[10px] text-neutral-400 font-medium">{description}</p>
        </div>
      )}
    </CardContent>
  </Card>
);


// --- Custom Recharts Tooltip ---
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-bold text-neutral-900 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || entry.fill }} className="font-semibold">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

// --- Custom Pie Label ---
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


const Analytics = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalViolations: 0, activeSanctions: 0,
    studentsInvolved: 0, resolutionRate: 0
  });
  const [severityData, setSeverityData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [topOffenses, setTopOffenses] = useState([]);
  const [sanctionStatusData, setSanctionStatusData] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // === 1. KPI Stat Cards ===
      const { data: violations } = await supabase
        .from("violations_sv")
        .select("violation_id, student_number, status, incident_date, offense_type_id");

      const { data: sanctions } = await supabase
        .from("student_sanctions_sv")
        .select("sanction_id, status");

      const { data: offenseTypes } = await supabase
        .from("offense_types_sv")
        .select("offense_type_id, name, severity");

      const vList = violations || [];
      const sList = sanctions || [];
      const oList = offenseTypes || [];

      // Build offense lookup map
      const offenseMap = {};
      oList.forEach(o => { offenseMap[o.offense_type_id] = o; });

      // KPIs
      const totalViolations = vList.length;
      const activeSanctions = sList.filter(s => s.status === "In Progress" || s.status === "Overdue").length;
      const uniqueStudents = new Set(vList.map(v => v.student_number));
      const studentsInvolved = uniqueStudents.size;
      const resolvedCount = vList.filter(v => v.status === "Resolved").length;
      const resolutionRate = totalViolations > 0 ? ((resolvedCount / totalViolations) * 100).toFixed(1) : 0;

      setStats({ totalViolations, activeSanctions, studentsInvolved, resolutionRate });

      // === 2. Violations by Severity ===
      const severityCounts = { Minor: 0, Major: 0, Compliance: 0 };
      vList.forEach(v => {
        const offense = offenseMap[v.offense_type_id];
        if (offense?.severity) severityCounts[offense.severity] = (severityCounts[offense.severity] || 0) + 1;
      });
      setSeverityData(
        Object.entries(severityCounts).map(([name, count]) => ({ name, count, fill: SEVERITY_COLORS[name] }))
      );

      // === 3. Violation Status Breakdown ===
      const statusCounts = {};
      vList.forEach(v => { statusCounts[v.status] = (statusCounts[v.status] || 0) + 1; });
      setStatusData(
        Object.entries(statusCounts).map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name] || "#94a3b8" }))
      );

      // === 4. Top Offense Types ===
      const offenseCounts = {};
      vList.forEach(v => {
        const offense = offenseMap[v.offense_type_id];
        if (offense) offenseCounts[offense.name] = (offenseCounts[offense.name] || 0) + 1;
      });
      const sorted = Object.entries(offenseCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, count]) => ({ name: name.length > 22 ? name.slice(0, 20) + "…" : name, count }));
      setTopOffenses(sorted);

      // === 5. Sanction Status Overview ===
      const sanctionCounts = {};
      sList.forEach(s => { sanctionCounts[s.status] = (sanctionCounts[s.status] || 0) + 1; });
      setSanctionStatusData(
        Object.entries(sanctionCounts).map(([name, value]) => ({ name, value, fill: SANCTION_STATUS_COLORS[name] || "#94a3b8" }))
      );

      // === 6. Monthly Violation Trend ===
      const monthCounts = {};
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      vList.forEach(v => {
        if (!v.incident_date) return;
        const d = new Date(v.incident_date);
        const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        monthCounts[key] = (monthCounts[key] || 0) + 1;
      });

      // Sort chronologically & take last 12 months
      const monthEntries = Object.entries(monthCounts)
        .map(([name, violations]) => {
          const parts = name.split(" ");
          const monthIdx = monthNames.indexOf(parts[0]);
          const year = parseInt(parts[1]);
          return { name, violations, sortKey: year * 12 + monthIdx };
        })
        .sort((a, b) => a.sortKey - b.sortKey)
        .slice(-12)
        .map(({ name, violations }) => ({ name, violations }));
      setMonthlyTrend(monthEntries);

    } catch (err) {
      console.error("Error fetching analytics data:", err);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="space-y-8 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700 text-left">
      <header className="mb-2 text-left shrink-0">
        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Disciplinary Analytics</h1>
        <p className="text-neutral-500 text-sm font-medium mt-2">Real-time statistics on violations, sanctions, and student compliance visually aggregated.</p>
      </header>

      {/* === KPI STAT CARDS === */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Violations" value={stats.totalViolations.toLocaleString()} icon={FileWarning} description="All reported incidents on record" isLoading={isLoading} borderTopClass="bg-destructive-semantic" iconClass="text-destructive-semantic bg-destructive-semantic/10 border-destructive-semantic/20" />
        <StatCard title="Active Sanctions" value={stats.activeSanctions.toLocaleString()} icon={Scale} description="Sanctions currently in progress or not started" isLoading={isLoading} borderTopClass="bg-warning" iconClass="text-warning bg-warning/10 border-warning/20" />
        <StatCard title="Students Involved" value={stats.studentsInvolved.toLocaleString()} icon={Users} description="Unique students with recorded offenses" isLoading={isLoading} borderTopClass="bg-info" iconClass="text-info bg-info/10 border-info/20" />
        <StatCard title="Resolution Rate" value={`${stats.resolutionRate}%`} icon={Activity} description="Violations successfully resolved and closed" isLoading={isLoading} borderTopClass="bg-success" iconClass="text-success bg-success/10 border-success/20" />
      </div>

      {/* === CHARTS GRID === */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main Trend - takes 2 cols on xl */}
        <Card className="xl:col-span-2 bg-white border-neutral-200 shadow-sm rounded-2xl overflow-hidden flex flex-col relative group">
          <div className="p-6 pb-2 flex items-center justify-between z-20">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                 <TrendingUp size={18} className="text-primary-600" /> Monthly Violation Trend
              </h3>
              <p className="text-xs text-neutral-500 font-medium mt-1">12-month historical incident volume</p>
            </div>
          </div>
          <div className="p-6 flex-1 flex items-center justify-center relative z-10" style={{ minHeight: 320 }}>
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
            ) : monthlyTrend.length === 0 ? (
              <p className="text-sm text-neutral-400 font-medium">Not enough data for a trend</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id={AREA_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary-500)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--primary-500)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }} axisLine={false} tickLine={false} allowDecimals={false} dx={-10} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#e5e7eb", strokeWidth: 2, strokeDasharray: "4 4" }} />
                  <Area
                    type="monotone" dataKey="violations" name="Violations"
                    stroke="var(--primary-600)" strokeWidth={3}
                    fill={`url(#${AREA_GRADIENT_ID})`}
                    activeDot={{ r: 6, fill: "var(--primary-600)", stroke: "#fff", strokeWidth: 2, shadow: "0px 4px 6px rgba(0,0,0,0.1)" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Severity Breakdown */}
        <Card className="bg-white border-neutral-200 shadow-sm rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 pb-2 flex items-center justify-between z-20">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                 <BarChart3 size={18} className="text-neutral-600" /> Severity Focus
              </h3>
              <p className="text-xs text-neutral-500 font-medium mt-1">Classification breakdown</p>
            </div>
          </div>
          <div className="p-6 flex-1 flex items-center justify-center" style={{ minHeight: 320 }}>
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
            ) : severityData.length === 0 ? (
              <p className="text-sm text-neutral-400 font-medium">No violation data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={severityData} barSize={40} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: "#6b7280" }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }} axisLine={false} tickLine={false} allowDecimals={false} dx={-10} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(243,244,246,0.4)" }} />
                  <Bar dataKey="count" name="Violations" radius={[6, 6, 0, 0]}>
                    {severityData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Pie */}
        <Card className="bg-white border-neutral-200 shadow-sm rounded-2xl overflow-hidden flex flex-col relative">
          <div className="p-6 pb-2 flex items-center justify-between z-20">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                 <ShieldAlert size={18} className="text-warning" /> Case Status Overview
              </h3>
              <p className="text-xs text-neutral-500 font-medium mt-1">Current state of violation records</p>
            </div>
          </div>
          <div className="p-6 flex-1 flex items-center justify-center pt-2" style={{ minHeight: 300 }}>
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
            ) : statusData.length === 0 ? (
              <p className="text-sm text-neutral-400 font-medium">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={100} innerRadius={55}
                    labelLine={false} label={renderPieLabel}
                    stroke="#fff" strokeWidth={3}
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: "20px" }}
                    formatter={(value) => <span className="text-[12px] font-semibold text-neutral-600 ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Sanction Status Pie */}
        <Card className="bg-white border-neutral-200 shadow-sm rounded-2xl overflow-hidden flex flex-col relative">
          <div className="p-6 pb-2 flex items-center justify-between z-20">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                 <Scale size={18} className="text-info" /> Sanction Resolution
              </h3>
              <p className="text-xs text-neutral-500 font-medium mt-1">Completion tracking for penalties</p>
            </div>
          </div>
          <div className="p-6 flex-1 flex items-center justify-center pt-2" style={{ minHeight: 300 }}>
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
            ) : sanctionStatusData.length === 0 ? (
              <p className="text-sm text-neutral-400 font-medium">No sanction data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={sanctionStatusData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={100} innerRadius={55}
                    labelLine={false} label={renderPieLabel}
                    stroke="#fff" strokeWidth={3}
                  >
                    {sanctionStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: "20px" }}
                    formatter={(value) => <span className="text-[12px] font-semibold text-neutral-600 ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

       {/* Top Offenses Horizontal Bar */}
      <div className="pb-8">
        <Card className="bg-white border-neutral-200 shadow-sm rounded-2xl overflow-hidden flex flex-col relative w-full">
          <div className="p-6 pb-2 flex items-center justify-between z-20">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                 <ShieldAlert size={18} className="text-destructive-semantic" /> Most Frequent Offenses
              </h3>
              <p className="text-xs text-neutral-500 font-medium mt-1">Top reported violation categories</p>
            </div>
          </div>
          <div className="p-6 flex-1 flex items-center justify-center" style={{ minHeight: 320 }}>
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
            ) : topOffenses.length === 0 ? (
              <p className="text-sm text-neutral-400 font-medium">No offense data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(260, topOffenses.length * 56)}>
                <BarChart data={topOffenses} layout="vertical" barSize={28} margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }} axisLine={false} tickLine={false} allowDecimals={false} dy={5} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fontWeight: 700, fill: "#374151" }} axisLine={false} tickLine={false} width={180} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(243,244,246,0.4)" }} />
                  <Bar dataKey="count" name="Violations" fill="var(--primary-600)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};


export default Analytics;
