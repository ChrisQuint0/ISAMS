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
      <div className="flex min-h-screen w-full bg-slate-950 font-sans">
       
        <AdminSidebar />
       
        <SidebarInset className="bg-slate-950 flex flex-col">
          <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-800 bg-slate-900/50 px-6 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger className="text-slate-400 hover:text-white transition-colors" />
           
            <Separator orientation="vertical" className="h-4 bg-slate-800" />
           
            {/* BREADCRUMB: ISAMS is now muted slate instead of white */}
            <div className="flex items-center gap-2 text-sm tracking-tight">
              <span className="font-bold text-slate-500 tracking-wider uppercase">ISAMS</span>
              <span className="text-slate-700 font-light">/</span>
              <span className="font-medium text-slate-500">
                Student Violation Module
              </span>
              <span className="text-slate-700 font-light">/</span>
              <span className="font-semibold text-white">
                {getPageTitle()}
              </span>
            </div>
          </header>
         
          <main className="flex-1 p-6 lg:p-10 overflow-auto bg-slate-950 text-slate-100 no-scrollbar">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
