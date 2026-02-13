import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, Search, ShieldAlert, Users, FileText, 
  History, LayoutDashboard, Database 
} from "lucide-react";

// Shadcn UI Imports
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

const MainDashboard = () => {
  const navigate = useNavigate();

  const activities = [
    { id: 1, type: "RECENT ACTIVITY #1", detail: "Details about this activity or a short description.", time: "JUST NOW" },
    { id: 2, type: "RECENT ACTIVITY #2", detail: "Details about this activity or a short description.", time: "JUST NOW" },
    { id: 3, type: "RECENT ACTIVITY #3", detail: "Details about this activity or a short description.", time: "JUST NOW" },
    { id: 4, type: "RECENT ACTIVITY #4", detail: "Details about this activity or a short description.", time: "JUST NOW" },
  ];

  const quickActions = [
    { icon: <Plus size={18} />, label: "Add" },
    { icon: <Search size={18} />, label: "Search" },
    { icon: <Users size={18} />, label: "Groups", onClick: () => navigate("/students") },
    { icon: <FileText size={18} />, label: "Report" },
    { icon: <Database size={18} />, label: "Database" },
  ];

  return (
    <>
      {/* Header Bar - Scaled Down */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-white/5 px-6 bg-[#0B0E14]/80 backdrop-blur-md z-20">
        <SidebarTrigger className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-md scale-90" />
        <Separator orientation="vertical" className="mx-1 h-3 bg-white/10" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink className="text-slate-500 text-[10px] font-bold uppercase tracking-widest cursor-default">ISAMS</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-slate-700" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white font-bold text-xs tracking-tight cursor-default uppercase">DASHBOARD</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-6 lg:p-10 overflow-y-auto overflow-x-hidden no-scrollbar relative">
        {/* Ambient Background Glows */}
        <div className="absolute top-[-5%] right-[-2%] w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-5%] left-[-2%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full transition-all duration-300">
          <header className="mb-10 text-left">
            <h1 className="text-4xl font-black tracking-tight text-white mb-1 uppercase leading-none">DASHBOARD</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-[1.5px] w-6 bg-blue-600" />
              <p className="text-blue-500 font-bold tracking-[0.3em] text-[9px] uppercase">Violation Management System</p>
            </div>
          </header>

          <section className="mb-12 flex flex-col items-center">
            <h3 className="text-[8px] font-bold tracking-[0.5em] text-slate-600 uppercase mb-8">Quick Actions</h3>
            <div className="flex flex-wrap justify-center gap-6 w-full">
              {quickActions.map((action, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <button 
                    onClick={action.onClick}
                    className="group flex items-center justify-center h-14 w-14 rounded-full border border-white/5 transition-all duration-300 cursor-pointer bg-white/5 hover:bg-blue-600/20 hover:border-blue-500 hover:scale-105 shadow-lg"
                  >
                    <div className="text-slate-400 group-hover:text-blue-400 transition-colors">{action.icon}</div>
                  </button>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{action.label}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="w-full text-left">
            <Separator className="bg-white/5 mb-8 shadow-2xl" />

            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-1.5 rounded-lg bg-blue-600/10 border border-blue-600/20">
                  <History size={14} className="text-blue-500" />
                </div>
                <h2 className="text-sm font-bold text-white tracking-tight uppercase">Recent Activity</h2>
              </div>

              <div className="space-y-1 pb-10 w-full">
                {activities.map((item) => (
                  <Card key={item.id} className="w-full bg-[#0D1016]/40 border-white/5 backdrop-blur-md hover:border-blue-500/20 hover:bg-blue-900/5 transition-all duration-300 group shadow-md border-l-0 border-r-0 rounded-none first:rounded-lg last:rounded-lg">
                    <CardContent className="py-2 px-5 flex items-center justify-between min-h-[44px]">
                      <div className="flex items-center gap-4">
                        <div className="h-1 w-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        <div className="flex flex-col">
                          <h4 className="font-bold text-slate-200 text-[10px] group-hover:text-blue-400 transition-colors tracking-tight uppercase leading-none">{item.type}</h4>
                          <p className="text-[9px] text-slate-600 font-medium leading-tight mt-0.5">{item.detail}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <span className="text-[8px] font-bold text-blue-400/30 uppercase tracking-widest italic whitespace-nowrap">{item.time}</span>
                        <Button variant="outline" className="h-5 px-3 bg-slate-950/80 border-blue-900/50 text-blue-400 hover:text-white hover:bg-blue-600 hover:border-blue-400 rounded-md text-[8px] font-black transition-all cursor-pointer">
                          DETAILS
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default MainDashboard;