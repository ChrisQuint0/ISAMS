import React, { useState } from "react";
import { 
  FileText, Download, Calendar, Filter, 
  FileCode, Table as TableIcon, Share2,
  ShieldAlert, AlertTriangle 
} from "lucide-react";

// Shadcn UI Imports
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const ReportOption = ({ icon: Icon, title, description, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-start gap-4 p-5 rounded-2xl border transition-all text-left w-full ${
      active 
        ? "bg-slate-800 border-slate-500 shadow-xl" 
        : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
    }`}
  >
    <div className={`p-2.5 rounded-xl ${active ? "bg-blue-600 text-slate-100" : "bg-slate-950/50 text-slate-500 border border-slate-800"}`}>
      <Icon size={20} />
    </div>
    <div>
      <h4 className={`text-sm font-black uppercase tracking-tight ${active ? "text-slate-100" : "text-slate-400"}`}>
        {title}
      </h4>
      <p className="text-[12px] text-slate-500 font-medium leading-relaxed mt-1">{description}</p>
    </div>
  </button>
);

const GenerateReport = () => {
  const [selectedType, setSelectedType] = useState("violations");

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Updated Header with specific pathing */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-slate-800 px-6 bg-slate-900/50 backdrop-blur-xl z-20">
        <SidebarTrigger className="text-slate-400 hover:text-slate-100 p-2 hover:bg-slate-800 rounded-md scale-90" />
        <Separator orientation="vertical" className="mx-1 h-3 bg-slate-800" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] cursor-default">ISAMS</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-slate-800" />
            <BreadcrumbItem>
              <BreadcrumbLink className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] cursor-default">Student Violation Module</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-slate-800" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-slate-100 font-bold text-sm tracking-tight uppercase">Reports</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto no-scrollbar relative">
        <header className="mb-10 text-left shrink-0">
          <h1 className="text-4xl font-black tracking-tight text-slate-100 mb-1 uppercase leading-none">GENERATE EXPORT</h1>
          <div className="flex items-center gap-3 mt-3">
            <div className="h-[2px] w-8 bg-slate-600" />
            <p className="text-slate-500 font-black tracking-[0.3em] text-[11px] uppercase">Data Analytics & Archiving</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* CONFIGURATION COLUMN */}
          <div className="lg:col-span-7 space-y-10">
            <section>
              <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em] mb-6 text-left">1. Select Data Source</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ReportOption 
                  icon={ShieldAlert} 
                  title="Violation Summary" 
                  description="Export all active and cleared student offenses."
                  active={selectedType === "violations"}
                  onClick={() => setSelectedType("violations")}
                />
                <ReportOption 
                  icon={Calendar} 
                  title="Attendance Logs" 
                  description="Daily laboratory access and monitoring logs."
                  active={selectedType === "attendance"}
                  onClick={() => setSelectedType("attendance")}
                />
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em] mb-6 text-left">2. Export Format</h3>
              <div className="flex flex-wrap gap-4">
                {['PDF', 'Excel', 'JSON'].map((format) => (
                  <button 
                    key={format}
                    className="flex items-center bg-slate-900/40 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-400 h-12 px-8 font-black text-[11px] uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg"
                  >
                    {format === 'PDF' && <FileText className="mr-3 h-4 w-4" />}
                    {format === 'Excel' && <TableIcon className="mr-3 h-4 w-4" />}
                    {format === 'JSON' && <FileCode className="mr-3 h-4 w-4" />}
                    {format}
                  </button>
                ))}
              </div>
            </section>

            <Separator className="bg-slate-800" />

            <div className="flex items-center justify-between p-8 rounded-[2rem] bg-slate-900 border border-slate-800 shadow-2xl">
              <div>
                <h4 className="text-base font-black text-slate-100 uppercase tracking-tight">System Ready</h4>
                <p className="text-[11px] text-slate-500 font-bold mt-1 uppercase tracking-widest">Estimated Records: 1,420</p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs h-14 px-10 rounded-2xl shadow-lg shadow-blue-900/20 transition-all active:scale-95">
                <Download className="mr-3 h-5 w-5" /> GENERATE
              </Button>
            </div>
          </div>

          {/* PREVIEW COLUMN */}
          <div className="lg:col-span-5">
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-md h-full rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-slate-800 bg-slate-900/20 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Document Preview</span>
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-800" />
                  <div className="w-2 h-2 rounded-full bg-slate-800" />
                  <div className="w-2 h-2 rounded-full bg-slate-800" />
                </div>
              </div>
              <CardContent className="p-8 flex flex-col items-center justify-center text-center h-[500px]">
                <div className="w-32 h-44 border border-slate-800 border-dashed rounded-2xl flex items-center justify-center mb-8 relative group cursor-pointer hover:border-slate-500 transition-all bg-slate-950/40">
                  <FileText className="text-slate-800 group-hover:text-slate-500 transition-colors" size={60} />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/60 backdrop-blur-[4px] rounded-2xl">
                     <Share2 className="text-white" size={32} />
                  </div>
                </div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Awaiting Selection</h3>
                <p className="text-[13px] text-slate-600 mt-3 max-w-[240px] font-medium leading-relaxed">
                  Configure your data source and export format to generate a live preview.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateReport;