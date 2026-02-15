
import React from "react";
import {
  BarChart3, TrendingUp, Users, ShieldAlert,
  ArrowUpRight, ArrowDownRight, Activity
} from "lucide-react";


// Shadcn UI Imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";


const AnalyticsCard = ({ title, value, trend, isUp, icon: Icon }) => (
  <Card className="bg-slate-900 border-slate-800 rounded-xl overflow-hidden relative group transition-all hover:border-slate-700">
    <CardContent className="p-5">
      <div className="flex justify-between items-start mb-4">
        <p className="text-xs font-semibold text-slate-500 tracking-tight">{title}</p>
        <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 group-hover:text-white transition-colors">
          <Icon size={18} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <h3 className="text-2xl font-bold text-white tracking-tight leading-none">{value}</h3>
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
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      {/* PAGE HEADER: Matched to Student Database style */}
      <header className="mb-10 text-left shrink-0">
        <h1 className="text-2xl font-bold text-white tracking-tight">System Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Statistical insights and disciplinary trends</p>
      </header>


      {/* QUICK ANALYTICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard title="Monthly Violations" value="142" trend="+12%" isUp={false} icon={ShieldAlert} />
        <AnalyticsCard title="Avg Resolution" value="3.2d" trend="-18%" isUp={true} icon={TrendingUp} />
        <AnalyticsCard title="Student Reach" value="2.4k" trend="+5.4%" isUp={true} icon={Users} />
        <AnalyticsCard title="System Uptime" value="99.9%" trend="Stable" isUp={true} icon={Activity} />
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
        {/* WEEKLY TREND CHART */}
        <Card className="lg:col-span-2 bg-slate-900 border-slate-800 rounded-lg overflow-hidden">
          <CardHeader className="p-5 border-b border-slate-800 bg-slate-800/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <TrendingUp size={16} className="text-slate-400" /> Weekly Frequency
              </CardTitle>
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Last 7 days</span>
            </div>
          </CardHeader>
          <CardContent className="p-6 h-72 flex items-end justify-between gap-4">
            {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end">
                <div className="w-full bg-slate-950/40 rounded-t-md h-full relative flex items-end justify-center overflow-hidden border border-slate-800/30">
                  <div
                    className="w-full bg-gradient-to-t from-blue-600/40 to-blue-400/10 transition-all duration-500 hover:from-blue-500/60 group relative"
                    style={{ height: `${h}%` }}
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      {h}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500">Day {i+1}</span>
              </div>
            ))}
          </CardContent>
        </Card>


        {/* PRIORITY ALERTS */}
        <Card className="bg-slate-900 border-slate-800 rounded-lg overflow-hidden">
          <CardHeader className="p-5 border-b border-slate-800 bg-slate-800/20">
            <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-500" /> Priority Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {[
              { label: "Uniform Policy", count: 42, color: "bg-rose-500" },
              { label: "Late Entry", count: 28, color: "bg-orange-500" },
              { label: "ID Violation", count: 15, color: "bg-amber-500" },
              { label: "Conduct", count: 8, color: "bg-slate-500" },
            ].map((item, i) => (
              <div key={i} className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-400">{item.label}</span>
                  <span className="text-xs font-bold text-white">{item.count}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-950/60 rounded-full overflow-hidden border border-slate-800/50">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                    style={{ width: `${(item.count / 50) * 100}%` }}
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
