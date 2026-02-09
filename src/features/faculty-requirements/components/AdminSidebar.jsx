import React, { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { invoke } from "@tauri-apps/api/core"
import {
  Shield,
  LayoutDashboard,
  Users,
  Calendar,
  CheckSquare,
  BarChart,
  Database,
  Settings,
  User,
  RefreshCw,
  LogOut,
  ChevronUp,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AppSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [stats, setStats] = useState({
    activeFaculty: 0,
    pendingValidation: 0,
    dashboardAlerts: 0,
    systemStatus: 'Online'
  })
  const [loading, setLoading] = useState(true)

  const isActive = (path) => location.pathname === path

  useEffect(() => {
    fetchSidebarStats()
    const interval = setInterval(fetchSidebarStats, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchSidebarStats = async () => {
    try {
      const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
      if (!isTauri) {
        setStats({ activeFaculty: 5, pendingValidation: 2, dashboardAlerts: 1, systemStatus: 'Dev' });
        setLoading(false);
        return;
      }

      const [dashStats, validStats] = await Promise.all([
        invoke('get_dashboard_stats'),
        invoke('get_validation_stats')
      ])

      setStats({
        activeFaculty: dashStats.total_faculty || 0,
        pendingValidation: validStats.pending_count || 0,
        dashboardAlerts: dashStats.pending_approvals || 0, 
        systemStatus: 'Online'
      })
    } catch (error) {
      console.error("Failed to update sidebar stats:", error)
      setStats(prev => ({ ...prev, systemStatus: 'Error' }))
    } finally {
      setLoading(false)
    }
  }

  const navItems = [
    { path: '/admin-dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: stats.dashboardAlerts },
    { path: '/faculty-monitor', label: 'Faculty Monitor', icon: Users },
    { path: '/deadlines', label: 'Deadline Manager', icon: Calendar },
    { path: '/validation', label: 'Validation Queue', icon: CheckSquare, badge: stats.pendingValidation },
    { path: '/reports', label: 'Reports', icon: BarChart },
    { path: '/archive', label: 'Document Archive', icon: Database },
  ]

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="bg-slate-900 border-slate-800">
      <SidebarHeader className="bg-slate-900 border-b border-slate-800">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              size="lg" 
              className="data-[state=open]:bg-slate-800 data-[state=open]:text-slate-100 hover:bg-slate-800"
            >
              {/* Icon Container */}
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-900/20">
                <Shield className="size-4" />
              </div>

              {/* Text Container - SidebarMenuButton handles hiding this automatically */}
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold text-slate-100">
                  Admin Portal
                </span>
                <span className="truncate text-xs text-slate-400">
                  Dean's Dashboard
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="bg-slate-900 overflow-x-hidden">
      <SidebarSeparator className="bg-slate-800 group-data-[collapsible=icon]:hidden" />
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500 group-data-[collapsible=icon]:hidden">
            Admin Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path} className="mb-1">
                  <SidebarMenuButton 
                    isActive={isActive(item.path)}
                    onClick={() => navigate(item.path)}
                    tooltip={item.label}
                    className={`text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors ${
                      isActive(item.path) ? "bg-slate-800 text-white" : ""
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${isActive(item.path) ? "text-blue-400" : ""}`} />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    {item.badge > 0 && (
                      <SidebarMenuBadge className="bg-red-500 text-white group-data-[collapsible=icon]:hidden">
                        {item.badge}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={isActive('/settings')}
                  onClick={() => navigate('/settings')}
                  className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                  tooltip="System Settings"
                >
                  <Settings className="h-4 w-4" />
                  <span className="group-data-[collapsible=icon]:hidden">System Settings</span>
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
                <SidebarMenuButton
                  size="lg"
                  className="w-full justify-start gap-3 hover:bg-slate-800 text-slate-200 group-data-[collapsible=icon]:justify-center"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-slate-700 shrink-0">
                     <User className="size-4 text-slate-100" />
                  </div>
                  <div className="flex-1 text-left text-slate-200 text-sm leading-tight group-data-[collapsible=icon]:hidden overflow-hidden min-w-0">
                    <span className="truncate font-medium block">Dean's Office</span>
                    <span className="truncate text-xs flex items-center gap-1 text-slate-400">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${stats.systemStatus === 'Online' ? 'bg-green-500' : 'bg-amber-500'}`} />
                      <span className="truncate">{stats.systemStatus}</span>
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4 text-slate-500 group-data-[collapsible=icon]:hidden shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-56 bg-slate-900 border-slate-800 text-slate-200">
                <DropdownMenuItem onClick={fetchSidebarStats} className="hover:bg-slate-800 focus:bg-slate-800 focus:text-white">
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Sync Stats</span>
                </DropdownMenuItem>
                <SidebarSeparator className="bg-slate-800" />
                <DropdownMenuItem 
                  onClick={() => navigate("/dashboard")} 
                  className="text-red-400 hover:bg-red-950/30 focus:bg-red-950/30 focus:text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}