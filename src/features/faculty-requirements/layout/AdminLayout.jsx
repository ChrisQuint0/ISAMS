import { Outlet, useLocation } from "react-router-dom"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "@/features/faculty-requirements/components/AdminSidebar"

export default function AdminLayout() {
  const location = useLocation();

  // Simple title mapping to keep it clean like your classmate's
  const getPageTitle = () => {
    const titles = {
      "/admin-dashboard": "Dashboard",
      "/faculty-monitor": "Faculty Monitor",
      "/deadlines": "Deadline Management",
      "/validation": "Validation Queue",
      "/reports": "Reports & Analytics",
      "/archive": "Document Archive",
      "/settings": "System Settings"
    };
    return titles[location.pathname] || "Admin Portal";
  };

  return (
    <SidebarProvider>
      {/* Container with slate-950 background matches the classmate's layout */}
      <div className="flex min-h-screen w-full bg-slate-950">
        <AppSidebar />
        
        <SidebarInset className="bg-slate-950 flex flex-col">
          {/* Header styling matches the LabLayout */}
          <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-800 bg-slate-900/50 px-6 backdrop-blur-sm">
            <SidebarTrigger className="text-slate-400 hover:text-slate-900" />
            
            <Separator orientation="vertical" className="h-4 bg-slate-800" />
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-100">ISAMS</span>
              <span className="text-slate-600">/</span>
              <span className="text-sm font-medium text-slate-400">{getPageTitle()}</span>
            </div>
          </header>
          
          {/* Main content area */}
          <main className="flex-1 p-6 overflow-auto bg-slate-950 text-slate-100">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}