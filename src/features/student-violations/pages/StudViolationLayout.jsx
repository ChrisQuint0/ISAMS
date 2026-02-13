import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  FileText,
  Settings,
  LogOut,
  UserCircle,
} from "lucide-react";

// Components from your UI folder
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const NavItem = ({ icon, label, active = false, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative group cursor-pointer ${
      active
        ? "bg-[#1A1D25] text-white shadow-lg shadow-black/20"
        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
    } group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0`}
  >
    {active && (
      <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-gradient-to-b from-purple-500 to-blue-500 rounded-r-full" />
    )}
    <span
      className={`${active ? "text-blue-400" : "group-hover:text-slate-300"} transition-colors`}
    >
      {icon}
    </span>
    <span className="group-data-[collapsible=icon]:hidden transition-opacity duration-200">
      {label}
    </span>
  </button>
);

export default function StudViolationLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-[#07090D] text-slate-200 overflow-hidden select-none font-sans dark">
        {/* SIDEBAR SECTION */}
        <Sidebar
          className="!bg-[#0B0E14] border-r border-white/5 shadow-xl"
          collapsible="icon"
        >
          <SidebarHeader className="p-6 flex flex-col items-center !bg-[#0B0E14] pt-12 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:pt-8">
            <div className="relative group cursor-pointer mb-2">
              <div className="absolute -inset-2 bg-purple-600/20 rounded-full blur-xl group-hover:bg-purple-600/30 transition"></div>
              <Avatar className="h-16 w-16 group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:w-9 border-2 border-slate-700/50 relative bg-slate-900 shadow-2xl transition-all">
                <AvatarFallback className="bg-transparent text-slate-500">
                  <UserCircle className="w-10 h-10 group-data-[collapsible=icon]:w-6 group-data-[collapsible=icon]:h-6" />
                </AvatarFallback>
              </Avatar>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mb-4 group-data-[collapsible=icon]:hidden">
              ADMIN
            </span>
          </SidebarHeader>

          <SidebarContent className="px-4 flex flex-col gap-1 !bg-[#0B0E14] group-data-[collapsible=icon]:px-0">
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

          <SidebarFooter className="p-4 !bg-[#0B0E14] border-t border-white/5 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:py-4">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start group-data-[collapsible=icon]:justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all cursor-pointer group-data-[collapsible=icon]:px-0"
            >
              <LogOut className="mr-3 h-4 w-4 group-data-[collapsible=icon]:mr-0 transition-all" />
              <span className="group-data-[collapsible=icon]:hidden font-semibold">
                Log Out
              </span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* MAIN CONTENT SECTION */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#07090D] relative transition-all duration-300">
          {/* This Outlet is where StudRecords.jsx or StudViolationDashboard.jsx will be displayed */}
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
