import React, { useState, useMemo, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";

import { ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

import {
  ShieldAlert, Search, AlertTriangle,
  CheckCircle2, AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { ManageViolationModal } from "../components/ManageViolationModal";
import { AddViolationModal } from "../components/AddViolationModal";

// FACULTY THEME: Consistent Slate palette and filter popup styling
const GRID_STYLE_OVERRIDES = `
  .ag-theme-quartz-dark {
    --ag-background-color: #0f172a !important;
    --ag-header-background-color: #1e293b !important;
    --ag-border-color: #1e293b !important;
    --ag-header-foreground-color: #94a3b8 !important;
    --ag-foreground-color: #ffffff !important;
    --ag-row-hover-color: rgba(30, 41, 59, 0.5) !important;
  }
  .ag-theme-quartz-dark .ag-header-cell-label {
    font-size: 14px;
    font-weight: 600;
    color: #64748b;
  }
  .ag-theme-quartz-dark .ag-cell {
    font-size: 15px;
    color: #e2e8f0 !important;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #1e293b44 !important;
  }
  .ag-theme-quartz-dark .ag-row {
    background-color: #0f172a !important;
  }
  .ag-theme-quartz-dark .ag-filter-wrapper {
    background-color: #1e293b !important;
    border: 1px solid #334155 !important;
  }
  .ag-theme-quartz-dark .ag-root-wrapper {
    border: none !important;
  }
`;


const StudViolations = () => {
  const [gridApi, setGridApi] = useState(null);
  const [violations, setViolations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [activeTab, setActiveTab] = useState("violations");

  const fetchViolations = async () => {
    setIsLoading(true);
    try {
      // Assuming foreign keys exist for students_sv and offense_types_sv. 
      // If the join fails due to no relation, we might need a fallback.
      const { data, error } = await supabase
        .from('violations_sv')
        .select(`
          *,
          students_sv (first_name, last_name),
          offense_types_sv (name)
        `);

      if (error) {
        console.error("Error fetching violations:", error.message);
      } else if (data) {
        const formattedData = data.map(v => ({
          ...v,
          name: v.students_sv ? `${v.students_sv.first_name} ${v.students_sv.last_name}` : v.student_number,
          section: v.student_course_year_section || (v.students_sv && v.students_sv.course_year_section) || 'N/A',
          violation: v.offense_types_sv ? v.offense_types_sv.name : `Type ID ${v.offense_type_id}`,
          status: v.status || "Pending"
        }));
        setViolations(formattedData);
      }
    } catch (err) {
      console.error("Unexpected error fetching violations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, []);

  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = GRID_STYLE_OVERRIDES;
    document.head.appendChild(styleEl);
    return () => document.head.removeChild(styleEl);
  }, []);


  // Replaced static rowData with the fetched violations state


  const columnDefs = useMemo(() => [
    {
      headerName: "Student Name",
      field: "name",
      flex: 1,
      filter: true, // Enabled filtering for names
      tooltipField: "name",
      cellStyle: { color: '#f8fafc', fontWeight: '600' }
    },
    {
      headerName: "Section",
      field: "section",
      flex: 1,
      filter: true, // Enabled filtering for sections
      tooltipField: "section",
      cellStyle: { color: '#94a3b8', fontWeight: '500' }
    },
    {
      headerName: "Violation Type",
      field: "violation",
      flex: 1.5,
      filter: true, // Enabled filtering for violation types
      tooltipField: "violation",
      cellStyle: { color: '#94a3b8', fontWeight: '500' }
    },
    {
      headerName: "Status",
      field: "status",
      flex: 1,
      filter: true, // Enabled filtering for status
      cellRenderer: (params) => {
        const isResolved = params.value === 'Resolved' || params.value === 'Dismissed';
        return (
          <div className="flex items-center h-full">
            <span className={`flex items-center text-[12px] font-bold ${isResolved ? 'text-emerald-400' : 'text-amber-400'}`}>
              <span className={`mr-2 h-1.5 w-1.5 rounded-full ${isResolved ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              {params.value}
            </span>
          </div>
        );
      }
    },
    {
      headerName: "Action",
      field: "action",
      width: 120,
      pinned: 'right',
      cellRenderer: (params) => (
        <div className="flex items-center justify-end h-full pr-2">
          <Button
            variant="outline"
            className="h-7 px-4 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-100 rounded-md text-[11px] font-semibold transition-all duration-200"
            onClick={() => {
              setSelectedViolation(params.data);
              setIsManageModalOpen(true);
            }}
          >
            Manage
          </Button>
        </div>
      )
    }
  ], []);

  const sanctionColumnDefs = useMemo(() => [
    { headerName: "Sanction ID", field: "sanction_id", flex: 1, tooltipField: "sanction_id", cellStyle: { color: '#94a3b8' } },
    { headerName: "Student Name", field: "student_name", flex: 1, tooltipField: "student_name", cellStyle: { color: '#f8fafc', fontWeight: '600' } },
    { headerName: "Sanction", field: "sanction_name", flex: 1.5, tooltipField: "sanction_name", cellStyle: { color: '#94a3b8' } },
    { headerName: "Status", field: "status", flex: 1, tooltipField: "status", cellStyle: { color: '#94a3b8' } },
    { headerName: "Due Date", field: "due_date", flex: 1, tooltipField: "due_date", cellStyle: { color: '#94a3b8' } },
  ], []);


  const defaultColDef = useMemo(() => ({
    sortable: true,
    resizable: true,
  }), []);


  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Violations</h1>
          <p className="text-slate-400">Student compliance monitor and disciplinary records</p>
        </div>
        <Button
          className="bg-rose-600 hover:bg-rose-700 text-white h-9 px-4 rounded-md font-medium text-sm transition-all shadow-sm active:scale-95"
          onClick={() => setIsAddModalOpen(true)}
        >
          <AlertCircle className="w-4 h-4 mr-2" /> Report violation
        </Button>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickStat title="Total violations" value={violations.length} icon={ShieldAlert} color="text-slate-400" />
        <QuickStat title="Active investigations" value={violations.filter(v => v.status === 'Pending' || v.status === 'Under Investigation').length} icon={AlertTriangle} color="text-amber-500" />
        <QuickStat title="Resolved records" value={violations.filter(v => v.status === 'Resolved' || v.status === 'Dismissed').length} icon={CheckCircle2} color="text-emerald-500" />
      </div>

      <div className="flex items-center gap-4 border-b border-slate-800">
        <button
          onClick={() => setActiveTab("violations")}
          className={`pb-2 text-sm font-medium border-b-2 transition-all ${
            activeTab === "violations"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          Violations
        </button>
        <button
          onClick={() => setActiveTab("sanctions")}
          className={`pb-2 text-sm font-medium border-b-2 transition-all ${
            activeTab === "sanctions"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          Sanctions
        </button>
      </div>

      <Card className="bg-slate-900 border-slate-800 flex flex-col rounded-lg overflow-hidden shadow-sm">
        <div className="px-3 py-0 flex items-center justify-between bg-slate-900/50">
          <h3 className="text-sm font-bold text-slate-200">
              {activeTab === "violations" ? "Disciplinary logs" : "Sanction records"}
          </h3>
          <div className="flex items-center">
            <div className="relative w-36 md:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
              <Input
                placeholder="Quick search..."
                className="pl-8 bg-slate-950 border-slate-800 text-slate-200 text-xs h-6 rounded focus:ring-1 focus:ring-blue-600"
                onChange={(e) => gridApi?.setQuickFilter(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="ag-theme-quartz-dark w-full" style={{ height: "500px" }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              Loading violation records...
            </div>
          ) : (
            <AgGridReact
              theme={themeQuartz}
              rowData={activeTab === "violations" ? violations : []}
              columnDefs={activeTab === "violations" ? columnDefs : sanctionColumnDefs}
              defaultColDef={defaultColDef}
              onGridReady={(params) => setGridApi(params.api)}
              tooltipShowDelay={0}
              animateRows={true}
              rowHeight={42}
              headerHeight={24}
              pagination={true}
              paginationPageSize={10}
              suppressCellFocus={true}
            />
          )}
        </div>
      </Card>

      <ManageViolationModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        onSuccess={fetchViolations}
        violationData={selectedViolation}
      />

      <AddViolationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchViolations}
      />
    </div>
  );
};


function QuickStat({ title, value, icon: Icon, color }) {
  const getGradient = (c) => {
    if (c.includes("blue")) return "from-blue-600/50 via-blue-500/50 to-blue-600/50";
    if (c.includes("emerald")) return "from-emerald-600/50 via-emerald-500/50 to-emerald-600/50";
    if (c.includes("indigo")) return "from-indigo-600/50 via-indigo-500/50 to-indigo-600/50";
    if (c.includes("amber")) return "from-amber-600/50 via-amber-500/50 to-amber-600/50";
    if (c.includes("orange")) return "from-orange-600/50 via-orange-500/50 to-orange-600/50";
    if (c.includes("rose")) return "from-rose-600/50 via-rose-500/50 to-rose-600/50";
    return "from-slate-600/50 via-slate-500/50 to-slate-600/50";
  };

  return (
    <div className="group relative overflow-hidden bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center gap-4 transition-all duration-300 hover:border-slate-700 hover:shadow-lg hover:shadow-slate-900/20">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
      <div className={`relative p-2 rounded-md bg-slate-800/50 border border-slate-700 ${color}`}><Icon size={20} /></div>
      <div className="relative">
        <p className="text-sm font-medium text-slate-500 leading-none">{title}</p>
        <p className="text-2xl font-bold text-white mt-1 leading-none">{value}</p>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${getGradient(color)} scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />
    </div>
  );
}


export default StudViolations;
