import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LabSidebar } from "../components/LabSidebar";
import { Outlet, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function LabLayout() {
  const location = useLocation();

  const routeTitles = {
    "/lab-dashboard": "Dashboard",
    "/access-logs": "Access Logs",
    "/lab-schedule": "Laboratory Schedule",
    "/pc-management": "PC Monitoring",
    "/reports-analytics": "Analytics & Reports",
    "/lab-settings": "Settings"
  };

  // Helper function to get the title
  const getPageTitle = () => {
    const currentPath = location.pathname;
    
    // Check if we have a custom title for this path
    if (routeTitles[currentPath]) {
      return routeTitles[currentPath];
    }

    // Fallback
    return "Laboratory Management";
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-950">
        <LabSidebar />

        <div className="flex-1 flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b border-slate-800 bg-slate-900/50 px-6 backdrop-blur-sm">
            <SidebarTrigger className="text-slate-400 hover:text-slate-100" />
            
            <div className="h-4 w-px bg-slate-800" />

            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard" className="text-slate-500 hover:text-slate-300">
                    ISAMS
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-slate-700" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-slate-100 font-medium">
                    {getPageTitle()}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}