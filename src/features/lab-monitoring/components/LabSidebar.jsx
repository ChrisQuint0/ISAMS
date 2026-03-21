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
    <Sidebar variant="sidebar" collapsible="icon" className="bg-white border-neutral-200">
      <SidebarHeader className="bg-white border-b border-neutral-200">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-neutral-100 data-[state=open]:text-neutral-900 hover:bg-neutral-100">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary-600 text-white">
                <Monitor className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold text-neutral-900">Laboratory Management</span>
                <span className="truncate text-xs text-neutral-500">{displayLabName}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="bg-white overflow-x-hidden">
        <SidebarSeparator className="bg-neutral-200 group-data-[collapsible=icon]:hidden" />
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-neutral-500 group-data-[collapsible=icon]:hidden">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url} className="mb-1">
                  <SidebarMenuButton 
                    isActive={isActive(item.url)}
                    onClick={() => navTo(item.url)}
                    tooltip={item.title}
                    className="text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 active:bg-primary-600 focus:bg-primary-600 data-[active=true]:bg-primary-600 data-[active=true]:text-white focus-visible:ring-0"
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
                  className="text-neutral-600 hover:text-primary-600 hover:bg-neutral-100 group-data-[collapsible=icon]:justify-center"
                  tooltip="Switch to Kiosk Mode"
                >
                  <Tablet className="h-4 w-4 text-primary-600" />
                  <span className="group-data-[collapsible=icon]:hidden text-primary-600">Switch to Kiosk Mode</span>
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
                  className="text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 active:bg-primary-600 data-[active=true]:bg-primary-600 data-[active=true]:text-white group-data-[collapsible=icon]:justify-center focus-visible:ring-0"
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

      <SidebarFooter className="bg-white border-neutral-200 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="w-full justify-start gap-3 hover:bg-neutral-100 text-neutral-900 group-data-[collapsible=icon]:justify-center">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-neutral-200 shrink-0">
                     <User className="size-4 text-neutral-700" />
                  </div>
                  <div className="flex-1 text-left text-neutral-900 text-sm leading-tight group-data-[collapsible=icon]:hidden overflow-hidden min-w-0">
                    <span className="truncate font-medium block">Lab Admin</span>
                    <span className="truncate text-xs flex items-center gap-1 text-neutral-500">
                      <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-success" /> Online
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4 text-neutral-500 group-data-[collapsible=icon]:hidden shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-56 bg-neutral-50 border-neutral-200 text-neutral-900">
                <DropdownMenuItem onClick={() => navigate("/lab-monitoring")} className="text-destructive-semantic hover:bg-red-50">
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