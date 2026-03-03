
import React from "react";
import {
  BarChart3, TrendingUp, Users, ShieldAlert,
  ArrowUpRight, ArrowDownRight, Activity, FileWarning, Scale
} from "lucide-react";


// Shadcn UI Imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";


const AnalyticsCard = ({ title, value, trend, isUp, icon: Icon, description }) => (
  <Card className="bg-white border-neutral-200 shadow-sm rounded-xl overflow-hidden relative group transition-all hover:border-primary-200 hover:shadow-md h-full flex flex-col">
    <CardContent className="p-5 flex-1 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-2">
          <p className="text-[11px] font-bold text-neutral-500 tracking-widest uppercase">{title}</p>
          <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-100 text-neutral-400 group-hover:text-primary-600 transition-colors">
            <Icon size={18} />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-4">
          <h3 className="text-3xl font-bold text-neutral-900 tracking-tight leading-none">{value}</h3>
          <div className={`flex items-center text-[12px] font-bold ${isUp ? 'text-success' : 'text-destructive-semantic'}`}>
            {isUp ? <ArrowUpRight size={14} className="mr-0.5" /> : <ArrowDownRight size={14} className="mr-0.5" />}
            {trend}
          </div>
        </div>
      </div>
      <p className="text-xs text-neutral-500 font-medium">{description}</p>
    </CardContent>
  </Card>
);


const Analytics = () => {
  return (
    <div className="space-y-8 flex flex-col h-full animate-in fade-in duration-500 text-left bg-neutral-50">
      <header className="mb-8 text-left shrink-0">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Disciplinary Analytics</h1>
        <p className="text-neutral-500 text-sm font-medium mt-1">Real-time statistics on violations, sanctions, and student compliance</p>
      </header>


      {/* QUICK ANALYTICS GRID: Mapped to Schema Entities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard title="Total Violations" value="1,248" trend="+12%" isUp={false} icon={FileWarning} description="All reported incidents this academic year" />
        <AnalyticsCard title="Active Sanctions" value="342" trend="-8%" isUp={true} icon={Scale} description="Students currently undergoing compliance" />
        <AnalyticsCard title="Students Involved" value="856" trend="+5.4%" isUp={false} icon={Users} description="Unique students with recorded offenses" />
        <AnalyticsCard title="Resolution Rate" value="82.4%" trend="+2.1%" isUp={true} icon={Activity} description="Violations successfully resolved and closed" />
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
        {/* WEEKLY TREND CHART: Re-themed for light mode */}
        <Card className="lg:col-span-2 bg-white border-neutral-200 shadow-sm rounded-xl overflow-hidden flex flex-col">
          <CardHeader className="p-5 border-b border-neutral-100 bg-neutral-50/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-neutral-900 uppercase tracking-tight flex items-center gap-2">
                <TrendingUp size={16} className="text-primary-600" /> Incident Frequency
              </CardTitle>
              <div className="flex gap-2">
                <span className="text-[10px] bg-white border border-neutral-200 text-neutral-600 px-2 py-1 rounded font-bold uppercase tracking-wider shadow-sm">Minor</span>
                <span className="text-[10px] bg-primary-50 border border-primary-200 text-primary-700 px-2 py-1 rounded font-bold uppercase tracking-wider shadow-sm">Major</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 flex-1 flex items-end justify-between gap-4 h-80">
            {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end">
                <div className="w-full bg-neutral-50/50 rounded-t-md h-full relative flex items-end justify-center overflow-hidden border border-neutral-100">
                  <div
                    className="w-full bg-gradient-to-t from-primary-600/60 to-primary-400/20 transition-all duration-500 hover:from-primary-500/80 group relative"
                    style={{ height: `${h}%` }}
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1.5 py-0.5 rounded border border-neutral-200 shadow-sm">
                      {h}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-neutral-500">Day {i+1}</span>
              </div>
            ))}
          </CardContent>
        </Card>


        {/* PRIORITY ALERTS: Mapped to Offense Severity and Status */}
        <Card className="bg-white border-neutral-200 shadow-sm rounded-xl overflow-hidden flex flex-col">
          <CardHeader className="p-5 border-b border-neutral-100 bg-neutral-50/50">
            <CardTitle className="text-sm font-bold text-neutral-900 uppercase tracking-tight flex items-center gap-2">
              <ShieldAlert size={16} className="text-warning" /> Top Offense Types
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-7 flex-1">
            {[
              { label: "Dress Code Violation", severity: "Minor", count: 324, color: "bg-warning", track: "bg-amber-100" },
              { label: "Academic Dishonesty", severity: "Major", count: 156, color: "bg-destructive-semantic", track: "bg-red-100" },
              { label: "Excessive Tardiness", count: 89, severity: "Minor", color: "bg-info", track: "bg-blue-100" },
              { label: "Property Damage", count: 42, severity: "Major", color: "bg-purple-500", track: "bg-purple-100" },
              { label: "ID Non-Compliance", count: 218, severity: "Compliance", color: "bg-neutral-500", track: "bg-neutral-200" },
            ].map((item, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm font-bold text-neutral-800 tracking-tight block">{item.label}</span>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{item.severity}</span>
                  </div>
                  <span className="text-sm font-bold text-neutral-900 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-md">{item.count}</span>
                </div>
                <div className={`h-2.5 w-full ${item.track} rounded-full overflow-hidden`}>
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-1000 shadow-inner`}
                    style={{ width: `${(item.count / 400) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};


export default Analytics;
