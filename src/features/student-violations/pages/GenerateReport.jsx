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
        ? "bg-white border-primary-300 shadow-md ring-1 ring-primary-100"
        : "bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-sm"
    }`}
  >
    <div className={`p-3 rounded-lg ${active ? "bg-primary-600 text-white shadow-sm shadow-emerald-900/10" : "bg-neutral-50 text-neutral-500 border border-neutral-100"}`}>
      <Icon size={24} />
    </div>
    <div>
      <h4 className={`text-[15px] font-bold tracking-tight ${active ? "text-neutral-900" : "text-neutral-700"}`}>
        {title}
      </h4>
      <p className="text-[14px] text-neutral-500 font-medium leading-relaxed mt-2">{description}</p>
    </div>
  </button>
);


const GenerateReport = () => {
  const [selectedType, setSelectedType] = useState("violations");


  return (
    <div className="space-y-8 flex flex-col h-full animate-in fade-in duration-500 text-left bg-neutral-50">
      {/* PAGE HEADER: Matched to Student Database style */}
      <header className="mb-10 text-left shrink-0">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Generate Report</h1>
        <p className="text-neutral-500 text-sm font-medium mt-1">Data analytics and archiving for student records</p>
      </header>


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* CONFIGURATION COLUMN */}
        <div className="lg:col-span-7 space-y-10">
          <section>
            <h3 className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-6">1. Select data source</h3>
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
            <h3 className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-6">2. Export Format</h3>
            <div className="flex flex-wrap gap-4">
              {['PDF', 'Excel', 'JSON'].map((format) => (
                <button
                  key={format}
                  className="flex items-center bg-white border border-neutral-200 text-neutral-700 hover:text-primary-700 hover:bg-primary-50 hover:border-primary-200 h-11 px-7 font-bold text-[14px] rounded-lg transition-all shadow-sm active:scale-95"
                >
                  {format === 'PDF' && <FileText className="mr-3 h-5 w-5 text-destructive-semantic" />}
                  {format === 'Excel' && <TableIcon className="mr-3 h-5 w-5 text-success" />}
                  {format === 'JSON' && <FileCode className="mr-3 h-5 w-5 text-info" />}
                  {format}
                </button>
              ))}
            </div>
          </section>


          <Separator className="bg-neutral-200" />


          {/* ACTION CARD: Standardized padding and text sizes */}
          <div className="flex items-center justify-between p-7 rounded-xl bg-white border border-neutral-200 shadow-sm">
            <div>
              <h4 className="text-base font-bold text-neutral-900 tracking-tight">System Ready</h4>
              <p className="text-sm text-neutral-500 font-medium mt-1">Estimated Records: 1,420</p>
            </div>
            <Button className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm h-10 px-8 rounded-md shadow-md shadow-emerald-900/10 transition-all active:scale-95">
              <Download className="mr-2 h-4 w-4" /> Generate
            </Button>
          </div>
        </div>


        {/* PREVIEW COLUMN */}
        <div className="lg:col-span-5 h-[620px]">
          <Card className="bg-white border-neutral-200 h-full rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between shrink-0">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">Document Preview</span>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-neutral-200" />
                <div className="w-2 h-2 rounded-full bg-neutral-200" />
                <div className="w-2 h-2 rounded-full bg-neutral-200" />
              </div>
            </div>
            <CardContent className="p-8 flex flex-col items-center justify-center text-center flex-1">
              <div className="w-32 h-44 border border-neutral-200 border-dashed rounded-lg flex items-center justify-center mb-8 relative group cursor-pointer hover:border-primary-300 transition-all bg-neutral-50/50">
                <FileText className="text-neutral-300 group-hover:text-primary-500 transition-colors" size={60} />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/60 backdrop-blur-[2px] rounded-lg">
                   <Share2 className="text-primary-600" size={28} />
                </div>
              </div>
              <h3 className="text-sm font-bold text-neutral-900 tracking-tight">Awaiting Selection</h3>
              <p className="text-sm text-neutral-500 mt-2 max-w-[260px] font-medium leading-relaxed">
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
