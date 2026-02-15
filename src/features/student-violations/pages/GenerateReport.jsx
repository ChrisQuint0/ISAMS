import React, { useState } from "react";
import {
  FileText, Download, Calendar,
  FileCode, Table as TableIcon, Share2,
  ShieldAlert
} from "lucide-react";


import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";


const ReportOption = ({ icon: Icon, title, description, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-start gap-5 p-6 rounded-xl border transition-all text-left w-full ${
      active
        ? "bg-slate-800 border-slate-600 shadow-xl"
        : "bg-slate-900 border-slate-800 hover:border-slate-700"
    }`}
  >
    <div className={`p-3 rounded-lg ${active ? "bg-blue-600 text-white" : "bg-slate-950/50 text-slate-500 border border-slate-800"}`}>
      <Icon size={24} />
    </div>
    <div>
      <h4 className={`text-[15px] font-semibold tracking-tight ${active ? "text-slate-100" : "text-slate-400"}`}>
        {title}
      </h4>
      <p className="text-[14px] text-slate-500 font-medium leading-relaxed mt-2">{description}</p>
    </div>
  </button>
);


const GenerateReport = () => {
  const [selectedType, setSelectedType] = useState("violations");


  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      {/* PAGE HEADER: Matched to Student Database style */}
      <header className="mb-10 text-left shrink-0">
        <h1 className="text-3xl font-bold text-white tracking-tight">Generate Report</h1>
        <p className="text-slate-400">Data analytics and archiving for student records</p>
      </header>


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* CONFIGURATION COLUMN */}
        <div className="lg:col-span-7 space-y-10">
          <section>
            <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-6">1. Select data source</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <ReportOption
                icon={ShieldAlert}
                title="Violation summary"
                description="Export all active and cleared student offenses for this semester."
                active={selectedType === "violations"}
                onClick={() => setSelectedType("violations")}
              />
              <ReportOption
                icon={Calendar}
                title="Attendance logs"
                description="Daily laboratory access and monitoring logs for faculty review."
                active={selectedType === "attendance"}
                onClick={() => setSelectedType("attendance")}
              />
            </div>
          </section>


          <section>
            <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-6">2. Export Format</h3>
            <div className="flex flex-wrap gap-4">
              {['PDF', 'Excel', 'JSON'].map((format) => (
                <button
                  key={format}
                  className="flex items-center bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-500 h-11 px-7 font-semibold text-[14px] rounded-lg transition-all shadow-sm active:scale-95"
                >
                  {format === 'PDF' && <FileText className="mr-3 h-5 w-5 text-rose-400" />}
                  {format === 'Excel' && <TableIcon className="mr-3 h-5 w-5 text-emerald-400" />}
                  {format === 'JSON' && <FileCode className="mr-3 h-5 w-5 text-blue-400" />}
                  {format}
                </button>
              ))}
            </div>
          </section>


          <Separator className="bg-slate-800/60" />


          {/* ACTION CARD: Standardized padding and text sizes */}
          <div className="flex items-center justify-between p-7 rounded-xl bg-slate-900 border border-slate-800 shadow-xl">
            <div>
              <h4 className="text-base font-bold text-white tracking-tight">System Ready</h4>
              <p className="text-sm text-slate-500 font-medium mt-1">Estimated Records: 1,420</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm h-10 px-8 rounded-md shadow-lg shadow-blue-900/20 transition-all active:scale-95">
              <Download className="mr-2 h-4 w-4" /> Generate
            </Button>
          </div>
        </div>


        {/* PREVIEW COLUMN */}
        <div className="lg:col-span-5">
          <Card className="bg-slate-900 border-slate-800 h-full rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-slate-800/20 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Document Preview</span>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-800" />
                <div className="w-2 h-2 rounded-full bg-slate-800" />
                <div className="w-2 h-2 rounded-full bg-slate-800" />
              </div>
            </div>
            <CardContent className="p-8 flex flex-col items-center justify-center text-center h-[500px]">
              <div className="w-32 h-44 border border-slate-800 border-dashed rounded-lg flex items-center justify-center mb-8 relative group cursor-pointer hover:border-slate-600 transition-all bg-slate-950/40">
                <FileText className="text-slate-800 group-hover:text-slate-600 transition-colors" size={60} />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/70 backdrop-blur-[2px] rounded-lg">
                   <Share2 className="text-white" size={28} />
                </div>
              </div>
              <h3 className="text-sm font-bold text-slate-400">Awaiting Selection</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-[260px] font-medium leading-relaxed">
                Configure your data source and export format to generate a live preview.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};


export default GenerateReport;
