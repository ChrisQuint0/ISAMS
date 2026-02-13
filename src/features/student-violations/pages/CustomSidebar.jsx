import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Users, ShieldAlert, 
  FileText, Settings, LogOut, UserCircle 
} from "lucide-react";
import { 
  Sidebar, SidebarContent, SidebarFooter, 
  SidebarHeader 
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const NavItem = ({ icon, label, active = false, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all relative group cursor-pointer ${
      active 
        ? "bg-[#1A1D25] text-white shadow-lg shadow-black/20" 
        : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
    } group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0`}
  >
    {active && (
      <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r-full" />
    )}
    <span className={`${active ? "text-blue-400" : "group-hover:text-slate-300"} transition-colors`}>
      {icon}
    </span>
    <span className="group-data-[collapsible=icon]:hidden transition-opacity duration-200">
      {label}
    </span>
  </button>
);

export const CustomSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Sidebar className="!bg-[#0B0E14] border-r border-white/5 shadow-xl" collapsible="icon">
      <SidebarHeader className="p-6 flex flex-col items-center !bg-[#0B0E14] pt-10 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:pt-8">
        <div className="relative group cursor-pointer mb-2">
          <div className="absolute -inset-2 bg-blue-600/10 rounded-full blur-xl group-hover:bg-blue-600/20 transition"></div>
          <Avatar className="h-12 w-12 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 border border-white/10 relative bg-slate-900 shadow-2xl transition-all">
            <AvatarFallback className="bg-transparent text-slate-500">
              <UserCircle className="w-8 h-8 group-data-[collapsible=icon]:w-5 group-data-[collapsible=icon]:h-5" />
            </AvatarFallback>
          </Avatar>
        </div>
        <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4 group-data-[collapsible=icon]:hidden">ADMIN PANEL</span>
      </SidebarHeader>

      <SidebarContent className="px-4 flex flex-col gap-1 !bg-[#0B0E14] group-data-[collapsible=icon]:px-0">
        <NavItem 
          icon={<LayoutDashboard size={16} />} 
          label="Dashboard" 
          active={location.pathname === "/student-violations"} 
          onClick={() => navigate("/student-violations")} 
        />
        <NavItem 
          icon={<Users size={16} />} 
          label="Students Record" 
          active={location.pathname === "/students"} 
          onClick={() => navigate("/students")} 
        />
        <NavItem 
          icon={<ShieldAlert size={16} />} 
          label="Student Violations" 
          active={location.pathname === "/violations"} 
          onClick={() => navigate("/violations")} 
        />
        <NavItem 
          icon={<FileText size={16} />} 
          label="Generate Report" 
          active={location.pathname === "/generate-report"} 
          onClick={() => navigate("/generate-report")} 
        />
        <NavItem 
          icon={<Settings size={16} />} 
          label="Analytics" 
        />
      </SidebarContent>

      <SidebarFooter className="p-4 !bg-[#0B0E14] border-t border-white/5 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:py-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/login")}
          className="w-full justify-start group-data-[collapsible=icon]:justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all cursor-pointer group-data-[collapsible=icon]:px-0"
        >
          <LogOut className="mr-3 h-3.5 w-3.5 group-data-[collapsible=icon]:mr-0 transition-all" /> 
          <span className="group-data-[collapsible=icon]:hidden text-[10px] font-black uppercase tracking-widest">Log Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};