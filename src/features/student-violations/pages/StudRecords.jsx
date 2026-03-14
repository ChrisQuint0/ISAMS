import React, { useState, useMemo, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";

import { ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

import { Plus, Search, UserCheck, Users, GraduationCap, Edit2, UserX, Clock, Ban, Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { AddStudentModal } from "../components/AddStudentModal";
import { EditStudentModal } from "../components/EditStudentModal";

// Custom theme using AG Grid v33+ Theming API with Quartz theme for a clean institutional look
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

// --- Reusable Stat Card (Extra Compact) ---
const StatCard = ({ title, value, icon: Icon, description, trend, isUp, isLoading, borderTopClass = "bg-primary-500", iconClass = "text-primary-600 bg-primary-50 border-primary-100" }) => (
  <Card className="bg-white border-neutral-200 shadow-sm rounded-lg overflow-hidden relative group transition-all hover:shadow-md hover:-translate-y-0.5 h-full flex flex-col">
    <div className={`absolute top-0 left-0 w-full h-1 ${borderTopClass} transition-opacity opacity-70 group-hover:opacity-100`}></div>
    <CardContent className="p-3 flex-1 flex flex-col justify-between relative z-10">
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className={`p-1.5 rounded-md border ${iconClass} transition-transform group-hover:scale-105 duration-300`}>
            <Icon size={16} strokeWidth={2.5} />
          </div>
          {trend !== undefined && !isLoading && (
            <div className={`px-2 py-0.5 rounded-full flex items-center text-[10px] font-bold ${isUp ? 'bg-success/10 text-success' : 'bg-destructive-semantic/10 text-destructive-semantic'}`}>
              {isUp ? <ArrowUpRight size={12} className="mr-0.5" /> : <ArrowDownRight size={12} className="mr-0.5" />}
              {trend}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-2xl font-black text-neutral-900 tracking-tighter leading-none mb-1">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-neutral-300" /> : value}
          </h3>
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{title}</p>
        </div>
      </div>
      {description && (
        <div className="mt-2 pt-2 border-t border-neutral-100/60 hidden">
          <p className="text-[10px] text-neutral-400 font-medium">{description}</p>
        </div>
      )}
    </CardContent>
  </Card>
);

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
      // Fetch users for audit trail resolution
      const { data: usersData } = await supabase
        .from('users_with_roles')
        .select('id, first_name, last_name');
        
      const userMap = {};
      if (usersData) {
         usersData.forEach(u => {
             userMap[u.id] = `${u.first_name} ${u.last_name}`;
         });
      }

      const { data, error } = await supabase
        .from('students_sv')
        .select('*');

      if (error) {
        console.error("Error fetching students:", error.message);
      } else if (data) {
        const formattedData = data.map(student => ({
          id: student.student_number,
          first_name: student.first_name,
          last_name: student.last_name,
          name: `${student.first_name} ${student.last_name}`,
          email: student.email,
          course: student.course_year_section,
          guardian: student.guardian_name,
          guardianContact: student.guardian_contact,
          status: student.status,
          created_at: student.created_at,
          updated_at: student.updated_at,
          created_by_name: userMap[student.created_by] || 'System',
          updated_by_name: userMap[student.updated_by] || (student.updated_by ? 'System' : 'None')
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
    fetchStudents();
  }, []);


  const columnDefs = useMemo(() => [
    {
      headerName: "Student ID",
      field: "id",
      flex: 1,
      cellStyle: { fontWeight: '500', color: 'var(--neutral-500)' },
      filter: true, // Enabled filtering for IDs
      tooltipField: "id"
    },
    {
      headerName: "Full Name",
      field: "name",
      flex: 1.5,
      cellStyle: { fontWeight: '600', color: 'var(--neutral-900)' },
      filter: true, // Enabled filtering for names
      tooltipField: "name"
    },
    {
      headerName: "Email",
      field: "email",
      flex: 2,
      cellStyle: { color: 'var(--neutral-500)' },
      filter: true,
      tooltipField: "email"
    },
    {
      headerName: "Course",
      field: "course",
      flex: 1,
      cellStyle: { color: 'var(--neutral-500)', fontWeight: '500' },
      filter: 'agSetColumnFilter', // Specialized filter for categories
      tooltipField: "course"
    },
    {
      headerName: "Guardian",
      field: "guardian",
      flex: 1.5,
      filter: true,
      cellRenderer: (params) => {
        if (!params.value) {
          return <span className="text-neutral-400 italic">Not provided</span>;
        }
        return <span className="text-neutral-500">{params.value}</span>;
      }
    },
    {
      headerName: "Guardian Contact",
      field: "guardianContact",
      flex: 1.5,
      filter: true,
      cellRenderer: (params) => {
        if (!params.value) {
          return <span className="text-neutral-400 italic">Not provided</span>;
        }
        return <span className="text-neutral-500">{params.value}</span>;
      }
    },
    {
      headerName: "Status",
      field: "status",
      flex: 1,
      filter: true,
      cellRenderer: (params) => {
        const statusColors = {
          'Enrolled': { text: 'text-success', dot: 'bg-success animate-pulse' },
          'Graduated': { text: 'text-info', dot: 'bg-info' },
          'LOA': { text: 'text-warning', dot: 'bg-warning' },
          'Dropped': { text: 'text-destructive-semantic', dot: 'bg-destructive-semantic' },
          'Expelled': { text: 'text-destructive-semantic', dot: 'bg-destructive-semantic' }
        };
        const style = statusColors[params.value] || { text: 'text-neutral-500', dot: 'bg-neutral-500' };
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
      headerName: "Created By",
      field: "created_by_name",
      flex: 1.5,
      cellStyle: { color: 'var(--neutral-500)' },
      filter: true,
      hide: true // Hidden by default, unhideable in AG Grid columns panel
    },
    {
      headerName: "Updated By",
      field: "updated_by_name",
      flex: 1.5,
      cellStyle: { color: 'var(--neutral-500)' },
      filter: true,
      hide: true // Hidden by default
    },
    {
      headerName: "Actions",
      field: "actions",
      width: 100,
      pinned: 'right',
      headerClass: 'text-center',
      sortable: false,
      filter: false,
      cellRenderer: (params) => (
        <div className="flex items-center justify-center h-full gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            onClick={() => {
              setSelectedStudent(params.data);
              setIsEditModalOpen(true);
            }}
            title="Edit"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
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
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-500 text-left bg-neutral-50 px-2">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Student database</h1>
          <p className="text-neutral-500 text-sm font-medium">Manage and monitor student enrollment records</p>
        </div>
        <Button
          className="bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-emerald-900/10 transition-all font-bold h-9 px-4 rounded-md text-sm active:scale-95"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Add student
        </Button>
      </div>


      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <StatCard 
            title="Total Students" 
            value={totalStudents.toLocaleString()} 
            icon={Users} 
            isLoading={isLoading} 
            borderTopClass="bg-primary-500" 
            iconClass="text-primary-600 bg-primary-50 border-primary-100" 
        />
        <StatCard 
            title="Active" 
            value={activeStudents.toLocaleString()} 
            icon={UserCheck} 
            isLoading={isLoading} 
            borderTopClass="bg-success" 
            iconClass="text-success bg-success/10 border-success/20" 
        />
        <StatCard 
            title="Graduated" 
            value={graduatedStudents.toLocaleString()} 
            icon={GraduationCap} 
            isLoading={isLoading} 
            borderTopClass="bg-info" 
            iconClass="text-info bg-info/10 border-info/20" 
        />
        <StatCard 
            title="LOA" 
            value={loaStudents.toLocaleString()} 
            icon={Clock} 
            isLoading={isLoading} 
            borderTopClass="bg-warning" 
            iconClass="text-warning bg-warning/10 border-warning/20" 
        />
        <StatCard 
            title="Dropped" 
            value={droppedStudents.toLocaleString()} 
            icon={UserX} 
            isLoading={isLoading} 
            borderTopClass="bg-destructive-semantic" 
            iconClass="text-destructive-semantic bg-destructive-semantic/10 border-destructive-semantic/20" 
        />
        <StatCard 
            title="Expelled" 
            value={expelledStudents.toLocaleString()} 
            icon={Ban} 
            isLoading={isLoading} 
            borderTopClass="bg-destructive-semantic" 
            iconClass="text-destructive-semantic bg-destructive-semantic/10 border-destructive-semantic/20" 
        />
      </div>

      <Card className="bg-white border-neutral-200 shadow-sm flex flex-col rounded-lg overflow-hidden flex-1 p-0 z-10">
        <div className="px-5 pt-3 pb-2 flex items-center justify-between bg-white relative z-20">
          <div className="flex items-center gap-2">
            <Users className="h-[15px] w-[15px] text-neutral-600" />
            <h3 className="text-[15px] font-bold text-neutral-900 uppercase tracking-wider leading-none">Enrollment Registry</h3>
          </div>
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            <Input
              placeholder="Search students..."
              className="pl-8 h-7 bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-primary-500 focus-visible:border-primary-500 transition-all font-medium text-xs shadow-sm rounded-md"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
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
              Loading student records...
            </div>
          ) : (
            <AgGridReact
              theme={customTheme}
              rowData={students}
              columnDefs={columnDefs}
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

export default StudRecords;