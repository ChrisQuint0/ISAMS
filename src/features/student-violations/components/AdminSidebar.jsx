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

export function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState({
    activeViolations: 0,
    pendingReports: 0,
    systemStatus: "Online",
  });

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    fetchSidebarStats();
    const interval = setInterval(fetchSidebarStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchSidebarStats = async () => {
    try {
      const isTauri =
        typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
      if (!isTauri) {
        setStats({
          activeViolations: 12,
          pendingReports: 3,
          systemStatus: "Dev",
        });
        return;
      }
      const [vCount, rCount] = await Promise.all([
        invoke("get_active_violations_count"),
        invoke("get_pending_reports_count"),
      ]);
      setStats({
        activeViolations: vCount || 0,
        pendingReports: rCount || 0,
        systemStatus: "Online",
      });
    } catch (error) {
      console.error("Failed to update stats:", error);
    }
  };

  const navItems = [
    { path: "/student-violations", label: "Dashboard", icon: LayoutDashboard },
    { path: "/students", label: "Students Record", icon: Users },
    {
      path: "/violations",
      label: "Student Violations",
      icon: ShieldAlert,
      badge: stats.activeViolations,
    },
    {
      path: "/generate-report",
      label: "Generate Report",
      icon: FileText,
      badge: stats.pendingReports,
    },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="bg-slate-900 border-slate-800"
    >
      <SidebarHeader className="bg-slate-900 border-b border-slate-800">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-transparent cursor-default active:bg-transparent"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-900/20 shrink-0 transition-transform">
                <Shield className="size-4" />
              </div>
              <div className="flex flex-1 items-center group-data-[collapsible=icon]:hidden ml-3">
                <span className="truncate font-bold text-slate-100 tracking-tight">
                  Violation Management
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="bg-slate-900 overflow-y-auto no-scrollbar overflow-x-hidden">
        <SidebarSeparator className="bg-slate-800 group-data-[collapsible=icon]:hidden" />
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500 text-[11px] font-semibold px-2 mb-4 group-data-[collapsible=icon]:hidden tracking-wide">
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
                    className={`h-10 w-full rounded-md transition-all ${
                      isActive(item.path)
                        ? "bg-slate-100 !text-blue-600 shadow-sm font-bold"
                        : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                    }`}
                  >
                    <item.icon
                      className={isActive(item.path) ? "size-5" : "size-[18px]"}
                    />
                    <span className="text-[14px] font-medium">
                      {item.label}
                    </span>
                    {item.badge > 0 && (
                      <SidebarMenuBadge className="bg-blue-600 text-white">
                        {item.badge}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-slate-900 border-t border-slate-800 p-2 space-y-1">
        <SidebarMenu>
          {/* SYSTEM SETTINGS: New section added based on image */}
          <SidebarMenuItem>
            <SidebarMenuButton
              className="w-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              onClick={() => navigate("/violation-settings")}
            >
              <Settings className="size-4" />
              <span className="group-data-[collapsible=icon]:hidden ml-3 font-medium text-sm">
                System Settings
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* USER PROFILE DROPDOWN */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="w-full hover:bg-slate-800 text-slate-200"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-slate-800 shrink-0 border border-slate-700">
                    <User className="size-4 text-slate-400" />
                  </div>
                  <div className="flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden overflow-hidden ml-3">
                    <span className="truncate font-semibold block text-slate-100">
                      Admin's Office
                    </span>
                    <span className="truncate text-[10px] flex items-center gap-1.5 text-slate-500">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${stats.systemStatus === "Online" ? "bg-green-500" : "bg-amber-500"}`}
                      />
                      {stats.systemStatus}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4 text-slate-500 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-56 bg-slate-900 border-slate-800 text-slate-200"
              >
                <DropdownMenuItem
                  onClick={() => navigate("/login")}
                  className="text-red-400 hover:bg-red-950/30 cursor-pointer font-semibold"
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