import React, { useState, useMemo, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeBalham } from 'ag-grid-community';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);
import {
  Edit, CalendarCheck, CalendarPlus, Clock, Trash2, Calendar, RefreshCw, AlertCircle,
  RotateCcw, CheckCircle, ArrowRight, X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// Hook
import { useAdminDeadlines } from '../hooks/AdminDeadlineHook';

// Custom theme using AG Grid v33+ Theming API with Balham theme (better dark mode support)
const customTheme = themeBalham.withParams({
  accentColor: '#3b82f6',
  backgroundColor: '#020617',
  foregroundColor: '#e2e8f0',
  borderColor: '#1e293b',
  headerBackgroundColor: '#0f172a',
  headerTextColor: '#94a3b8',
  oddRowBackgroundColor: '#020617',
  rowHeight: 48,
  headerHeight: 40,
});

export default function AdminDeadlinePage() {
  const {
    loading, error, success, deadlines, docTypes, stats, settings,
    refresh, saveDeadline, deleteDeadline, handleBulkAction
  } = useAdminDeadlines();

  // Separate states for Create and Edit to prevent conflicts
  const [newDeadline, setNewDeadline] = useState(initialFormState());
  const [editingDeadline, setEditingDeadline] = useState(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [bulkGraceOpen, setBulkGraceOpen] = useState(false);
  const [bulkGraceDays, setBulkGraceDays] = useState(3);

  function initialFormState() {
    return {
      semester: settings?.semester || '',
      academic_year: settings?.academic_year || '',
      doc_type_id: '',
      deadline_date: new Date().toISOString().split('T')[0],
      grace_period_days: 0
    };
  }

  // Update form defaults when settings load
  useEffect(() => {
    if (settings && !newDeadline.doc_type_id) {
      setNewDeadline(prev => ({
        ...prev,
        semester: settings.semester,
        academic_year: settings.academic_year
      }));
    }
  }, [settings]);


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
    if (!validateAcademicYear(newDeadline.academic_year)) {
      alert("Invalid Academic Year. You cannot set deadlines for past academic years.");
      return;
    }

    const success = await saveDeadline({
      ...newDeadline,
      doc_type_id: parseInt(newDeadline.doc_type_id),
      grace_period_days: parseInt(newDeadline.grace_period_days)
    });

    if (success) {
      setNewDeadline(initialFormState());
    }
  };

  const handleEditSubmit = async () => {
    if (!editingDeadline) return;

    if (!validateAcademicYear(editingDeadline.academic_year)) {
      alert("Invalid Academic Year. You cannot set deadlines for past academic years.");
      return;
    }

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
    } else if (action === 'GRACE') {
      setBulkGraceOpen(true);
    } else if (action === 'RESET') {
      if (window.confirm(`Reset all deadlines for ${newDeadline.semester} ${newDeadline.academic_year} to defaults? This will delete custom dates.`)) {
        handleBulkAction('RESET', {
          semester: newDeadline.semester,
          year: newDeadline.academic_year
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
      cellClass: "font-medium text-slate-200"
    },
    {
      field: "semester",
      headerName: "Semester",
      width: 120,
      cellClass: "text-slate-400"
    },
    {
      field: "deadline_date",
      headerName: "Due Date",
      flex: 1,
      cellRenderer: (p) => (
        <span className="font-mono text-slate-200 text-xs bg-slate-800 px-2 py-1 rounded border border-slate-700">
          {new Date(p.value).toLocaleDateString()}
        </span>
      )
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      cellRenderer: (p) => {
        const styles = {
          'Active': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          'Upcoming': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          'Passed': 'bg-slate-800 text-slate-500 border-slate-700'
        };
        return (
          <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${styles[p.value] || styles['Passed']}`}>
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
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
            onClick={() => openEditDialog(params.data)}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
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
    <div className="space-y-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Deadline Management</h1>
          <p className="text-slate-400 text-sm">Configure submission schedules and grace periods</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={loading}
          className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <StatCard
          title="Active Deadlines"
          value={deadlines.filter(d => d.is_active).length}
          icon={Calendar}
          color="text-blue-400"
          bg="bg-blue-500/10"
          border="border-blue-500/20"
        />
        <StatCard
          title="Completion Rate"
          value={`${completionRate}%`}
          icon={CheckCircle}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
          border="border-emerald-500/20"
        />
        <StatCard
          title="Next Deadline"
          value={stats.next_deadline_type || 'None'}
          sub={stats.days_left ? `${stats.days_left} days left` : ''}
          icon={Clock}
          color="text-amber-400"
          bg="bg-amber-500/10"
          border="border-amber-500/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

        {/* LEFT COLUMN: Table + Form */}
        <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">

          {/* Create New Deadline Form */}
          <Card className="bg-slate-900 border-slate-800 shadow-none shrink-0">
            <CardHeader className="border-b border-slate-800 py-3">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600/20 p-1.5 rounded text-blue-400">
                  <CalendarPlus className="h-4 w-4" />
                </div>
                <CardTitle className="text-base text-slate-100">Set New Deadline</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400 uppercase">Document Type</Label>
                  <Select
                    value={newDeadline.doc_type_id}
                    onValueChange={(v) => setNewDeadline({ ...newDeadline, doc_type_id: v })}
                  >
                    <SelectTrigger className="bg-slate-950/50 border-slate-700 text-slate-200 focus:ring-blue-500/20">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                      {docTypes.map(d => (
                        <SelectItem key={d.id} value={d.id.toString()} className="focus:bg-slate-800">
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400 uppercase">Semester</Label>
                  <Select
                    value={newDeadline.semester}
                    onValueChange={(v) => setNewDeadline({ ...newDeadline, semester: v })}
                  >
                    <SelectTrigger className="bg-slate-950/50 border-slate-700 text-slate-200 focus:ring-blue-500/20">
                      <SelectValue placeholder="Select semester..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                      <SelectItem value="1st Semester">1st Semester</SelectItem>
                      <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                      <SelectItem value="Summer">Summer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400 uppercase">Academic Year</Label>
                  <Input
                    type="text"
                    value={newDeadline.academic_year}
                    onChange={(e) => setNewDeadline({ ...newDeadline, academic_year: e.target.value })}
                    placeholder="e.g. 2023-2024"
                    className="bg-slate-950/50 border-slate-700 text-slate-200 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400 uppercase">Due Date</Label>
                  <Input
                    type="date"
                    value={newDeadline.deadline_date}
                    onChange={(e) => setNewDeadline({ ...newDeadline, deadline_date: e.target.value })}
                    className="bg-slate-950/50 border-slate-700 text-slate-200 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400 uppercase">Grace Period (Days)</Label>
                  <Input
                    type="number"
                    value={newDeadline.grace_period_days}
                    onChange={(e) => setNewDeadline({ ...newDeadline, grace_period_days: e.target.value })}
                    min="0"
                    max="30"
                    className="bg-slate-950/50 border-slate-700 text-slate-200 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleCreateSubmit}
                  disabled={loading || !newDeadline.doc_type_id}
                >
                  Create Deadline
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Deadlines Table */}
          <Card className="bg-slate-900 border-slate-800 shadow-none flex-1 flex flex-col min-h-[300px]">
            <CardHeader className="border-b border-slate-800 py-3 shrink-0">
              <CardTitle className="text-base text-slate-100">Current Schedule</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative">
              <div className="absolute inset-0">
                <AgGridReact
                  theme={customTheme}
                  rowData={deadlines}
                  columnDefs={colDefs}
                  pagination={true}
                  paginationPageSize={10}
                  suppressCellFocus={true}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Sidebar Widgets */}
        <div className="flex flex-col gap-6">

          {/* Upcoming Deadlines Widget */}
          <Card className="bg-slate-900 border-slate-800 shadow-none">
            <CardHeader className="border-b border-slate-800 py-3">
              <CardTitle className="text-base text-slate-100">Upcoming</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-4">
              {upcomingDeadlines.length > 0 ? upcomingDeadlines.map((d, i) => (
                <div key={i} className="flex items-start pb-4 border-b border-slate-800 last:border-0 last:pb-0 last:pt-0 first:pt-0 mb-4 last:mb-0">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-400">
                      <span className="text-xs font-bold">
                        {new Date(d.deadline_date).getDate()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-200 truncate">{d.doc_type_name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-slate-500">
                        {new Date(d.deadline_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                      </p>
                      <Badge variant="outline" className="text-[10px] border-slate-700 text-blue-400">
                        {getDaysLeft(d.deadline_date)}
                      </Badge>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Calendar className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No active deadlines.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bulk Operations Widget */}
          <Card className="bg-slate-900 border-slate-800 shadow-none">
            <CardHeader className="border-b border-slate-800 py-3">
              <CardTitle className="text-base text-slate-100">Bulk Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-4 space-y-3">
              <BulkBtn
                icon={CalendarPlus}
                label="Extend All"
                sub="+7 days to active items"
                color="text-emerald-400"
                bg="hover:bg-slate-800 border-slate-800"
                onClick={() => handleBulkClick('EXTEND')}
              />
              <BulkBtn
                icon={Clock}
                label="Set Grace Period"
                sub="Apply bulk grace days"
                color="text-blue-400"
                bg="hover:bg-slate-800 border-slate-800"
                onClick={() => handleBulkClick('GRACE')}
              />
              <BulkBtn
                icon={RotateCcw}
                label="Reset Semester"
                sub="Restore default schedule"
                color="text-amber-400"
                bg="hover:bg-slate-800 border-slate-800"
                onClick={() => handleBulkClick('RESET')}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Edit Deadline</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update settings for {editingDeadline?.doc_type_name}
            </DialogDescription>
          </DialogHeader>

          {editingDeadline && (
            <div className="space-y-4 py-4">
              {/* Read-only Document Type field for context */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500 uppercase">Document</Label>
                <Input
                  value={editingDeadline.doc_type_name || ''}
                  disabled
                  className="bg-slate-950 border-slate-800 text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400 uppercase">Semester</Label>
                  <Select
                    value={editingDeadline.semester}
                    onValueChange={(v) => setEditingDeadline({ ...editingDeadline, semester: v })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                      <SelectValue placeholder="Select semester..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                      <SelectItem value="1st Semester">1st Semester</SelectItem>
                      <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                      <SelectItem value="Summer">Summer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400 uppercase">Academic Year</Label>
                  <Input
                    type="text"
                    value={editingDeadline.academic_year}
                    onChange={(e) => setEditingDeadline({ ...editingDeadline, academic_year: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400 uppercase">Due Date</Label>
                  <Input
                    type="date"
                    value={editingDeadline.deadline_date}
                    onChange={(e) => setEditingDeadline({ ...editingDeadline, deadline_date: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-400 uppercase">Grace Days</Label>
                  <Input
                    type="number"
                    value={editingDeadline.grace_period_days}
                    onChange={(e) => setEditingDeadline({ ...editingDeadline, grace_period_days: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleEditSubmit}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Grace Period Dialog */}
      <Dialog open={bulkGraceOpen} onOpenChange={setBulkGraceOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Bulk Grace Period</DialogTitle>
            <DialogDescription className="text-slate-400">
              This will update the grace period for all currently active deadlines.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="space-y-2">
              <Label className="text-slate-300">Days</Label>
              <Input
                type="number"
                value={bulkGraceDays}
                onChange={(e) => setBulkGraceDays(e.target.value)}
                min="0"
                max="30"
                className="bg-slate-950/50 border-slate-700 text-slate-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={() => setBulkGraceOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                handleBulkAction('GRACE', parseInt(bulkGraceDays));
                setBulkGraceOpen(false);
              }}
            >
              Apply to All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helpers
const StatCard = ({ title, value, sub, icon: Icon, color, bg, border }) => (
  <Card className={`bg-slate-900 border-slate-800 shadow-none`}>
    <CardContent className="p-5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs uppercase font-bold text-slate-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-100">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${bg} border ${border}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const BulkBtn = ({ icon: Icon, label, sub, color, bg, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full p-3 rounded-lg border transition-all text-left group ${bg}`}
  >
    <div className={`mr-3 p-1.5 rounded bg-slate-950/50 group-hover:bg-slate-950 transition-colors`}>
      <Icon className={`h-4 w-4 ${color}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-slate-200 truncate">{label}</p>
      <p className="text-[10px] text-slate-500 truncate">{sub}</p>
    </div>
    <ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
  </button>
);