import React, { useState, useMemo, useEffect } from 'react';
import {
    Calendar, Clock, AlertTriangle, CheckCircle,
    RefreshCw, GraduationCap, ArrowRight,
    AlertCircle, History, Info
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


export default function AdminSemesterManagementPage() {
    const {
        loading, currentSettings, history, incompleteFaculty,
        updateSettings, triggerRollover, error, success, refresh,
        setError, setSuccess
    } = useAdminSemesterManagement();

    // --- MANUAL EDIT STATE ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({ semester: '', academic_year: '' });

    // --- ROLLOVER STATE ---
    const [isRolloverModalOpen, setIsRolloverModalOpen] = useState(false);
    const [rolloverStep, setRolloverStep] = useState(1);
    const [rolloverFormData, setRolloverFormData] = useState({ nextSemester: '', nextYear: '' });
    const [confirmValue, setConfirmValue] = useState('');

    // Auto-fill edit form when modal opens
    useEffect(() => {
        if (isEditModalOpen) {
            setEditFormData({
                semester: currentSettings.semester,
                academic_year: currentSettings.academic_year
            });
        }
    }, [isEditModalOpen, currentSettings]);

    // Handle manual update
    const handleManualSave = async () => {
        const ok = await updateSettings(editFormData);
        if (ok) setIsEditModalOpen(false);
    };

    // Handle Rollover Execution
    const handleExecuteRollover = async () => {
        if (confirmValue !== 'FORCE CLOSE') {
            setError("Please type 'FORCE CLOSE' to proceed.");
            return;
        }

        const ok = await triggerRollover(rolloverFormData.nextSemester, rolloverFormData.nextYear);
        if (ok) {
            setIsRolloverModalOpen(false);
            setRolloverStep(1);
            setConfirmValue('');
        }
    };

    // Column Definitions for History
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
            cellRenderer: (p) => (
                <span className="font-medium text-neutral-900">{p.value}</span>
            )
        },
        {
            headerName: 'Status',
            valueGetter: (p) => {
                const isCurrent = p.data.semester === currentSettings.semester && p.data.academic_year === currentSettings.academic_year;
                return isCurrent ? 'Active' : 'Completed';
            },
            cellRenderer: (p) => (
                <Badge className={`font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider border shadow-sm ${p.value === 'Active'
                        ? 'bg-success/10 text-success border-success/20'
                        : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                    }`}>
                    {p.value}
                </Badge>
            )
        }
    ], [currentSettings]);

    return (
        <div className="space-y-6 flex flex-col h-full bg-neutral-50/30">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900">Semester Management</h1>
                        <p className="text-neutral-500 text-sm font-medium">Manage academic periods and execute archival protocols</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    onClick={refresh}
                    disabled={loading}
                    className="bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 shadow-sm transition-all"
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Data
                </Button>
            </div>

            {/* Grid for Active & Rollover */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Active Period Card */}
                <Card className="bg-white border-neutral-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 pb-4">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary-600" />
                                Active Academic Period
                            </CardTitle>
                            <Badge variant="outline" className="bg-success/10 text-success border-success/20 font-bold uppercase tracking-wider text-[10px] shadow-sm">
                                Currently Running
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-2 gap-8 mb-6">
                            <div className="space-y-1.5">
                                <p className="text-xs uppercase text-neutral-500 font-bold tracking-widest">Academic Year</p>
                                <p className="text-2xl font-mono font-bold text-neutral-900 tracking-tight">
                                    {currentSettings.academic_year || '---'}
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-xs uppercase text-neutral-500 font-bold tracking-widest">Current Semester</p>
                                <p className="text-xl font-bold text-neutral-700">
                                    {currentSettings.semester || '---'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-info bg-info/5 p-3 rounded-lg border border-info/20 mb-6 font-medium shadow-inner">
                            <Info className="h-4 w-4 shrink-0 text-info" />
                            This period determines the target for all faculty submissions and deadline calculations.
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
                    <CardHeader className="bg-white border-b border-neutral-100 pb-4">
                        <CardTitle className="text-lg font-bold text-primary-900 flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 text-primary-600" />
                            Semester Rollover Protocol
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                            <p className="text-sm text-primary-800 leading-relaxed font-medium">
                                Closing a semester is a <span className="font-bold underline decoration-primary-400">one-directional</span> operation.
                                It will archive all active submissions and reset the system for the next academic period.
                            </p>
                            <Alert className="bg-warning/5 border border-warning/20 shadow-sm">
                                <AlertTriangle className="h-4 w-4 text-warning" />
                                <AlertTitle className="font-bold text-warning">Nuclear Option</AlertTitle>
                                <AlertDescription className="text-warning/80 text-xs font-medium mt-1">
                                    Ensure all grades are finalized before proceeding. Submissions will be moved to the Document Archive.
                                </AlertDescription>
                            </Alert>
                        </div>

                        <Button
                            className="mt-6 w-full bg-primary-600 hover:bg-primary-700 text-white font-bold h-12 shadow-sm active:scale-95 transition-all"
                            onClick={() => {
                                setRolloverStep(1);
                                setIsRolloverModalOpen(true);
                            }}
                        >
                            Close Academic Semester
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* History Section */}
            <Card className="bg-white border-neutral-200 shadow-sm">
                <CardHeader className="border-b border-neutral-100 bg-neutral-50/50">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                                <History className="h-4 w-4 text-primary-600" />
                                Historical Academic Records
                            </CardTitle>
                            <CardDescription className="text-neutral-500 mt-1 font-medium">View past academic years and semesters derived from system records</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    <DataTable
                        rowData={history}
                        columnDefs={columnDefs}
                        className="h-[350px]"
                        overlayNoRowsTemplate='<span style="color:var(--neutral-500);font-style:italic;font-weight:500;">No history available yet.</span>'
                    />
                </CardContent>
            </Card>

            {/* Manual Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="bg-white border-neutral-200 text-neutral-900 sm:max-w-[425px] shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-neutral-900 font-bold">Override Period Settings</DialogTitle>
                        <DialogDescription className="text-neutral-500 font-medium">
                            Use this ONLY for correcting typos or small mistakes. To change periods properly, use the Rollover Protocol.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="ay" className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Academic Year</Label>
                            <Input
                                id="ay"
                                value={editFormData.academic_year}
                                onChange={(e) => setEditFormData({ ...editFormData, academic_year: e.target.value })}
                                placeholder="e.g. 2024-2025"
                                className="bg-white border-neutral-200 text-neutral-900 font-mono shadow-sm focus-visible:ring-primary-500 focus-visible:border-primary-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="sem" className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Semester</Label>
                            <Select
                                value={editFormData.semester}
                                onValueChange={(v) => setEditFormData({ ...editFormData, semester: v })}
                            >
                                <SelectTrigger id="sem" className="bg-white border-neutral-200 text-neutral-900 shadow-sm focus:ring-primary-500">
                                    <SelectValue placeholder="Select Semester" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-neutral-200 text-neutral-900 shadow-md">
                                    <SelectItem value="1st Semester">1st Semester</SelectItem>
                                    <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                                    <SelectItem value="Summer">Summer</SelectItem>
                                    <SelectItem value="Inter-Semester">Inter-Semester</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0 mt-2">
                        <Button
                            variant="outline"
                            className="border-neutral-200 text-neutral-700 hover:bg-neutral-100 shadow-sm"
                            onClick={() => setIsEditModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleManualSave}
                            className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm transition-all active:scale-95 font-bold"
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rollover Protocol Modal */}
            <Dialog open={isRolloverModalOpen} onOpenChange={setIsRolloverModalOpen}>
                <DialogContent className="sm:max-w-[550px] bg-white px-0 pt-0 overflow-hidden border-neutral-200 shadow-2xl">

                    {/* Custom Header with Progress */}
                    <div className="bg-primary-600 p-6 text-white shrink-0">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                            Sector Archival Protocol
                        </h2>
                        <div className="mt-4 flex gap-2">
                            {[1, 2, 3].map((s) => (
                                <div
                                    key={s}
                                    className={`h-1.5 flex-1 rounded-full transition-all ${s <= rolloverStep ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'bg-primary-800'}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="p-6 pt-4 space-y-6">

                        {/* STEP 1: VERIFICATION */}
                        {rolloverStep === 1 && (
                            <div className="space-y-4">
                                <Alert className="bg-warning/5 border border-warning/20 shadow-sm">
                                    <AlertCircle className="h-4 w-4 text-warning" />
                                    <AlertTitle className="font-bold text-warning">Pending Actions Detected</AlertTitle>
                                    <AlertDescription className="text-warning/80 text-xs font-medium mt-1">
                                        The following faculty members have not completed their requirements and will be closed out as "Incomplete".
                                    </AlertDescription>
                                </Alert>

                                <div className="space-y-2 mt-4">
                                    <Label className="text-xs font-bold uppercase text-neutral-500 tracking-wider">Incomplete Profiles ({incompleteFaculty.length})</Label>
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
                                            <p className="text-sm text-success font-bold flex items-center h-full justify-center">
                                                <CheckCircle className="h-4 w-4 mr-2" /> No incomplete profiles. Ready to close!
                                            </p>
                                        )}
                                    </ScrollArea>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: NEXT PERIOD CONFIG */}
                        {rolloverStep === 2 && (
                            <div className="space-y-6">
                                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 shadow-inner">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3 text-center">Protocol Target Information</p>
                                    <div className="flex items-center justify-center gap-6">
                                        <div className="text-center">
                                            <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-1">Current</p>
                                            <p className="font-bold font-mono text-neutral-600 bg-white px-3 py-1 rounded border border-neutral-200 shadow-sm">{currentSettings.academic_year}</p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-primary-400" />
                                        <div className="text-center">
                                            <p className="text-[10px] uppercase font-bold text-primary-600 tracking-wider mb-1">New Period</p>
                                            <p className="font-bold font-mono text-primary-700 bg-primary-50 border border-primary-200 px-3 py-1 rounded shadow-sm">
                                                {rolloverFormData.nextYear || '????-????'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">New Academic Year</Label>
                                        <Input
                                            placeholder="e.g. 2024-2025"
                                            value={rolloverFormData.nextYear}
                                            onChange={(e) => setRolloverFormData({ ...rolloverFormData, nextYear: e.target.value })}
                                            className="bg-white border-neutral-200 text-neutral-900 font-mono shadow-sm focus-visible:ring-primary-500 focus-visible:border-primary-500"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">New Semester</Label>
                                        <Select
                                            value={rolloverFormData.nextSemester}
                                            onValueChange={(v) => setRolloverFormData({ ...rolloverFormData, nextSemester: v })}
                                        >
                                            <SelectTrigger className="bg-white border-neutral-200 text-neutral-900 shadow-sm focus:ring-primary-500">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border-neutral-200 text-neutral-900 shadow-md">
                                                <SelectItem value="1st Semester">1st Semester</SelectItem>
                                                <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                                                <SelectItem value="Summer">Summer</SelectItem>
                                                <SelectItem value="Inter-Semester">Inter-Semester</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: FINAL DESTRUCTION CONFIRMATION */}
                        {rolloverStep === 3 && (
                            <div className="space-y-6 text-center py-4">
                                <div className="inline-block p-4 bg-destructive/10 rounded-full border border-destructive/20 mb-2">
                                    <AlertTriangle className="h-10 w-10 text-destructive animate-pulse" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-destructive uppercase tracking-tight">Destructive Confirmation</h3>
                                    <p className="text-sm text-neutral-700 font-medium px-6">
                                        You are explicitly triggering the archival of all current semester data.
                                        This cannot be undone. Type the following to proceed:
                                    </p>
                                </div>

                                <div className="space-y-3 px-10">
                                    <p className="font-mono font-black text-destructive text-lg tracking-[0.2em] select-none">FORCE CLOSE</p>
                                    <Input
                                        value={confirmValue}
                                        onChange={(e) => setConfirmValue(e.target.value)}
                                        className="text-center border-destructive/30 bg-destructive/5 text-destructive focus-visible:ring-destructive/50 focus-visible:border-destructive font-black uppercase shadow-inner"
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
                                else setIsRolloverModalOpen(false);
                            }}
                            className="bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100 flex-1 shadow-sm font-bold"
                        >
                            {rolloverStep === 1 ? 'Cancel' : 'Back'}
                        </Button>

                        {rolloverStep < 3 ? (
                            <Button
                                onClick={() => setRolloverStep(rolloverStep + 1)}
                                disabled={rolloverStep === 2 && (!rolloverFormData.nextYear || !rolloverFormData.nextSemester)}
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
                                {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : 'Execute Rollover'}
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}