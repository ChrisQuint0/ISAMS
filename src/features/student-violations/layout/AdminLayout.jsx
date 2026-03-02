import { Outlet, useLocation } from "react-router-dom"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { AdminSidebar } from "../components/AdminSidebar"


export default function AdminLayout() {
  const location = useLocation();


  const getPageTitle = () => {
    const titles = {
      "/student-violations": "Dashboard",
      "/students": "Students Record",
      "/violations": "Student Violations",
      "/generate-report": "Generate Report",
      "/analytics": "Analytics"
    };
    return titles[location.pathname] || "Violation Module";
  };


  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-neutral-50 font-sans">
       
        <AdminSidebar />
       
        <SidebarInset className="bg-neutral-50 flex flex-col">
          <header className="flex h-14 shrink-0 items-center gap-4 border-b border-neutral-200 bg-white/80 px-6 backdrop-blur-md sticky top-0 z-10">
            <SidebarTrigger className="text-neutral-500 hover:text-primary-600 transition-colors" />
           
            <Separator orientation="vertical" className="h-4 bg-neutral-200" />
           
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary-700 tracking-tight">ISAMS</span>
              <span className="text-neutral-300 font-light">/</span>
              <span className="text-sm font-medium text-neutral-500">Student Violation Module</span>
              <span className="text-neutral-300 font-light">/</span>
              <span className="text-sm font-semibold text-neutral-600">
                {getPageTitle()}
              </span>
            </div>
          </header>
         
          <main className="flex-1 p-4 lg:p-7 overflow-auto bg-neutral-50 text-neutral-900 no-scrollbar">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
