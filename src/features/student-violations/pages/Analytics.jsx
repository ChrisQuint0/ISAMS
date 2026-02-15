import React from "react";
import { 
  BarChart3, TrendingUp, Users, ShieldAlert, 
  Calendar, ArrowUpRight, ArrowDownRight, Activity
} from "lucide-react";

// Shadcn UI Imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const AnalyticsCard = ({ title, value, trend, isUp, icon: Icon }) => (
  /* Matching the high-density card style from the Faculty Module */
  <Card className="bg-slate-900 border-slate-800 backdrop-blur-md rounded-2xl overflow-hidden relative group transition-all hover:scale-[1.02]">
    <CardContent className="p-6">
      <div className="flex justify-between items-start mb-4">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{title}</p>
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-400 group-hover:text-white transition-colors">
          <Icon size={18} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <h3 className="text-3xl font-black text-slate-100 tracking-tighter leading-none">{value}</h3>
        <div className={`flex items-center gap-1 text-[11px] font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      </div>
    </CardContent>
  </Card>
);

const Analytics = () => {
  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Updated Header with specific pathing */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-slate-800 px-6 bg-slate-900/50 backdrop-blur-xl z-20">
        <SidebarTrigger className="text-slate-400 hover:text-slate-100 p-2 hover:bg-slate-800 rounded-md scale-90" />
        <Separator orientation="vertical" className="mx-1 h-3 bg-slate-800" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] cursor-default">ISAMS</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-slate-800" />
            <BreadcrumbItem>
              <BreadcrumbLink className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] cursor-default">Student Violation Module</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-slate-800" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-slate-100 font-bold text-sm tracking-tight uppercase">Analytics</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto no-scrollbar relative">
        <header className="mb-10 text-left shrink-0">
          <h1 className="text-4xl font-black tracking-tight text-slate-100 mb-1 uppercase leading-none">SYSTEM ANALYTICS</h1>
          <div className="flex items-center gap-3 mt-3">
            <div className="h-[2px] w-8 bg-slate-600" />
            <p className="text-slate-500 font-black tracking-[0.3em] text-[11px] uppercase">Statistical Insights & Trends</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <AnalyticsCard title="Monthly Violations" value="142" trend="+12%" isUp={false} icon={ShieldAlert} />
          <AnalyticsCard title="Avg Resolution" value="3.2d" trend="-18%" isUp={true} icon={TrendingUp} />
          <AnalyticsCard title="Student Reach" value="2.4k" trend="+5.4%" isUp={true} icon={Users} />
          <AnalyticsCard title="System Uptime" value="99.9%" trend="Stable" isUp={true} icon={Activity} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
          {/* WEEKLY TREND CHART */}
          <Card className="lg:col-span-2 bg-slate-900 border-slate-800 backdrop-blur-md rounded-[2rem] overflow-hidden">
            <CardHeader className="p-6 border-b border-slate-800 bg-slate-900/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp size={16} className="text-slate-400" /> Weekly Frequency
                </CardTitle>
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Last 7 Days</span>
              </div>
            </CardHeader>
            <CardContent className="p-8 h-80 flex items-end justify-between gap-5">
              {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-4 h-full justify-end">
                  <div className="w-full bg-slate-950/40 rounded-t-xl h-full relative flex items-end justify-center overflow-hidden border border-slate-800/30">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-600/40 to-blue-400/10 transition-all duration-500 hover:from-blue-500/60 group relative" 
                      style={{ height: `${h}%` }}
                    >
                       <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[11px] font-black text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {h}
                       </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Day {i+1}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* TOP OFFENSES CATEGORIES */}
          <Card className="bg-slate-900 border-slate-800 backdrop-blur-md rounded-[2rem] overflow-hidden">
            <CardHeader className="p-6 border-b border-slate-800 bg-slate-900/20">
              <CardTitle className="text-sm font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert size={16} className="text-rose-500" /> Priority Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-7">
              {[
                { label: "Uniform Policy", count: 42, color: "bg-rose-500" },
                { label: "Late Entry", count: 28, color: "bg-orange-500" },
                { label: "ID Violation", count: 15, color: "bg-amber-500" },
                { label: "Conduct", count: 8, color: "bg-slate-500" },
              ].map((item, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-tight">{item.label}</span>
                    <span className="text-[12px] font-black text-slate-100">{item.count}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950/60 rounded-full overflow-hidden border border-slate-800/50">
                    <div 
                      className={`h-full ${item.color} rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(244,63,94,0.2)]`} 
                      style={{ width: `${(item.count / 50) * 100}%` }} 
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;