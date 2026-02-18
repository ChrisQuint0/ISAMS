import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import {
  Eye, Mail, Bell, FileText, FileSpreadsheet, Search, Filter,
  RefreshCw, AlertCircle, Clock, File, CheckCircle, GraduationCap, X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

// Hook
import { useFacultyMonitor } from '../hooks/AdminFacultyMonitoringHook';

export default function FacultyMonitorPage() {
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

  // Helper: Generate consistent color based on name
  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'bg-amber-500/20 text-amber-400 border-amber-500/30',
      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'bg-pink-500/20 text-pink-400 border-pink-500/30'
    ];
    let hash = 0;
    if (!name) return colors[0];
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  // Helper: Status Colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'On Track': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20';
      case 'At Risk': return 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20';
      case 'Delayed': return 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
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

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      department: "All Departments",
      status: "All Status",
      course: "All Courses",
      search: ""
    });
  };

  const hasActiveFilters = filters.department !== "All Departments" ||
    filters.status !== "All Status" ||
    filters.course !== "All Courses" ||
    filters.search !== "";

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('Faculty Monitoring Report', 14, 22);

    // Meta
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Filter: ${filters.department} | ${filters.status}`, 14, 36);

    // Table Data
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
      headStyles: { fillColor: [15, 23, 42] }
    });

    doc.save('Faculty_Monitoring_Report.pdf');
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Faculty Monitoring</h1>
          <p className="text-slate-400 text-sm">Track and manage faculty submissions across all departments</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Faculty
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20"
            size="sm"
            onClick={() => sendBulkReminders()}
          >
            <Bell className="h-4 w-4 mr-2" /> Bulk Reminders
          </Button>
        </div>
      </div>

      {/* Notifications */}
      <div className="shrink-0">
        {error && (
          <Alert variant="destructive" className="border-red-900/50 bg-red-900/10 text-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="border-green-900/50 bg-green-900/10 text-green-200">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Filters Card */}
      <Card className="bg-slate-900 border-slate-800 shadow-none shrink-0">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search - Placed first for better UX */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Search Faculty</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search by name..."
                  className="pl-9 bg-slate-950/50 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:ring-blue-500/20 focus:border-blue-500/50"
                  value={filters.search}
                  onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>

            {/* Department Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Department</label>
              <Select value={filters.department} onValueChange={v => setFilters(prev => ({ ...prev, department: v }))}>
                <SelectTrigger className="bg-slate-950/50 border-slate-700 text-slate-200 focus:ring-blue-500/20">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  <SelectItem value="All Departments" className="focus:bg-slate-300">All Departments</SelectItem>
                  {options.departments?.map(d => (
                    <SelectItem key={d} value={d} className="focus:bg-slate-800">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Status</label>
              <Select value={filters.status} onValueChange={v => setFilters(prev => ({ ...prev, status: v }))}>
                <SelectTrigger className="bg-slate-950/50 border-slate-700 text-slate-200 focus:ring-blue-500/20">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  <SelectItem value="All Status" className="focus:bg-slate-300">All Status</SelectItem>
                  <SelectItem value="On Track" className="focus:bg-slate-300 text-emerald-400">On Track</SelectItem>
                  <SelectItem value="At Risk" className="focus:bg-slate-300 text-amber-400">At Risk</SelectItem>
                  <SelectItem value="Delayed" className="focus:bg-slate-300 text-rose-400">Delayed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Course Filter */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Course</label>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center">
                    <X className="h-3 w-3 mr-1" /> Clear
                  </button>
                )}
              </div>
              <Select value={filters.course} onValueChange={v => setFilters(prev => ({ ...prev, course: v }))}>
                <SelectTrigger className="bg-slate-950/50 border-slate-700 text-slate-200 focus:ring-blue-500/20">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  <SelectItem value="All Courses" className="focus:bg-slate-300">All Courses</SelectItem>
                  {options.courses?.map(c => (
                    <SelectItem key={c} value={c} className="focus:bg-slate-300">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Faculty Grid */}
      {facultyList.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-lg">
          <GraduationCap className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium text-slate-400">No faculty found</p>
          <p className="text-sm">Try adjusting your filters or search terms.</p>
          <Button variant="link" onClick={clearFilters} className="text-blue-400 mt-2">Clear all filters</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
          {facultyList.map(f => (
            <Card key={f.faculty_id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all duration-200 hover:shadow-lg hover:shadow-slate-900/50 flex flex-col">
              <CardHeader className="p-5 pb-3">
                <div className="flex justify-between items-start mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm border ${getAvatarColor(f.first_name)}`}>
                    {getInitials(f.first_name, f.last_name)}
                  </div>
                  <Badge className={`font-normal ${getStatusColor(f.status)}`}>{f.status}</Badge>
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 leading-tight truncate" title={`${f.first_name} ${f.last_name}`}>
                    {f.first_name} {f.last_name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 truncate" title={f.department}>{f.department}</p>
                </div>
              </CardHeader>

              <CardContent className="p-5 pt-0 flex-1">
                {/* Overall Progress */}
                <div className="mb-4 bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400 font-medium">Completion Rate</span>
                    <span className="font-bold text-slate-200">{f.overall_progress}%</span>
                  </div>
                  <Progress
                    value={f.overall_progress}
                    className="h-1.5 bg-slate-800"
                  // Note: Shadcn Progress uses internal classes for bar color, 
                  // usually accessible via CSS variable or standard tailwind config.
                  />
                </div>

                {/* Courses Scroll Area */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Courses</p>
                  <ScrollArea className="h-32 -mr-3 pr-3">
                    <div className="space-y-2">
                      {f.courses.map((c, i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-800/30 p-2 rounded border border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                          <div className="min-w-0 flex-1 mr-2">
                            <p className="text-xs font-medium text-slate-300 truncate" title={c.course_code}>{c.course_code}</p>
                          </div>
                          {c.progress >= 100 ? (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 h-5 px-1.5 text-[10px] hover:bg-emerald-500/10">Done</Badge>
                          ) : c.progress <= 0 ? (
                            <Badge className="bg-slate-800 text-slate-500 border-slate-700 h-5 px-1.5 text-[10px] hover:bg-slate-800">0%</Badge>
                          ) : (
                            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 h-5 px-1.5 text-[10px] hover:bg-blue-500/10">{c.progress.toFixed(0)}%</Badge>
                          )}
                        </div>
                      ))}
                      {f.courses.length === 0 && (
                        <p className="text-xs text-slate-600 italic py-2 text-center">No courses assigned</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>

              <CardFooter className="p-5 pt-0 gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-9 bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                  onClick={() => navigate(`/faculty/${f.faculty_id}`)}
                >
                  <Eye className="h-3.5 w-3.5 mr-2" /> Details
                </Button>
                <Button
                  className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-900/10"
                  onClick={() => handleReminderClick(f)}
                >
                  <Mail className="h-3.5 w-3.5 mr-2" /> Remind
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Bottom Export Card (Sticky or at bottom of flow) */}
      <Card className="bg-slate-900 border-slate-800 shadow-none mt-auto">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <h3 className="font-medium text-slate-200">Export Data</h3>
              <p className="text-xs text-slate-500">Download reports for offline analysis</p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
                className="flex-1 sm:flex-none bg-slate-950/50 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-500" />
                CSV Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                className="flex-1 sm:flex-none bg-slate-950/50 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <File className="h-4 w-4 mr-2 text-rose-500" />
                PDF Summary
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reminder Dialog */}
      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" /> Send Reminder
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Notify faculty members about their pending submission deadlines.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
              <p className="text-sm text-slate-300 mb-3">
                You are about to send an email to:
                <br />
                <span className="font-bold text-lg text-white block mt-1">{selectedFaculty?.first_name} {selectedFaculty?.last_name}</span>
              </p>

              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400">Pending Submissions</span>
                  <span className="font-mono text-amber-400">{selectedFaculty?.pending_submissions || 0}</span>
                </div>
                <div className="flex justify-between text-sm bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400">Late Items</span>
                  <span className="font-mono text-rose-400">{selectedFaculty?.late_submissions || 0}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-4 italic">
              * This action will be logged in the system audit trail.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setReminderDialogOpen(false)}
              className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={confirmReminder}
            >
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}