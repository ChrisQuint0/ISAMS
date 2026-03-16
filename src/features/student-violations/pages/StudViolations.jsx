import React, { useState, useMemo, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";

import { ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

import {
  ShieldAlert, Search, AlertTriangle,
  CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight, Loader2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { ManageViolationModal } from "../components/ManageViolationModal";
import { AddViolationModal } from "../components/AddViolationModal";
import { ManageSanctionModal } from "../components/ManageSanctionModal";

// Custom theme using AG Grid v33+ Theming API with Quartz theme for a clean institutional look
const customTheme = themeQuartz.withParams({
  accentColor: 'var(--primary-600)',
  backgroundColor: 'var(--neutral-50)',
  foregroundColor: 'var(--neutral-900)',
  borderColor: 'var(--neutral-200)',
  headerBackgroundColor: 'var(--neutral-100)',
  headerTextColor: 'var(--neutral-900)',
  oddRowBackgroundColor: '#ffffff',
  rowHoverColor: 'var(--neutral-100)',
  selectedRowBackgroundColor: 'color-mix(in srgb, var(--primary-500) 10%, transparent)',
  rowHeight: 48,
  headerHeight: 40,
  headerFontWeight: '700',
  fontSize: '13px',
});


// --- Reusable Stat Card (Matching Analytics.jsx but Scaled Down) ---
const StatCard = ({ title, value, icon: Icon, description, trend, isUp, isLoading, borderTopClass = "bg-primary-500", iconClass = "text-primary-600 bg-primary-50 border-primary-100" }) => (
  <Card className="bg-white border-neutral-200 shadow-sm rounded-xl overflow-hidden relative group transition-all hover:shadow-md hover:-translate-y-0.5 h-full flex flex-col">
    <div className={`absolute top-0 left-0 w-full h-1 ${borderTopClass} transition-opacity opacity-70 group-hover:opacity-100`}></div>
    <CardContent className="p-4 flex-1 flex flex-col justify-between relative z-10">
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className={`p-2 rounded-lg border ${iconClass} transition-transform group-hover:scale-105 duration-300`}>
            <Icon size={18} strokeWidth={2} />
          </div>
          {trend !== undefined && !isLoading && (
            <div className={`px-2 py-0.5 rounded-full flex items-center text-[10px] font-bold ${isUp ? 'bg-success/10 text-success' : 'bg-destructive-semantic/10 text-destructive-semantic'}`}>
              {isUp ? <ArrowUpRight size={12} className="mr-0.5" /> : <ArrowDownRight size={12} className="mr-0.5" />}
              {trend}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-3xl font-black text-neutral-900 tracking-tighter leading-none mb-1">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-neutral-300" /> : value}
          </h3>
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{title}</p>
        </div>
      </div>
      {description && (
        <div className="mt-3 pt-3 border-t border-neutral-100/60 hidden">
          <p className="text-[10px] text-neutral-400 font-medium">{description}</p>
        </div>
      )}
    </CardContent>
  </Card>
);

const StudViolations = () => {
  const [gridApi, setGridApi] = useState(null);
  const [violations, setViolations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [activeTab, setActiveTab] = useState("violations");
  const [searchValue, setSearchValue] = useState("");
  const [sanctionsList, setSanctionsList] = useState([]);
  const [isManageSanctionModalOpen, setIsManageSanctionModalOpen] = useState(false);
  const [selectedSanction, setSelectedSanction] = useState(null);

  const fetchDistilledData = async () => {
    setIsLoading(true);
    try {
      // 0. Fetch Users Map
      const { data: userData, error: userError } = await supabase
        .from('users_with_roles')
        .select('id, first_name, last_name');
        
      const userMap = {};
      if (userData) {
          userData.forEach(u => {
              userMap[u.id] = `${u.first_name} ${u.last_name}`;
          });
      }

      // 1. Fetch Violations
      const { data: vData, error: vError } = await supabase
        .from('violations_sv')
        .select(`
          *,
          students_sv (first_name, last_name),
          offense_types_sv (name, severity)
        `)
        .order('created_at', { ascending: false });

      if (vError) {
        console.error("Error fetching violations:", vError.message);
      } else if (vData) {
        const formattedData = vData.map(v => {
          // Format date and time for better readability
          let incidentDisplay = "N/A";
          if (v.incident_date) {
              const dateObj = new Date(v.incident_date);
              const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
              
              let timeStr = "";
              if (v.incident_time) {
                 // Convert 'HH:MM:SS' to something like '3:00 PM'
                 const [hours, minutes] = v.incident_time.split(':');
                 const h = parseInt(hours, 10);
                 const ampm = h >= 12 ? 'PM' : 'AM';
                 const h12 = h % 12 || 12;
                 timeStr = ` at ${h12}:${minutes} ${ampm}`;
              }
              incidentDisplay = `${dateStr}${timeStr}`;
          }

          return {
            ...v,
            student_number: v.student_number,
            name: v.students_sv ? `${v.students_sv.first_name} ${v.students_sv.last_name}` : 'Unknown',
            section: v.student_course_year_section || (v.students_sv && v.students_sv.course_year_section) || 'N/A',
            violation: v.offense_types_sv ? `${v.offense_types_sv.name}: ${v.offense_types_sv.severity}` : `Type ID ${v.offense_type_id}`,
            incident_display: incidentDisplay,
            status: v.status || "Pending",
            reported_by_name: userMap[v.reported_by] || v.reported_by || 'Unknown',
            updated_by_name: userMap[v.updated_by] || v.updated_by || 'Unknown'
          };
        });
        setViolations(formattedData);
      }

      // 2. Fetch Sanctions
      const { data: sData, error: sError } = await supabase
        .from('student_sanctions_sv')
        .select(`
            *,
            violations_sv (
                student_number,
                students_sv (first_name, last_name)
            )
        `)
        .order('created_at', { ascending: false });

      if (sError) {
        console.error("Error fetching sanctions:", sError.message);
      } else if (sData) {
        const formattedSanctions = sData.map(s => ({
          sanction_id: s.sanction_id,
          student_name: s.violations_sv?.students_sv
            ? `${s.violations_sv.students_sv.first_name} ${s.violations_sv.students_sv.last_name}`
            : 'Unknown',
          sanction_name: s.penalty_name,
          status: s.status,
          due_date: s.deadline_date || 'None',
          assigned_by_name: userMap[s.assigned_by] || s.assigned_by || 'Unknown',
          updated_by_name: userMap[s.updated_by] || s.updated_by || 'Unknown',
          original_data: s
        }));
        setSanctionsList(formattedSanctions);
      }

    } catch (err) {
      console.error("Unexpected error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDistilledData();
  }, []);

  const columnDefs = useMemo(() => [
    {
      headerName: "Student Name",
      field: "name",
      flex: 1.2,
      filter: true, // Enabled filtering for names
      tooltipField: "name",
      cellStyle: { color: 'var(--neutral-900)', fontWeight: '600' }
    },
    {
      headerName: "Section",
      field: "section",
      width: 120,
      filter: true, // Enabled filtering for sections
      tooltipField: "section",
      cellStyle: { color: 'var(--neutral-500)', fontWeight: '500' }
    },
    {
      headerName: "Violation Type",
      field: "violation",
      flex: 1.5,
      filter: true, // Enabled filtering for violation types
      tooltipField: "violation",
      cellStyle: { color: 'var(--neutral-500)', fontWeight: '500' }
    },
    {
      headerName: "Incident Date",
      field: "incident_display",
      flex: 1,
      filter: true, 
      tooltipField: "incident_display",
      cellStyle: { color: 'var(--neutral-500)', fontWeight: '500' }
    },
    {
      headerName: "Status",
      field: "status",
      width: 140,
      filter: true, // Enabled filtering for status
      cellRenderer: (params) => {
        const isResolved = params.value === 'Resolved' || params.value === 'Dismissed';
        return (
          <div className="flex items-center h-full">
            <span className={`flex items-center text-[12px] font-bold ${isResolved ? 'text-success' : 'text-warning'}`}>
              <span className={`mr-2 h-1.5 w-1.5 rounded-full ${isResolved ? 'bg-success' : 'bg-warning animate-pulse'}`} />
              {params.value}
            </span>
          </div>
        );
      }
    },
    {
      headerName: "Action",
      field: "action",
      width: 100,
      pinned: 'right',
      headerClass: 'text-center',
      cellRenderer: (params) => (
        <div className="flex items-center justify-center h-full gap-2">
          <Button
            variant="outline"
            className="h-7 px-4 bg-white border-neutral-200 text-neutral-600 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-100 shadow-xs rounded-md text-[11px] font-semibold transition-all duration-200"
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
    { headerName: "ID", field: "sanction_id", width: 110, tooltipField: "sanction_id", cellStyle: { color: 'var(--neutral-500)' } },
    { headerName: "Student Name", field: "student_name", flex: 1.5, tooltipField: "student_name", filter: true, cellStyle: { color: 'var(--neutral-900)', fontWeight: '600' } },
    { headerName: "Sanction", field: "sanction_name", flex: 1.5, tooltipField: "sanction_name", filter: true, cellStyle: { color: 'var(--neutral-500)', fontWeight: '500' } },
    {
      headerName: "Status", field: "status", flex: 1, tooltipField: "status", filter: true,
      cellRenderer: (params) => {
        const isCompleted = params.value === 'Completed';
        const isOverdue = params.value === 'Overdue';
        const isInProgress = params.value === 'In Progress';

        let colorClass = 'text-neutral-500 bg-neutral-500';
        if (isCompleted) colorClass = 'text-success bg-success';
        else if (isOverdue) colorClass = 'text-destructive-semantic bg-destructive-semantic';
        else if (isInProgress) colorClass = 'text-info bg-info';

        return (
          <div className="flex items-center h-full">
            <span className={`flex items-center text-[12px] font-bold ${colorClass.split(' ')[0]}`}>
              <span className={`mr-2 h-1.5 w-1.5 rounded-full ${colorClass.split(' ')[1]}`} />
              {params.value}
            </span>
          </div>
        );
      }
    },
    { headerName: "Due Date", field: "due_date", width: 140, tooltipField: "due_date", cellStyle: { color: 'var(--neutral-500)' } },
    {
      headerName: "Action",
      field: "action",
      width: 100,
      pinned: 'right',
      headerClass: 'text-center',
      cellRenderer: (params) => (
        <div className="flex items-center justify-center h-full gap-2">
          <Button
            variant="outline"
            className="h-7 px-4 bg-white border-neutral-200 text-neutral-600 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-100 shadow-xs rounded-md text-[11px] font-semibold transition-all duration-200"
            onClick={() => {
              setSelectedSanction(params.data);
              setIsManageSanctionModalOpen(true);
            }}
          >
            Manage
          </Button>
        </div>
      )
    }
  ], []);


  const defaultColDef = useMemo(() => ({
    sortable: true,
    resizable: true,
  }), []);


  return (
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-500 text-left bg-neutral-50 px-2">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Violations</h1>
          <p className="text-neutral-500 text-sm font-medium">Student compliance monitor and disciplinary records</p>
        </div>
        <Button
          className="bg-destructive-semantic hover:bg-red-700 text-white shadow-md shadow-red-900/10 transition-all font-bold h-9 px-4 rounded-md text-sm active:scale-95"
          onClick={() => setIsAddModalOpen(true)}
        >
          <ShieldAlert className="w-4 h-4 mr-2" /> Report violation
        </Button>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Violations" 
          value={violations.length} 
          icon={ShieldAlert} 
          isLoading={isLoading} 
          borderTopClass="bg-neutral-400" 
          iconClass="text-neutral-500 bg-neutral-100 border-neutral-200" 
        />
        <StatCard 
          title="Active Investigations" 
          value={violations.filter(v => v.status === 'Pending' || v.status === 'Under Investigation').length} 
          icon={AlertTriangle} 
          isLoading={isLoading} 
          borderTopClass="bg-warning" 
          iconClass="text-warning bg-warning/10 border-warning/20" 
        />
        <StatCard 
          title="Resolved Records" 
          value={violations.filter(v => v.status === 'Resolved' || v.status === 'Dismissed').length} 
          icon={CheckCircle2} 
          isLoading={isLoading} 
          borderTopClass="bg-success" 
          iconClass="text-success bg-success/10 border-success/20" 
        />
      </div>

      <div className="flex items-center gap-4 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab("violations")}
          className={`pb-2 text-sm font-bold border-b-2 transition-all px-2 tracking-tight ${activeTab === "violations"
            ? "border-primary-600 text-primary-600"
            : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
        >
          Violations
        </button>
        <button
          onClick={() => setActiveTab("sanctions")}
          className={`pb-2 text-sm font-bold border-b-2 transition-all px-2 tracking-tight ${activeTab === "sanctions"
            ? "border-primary-600 text-primary-600"
            : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
        >
          Sanctions
        </button>
      </div>

      <Card className="flex-1 bg-white border-neutral-200 flex flex-col rounded-lg overflow-hidden shadow-sm p-0 z-10">
        <div className="px-5 pt-5 pb-2 flex items-center justify-between bg-white relative z-20">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-[15px] w-[15px] text-neutral-600" />
            <h3 className="text-[15px] font-bold text-neutral-900 uppercase tracking-wider leading-none">
              {activeTab === "violations" ? "Disciplinary logs" : "Sanction records"}
            </h3>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-72 group">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 group-focus-within:text-primary-600 transition-colors" />
              <Input
                placeholder="Search records..."
                className="pl-8 h-7 bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-primary-500 focus-visible:border-primary-500 transition-all font-medium text-xs shadow-sm rounded-md"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="w-full flex-1 hide-ag-scrollbars [&_.ag-root-wrapper]:border-none [&_.ag-header]:border-t-0 -mt-[15px]" style={{ minHeight: "500px" }}>
          <style>{`
            .hide-ag-scrollbars .ag-body-viewport::-webkit-scrollbar,
            .hide-ag-scrollbars .ag-body-vertical-scroll-viewport::-webkit-scrollbar,
            .hide-ag-scrollbars .ag-body-horizontal-scroll-viewport::-webkit-scrollbar {
              display: none !important;
              width: 0 !important;
              height: 0 !important;
            }
            .hide-ag-scrollbars .ag-body-viewport,
            .hide-ag-scrollbars .ag-body-vertical-scroll-viewport,
            .hide-ag-scrollbars .ag-body-horizontal-scroll-viewport {
              -ms-overflow-style: none !important;
              scrollbar-width: none !important;
            }
          `}</style>
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-neutral-500 font-medium pt-8">
              Loading records...
            </div>
          ) : (
            <AgGridReact
              theme={customTheme}
              rowData={activeTab === "violations" ? violations : sanctionsList}
              columnDefs={activeTab === "violations" ? columnDefs : sanctionColumnDefs}
              defaultColDef={defaultColDef}
              onGridReady={(params) => setGridApi(params.api)}
              quickFilterText={searchValue}
              animateRows={true}
              rowHeight={48}
              headerHeight={44}
              pagination={true}
              paginationPageSize={15}
              suppressCellFocus={true}
            />
          )}
        </div>
      </Card>

      <ManageViolationModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        onSuccess={fetchDistilledData}
        violationData={selectedViolation}
      />

      <AddViolationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchDistilledData}
      />

      {/* TODO: Add ManageSanctionModal here */}
      <ManageSanctionModal
        isOpen={isManageSanctionModalOpen}
        onClose={() => setIsManageSanctionModalOpen(false)}
        onSuccess={fetchDistilledData}
        sanctionData={selectedSanction}
      />
    </div>
  );
};


export default StudViolations;