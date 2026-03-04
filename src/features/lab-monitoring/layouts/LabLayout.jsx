import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LabSidebar } from "../components/LabSidebar";
import { Outlet, useLocation, Link } from "react-router-dom";
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

  const currentLabId = location.state?.labId || sessionStorage.getItem('active_lab_id') || "lab-1";
  const currentLabName = location.state?.labName || sessionStorage.getItem('active_lab_name') || "Lab 1";

  // Keep session storage perfectly in sync
  useEffect(() => {
    sessionStorage.setItem('active_lab_id', currentLabId);
    sessionStorage.setItem('active_lab_name', currentLabName);
  }, [currentLabId, currentLabName]);

  const routeTitles = {
    "/lab-dashboard": "Dashboard",
    "/access-logs": "Access Logs",
    "/lab-schedule": "Laboratory Schedule",
    "/pc-management": "PC Monitoring",
    "/reports-analytics": "Analytics & Reports",
    "/audit-trails": "Audit Trails",
    "/lab-settings": "Settings"
  };

  const getPageTitle = () => {
    const currentPath = location.pathname;
    
    if (routeTitles[currentPath]) {
      return routeTitles[currentPath];
    }

    return "Laboratory Management";
  };

  // FORMATTER (Converts "Lab 2" or "Computer Lab 2" -> "Computer Laboratory 2")
  const breadcrumbLabName = currentLabName.replace(/^(Computer\s*)?Lab\s/i, 'Computer Laboratory ');

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-950">
        <LabSidebar labId={currentLabId} labName={currentLabName} />

        <div className="flex-1 flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b border-slate-800 bg-slate-900/50 px-6 backdrop-blur-sm">
            <SidebarTrigger className="text-slate-400 hover:text-slate-100" />
            
            <div className="h-4 w-px bg-slate-800" />

            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild className="text-slate-500 hover:text-slate-300">
                    <Link to="/lab-monitoring">Computer Laboratories</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-slate-700" />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild className="text-slate-500 hover:text-slate-300">
                    <Link to="/lab-dashboard">{breadcrumbLabName}</Link>
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
            <Outlet context={{ labId: currentLabId, labName: currentLabName }} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}