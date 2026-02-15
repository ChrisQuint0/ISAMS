import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, ShieldAlert, FileText, BarChart3,
  History, PieChart, Clock, AlertTriangle,
  CalendarCheck, RefreshCw
} from "lucide-react";


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


export default function StudViolationDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);


  const navActions = [
    { icon: <Users size={20} />, label: "Records", onClick: () => navigate('/students'), color: "text-emerald-400" },
    { icon: <ShieldAlert size={20} />, label: "Manage", onClick: () => navigate('/violations'), color: "text-rose-400" },
    { icon: <FileText size={20} />, label: "Reports", onClick: () => navigate('/generate-report'), color: "text-amber-400" },
    { icon: <BarChart3 size={20} />, label: "Analytics", onClick: () => navigate('/analytics'), color: "text-blue-400" },
  ];


  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
     
      {/* PAGE HEADER: Matched to Student Database style */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-white tracking-tight leading-none">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            System overview • Semester 2, AY 2025-2026
          </p>
        </div>
        <Button
          variant="outline"
          className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-100 hover:text-slate-950 h-9 px-4 rounded-md font-semibold text-xs transition-all active:scale-95 shadow-sm"
          onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 800); }}
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh data
        </Button>
      </div>


      {/* QUICK ACTIONS SECTION */}
      <section className="flex flex-col items-center py-2">
        <div className="flex flex-wrap justify-center gap-12 md:gap-20">
          {navActions.map((action, i) => (
            <div key={i} className="flex flex-col items-center gap-4 group text-center">
              <button
                onClick={action.onClick}
                className="flex items-center justify-center h-14 w-14 rounded-xl border border-slate-800 bg-slate-900 hover:border-slate-500 hover:bg-slate-800 transition-all shadow-xl group-hover:-translate-y-1.5"
              >
                <div className={`${action.color} group-hover:text-white transition-colors`}>
                  {action.icon}
                </div>
              </button>
              <span className="text-[13px] font-semibold text-slate-400 group-hover:text-slate-200 tracking-tight">
                {action.label}
              </span>
            </div>
          ))}
        </div>
      </section>


      {/* STAT CARDS GRID: Professional weight and natural casing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Compliance" value="94%" icon={PieChart} color="text-emerald-400" />
        <StatCard title="Active cases" value="12" icon={Clock} color="text-amber-400" />
        <StatCard title="Critical" value="03" icon={AlertTriangle} color="text-rose-400" />
        <StatCard title="Resolved" value="88%" icon={CalendarCheck} color="text-blue-400" />
      </div>


      {/* RECENT ACTIVITY LOG: Updated with your student list */}
      <Card className="bg-slate-900 border-slate-800 rounded-lg overflow-hidden shadow-sm">
        <CardHeader className="px-6 py-4 border-b border-slate-800 bg-slate-800/20">
          <CardTitle className="text-sm font-semibold text-slate-200 flex items-center gap-2.5">
            <History className="h-4 w-4 text-slate-500" />
            Recent activity log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {[
            { id: 1, type: "New violation", detail: "Uniform policy breach: Jamil C. Saludo (23-00201).", time: "just now" },
            { id: 2, type: "Case cleared", detail: "Late entry violation for Marc Angelo A. Soria resolved.", time: "12 min ago" },
            { id: 3, type: "Record update", detail: "Ella Mae C. Leonidas moved to Active status.", time: "45 min ago" },
          ].map((item, i, arr) => (
            <div
              key={item.id}
              className={`flex items-center justify-between px-6 py-5 border-b border-slate-800/40 hover:bg-white/[0.01] transition-all group ${i === arr.length - 1 ? 'border-b-0' : ''}`}
            >
              <div className="flex items-center gap-5">
                <div className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-rose-500 animate-pulse' : 'bg-slate-600'} group-hover:bg-blue-500 transition-colors`} />
                <div className="flex flex-col gap-1">
                  <span className="text-[14px] font-bold text-slate-100">{item.type}</span>
                  <span className="text-sm text-slate-400 font-medium">{item.detail}</span>
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-500 italic whitespace-nowrap">{item.time}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}


function StatCard({ title, value, icon: Icon, color }) {
  return (
    <Card className="bg-slate-900 border border-slate-800 rounded-lg shadow-sm hover:border-slate-700 transition-colors">
      <CardContent className="p-5 flex justify-between items-center">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 tracking-tight">{title}</p>
          <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        </div>
        <div className="p-2.5 rounded-md bg-slate-800/50 border border-slate-700">
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );
}
