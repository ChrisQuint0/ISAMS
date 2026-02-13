import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { Plus, Search } from "lucide-react";

// Shadcn UI Imports
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const StudRecords = () => {
  const navigate = useNavigate();
  const [gridApi, setGridApi] = useState(null);

  // Column Definitions for AG Grid
  const [columnDefs] = useState([
    { 
      headerName: "STUDENT ID", 
      field: "id", 
      sortable: true, 
      filter: true,
      cellStyle: { color: '#60a5fa', fontWeight: '800', fontSize: '11px' } 
    },
    { 
      headerName: "FULL NAME", 
      field: "name", 
      sortable: true, 
      filter: true,
      cellStyle: { color: '#e2e8f0', fontWeight: '700', fontSize: '11px' }
    },
    { 
      headerName: "COURSE", 
      field: "course", 
      cellStyle: { color: '#64748b', fontWeight: '700', fontSize: '10px' }
    },
    { 
      headerName: "STATUS", 
      field: "status",
      cellRenderer: (params) => (
        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest ${
          params.value === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
        }`}>
          {params.value}
        </span>
      )
    },
    {
      headerName: "ACTIONS",
      field: "actions",
      sortable: false,
      filter: false,
      pinned: 'right',
      cellRenderer: () => (
        <div className="flex items-center justify-end h-full gap-3">
          <span className="text-[8px] font-bold text-blue-400/40 italic">JUST NOW</span>
          <button className="h-6 px-3 bg-slate-950/80 border border-blue-900/50 text-blue-400 hover:text-white hover:bg-blue-600 rounded-md text-[8px] font-black transition-all">
            DETAILS
          </button>
        </div>
      )
    }
  ]);

  const rowData = [
    { id: "2024-001", name: "ALEX JOHNSON", course: "BS COMPUTER SCIENCE", status: "ACTIVE" },
    { id: "2024-002", name: "MARIA GARCIA", course: "BS INFORMATION TECHNOLOGY", status: "ACTIVE" },
    { id: "2024-003", name: "LIAM SMITH", course: "BS DATA SCIENCE", status: "PROBATION" },
    { id: "2024-004", name: "SOPHIA CHEN", course: "BS SOFTWARE ENGINEERING", status: "ACTIVE" },
  ];

  const onGridReady = (params) => {
    setGridApi(params.api);
  };

  const onFilterTextChange = (e) => {
    gridApi?.setQuickFilter(e.target.value);
  };

  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 100,
    resizable: true,
  }), []);

  return (
    <>
      {/* Header Bar - Scaled Down */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-white/5 px-6 bg-[#0B0E14]/80 backdrop-blur-md z-20">
        <SidebarTrigger className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-md scale-90" />
        <Separator orientation="vertical" className="mx-1 h-3 bg-white/10" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink className="text-slate-500 text-[10px] font-bold uppercase tracking-widest cursor-default">ISAMS</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-slate-700" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white font-bold text-xs tracking-tight cursor-default uppercase">STUDENTS RECORD</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-6 lg:p-10 overflow-y-auto no-scrollbar relative">
        <div className="absolute top-[-5%] right-[-2%] w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-5%] left-[-2%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full transition-all duration-300">
          <header className="mb-8 text-left">
            <h1 className="text-4xl font-black tracking-tight text-white mb-1 uppercase leading-none">STUDENTS RECORD</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-[1.5px] w-6 bg-blue-600" />
              <p className="text-blue-500 font-bold tracking-[0.3em] text-[9px] uppercase">Academic Management Hub</p>
            </div>
          </header>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <Input 
                placeholder="Search by name or ID..." 
                className="pl-9 bg-[#0B0E14] border-white/5 text-slate-200 text-[11px] h-9 rounded-lg focus-visible:ring-blue-500/50"
                onChange={onFilterTextChange}
              />
            </div>
            <Button className="h-9 px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded-lg shadow-lg shadow-blue-600/10">
              <Plus className="w-3.5 h-3.5 mr-2" /> ADD STUDENT
            </Button>
          </div>

          {/* AG Grid Quartz Theme - Scaled down height & row height */}
          <div 
            className="ag-theme-quartz-dark w-full shadow-2xl rounded-xl overflow-hidden border border-white/5" 
            style={{ 
              height: 480, 
              '--ag-background-color': '#0D101666',
              '--ag-header-background-color': '#ffffff05',
              '--ag-border-color': '#ffffff0d',
              '--ag-row-hover-color': '#3b82f605',
              '--ag-font-family': 'inherit',
              '--ag-header-foreground-color': '#64748b',
            }}
          >
            <AgGridReact
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              onGridReady={onGridReady}
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

export default StudRecords;