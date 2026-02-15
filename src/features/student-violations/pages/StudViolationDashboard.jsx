import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, FileText, History, PieChart, Clock, 
  AlertTriangle, CalendarCheck, RefreshCw, ShieldAlert, BarChart3
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,} from "@/components/ui/breadcrumb";

const MainDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const activities = [
    { id: 1, type: "NEW VIOLATION", detail: "Uniform policy breach reported for Student 2024-001 (Alex Johnson).", time: "JUST NOW" },
    { id: 2, type: "CASE CLEARED", detail: "Late entry violation for Maria Garcia (2024-002) has been resolved.", time: "10 MIN AGO" },
    { id: 3, type: "REPORT GENERATED", detail: "Monthly violation summary exported by Admin Panel.", time: "1 HR AGO" },
    { id: 4, type: "SYSTEM SYNC", detail: "Student database successfully synchronized with Registrar server.", time: "2 HRS AGO" },
    { id: 5, type: "MAJOR OFFENSE", detail: "Academic dishonesty report filed for Liam Smith (2024-003).", time: "3 HRS AGO" },
  ];

  // UPDATED: Analytics moved to the right side of Reports
  const navActions = [
    { 
      icon: <Users size={20} />, 
      label: "Records", 
      onClick: () => navigate('/students'), 
      color: "text-emerald-400" 
    },
    { 
      icon: <ShieldAlert size={20} />, 
      label: "Manage", 
      onClick: () => navigate('/violations'), 
      color: "text-rose-400" 
    },
    { 
      icon: <FileText size={20} />, 
      label: "Reports", 
      onClick: () => navigate('/generate-report'), 
      color: "text-amber-400" 
    },
    { 
      icon: <BarChart3 size={20} />, 
      label: "Analytics", 
      onClick: () => navigate('/analytics'), 
      color: "text-blue-400" 
    },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 min-h-screen text-left">
      {/* HEADER: bg color #090E1A matched */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-slate-800 px-6 bg-slate-900/50 z-20">
        <SidebarTrigger className="text-slate-400 hover:text-slate-100 transition-colors p-2 hover:bg-slate-800 rounded-md scale-90" />
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
              <BreadcrumbPage className="text-slate-100 font-bold text-sm tracking-tight uppercase">Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {/* Standardized pt-10 for pixel-perfect title alignment */}
      <div className="flex-1 px-6 lg:px-10 pt-10 pb-10 space-y-12 overflow-y-auto no-scrollbar relative">
        <div className="flex justify-between items-end shrink-0 relative z-10 mb-2">
          <div className="flex flex-col">
            <h1 className="text-4xl font-black text-slate-100 tracking-tighter uppercase leading-none">DASHBOARD</h1>
            <div className="flex items-center gap-3 mt-3">
              <div className="h-[2px] w-8 bg-slate-600" />
              <p className="text-slate-500 text-[11px] font-black tracking-[0.3em] uppercase">Violation Management Hub</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-100 h-9 px-4 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all mb-0.5"
            onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 800); }}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} /> 
            Refresh Data
          </Button>
        </div>

        {/* Quick Actions Grid with 4 Modules */}
        <section className="flex flex-col items-center relative z-10 py-2">
          <div className="flex flex-wrap justify-center gap-16">
            {navActions.map((action, i) => (
              <div key={i} className="flex flex-col items-center gap-4 group">
                <button 
                  onClick={action.onClick}
                  className="flex items-center justify-center h-16 w-16 rounded-2xl border border-slate-800 bg-slate-900 hover:border-slate-500 hover:bg-slate-800 transition-all duration-300 shadow-2xl group-hover:-translate-y-2"
                >
                  <div className={`${action.color} group-hover:text-slate-100 transition-colors`}>
                    {action.icon}
                  </div>
                </button>
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-300 uppercase tracking-[0.3em]">{action.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Section with Surface BG #090E1A */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          <StatCard title="Compliance" value="94%" icon={PieChart} color="text-emerald-400" border="border-emerald-500/20" />
          <StatCard title="Active" value="12" icon={Clock} color="text-amber-400" border="border-amber-500/20" />
          <StatCard title="Critical" value="03" icon={AlertTriangle} color="text-rose-400" border="border-rose-500/20" />
          <StatCard title="Resolved" value="88%" icon={CalendarCheck} color="text-blue-400" border="border-blue-500/20" />
        </div>

        {/* Activity Log Feed */}
        <Card className="bg-slate-900/50 border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative z-10 pb-10">
          <CardHeader className="px-8 py-5 border-b border-slate-800 bg-slate-900/20">
            <CardTitle className="text-sm font-bold text-slate-100 uppercase tracking-widest flex items-center gap-3">
              <History className="h-4 w-4 text-slate-500" /> Recent Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {activities.map((item, i) => (
              <div key={item.id} className={`flex items-center justify-between px-8 py-6 border-b border-slate-800/30 hover:bg-slate-800/50 transition-all group ${i === activities.length - 1 ? 'border-b-0' : ''}`}>
                <div className="flex items-center gap-6">
                  <div className="h-2 w-2 rounded-full bg-slate-700 group-hover:bg-blue-500 transition-colors shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
                  <div className="flex flex-col gap-1.5 text-left">
                    <span className="text-[13px] font-black text-slate-100 uppercase tracking-tight">{item.type}</span>
                    <span className="text-[14px] text-slate-400 font-medium leading-tight">{item.detail}</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest italic">{item.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function StatCard({ title, value, icon: Icon, color, border }) {
  return (
    <Card className={`bg-slate-900 ${border} border rounded-xl shadow-xl transition-all hover:scale-[1.01]`}>
      <CardContent className="p-5 flex justify-between items-center text-left">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</p>
          <p className="text-2xl font-black text-slate-100">{value}</p>
        </div>
        <div className={`p-2.5 rounded-lg bg-slate-950/40 border border-slate-800`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );
}

export default MainDashboard;