import { useNavigate } from "react-router-dom";
import { Home, FileText, FlaskConical, Calendar, Monitor, BarChart3, Tablet, User, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", icon: Home, url: "/lab-dashboard" },
  { title: "Access Logs", icon: FileText, url: "/access-logs" },
  { title: "Laboratory Schedule", icon: Calendar, url: "/lab-schedule" },
  { title: "PC Management", icon: Monitor, url: "/pc-management" },
  { title: "Reports & Analytics", icon: BarChart3, url: "/reports-analytics" },
];

export function LabSidebar() {
  const navigate = useNavigate();

  return (
    <Sidebar className="bg-slate-900 border-slate-800">
      <SidebarContent className="bg-slate-900 overflow-x-hidden">
        <SidebarGroup>
          <div className="px-2 py-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                <FlaskConical className="h-6 w-6" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-slate-100 text-sm leading-tight">
                  Laboratory Management
                </span>
              </div>
            </div>
          </div>

          <SidebarSeparator className="bg-slate-800 mb-5" />

          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title} className="mb-3">
                  <SidebarMenuButton 
                    onClick={() => navigate(item.url)}
                    className="text-slate-300 hover:text-slate-100 hover:bg-slate-800"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-slate-800" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate("/kiosk-mode")}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Tablet className="h-4 w-4" />
                  <span>Switch to Kiosk Mode</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-slate-900 border-slate-800">
        <SidebarMenu>
          <SidebarSeparator className="bg-slate-800" />
          
          <SidebarMenuItem>
            <SidebarMenuButton className="h-auto py-3 hover:bg-slate-800">
              <div className="flex items-center gap-3 w-full">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700">
                  <User className="h-4 w-4 text-slate-300" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-slate-200">Administrator</p>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarSeparator className="bg-slate-800" />

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => navigate("/dashboard")}
              className="text-red-400 hover:text-red-300 hover:bg-red-950/50"
            >
              <LogOut className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}