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
        const formattedData = vData.map(v => ({
          ...v,
          student_number: v.student_number,
          name: v.students_sv ? `${v.students_sv.first_name} ${v.students_sv.last_name}` : 'Unknown',
          section: v.student_course_year_section || (v.students_sv && v.students_sv.course_year_section) || 'N/A',
          violation: v.offense_types_sv ? `${v.offense_types_sv.name}: ${v.offense_types_sv.severity}` : `Type ID ${v.offense_type_id}`,
          status: v.status || "Pending"
        }));
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
      headerName: "Student ID",
      field: "student_number",
      width: 130,
      filter: true,
      tooltipField: "student_number",
      cellStyle: { color: 'var(--neutral-500)', fontWeight: '500' }
    },
    {
      headerName: "Student Name",
      field: "name",
      flex: 1,
      filter: true, // Enabled filtering for names
      tooltipField: "name",
      cellStyle: { color: 'var(--neutral-900)', fontWeight: '600' }
    },
    {
      headerName: "Section",
      field: "section",
      flex: 1,
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
      headerName: "Status",
      field: "status",
      flex: 1,
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
      width: 120,
      pinned: 'right',
      cellRenderer: (params) => (
        <div className="flex items-center justify-end h-full pr-2">
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
      width: 120,
      pinned: 'right',
      cellRenderer: (params) => (
        <div className="flex items-center justify-end h-full pr-2">
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
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-500 text-left bg-neutral-50">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Violations</h1>
          <p className="text-neutral-500 text-sm font-medium">Student compliance monitor and disciplinary records</p>
        </div>
        <Button
          className="bg-destructive-semantic hover:bg-red-700 text-white shadow-md shadow-red-900/10 transition-all font-bold h-9 px-4 rounded-md text-sm active:scale-95"
          onClick={() => setIsAddModalOpen(true)}
        >
          <AlertCircle className="w-4 h-4 mr-2" /> Report violation
        </Button>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickStat title="Total violations" value={violations.length} icon={ShieldAlert} color="text-neutral-500" />
        <QuickStat title="Active investigations" value={violations.filter(v => v.status === 'Pending' || v.status === 'Under Investigation').length} icon={AlertTriangle} color="text-warning" />
        <QuickStat title="Resolved records" value={violations.filter(v => v.status === 'Resolved' || v.status === 'Dismissed').length} icon={CheckCircle2} color="text-success" />
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

      <Card className="bg-white border-neutral-200 shadow-sm flex flex-col rounded-lg overflow-hidden flex-1">
        <div className="px-4 py-4 flex items-center justify-between border-b border-neutral-100 bg-neutral-50/50">
          <h3 className="text-base font-bold text-neutral-900 uppercase tracking-tight">
            {activeTab === "violations" ? "Disciplinary logs" : "Sanction records"}
          </h3>
          <div className="flex items-center">
            <div className="relative w-48 md:w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 group-focus-within:text-primary-600 transition-colors" />
              <Input
                placeholder="Quick search..."
                className="pl-10 h-8 bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-primary-500 focus-visible:border-primary-500 transition-all font-medium text-xs rounded"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="w-full flex-1" style={{ minHeight: "500px" }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-neutral-500 font-medium">
              Loading violation records...
            </div>
          ) : (
            <AgGridReact
              theme={customTheme}
              rowData={activeTab === "violations" ? violations : sanctionsList}
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
              quickFilterText={searchValue}
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


function QuickStat({ title, value, icon: Icon, color }) {
  return (
    <Card className="bg-white border-neutral-200 shadow-sm transition-all hover:shadow-md h-full">
      <CardContent className="p-4 flex flex-col items-start justify-center text-left gap-1">
        <div className="flex justify-between items-start w-full mb-1">
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{title}</p>
          <div className={`p-1.5 rounded-lg bg-neutral-50 border border-neutral-100`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
        </div>
        <p className="text-2xl font-bold text-neutral-900 mt-0">{value}</p>
      </CardContent>
    </Card>
  );
}

export default StudViolations;