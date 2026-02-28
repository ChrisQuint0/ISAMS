import React, { useState, useMemo, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";

import { ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

import { Plus, Search, UserCheck, Users, GraduationCap, Edit2, UserX, Clock, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { AddStudentModal } from "../components/AddStudentModal";
import { EditStudentModal } from "../components/EditStudentModal";

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
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
  }
  .ag-theme-quartz-dark .ag-cell {
    font-size: 14px;
    color: #e2e8f0 !important;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #1e293b44 !important;
  }
  .ag-theme-quartz-dark .ag-row {
    background-color: #0f172a !important;
  }
  /* Style for the filter popup to match our slate theme */
  .ag-theme-quartz-dark .ag-filter-wrapper {
    background-color: #1e293b !important;
    border: 1px solid #334155 !important;
  }
  /* Modal Backdrop Blur */
  div[data-state="open"].fixed.inset-0.z-50 {
    backdrop-filter: blur(5px);
  }
`;

const StudRecords = () => {
  const [gridApi, setGridApi] = useState(null);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchValue, setSearchValue] = useState("");

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('students_sv')
        .select('*');

      if (error) {
        console.error("Error fetching students:", error.message);
      } else if (data) {
        const formattedData = data.map(student => ({
          id: student.student_number,
          name: `${student.first_name} ${student.last_name}`,
          email: student.email,
          course: student.course_year_section,
          guardian: student.guardian_name,
          guardianContact: student.guardian_contact,
          status: student.status
        }));
        setStudents(formattedData);
      }
    } catch (err) {
      console.error("Unexpected error fetching students:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = GRID_STYLE_OVERRIDES;
    document.head.appendChild(styleEl);

    fetchStudents();

    return () => document.head.removeChild(styleEl);
  }, []);


  const columnDefs = useMemo(() => [
    {
      headerName: "Student ID",
      field: "id",
      flex: 1,
      cellStyle: { fontWeight: '500', color: '#94a3b8' },
      filter: true, // Enabled filtering for IDs
      tooltipField: "id"
    },
    {
      headerName: "Full Name",
      field: "name",
      flex: 1.5,
      cellStyle: { fontWeight: '600', color: '#f8fafc' },
      filter: true, // Enabled filtering for names
      tooltipField: "name"
    },
    {
      headerName: "Email",
      field: "email",
      flex: 2,
      cellStyle: { color: '#94a3b8' },
      filter: true,
      tooltipField: "email"
    },
    {
      headerName: "Course",
      field: "course",
      flex: 1,
      cellStyle: { color: '#94a3b8', fontWeight: '500' },
      filter: 'agSetColumnFilter', // Specialized filter for categories
      tooltipField: "course"
    },
    {
      headerName: "Guardian",
      field: "guardian",
      flex: 1.5,
      cellStyle: { color: '#94a3b8' },
      filter: true,
      valueFormatter: (params) => params.value ? params.value : 'Not provided'
    },
    {
      headerName: "Guardian Contact",
      field: "guardianContact",
      flex: 1.5,
      cellStyle: { color: '#94a3b8' },
      filter: true,
      valueFormatter: (params) => params.value ? params.value : 'Not provided'
    },
    {
      headerName: "Status",
      field: "status",
      flex: 1,
      filter: true,
      cellRenderer: (params) => {
        const statusColors = {
          'Enrolled': { text: 'text-emerald-400', dot: 'bg-emerald-400 animate-pulse' },
          'Graduated': { text: 'text-indigo-400', dot: 'bg-indigo-400' },
          'LOA': { text: 'text-amber-400', dot: 'bg-amber-400' },
          'Dropped': { text: 'text-orange-400', dot: 'bg-orange-400' },
          'Expelled': { text: 'text-rose-400', dot: 'bg-rose-400' }
        };
        const style = statusColors[params.value] || { text: 'text-slate-400', dot: 'bg-slate-400' };
        return (
          <div className="flex items-center h-full">
            <span className={`flex items-center text-[12px] font-bold ${style.text}`}>
              <span className={`mr-2 h-1.5 w-1.5 rounded-full ${style.dot}`} />
              {params.value}
            </span>
          </div>
        );
      }
    },
    {
      headerName: "Actions",
      field: "actions",
      flex: 0.8,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        return (
          <div className="flex items-center h-full">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-900/40"
              onClick={() => {
                setSelectedStudent(params.data);
                setIsEditModalOpen(true);
              }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        );
      }
    }
  ], []);


  const defaultColDef = useMemo(() => ({
    sortable: true,
    resizable: true,
    floatingFilter: false, // Set to true if you want filter inputs under the headers
  }), []);


  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'Enrolled').length;
  const graduatedStudents = students.filter(s => s.status === 'Graduated').length;
  const loaStudents = students.filter(s => s.status === 'LOA').length;
  const droppedStudents = students.filter(s => s.status === 'Dropped').length;
  const expelledStudents = students.filter(s => s.status === 'Expelled').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Student database</h1>
          <p className="text-slate-400">Manage and monitor student enrollment records</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 rounded-md font-medium text-sm transition-all shadow-sm active:scale-95"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Add student
        </Button>
      </div>


      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <QuickStat title="Total students" value={totalStudents.toLocaleString()} icon={Users} color="text-blue-400" />
        <QuickStat title="Active enrollment" value={activeStudents.toLocaleString()} icon={UserCheck} color="text-emerald-400" />
        <QuickStat title="Graduated" value={graduatedStudents.toLocaleString()} icon={GraduationCap} color="text-indigo-400" />
        <QuickStat title="On Leave (LOA)" value={loaStudents.toLocaleString()} icon={Clock} color="text-amber-400" />
        <QuickStat title="Dropped" value={droppedStudents.toLocaleString()} icon={UserX} color="text-orange-400" />
        <QuickStat title="Expelled" value={expelledStudents.toLocaleString()} icon={Ban} color="text-rose-400" />
      </div>

      <Card className="bg-slate-900 border-slate-800 flex flex-col rounded-lg overflow-hidden shadow-sm">
        <div className="px-4 pt-1 pb-0 flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="flex items-start gap-2">
            <h3 className="text-base font-semibold text-slate-200">Enrollment registry</h3>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Quick search..."
                className="pl-9 bg-slate-950 border-slate-800 text-slate-200 text-sm h-9 rounded-md focus:ring-1 focus:ring-blue-600"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="ag-theme-quartz-dark w-full" style={{ height: "500px" }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              Loading student records...
            </div>
          ) : (
            <AgGridReact
              theme={themeQuartz}
              rowData={students}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              onGridReady={(params) => setGridApi(params.api)}
              tooltipShowDelay={0}
              animateRows={true}
              rowHeight={48}
              headerHeight={44}
              pagination={true}
              paginationPageSize={10}
              suppressCellFocus={true}
              quickFilterText={searchValue}
            />
          )}
        </div>
      </Card>

      <AddStudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchStudents}
      />

      <EditStudentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchStudents}
        studentData={selectedStudent}
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
        <p className="text-xs font-medium text-slate-500 leading-none">{title}</p>
        <p className="text-lg font-bold text-white mt-1 leading-none">{value}</p>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${getGradient(color)} scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />
    </div>
  );
}

export default StudRecords;