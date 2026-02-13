import React, { useState } from "react";
import { 
  FileText, Download, Calendar, Filter, 
  FileCode, Table as TableIcon, Share2,
  ShieldAlert, AlertTriangle // Added missing icon imports
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

// ... rest of the component code stays the same
const ReportOption = ({ icon: Icon, title, description, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-start gap-4 p-4 rounded-xl border transition-all text-left w-full ${
      active 
        ? "bg-blue-600/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
        : "bg-[#0D1016]/40 border-white/5 hover:border-white/10"
    }`}
  >
    <div className={`p-2 rounded-lg ${active ? "bg-blue-600 text-white" : "bg-white/5 text-slate-400"}`}>
      <Icon size={18} />
    </div>
    <div>
      <h4 className={`text-xs font-bold uppercase tracking-tight ${active ? "text-blue-400" : "text-slate-200"}`}>
        {title}
      </h4>
      <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1">{description}</p>
    </div>
  </button>
);

const GenerateReport = () => {
  const [selectedType, setSelectedType] = useState("violations");

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-white/5 px-6 bg-[#0B0E14]/80 backdrop-blur-md z-20">
        <SidebarTrigger className="text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-md scale-90" />
        <Separator orientation="vertical" className="mx-1 h-3 bg-white/10" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink className="text-slate-500 text-[10px] font-bold uppercase tracking-widest cursor-default">ISAMS</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-slate-700" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white font-bold text-xs tracking-tight cursor-default uppercase">REPORTS</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex-1 p-6 lg:p-10 overflow-y-auto no-scrollbar relative">
        <div className="relative z-10 w-full">
          <header className="mb-10 text-left">
            <h1 className="text-4xl font-black tracking-tight text-white mb-1 uppercase leading-none">GENERATE EXPORT</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-[1.5px] w-6 bg-blue-600" />
              <p className="text-blue-500 font-bold tracking-[0.3em] text-[9px] uppercase">Data Analytics & Archiving</p>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* CONFIGURATION COLUMN */}
            <div className="lg:col-span-7 space-y-8">
              <section>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-4">1. Select Data Source</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-4">2. Export Format</h3>
                <div className="flex flex-wrap gap-3">
                  {['PDF', 'Excel', 'JSON'].map((format) => (
                    <Button 
                      key={format}
                      variant="outline" 
                      className="bg-transparent border-white/10 text-slate-400 hover:text-white hover:border-blue-500 h-12 px-8 font-bold text-[11px] rounded-xl transition-all"
                    >
                      {format === 'PDF' && <FileText className="mr-2 h-4 w-4" />}
                      {format === 'Excel' && <TableIcon className="mr-2 h-4 w-4" />}
                      {format === 'JSON' && <FileCode className="mr-2 h-4 w-4" />}
                      {format}
                    </Button>
                  ))}
                </div>
              </section>

              <Separator className="bg-white/5" />

              <div className="flex items-center justify-between p-6 rounded-2xl bg-blue-600/5 border border-blue-500/20">
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-tight">Ready to Export</h4>
                  <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">Total Estimated Records: 1,420</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs h-12 px-8 rounded-xl shadow-lg shadow-blue-600/20">
                  <Download className="mr-2 h-4 w-4" /> GENERATE
                </Button>
              </div>
            </div>

            {/* PREVIEW COLUMN */}
            <div className="lg:col-span-5">
              <Card className="bg-[#0D1016]/40 border-white/5 backdrop-blur-md h-full rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Document Preview</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500/20" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
                    <div className="w-2 h-2 rounded-full bg-green-500/20" />
                  </div>
                </div>
                <CardContent className="p-8 flex flex-col items-center justify-center text-center h-[400px]">
                  <div className="w-24 h-32 border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center mb-6 relative group cursor-pointer hover:border-blue-500/50 transition-colors">
                    <FileText className="text-slate-800 group-hover:text-blue-900 transition-colors" size={48} />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <Share2 className="text-blue-400" size={24} />
                    </div>
                  </div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Selection Made</h3>
                  <p className="text-[10px] text-slate-600 mt-2 max-w-[200px]">Select a data source and format to preview your document.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GenerateReport;