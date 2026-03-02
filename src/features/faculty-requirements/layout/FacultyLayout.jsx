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
      {/* Container with neutral-50 background for an institutional look */}
      <div className="flex min-h-screen w-full bg-neutral-50">
        <FacultySidebar />

        <SidebarInset className="bg-neutral-50 flex flex-col">
          {/* Header styling: Clean white with subtle border */}
          <header className="flex h-14 shrink-0 items-center gap-4 border-b border-neutral-200 bg-white/80 px-6 backdrop-blur-md sticky top-0 z-10">
            <SidebarTrigger className="text-neutral-500 hover:text-primary-600 transition-colors" />

            <Separator orientation="vertical" className="h-4 bg-neutral-200" />

            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary-700 tracking-tight">ISAMS</span>
              <span className="text-neutral-300 font-light">/</span>
              <span className="text-sm font-medium text-neutral-600">{getPageTitle()}</span>
            </div>
          </header>

          {/* Main content area: Neutral background with high-contrast text */}
          <main className="flex-1 p-6 overflow-auto bg-neutral-50 text-neutral-900">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
