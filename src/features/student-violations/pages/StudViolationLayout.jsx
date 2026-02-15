import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, ShieldAlert, 
  FileText, Settings, LogOut, UserCircle 
} from "lucide-react";

// Components from your UI folder
import {
  Sidebar, SidebarContent, SidebarFooter, 
  SidebarHeader, SidebarProvider 
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const NavItem = ({ icon, label, active = false, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-black uppercase tracking-wider transition-all relative group cursor-pointer ${
      active
        ? "bg-slate-800 text-slate-100 shadow-lg shadow-black/40" 
        : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
    } group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0`}
  >
    {active && (
      /* Matches the subtle gray-blue vertical indicator from image_a623f6.png */
      <div className="absolute left-0 top-1/4 bottom-1/4 w-1.5 bg-slate-400 rounded-r-full shadow-[0_0_10px_rgba(148,163,184,0.3)]" />
    )}
    <span className={`${active ? "text-slate-200" : "group-hover:text-slate-300"} transition-colors`}>
      {icon}
    </span>
    <span className="group-data-[collapsible=icon]:hidden">
      {label}
    </span>
  </button>
);

export default function StudViolationLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <SidebarProvider>
      {/* 1. 'dark' class is REQUIRED to stop shadcn from turning white.
          2. Forced background to #020617 to match image_a5be9d.png 
      */}
      <div className="dark flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden select-none font-sans">
        
        {/* SIDEBAR: Set to #090E1A to match the specific card tone in image_a614f5.png 
        */}
        <Sidebar
          className="!bg-slate-900 !border-r !border-slate-800 shadow-2xl"
          collapsible="icon"
        >
          <SidebarHeader className="p-6 flex flex-col items-center !bg-slate-900 pt-12 group-data-[collapsible=icon]:pt-10">
            <div className="relative group cursor-pointer mb-3">
              <div className="absolute -inset-2 bg-slate-500/10 rounded-full blur-xl group-hover:bg-slate-500/20 transition"></div>
              <Avatar className="h-14 w-14 border border-slate-800 relative bg-slate-950 shadow-2xl">
                <AvatarFallback className="bg-transparent text-slate-500">
                  <UserCircle className="w-10 h-10" />
                </AvatarFallback>
              </Avatar>
            </div>
            <span className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em] mb-6 group-data-[collapsible=icon]:hidden">
              ADMIN PANEL
            </span>
          </SidebarHeader>

          <SidebarContent className="px-4 flex flex-col gap-2 !bg-slate-900 group-data-[collapsible=icon]:px-0">
            <NavItem
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              active={location.pathname === "/student-violations"}
              onClick={() => navigate("/student-violations")}
            />
            <NavItem
              icon={<Users size={18} />}
              label="Students Record"
              active={location.pathname === "/students"}
              onClick={() => navigate("/students")}
            />
            <NavItem
              icon={<ShieldAlert size={18} />}
              label="Student Violations"
              active={location.pathname === "/violations"}
              onClick={() => navigate("/violations")}
            />
            <NavItem
              icon={<FileText size={18} />}
              label="Generate Report"
              active={location.pathname === "/generate-report"}
              onClick={() => navigate("/generate-report")}
            />
            <NavItem
              icon={<Settings size={18} />}
              label="Analytics"
              active={location.pathname === "/analytics"}
              onClick={() => navigate("/analytics")}
            />
          </SidebarContent>

          <SidebarFooter className="p-4 !bg-slate-900 border-t border-slate-800 group-data-[collapsible=icon]:py-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/login")}
              className="w-full justify-start text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl h-12"
            >
              <LogOut className="mr-3 h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden text-[12px] font-black uppercase tracking-widest">
                Log Out
              </span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* MAIN CONTENT: Set to deepest background #020617 
        */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}