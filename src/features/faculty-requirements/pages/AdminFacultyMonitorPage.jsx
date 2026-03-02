import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import {
  Eye, Mail, Bell, FileSpreadsheet, Search,
  RefreshCw, AlertCircle, CheckCircle, GraduationCap, X,
  FileText, Download, Filter, Info
} from 'lucide-react';

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DataTable } from "@/components/DataTable";

// Hook
import { useFacultyMonitor } from '../hooks/AdminFacultyMonitoringHook';

export default function AdminFacultyMonitorPage() {
  const navigate = useNavigate();
  const {
    loading, error, success,
    facultyList, options, filters, setFilters,
    sendReminder, sendBulkReminders, exportCSV, refresh
  } = useFacultyMonitor();

  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  // Helper: Get Initials for Avatar
  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  // Helper: Status Colors (Institutional Palette)
  const getStatusColor = (status) => {
    switch (status) {
      case 'On Track': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'At Risk': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Delayed': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-neutral-100 text-neutral-500 border-neutral-200';
    }
  };

  const handleReminderClick = (faculty) => {
    setSelectedFaculty(faculty);
    setReminderDialogOpen(true);
  };

  const confirmReminder = async () => {
    if (selectedFaculty) {
      await sendReminder(selectedFaculty.faculty_id);
      setReminderDialogOpen(false);
    }
  };

  // --- DataTable Column Definitions ---
  const columnDefs = useMemo(() => [
    {
      headerName: "Faculty Information",
      field: "last_name",
      flex: 2,
      minWidth: 250,
      cellRenderer: (p) => {
        const f = p.data;
        if (!f) return null;
        return (
          <div className="flex items-center gap-3 h-full">
            <div className="w-9 h-9 rounded-lg flex shrink-0 items-center justify-center font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
              {getInitials(f.first_name, f.last_name)}
            </div>
            <div className="flex flex-col justify-center leading-tight">
              <span className="font-bold text-neutral-900 text-sm">
                {f.first_name} {f.last_name}
              </span>
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                {f.department}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      headerName: "Submission Status",
      field: "status",
      width: 150,
      cellRenderer: (p) => {
        if (!p.value) return null;
        return (
          <div className="flex items-center h-full">
            <Badge className={`font-bold text-[10px] uppercase tracking-wide px-2 py-0.5 pointer-events-none ${getStatusColor(p.value)} shadow-none`}>
              {p.value}
            </Badge>
          </div>
        );
      }
    },
    {
      headerName: "Overall Completion",
      field: "overall_progress",
      flex: 1.5,
      minWidth: 180,
      cellRenderer: (p) => {
        if (p.value == null) return null;
        const score = parseFloat(p.value);
        return (
          <div className="flex flex-col justify-center h-full w-full pr-4">
            <div className="flex justify-between text-[10px] mb-1.5 font-bold uppercase tracking-widest text-neutral-400">
              <span>Progress</span>
              <span className="text-neutral-700">{score}%</span>
            </div>
            <Progress
              value={score}
              className="h-1.5 bg-neutral-100"
              indicatorClassName={score === 100 ? 'bg-emerald-500' : score > 50 ? 'bg-emerald-600' : 'bg-amber-500'}
            />
          </div>
        );
      }
    },
    {
      headerName: "Pending",
      field: "pending_submissions",
      width: 100,
      cellClass: "font-mono font-bold text-amber-600 text-center"
    },
    {
      headerName: "Late Items",
      field: "late_submissions",
      width: 100,
      cellClass: "font-mono font-bold text-rose-600 text-center"
    },
    {
      headerName: "Controls",
      width: 120,
      sortable: false,
      filter: false,
      pinned: 'right',
      cellRenderer: (p) => {
        const f = p.data;
        if (!f) return null;
        return (
          <div className="flex items-center gap-1.5 h-full">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              onClick={() => navigate(`/faculty/${f.faculty_id}`)}
              title="View Submissions"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              onClick={() => handleReminderClick(f)}
              title="Email Reminder"
            >
              <Mail className="h-4 w-4" />
            </Button>
          </div>
        );
      }
    }
  ], [navigate]);

  // Handle Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Faculty Monitoring Report', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Department: ${filters.department}`, 14, 36);

    const tableData = facultyList.map(f => [
      `${f.first_name} ${f.last_name}`,
      f.department,
      f.status,
      `${f.overall_progress}%`,
      f.pending_submissions,
      f.late_submissions
    ]);

    autoTable(doc, {
      head: [['Faculty Name', 'Department', 'Status', 'Progress', 'Pending', 'Late']],
      body: tableData,
      startY: 44,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 138, 69] } // PLP Green
    });

    doc.save('Faculty_Monitoring_Report.pdf');
  };

  const hasActiveFilters = filters.department !== "All Departments" ||
    filters.status !== "All Status" ||
    filters.course !== "All Courses" ||
    filters.search !== "";

  return (
    <div className="space-y-6 flex flex-col h-full bg-neutral-50">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100 shadow-sm">
            <GraduationCap className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Faculty Monitoring</h1>
            <p className="text-neutral-500 text-sm">Real-time status of requirement submissions across departments</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={refresh}
            disabled={loading}
            className="h-9 border-neutral-200 text-neutral-600 hover:bg-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Button
            className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/10 font-bold"
            onClick={() => sendBulkReminders()}
          >
            <Bell className="h-4 w-4 mr-2" /> Bulk Reminders
          </Button>
        </div>
      </div>

      {/* Notifications */}
      <div className="shrink-0 transition-all">
        {error && (
          <Alert variant="destructive" className="border-destructive/20 bg-destructive/5 text-destructive shadow-sm animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-semibold">{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="border-success/20 bg-success/5 text-success shadow-sm animate-in fade-in slide-in-from-top-1">
            <CheckCircle className="h-4 w-4 text-success" />
            <AlertDescription className="font-semibold">{success}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Filters & Table Container */}
      <div className="flex flex-col flex-1 min-h-0 bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">

        {/* Filter Strip */}
        <div className="p-4 bg-neutral-50/50 border-b border-neutral-100 flex flex-wrap items-end gap-4 shrink-0">
          <div className="flex-1 min-w-[200px] space-y-1.5">
            <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest pl-1">Search Faculty</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Find by name..."
                className="pl-9 bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-primary-500 focus-visible:border-primary-500 transition-all font-medium"
                value={filters.search}
                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
          </div>

          <div className="w-[180px] space-y-1.5">
            <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest pl-1">Department</label>
            <Select value={filters.department} onValueChange={v => setFilters(prev => ({ ...prev, department: v }))}>
              <SelectTrigger className="h-9 bg-white border-neutral-200 text-sm focus:ring-primary-500/20 focus:border-primary-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Departments">All Departments</SelectItem>
                {options.departments?.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[150px] space-y-1.5">
            <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest pl-1">Status</label>
            <Select value={filters.status} onValueChange={v => setFilters(prev => ({ ...prev, status: v }))}>
              <SelectTrigger className="h-9 bg-white border-neutral-200 text-sm focus:ring-primary-500/20 focus:border-primary-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Status">All Status</SelectItem>
                <SelectItem value="On Track">On Track</SelectItem>
                <SelectItem value="At Risk">At Risk</SelectItem>
                <SelectItem value="Delayed">Delayed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-[180px] space-y-1.5">
            <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest pl-1">Academic Year</label>
            <Select value={filters.academic_year} onValueChange={v => setFilters(prev => ({ ...prev, academic_year: v }))}>
              <SelectTrigger className="h-9 bg-white border-neutral-200 text-sm focus:ring-primary-500/20 focus:border-primary-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Years">All Academic Years</SelectItem>
                {/* Dynamically mapped academic years would go here */}
                {options.academic_years?.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({
                department: 'All Departments',
                semester: 'All Semesters',
                academic_year: 'All Years',
                status: 'All Status',
                course: 'All Courses',
                search: ''
              })}
              className="h-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold text-xs uppercase tracking-wider"
            >
              <X className="h-4 w-4 mr-1.5" /> Reset
            </Button>
          )}
        </div>

        {/* The Grid Area */}
        <div className="flex-1 min-h-0 relative bg-white">
          {facultyList.length === 0 && !loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
              <div className="p-4 bg-neutral-50 rounded-full mb-4 border border-neutral-100">
                <Search className="h-8 w-8 opacity-20" />
              </div>
              <p className="font-bold uppercase tracking-widest text-[10px]">No Matching Faculty</p>
              <p className="text-sm">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <DataTable
              rowData={facultyList}
              columnDefs={columnDefs}
              className="h-full border-0 rounded-none shadow-none"
              loading={loading}
            />
          )}
        </div>

        {/* Footer actions for the table card */}
        <div className="px-6 py-3 bg-neutral-50/50 border-t border-neutral-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
            <Info className="h-3.5 w-3.5 text-blue-500" />
            Showing {facultyList.length} faculty entries based on current filters.
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportCSV}
              className="h-8 bg-white border-neutral-200 text-neutral-600 text-[10px] font-bold uppercase tracking-widest"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-2 text-emerald-600" />
              Excel Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="h-8 bg-white border-neutral-200 text-neutral-600 text-[10px] font-bold uppercase tracking-widest"
            >
              <FileText className="h-3.5 w-3.5 mr-2 text-rose-600" />
              PDF Report
            </Button>
          </div>
        </div>
      </div>

      {/* Reminder Dialog */}
      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent className="bg-white border-neutral-200 text-neutral-900 sm:max-w-[450px] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 bg-emerald-600 text-white">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Mail className="h-5 w-5" /> Protocol Notification
            </DialogTitle>
            <DialogDescription className="text-emerald-50/80 font-medium">
              You are about to send a formal reminder to the faculty member.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-100">
              <div className="w-12 h-12 rounded-lg flex shrink-0 items-center justify-center font-bold text-lg bg-white text-emerald-700 border border-emerald-100 shadow-sm">
                {getInitials(selectedFaculty?.first_name, selectedFaculty?.last_name)}
              </div>
              <div>
                <p className="text-xs font-extrabold text-neutral-400 uppercase tracking-widest">Target Faculty</p>
                <p className="text-lg font-bold text-neutral-900">{selectedFaculty?.first_name} {selectedFaculty?.last_name}</p>
                <p className="text-sm font-medium text-neutral-500">{selectedFaculty?.department}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest mb-1">Pending</p>
                <p className="text-2xl font-mono font-black text-amber-700">{selectedFaculty?.pending_submissions || 0}</p>
              </div>
              <div className="bg-rose-50/50 p-3 rounded-lg border border-rose-100">
                <p className="text-[10px] font-extrabold text-rose-600 uppercase tracking-widest mb-1">Late Items</p>
                <p className="text-2xl font-mono font-black text-rose-700">{selectedFaculty?.late_submissions || 0}</p>
              </div>
            </div>

            <p className="text-xs text-neutral-500 leading-relaxed italic">
              * This notification will be delivered via the institutional email system and recorded in the audit trail.
            </p>
          </div>

          <DialogFooter className="p-6 bg-neutral-50 border-t border-neutral-100 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setReminderDialogOpen(false)}
              className="flex-1 bg-white border-neutral-200 text-neutral-600 font-bold uppercase tracking-widest text-[10px] h-10"
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-[10px] h-10 shadow-lg shadow-emerald-900/10"
              onClick={confirmReminder}
            >
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}