import { Outlet, useLocation } from "react-router-dom"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { FacultySidebar } from "@/features/faculty-requirements/components/FacultySidebar"

export default function FacultyLayout() {
  const location = useLocation();

  // Simple title mapping for faculty pages
  const getPageTitle = () => {
    const titles = {
      "/faculty-requirements/dashboard": "Dashboard",
      "/faculty-requirements/submission": "Submit Documents",
      "/faculty-requirements/analytics": "My Analytics",
      "/faculty-requirements/archive": "My Archive",
      "/faculty-requirements/hub": "Template Hub"
    };
    return titles[location.pathname] || "Faculty Portal";
  };

  return (
    <SidebarProvider>
      {/* Container with slate-950 background matches the AdminLayout */}
      <div className="flex min-h-screen w-full bg-slate-950">
        <FacultySidebar />
        
        <SidebarInset className="bg-slate-950 flex flex-col">
          {/* Header styling matches the AdminLayout */}
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
