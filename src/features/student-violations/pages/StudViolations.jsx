import React, { useState, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { 
  ShieldAlert, Search, Filter, 
  AlertTriangle, CheckCircle2
} from "lucide-react";

// Shadcn UI Imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const StatCard = ({ label, value, icon: Icon, colorClass }) => (
  <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-[#0D1016]/40 border border-white/5 backdrop-blur-md relative overflow-hidden group">
    <div className={`absolute -right-1 -top-1 opacity-5 group-hover:opacity-10 transition-opacity ${colorClass}`}>
      <Icon size={60} />
    </div>
    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 bg-white/5 border border-white/10 ${colorClass}`}>
      <Icon size={20} />
    </div>
    <span className="text-3xl font-black tracking-tighter text-white leading-none mb-1">{value}</span>
    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">{label}</span>
  </div>
);

const StudViolations = () => {
  const [gridApi, setGridApi] = useState(null);

  const columnDefs = useMemo(() => [
    { 
      headerName: "STUDENT NAME", 
      field: "name", 
      sortable: true, 
      filter: true,
      cellStyle: { color: '#e2e8f0', fontWeight: '700', fontSize: '11px' }
    },
    { 
      headerName: "YEAR & SECTION", 
      field: "section", 
      sortable: true, 
      filter: true,
      cellStyle: { color: '#64748b', fontWeight: '700', fontSize: '10px' }
    },
    { 
      headerName: "VIOLATION", 
      field: "violation",
      cellStyle: { color: '#f87171', fontWeight: '700', fontSize: '10px' }
    },
    { 
      headerName: "STATUS", 
      field: "status",
      cellRenderer: (params) => (
        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest ${
          params.value === 'CLEARED' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {params.value}
        </span>
      )
    },
    {
      headerName: "ACTION",
      field: "action",
      pinned: 'right',
      cellRenderer: () => (
        <div className="flex items-center justify-end h-full">
          <Button variant="outline" className="h-6 px-3 bg-slate-950/80 border-blue-900/50 text-blue-400 hover:bg-blue-600 hover:text-white rounded-md text-[8px] font-black transition-all">
            MANAGE
          </Button>
        </div>
      )
    }
  ], []);

  const rowData = [
    { name: "ALEX JOHNSON", section: "BSCS 3-A", violation: "UNIFORM POLICY", status: "ACTIVE" },
    { name: "MARIA GARCIA", section: "BSIT 2-B", violation: "LATE ENTRY", status: "CLEARED" },
    { name: "LIAM SMITH", section: "BSDS 4-A", violation: "ACADEMIC DISHONESTY", status: "ACTIVE" },
  ];

  const onFilterTextChange = (e) => {
    gridApi?.setQuickFilter(e.target.value);
  };

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
              <BreadcrumbPage className="text-white font-bold text-xs tracking-tight cursor-default uppercase">VIOLATIONS</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex-1 p-6 lg:p-10 overflow-y-auto no-scrollbar relative">
        <div className="relative z-10 w-full transition-all duration-300">
          <header className="mb-8 text-left">
            <h1 className="text-4xl font-black tracking-tight text-white mb-1 uppercase leading-none">STUDENT VIOLATION RECORD</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-[1.5px] w-6 bg-red-600" />
              <p className="text-red-500 font-bold tracking-[0.3em] text-[9px] uppercase">Compliance Monitoring</p>
            </div>
          </header>

          {/* Scaled Down Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <StatCard label="Total Violations" value="56" icon={ShieldAlert} colorClass="text-blue-500" />
            <StatCard label="Total Active" value="12" icon={AlertTriangle} colorClass="text-red-500" />
            <StatCard label="Total Cleared" value="23" icon={CheckCircle2} colorClass="text-green-500" />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-5">
            <div className="text-left">
              <h2 className="text-lg font-black text-white uppercase tracking-tight">Active Offenses</h2>
              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Live System Feed</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                <Input 
                  placeholder="Quick Search..." 
                  className="pl-8 bg-[#0B0E14] border-white/5 text-[11px] h-8 rounded-lg focus-visible:ring-red-500/50 text-slate-200"
                  onChange={onFilterTextChange}
                />
              </div>
              <Button variant="outline" className="h-8 px-3 bg-[#0B0E14] border-white/5 text-slate-500 hover:text-white rounded-lg text-[10px] font-bold">
                <Filter className="w-3 h-3 mr-2" /> FILTER
              </Button>
            </div>
          </div>

          {/* Refined AG Grid */}
          <div 
            className="ag-theme-quartz-dark w-full shadow-2xl rounded-xl overflow-hidden border border-white/5" 
            style={{ 
              height: 400, 
              '--ag-background-color': '#0D101666',
              '--ag-header-background-color': '#ffffff05',
              '--ag-border-color': '#ffffff0d',
              '--ag-row-hover-color': '#ef444405',
              '--ag-font-family': 'inherit',
              '--ag-header-foreground-color': '#64748b',
            }}
          >
            <AgGridReact
              rowData={rowData}
              columnDefs={columnDefs}
              onGridReady={(params) => setGridApi(params.api)}
              animateRows={true}
              rowHeight={42}
              headerHeight={44}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default StudViolations;