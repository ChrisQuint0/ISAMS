import React, { useState, useMemo, useEffect } from 'react';
import {
    Calendar, Clock, AlertTriangle, CheckCircle,
    RefreshCw, ArrowRight, AlertCircle, History, Info,
    ShieldCheck, Trash2, Bell, CalendarOff, BarChart2, Users
} from 'lucide-react';
import { useAdminSemesterManagement } from '../hooks/AdminSemesterManagementHook';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DataTable } from "@/components/DataTable";
import { ToastProvider, useToast } from "@/components/ui/toast/toaster";

// Toast bridge
const SemesterToastHandler = ({ success, error }) => {
    const { addToast } = useToast();
    useEffect(() => {
        if (success) addToast({ title: "Success", description: String(success), variant: "success" });
    }, [success, addToast]);
    useEffect(() => {
        if (error) addToast({ title: "Error", description: String(error), variant: "destructive" });
    }, [error, addToast]);
    return null;
};

// Academic Year & Semester Validation Utilities
const AY_REGEX = /^\d{4}-\d{4}$/;

// Returns an error string or null if valid
function validateAcademicYear(ay) {
    if (!ay || !ay.trim()) return 'Academic year is required.';
    if (!AY_REGEX.test(ay.trim())) return 'Must be in YYYY-YYYY format (e.g. 2025-2026).';
    const [y1, y2] = ay.trim().split('-').map(Number);
    if (y2 !== y1 + 1) return `Second year must be exactly one more than the first (e.g. ${y1}-${y1 + 1}).`;
    const currentYear = new Date().getFullYear();
    const minStartYear = currentYear - 1;
    if (y1 < minStartYear) return `Academic year cannot be earlier than ${minStartYear}-${minStartYear + 1}.`;
    return null;
}

// Semester order within an AY
const SEM_ORDER = ['1st Semester', '2nd Semester', 'Summer'];

function getNextSemesterOptions(currentSemester, currentAY) {
    const idx = SEM_ORDER.indexOf(currentSemester);
    if (idx === -1) return { semesters: SEM_ORDER, suggestedAY: currentAY };

    if (idx < SEM_ORDER.length - 1) {
        return {
            semesters: SEM_ORDER.slice(idx + 1),
            suggestedAY: currentAY,
        };
    } else {
        const suggestedAY = (() => {
            if (!currentAY || !AY_REGEX.test(currentAY)) return '';
            const [, y2] = currentAY.split('-').map(Number);
            return `${y2}-${y2 + 1}`;
        })();
        return {
            semesters: ['1st Semester'],
            suggestedAY,
        };
    }
}

// What resets / What is preserved info
const RESETS = [
    { icon: CalendarOff, label: 'All holiday blocks' },
    { icon: Bell, label: 'All notifications' },
    { icon: Calendar, label: 'Deadlines for this period' },
    { icon: BarChart2, label: 'Active dashboard progress (→ 0%)' },
    { icon: AlertTriangle, label: 'Pending submissions → INCOMPLETE_CLOSED' },
];
const PRESERVED = [
    { icon: Users, label: 'Faculty accounts & course lists' },
    { icon: ShieldCheck, label: 'Approved & archived documents' },
    { icon: History, label: 'Historical analytics & reports' },
    { icon: CheckCircle, label: 'Validation rules & templates' },
    { icon: BarChart2, label: 'Google Drive files & sub-folders' },
];

