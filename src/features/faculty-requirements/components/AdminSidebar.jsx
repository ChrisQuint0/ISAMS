import React, { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  Shield,
  LayoutDashboard,
  Users,
  Calendar,
  Clock,
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
          // Fallback to auth metadata — build full name
          const meta = session.user.user_metadata
          const name = meta?.full_name || meta?.name ||
            (meta?.first_name ? `${meta.first_name} ${meta.last_name || ''}`.trim() : null)
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
    { path: '/semester-management', label: 'Semester Manager', icon: Clock },
    { path: '/validation', label: 'Validation Queue', icon: CheckSquare },
    { path: '/reports', label: 'Reports', icon: BarChart },
    { path: '/archive', label: 'Document Archive', icon: Database },
  ]

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="bg-white border-neutral-200">
      <SidebarHeader className="bg-white border-b border-neutral-200">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-neutral-100 data-[state=open]:text-neutral-900 hover:bg-neutral-100"
            >
              {/* Icon Container */}
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-primary text-white shadow-lg shadow-emerald-900/20">
                <Shield className="size-4" />
              </div>

              {/* Text Container */}
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold text-neutral-900">
                  Admin Portal
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="bg-white overflow-x-hidden">
        <SidebarSeparator className="bg-neutral-100 group-data-[collapsible=icon]:hidden" />
        <SidebarGroup>
          <SidebarGroupLabel className="text-neutral-500 group-data-[collapsible=icon]:hidden font-semibold uppercase tracking-wider text-[10px]">
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
                    className={`text-neutral-600 hover:text-primary-700 hover:bg-neutral-100 transition-all rounded-md ${isActive(item.path)
                      ? "!bg-primary-600 !text-white shadow-md shadow-emerald-900/10"
                      : ""
                      }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="group-data-[collapsible=icon]:hidden font-medium">{item.label}</span>
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
                  className={`text-neutral-600 hover:text-primary-700 hover:bg-neutral-100 transition-all rounded-md ${isActive('/settings')
                    ? "!bg-primary-600 !text-white shadow-md shadow-emerald-900/10"
                    : ""
                    }`}
                  tooltip="System Settings"
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden font-medium">System Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-neutral-50 border-t border-neutral-200 p-2">
        <SidebarMenu>
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
                  <div className="flex-1 text-left text-neutral-900 text-sm leading-tight group-data-[collapsible=icon]:hidden overflow-hidden min-w-0">
                    <span className="truncate font-bold block">{adminName}</span>
                    <span className="truncate text-xs text-neutral-500">Administrator</span>
                  </div>
                  <ChevronUp className="ml-auto size-4 text-neutral-400 group-data-[collapsible=icon]:hidden shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-56 bg-white border-neutral-200 text-neutral-900 shadow-xl">
                <DropdownMenuItem
                  onClick={() => navigate("/dashboard")}
                  className="text-primary-600 hover:bg-neutral-100 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Main Dashboard</span>
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