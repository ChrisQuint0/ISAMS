import React, { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  FileText,
  LayoutDashboard,
  Upload,
  BarChart,
  Archive,
  Book,
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

export function FacultySidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const [facultyName, setFacultyName] = useState("Faculty")

  const isActive = (path) => location.pathname === path

  useEffect(() => {
    const fetchFacultyName = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        const { data } = await supabase
          .from('faculty_fs')
          .select('first_name, last_name')
          .eq('user_id', session.user.id)
          .maybeSingle()

        if (data?.first_name) {
          setFacultyName(`${data.first_name} ${data.last_name}`.trim())
        } else {
          // Fallback to auth metadata — build full name
          const meta = session.user.user_metadata
          const name = meta?.full_name || meta?.name ||
            (meta?.first_name ? `${meta.first_name} ${meta.last_name || ''}`.trim() : null)
          if (name) setFacultyName(name)
        }
      } catch (err) {
        console.error("Failed to fetch faculty name:", err)
      }
    }
    fetchFacultyName()
  }, [])

  const navItems = [
    { path: '/faculty-requirements/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/faculty-requirements/submission', label: 'Submit Documents', icon: Upload },
    { path: '/faculty-requirements/analytics', label: 'My Analytics', icon: BarChart },
    { path: '/faculty-requirements/archive', label: 'My Archive', icon: Archive },
    { path: '/faculty-requirements/hub', label: 'Template Hub', icon: Book },
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
                <FileText className="size-4" />
              </div>

              {/* Text Container */}
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold text-neutral-900">
                  Faculty Portal
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
            Faculty Navigation
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
                  isActive={isActive('/faculty-requirements/settings')}
                  onClick={() => navigate('/faculty-requirements/settings')}
                  className={`text-neutral-600 hover:text-primary-700 hover:bg-neutral-100 transition-all rounded-md ${isActive('/faculty-requirements/settings')
                    ? "!bg-primary-600 !text-white shadow-md shadow-emerald-900/10"
                    : ""
                    }`}
                  tooltip="Faculty Settings"
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden font-medium">Settings</span>
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
                    <span className="truncate font-bold block">{facultyName}</span>
                    <span className="truncate text-xs text-neutral-500">Instructor</span>
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
