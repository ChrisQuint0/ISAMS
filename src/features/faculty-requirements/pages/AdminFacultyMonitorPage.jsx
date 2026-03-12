import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import {
  Eye, Mail, Bell, FileSpreadsheet, Search,
  RefreshCw, AlertCircle, CheckCircle, GraduationCap, X,
  FileText, Filter, Info, Users, Clock,
  ChevronRight, Award, AlertTriangle
} from 'lucide-react';

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/DataTable";
import { ToastProvider, useToast } from "@/components/ui/toast/toaster";

// Services & Hooks
import { useFacultyMonitor } from '../hooks/AdminFacultyMonitoringHook';
import { facultyMonitorService } from '../services/AdminFacultyMonitoringService';

// Toast bridge
const MonitorToastHandler = ({ success, error }) => {
  const { addToast } = useToast();
  useEffect(() => {
    if (success) addToast({ title: "Success", description: String(success), variant: "success" });
  }, [success, addToast]);
  useEffect(() => {
    if (error) addToast({ title: "Error", description: String(error), variant: "destructive" });
  }, [error, addToast]);
  return null;
};

export default function AdminFacultyMonitorPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const {
    loading, error, success,
    facultyList, options, filters, setFilters,
    sendReminder, sendBulkReminders, exportCSV, refresh
  } = useFacultyMonitor();

  // Dialogs
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  // Reminder email state
  const [reminderSubject, setReminderSubject] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Bulk reminder dialog state
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkScope, setBulkScope] = useState('at_risk');
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  // --- Derived stat counters ---
  const stats = useMemo(() => {
    const total = facultyList.length;
    const cleared = facultyList.filter(f => f.overall_progress >= 100).length;
    const pending = facultyList.reduce((acc, f) => acc + (f.pending_submissions || 0), 0);
    const atRisk = facultyList.filter(f => f.status === 'At Risk' || f.status === 'Delayed').length;
    return { total, cleared, pending, atRisk };
  }, [facultyList]);

  // Helpers
  const getInitials = (firstName, lastName) =>
    `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

  const getStatusColor = (status) => {
    switch (status) {
      case 'On Track': return 'bg-success/10 text-success border-success/20';
      case 'At Risk': return 'bg-warning/10 text-warning border-warning/20';
      case 'Delayed': return 'bg-destructive/10 text-destructive-semantic border-destructive/20';
      default: return 'bg-neutral-100 text-neutral-500 border-neutral-200';
    }
  };

  const handleReminderClick = (faculty) => {
    setSelectedFaculty(faculty);
    setReminderSubject('');
    setReminderMessage('');
    setReminderDialogOpen(true);
  };

  const confirmReminder = async () => {
    if (!selectedFaculty) return;
    setIsSendingEmail(true);
    try {
      const result = await facultyMonitorService.sendEmail({
        facultyId: selectedFaculty.faculty_id,
        template: 'deadline_reminder',
        subject: reminderSubject || undefined,
        message: reminderMessage || undefined,
        pendingCount: selectedFaculty.pending_submissions,
        lateCount: selectedFaculty.late_submissions
      });
      addToast({
        title: "Email Sent",
        description: `Reminder sent to ${result.email_sent_to}`,
        variant: "success"
      });
      setReminderDialogOpen(false);
    } catch (err) {
      addToast({ title: "Error", description: err.message || "Failed to send reminder.", variant: "destructive" });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // --- Bulk reminder scope helpers ---
  const bulkTargets = useMemo(() => {
    if (bulkScope === 'at_risk') return facultyList.filter(f => f.status === 'At Risk');
    if (bulkScope === 'delayed') return facultyList.filter(f => f.status === 'Delayed');
    if (bulkScope === 'not_cleared') return facultyList.filter(f => f.overall_progress < 100);
    return facultyList; // 'all'
  }, [bulkScope, facultyList]);

  const confirmBulkSend = async () => {
    if (bulkTargets.length === 0) {
      addToast({ title: "No Recipients", description: "No faculty match the selected scope.", variant: "warning" });
      return;
    }
    setIsSendingBulk(true);
    setBulkResult(null);
    try {
      const result = await facultyMonitorService.sendBulkEmails(bulkTargets, {
        subject: bulkSubject || undefined,
        message: bulkMessage || undefined,
        template: 'deadline_reminder'
      });
      setBulkResult(result);
      addToast({
        title: `Bulk Send Complete`,
        description: `${result.succeeded} sent, ${result.failed} failed out of ${result.total}`,
        variant: result.failed === 0 ? 'success' : 'warning'
      });
    } catch (err) {
      addToast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSendingBulk(false);
    }
  };

  // --- DataTable columns ---
  const columnDefs = useMemo(() => [
    {
      headerName: "Faculty",
      field: "last_name",
      flex: 2,
      minWidth: 240,
      cellRenderer: (p) => {
        const f = p.data;
        if (!f) return null;
        return (
          <div className="flex items-center gap-3 h-full">
            <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-black text-xs bg-primary-50 text-primary-700 border border-primary-100 shadow-sm">
              {getInitials(f.first_name, f.last_name)}
            </div>
            <div
              className="flex flex-col leading-tight cursor-pointer group"
              onClick={() => navigate(`/faculty/${f.faculty_id}`)}
            >
              <span className="font-bold text-neutral-900 text-sm group-hover:text-primary-600 transition-colors flex items-center gap-1.5">
                {f.first_name} {f.last_name}
                <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary-400" />
              </span>
              <div className="flex gap-1 items-center mt-0.5">
                <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">
                  {f.employment_type || 'Faculty'}
                </span>
                {f.courses?.length > 0 && (
                  <>
                    <span className="text-neutral-300">•</span>
                    <span className="text-[9px] font-mono text-primary-500 font-bold">
                      {f.courses.slice(0, 2).map(c => c.course_code).join(', ')}
                      {f.courses.length > 2 && ' ...'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      headerName: "Status",
      field: "status",
      width: 130,
      cellRenderer: (p) => {
        if (!p.value) return null;
        const styles = {
          'On Track': 'bg-success/10 text-success border-success/20',
          'At Risk': 'bg-warning/10 text-warning border-warning/20',
          'Delayed': 'bg-destructive/10 text-destructive-semantic border-destructive/20',
        };
        return (
          <div className="flex items-center h-full">
            <span className={`font-bold text-xs px-2 py-0.5 rounded-full border ${styles[p.value] || 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>
              {p.value}
            </span>
          </div>
        );
      }
    },
    {
      headerName: "Completion",
      field: "overall_progress",
      flex: 1.5,
      minWidth: 170,
      cellRenderer: (p) => {
        if (p.value == null) return null;
        const score = parseFloat(p.value);
        const color = score === 100 ? 'bg-success' : score > 50 ? 'bg-primary-500' : 'bg-warning';
        return (
          <div className="flex flex-col justify-center h-full w-full pr-4">
            <div className="flex justify-between text-[10px] mb-1.5 font-black uppercase tracking-widest text-neutral-400">
              <span>Progress</span>
              <span className={score === 100 ? 'text-success' : score > 50 ? 'text-primary-600' : 'text-warning'}>{score}%</span>
            </div>
            <Progress value={score} className="h-1.5 bg-neutral-100" indicatorClassName={color} />
          </div>
        );
      }
    },
    {
      headerName: "Submitted",
      field: "submitted_submissions",
      width: 105,
      cellClass: "font-mono font-black text-primary-600 text-center text-sm"
    },
    {
      headerName: "Pending",
      field: "pending_submissions",
      width: 95,
      cellClass: "font-mono font-black text-warning text-center text-sm"
    },
    {
      headerName: "Late",
      field: "late_submissions",
      width: 80,
      cellClass: "font-mono font-black text-destructive-semantic text-center text-sm"
    },
    {
      headerName: "Actions",
      width: 130,
      sortable: false,
      filter: false,
      pinned: 'right',
      cellRenderer: (p) => {
        const f = p.data;
        if (!f) return null;
        return (
          <div className="flex gap-1 items-center h-full">
            <Button
              size="icon" variant="ghost" title="View Details"
              className="h-7 w-7 rounded-md text-neutral-400 hover:text-primary-600 hover:bg-primary-600/10 transition-all"
              onClick={() => navigate(`/faculty/${f.faculty_id}`)}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon" variant="ghost" title="Send Reminder"
              className="h-7 w-7 rounded-md text-neutral-400 hover:text-info hover:bg-info/10 transition-all"
              onClick={() => handleReminderClick(f)}
            >
              <Mail className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      }
    }
  ], [navigate]);

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(0, 138, 69);
    doc.text('Faculty Monitoring Report', 14, 25);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Institutional Submission & Monitoring System (ISAMS)', 14, 32);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 37);
    const tableData = facultyList.map(f => [
      `${f.first_name} ${f.last_name}`,
      f.status,
      `${f.overall_progress}%`,
      f.submitted_submissions,
      f.pending_submissions,
      f.late_submissions,
      f.courses?.map(c => c.course_code).join(', ') || 'N/A'
    ]);
    autoTable(doc, {
      head: [['Faculty Name', 'Status', 'Progress', 'Submitted', 'Pending', 'Late', 'Courses']],
      body: tableData,
      startY: 45,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [0, 138, 69], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 248, 245] }
    });
    doc.save(`Faculty_Monitoring_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const hasActiveFilters = filters.status !== "All Status" ||
    filters.course !== "All Courses" ||
    filters.section !== "All Sections" ||
    filters.search !== "";

  // --- Stat Card Component (matches Deadline page style) ---
  const StatCard = ({ icon: Icon, label, value, color, sub }) => (
    <Card className="bg-white border-neutral-200 shadow-sm transition-all hover:shadow-md overflow-hidden">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-bold text-neutral-900 tracking-tight">{value}</p>
            {sub && <p className="text-[10px] text-neutral-400 mt-2 font-bold uppercase tracking-wider">{sub}</p>}
          </div>
          <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-100">
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ToastProvider>
      <MonitorToastHandler success={success} error={error} />
      <div className="space-y-6 flex flex-col h-full bg-neutral-50/30 pb-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Faculty Monitoring</h1>
            <p className="text-neutral-500 text-sm font-medium">Real-time status of requirement submissions across all courses and sections</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm" onClick={refresh} disabled={loading}
              className="bg-primary-500 border-primary-500 text-neutral-50 hover:bg-primary-600 hover:text-neutral-50 shadow-sm text-xs font-bold"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Monitoring
            </Button>
            <Button
              size="sm"
              className="bg-gold-400 text-neutral-900 hover:text-neutral-900 hover:bg-gold-600 shadow-sm active:scale-95 transition-all text-xs font-bold"
              onClick={() => {
                setBulkSubject('');
                setBulkMessage('');
                setBulkScope('at_risk');
                setBulkResult(null);
                setBulkDialogOpen(true);
              }}
            >
              <Bell className="h-4 w-4 mr-2" /> Bulk Reminders
            </Button>
          </div>
        </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          <StatCard icon={Users} label="Total Faculty" value={stats.total} color="text-primary-600" sub="Currently monitored" />
          <StatCard icon={Award} label="Fully Cleared" value={stats.cleared} color="text-success" sub="100% completion" />
          <StatCard icon={Clock} label="Pending Items" value={stats.pending} color="text-warning" sub="Across all faculty" />
          <StatCard icon={AlertTriangle} label="At Risk / Delayed" value={stats.atRisk} color="text-destructive-semantic" sub="Needs attention" />
        </div>

        {/* Filter Card */}
        <Card className="bg-white border-neutral-200 shadow-sm shrink-0 overflow-hidden">
          <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-3.5 px-5">
            <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary-600" />
              Filter & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 bg-white">
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-end shadow-sm">
              <div className="flex-1 space-y-1.5">
                <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Search Faculty</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder="By name or course..."
                    className="pl-9 bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs focus-visible:ring-primary-500 font-medium"
                    value={filters.search}
                    onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Course</Label>
                <Select value={filters.course} onValueChange={v => setFilters(prev => ({ ...prev, course: v }))}>
                  <SelectTrigger className="bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs font-medium">
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-neutral-200">
                    <SelectItem value="All Courses" className="font-medium text-xs">All Courses</SelectItem>
                    {options.courses?.map(c => (
                      <SelectItem key={c} value={c} className="font-medium text-xs">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Section</Label>
                <Select value={filters.section} onValueChange={v => setFilters(prev => ({ ...prev, section: v }))}>
                  <SelectTrigger className="bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs font-medium">
                    <SelectValue placeholder="All Sections" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-neutral-200">
                    <SelectItem value="All Sections" className="font-medium text-xs">All Sections</SelectItem>
                    {options.sections?.map(s => (
                      <SelectItem key={s} value={s} className="font-medium text-xs">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Status</Label>
                <Select value={filters.status} onValueChange={v => setFilters(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger className="bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-neutral-200">
                    <SelectItem value="All Status" className="font-medium text-xs">All Status</SelectItem>
                    <SelectItem value="On Track" className="font-medium text-xs text-success">On Track</SelectItem>
                    <SelectItem value="At Risk" className="font-medium text-xs text-warning">At Risk</SelectItem>
                    <SelectItem value="Delayed" className="font-medium text-xs text-destructive">Delayed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost" size="sm"
                  onClick={() => setFilters({ semester: 'All Semesters', academic_year: 'All Years', status: 'All Status', course: 'All Courses', section: 'All Sections', search: '' })}
                  className="h-9 px-3 bg-destructive-semantic text-white hover:text-neutral-100 hover:bg-destructive-semantic/80 font-bold text-xs shadow-sm transition-all shrink-0"
                >
                  <X className="h-4 w-4 mr-1.5" /> Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Faculty Roster Table */}
        <Card className="bg-white border-neutral-200 shadow-sm overflow-hidden flex flex-col flex-1">
          <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-4 px-5 flex flex-row items-center justify-between shrink-0">
            <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary-600" />
              Faculty Roster
              <Badge className="bg-primary-50 text-primary-600 border-primary-100 text-[10px] font-black px-2 py-0 ml-1">{facultyList.length}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV} className="h-8 bg-white text-xs font-bold px-3 border-neutral-200 text-neutral-600 shadow-sm hover:bg-neutral-50">
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-success" /> Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF} className="h-8 bg-white text-xs font-bold px-3 border-neutral-200 text-neutral-600 shadow-sm hover:bg-neutral-50">
                <FileText className="h-3.5 w-3.5 mr-1.5 text-destructive" /> PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 relative bg-white min-h-[380px]">
            {facultyList.length === 0 && !loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
                <div className="p-4 bg-neutral-50 rounded-full mb-4 border border-neutral-100">
                  <Search className="h-8 w-8 opacity-20" />
                </div>
                <p className="font-black uppercase tracking-widest text-[10px]">No Matching Faculty</p>
                <p className="text-sm font-medium">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <DataTable
                rowData={facultyList}
                columnDefs={columnDefs}
                className="h-full border-0 rounded-none shadow-none"
                loading={loading}
              />
            )}
          </CardContent>
          <div className="px-5 py-3 bg-neutral-50/80 border-t border-neutral-200 flex items-center shrink-0">
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-primary-500" />
              Showing {facultyList.length} entries based on current filters
            </p>
          </div>
        </Card>

        {/* Send Reminder Dialog */}
        <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
          <DialogContent className="bg-white border-neutral-200 text-neutral-900 max-w-md shadow-xl p-0 overflow-hidden">
            <DialogHeader className="p-5 bg-white border-b border-neutral-200">
              <DialogTitle className="text-neutral-900 flex items-center gap-2 font-bold text-lg">
                <Mail className="h-5 w-5 text-primary-600" />
                Protocol Notification
              </DialogTitle>
              <DialogDescription className="text-neutral-500 font-medium mt-1">
                Send a formal reminder regarding missing requirements.
              </DialogDescription>
            </DialogHeader>
            <div className="p-5 space-y-4 bg-white">
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center font-black text-base bg-white text-primary-700 border border-neutral-200 shadow-sm">
                  {getInitials(selectedFaculty?.first_name, selectedFaculty?.last_name)}
                </div>
                <div>
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-0.5">Target Faculty</p>
                  <p className="text-sm font-bold text-neutral-900">{selectedFaculty?.first_name} {selectedFaculty?.last_name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block">Pending Items</label>
                  <div className="bg-white border border-neutral-200 text-warning shadow-sm font-mono font-black text-lg px-3 h-9 flex items-center rounded-md">
                    {selectedFaculty?.pending_submissions || 0}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block">Late Items</label>
                  <div className="bg-white border border-neutral-200 text-destructive shadow-sm font-mono font-black text-lg px-3 h-9 flex items-center rounded-md">
                    {selectedFaculty?.late_submissions || 0}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Custom Subject <span className="text-neutral-400">(Optional)</span></Label>
                <Input
                  placeholder="[ISAMS] Submission Reminder — Action Required"
                  value={reminderSubject}
                  onChange={e => setReminderSubject(e.target.value)}
                  className="bg-white border-neutral-200 text-neutral-900 font-medium h-9 shadow-sm text-xs focus-visible:ring-primary-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Custom Message <span className="text-neutral-400">(Optional)</span></Label>
                <Textarea
                  placeholder="Leave blank to use the default reminder template..."
                  value={reminderMessage}
                  onChange={e => setReminderMessage(e.target.value)}
                  className="bg-neutral-50 border-neutral-200 text-neutral-900 font-medium resize-none focus-visible:ring-primary-500 text-xs"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="p-4 border-t border-neutral-200 bg-neutral-50/50 gap-2 sm:gap-3">
              <Button variant="outline" onClick={() => setReminderDialogOpen(false)} className="border-neutral-200 text-neutral-700 hover:bg-neutral-100 font-bold">Cancel</Button>
              <Button
                className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm active:scale-95 transition-all font-bold"
                onClick={confirmReminder}
                disabled={isSendingEmail}
              >
                {isSendingEmail ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                ) : (
                  <><Mail className="h-4 w-4 mr-2" /> Send Email</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        {/* Bulk Reminders Dialog */}
        <Dialog open={bulkDialogOpen} onOpenChange={open => { if (!isSendingBulk) setBulkDialogOpen(open); }}>
          <DialogContent className="bg-white border-neutral-200 text-neutral-900 max-w-md shadow-xl p-0 overflow-hidden">
            <DialogHeader className="p-5 bg-white border-b border-neutral-200">
              <DialogTitle className="text-neutral-900 flex items-center gap-2 font-bold text-lg">
                <Bell className="h-5 w-5 text-gold-500" />
                Bulk Email Reminders
              </DialogTitle>
              <DialogDescription className="text-neutral-500 font-medium mt-1">
                Send a deadline reminder email to multiple faculty at once via SendGrid.
              </DialogDescription>
            </DialogHeader>

            <div className="p-5 space-y-4 bg-white">

              {/* Scope Selector */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Send To</Label>
                <Select value={bulkScope} onValueChange={setBulkScope}>
                  <SelectTrigger className="bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-neutral-200">
                    <SelectItem value="at_risk" className="font-medium text-xs">At Risk faculty only</SelectItem>
                    <SelectItem value="delayed" className="font-medium text-xs">Delayed faculty only</SelectItem>
                    <SelectItem value="not_cleared" className="font-medium text-xs">All faculty not yet cleared</SelectItem>
                    <SelectItem value="all" className="font-medium text-xs">All faculty (entire list)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Recipient Preview */}
              <div className={`flex items-center gap-3 p-3 rounded-xl border ${bulkTargets.length === 0 ? 'bg-neutral-50 border-neutral-200' : 'bg-primary-50/50 border-primary-100'}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${bulkTargets.length === 0 ? 'bg-neutral-200 text-neutral-500' : 'bg-primary-600 text-white shadow-sm'}`}>
                  {bulkTargets.length}
                </div>
                <div>
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Recipients</p>
                  <p className="text-sm font-bold text-neutral-900">
                    {bulkTargets.length === 0
                      ? 'No faculty match this scope'
                      : `${bulkTargets.length} faculty member${bulkTargets.length !== 1 ? 's' : ''} will receive an email`}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Custom Subject <span className="text-neutral-400">(Optional)</span></Label>
                <Input
                  placeholder="[ISAMS] Submission Reminder — Action Required"
                  value={bulkSubject}
                  onChange={e => setBulkSubject(e.target.value)}
                  className="bg-white border-neutral-200 text-neutral-900 font-medium h-9 shadow-sm text-xs focus-visible:ring-primary-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Custom Message <span className="text-neutral-400">(Optional)</span></Label>
                <Textarea
                  placeholder="Leave blank to use the default reminder template..."
                  value={bulkMessage}
                  onChange={e => setBulkMessage(e.target.value)}
                  className="bg-neutral-50 border-neutral-200 text-neutral-900 font-medium resize-none focus-visible:ring-primary-500 text-xs"
                  rows={3}
                />
              </div>

              {/* Result Banner (shown after send) */}
              {bulkResult && (
                <div className={`p-3 rounded-xl border flex items-center gap-3 ${bulkResult.failed === 0 ? 'bg-success/5 border-success/20' : 'bg-warning/5 border-warning/20'}`}>
                  {bulkResult.failed === 0
                    ? <CheckCircle className="h-4 w-4 text-success shrink-0" />
                    : <AlertCircle className="h-4 w-4 text-warning shrink-0" />}
                  <p className="text-xs font-bold text-neutral-700">
                    {bulkResult.succeeded} sent successfully
                    {bulkResult.failed > 0 && ` · ${bulkResult.failed} failed`}
                    {` · ${bulkResult.total} total`}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="p-4 border-t border-neutral-200 bg-neutral-50/50 gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => setBulkDialogOpen(false)}
                disabled={isSendingBulk}
                className="border-neutral-200 text-neutral-700 hover:bg-neutral-100 font-bold"
              >
                {bulkResult ? 'Close' : 'Cancel'}
              </Button>
              {!bulkResult && (
                <Button
                  disabled={isSendingBulk || bulkTargets.length === 0}
                  className="bg-gold-400 hover:bg-gold-500 text-neutral-900 shadow-sm active:scale-95 transition-all font-bold"
                  onClick={confirmBulkSend}
                >
                  {isSendingBulk ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Sending {bulkTargets.length}...</>
                  ) : (
                    <><Bell className="h-4 w-4 mr-2" /> Send to {bulkTargets.length}</>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </ToastProvider>
  );
}