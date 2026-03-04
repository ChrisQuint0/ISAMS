import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Home, FileText, Calendar, Monitor, BarChart3,
  ShieldCheck, Tablet, User, LogOut, ChevronUp, Settings 
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarRail, SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LabSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // TRUE BULLETPROOF MEMORY: Read directly from the source of truth
  const activeLabId = sessionStorage.getItem('active_lab_id') || "lab-1";
  const activeLabName = sessionStorage.getItem('active_lab_name') || "Loading...";

  // SMART TITLE FORMATTER (Consistent with headers and breadcrumbs)
  const displayLabName = activeLabName.replace(/^(Computer\s*)?Lab\s/i, 'Computer Laboratory ');

  const isActive = (path) => location.pathname === path;

  // NO MORE SENDING BAD STATE! Just navigate cleanly.
  const navTo = (path) => navigate(path);

  const menuItems = [
    { title: "Dashboard", icon: Home, url: "/lab-dashboard" },
    { title: "Access Logs", icon: FileText, url: "/access-logs" },
    { title: "Laboratory Schedule", icon: Calendar, url: "/lab-schedule" },
    { title: "PC Management", icon: Monitor, url: "/pc-management" },
    { title: "Reports & Analytics", icon: BarChart3, url: "/reports-analytics" },
    { title: "Audit Trails", icon: ShieldCheck, url: "/audit-trails" },
  ];

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="bg-slate-900 border-slate-800">
      <SidebarHeader className="bg-slate-900 border-b border-slate-800">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-slate-800 data-[state=open]:text-slate-100 hover:bg-slate-800">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-900/20">
                <Monitor className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                {/* UPDATED: Title and Formatted Lab Name */}
                <span className="truncate font-bold text-slate-100">Laboratory Management</span>
                <span className="truncate text-xs text-slate-400">{displayLabName}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="bg-slate-900 overflow-x-hidden">
        <SidebarSeparator className="bg-slate-800 group-data-[collapsible=icon]:hidden" />
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500 group-data-[collapsible=icon]:hidden">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url} className="mb-1">
                  <SidebarMenuButton 
                    isActive={isActive(item.url)}
                    onClick={() => navTo(item.url)}
                    tooltip={item.title}
                    className="text-slate-300 hover:text-slate-100 hover:bg-slate-800 active:bg-slate-800 focus:bg-slate-800 data-[active=true]:bg-slate-800 data-[active=true]:text-slate-100 focus-visible:ring-0"
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
           <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate("/kiosk-mode", { state: { labId: activeLabId, labName: activeLabName } })}
                  className="text-slate-400 hover:text-white hover:bg-blue-600/20 group-data-[collapsible=icon]:justify-center"
                  tooltip="Switch to Kiosk Mode"
                >
                  <Tablet className="h-4 w-4 text-blue-500" />
                  <span className="group-data-[collapsible=icon]:hidden text-blue-400">Switch to Kiosk Mode</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={isActive("/lab-settings")}
                  onClick={() => navTo("/lab-settings")}
                  className="text-slate-400 hover:text-slate-100 hover:bg-slate-800 active:bg-slate-800 data-[active=true]:bg-slate-800 data-[active=true]:text-slate-100 group-data-[collapsible=icon]:justify-center focus-visible:ring-0"
                  tooltip="Settings"
                >
                  <Settings className="h-4 w-4" />
                  <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-slate-900 border-slate-800 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="w-full justify-start gap-3 hover:bg-slate-800 text-slate-200 group-data-[collapsible=icon]:justify-center">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-slate-700 shrink-0">
                     <User className="size-4 text-slate-100" />
                  </div>
                  <div className="flex-1 text-left text-slate-200 text-sm leading-tight group-data-[collapsible=icon]:hidden overflow-hidden min-w-0">
                    <span className="truncate font-medium block">Lab Admin</span>
                    <span className="truncate text-xs flex items-center gap-1 text-slate-400">
                      <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-green-500" /> Online
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4 text-slate-500 group-data-[collapsible=icon]:hidden shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-56 bg-slate-900 border-slate-800 text-slate-200">
                <DropdownMenuItem onClick={() => navigate("/lab-monitoring")} className="text-red-400 hover:bg-red-950/30">
                  <LogOut className="mr-2 h-4 w-4" /> Back to Lab Selection
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}