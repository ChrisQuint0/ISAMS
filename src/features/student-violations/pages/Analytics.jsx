import React from "react";
import { 
  BarChart3, TrendingUp, Users, ShieldAlert, 
  Calendar, ArrowUpRight, ArrowDownRight 
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

const MiniChart = ({ height, color }) => (
  <div className={`w-2 rounded-t-sm ${color}`} style={{ height: `${height}%` }} />
);

const AnalyticsCard = ({ title, value, trend, isUp }) => (
  <Card className="bg-[#0D1016]/40 border-white/5 backdrop-blur-md rounded-xl overflow-hidden">
    <CardContent className="p-5">
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</p>
      <div className="flex items-end justify-between">
        <h3 className="text-3xl font-black text-white tracking-tighter leading-none">{value}</h3>
        <div className={`flex items-center gap-1 text-[10px] font-bold ${isUp ? 'text-green-500' : 'text-red-500'}`}>
          {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </div>
      </div>
    </CardContent>
  </Card>
);

const Analytics = () => {
  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-white/5 px-6 bg-[#0B0E14]/80 backdrop-blur-md z-20">
        <SidebarTrigger className="text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-md scale-90" />
        <Separator orientation="vertical" className="mx-1 h-3 bg-white/10" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink className="text-slate-500 text-[10px] font-bold uppercase tracking-widest cursor-default">ISAMS</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-slate-700" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white font-bold text-xs tracking-tight cursor-default uppercase">ANALYTICS</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex-1 p-6 lg:p-10 overflow-y-auto no-scrollbar relative">
        <div className="relative z-10 w-full">
          <header className="mb-10 text-left">
            <h1 className="text-4xl font-black tracking-tight text-white mb-1 uppercase leading-none">SYSTEM ANALYTICS</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-[1.5px] w-6 bg-purple-600" />
              <p className="text-purple-500 font-bold tracking-[0.3em] text-[9px] uppercase">Statistical Insights</p>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <AnalyticsCard title="Monthly Violations" value="142" trend="+12%" isUp={false} />
            <AnalyticsCard title="Avg Resolution" value="3.2d" trend="-18%" isUp={true} />
            <AnalyticsCard title="Student Reach" value="2.4k" trend="+5.4%" isUp={true} />
            <AnalyticsCard title="System Uptime" value="99.9%" trend="Stable" isUp={true} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* WEEKLY TREND CHART */}
            <Card className="lg:col-span-2 bg-[#0D1016]/40 border-white/5 backdrop-blur-md rounded-2xl">
              <CardHeader className="p-6 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={14} className="text-blue-500" /> Weekly Frequency
                  </CardTitle>
                  <span className="text-[9px] text-slate-500 font-bold uppercase">Last 7 Days</span>
                </div>
              </CardHeader>
              <CardContent className="p-8 h-64 flex items-end justify-between gap-4">
                {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3">
                    <div className="w-full bg-white/[0.02] rounded-t-lg h-full relative flex items-end justify-center overflow-hidden">
                      <div className="w-full bg-gradient-to-t from-blue-600/40 to-blue-400/10 transition-all duration-500 hover:from-blue-500 group relative" style={{ height: `${h}%` }}>
                         <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-black text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">{h}</div>
                      </div>
                    </div>
                    <span className="text-[8px] font-bold text-slate-600 uppercase">Day {i+1}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* TOP OFFENSES */}
            <Card className="bg-[#0D1016]/40 border-white/5 backdrop-blur-md rounded-2xl">
              <CardHeader className="p-6 border-b border-white/5">
                <CardTitle className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert size={14} className="text-red-500" /> Priority Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {[
                  { label: "Uniform Policy", count: 42, color: "bg-red-500" },
                  { label: "Late Entry", count: 28, color: "bg-orange-500" },
                  { label: "ID Violation", count: 15, color: "bg-yellow-500" },
                  { label: "Conduct", count: 8, color: "bg-blue-500" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">{item.label}</span>
                      <span className="text-[10px] font-black text-white">{item.count}</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${(item.count / 50) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Analytics;