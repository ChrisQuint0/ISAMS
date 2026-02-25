import React, { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
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
import { supabase } from "@/lib/supabaseClient"

export function AppSidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const [adminName, setAdminName] = useState("Admin")

  const isActive = (path) => location.pathname === path

  useEffect(() => {
    const fetchAdminName = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        // Try to get name from faculty_fs table first
        const { data } = await supabase
          .from('faculty_fs')
          .select('first_name, last_name')
          .eq('user_id', session.user.id)
          .maybeSingle()

        if (data?.first_name) {
          setAdminName(`${data.first_name} ${data.last_name}`.trim())
        } else {
          // Fallback to auth metadata
          const meta = session.user.user_metadata
          const name = meta?.full_name || meta?.name || meta?.first_name
          if (name) setAdminName(name)
        }
      } catch (err) {
        console.error("Failed to fetch admin name:", err)
      }
    }
    fetchAdminName()
  }, [])

  const navItems = [
    { path: '/admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/faculty-monitor', label: 'Faculty Monitor', icon: Users },
    { path: '/deadlines', label: 'Deadline Manager', icon: Calendar },
    { path: '/validation', label: 'Validation Queue', icon: CheckSquare },
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

              {/* Text Container */}
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold text-slate-100">
                  Admin Portal
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
                    className={`text-slate-300 hover:!text-slate-300 hover:!bg-slate-800 transition-colors ${isActive(item.path) ? "!bg-slate-800 !text-slate-300" : ""
                      }`}
                  >
                    <item.icon className={`h-4 w-4 ${isActive(item.path) ? "text-blue-400" : ""}`} />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
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
                  className={`text-slate-300 hover:!text-slate-300 hover:!bg-slate-800 transition-colors ${isActive('/settings') ? "!bg-slate-800 !text-slate-300" : ""
                    }`}
                  tooltip="System Settings"
                >
                  <Settings className={`h-4 w-4 ${isActive('/settings') ? "text-blue-400" : ""}`} />
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
                  <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-blue-700 shrink-0">
                    <User className="size-4 text-slate-100" />
                  </div>
                  <div className="flex-1 text-left text-slate-200 text-sm leading-tight group-data-[collapsible=icon]:hidden overflow-hidden min-w-0">
                    <span className="truncate font-medium block">{adminName}</span>
                    <span className="truncate text-xs text-slate-400">Admin</span>
                  </div>
                  <ChevronUp className="ml-auto size-4 text-slate-500 group-data-[collapsible=icon]:hidden shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-56 bg-slate-900 border-slate-800 text-slate-200">
                <DropdownMenuItem
                  onClick={() => navigate("/dashboard")}
                  className="text-red-400 hover:bg-red-950/30 hover:text-red-300 focus:bg-red-950/30 focus:text-red-300"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Back to Main Dashboard</span>
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