import React, { useState, useMemo, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);
import {
  Edit, CalendarCheck, CalendarPlus, Clock, Trash2, Calendar, RefreshCw, AlertCircle,
  RotateCcw, CheckCircle, ArrowRight, X, Search
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";

// Hook
import { useAdminDeadlines } from '../hooks/AdminDeadlineHook';

// Custom theme parameters are now handled by the DataTable institutional wrapper

export default function AdminDeadlinePage() {
  const {
    loading, error, success, deadlines, docTypes, stats, settings,
    refresh, saveDeadline, deleteDeadline, handleBulkAction
  } = useAdminDeadlines();

  // Separate states for Create and Edit to prevent conflicts
  const [newDeadline, setNewDeadline] = useState(initialFormState());
  const [editingDeadline, setEditingDeadline] = useState(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  function initialFormState() {
    return {
      doc_type_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      deadline_date: '',
      grace_period_days: settings?.default_grace || 0
    };
  }

  // Update form defaults when settings load (only once real settings arrive)
  useEffect(() => {
    if (settings?.semester && !newDeadline.doc_type_id) {
      const issueDate = new Date();
      const deadlineDate = new Date();
      deadlineDate.setDate(issueDate.getDate() + (settings.default_deadline || 14));

      setNewDeadline(prev => ({
        ...prev,
        deadline_date: deadlineDate.toISOString().split('T')[0],
        grace_period_days: settings.default_grace || 0
      }));
    }
  }, [settings?.semester]); // Use semester as a signal that settings are loaded

  // Handle auto-calculation when Issue Date changes
  const handleIssueDateChange = (date) => {
    const issue = new Date(date);
    const deadline = new Date(issue);
    deadline.setDate(issue.getDate() + (settings.default_deadline || 14));

    setNewDeadline(prev => ({
      ...prev,
      issue_date: date,
      deadline_date: deadline.toISOString().split('T')[0]
    }));
  };


  // --- Calculations ---
  const completionRate = stats.total_submissions > 0
    ? Math.round((stats.on_time / stats.total_submissions) * 100)
    : 0;

  const upcomingDeadlines = useMemo(() => {
    return deadlines
      .filter(d => new Date(d.deadline_date) >= new Date())
      .sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date))
      .slice(0, 3);
  }, [deadlines]);

  const getDaysLeft = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} days left` : 'Due today';
  };

  // --- Handlers ---
  const validateAcademicYear = (ay) => {
    if (!ay || !ay.includes('-')) return false;
    const startYear = parseInt(ay.split('-')[0]);
    if (isNaN(startYear)) return false;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    // AY starts in June (Month 5)
    // If Month >= 5 (June), Current AY Start is currentYear (e.g., June 2025 -> 2025-2026)
    // If Month < 5 (Jan-May), Current AY Start is currentYear - 1 (e.g., Feb 2026 -> 2025-2026)
    const currentAyStart = currentMonth >= 5 ? currentYear : currentYear - 1;

    // Allow Current AY and Future AYs
    // Strictly greater than or equal to current AY start
    return startYear >= currentAyStart;
  };

  const handleCreateSubmit = async () => {
    const success = await saveDeadline({
      ...newDeadline,
      semester: settings.semester,
      academic_year: settings.academic_year,
      doc_type_id: parseInt(newDeadline.doc_type_id),
      grace_period_days: parseInt(newDeadline.grace_period_days)
    });

    if (success) {
      // Manual reset after success to ensure dates are re-calculated
      const today = new Date();
      const next = new Date();
      next.setDate(today.getDate() + (settings.default_deadline || 14));

      setNewDeadline({
        ...initialFormState(),
        issue_date: today.toISOString().split('T')[0],
        deadline_date: next.toISOString().split('T')[0],
        grace_period_days: settings.default_grace || 0
      });
    }
  };

  const handleEditSubmit = async () => {
    if (!editingDeadline) return;

    const success = await saveDeadline({
      ...editingDeadline,
      doc_type_id: parseInt(editingDeadline.doc_type_id),
      grace_period_days: parseInt(editingDeadline.grace_period_days)
    });

    if (success) {
      setIsEditDialogOpen(false);
      setEditingDeadline(null);
    }
  };

  const openEditDialog = (data) => {
    setEditingDeadline({
      deadline_id: data.deadline_id,
      doc_type_id: data.doc_type_id.toString(), // Ensure string for Select
      doc_type_name: data.doc_type_name, // For display
      semester: data.semester,
      academic_year: data.academic_year,
      deadline_date: data.deadline_date,
      grace_period_days: data.grace_period_days
    });
    setIsEditDialogOpen(true);
  };

  const handleBulkClick = (action) => {
    if (action === 'EXTEND') {
      if (window.confirm("Are you sure? This will extend ALL active deadlines by 7 days.")) {
        handleBulkAction('EXTEND', 7);
      }
    } else if (action === 'RESET') {
      if (window.confirm(`Reset all deadlines for ${settings.semester} ${settings.academic_year} to defaults? This will delete custom dates.`)) {
        handleBulkAction('RESET', {
          semester: settings.semester,
          year: settings.academic_year
        });
      }
    }
  };

  // Grid Config
  const colDefs = useMemo(() => [
    {
      field: "doc_type_name",
      headerName: "Document Type",
      flex: 1.5,
      cellClass: "font-semibold text-neutral-900"
    },
    {
      field: "semester",
      headerName: "Semester",
      width: 120,
      cellClass: "text-neutral-500 font-medium"
    },
    {
      field: "deadline_date",
      headerName: "Due Date",
      flex: 1,
      cellRenderer: (p) => (
        <span className="font-bold text-neutral-900 text-[10px] bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 uppercase tracking-tight">
          {new Date(p.value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      )
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      cellRenderer: (p) => {
        const styles = {
          'Active': 'bg-primary-600/10 text-primary-600 border-primary-600/20',
          'Upcoming': 'bg-info/10 text-info border-info/20',
          'Passed': 'bg-neutral-100 text-neutral-500 border-neutral-200'
        };
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold tracking-wider border ${styles[p.value] || styles['Passed']}`}>
            {p.value}
          </span>
        )
      }
    },
    {
      headerName: "Actions",
      field: "deadline_id",
      width: 100,
      cellRenderer: (params) => (
        <div className="flex gap-1 items-center h-full">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-neutral-400 hover:text-primary-600 hover:bg-primary-600/10"
            onClick={() => openEditDialog(params.data)}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-neutral-400 hover:text-destructive-semantic hover:bg-destructive/10"
            onClick={() => {
              if (window.confirm("Delete this deadline permanently?")) deleteDeadline(params.value);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    }
  ], []);

  return (
    <div className="space-y-6 flex flex-col h-full bg-neutral-50">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Deadline Management</h1>
          <p className="text-neutral-500 text-sm font-medium">Configure submission schedules and grace periods</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={loading}
          className="bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:text-primary-600 shadow-sm transition-all font-semibold"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <StatCard
          title="Active Deadlines"
          value={deadlines.filter(d => d.is_active).length}
          icon={Calendar}
          color="text-primary-500"
        />
        <StatCard
          title="Completion Rate"
          value={`${completionRate}%`}
          icon={CheckCircle}
          color="text-success"
        />
        <StatCard
          title="Next Deadline"
          value={stats.next_deadline_type || 'NONE'}
          sub={stats.days_left ? `${stats.days_left} DAYS LEFT` : ''}
          icon={Clock}
          color="text-warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

        {/* LEFT COLUMN: Table + Form */}
        <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">

          {/* Create New Deadline Form */}
          <Card className="bg-white border-neutral-200 shadow-sm shrink-0 overflow-hidden">
            <CardHeader className="border-b border-neutral-100 py-3 bg-neutral-50">
              <div className="flex items-center gap-2">
                <div className="bg-primary-500/10 p-1.5 rounded text-primary-500">
                  <CalendarPlus className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm text-neutral-900 font-bold uppercase tracking-widest">Set New Deadline</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 bg-white">
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="w-full sm:w-[180px] space-y-1.5">
                  <Label className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-widest">Document Type</Label>
                  <Select
                    value={newDeadline.doc_type_id}
                    onValueChange={(v) => setNewDeadline(prev => ({ ...prev, doc_type_id: v }))}
                  >
                    <SelectTrigger className="bg-white border-neutral-200 text-neutral-900 focus:ring-primary-500/20 focus:border-primary-500 focus:ring-offset-0 font-semibold shadow-sm h-9 transition-all">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-neutral-200 text-neutral-900">
                      {docTypes.map(d => (
                        <SelectItem key={d.id} value={d.id.toString()} className="focus:bg-neutral-100 font-medium">
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full sm:w-[180px] space-y-1.5">
                  <Label className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-widest text-primary-600">Issue Date</Label>
                  <Input
                    type="date"
                    value={newDeadline.issue_date}
                    onChange={(e) => handleIssueDateChange(e.target.value)}
                    className="bg-white border-neutral-200 text-neutral-900 focus:ring-primary-500/20 focus:border-primary-500 focus:ring-offset-0 font-semibold h-9 transition-all border-primary-500/30"
                  />
                </div>

                <div className="w-full sm:w-[180px] space-y-1.5">
                  <Label className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-widest">Deadline</Label>
                  <Input
                    type="date"
                    value={newDeadline.deadline_date}
                    onChange={(e) => setNewDeadline(prev => ({ ...prev, deadline_date: e.target.value }))}
                    className="bg-white border-neutral-200 text-neutral-900 focus:ring-primary-500/20 focus:border-primary-500 focus:ring-offset-0 font-semibold h-9 transition-all"
                  />
                </div>

                <div className="w-full sm:w-[120px] space-y-1.5">
                  <Label className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-widest">Grace Period</Label>
                  <Input
                    type="number"
                    value={newDeadline.grace_period_days}
                    onChange={(e) => setNewDeadline(prev => ({ ...prev, grace_period_days: e.target.value }))}
                    min="0"
                    max="30"
                    className="bg-white border-neutral-200 text-neutral-900 focus:ring-primary-500/20 focus:border-primary-500 focus:ring-offset-0 font-semibold h-9 transition-all"
                  />
                </div>

                <div className="flex-none pt-4">
                  <Button
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-md shadow-primary-900/10 px-6 h-9"
                    onClick={handleCreateSubmit}
                    disabled={loading || !newDeadline.doc_type_id}
                  >
                    Create Deadline
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Deadlines Table */}
          <Card className="bg-white border-neutral-200 shadow-sm flex-1 flex flex-col min-h-[300px] overflow-hidden">
            <CardHeader className="border-b border-neutral-100 py-3 shrink-0 bg-neutral-50">
              <CardTitle className="text-sm text-neutral-900 font-bold uppercase tracking-widest">Current Schedule</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative bg-white min-h-[400px]">
              <DataTable
                rowData={deadlines}
                columnDefs={colDefs}
                className="border-0 shadow-none h-full"
              />
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Sidebar Widgets */}
        <div className="flex flex-col gap-6">

          {/* Bulk Operations Widget */}
          <Card className="bg-white border-neutral-200 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-neutral-100 py-3 bg-neutral-50">
              <CardTitle className="text-sm text-neutral-900 font-bold uppercase tracking-widest">Bulk Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-4 space-y-3 bg-white">
              <BulkBtn
                icon={CalendarPlus}
                label="Extend All"
                sub="+7 DAYS TO ACTIVE ITEMS"
                color="text-primary-500"
                onClick={() => handleBulkClick('EXTEND')}
              />
              <BulkBtn
                icon={RotateCcw}
                label="Reset Semester"
                sub="RESTORE DEFAULT SCHEDULE"
                color="text-warning"
                onClick={() => handleBulkClick('RESET')}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white border-neutral-200 text-neutral-900 sm:max-w-[425px] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 bg-neutral-50/50 border-b border-neutral-100">
            <DialogTitle className="text-xl font-bold text-neutral-900 tracking-tight">Edit Deadline</DialogTitle>
            <DialogDescription className="text-neutral-500 font-medium">
              Update settings for <span className="text-primary-600 font-bold">{editingDeadline?.doc_type_name}</span>
            </DialogDescription>
          </DialogHeader>

          {editingDeadline && (
            <div className="space-y-4 p-6 bg-white">
              {/* Read-only Document Type field for context */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest">Document</Label>
                <Input
                  value={editingDeadline.doc_type_name || ''}
                  disabled
                  className="bg-neutral-50 border-neutral-200 text-neutral-500 font-semibold cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-widest">Semester</Label>
                  <Select
                    value={editingDeadline.semester}
                    onValueChange={(v) => setEditingDeadline({ ...editingDeadline, semester: v })}
                  >
                    <SelectTrigger className="bg-white border-neutral-200 text-neutral-900 focus:ring-primary-500/20 focus:ring-offset-0 font-semibold h-9 shadow-sm">
                      <SelectValue placeholder="Select semester..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-neutral-200 text-neutral-900">
                      <SelectItem value="1st Semester" className="font-medium">1st Semester</SelectItem>
                      <SelectItem value="2nd Semester" className="font-medium">2nd Semester</SelectItem>
                      <SelectItem value="Summer" className="font-medium">Summer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-widest">Academic Year</Label>
                  <Input
                    type="text"
                    value={editingDeadline.academic_year}
                    onChange={(e) => setEditingDeadline({ ...editingDeadline, academic_year: e.target.value })}
                    className="bg-white border-neutral-200 text-neutral-900 focus:ring-primary-500/20 focus:ring-offset-0 font-semibold h-9 shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-widest">Due Date</Label>
                  <Input
                    type="date"
                    value={editingDeadline.deadline_date}
                    onChange={(e) => setEditingDeadline({ ...editingDeadline, deadline_date: e.target.value })}
                    className="bg-white border-neutral-200 text-neutral-900 focus:ring-primary-500/20 focus:ring-offset-0 font-semibold h-9 shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-widest">Grace Days</Label>
                  <Input
                    type="number"
                    value={editingDeadline.grace_period_days}
                    onChange={(e) => setEditingDeadline({ ...editingDeadline, grace_period_days: e.target.value })}
                    className="bg-white border-neutral-200 text-neutral-900 focus:ring-primary-500/20 focus:ring-offset-0 font-semibold h-9 shadow-sm"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 p-6 bg-neutral-50/50 border-t border-neutral-100">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 font-bold"
            >
              Cancel
            </Button>
            <Button
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-md shadow-primary-900/10"
              onClick={handleEditSubmit}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// Helpers
const StatCard = ({ title, value, sub, icon: Icon, color }) => (
  <Card className={`bg-white border-neutral-200 shadow-sm transition-all hover:shadow-md overflow-hidden`}>
    <CardContent className="p-5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-widest mb-1">{title}</p>
          <p className="text-2xl font-bold text-neutral-900 tracking-tight">{value}</p>
          {sub && <p className="text-[9px] text-neutral-400 mt-2 font-extrabold uppercase tracking-wider">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-lg bg-neutral-50 border border-neutral-100`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const BulkBtn = ({ icon: Icon, label, sub, color, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full p-3 rounded-lg border transition-all text-left bg-neutral-50/50 hover:border-primary-200 hover:shadow-sm group`}
  >
    <div className={`mr-3 p-1.5 rounded bg-white border border-neutral-200 group-hover:border-primary-100 transition-all shadow-xs`}>
      <Icon className={`h-4 w-4 ${color}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-neutral-900 truncate tracking-tight">{label}</p>
      <p className="text-[9px] font-extrabold text-neutral-400 truncate uppercase tracking-widest">{sub}</p>
    </div>
    <ArrowRight className="h-3 w-3 text-neutral-300 group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all" />
  </button>
);