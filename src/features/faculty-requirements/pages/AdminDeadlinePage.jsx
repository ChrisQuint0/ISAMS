import React, { useState, useMemo, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);
import {
  Edit, CalendarCheck, CalendarPlus, Clock, Trash2, Calendar, RefreshCw, AlertCircle,
  RotateCcw, CheckCircle, ArrowRight, X, Search, Settings, Plus, Save, ShieldCheck, Activity
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
import { ToastProvider, useToast } from "@/components/ui/toast/toaster";

// Toast Handler
const AdminToastHandler = ({ success, error }) => {
  const { addToast } = useToast();

  useEffect(() => {
    if (success) {
      addToast({ title: "Success", description: String(success), variant: "success" });
    }
  }, [success, addToast]);

  useEffect(() => {
    if (error) {
      addToast({ title: "Error", description: String(error), variant: "destructive" });
    }
  }, [error, addToast]);

  return null;
};

import { useAdminDeadlines } from '../hooks/AdminDeadlineHook';

const ActionsRenderer = (props) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const { data, openEditDialog, deleteDeadline } = props;

  if (isConfirming) {
    return (
      <div className="flex gap-1 items-center h-full">
        <Button
          size="xs"
          className="bg-destructive hover:bg-destructive/90 text-white text-[10px] h-6 px-2.5 font-bold shadow-sm rounded-md"
          onClick={() => {
            deleteDeadline(data.deadline_id);
            setIsConfirming(false);
          }}
        >
          Confirm
        </Button>
        <Button
          size="xs"
          variant="ghost"
          className="text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 text-[10px] h-6 px-2.5 font-bold rounded-md"
          onClick={() => setIsConfirming(false)}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-1 items-center h-full">
      <Button
        size="icon"
        variant="ghost"
        title="Edit Deadline"
        className={`h-7 w-7 rounded-md text-neutral-400 hover:text-primary-600 hover:bg-primary-600/10 ${data.status === 'Passed' ? 'invisible pointer-events-none' : ''}`}
        onClick={() => data.status !== 'Passed' && openEditDialog(data)}
      >
        <Edit className="h-3.5 w-3.5 pointer-events-none" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        title="Delete Deadline"
        className="h-7 w-7 rounded-md text-neutral-400 hover:text-destructive-semantic hover:bg-destructive/10"
        onClick={() => setIsConfirming(true)}
      >
        <Trash2 className="h-3.5 w-3.5 pointer-events-none" />
      </Button>
    </div>
  );
};

export default function AdminDeadlinePage() {
  const {
    loading, error, success, deadlines, docTypes, stats, settings,
    refresh, saveDeadline, deleteDeadline, handleBulkAction, setError
  } = useAdminDeadlines();

  const [newDeadline, setNewDeadline] = useState(initialFormState());
  const [editingDeadline, setEditingDeadline] = useState(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm' });

  function initialFormState() {
    return {
      doc_type_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      deadline_date: '',
      grace_period_days: settings?.default_grace || 0
    };
  }

  useEffect(() => {
    if (settings?.semester && !newDeadline.doc_type_id) {
      const issueDate = new Date();
      const deadlineDate = new Date();
      deadlineDate.setDate(issueDate.getDate() + (settings.default_deadline || 14));

      setNewDeadline(prev => ({
        ...prev,
        issue_date: issueDate.toISOString().split('T')[0],
        deadline_date: deadlineDate.toISOString().split('T')[0],
        grace_period_days: settings.default_grace || 0
      }));
    }
  }, [settings?.semester]);

  // Handle auto-calculation when Issue Date changes
  const handleIssueDateChange = (date) => {
    setNewDeadline(prev => {
      const updates = { ...prev, issue_date: date };

      if (!date) return updates;

      const issue = new Date(date);
      if (isNaN(issue.getTime())) return updates;

      const deadline = new Date(issue);
      deadline.setDate(issue.getDate() + (settings.default_deadline || 14));
      updates.deadline_date = deadline.toISOString().split('T')[0];

      return updates;
    });
  };

  const completionRate = stats.expected_submissions > 0
    ? Math.round((stats.total_submissions / stats.expected_submissions) * 100)
    : 0;

  const nextUpcoming = useMemo(() => {
    return deadlines
      .filter(d => d.status === 'Upcoming')
      .sort((a, b) => new Date(a.issue_date) - new Date(b.issue_date));
  }, [deadlines]);

  const nextActive = useMemo(() => {
    return deadlines
      .filter(d => d.status === 'Active' || d.status === 'Grace Period')
      .sort((a, b) => {
        const dateDiff = new Date(a.deadline_date) - new Date(b.deadline_date);
        if (dateDiff !== 0) return dateDiff;
        return a.type_name.localeCompare(b.type_name);
      });
  }, [deadlines]);

  const sortedDeadlines = useMemo(() => {
    const priority = {
      'Active': 0,
      'Grace Period': 1,
      'Upcoming': 2,
      'Passed': 3
    };

    return [...deadlines].sort((a, b) => {
      const pA = priority[a.status] ?? 4;
      const pB = priority[b.status] ?? 4;

      if (pA !== pB) return pA - pB;

      const dateDiff = new Date(a.deadline_date) - new Date(b.deadline_date);
      if (dateDiff !== 0) return dateDiff;

      return a.type_name.localeCompare(b.type_name);
    });
  }, [deadlines]);

  const deadlineDuplicate = useMemo(() => {
    if (!newDeadline.doc_type_id) return false;
    return deadlines.some(d =>
      d.doc_type_id === parseInt(newDeadline.doc_type_id) &&
      d.semester === settings.semester &&
      d.academic_year === settings.academic_year &&
      d.status !== 'Passed'
    );
  }, [newDeadline.doc_type_id, deadlines, settings]);

  const todayStr = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  const issueDateInPast = useMemo(() => {
    return newDeadline.issue_date && newDeadline.issue_date < todayStr;
  }, [newDeadline.issue_date, todayStr]);

  const deadlineInPast = useMemo(() => {
    return newDeadline.deadline_date && newDeadline.deadline_date < todayStr;
  }, [newDeadline.deadline_date, todayStr]);

  const deadlineInvalidRange = useMemo(() => {
    return newDeadline.issue_date && newDeadline.deadline_date && newDeadline.issue_date > newDeadline.deadline_date;
  }, [newDeadline.issue_date, newDeadline.deadline_date]);

  const canCreateDeadline = newDeadline.doc_type_id && !deadlineDuplicate && !deadlineInvalidRange && !deadlineInPast && !issueDateInPast;

  const getDaysLeft = (dateStr, graceDays = 0) => {
    if (!dateStr) return '';
    const [y, m, d_val] = dateStr.split('-').map(Number);
    const deadlineDate = new Date(y, m - 1, d_val);

    // Testing time!
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diff = deadlineDate.getTime() - today.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    if (days > 0) return `${days} Day${days === 1 ? '' : 's'} left`;

    // Handle Grace Period
    if (graceDays > 0) {
      const cutoffDate = new Date(deadlineDate);
      cutoffDate.setDate(cutoffDate.getDate() + graceDays);
      const cutoffDiff = cutoffDate.getTime() - today.getTime();
      const cutoffDays = Math.floor(cutoffDiff / (1000 * 60 * 60 * 24));

      if (cutoffDays === 0) return 'Grace: Ends today';
      if (cutoffDays > 0) return `Grace: ${cutoffDays} Day${cutoffDays === 1 ? '' : 's'} left`;
    }

    return 'Passed';
  };

  const getDaysUntil = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d_val] = dateStr.split('-').map(Number);
    const startDate = new Date(y, m - 1, d_val);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diff = startDate.getTime() - today.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days <= 0) return 'Starts today';

    return `Upcoming in ${days} Day${days === 1 ? '' : 's'}`;
  };

  const handleCreateSubmit = async () => {
    if (!canCreateDeadline) return;

    const success = await saveDeadline({
      ...newDeadline,
      semester: settings.semester,
      academic_year: settings.academic_year,
      doc_type_id: parseInt(newDeadline.doc_type_id),
      grace_period_days: parseInt(newDeadline.grace_period_days)
    });

    if (success) {
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

  const originalEditingDeadline = useMemo(() => {
    return editingDeadline ? deadlines.find(d => d.deadline_id === editingDeadline.deadline_id) : null;
  }, [editingDeadline, deadlines]);

  const handleEditSubmit = async () => {
    if (!editingDeadline) return;

    if (editingDeadline.issue_date < todayStr && editingDeadline.issue_date !== originalEditingDeadline?.issue_date) {
      toast({
        title: "Invalid Issue Date",
        description: "Cannot change issue date to a past date.",
        variant: "destructive"
      });
      return;
    }

    if (editingDeadline.deadline_date < todayStr && editingDeadline.deadline_date !== originalEditingDeadline?.deadline_date) {
      toast({
        title: "Invalid Deadline Date",
        description: "Cannot change deadline date to a past date.",
        variant: "destructive"
      });
      return;
    }

    if (editingDeadline.issue_date > editingDeadline.deadline_date) {
      toast({
        title: "Invalid Date Range",
        description: "Issue date must be before or equal to the deadline date.",
        variant: "destructive"
      });
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
      doc_type_id: data.doc_type_id.toString(),
      type_name: data.type_name,
      semester: data.semester,
      academic_year: data.academic_year,
      issue_date: data.issue_date,
      deadline_date: data.deadline_date,
      grace_period_days: data.grace_period_days
    });
    setIsEditDialogOpen(true);
  };

  const handleBulkClick = (action) => {
    if (action === 'EXTEND') {
      setConfirmDialog({
        isOpen: true,
        title: "Extend All Deadlines",
        message: "Are you sure? This will extend ALL non-passed deadlines by 7 days.",
        confirmText: "Extend Deadlines",
        onConfirm: () => {
          handleBulkAction('EXTEND', 7);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else if (action === 'GRACE') {
      setConfirmDialog({
        isOpen: true,
        title: "Apply Bulk Grace Periods",
        message: `Add ${settings.default_grace || 3} extra grace days to ALL non-passed deadlines? This will move the Hard Cutoff dates.`,
        confirmText: "Add Grace",
        onConfirm: () => {
          handleBulkAction('GRACE', settings.default_grace || 3);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      });
    }
  };

  // Grid Config
  const colDefs = useMemo(() => [
    {
      field: "type_name",
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
      field: "issue_date",
      headerName: "Issue Date",
      flex: 1,
      cellRenderer: (p) => {
        const isActive = p.data.status === 'Active' || p.data.status === 'Grace Period';
        return (
          <span className={`font-bold text-xs px-2 py-0.5 rounded-full border ${isActive ? 'bg-success/10 text-success border-success/20' : 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>
            {new Date(p.value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        );
      }
    },
    {
      field: "deadline_date",
      headerName: "Due Date",
      flex: 1,
      cellRenderer: (p) => (
        <span className="font-bold text-xs px-2 py-0.5 rounded-full border border-warning/20 text-warning bg-warning/5">
          {new Date(p.value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      )
    },
    {
      headerName: "Hard Cutoff",
      flex: 1,
      field: "hard_cutoff_obj",
      cellRenderer: (p) => (
        <span className="font-bold text-xs px-2 py-0.5 rounded-full border border-destructive-semantic/20 text-destructive-semantic bg-destructive-semantic/5">
          {p.value ? p.value.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
        </span>
      )
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      cellRenderer: (p) => {
        const styles = {
          'Active': 'bg-success/10 text-success border-success/20',
          'Upcoming': 'bg-info/10 text-info border-info/20',
          'Grace Period': 'bg-warning/10 text-warning border-warning/20',
          'Passed': 'bg-neutral-100 text-neutral-500 border-neutral-200'
        };
        return (
          <span className={`font-bold text-xs px-2 py-0.5 rounded-full border ${styles[p.value] || styles['Passed']}`}>
            {p.value}
          </span>
        )
      }
    },
    {
      headerName: "Actions",
      field: "deadline_id",
      width: 140,
      cellRenderer: ActionsRenderer,
      cellRendererParams: {
        openEditDialog,
        deleteDeadline
      }
    }
  ], []);

  return (
    <ToastProvider>
      <AdminToastHandler success={success} error={error} />
      <div className="space-y-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Deadline Management</h1>
            <p className="text-neutral-500 text-sm font-medium">Configure submission schedules and grace periods</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="bg-primary-500 border-primary-500 text-neutral-50 hover:bg-primary-600 hover:text-neutral-50 shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Deadline
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
          <StatCard
            title="Active Deadlines"
            value={deadlines.filter(d => d.is_active).length}
            icon={Calendar}
            color="text-success"
          />
          <StatCard
            title="Completion Rate"
            value={`${completionRate}%`}
            icon={CheckCircle}
            color="text-success"
          />
          <StatCard
            title="Next Deadline"
            value={stats.next_deadline?.type_name || 'NONE'}
            sub={stats.next_deadline ? getDaysLeft(stats.next_deadline.deadline_date, stats.next_deadline.grace_period_days) : ''}
            icon={Clock}
            color="text-warning"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

          {/* LEFT COLUMN: Table + Form */}
          <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">

            {/* Create New Deadline Form */}
            <Card className="bg-white border-neutral-200 shadow-sm shrink-0 overflow-hidden">
              <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-4">
                <CardTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <CalendarPlus className="h-4 w-4 text-primary-600" />
                  Set New Deadline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 bg-white space-y-4">
                {/* Unified Form Container */}
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-end shadow-sm">

                  <div className="space-y-1.5 flex-[0]">
                    <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Doc Type</Label>
                    <Select
                      value={newDeadline.doc_type_id}
                      onValueChange={(v) => setNewDeadline(prev => ({ ...prev, doc_type_id: v }))}
                    >
                      <SelectTrigger className={`bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs focus:ring-primary-500/20 ${deadlineDuplicate ? 'border-destructive focus:ring-destructive/20' : ''}`}>
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-neutral-200 text-neutral-900">
                        {docTypes.map(d => (
                          <SelectItem key={d.id} value={d.id.toString()} className="font-medium text-xs">
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 space-y-1.5 w-full min-w-[130px]">
                    <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Issue Date</Label>
                    <Input
                      type="date"
                      value={newDeadline.issue_date}
                      min={todayStr}
                      onChange={(e) => handleIssueDateChange(e.target.value)}
                      className={`bg-white border-neutral-200 text-neutral-900 focus-visible:ring-primary-500 h-9 text-xs font-medium px-3 shadow-sm ${issueDateInPast || deadlineInvalidRange ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
                    />
                  </div>

                  <div className="flex-1 space-y-1.5 w-full min-w-[130px]">
                    <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Deadline</Label>
                    <Input
                      type="date"
                      value={newDeadline.deadline_date}
                      min={newDeadline.issue_date || todayStr}
                      onChange={(e) => setNewDeadline(prev => ({ ...prev, deadline_date: e.target.value }))}
                      className={`bg-white border-neutral-200 text-neutral-900 focus-visible:ring-primary-500 h-9 text-xs font-medium px-3 shadow-sm ${deadlineInvalidRange || deadlineInPast ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
                    />
                  </div>

                  <div className="w-24 space-y-1.5 shrink-0 w-full md:w-auto">
                    <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Grace (Days)</Label>
                    <Input
                      type="number"
                      value={newDeadline.grace_period_days}
                      onChange={(e) => setNewDeadline(prev => ({ ...prev, grace_period_days: e.target.value }))}
                      min="0"
                      max="30"
                      className="bg-white border-neutral-200 text-neutral-900 focus-visible:ring-primary-500 h-9 text-xs font-medium px-3 shadow-sm"
                    />
                  </div>

                  <Button
                    className="h-9 w-full md:w-auto shrink-0 shadow-sm active:scale-95 transition-all text-xs font-bold px-4 bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50"
                    onClick={handleCreateSubmit}
                    disabled={loading || !canCreateDeadline}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Create
                  </Button>
                </div>

                {/* Inline Validation Warnings */}
                {(deadlineDuplicate || deadlineInvalidRange || deadlineInPast || issueDateInPast) && (
                  <div className="space-y-1.5 pt-1 px-1">
                    {deadlineDuplicate && (
                      <p className="text-xs text-destructive font-medium italic flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" /> An active or upcoming deadline for this document type already exists.
                      </p>
                    )}
                    {deadlineInvalidRange && (
                      <p className="text-xs text-destructive font-medium italic flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" /> Deadline date must be after the issue date.
                      </p>
                    )}
                    {deadlineInPast && (
                      <p className="text-xs text-destructive font-medium italic flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" /> Deadline date cannot be in the past.
                      </p>
                    )}
                    {issueDateInPast && (
                      <p className="text-xs text-destructive font-medium italic flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" /> Issue date cannot be in the past.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Deadlines Table */}
            <Card className="bg-white border-neutral-200 shadow-sm flex-1 flex flex-col min-h-[300px] overflow-hidden">
              <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-4 shrink-0">
                <CardTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary-600" />
                  Current Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 relative bg-white min-h-[400px]">
                <DataTable
                  rowData={sortedDeadlines}
                  columnDefs={colDefs}
                  className="border-0 shadow-none h-full"
                />
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Sidebar Widgets */}
          <div className="flex flex-col gap-6">

            {/* Active Deadlines Widget */}
            <Card className="bg-white border-neutral-200 shadow-sm overflow-hidden">
              <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-success" /> Currently Active
                </CardTitle>
                <Badge variant="outline" className="bg-white text-[10px] font-bold text-success border-success/20 bg-success/5">
                  {nextActive.length} {nextActive.length === 1 ? 'ACTIVE ITEM' : 'ACTIVE ITEMS'}
                </Badge>
              </CardHeader>
              <CardContent className="pt-4 px-4 space-y-3 bg-white">
                {nextActive.length === 0 ? (
                  <div className="p-4 text-center text-sm font-medium text-neutral-500 flex flex-col items-center justify-center min-h-[100px]">
                    <CheckCircle className="h-6 w-6 text-neutral-300 mb-2" />
                    No active deadlines
                  </div>
                ) : (
                  nextActive.slice(0, 6).map((d, idx) => {
                    const daysLeft = getDaysLeft(d.deadline_date, d.grace_period_days);
                    const isUrgent = daysLeft.includes('today') || daysLeft.includes('tomorrow') || (parseInt(daysLeft) <= 3 && !daysLeft.includes('Grace'));
                    const isGrace = d.status === 'Grace Period';
                    const urgentColor = (isUrgent || isGrace) ? 'text-destructive-semantic' : 'text-success';

                    return (
                      <div
                        key={idx}
                        className={`flex items-center w-full p-3 rounded-lg border transition-all text-left bg-neutral-50/50 hover:border-${(isUrgent || isGrace) ? 'destructive' : 'success'}/30 hover:shadow-sm group`}
                      >
                        <div className={`mr-3 p-1.5 rounded bg-white border border-neutral-200 group-hover:border-${(isUrgent || isGrace) ? 'destructive' : 'success'}/30 transition-all shadow-xs`}>
                          <Clock className={`h-4 w-4 ${urgentColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-neutral-900 truncate tracking-tight">{d.type_name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-[9px] font-extrabold text-neutral-400 truncate uppercase tracking-widest">
                              DUE {new Date(d.deadline_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </p>
                            {d.grace_period_days > 0 && (
                              <>
                                <span className="text-neutral-300 text-[8px]">•</span>
                                <span className={`text-[8px] font-extrabold uppercase tracking-widest ${isGrace ? 'text-warning' : 'text-neutral-400'}`}>
                                  +{d.grace_period_days} GRACE
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary" className={`ml-2 text-[9px] font-extrabold tracking-wider uppercase shrink-0 ${(isUrgent || isGrace) ? 'bg-destructive/10 text-destructive-semantic border-destructive/20' : 'bg-success/5 text-success border-success/20'}`}>
                          {daysLeft}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Upcoming Schedule Widget */}
            <Card className="bg-white border-neutral-200 shadow-sm overflow-hidden">
              <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-info" /> Upcoming Schedule
                </CardTitle>
                <Badge variant="outline" className="bg-white text-[10px] font-bold text-info border-info/20 bg-info/5">
                  {nextUpcoming.length} {nextUpcoming.length === 1 ? 'UPCOMING ITEM' : 'UPCOMING ITEMS'}
                </Badge>
              </CardHeader>
              <CardContent className="pt-4 px-4 space-y-3 bg-white">
                {nextUpcoming.length === 0 ? (
                  <div className="p-4 text-center text-sm font-medium text-neutral-500 flex flex-col items-center justify-center min-h-[100px]">
                    <Clock className="h-6 w-6 text-neutral-300 mb-2" />
                    No upcoming items
                  </div>
                ) : (
                  nextUpcoming.slice(0, 6).map((d, idx) => {
                    const daysUntil = getDaysUntil(d.issue_date);
                    return (
                      <div
                        key={idx}
                        className="flex items-center w-full p-3 rounded-lg border border-neutral-100 transition-all text-left bg-neutral-50/50 hover:border-info/30 hover:shadow-sm group"
                      >
                        <div className="mr-3 p-1.5 rounded bg-white border border-neutral-200 group-hover:border-info/30 transition-all shadow-xs">
                          <Calendar className="h-4 w-4 text-info" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-neutral-900 truncate tracking-tight">{d.type_name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-[9px] font-extrabold text-neutral-400 truncate uppercase tracking-widest">
                              STARTS {new Date(d.issue_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="ml-2 text-[9px] font-extrabold tracking-wider uppercase shrink-0 bg-info/5 text-info border-info/20">
                          {daysUntil}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Bulk Operations Widget */}
            <Card className="bg-white border-neutral-200 shadow-sm overflow-hidden">
              <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-4">
                <CardTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary-600" /> Bulk Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 px-4 space-y-3 bg-white">
                <BulkBtn
                  icon={CalendarPlus}
                  label="Extend All"
                  sub="+7 DAYS TO ALL SCHEDULED ITEMS"
                  color="text-primary-500"
                  onClick={() => handleBulkClick('EXTEND')}
                />
                <BulkBtn
                  icon={ShieldCheck}
                  label="Add Grace"
                  sub={`+${settings.default_grace || 3} DAYS TO ALL SCHEDULED ITEMS`}
                  color="text-warning"
                  onClick={() => handleBulkClick('GRACE')}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-white border-neutral-200 text-neutral-900 max-w-md shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-neutral-900 flex items-center gap-2 font-bold">
                <Edit className="h-5 w-5 text-primary-600" />
                Edit Deadline
              </DialogTitle>
              <DialogDescription className="text-neutral-500 font-medium mt-1">
                Update scheduling configurations for this requirement.
              </DialogDescription>
            </DialogHeader>

            {editingDeadline && (
              <div className="space-y-5 py-2">

                {/* Auto-filled Info Block (Tightened Padding) */}
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 shadow-inner space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Document Type</label>
                    <div className="text-neutral-900 text-sm font-bold">{editingDeadline.type_name}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-neutral-200/60">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Semester</label>
                      <div className="text-neutral-700 text-sm font-medium">{editingDeadline.semester}</div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Academic Year</label>
                      <div className="text-neutral-700 text-sm font-mono font-bold">{editingDeadline.academic_year}</div>
                    </div>
                  </div>
                </div>

                {/* Editable Fields Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Issue Date</Label>
                    <Input
                      type="date"
                      value={editingDeadline.issue_date}
                      min={todayStr}
                      disabled={['Active', 'Grace Period'].includes(originalEditingDeadline?.status)}
                      onChange={(e) => setEditingDeadline({ ...editingDeadline, issue_date: e.target.value })}
                      className={`bg-white border-neutral-200 text-neutral-900 shadow-sm focus-visible:ring-primary-500 transition-all font-medium px-3 h-9 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-100 ${editingDeadline.issue_date < todayStr && editingDeadline.issue_date !== originalEditingDeadline?.issue_date ? 'border-destructive' : ''}`}
                    />
                    {editingDeadline.issue_date < todayStr && editingDeadline.issue_date !== originalEditingDeadline?.issue_date && (
                      <p className="text-[10px] text-destructive font-semibold italic flex items-center gap-1 mt-0.5">
                        <AlertCircle className="h-2.5 w-2.5" /> Cannot change to a past date.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Due Date</Label>
                    <Input
                      type="date"
                      value={editingDeadline.deadline_date}
                      min={editingDeadline.issue_date || todayStr}
                      onChange={(e) => setEditingDeadline({ ...editingDeadline, deadline_date: e.target.value })}
                      className={`bg-white border-neutral-200 text-neutral-900 shadow-sm focus-visible:ring-primary-500 transition-all font-medium px-3 h-9 ${(editingDeadline.deadline_date < todayStr && editingDeadline.deadline_date !== originalEditingDeadline?.deadline_date) || editingDeadline.issue_date > editingDeadline.deadline_date ? 'border-destructive' : ''}`}
                    />
                    {editingDeadline.deadline_date < todayStr && editingDeadline.deadline_date !== originalEditingDeadline?.deadline_date && (
                      <p className="text-[10px] text-destructive font-semibold italic flex items-center gap-1 mt-0.5">
                        <AlertCircle className="h-2.5 w-2.5" /> Cannot change to a past date.
                      </p>
                    )}
                    {editingDeadline.issue_date > editingDeadline.deadline_date && (
                      <p className="text-[10px] text-destructive font-semibold italic flex items-center gap-1 mt-0.5">
                        <AlertCircle className="h-2.5 w-2.5" /> Must be after issue date.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Grace Days</Label>
                    <Input
                      type="number"
                      value={editingDeadline.grace_period_days}
                      onChange={(e) => setEditingDeadline({ ...editingDeadline, grace_period_days: e.target.value })}
                      className="bg-white border-neutral-200 text-neutral-900 shadow-sm focus-visible:ring-primary-500 transition-all font-medium px-3 h-9"
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="mt-4 gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="border-neutral-200 text-neutral-700 hover:bg-neutral-100 shadow-sm transition-all font-bold"
              >
                Cancel
              </Button>
              <Button
                className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm active:scale-95 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleEditSubmit}
                disabled={
                  editingDeadline && (
                    (editingDeadline.issue_date < todayStr && editingDeadline.issue_date !== originalEditingDeadline?.issue_date) ||
                    (editingDeadline.deadline_date < todayStr && editingDeadline.deadline_date !== originalEditingDeadline?.deadline_date) ||
                    editingDeadline.issue_date > editingDeadline.deadline_date
                  )
                }
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}>
          <DialogContent className={`bg-white text-neutral-900 max-w-md shadow-2xl ${confirmDialog.confirmText === 'Delete' ? 'border-destructive/30' : 'border-neutral-200'}`}>
            <DialogHeader>
              <DialogTitle className={`flex items-center gap-2 font-bold ${confirmDialog.confirmText === 'Delete' ? 'text-destructive' : 'text-neutral-900'}`}>
                <AlertCircle className={`h-5 w-5 ${confirmDialog.confirmText === 'Delete' ? 'text-destructive' : 'text-warning'}`} />
                {confirmDialog.title}
              </DialogTitle>
              <DialogDescription className="text-neutral-600 mt-2 font-medium">
                {confirmDialog.message}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-2 sm:gap-3 mt-4 border-t border-neutral-100 pt-4">
              <Button
                variant="outline"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border-neutral-200 shadow-sm transition-all"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDialog.onConfirm}
                className={`text-white shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${confirmDialog.confirmText === 'Delete'
                  ? 'bg-destructive hover:bg-destructive/90'
                  : 'bg-primary-600 hover:bg-primary-700'
                  }`}
              >
                {confirmDialog.confirmText === 'Delete' && <Trash2 className="h-4 w-4" />}
                {confirmDialog.confirmText}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </ToastProvider>
  );
}

// Helpers
const StatCard = ({ title, value, sub, icon: Icon, color }) => (
  <Card className={`bg-white border-neutral-200 shadow-sm transition-all hover:shadow-md overflow-hidden`}>
    <CardContent className="p-5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">{title}</p>
          <p className="text-2xl font-bold text-neutral-900 tracking-tight">{value}</p>
          {sub && <p className="text-[10px] text-neutral-400 mt-2 font-bold uppercase tracking-wider">{sub}</p>}
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