export default function AdminSemesterManagementPage() {
    const {
        loading, currentSettings, history, semesterStats, incompleteFaculty,
        updateSettings, triggerRollover, error, success, refresh,
        setError, setSuccess
    } = useAdminSemesterManagement();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({ semester: '', academic_year: '' });
    const [isRolloverModalOpen, setIsRolloverModalOpen] = useState(false);
    const [rolloverStep, setRolloverStep] = useState(1);
    const [rolloverFormData, setRolloverFormData] = useState({ nextSemester: '', nextYear: '' });
    const [confirmValue, setConfirmValue] = useState('');
    const editAYError = useMemo(() => validateAcademicYear(editFormData.academic_year), [editFormData.academic_year]);

    const isCompletedPeriod = useMemo(() => {
        if (!editFormData.semester || !editFormData.academic_year) return false;
        return (history || []).some(
            r => r.status === 'COMPLETED'
                && r.academic_year === editFormData.academic_year.trim()
                && r.semester === editFormData.semester
        );
    }, [editFormData.semester, editFormData.academic_year, history]);

    const canSaveEdit = !editAYError && !!editFormData.semester && !isCompletedPeriod;

    const nextOptions = useMemo(
        () => getNextSemesterOptions(currentSettings.semester, currentSettings.academic_year),
        [currentSettings.semester, currentSettings.academic_year]
    );

    const rolloverAYError = useMemo(() => validateAcademicYear(rolloverFormData.nextYear), [rolloverFormData.nextYear]);

    const rolloverSemError = useMemo(() => {
        if (!rolloverFormData.nextSemester) return null;
        if (!nextOptions.semesters.includes(rolloverFormData.nextSemester)) {
            return `After "${currentSettings.semester}", the next expected semester is: ${nextOptions.semesters.join(' or ')}.`;
        }
        return null;
    }, [rolloverFormData.nextSemester, nextOptions, currentSettings.semester]);

    const canProceedRolloverStep2 =
        !!rolloverFormData.nextYear &&
        !!rolloverFormData.nextSemester &&
        !rolloverAYError &&
        !rolloverSemError;

    useEffect(() => {
        if (isEditModalOpen) {
            setEditFormData({ semester: currentSettings.semester, academic_year: currentSettings.academic_year });
        }
    }, [isEditModalOpen, currentSettings]);

    const handleRolloverOpenChange = (open) => {
        if (!open) {
            setRolloverStep(1);
            setRolloverFormData({ nextSemester: '', nextYear: '' });
            setConfirmValue('');
        }
        setIsRolloverModalOpen(open);
    };

    const handleOpenRollover = () => {
        setRolloverStep(1);
        setRolloverFormData({
            nextSemester: nextOptions.semesters[0] || '',
            nextYear: nextOptions.suggestedAY || '',
        });
        setConfirmValue('');
        setIsRolloverModalOpen(true);
    };

    const handleManualSave = async () => {
        if (editAYError) return;

        // Trim labels to prevent whitespace mismatch in SQL queries
        const trimmedSettings = {
            semester: editFormData.semester?.trim(),
            academic_year: editFormData.academic_year?.trim()
        };

        const ok = await updateSettings(trimmedSettings);
        if (ok) setIsEditModalOpen(false);
    };

    const handleExecuteRollover = async () => {
        if (confirmValue !== 'FORCE CLOSE') {
            setError("Please type 'FORCE CLOSE' to proceed.");
            return;
        }
        const ok = await triggerRollover(rolloverFormData.nextSemester, rolloverFormData.nextYear);
        if (ok) handleRolloverOpenChange(false);
    };

    const statsMap = useMemo(() => {
        const map = {};
        (semesterStats || []).forEach(s => {
            map[`${s.academic_year}|${s.semester}`] = s;
        });
        return map;
    }, [semesterStats]);


    const columnDefs = useMemo(() => [
        {
            field: 'academic_year',
            headerName: 'Academic Year',
            flex: 1,
            cellRenderer: (p) => <span className="font-mono text-neutral-700 font-bold">{p.value}</span>
        },
        {
            field: 'semester',
            headerName: 'Semester',
            flex: 1,
            cellRenderer: (p) => <span className="font-medium text-neutral-900">{p.value}</span>
        },
        {
            headerName: 'Status',
            flex: 0.8,
            valueGetter: (p) => {
                const s = (p.data.status || '').toUpperCase();
                if (s === 'ACTIVE') return 'Active';
                return 'Completed';
            },
            cellRenderer: (p) => (
                <Badge className={`font-bold text-xs px-2 py-0.5 rounded-full border ${p.value === 'Active'
                    ? 'bg-success/10 text-success border-success/20'
                    : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                    }`}>
                    {p.value}
                </Badge>
            )
        },
        {
            headerName: 'Faculty',
            flex: 0.7,
            valueGetter: (p) => statsMap[`${p.data.academic_year}|${p.data.semester}`]?.total_faculty ?? '—',
            cellRenderer: (p) => <span className="font-medium text-neutral-700">{p.value}</span>
        },
        {
            headerName: 'Submissions',
            flex: 0.9,
            valueGetter: (p) => statsMap[`${p.data.academic_year}|${p.data.semester}`]?.total_submissions ?? '—',
            cellRenderer: (p) => <span className="font-medium text-neutral-700">{p.value}</span>
        },
        {
            headerName: 'Completion',
            flex: 0.9,
            valueGetter: (p) => {
                const stat = statsMap[`${p.data.academic_year}|${p.data.semester}`];
                return stat ? parseFloat(stat.completion_rate) : null;
            },
            cellRenderer: (p) => {
                if (p.value === null || p.value === undefined) return <span className="text-neutral-400 italic text-xs">No data</span>;
                const pct = parseFloat(p.value);
                const color = pct >= 80 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-destructive';
                return <span className={`font-bold ${color}`}>{pct}%</span>;
            }
        },
    ], [currentSettings, statsMap]);

    return (
        <ToastProvider>
            <SemesterToastHandler success={success} error={error} />
            <div className="space-y-6 flex flex-col h-full bg-neutral-50/30">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900">Semester Management</h1>
                        <p className="text-neutral-500 text-sm font-medium">Manage academic periods and execute archival protocols</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refresh}
                        disabled={loading}
                        className="bg-primary-500 border-primary-500 text-neutral-50 hover:bg-primary-600 hover:text-neutral-50 shadow-sm"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Semester
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    <Card className="bg-white border-neutral-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-neutral-50/50 border-b border-neutral-100">
                            <div className="flex justify-between items-center py-4">
                                <CardTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-primary-600" />
                                    Active Academic Period
                                </CardTitle>
                                <Badge variant="outline" className="bg-success/10 text-success border-success/20 font-bold uppercase tracking-wider text-[10px] shadow-sm">
                                    Currently Running
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="grid grid-cols-2 gap-8 mb-5">
                                <div className="space-y-1.5">
                                    <p className="text-xs uppercase text-neutral-500 font-bold tracking-widest">Academic Year</p>
                                    <p className="text-2xl font-mono font-bold text-neutral-900 tracking-tight">
                                        {currentSettings.academic_year || '—'}
                                    </p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-xs uppercase text-neutral-500 font-bold tracking-widest">Current Semester</p>
                                    <p className="text-xl font-bold text-neutral-700">
                                        {currentSettings.semester || '—'}
                                    </p>
                                </div>
                            </div>

                            {/* Stats of active semester */}
                            {statsMap[`${currentSettings.academic_year}|${currentSettings.semester}`] && (() => {
                                const s = statsMap[`${currentSettings.academic_year}|${currentSettings.semester}`];
                                const pct = parseFloat(s.completion_rate);
                                return (
                                    <div className="grid grid-cols-3 gap-3 mb-5">
                                        {[
                                            { label: 'Faculty', val: s.total_faculty },
                                            { label: 'Submissions', val: s.total_submissions },
                                            { label: 'Completion', val: `${pct}%`, color: pct >= 80 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-destructive' },
                                        ].map(item => (
                                            <div key={item.label} className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-center shadow-inner">
                                                <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-1">{item.label}</p>
                                                <p className={`text-lg font-bold font-mono ${item.color || 'text-neutral-900'}`}>{item.val}</p>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}

                            <div className="flex items-center gap-2 text-sm text-info bg-info/5 p-3 rounded-lg border border-info/20 mb-5 font-medium shadow-inner">
                                <Info className="h-4 w-4 shrink-0 text-info" />
                                This determines the target for all faculty submissions and deadline calculations.
                            </div>

                            <Button
                                variant="outline"
                                className="w-full bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 shadow-sm active:scale-95 transition-all"
                                onClick={() => setIsEditModalOpen(true)}
                            >
                                Manual Settings Override
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Rollover Card */}
                    <Card className="bg-primary-50/30 border-primary-200 shadow-sm overflow-hidden flex flex-col">
                        <CardHeader className="bg-white border-b border-neutral-100 py-4">
                            <CardTitle className="text-lg font-bold text-primary-900 flex items-center gap-2">
                                <RefreshCw className="h-4 w-4 text-primary-600" />
                                Semester Rollover Protocol
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 flex-1 flex flex-col justify-between">
                            <div className="space-y-4">
                                <p className="text-sm text-primary-800 leading-relaxed font-medium">
                                    Closing a semester is a <span className="font-bold underline decoration-primary-400">one-directional</span> operation.
                                    It archives all active submissions and resets the system for the next academic period.
                                </p>

                                {/* Quick preview of what will happen */}
                                <div className="bg-white border border-neutral-200 rounded-lg p-4 space-y-2 shadow-inner">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Rollover will wipe</p>
                                    {[
                                        'All holiday blocks (old dates)',
                                        'All notifications',
                                        'Deadlines for this period',
                                        'Pending submissions → INCOMPLETE',
                                    ].map(item => (
                                        <div key={item} className="flex items-center gap-2 text-xs text-neutral-600 font-medium">
                                            <span className="h-1.5 w-1.5 rounded-full bg-warning shrink-0" />
                                            {item}
                                        </div>
                                    ))}
                                </div>

                                <Alert className="bg-warning/5 border border-warning/20 shadow-sm">
                                    <AlertTriangle className="h-4 w-4 text-warning" />
                                    <AlertTitle className="font-bold text-warning">Nuclear Option</AlertTitle>
                                    <AlertDescription className="text-warning/80 text-xs font-medium mt-1">
                                        Ensure all submissions are finalized before proceeding. This cannot be undone.
                                    </AlertDescription>
                                </Alert>
                            </div>

                            <Button
                                className="mt-6 w-full bg-primary-600 hover:bg-primary-700 text-white font-bold h-12 shadow-sm active:scale-95 transition-all"
                                onClick={handleOpenRollover}
                            >
                                Close Academic Semester
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* History Table */}
                <Card className="bg-white border-neutral-200 shadow-sm">
                    <CardHeader className="border-b border-neutral-100 bg-neutral-50/50">
                        <div className="flex justify-between items-center">
                            <div className="py-4">
                                <CardTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                                    <History className="h-4 w-4 text-primary-600" />
                                    Historical Academic Records
                                </CardTitle>
                                <CardDescription className="text-neutral-500 mt-1 font-medium">
                                    All semesters derived from course assignments — with submission statistics
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <DataTable
                            rowData={history}
                            columnDefs={columnDefs}
                            className="h-[350px]"
                            overlayNoRowsTemplate='<span style="color:var(--neutral-500);font-style:italic;font-weight:500;">No history available yet. Add course assignments to generate history.</span>'
                        />
                    </CardContent>
                </Card>

                {/* Manual Edit Modal */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="bg-white border-neutral-200 text-neutral-900 sm:max-w-[425px] shadow-xl">
                        <DialogHeader>
                            <DialogTitle className="text-neutral-900 font-bold">Override Period Settings</DialogTitle>
                            <DialogDescription className="text-neutral-500 font-medium">
                                Manually correct the active semester or academic year label.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Warning Banner */}
                        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 mt-1">
                            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-xs text-amber-800">
                                <p className="font-bold mb-0.5">Label-only change — data is NOT touched.</p>
                                <p className="font-medium opacity-80">This only updates the display label. No submissions, deadlines, or holidays will be wiped. To properly close a semester, use the <span className="font-bold">Rollover Protocol</span> instead.</p>
                            </div>
                        </div>

                        <div className="grid gap-4 py-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="ay" className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Academic Year</Label>
                                <Input
                                    id="ay"
                                    value={editFormData.academic_year}
                                    onChange={(e) => setEditFormData({ ...editFormData, academic_year: e.target.value })}
                                    placeholder="e.g. 2025-2026"
                                    className={`bg-white text-neutral-900 font-mono shadow-sm focus-visible:ring-primary-500 focus-visible:border-primary-500 ${editAYError ? 'border-destructive/60' : 'border-neutral-200'
                                        }`}
                                />
                                {editAYError && (
                                    <p className="text-xs text-destructive font-medium italic flex items-center gap-1.5">
                                        <AlertCircle className="h-3 w-3" />
                                        {editAYError}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="sem" className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Semester</Label>
                                <Select value={editFormData.semester} onValueChange={(v) => setEditFormData({ ...editFormData, semester: v })}>
                                    <SelectTrigger id="sem" className="bg-white border-neutral-200 text-neutral-900 shadow-sm focus:ring-primary-500">
                                        <SelectValue placeholder="Select Semester" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-neutral-200 text-neutral-900 shadow-md">
                                        <SelectItem value="1st Semester">1st Semester</SelectItem>
                                        <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                                        <SelectItem value="Summer">Summer</SelectItem>
                                    </SelectContent>
                                </Select>
                                {isCompletedPeriod && (
                                    <p className="flex items-center gap-1.5 text-xs text-destructive font-medium mt-1">
                                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                        <span>
                                            <strong>{editFormData.academic_year} — {editFormData.semester}</strong> is already closed and archived. You cannot revert to a completed period.
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>
                        <DialogFooter className="mt-4 gap-2 sm:gap-3">
                            <Button
                                variant="outline"
                                className="border-neutral-200 text-neutral-700 hover:bg-neutral-100 shadow-sm"
                                onClick={() => setIsEditModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleManualSave}
                                disabled={loading || !canSaveEdit}
                                className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm transition-all active:scale-95 font-bold disabled:opacity-50"
                            >
                                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Rollover Protocol Modal */}
                <Dialog open={isRolloverModalOpen} onOpenChange={handleRolloverOpenChange}>
                    <DialogContent className="sm:max-w-[560px] bg-white px-0 pt-0 overflow-hidden border-neutral-200 shadow-2xl">

                        {/* Gradient header with step progress */}
                        <div className="bg-primary-600 p-6 text-white shrink-0">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                                Semester Archival Protocol
                            </h2>
                            <p className="text-primary-200 text-xs mt-1 font-medium">
                                Step {rolloverStep} of 3 — {['Review Incomplete Faculty', 'Configure Next Period', 'Final Confirmation'][rolloverStep - 1]}
                            </p>
                            <div className="mt-4 flex gap-2">
                                {[1, 2, 3].map((s) => (
                                    <div
                                        key={s}
                                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${s <= rolloverStep ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'bg-primary-800'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="p-6 pt-4 space-y-5">

                            {/* Incomplete Faculty Review */}
                            {rolloverStep === 1 && (
                                <div className="space-y-4">
                                    <Alert className="bg-warning/5 border border-warning/20 shadow-sm">
                                        <AlertCircle className="h-4 w-4 text-warning" />
                                        <AlertTitle className="font-bold text-warning">Review Before Closing</AlertTitle>
                                        <AlertDescription className="text-warning/80 text-xs font-medium mt-1">
                                            Faculty members below have not completed their requirements.
                                            Proceeding will permanently mark them as <span className="font-bold">INCOMPLETE_CLOSED</span> for this semester.
                                        </AlertDescription>
                                    </Alert>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-bold uppercase text-neutral-500 tracking-wider">
                                                Incomplete Profiles
                                            </Label>
                                            <Badge className={`text-[10px] font-bold px-2 border ${incompleteFaculty.length > 0
                                                ? 'bg-warning/10 text-warning border-warning/20'
                                                : 'bg-success/10 text-success border-success/20'
                                                }`}>
                                                {incompleteFaculty.length} {incompleteFaculty.length === 1 ? 'faculty' : 'faculty'}
                                            </Badge>
                                        </div>
                                        <ScrollArea className="h-40 w-full border border-neutral-200 rounded-lg bg-neutral-50 p-3 shadow-inner">
                                            {incompleteFaculty.length > 0 ? (
                                                <ul className="space-y-2.5">
                                                    {incompleteFaculty.map((name, i) => (
                                                        <li key={i} className="text-sm text-neutral-700 flex items-center gap-2 font-medium">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-warning shrink-0" />
                                                            {name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-success font-bold flex items-center justify-center h-full gap-2">
                                                    <CheckCircle className="h-4 w-4" />
                                                    All faculty are at 100%. Safe to close!
                                                </p>
                                            )}
                                        </ScrollArea>
                                    </div>
                                </div>
                            )}

                            {/* Configure Next Period */}
                            {rolloverStep === 2 && (
                                <div className="space-y-5">
                                    {/* Current → New period banner */}
                                    <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 shadow-inner">
                                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3 text-center">Transition</p>
                                        <div className="flex items-center justify-center gap-4">
                                            <div className="text-center">
                                                <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-1">Closing</p>
                                                <p className="font-bold font-mono text-neutral-600 bg-white px-3 py-1.5 rounded border border-neutral-200 shadow-sm text-sm">
                                                    {currentSettings.semester}
                                                </p>
                                                <p className="text-[10px] text-neutral-400 mt-1 font-mono">{currentSettings.academic_year}</p>
                                            </div>
                                            <ArrowRight className="h-5 w-5 text-primary-400" />
                                            <div className="text-center">
                                                <p className="text-[10px] uppercase font-bold text-primary-600 tracking-wider mb-1">Opening</p>
                                                <p className="font-bold font-mono text-primary-700 bg-primary-50 border border-primary-200 px-3 py-1.5 rounded shadow-sm text-sm">
                                                    {rolloverFormData.nextSemester || 'Select →'}
                                                </p>
                                                <p className="text-[10px] text-primary-400 mt-1 font-mono">{rolloverFormData.nextYear || '????-????'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Input fields */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">New Academic Year</Label>
                                            <Input
                                                placeholder="e.g. 2025-2026"
                                                value={rolloverFormData.nextYear}
                                                onChange={(e) => setRolloverFormData({ ...rolloverFormData, nextYear: e.target.value })}
                                                className={`bg-white text-neutral-900 font-mono shadow-sm focus-visible:ring-primary-500 focus-visible:border-primary-500 ${rolloverAYError ? 'border-destructive/60' : 'border-neutral-200'
                                                    }`}
                                            />
                                            {rolloverAYError && (
                                                <p className="text-xs text-destructive font-medium italic flex items-center gap-1.5">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {rolloverAYError}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">New Semester</Label>
                                            <Select
                                                value={rolloverFormData.nextSemester}
                                                onValueChange={(v) => setRolloverFormData({ ...rolloverFormData, nextSemester: v })}
                                            >
                                                <SelectTrigger className={`bg-white text-neutral-900 shadow-sm focus:ring-primary-500 ${rolloverSemError ? 'border-destructive/60' : 'border-neutral-200'
                                                    }`}>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-neutral-200 text-neutral-900 shadow-md">
                                                    {nextOptions.semesters.map(sem => (
                                                        <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {rolloverSemError && (
                                                <p className="text-xs text-destructive font-medium italic flex items-center gap-1.5">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {rolloverSemError}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Resets / Preserved mini-table */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-destructive/5 border border-destructive/15 rounded-lg p-3">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-destructive mb-2">Will Be Reset</p>
                                            <ul className="space-y-1.5">
                                                {RESETS.map(({ icon: Icon, label }) => (
                                                    <li key={label} className="flex items-center gap-1.5 text-[11px] text-destructive/80 font-medium">
                                                        <Icon className="h-3 w-3 shrink-0" />
                                                        {label}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="bg-success/5 border border-success/15 rounded-lg p-3">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-success mb-2">Will Be Preserved</p>
                                            <ul className="space-y-1.5">
                                                {PRESERVED.map(({ icon: Icon, label }) => (
                                                    <li key={label} className="flex items-center gap-1.5 text-[11px] text-success/80 font-medium">
                                                        <Icon className="h-3 w-3 shrink-0" />
                                                        {label}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Final Confirmation */}
                            {rolloverStep === 3 && (
                                <div className="space-y-5 text-center py-2">
                                    <div className="inline-block p-4 bg-destructive/10 rounded-full border border-destructive/20">
                                        <AlertTriangle className="h-10 w-10 text-destructive animate-pulse" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-destructive uppercase tracking-tight">Destructive Confirmation</h3>
                                        <p className="text-sm text-neutral-600 font-medium px-4 leading-relaxed">
                                            Closing <strong>{currentSettings.semester} {currentSettings.academic_year}</strong> is permanent.
                                            All holidays, notifications, and pending submissions for this period will be wiped.
                                        </p>
                                        <p className="text-sm text-neutral-700 font-medium">
                                            Opening: <span className="font-bold text-primary-600">{rolloverFormData.nextSemester} {rolloverFormData.nextYear}</span>
                                        </p>
                                    </div>
                                    <div className="space-y-3 px-8">
                                        <p className="font-mono font-black text-destructive text-lg tracking-[0.2em] select-none">FORCE CLOSE</p>
                                        <Input
                                            value={confirmValue}
                                            onChange={(e) => setConfirmValue(e.target.value.toUpperCase())}
                                            className="text-center border-destructive/30 bg-destructive/5 text-destructive focus-visible:ring-destructive/50 focus-visible:border-destructive font-black uppercase shadow-inner tracking-widest"
                                            placeholder="TYPE HERE"
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Dialog Footer */}
                        <div className="border-t border-neutral-100 p-6 bg-neutral-50 flex justify-between gap-3 shrink-0">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (rolloverStep > 1) setRolloverStep(rolloverStep - 1);
                                    else handleRolloverOpenChange(false);
                                }}
                                className="bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100 flex-1 shadow-sm font-bold"
                                disabled={loading}
                            >
                                {rolloverStep === 1 ? 'Cancel' : 'Back'}
                            </Button>

                            {rolloverStep < 3 ? (
                                <Button
                                    onClick={() => setRolloverStep(rolloverStep + 1)}
                                    disabled={rolloverStep === 2 && !canProceedRolloverStep2}
                                    className="bg-primary-600 hover:bg-primary-700 text-white flex-1 shadow-sm active:scale-95 transition-all font-bold"
                                >
                                    Continue <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleExecuteRollover}
                                    disabled={confirmValue !== 'FORCE CLOSE' || loading}
                                    className="bg-destructive hover:bg-destructive/90 text-white flex-1 font-bold shadow-sm active:scale-95 transition-all"
                                >
                                    {loading
                                        ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                                        : 'Execute Rollover'
                                    }
                                </Button>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

            </div>
        </ToastProvider>
    );
}