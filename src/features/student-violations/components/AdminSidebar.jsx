import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import {
  Shield,
  LayoutDashboard,
  Users,
  ShieldAlert,
  FileText,
  BarChart3,
  User,
  Settings,
  LogOut,
  ChevronUp,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuth } from "@/features/auth/hooks/useAuth";

export function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [systemStatus, setSystemStatus] = useState("Online");

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
    setSystemStatus(isTauri ? "Online" : "Dev");
  }, []);

  const navItems = [
    { path: "/student-violations", label: "Dashboard", icon: LayoutDashboard },
    { path: "/students", label: "Students Record", icon: Users },
    { path: "/violations", label: "Student Violations", icon: ShieldAlert },
    { path: "/generate-report", label: "Generate Report", icon: FileText },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
  ];

  const userName = user?.user_metadata?.first_name && user?.user_metadata?.last_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
    : user?.email?.split("@")[0] ?? "User";

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="bg-white border-neutral-200"
    >
      <SidebarHeader className="bg-white border-b border-neutral-200">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-neutral-100 data-[state=open]:text-neutral-900 hover:bg-neutral-100 cursor-default"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-primary text-white shadow-lg shadow-emerald-900/20 shrink-0 transition-transform">
                <Shield className="size-4" />
              </div>
              <div className="flex flex-1 items-center group-data-[collapsible=icon]:hidden ml-3">
                <span className="truncate font-bold text-neutral-900 tracking-tight">
                  Violation Management
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="bg-white overflow-y-auto no-scrollbar overflow-x-hidden">
        <SidebarSeparator className="bg-neutral-100 group-data-[collapsible=icon]:hidden" />
        <SidebarGroup>
          <SidebarGroupLabel className="text-neutral-500 group-data-[collapsible=icon]:hidden font-semibold uppercase tracking-wider text-[10px] px-2 mb-4">
            Admin Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isActive(item.path)}
                    onClick={() => navigate(item.path)}
                    tooltip={item.label}
                    className={`text-neutral-600 hover:text-primary-700 hover:bg-neutral-100 transition-all rounded-md h-10 w-full ${
                      isActive(item.path)
                        ? "!bg-primary-600 !text-white shadow-md shadow-emerald-900/10 font-bold"
                        : ""
                    }`}
                  >
                    <item.icon
                      className={isActive(item.path) ? "size-5" : "size-[18px]"}
                    />
                    <span className="text-[14px] font-medium">
                      {item.label}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-neutral-50 border-t border-neutral-200 p-2 space-y-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="w-full text-neutral-600 hover:text-primary-700 hover:bg-neutral-200 transition-colors rounded-md"
              onClick={() => navigate("/violation-settings")}
            >
              <Settings className="size-4" />
              <span className="group-data-[collapsible=icon]:hidden ml-3 font-medium text-sm">
                System Settings
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="w-full justify-start gap-3 hover:bg-neutral-200 text-neutral-900 group-data-[collapsible=icon]:justify-center"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-primary-600 shrink-0">
                    <User className="size-4 text-white" />
                  </div>
                  <div className="flex-1 text-left text-neutral-900 text-sm leading-tight group-data-[collapsible=icon]:hidden overflow-hidden min-w-0 ml-3">
                    <span className="truncate font-bold block">
                      {userName}
                    </span>
                    <span className="truncate text-[10px] text-neutral-500">
                      Logged in
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4 text-neutral-400 group-data-[collapsible=icon]:hidden shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-56 bg-white border-neutral-200 text-neutral-900 shadow-xl"
              >
                <DropdownMenuItem
                  onClick={() => navigate("/login")}
                  className="text-primary-600 hover:bg-neutral-100 cursor-pointer font-semibold"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Back to Dashboard
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