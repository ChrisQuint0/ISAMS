import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Users, ShieldAlert, 
  FileText, Settings, LogOut, UserCircle,
  BarChart3
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
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] transition-all relative group cursor-pointer mb-1 ${
      active 
        ? "bg-[#161B26] text-white shadow-lg border border-slate-700/50" 
        : "text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent"
    } group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0`}
  >
    {active && (
      /* Vertical indicator matched to the dashboard's industrial style */
      <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-slate-400 rounded-r-full shadow-[0_0_10px_rgba(148,163,184,0.3)]" />
    )}
    <span className={`${active ? "text-slate-200" : "group-hover:text-slate-300"} transition-colors`}>
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
    /* Background set to #090E1A to match the activity log cards exactly */
    <Sidebar className="!bg-[#090E1A] border-r border-slate-900 shadow-2xl" collapsible="icon">
      
      <SidebarHeader className="p-6 flex flex-col items-center !bg-transparent pt-12 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:pt-10">
        <div className="relative group cursor-pointer mb-3">
          <div className="absolute -inset-2 bg-slate-500/5 rounded-full blur-xl group-hover:bg-slate-500/10 transition"></div>
          <Avatar className="h-14 w-14 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 border border-slate-800 relative bg-[#020617] shadow-2xl transition-all">
            <AvatarFallback className="bg-transparent text-slate-500">
              <UserCircle className="w-10 h-10 group-data-[collapsible=icon]:w-6 group-data-[collapsible=icon]:h-6" />
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex flex-col items-center group-data-[collapsible=icon]:hidden">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">ADMIN PANEL</span>
          <div className="h-[1px] w-8 bg-slate-800 mt-2" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 mt-4 flex flex-col gap-1 !bg-transparent group-data-[collapsible=icon]:px-2">
        <div className="mb-4">
          <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] px-4 mb-3 group-data-[collapsible=icon]:hidden">Core</p>
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
            label="Violations" 
            active={location.pathname === "/violations"} 
            onClick={() => navigate("/violations")} 
          />
        </div>

        <div>
          <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] px-4 mb-3 group-data-[collapsible=icon]:hidden">System</p>
          <NavItem 
            icon={<FileText size={18} />} 
            label="Generate Report" 
            active={location.pathname === "/generate-report"} 
            onClick={() => navigate("/generate-report")} 
          />
          <NavItem 
            icon={<BarChart3 size={18} />} 
            label="Analytics" 
            active={location.pathname === "/analytics"}
            onClick={() => navigate("/analytics")}
          />
        </div>
      </SidebarContent>

      <SidebarFooter className="p-4 !bg-transparent border-t border-slate-900 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:py-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/login")}
          className="w-full justify-start group-data-[collapsible=icon]:justify-center text-slate-600 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl h-12 transition-all cursor-pointer"
        >
          <LogOut className="mr-3 h-4 w-4 group-data-[collapsible=icon]:mr-0" /> 
          <span className="group-data-[collapsible=icon]:hidden text-[11px] font-black uppercase tracking-widest">Log Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};