import React from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ThesisArchivingSidebar } from "../components/ThesisArchivingSidebar";

export default function ThesisArchivingPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-950">
        <ThesisArchivingSidebar />
        <SidebarInset className="flex-1">
          <Outlet />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
