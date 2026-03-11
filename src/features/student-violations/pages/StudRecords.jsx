import React, { useState, useMemo, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";

import { ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

import { Plus, Search, UserCheck, Users, GraduationCap, Edit2, UserX, Clock, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { AddStudentModal } from "../components/AddStudentModal";
import { EditStudentModal } from "../components/EditStudentModal";

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
      cellStyle: { color: 'var(--neutral-500)' },
      filter: true,
      valueFormatter: (params) => params.value ? params.value : 'Not provided'
    },
    {
      headerName: "Guardian Contact",
      field: "guardianContact",
      flex: 1.5,
      cellStyle: { color: 'var(--neutral-500)' },
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
      flex: 0.8,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        return (
          <div className="flex items-center h-full">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-primary-600 hover:text-primary-700 hover:bg-primary-50"
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
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-500 text-left bg-neutral-50">
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


      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <QuickStat title="Total students" value={totalStudents.toLocaleString()} icon={Users} color="text-primary-600" />
        <QuickStat title="Active enrollment" value={activeStudents.toLocaleString()} icon={UserCheck} color="text-success" />
        <QuickStat title="Graduated" value={graduatedStudents.toLocaleString()} icon={GraduationCap} color="text-info" />
        <QuickStat title="On Leave (LOA)" value={loaStudents.toLocaleString()} icon={Clock} color="text-warning" />
        <QuickStat title="Dropped" value={droppedStudents.toLocaleString()} icon={UserX} color="text-destructive-semantic" />
        <QuickStat title="Expelled" value={expelledStudents.toLocaleString()} icon={Ban} color="text-destructive-semantic" />
      </div>

      <Card className="bg-white border-neutral-200 shadow-sm flex flex-col rounded-lg overflow-hidden flex-1">
        <div className="px-4 py-4 flex items-center justify-between border-b border-neutral-100 bg-neutral-50/50">
          <h3 className="text-base font-bold text-neutral-900 uppercase tracking-tight">Enrollment registry</h3>
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
              Loading student records...
            </div>
          ) : (
            <AgGridReact
              theme={customTheme}
              rowData={students}
              columnDefs={columnDefs}
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

export default StudRecords;