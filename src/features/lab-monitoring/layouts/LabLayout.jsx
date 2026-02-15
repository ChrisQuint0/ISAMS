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

const labNames = {
  "lab-1": "Computer Laboratory 1",
  "lab-2": "Computer Laboratory 2",
  "lab-3": "Computer Laboratory 3",
  "lab-4": "Computer Laboratory 4",
};

export default function LabLayout() {
  const location = useLocation();
  const [labId, setLabId] = useState(() => location.state?.labId || "lab-1");

  useEffect(() => {
    if (location.state?.labId) {
      setLabId(location.state.labId);
    }
  }, [location.state?.labId]);

  const labName = labNames[labId] || "Computer Laboratory";

  const routeTitles = {
    "/lab-dashboard": "Dashboard",
    "/access-logs": "Access Logs",
    "/lab-schedule": "Laboratory Schedule",
    "/pc-management": "PC Monitoring",
    "/reports-analytics": "Analytics & Reports",
    "/lab-settings": "Settings"
  };

  const getPageTitle = () => {
    const currentPath = location.pathname;
    
    if (routeTitles[currentPath]) {
      return routeTitles[currentPath];
    }

    return "Laboratory Management";
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-950">
        <LabSidebar labId={labId} labName={labName} />

        <div className="flex-1 flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b border-slate-800 bg-slate-900/50 px-6 backdrop-blur-sm">
            <SidebarTrigger className="text-slate-400 hover:text-slate-100" />
            
            <div className="h-4 w-px bg-slate-800" />

            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild className="text-slate-500 hover:text-slate-300">
                    <Link to="/lab-monitoring">Labs</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-slate-700" />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild className="text-slate-500 hover:text-slate-300">
                    <Link to="/lab-monitoring">{labName}</Link>
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
            <Outlet context={{ labId, labName }} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}