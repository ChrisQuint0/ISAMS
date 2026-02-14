import React from "react"
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

export function FacultySidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  const navItems = [
    { path: '/faculty-requirements/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: 3 },
    { path: '/faculty-requirements/submission', label: 'Submit Documents', icon: Upload },
    { path: '/faculty-requirements/analytics', label: 'My Analytics', icon: BarChart },
    { path: '/faculty-requirements/archive', label: 'My Archive', icon: Archive },
    { path: '/faculty-requirements/hub', label: 'Template Hub', icon: Book },
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
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-green-600 text-white shadow-lg shadow-green-900/20">
                <FileText className="size-4" />
              </div>

              {/* Text Container - SidebarMenuButton handles hiding this automatically */}
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold text-slate-100">
                  Faculty Portal
                </span>
                <span className="truncate text-xs text-slate-400">
                  Requirements & Submissions
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
                    className={`text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors ${
                      isActive(item.path) ? "bg-slate-800 text-white" : ""
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${isActive(item.path) ? "text-green-400" : ""}`} />
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
                  isActive={isActive('/faculty-requirements/settings')}
                  onClick={() => navigate('/faculty-requirements/settings')}
                  className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                  tooltip="Faculty Settings"
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
                <SidebarMenuButton
                  size="lg"
                  className="w-full justify-start gap-3 hover:bg-slate-800 text-slate-200 group-data-[collapsible=icon]:justify-center"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-slate-700 shrink-0">
                     <User className="size-4 text-slate-100" />
                  </div>
                  <div className="flex-1 text-left text-slate-200 text-sm leading-tight group-data-[collapsible=icon]:hidden overflow-hidden min-w-0">
                    <span className="truncate font-medium block">Faculty Member</span>
                    <span className="truncate text-xs flex items-center gap-1 text-slate-400">
                      <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-green-500" />
                      <span className="truncate">Active</span>
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4 text-slate-500 group-data-[collapsible=icon]:hidden shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-56 bg-slate-900 border-slate-800 text-slate-200">
                <DropdownMenuItem 
                  onClick={() => navigate("/dashboard")} 
                  className="text-red-400 hover:bg-red-950/30 focus:bg-red-950/30 focus:text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Back to Main Menu</span>
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
