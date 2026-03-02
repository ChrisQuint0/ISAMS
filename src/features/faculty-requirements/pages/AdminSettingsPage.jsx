import React, { useState, useMemo, useEffect } from 'react';
import {
    Save, Database, Terminal, Trash2, RefreshCw, Eye, Settings,
    Cpu, CheckCircle, AlertCircle, Play, Shield, FileText,
    Clock, Archive, AlertTriangle, HardDrive, Server, Activity,
    Wifi, WifiOff, Globe, Lock, Unlock,
    ChevronUp, ChevronDown, Plus, Folder, File as FileIcon, LayoutTemplate, Users, BookOpen, X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DataTable } from "@/components/DataTable";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { ToastProvider, useToast } from "@/components/ui/toast/toaster";

// AG Grid
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeBalham } from 'ag-grid-community';

// Hook
import { useAdminSettings } from '../hooks/AdminSettingHook';
import { settingsService } from '../services/AdminSettingService';
import NameCalibratorModal from '../components/NameCalibratorModal';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

ModuleRegistry.registerModules([AllCommunityModule]);

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

// CourseFacultyEditor — custom AG Grid cell editor for the Faculty column.
// Defined OUTSIDE the component so it doesn't remount on each render.
const CourseFacultyEditor = React.forwardRef(({ value: initialValue, facultyList = [], stopEditing }, ref) => {
    const valRef = React.useRef(initialValue || '');   // sync — read by getValue()
    const [val, setVal] = React.useState(initialValue || ''); // for controlled <select>
    React.useImperativeHandle(ref, () => ({
        getValue: () => valRef.current === '' ? null : valRef.current,
        isPopup: () => true,
    }));
    const handleChange = (e) => {
        valRef.current = e.target.value;   // update ref synchronously first
        setVal(e.target.value);
        // stopEditing fires after the ref is set, so getValue() returns the new value
        setTimeout(() => stopEditing && stopEditing(), 0);
    };
    return (
        <select
            autoFocus
            value={val}
            onChange={handleChange}
            style={{
                background: '#ffffff', border: '1px solid var(--neutral-200)', color: 'var(--neutral-900)',
                padding: '6px 10px', borderRadius: '6px', fontSize: '13px',
                outline: 'none', minWidth: '180px', cursor: 'pointer', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
            }}
        >
            <option value="" disabled hidden></option>
            {facultyList.filter(f => f.is_active).map(f => (
                <option key={f.faculty_id} value={f.faculty_id}>
                    {f.first_name} {f.last_name}
                </option>
            ))}
        </select>
    );
});
CourseFacultyEditor.displayName = 'CourseFacultyEditor';

export default function AdminSettingsPage() {
    const {
        loading, processing, error, success, setError, setSuccess,
        settings, testResult, clearTestResult,
        updateSetting, saveGroup, runTestOCR, refresh,
        docRequirements, addDocRequirement, updateDocRequirement, deleteDocRequirement,
        templates, addTemplate, deleteTemplate, archiveTemplate, updateTemplateCoordinates,
        facultyList, handleUpdateFacultyField,
        masterCourseList, handleAddMasterCourse, handleDeleteMasterCourse, handleUpdateMasterCourseField,
        courseList, handleAddCourse, handleDeleteCourse,
        systemHealth, holidays, handleAddHoliday, handleBulkAddHolidays, handleDeleteHoliday,
        fetchDocTypeRules, saveDocTypeRules
    } = useAdminSettings();

    const [testFile, setTestFile] = useState(null);
    const [testDocTypeId, setTestDocTypeId] = useState('');

    const [newReq, setNewReq] = useState({ name: '', folder: '', required: true });
    const [newHoliday, setNewHoliday] = useState({ startDate: '', endDate: '', description: '' });
    const todayStr = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

    // Validation: Check if start date is in the past
    const holidayIsPast = newHoliday.startDate && newHoliday.startDate < todayStr;
    const holidayEndDateInvalid = newHoliday.startDate && newHoliday.endDate && newHoliday.endDate < newHoliday.startDate;

    // Check if specific Start/End dates are occupied
    const holidayStartDateOccupied = useMemo(() =>
        newHoliday.startDate && holidays.some(h => (h.holiday_date || h.date) === newHoliday.startDate),
        [newHoliday.startDate, holidays]
    );

    const holidayEndDateOccupied = useMemo(() =>
        newHoliday.endDate && holidays.some(h => (h.holiday_date || h.date) === newHoliday.endDate),
        [newHoliday.endDate, holidays]
    );

    const holidayEndDateSameAsStart = newHoliday.startDate && newHoliday.endDate && newHoliday.startDate === newHoliday.endDate;

    const holidayDescriptionDuplicate = useMemo(() => {
        if (!newHoliday.description.trim()) return false;
        return holidays.some(h => (h.description || '').toLowerCase().trim() === newHoliday.description.toLowerCase().trim());
    }, [newHoliday.description, holidays]);

    // Calculate occupied dates in the selected range
    const holidayOccupiedDates = useMemo(() => {
        if (!newHoliday.startDate || holidayIsPast) return [];
        const start = new Date(newHoliday.startDate);
        const end = newHoliday.endDate ? new Date(newHoliday.endDate) : new Date(newHoliday.startDate);
        if (end < start) return [];

        const occupied = [];
        let curr = new Date(start);
        while (curr <= end) {
            const fmt = curr.toLocaleDateString('en-CA');
            if (holidays.some(h => (h.holiday_date || h.date) === fmt)) {
                occupied.push(fmt);
            }
            curr.setDate(curr.getDate() + 1);
        }
        return occupied;
    }, [newHoliday.startDate, newHoliday.endDate, holidays, holidayIsPast]);

    const canAddHoliday = newHoliday.startDate &&
        newHoliday.description &&
        !holidayIsPast &&
        !holidayEndDateInvalid &&
        !holidayEndDateSameAsStart &&
        !holidayDescriptionDuplicate &&
        holidayOccupiedDates.length === 0;
    const [pendingDeleteId, setPendingDeleteId] = useState(null);

    // Danger Modal State
    const [isDangerModalOpen, setIsDangerModalOpen] = useState(false);
    const [dangerModalConfig, setDangerModalConfig] = useState({ actionType: '', title: '', description: '', confirmationText: '' });
    const [dangerModalInput, setDangerModalInput] = useState('');

    const isDuplicateRequirement = useMemo(() =>
        newReq.name.trim() && docRequirements.some(req =>
            req.name.toLowerCase().trim() === newReq.name.toLowerCase().trim()
        ),
        [newReq.name, docRequirements]
    );

    const isDuplicateFolder = useMemo(() =>
        newReq.folder.trim() && docRequirements.some(req =>
            req.folder.toLowerCase().trim() === newReq.folder.toLowerCase().trim()
        ),
        [newReq.folder, docRequirements]
    );

    const canAddDocType = newReq.name.trim() && newReq.folder.trim() && !isDuplicateRequirement && !isDuplicateFolder;
    const [pendingHolidayDeleteId, setPendingHolidayDeleteId] = useState(null);

    // ── Template Hub state ──────────────────────────────────────────────
    const [isTemplateModalOpen, setTemplateModalOpen] = useState(false);
    const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
    const [newTemplate, setNewTemplate] = useState({
        file: null, title: '', description: '', systemCategory: '', academicYear: '', semester: ''
    });

    const certificateTemplates = useMemo(() => templates.filter(t => t.category === 'CLEARANCE_CERTIFICATE'), [templates]);
    const generalTemplates = useMemo(() => templates.filter(t => t.category !== 'CLEARANCE_CERTIFICATE'), [templates]);

    const holidayColDefs = useMemo(() => [
        {
            headerName: 'Date',
            valueGetter: p => new Date(p.data.holiday_date || p.data.date).toLocaleDateString('en-CA'),
            width: 150,
            cellRenderer: (params) => (
                <span className="font-mono text-neutral-700 font-bold">{params.value}</span>
            )
        },
        {
            field: 'description',
            headerName: 'Description',
            flex: 1,
            cellRenderer: (params) => (
                <span className="font-medium text-neutral-900">{params.value}</span>
            )
        },
        {
            headerName: 'Actions',
            width: 170, // Increased width to safely hold both buttons without wrapping
            sortable: false,
            filter: false,
            cellRenderer: (params) => {
                const id = params.data.holiday_id || params.data.id;
                if (pendingHolidayDeleteId === id) {
                    return (
                        // Removed the animation classes so it doesn't bounce on AG Grid remounts
                        <div className="flex items-center gap-1 mt-1.5">
                            <Button
                                size="xs"
                                variant="destructive"
                                onClick={() => { setPendingHolidayDeleteId(null); handleDeleteHoliday(id); }}
                            >
                                Confirm
                            </Button>
                            <Button
                                size="xs"
                                variant="ghost"
                                className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                                onClick={() => setPendingHolidayDeleteId(null)}
                            >
                                Cancel
                            </Button>
                        </div>
                    );
                }
                return (
                    <div className="flex items-center mt-1.5">
                        <Button
                            size="xs"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setPendingHolidayDeleteId(id)}
                        >
                            Remove
                        </Button>
                    </div>
                );
            }
        }
    ], [handleDeleteHoliday, pendingHolidayDeleteId]);

    // ── Name Calibrator state ──────────────────────────────────────────────
    const [isCalibratorOpen, setIsCalibratorOpen] = useState(false);
    const [selectedTemplateForCalibration, setSelectedTemplateForCalibration] = useState(null);

    // ── Course Catalog form state ──────────────────────────────────────────────
    const [newCatalog, setNewCatalog] = useState({ code: '', name: '', semester: '' });
    const catalogCodeValid = newCatalog.code.trim().length >= 3;
    const catalogNameValid = newCatalog.name.trim().length > 0;
    const catalogSemValid = !!newCatalog.semester;

    // Global Duplicate: same code OR name already in catalog in ANY semester
    const existingCatalogEntry = useMemo(() => {
        if (!catalogCodeValid && !catalogNameValid) return null;
        return masterCourseList.find(c =>
            (catalogCodeValid && (c.course_code || '').trim().toUpperCase() === newCatalog.code.trim().toUpperCase()) ||
            (catalogNameValid && (c.course_name || '').trim().toUpperCase() === newCatalog.name.trim().toUpperCase())
        );
    }, [newCatalog.code, newCatalog.name, masterCourseList, catalogCodeValid, catalogNameValid]);

    const catalogConflictType = useMemo(() => {
        if (!existingCatalogEntry) return null;
        if ((existingCatalogEntry.course_code || '').trim().toUpperCase() === newCatalog.code.trim().toUpperCase()) return 'Code';
        return 'Name';
    }, [existingCatalogEntry, newCatalog.code]);

    const catalogCodeTaken = !!existingCatalogEntry;
    const canAddCatalog = catalogCodeValid && catalogNameValid && catalogSemValid && !catalogCodeTaken;

    // ── Assign Faculty Modal state ─────────────────────────────────────────────
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [newAssignment, setNewAssignment] = useState({ master_course_id: '', section: '', faculty_id: '' });

    const selectedCatalogEntry = masterCourseList.find(c => c.id === Number(newAssignment.master_course_id));
    const assignmentValid = !!newAssignment.master_course_id && newAssignment.section.trim().length >= 1 && !!newAssignment.faculty_id;

    // Guard 1: the section slot is already taken by someone
    const sectionTaken = assignmentValid && courseList.some(
        c => Number(c.master_course_id) === Number(newAssignment.master_course_id) &&
            (c.section || '').toUpperCase() === newAssignment.section.trim().toUpperCase()
    );
    // Guard 2: this exact faculty+course+section combo already exists
    const facultyAlreadyOnSection = assignmentValid && courseList.some(
        c => Number(c.master_course_id) === Number(newAssignment.master_course_id) &&
            (c.section || '').toUpperCase() === newAssignment.section.trim().toUpperCase() &&
            c.faculty_id === newAssignment.faculty_id
    );
    const assignmentDuplicate = sectionTaken || facultyAlreadyOnSection;

    const openAssignModal = () => {
        setNewAssignment({ master_course_id: '', section: '', faculty_id: '' });
        setAssignModalOpen(true);
    };
    const closeAssignModal = () => setAssignModalOpen(false);

    // Group courseList by faculty_id so we can render one card per teacher
    const facultyGroups = useMemo(() => {
        const map = new Map();
        courseList.forEach(c => {
            const fid = c.faculty_id || '__unassigned__';
            if (!map.has(fid)) {
                const fac = facultyList.find(f => f.faculty_id === c.faculty_id);
                map.set(fid, {
                    faculty_id: fid,
                    name: fac ? `${fac.first_name} ${fac.last_name}` : (c.faculty_name || '—'),
                    employment_type: fac?.employment_type || null,
                    is_active: fac?.is_active ?? true,
                    assignments: [],
                });
            }
            map.get(fid).assignments.push(c);
        });
        // Sort by last name
        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [courseList, facultyList]);


    // AG Grid: column definitions for Faculty tab
    const facultyColumnDefs = useMemo(() => [
        {
            field: 'emp_id',
            headerName: 'Emp ID',
            flex: 1,
            editable: true,
            singleClickEdit: false,
            cellStyle: (params) => ({
                fontFamily: 'monospace',
                color: params.value ? 'var(--primary-600)' : 'var(--neutral-500)',
                fontStyle: params.value ? 'normal' : 'italic',
                fontWeight: params.value ? '700' : '400'
            }),
            valueFormatter: (params) => params.value || 'Double-click to set',
            tooltipValueGetter: () => 'Any format accepted — type freely (e.g. 2024-001, EMP-42, T123)',
        },
        { field: 'first_name', headerName: 'First Name', flex: 1, editable: false },
        { field: 'last_name', headerName: 'Last Name', flex: 1, editable: false },
        {
            field: 'email',
            headerName: 'Email',
            flex: 2,
            editable: false,
            cellStyle: { color: 'var(--neutral-500)' },
        },
        {
            field: 'employment_type',
            headerName: 'Employment Type',
            flex: 1,
            editable: true,
            singleClickEdit: false,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: { values: ['Full Time', 'Part Time'] },
            suppressKeyboardEvent: (params) => params.editing && ['Tab', 'Enter', 'ArrowDown', 'ArrowUp'].includes(params.event.key),
            valueFormatter: (params) => params.value || 'Double-click to set',
            cellStyle: (params) => ({
                color: params.value ? 'var(--neutral-900)' : 'var(--neutral-500)',
                fontStyle: params.value ? 'normal' : 'italic',
                fontWeight: '500'
            }),
        },
        {
            field: 'is_active',
            headerName: 'Status',
            flex: 1,
            editable: true,
            singleClickEdit: false,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: { values: ['Active', 'Inactive'] },
            suppressKeyboardEvent: (params) => params.editing && ['Tab', 'Enter', 'ArrowDown', 'ArrowUp'].includes(params.event.key),
            valueGetter: (params) => params.data.is_active ? 'Active' : 'Inactive',
            valueSetter: (params) => {
                params.data.is_active = params.newValue === 'Active';
                return true;
            },
            cellRenderer: (params) => (
                <span className={`font-bold text-xs px-2 py-0.5 rounded-full border ${params.value === 'Active'
                    ? 'bg-success/10 text-success border-success/20'
                    : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                    }`}>
                    {params.value}
                </span>
            ),
        },
    ], []);


    // AG Grid: column definitions for Course Catalog
    const catalogColumnDefs = useMemo(() => [
        {
            field: 'course_code',
            headerName: 'Code',
            width: 110,
            cellRenderer: params => (
                <span className="font-mono text-primary-600 font-bold bg-primary-50/50 px-2 py-0.5">
                    {params.value}
                </span>
            )
        },
        {
            field: 'course_name',
            headerName: 'Course Name',
            flex: 2,
            cellStyle: { fontWeight: 500 }
        },
        {
            field: 'semester',
            headerName: 'Semester',
            width: 130,
            cellRenderer: params => <span className="text-neutral-500 text-xs font-medium">{params.value || '—'}</span>
        },
        {
            field: 'is_active',
            headerName: 'Status',
            width: 120,
            editable: true,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: { values: ['Active', 'Inactive'] },
            valueGetter: (params) => params.data.is_active ? 'Active' : 'Inactive',
            valueSetter: (params) => {
                params.data.is_active = params.newValue === 'Active';
                return true;
            },
            cellRenderer: (params) => (
                <span className={`font-bold text-xs px-2 py-0.5 rounded-full border ${params.value === 'Active'
                    ? 'bg-success/10 text-success border-success/20'
                    : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                    }`}>
                    {params.value}
                </span>
            ),
        },
    ], []);

    const handleFacultyCellValueChanged = (event) => {
        const { data, colDef, newValue, oldValue } = event;
        const field = colDef.field;
        const value = field === 'is_active' ? data.is_active : newValue;
        handleUpdateFacultyField(data.faculty_id, field, value, oldValue);
    };

    const handleCatalogCellValueChanged = (event) => {
        const { data, colDef, newValue, oldValue } = event;
        const field = colDef.field;
        const value = field === 'is_active' ? data.is_active : newValue;
        handleUpdateMasterCourseField(data.id, field, value, oldValue);
    };

    // AG Grid: column definitions for Templates tab
    const certificateColumnDefs = useMemo(() => [
        {
            field: 'name',
            headerName: 'Template Name',
            flex: 2,
            cellRenderer: (params) => (
                <span className="font-bold text-primary-600">{params.value}</span>
            )
        },
        { field: 'category', headerName: 'System Category', flex: 1.5, valueFormatter: params => params.value || 'General' },
        { field: 'academicYear', headerName: 'Academic Year', flex: 1, valueFormatter: params => params.value || 'N/A' },
        { field: 'semester', headerName: 'Semester', flex: 1, valueFormatter: params => params.value || 'N/A' },
        {
            field: 'isActive',
            headerName: 'Status',
            flex: 1,
            cellRenderer: (params) => (
                <span className={`font-bold text-xs px-2 py-0.5 rounded-full border ${params.value ? 'bg-success/10 text-success border-success/20' : 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>
                    {params.value ? 'Active' : 'Archived'}
                </span>
            )
        },
        {
            headerName: 'Actions',
            flex: 1.5,
            sortable: false,
            filter: false,
            cellRenderer: (params) => (
                <div className="flex items-center gap-2 mt-1.5">
                    <Button
                        variant="outline"
                        size="xs"
                        className="h-6 text-[10px] text-gold-600 border-gold-500 hover:bg-gold-500 font-bold shadow-none"
                        onClick={() => {
                            setSelectedTemplateForCalibration(params.data);
                            setIsCalibratorOpen(true);
                        }}
                    >
                        Calibrate
                    </Button>
                    <Button
                        variant="ghost"
                        size="xs"
                        className={`h-6 text-[10px] font-bold ${params.data.isActive ? 'text-neutral-500 hover:text-destructive hover:bg-destructive/10' : 'text-success hover:text-success hover:bg-success/10'}`}
                        onClick={() => archiveTemplate(params.data.id, !params.data.isActive)}
                    >
                        {params.data.isActive ? 'Archive' : 'Restore'}
                    </Button>
                </div>
            )
        }
    ], [archiveTemplate]);

    const generalColumnDefs = useMemo(() => [
        {
            field: 'name',
            headerName: 'Template Name',
            flex: 2,
            cellRenderer: (params) => (
                <span className="font-bold text-primary-600">{params.value}</span>
            )
        },
        { field: 'category', headerName: 'System Category', flex: 1.5, valueFormatter: params => params.value || 'General' },
        { field: 'academicYear', headerName: 'Academic Year', flex: 1, valueFormatter: params => params.value || 'N/A' },
        { field: 'semester', headerName: 'Semester', flex: 1, valueFormatter: params => params.value || 'N/A' },
        {
            field: 'isActive',
            headerName: 'Status',
            flex: 1,
            cellRenderer: (params) => (
                <span className={`font-bold text-xs px-2 py-0.5 rounded-full border ${params.value ? 'bg-success/10 text-success border-success/20' : 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>
                    {params.value ? 'Active' : 'Archived'}
                </span>
            )
        },
        {
            headerName: 'Action',
            flex: 1.5,
            sortable: false,
            filter: false,
            cellRenderer: (params) => (
                <div className="flex items-center gap-2 mt-1.5">
                    <Button
                        variant="ghost"
                        size="xs"
                        className={`h-6 text-[10px] font-bold ${params.data.isActive ? 'text-neutral-500 hover:text-destructive hover:bg-destructive/10' : 'text-success hover:text-success hover:bg-success/10'}`}
                        onClick={() => archiveTemplate(params.data.id, !params.data.isActive)}
                    >
                        {params.data.isActive ? 'Archive' : 'Restore'}
                    </Button>
                </div>
            )
        }
    ], [archiveTemplate]);


    // Uptime tracking
    const [uptimeSeconds, setUptimeSeconds] = useState(0);
    React.useEffect(() => {
        const key = 'isams_admin_session_start';
        if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, Date.now().toString());
        }
        const tick = setInterval(() => {
            const start = parseInt(sessionStorage.getItem(key) || Date.now().toString(), 10);
            setUptimeSeconds(Math.floor((Date.now() - start) / 1000));
        }, 1000);
        return () => clearInterval(tick);
    }, []);

    const formatUptime = (secs) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        if (h > 0) return `${h}h ${m}m ${s}s`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };

    // Course Form State
    // Course Form State - Initialize dropdowns as undefined! (Department removed)
    const [newCourse, setNewCourse] = useState({
        code: '', name: '', section: '', semester: '', academic_year: '', faculty_id: '',
    });


    // Regex validators / sanitizers
    const sanitizeCode = (val) => val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const sanitizeName = (val) => val.replace(/[^A-Za-z0-9 ]/g, '');
    const sanitizeSection = (val) => val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 2);


    // Sequential unlock derived booleans
    const codeValid = newCourse.code.length >= 3;
    const nameValid = newCourse.name.trim().length > 0;
    const sectionValid = newCourse.section.length >= 1;
    const facultyValid = !!newCourse.faculty_id;
    const semValid = (newCourse.semester || '').trim().length > 0;

    // Duplicate guard: block add if (code + section + semester) already exists
    const isDuplicate = semValid && courseList.some(
        c => c.course_code === newCourse.code &&
            (c.section || '').toUpperCase() === newCourse.section.toUpperCase() &&
            c.semester === newCourse.semester
    );

    const canSubmit = codeValid && nameValid && sectionValid && facultyValid && semValid && !isDuplicate;

    // Reset helpers
    const resetAll = () => setNewCourse({ code: '', name: '', section: '', semester: '', academic_year: '', faculty_id: '' });
    const resetSectionOnly = () => setNewCourse(prev => ({ ...prev, section: '', faculty_id: '', semester: '' }));

    // -- State for General Settings --
    const [deadlineDays, setDeadlineDays] = useState('');
    const [graceDays, setGraceDays] = useState('');
    const [mainGdriveLink, setMainGdriveLink] = useState('');
    const [autoReminders, setAutoReminders] = useState('3days');
    const [archiveRetention, setArchiveRetention] = useState('5years');
    const [isGdriveUnlocked, setIsGdriveUnlocked] = useState(false);

    // -- UI STATE FOR NON-OCR SETTINGS --
    // (Removed global valRules, now per Document Type)

    // ── Validation Rules State ─────────────────────────────────────────────
    const [selectedDocTypeId, setSelectedDocTypeId] = useState(null);
    const [docRules, setDocRules] = useState({
        required_keywords: '',
        forbidden_keywords: '',
        allowed_extensions: '.pdf',
        max_file_size_mb: '',
        min_word_count: 0
    });
    const [newKeyword, setNewKeyword] = useState('');
    const [newForbidden, setNewForbidden] = useState('');
    const [rulesLoading, setRulesLoading] = useState(false);

    // Auto-select first doc type if not selected
    useEffect(() => {
        if (!selectedDocTypeId && docRequirements.length > 0) {
            setSelectedDocTypeId(docRequirements[0].id);
        }
    }, [docRequirements, selectedDocTypeId]);

    // Fetch rules when type changes
    useEffect(() => {
        let mounted = true;
        if (!selectedDocTypeId) return;
        setRulesLoading(true);
        fetchDocTypeRules(selectedDocTypeId).then(rules => {
            if (mounted && rules) {
                setDocRules({
                    ...rules,
                    required_keywords: (rules.required_keywords || []).join(', '),
                    forbidden_keywords: (rules.forbidden_keywords || []).join(', '),
                    allowed_extensions: (rules.allowed_extensions || []).join(', '),
                });
            }
            if (mounted) setRulesLoading(false);
        });
        return () => mounted = false;
    }, [selectedDocTypeId]);

    const handleSaveRules = async () => {
        if (!selectedDocTypeId) return;

        const payload = {
            ...docRules,
            required_keywords: typeof docRules.required_keywords === 'string'
                ? docRules.required_keywords.split(',').map(k => k.trim()).filter(Boolean)
                : docRules.required_keywords,
            forbidden_keywords: typeof docRules.forbidden_keywords === 'string'
                ? docRules.forbidden_keywords.split(',').map(k => k.trim()).filter(Boolean)
                : docRules.forbidden_keywords,
            allowed_extensions: typeof docRules.allowed_extensions === 'string'
                ? docRules.allowed_extensions.split(/[,\s]+/).map(k => k.trim()).filter(Boolean)
                : docRules.allowed_extensions
        };

        await saveDocTypeRules(selectedDocTypeId, payload);
    };

    // Sync state with loaded settings
    React.useEffect(() => {
        if (settings && Object.keys(settings).length > 0) {
            setDeadlineDays(settings.general_default_deadline || '');
            setGraceDays(settings.general_grace_period || '');
            setAutoReminders(settings.general_auto_reminders || '3days');
            setArchiveRetention(settings.general_archive_retention || '5years');

            // GDrive: stored as folder ID in DB — reconstruct display URL only if it's a raw ID
            const mainId = settings.gdrive_main_folder_id || '';
            const isRawMainId = mainId && !mainId.includes('/');
            setMainGdriveLink(isRawMainId ? `https://drive.google.com/drive/folders/${mainId}` : mainId);
        }
    }, [settings]);


    // Danger Zone Action Handler
    const handleDangerAction = (actionType, payload = null) => {
        const config = { actionType, payload };

        switch (actionType) {
            case 'RESET_SEMESTER':
                config.title = 'Reset Semester Data';
                config.description = `WARNING: Are you sure you want to RESET the ${settings.current_semester} of ${settings.current_academic_year}? This will delete all faculty submissions, but keep the faculty and course lists intact.`;
                config.confirmationText = 'RESET';
                break;
            case 'PURGE_ARCHIVES':
                config.title = 'Purge Old Archives';
                config.description = `CRITICAL WARNING: This will permanently data older than ${settings.general_archive_retention}. This action CANNOT BE UNDONE.`;
                config.confirmationText = 'PURGE';
                break;
            default:
                return;
        }

        setDangerModalConfig(config);
        setDangerModalInput('');
        setIsDangerModalOpen(true);
    };

    const executeDangerAction = async () => {
        const { actionType, payload } = dangerModalConfig;
        let func = null;

        if (actionType === 'RESET_SEMESTER') {
            func = () => settingsService.resetSemester(settings.current_semester, settings.current_academic_year);
        } else if (actionType === 'PURGE_ARCHIVES') {
            func = () => settingsService.purgeArchives(parseInt(settings.general_archive_retention) || 5);
        } else {
            return;
        }

        setIsDangerModalOpen(false);

        try {
            await func();

            setSuccess("Action completed successfully.");
            setTimeout(() => setSuccess(null), 4000);
            refresh();
        } catch (err) {
            setError("Action failed: " + err.message);
            setTimeout(() => setError(null), 4000);
        }
    };


    return (
        <ToastProvider>
            <AdminToastHandler success={success} error={error} />
            <div className="space-y-6 flex flex-col h-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900">System Settings</h1>
                        <p className="text-neutral-500 text-sm">Configure automation, validation rules, and system preferences</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refresh}
                        disabled={loading}
                        className="bg-primary-500 border-primary-500 text-neutral-50 hover:bg-primary-600 hover:text-neutral-50 shadow-sm"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Reload Settings
                    </Button>
                </div>

                {/* TABS ORGANIZATION */}
                <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0 space-y-6">
                    <div className="shrink-0 border-b border-neutral-200 pb-0">
                        <TabsList className="bg-transparent p-0 h-auto space-x-6 w-full justify-start rounded-none border-none">
                            <TabItem value="general" label="General" icon={Settings} />
                            <TabItem value="courses" label="Courses" icon={BookOpen} />
                            <TabItem value="faculty" label="Faculty" icon={Users} />
                            <TabItem value="doc_types" label="Document Types" icon={Folder} />
                            <TabItem value="validation" label="Validation Rules" icon={Shield} />
                            <TabItem value="ocr" label="OCR & AI" icon={Cpu} />
                            <TabItem value="templates" label="Templates" icon={LayoutTemplate} />
                            <TabItem value="scheduling" label="Scheduling" icon={Clock} />
                            <TabItem value="maintenance" label="Maintenance" icon={Database} />
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-auto pr-2">
                        {/* TAB 1: GENERAL PREFERENCES & INFO */}
                        <TabsContent value="general" className="mt-0 space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                {/* Left Col: Preferences */}
                                <div className="lg:col-span-2 space-y-6">
                                    <Card className="bg-white border-neutral-200 shadow-sm">
                                        <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-4">
                                            <CardTitle className="text-base text-neutral-900 flex items-center gap-2">
                                                <Globe className="h-4 w-4 text-primary-600" /> Global Defaults
                                            </CardTitle>
                                            <CardDescription className="text-neutral-500">Set default behaviors for new semesters</CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-6 space-y-6">
                                            {/* INPUTS */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                                {/* Deadline Input */}
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold text-neutral-500 uppercase">Default Deadline (Days)</Label>
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            value={deadlineDays}
                                                            onChange={(e) => setDeadlineDays(e.target.value)}
                                                            className="bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-primary-500 focus-visible:border-primary-500 transition-all font-medium pr-4"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Grace Period Input */}
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold text-neutral-500 uppercase">Grace Period (Days)</Label>
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            value={graceDays}
                                                            onChange={(e) => setGraceDays(e.target.value)}
                                                            className="bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-primary-500 focus-visible:border-primary-500 transition-all font-medium pr-4"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold text-neutral-500 uppercase">Auto-Reminders</Label>
                                                    <Select value={autoReminders} onValueChange={setAutoReminders}>
                                                        <SelectTrigger className="bg-white border-neutral-200 text-neutral-900 shadow-sm focus:ring-primary/20">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white border-neutral-200 text-neutral-900">
                                                            <SelectItem value="3days">3 days before deadline</SelectItem>
                                                            <SelectItem value="7days">7 days before deadline</SelectItem>
                                                            <SelectItem value="disabled">Disabled</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold text-neutral-500 uppercase">Archive Retention</Label>
                                                    <Select value={archiveRetention} onValueChange={setArchiveRetention}>
                                                        <SelectTrigger className="bg-white border-neutral-200 text-neutral-900 shadow-sm focus:ring-primary/20">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white border-neutral-200 text-neutral-900">
                                                            <SelectItem value="3years">3 Years</SelectItem>
                                                            <SelectItem value="5years">5 Years</SelectItem>
                                                            <SelectItem value="permanent">Permanent</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-neutral-100 flex justify-end">
                                                <Button
                                                    variant="default"
                                                    className="shadow-sm active:scale-95 transition-all"
                                                    onClick={() => saveGroup({
                                                        general_default_deadline: deadlineDays,
                                                        general_grace_period: graceDays,
                                                        general_auto_reminders: autoReminders,
                                                        general_archive_retention: archiveRetention,
                                                    })}
                                                >
                                                    <Save className="mr-2 h-4 w-4" /> Save Changes
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Google Drive Folder */}
                                    <Card className="bg-white border-neutral-200 shadow-sm">
                                        <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-4">
                                            <CardTitle className="text-base text-neutral-900 flex items-center gap-2">
                                                <HardDrive className="h-4 w-4 text-primary-600" /> GDrive Management
                                            </CardTitle>
                                            <CardDescription className="text-neutral-500">Provide one parent folder; we'll handle the sub-folders automatically.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-6 space-y-6">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold text-neutral-500 uppercase flex items-center gap-2">
                                                        Main ISAMS GDrive Folder Link
                                                        {settings.gdrive_main_folder_id && (
                                                            <Badge variant="outline" className="text-[10px] h-4 bg-success/10 text-success border-success/20 py-0">Connected</Badge>
                                                        )}
                                                    </Label>
                                                    <Input
                                                        id="main-gdrive-link"
                                                        placeholder="https://drive.google.com/drive/folders/..."
                                                        value={mainGdriveLink}
                                                        onChange={(e) => setMainGdriveLink(e.target.value)}
                                                        disabled={!!settings.gdrive_main_folder_id && !isGdriveUnlocked}
                                                        className={`bg-white border-neutral-200 text-neutral-900 focus-visible:border-primary focus-visible:ring-primary/20 h-10 shadow-sm ${!!settings.gdrive_main_folder_id && !isGdriveUnlocked ? 'bg-neutral-50 text-neutral-500 cursor-not-allowed' : ''}`}
                                                    />
                                                </div>

                                                {(mainGdriveLink || settings.gdrive_root_folder_id) && (
                                                    <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200 space-y-2">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-neutral-500 italic">Target Infrastructure:</span>
                                                            <span className="text-primary font-mono text-[10px] font-bold">
                                                                {(() => {
                                                                    const match = mainGdriveLink.match(/folders\/([a-zA-Z0-9_-]+)/);
                                                                    return match ? match[1] : (settings.gdrive_main_folder_id || 'Not Set');
                                                                })()}
                                                            </span>
                                                        </div>

                                                        {settings.gdrive_root_folder_id && (
                                                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-200">
                                                                <div className="space-y-1">
                                                                    <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Official Vault</p>
                                                                    <p className="text-[11px] text-success font-mono font-bold truncate">{settings.gdrive_root_folder_id}</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Staging Sandbox</p>
                                                                    <p className="text-[11px] text-warning font-mono font-bold truncate">{settings.gdrive_staging_folder_id}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between gap-4 pt-2">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-neutral-500 hover:text-primary hover:bg-primary/10 transition-colors"
                                                        onClick={() => window.open('/api/auth', '_blank')}
                                                    >
                                                        <RefreshCw className="mr-2 h-3 w-3" /> Refresh Auth
                                                    </Button>

                                                    {settings.gdrive_main_folder_id && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className={`transition-colors text-[11px] h-8 ${isGdriveUnlocked
                                                                ? "text-warning hover:text-warning hover:bg-warning/10"
                                                                : "text-neutral-500 hover:text-success hover:bg-success/10"
                                                                }`}
                                                            onClick={() => setIsGdriveUnlocked(!isGdriveUnlocked)}
                                                        >
                                                            {isGdriveUnlocked ? <Lock className="mr-2 h-3 w-3" /> : <Unlock className="mr-2 h-3 w-3" />}
                                                            {isGdriveUnlocked ? "Lock Settings" : "Change Folder"}
                                                        </Button>
                                                    )}
                                                </div>

                                                <Button
                                                    size="sm"
                                                    variant={settings.gdrive_root_folder_id && !isGdriveUnlocked ? "outline" : "default"}
                                                    className={`${settings.gdrive_root_folder_id && !isGdriveUnlocked
                                                        ? "bg-neutral-50 text-neutral-400 cursor-not-allowed border-neutral-200 shadow-none"
                                                        : "shadow-sm"
                                                        } px-6 transition-all active:scale-95`}
                                                    disabled={processing || (!!settings.gdrive_root_folder_id && !isGdriveUnlocked)}
                                                    onClick={async () => {
                                                        const match = mainGdriveLink.match(/folders\/([a-zA-Z0-9_-]+)/);
                                                        const mainId = match ? match[1] : mainGdriveLink.trim();

                                                        if (!mainId) {
                                                            alert("Please provide a valid Google Drive folder ID or link.");
                                                            return;
                                                        }

                                                        try {
                                                            setSuccess("Initializing folders...");
                                                            const response = await fetch('/api/folders/init-isams', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ mainFolderId: mainId })
                                                            });
                                                            const data = await response.json();

                                                            if (!response.ok) throw new Error(data.error);

                                                            await saveGroup({
                                                                gdrive_main_folder_id: mainId,
                                                                gdrive_root_folder_id: data.vaultId,
                                                                gdrive_staging_folder_id: data.sandboxId
                                                            });

                                                            setSuccess("GDrive Structure Initialized & Saved!");
                                                            setIsGdriveUnlocked(false);
                                                        } catch (err) {
                                                            setError("Setup failed: " + err.message);
                                                        }
                                                    }}
                                                >
                                                    {processing ? (
                                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        settings.gdrive_root_folder_id && !isGdriveUnlocked ? <Lock className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />
                                                    )}
                                                    {settings.gdrive_root_folder_id && !isGdriveUnlocked ? "Config Locked" : "Initialize & Save Config"}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Right Col: System Info */}
                                <div className="space-y-6">
                                    <Card className="bg-white border-neutral-200 shadow-sm">
                                        <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-4">
                                            <CardTitle className="text-base text-neutral-900 flex items-center gap-2">
                                                <Server className="h-4 w-4 text-primary-600" /> System Status
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6 space-y-4">

                                            {/* Operational Status Box */}
                                            {(() => {
                                                const isHealthy = !!systemHealth?.db_size;
                                                return (
                                                    <div className={`rounded-xl border p-4 space-y-3 transition-all duration-500 ${isHealthy
                                                        ? 'border-success/30 bg-success/5'
                                                        : 'border-destructive/30 bg-destructive/5'
                                                        }`}>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Operational Status</span>
                                                            <span className={`flex items-center gap-1.5 text-xs font-bold ${isHealthy ? 'text-success' : 'text-destructive'}`}>
                                                                <span className={`inline-block h-2 w-2 rounded-full animate-pulse ${isHealthy ? 'bg-success' : 'bg-destructive'}`} />
                                                                {isHealthy ? 'All Systems Go' : 'Degraded'}
                                                            </span>
                                                        </div>

                                                        <div className="space-y-2">
                                                            {/* Database row */}
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 text-sm text-neutral-600 font-medium">
                                                                    {isHealthy
                                                                        ? <Wifi className="h-4 w-4 text-success" />
                                                                        : <WifiOff className="h-4 w-4 text-destructive" />
                                                                    }
                                                                    <span>Database</span>
                                                                </div>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isHealthy
                                                                    ? 'bg-success/10 text-success border border-success/20'
                                                                    : 'bg-destructive/10 text-destructive border border-destructive/20'
                                                                    }`}>
                                                                    {isHealthy ? 'HEALTHY' : 'UNREACHABLE'}
                                                                </span>
                                                            </div>

                                                            {/* Operational Time row */}
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 text-sm text-neutral-600 font-medium">
                                                                    <Clock className="h-4 w-4 text-info" />
                                                                    <span>Operational Time</span>
                                                                </div>
                                                                <span className="text-xs font-mono font-bold text-neutral-900">
                                                                    {formatUptime(uptimeSeconds)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            <div className="space-y-1 pt-2">
                                                <InfoRow label="Version" value="ISAMS v1.0.0" />
                                                <InfoRow label="Last Backup" value={systemHealth?.last_backup ? new Date(systemHealth.last_backup).toLocaleString() : "Never"} />
                                                <InfoRow label="DB Size" value={systemHealth?.db_size || "Unknown"} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB: COURSE MANAGEMENT */}
                        <TabsContent value="courses" className="mt-0 space-y-6">

                            {/* ── Card 1: Course Catalog ──────────────────────────────── */}
                            <Card className="bg-white border-neutral-200 shadow-sm">
                                <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-4">
                                    <CardTitle className="text-base text-neutral-900 flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-primary-600" /> Course Catalog
                                    </CardTitle>
                                    <CardDescription className="text-neutral-500">
                                        Master list of courses offered. Add a course here first — sections are assigned below.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    {/* Add-to-catalog form */}
                                    <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-xl">
                                        <div className="grid grid-cols-12 gap-4 items-end">
                                            {/* Code */}
                                            <div className="col-span-2 space-y-1.5">
                                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Code *</label>
                                                <Input
                                                    placeholder="e.g. IT101"
                                                    value={newCatalog.code}
                                                    onChange={e => setNewCatalog(p => ({ ...p, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
                                                    maxLength={10}
                                                    className="bg-white border-neutral-200 text-neutral-900 font-mono shadow-sm focus-visible:ring-primary-500 focus-visible:border-primary-500"
                                                />
                                            </div>
                                            {/* Name */}
                                            <div className="col-span-5 space-y-1.5">
                                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Course Name *</label>
                                                <Input
                                                    placeholder="e.g. Networking 1"
                                                    value={newCatalog.name}
                                                    onChange={e => setNewCatalog(p => ({ ...p, name: e.target.value }))}
                                                    disabled={!catalogCodeValid}
                                                    className="bg-white border-neutral-200 text-neutral-900 shadow-sm disabled:bg-neutral-100 disabled:text-neutral-400 focus-visible:ring-primary-500 focus-visible:border-primary-500"
                                                />
                                            </div>
                                            {/* Semester */}
                                            <div className="col-span-3 space-y-1.5">
                                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Semester *</label>
                                                <Select
                                                    value={newCatalog.semester}
                                                    onValueChange={v => setNewCatalog(p => ({ ...p, semester: v }))}
                                                    disabled={!catalogCodeValid || !catalogNameValid}
                                                >
                                                    <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm disabled:bg-neutral-100 focus:ring-primary-500">
                                                        <SelectValue placeholder="Pick semester" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white border-neutral-200 text-neutral-900">
                                                        <SelectItem value="1st Sem">1st Semester</SelectItem>
                                                        <SelectItem value="2nd Sem">2nd Semester</SelectItem>
                                                        <SelectItem value="Summer">Summer</SelectItem>
                                                        <SelectItem value="Mid-Year">Mid-Year</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {/* Add button */}
                                            <div className="col-span-2">
                                                <Button
                                                    className="w-full"
                                                    disabled={!canAddCatalog}
                                                    onClick={async () => {
                                                        const ok = await handleAddMasterCourse(newCatalog.code, newCatalog.name, newCatalog.semester);
                                                        if (ok) setNewCatalog(p => ({ ...p, code: '', name: '' }));
                                                    }}
                                                >
                                                    <Plus className="h-4 w-4 mr-1" /> Add
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Inline catalog duplicate warning */}
                                    {catalogCodeTaken && (
                                        <div className="flex items-center gap-2 bg-warning/10 border border-warning/20 text-warning px-3 py-2 rounded-lg text-xs font-medium">
                                            <AlertTriangle className="h-4 w-4 shrink-0" />
                                            <p>{catalogConflictType} "{catalogConflictType === 'Code' ? newCatalog.code.toUpperCase() : newCatalog.name}" already exists in {existingCatalogEntry?.semester || 'another semester'}. Each course must be unique.</p>
                                        </div>
                                    )}

                                    {/* Catalog grid (USING THE NEW DATATABLE WRAPPER) */}
                                    <DataTable
                                        rowData={masterCourseList}
                                        columnDefs={catalogColumnDefs}
                                        getRowId={p => String(p.data.id)}
                                        onCellValueChanged={handleCatalogCellValueChanged}
                                        overlayNoRowsTemplate='<span style="color:var(--neutral-500);font-style:italic">No catalog entries yet. Add a course above.</span>'
                                        height="320px"
                                    />
                                </CardContent>
                            </Card>

                            {/* ── Card 2: Faculty Course Assignments ───────────────────── */}
                            <Card className="bg-white border-neutral-200 shadow-sm">
                                <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base text-neutral-900 flex items-center gap-2">
                                                <Users className="h-4 w-4 text-primary-600" /> Faculty Course Assignments
                                            </CardTitle>
                                            <CardDescription className="text-neutral-500 mt-1">
                                                Overview of all faculty course loads. Assign a new section via the button.
                                            </CardDescription>
                                        </div>
                                        <Button onClick={openAssignModal} className="shrink-0">
                                            <Plus className="h-4 w-4 mr-2" /> Assign Faculty
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {facultyGroups.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center bg-neutral-50 border border-dashed border-neutral-200 rounded-xl">
                                            <div className="p-4 rounded-full bg-white border border-neutral-100 shadow-sm mb-4">
                                                <Users className="h-8 w-8 text-neutral-300" />
                                            </div>
                                            <p className="text-neutral-900 font-bold">No assignments yet</p>
                                            <p className="text-neutral-500 text-sm mt-1">Click "Assign Faculty" to distribute course sections.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                            {facultyGroups.map(group => {
                                                const initials = group.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                                                return (
                                                    <div
                                                        key={group.faculty_id}
                                                        className="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:border-primary-400 hover:shadow-md transition-all group"
                                                    >
                                                        {/* Faculty header */}
                                                        <div className="flex items-center gap-4 px-5 py-4 border-b border-neutral-100 bg-neutral-50/50">
                                                            <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-bold border border-primary-200 shadow-sm">
                                                                {initials}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-neutral-900 font-bold text-sm truncate flex items-center gap-2">
                                                                    {group.name}
                                                                    {!group.is_active && (
                                                                        <Badge variant="outline" className="text-[10px] bg-neutral-100 text-neutral-500 border-neutral-200 px-1.5 py-0 uppercase">Inactive</Badge>
                                                                    )}
                                                                </p>
                                                                {group.employment_type && (
                                                                    <p className="text-xs text-neutral-500 font-medium">{group.employment_type}</p>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                {(() => {
                                                                    const uniqueCourses = new Set(group.assignments.map(a => String(a.master_course_id || a.course_code))).size;
                                                                    const totalSections = group.assignments.length;
                                                                    return (
                                                                        <>
                                                                            <Badge variant="outline" className="border-neutral-200 text-neutral-600 bg-white shadow-sm text-[11px] px-2 py-0 h-5">
                                                                                {uniqueCourses} {uniqueCourses === 1 ? 'course' : 'courses'}
                                                                            </Badge>
                                                                            <Badge variant="outline" className="border-primary-200 text-primary-600 bg-primary-50 shadow-sm text-[11px] px-2 py-0 h-5">
                                                                                {totalSections} {totalSections === 1 ? 'section' : 'sections'}
                                                                            </Badge>
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>

                                                        {/* Course rows */}
                                                        <div className="divide-y divide-neutral-100">
                                                            {group.assignments.map(asgn => {
                                                                // Cross-reference with master catalog to check if the course is active
                                                                const masterCourse = masterCourseList.find(
                                                                    mc => mc.id === asgn.master_course_id || mc.course_code === asgn.course_code
                                                                );
                                                                const isCourseActive = masterCourse ? masterCourse.is_active !== false : true;

                                                                return (
                                                                    <div
                                                                        key={asgn.course_id}
                                                                        className="flex items-center gap-4 px-5 py-3 hover:bg-neutral-50 transition-colors group/row"
                                                                    >
                                                                        {/* Course Code (Greys out if inactive) */}
                                                                        <span className={`font-mono text-[11px] w-14 shrink-0 px-2 py-0.5 rounded border ${isCourseActive
                                                                            ? 'text-primary-600 font-bold bg-primary-50/50 border-primary-100'
                                                                            : 'text-neutral-500 font-medium bg-neutral-100 border-neutral-200'
                                                                            }`}>
                                                                            {asgn.course_code}
                                                                        </span>

                                                                        {/* Course Name with Inactive Badge */}
                                                                        <div className="flex-1 flex items-center gap-2 min-w-0">
                                                                            <span className={`font-medium text-sm truncate ${isCourseActive ? 'text-neutral-900' : 'text-neutral-500 line-through decoration-neutral-300'
                                                                                }`}>
                                                                                {asgn.course_name}
                                                                            </span>
                                                                            {!isCourseActive && (
                                                                                <Badge variant="outline" className="text-[9px] bg-neutral-100 text-neutral-500 border-neutral-200 px-1.5 py-0 uppercase shrink-0">
                                                                                    Inactive
                                                                                </Badge>
                                                                            )}
                                                                        </div>

                                                                        <div className="flex items-center gap-3 shrink-0 ml-auto">
                                                                            <span className={`text-[11px] font-bold border shadow-sm rounded-md px-2 py-0.5 ${isCourseActive ? 'bg-white text-neutral-700 border-neutral-200' : 'bg-neutral-50 text-neutral-400 border-neutral-100'
                                                                                }`}>
                                                                                Sec {asgn.section || '—'}
                                                                            </span>

                                                                            <span className="text-[11px] text-neutral-500 font-medium w-12 text-right hidden sm:block">
                                                                                {asgn.semester || '—'}
                                                                            </span>

                                                                            <div className="flex justify-end min-w-[32px] transition-all duration-200">
                                                                                {pendingDeleteId === asgn.course_id ? (
                                                                                    <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
                                                                                        <Button
                                                                                            size="xs"
                                                                                            variant="destructive"
                                                                                            onClick={() => { setPendingDeleteId(null); handleDeleteCourse(asgn.course_id); }}
                                                                                        >
                                                                                            Confirm
                                                                                        </Button>
                                                                                        <Button
                                                                                            size="xs"
                                                                                            variant="ghost"
                                                                                            onClick={() => setPendingDeleteId(null)}
                                                                                            className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                                                                                        >
                                                                                            Cancel
                                                                                        </Button>
                                                                                    </div>
                                                                                ) : (
                                                                                    <Button
                                                                                        size="icon-xs"
                                                                                        variant="ghost"
                                                                                        onClick={() => setPendingDeleteId(asgn.course_id)}
                                                                                        className="text-neutral-400 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover/row:opacity-100 transition-all"
                                                                                        title="Remove assignment"
                                                                                    >
                                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                                    </Button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* ── Assign Faculty Modal ────*/}
                            <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
                                <DialogContent className="bg-white border-neutral-200 text-neutral-900 max-w-lg shadow-xl" showCloseButton={false}>
                                    <DialogHeader>
                                        <DialogTitle className="text-neutral-900 flex items-center gap-2">
                                            <Users className="h-5 w-5 text-primary-600" />
                                            Assign Faculty to Course
                                        </DialogTitle>
                                        <DialogDescription className="text-neutral-500">
                                            Select a course from the catalog, pick a section letter, then choose the faculty member.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-4 py-2">
                                        {/* Course picker */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Course *</label>
                                            <Select
                                                value={String(newAssignment.master_course_id)}
                                                onValueChange={v => setNewAssignment(p => ({ ...p, master_course_id: v, section: '', faculty_id: '' }))}
                                            >
                                                <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm focus:ring-primary-500">
                                                    <SelectValue placeholder="Select a course from catalog…" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-neutral-200 text-neutral-900">
                                                    {masterCourseList.map(c => (
                                                        <SelectItem key={c.id} value={String(c.id)} disabled={!c.is_active} className={!c.is_active ? 'opacity-50' : ''}>
                                                            {c.course_code} – {c.course_name} ({c.semester})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Auto-filled info row */}
                                        {selectedCatalogEntry && (
                                            <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Course Name</label>
                                                    <div className="text-neutral-900 text-sm font-medium">{selectedCatalogEntry.course_name}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Semester</label>
                                                    <div className="text-neutral-700 text-sm font-mono">{selectedCatalogEntry.semester}</div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Section + Faculty row */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Section *</label>
                                                <Input
                                                    placeholder="A"
                                                    value={newAssignment.section}
                                                    onChange={e => setNewAssignment(p => ({ ...p, section: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 2) }))}
                                                    maxLength={2}
                                                    disabled={!newAssignment.master_course_id}
                                                    className="bg-white border-neutral-200 text-neutral-900 font-mono text-center disabled:bg-neutral-100 shadow-sm focus-visible:ring-primary-500"
                                                />
                                            </div>
                                            <div className="col-span-2 space-y-1.5">
                                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Faculty *</label>
                                                <Select
                                                    value={newAssignment.faculty_id}
                                                    onValueChange={v => setNewAssignment(p => ({ ...p, faculty_id: v }))}
                                                    disabled={!newAssignment.master_course_id}
                                                >
                                                    <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm disabled:bg-neutral-100 focus:ring-primary-500">
                                                        <SelectValue placeholder="Select faculty…" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white border-neutral-200 text-neutral-900">
                                                        {facultyList.filter(f => f.first_name && f.last_name).map(f => (
                                                            <SelectItem key={f.faculty_id} value={f.faculty_id} disabled={!f.is_active} className={!f.is_active ? 'opacity-50' : ''}>
                                                                {f.first_name} {f.last_name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Inline validation messages */}
                                        {facultyAlreadyOnSection && (
                                            <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 text-destructive mt-2">
                                                <AlertCircle className="h-4 w-4 shrink-0" />
                                                <p className="text-xs font-medium">This faculty is already assigned to {selectedCatalogEntry?.course_code} Section {newAssignment.section}.</p>
                                            </div>
                                        )}
                                        {!facultyAlreadyOnSection && sectionTaken && (
                                            <div className="flex items-center gap-2 bg-warning/10 border border-warning/20 rounded-lg px-3 py-2 text-warning mt-2">
                                                <AlertCircle className="h-4 w-4 shrink-0" />
                                                <p className="text-xs font-medium">{selectedCatalogEntry?.course_code} Section {newAssignment.section} is already assigned. Try a different section.</p>
                                            </div>
                                        )}
                                    </div>

                                    <DialogFooter className="mt-4 gap-2 sm:gap-3">
                                        <Button variant="outline" onClick={closeAssignModal} className="border-neutral-200 text-neutral-700 hover:bg-neutral-100">
                                            Cancel
                                        </Button>
                                        <Button
                                            disabled={!assignmentValid || assignmentDuplicate}
                                            onClick={async () => {
                                                const ok = await handleAddCourse({
                                                    master_course_id: Number(newAssignment.master_course_id),
                                                    faculty_id: newAssignment.faculty_id,
                                                    section: newAssignment.section,
                                                });
                                                if (ok) closeAssignModal();
                                            }}
                                        >
                                            <Plus className="h-4 w-4 mr-1" /> Assign Section
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </TabsContent>

                        {/* TAB: FACULTY MANAGEMENT */}
                        <TabsContent value="faculty" className="mt-0">
                            <Card className="bg-white border-neutral-200 shadow-sm">
                                <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-4">
                                    <CardTitle className="text-base text-neutral-900 flex items-center gap-2">
                                        <Users className="h-4 w-4 text-primary-600" /> Faculty Management
                                    </CardTitle>
                                    <CardDescription className="text-neutral-500">
                                        Double-click a cell to edit Emp ID, Employment Type, or Status. List updates automatically when permissions change.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <DataTable
                                        rowData={facultyList}
                                        columnDefs={facultyColumnDefs}
                                        getRowId={(params) => String(params.data.faculty_id)}
                                        onCellValueChanged={handleFacultyCellValueChanged}
                                        overlayNoRowsTemplate='<span style="color:var(--neutral-500);font-style:italic">No faculty records found.</span>'
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB: DOCUMENT TYPES */}
                        <TabsContent value="doc_types" className="mt-0">
                            <Card className="bg-white border-neutral-200 shadow-sm">
                                <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div>
                                            <CardTitle className="text-base text-neutral-900 flex items-center gap-2">
                                                <Folder className="h-4 w-4 text-primary-600" /> Document Requirements
                                            </CardTitle>
                                            <CardDescription className="text-neutral-500">Manage required submissions and their target folders</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    {/* Add New Form */}
                                    <div className="bg-neutral-50 p-5 rounded-xl border border-neutral-200 flex flex-col md:flex-row gap-4 items-start">
                                        {/* Requirement Name Column */}
                                        <div className="flex-1 space-y-1.5 w-full">
                                            <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Requirement Name *</Label>
                                            <Input
                                                placeholder="e.g. Quarterly Report"
                                                value={newReq.name}
                                                onChange={(e) => setNewReq({ ...newReq, name: e.target.value })}
                                                className={`bg-white border-neutral-200 text-neutral-900 focus-visible:ring-primary-500 shadow-sm ${isDuplicateRequirement ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
                                            />
                                            <div className="min-h-[1.25rem]">
                                                {isDuplicateRequirement && (
                                                    <p className="text-[10px] text-destructive font-medium italic flex items-center gap-1 mt-1 text-warning">
                                                        <AlertTriangle className="h-2.5 w-2.5" />
                                                        "{newReq.name}" is already a requirement.
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* GDrive Folder Name Column */}
                                        <div className="flex-1 space-y-1.5 w-full">
                                            <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">GDrive Folder Name *</Label>
                                            <Input
                                                placeholder="e.g. Reports_Q1"
                                                value={newReq.folder}
                                                disabled={!newReq.name.trim() || isDuplicateRequirement}
                                                onChange={(e) => setNewReq({ ...newReq, folder: e.target.value })}
                                                className={`bg-white border-neutral-200 text-neutral-900 focus-visible:ring-primary-500 shadow-sm disabled:bg-neutral-100 disabled:text-neutral-400 ${isDuplicateFolder ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
                                            />
                                            <div className="min-h-[1.25rem]">
                                                {isDuplicateFolder && (
                                                    <p className="text-[10px] text-destructive font-medium italic flex items-center gap-1 mt-1 text-warning">
                                                        <AlertTriangle className="h-2.5 w-2.5" />
                                                        Folder "/{newReq.folder}" is already in use.
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Required Checkbox Column */}
                                        <div className="w-auto shrink-0 space-y-1.5">
                                            <Label className="text-xs font-bold text-transparent select-none uppercase pointer-events-none">_</Label>
                                            <div className="h-9 flex items-center">
                                                <CheckboxItem
                                                    label="Required"
                                                    checked={newReq.required}
                                                    onChange={(c) => setNewReq({ ...newReq, required: c })}
                                                />
                                            </div>
                                            <div className="min-h-[1.25rem]" />
                                        </div>

                                        {/* Add Button Column */}
                                        <div className="w-auto shrink-0 space-y-1.5">
                                            <Label className="text-xs font-bold text-transparent select-none uppercase pointer-events-none">_</Label>
                                            <div className="h-9 flex items-center">
                                                <Button
                                                    className="w-full md:w-auto min-w-[80px]"
                                                    disabled={!canAddDocType}
                                                    onClick={() => {
                                                        if (canAddDocType) {
                                                            addDocRequirement(newReq);
                                                            setNewReq({ name: '', folder: '', required: true });
                                                        }
                                                    }}
                                                >
                                                    <Plus className="h-4 w-4 mr-1" /> Add
                                                </Button>
                                            </div>
                                            <div className="min-h-[1.25rem]" />
                                        </div>
                                    </div>

                                    {/* Card Grid */}
                                    {docRequirements.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 bg-neutral-50 border border-dashed border-neutral-200 rounded-xl">
                                            <div className="p-4 rounded-full bg-white border border-neutral-100 shadow-sm mb-4">
                                                <Folder className="h-8 w-8 text-neutral-300" />
                                            </div>
                                            <p className="text-neutral-900 font-bold">No document types configured</p>
                                            <p className="text-neutral-500 text-sm mt-1">Use the form above to add your first requirement</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                            {docRequirements.map(req => {
                                                const isActive = req.is_active !== false;
                                                return (
                                                    <div
                                                        key={req.id}
                                                        className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md group ${isActive
                                                            ? 'border-neutral-200 hover:border-primary-400'
                                                            : 'border-neutral-200 bg-neutral-50/50'
                                                            }`}
                                                    >
                                                        {/* Card Header */}
                                                        <div className={`flex items-start gap-4 px-5 py-4 border-b border-neutral-100 ${isActive ? 'bg-neutral-50/50' : 'opacity-60'}`}>
                                                            <div className={`flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center border shadow-sm ${req.required
                                                                ? 'bg-primary-50 text-primary-600 border-primary-200'
                                                                : 'bg-white text-neutral-400 border-neutral-200'
                                                                }`}>
                                                                <FileIcon className="h-5 w-5" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`font-bold text-sm truncate ${isActive ? 'text-neutral-900' : 'text-neutral-500 line-through decoration-neutral-300'}`}>{req.name}</p>
                                                                <p className="text-xs text-neutral-500 mt-0.5 font-mono truncate">/{req.folder}</p>
                                                            </div>
                                                        </div>

                                                        {/* Card Body — badges row */}
                                                        <div className={`px-5 py-3 flex items-center gap-2 flex-wrap ${!isActive && 'opacity-60'}`}>
                                                            {req.required ? (
                                                                <Badge variant="outline" className="text-[10px] border-primary-200 text-primary-700 bg-primary-50 px-2 py-0 h-5 shadow-sm font-bold">
                                                                    Required
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-[10px] border-neutral-200 text-neutral-600 bg-white px-2 py-0 h-5 shadow-sm font-bold">
                                                                    Optional
                                                                </Badge>
                                                            )}
                                                            <Badge variant="outline" className={`text-[10px] px-2 py-0 h-5 shadow-sm font-bold ${isActive
                                                                ? 'border-success/20 text-success bg-success/5'
                                                                : 'border-neutral-200 text-neutral-500 bg-neutral-100'
                                                                }`}>
                                                                {isActive ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                        </div>

                                                        {/* Card Footer — actions */}
                                                        <div className="px-5 py-3 border-t border-neutral-100 flex items-center justify-between bg-neutral-50/30">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Active</span>
                                                                <Switch
                                                                    checked={isActive}
                                                                    onCheckedChange={(c) => updateDocRequirement(req.id, { is_active: c })}
                                                                    className="data-[state=checked]:bg-success scale-90"
                                                                />
                                                            </div>

                                                            <div className="h-8 flex items-center justify-end min-w-[32px] transition-all duration-200">
                                                                {pendingDeleteId === req.id ? (
                                                                    <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
                                                                        <Button
                                                                            size="xs"
                                                                            variant="destructive"
                                                                            onClick={() => { setPendingDeleteId(null); deleteDocRequirement(req.id); }}
                                                                        >
                                                                            Confirm
                                                                        </Button>
                                                                        <Button
                                                                            size="xs"
                                                                            variant="ghost"
                                                                            className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                                                                            onClick={() => setPendingDeleteId(null)}
                                                                        >
                                                                            Cancel
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <Button
                                                                        size="icon-xs"
                                                                        variant="ghost"
                                                                        onClick={() => setPendingDeleteId(req.id)}
                                                                        className="text-neutral-400 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                                                        title="Delete document type"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB: TEMPLATES */}
                        <TabsContent value="templates" className="mt-0 space-y-6">
                            {/* Certificates Grid */}
                            <Card className="bg-white border-neutral-200 shadow-sm">
                                <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <CardTitle className="text-base text-neutral-900 flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-primary-600" /> Certificates
                                        </CardTitle>
                                        <CardDescription className="text-neutral-500">Manage Clearance Certificates and visual calibration.</CardDescription>
                                    </div>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="shadow-sm active:scale-95 transition-all"
                                        onClick={() => setTemplateModalOpen(true)}
                                    >
                                        <Plus className="h-4 w-4 mr-1.5" /> Upload Certificate
                                    </Button>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <DataTable
                                        rowData={certificateTemplates}
                                        columnDefs={certificateColumnDefs}
                                        height="320px"
                                        overlayNoRowsTemplate='<div style="padding: 20px; text-align: center; color: var(--neutral-500);"><div style="font-size: 24px; margin-bottom: 8px;">🎓</div>No certificates deployed.</div>'
                                    />
                                </CardContent>
                            </Card>

                            {/* General Templates Grid */}
                            <Card className="bg-white border-neutral-200 shadow-sm">
                                <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <CardTitle className="text-base text-neutral-900 flex items-center gap-2">
                                            <LayoutTemplate className="h-4 w-4 text-primary-600" /> System Templates
                                        </CardTitle>
                                        <CardDescription className="text-neutral-500">Manage Syllabus, Grade Sheets, and General templates.</CardDescription>
                                    </div>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="shadow-sm active:scale-95 transition-all"
                                        onClick={() => setTemplateModalOpen(true)}
                                    >
                                        <Plus className="h-4 w-4 mr-1" /> Upload Template
                                    </Button>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <DataTable
                                        rowData={generalTemplates}
                                        columnDefs={generalColumnDefs}
                                        height="320px"
                                        overlayNoRowsTemplate='<div style="padding: 20px; text-align: center; color: var(--neutral-500);"><div style="font-size: 24px; margin-bottom: 8px;">📑</div>No generic templates deployed.</div>'
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB: SCHEDULING (HOLIDAYS) */}
                        <TabsContent value="scheduling" className="mt-0">
                            <Card className="bg-white border-neutral-200 shadow-sm">
                                <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-4">
                                    <CardTitle className="text-base text-neutral-900 flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-primary-600" /> Holiday Scheduling
                                    </CardTitle>
                                    <CardDescription className="text-neutral-500">Manage holidays to pause automated email reminders.</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    {/* Add Holiday Date Range */}
                                    <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-xl flex flex-col md:flex-row gap-4 items-end shadow-sm">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Start Date</Label>
                                            <Input
                                                type="date"
                                                value={newHoliday.startDate}
                                                min={todayStr}
                                                onChange={e => setNewHoliday({ ...newHoliday, startDate: e.target.value })}
                                                className={`bg-white border-neutral-200 text-neutral-900 shadow-sm focus-visible:ring-primary-500 ${holidayIsPast || holidayStartDateOccupied ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">End Date (Optional)</Label>
                                            <Input
                                                type="date"
                                                value={newHoliday.endDate}
                                                min={newHoliday.startDate || todayStr}
                                                disabled={!newHoliday.startDate}
                                                onChange={e => setNewHoliday({ ...newHoliday, endDate: e.target.value })}
                                                className={`bg-white border-neutral-200 text-neutral-900 shadow-sm focus-visible:ring-primary-500 disabled:bg-neutral-100 disabled:text-neutral-400 ${holidayEndDateInvalid || holidayEndDateOccupied || holidayEndDateSameAsStart ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1.5 w-full">
                                            <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Description</Label>
                                            <Input
                                                placeholder="e.g. Christmas Break"
                                                value={newHoliday.description}
                                                onChange={e => setNewHoliday({ ...newHoliday, description: e.target.value })}
                                                className={`bg-white border-neutral-200 text-neutral-900 shadow-sm focus-visible:ring-primary-500 ${holidayDescriptionDuplicate ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
                                            />
                                        </div>
                                        <Button
                                            className="bg-primary-600 hover:bg-primary-700 text-white shrink-0 shadow-sm transition-all active:scale-95 disabled:opacity-40"
                                            disabled={!canAddHoliday}
                                            onClick={async () => {
                                                if (canAddHoliday) {
                                                    const success = await handleBulkAddHolidays(
                                                        newHoliday.startDate,
                                                        newHoliday.endDate,
                                                        newHoliday.description
                                                    );
                                                    if (success) setNewHoliday({ startDate: '', endDate: '', description: '' });
                                                }
                                            }}
                                        >
                                            <Plus className="h-4 w-4 mr-2" /> Schedule
                                        </Button>
                                    </div>

                                    {/* Inline holiday validation warnings */}
                                    <div className="space-y-1.5">
                                        {holidayDescriptionDuplicate && (
                                            <p className="text-xs text-destructive font-medium italic flex items-center gap-1.5">
                                                <AlertTriangle className="h-3 w-3" /> "{newHoliday.description}" already exists. Description must be unique.
                                            </p>
                                        )}
                                        {holidayIsPast && (
                                            <p className="text-xs text-destructive font-medium italic flex items-center gap-1.5">
                                                <AlertTriangle className="h-3 w-3" /> Start date cannot be in the past.
                                            </p>
                                        )}
                                        {holidayEndDateInvalid && (
                                            <p className="text-xs text-destructive font-medium italic flex items-center gap-1.5">
                                                <AlertTriangle className="h-3 w-3" /> End date must be after Start date.
                                            </p>
                                        )}
                                        {holidayOccupiedDates.length > 0 && (
                                            <p className="text-xs text-destructive font-medium italic flex items-center gap-1.5">
                                                <AlertTriangle className="h-3 w-3" />
                                                Occupied: {holidayOccupiedDates.join(', ')}. Please choose different dates.
                                            </p>
                                        )}
                                        {holidayEndDateSameAsStart && (
                                            <p className="text-xs text-destructive font-medium italic flex items-center gap-1.5">
                                                <AlertTriangle className="h-3 w-3" />
                                                {newHoliday.startDate} is already a start date. Please choose another date.
                                            </p>
                                        )}
                                    </div>

                                    {/* List */}
                                    <div className="space-y-2 mt-6">
                                        {holidays.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-16 bg-neutral-50 border border-dashed border-neutral-200 rounded-xl">
                                                <div className="p-4 rounded-full bg-white border border-neutral-100 shadow-sm mb-4">
                                                    <Clock className="h-8 w-8 text-neutral-300" />
                                                </div>
                                                <p className="text-neutral-900 font-bold">No holidays scheduled</p>
                                                <p className="text-neutral-500 text-sm mt-1">Use the form above to add blackout dates.</p>
                                            </div>
                                        ) : (
                                            <DataTable
                                                rowData={holidays}
                                                columnDefs={holidayColDefs}
                                                getRowId={(params) => String(params.data.holiday_id || params.data.id)}
                                                height="400px"
                                            />
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB: VALIDATION RULES */}
                        <TabsContent value="validation" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {/* Left Pane - Document Types List */}
                                <div className="md:col-span-1 space-y-2 self-start ">
                                    <Card className="bg-white border-neutral-200 shadow-sm flex flex-col max-h-[calc(100vh-120px)]">
                                        <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-4 shrink-0">
                                            <CardTitle className="text-sm text-neutral-900 flex items-center gap-2">
                                                <Folder className="h-4 w-4 text-primary-600" /> Document Types
                                            </CardTitle>
                                            <div className="text-xs text-neutral-500 font-medium">Select a document type to view its validation rules.</div>
                                        </CardHeader>
                                        <CardContent className="p-2 space-y-1 overflow-y-auto bg-white">
                                            {docRequirements.filter(d => d.is_active).map(doc => (
                                                <button
                                                    key={doc.id}
                                                    onClick={() => setSelectedDocTypeId(doc.id)}
                                                    className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-all flex items-center justify-between font-medium ${selectedDocTypeId === doc.id
                                                        ? 'bg-primary-600 text-white shadow-md'
                                                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 border border-transparent'
                                                        }`}
                                                >
                                                    <span className="truncate pr-2">{doc.name}</span>
                                                </button>
                                            ))}
                                            {docRequirements.filter(d => d.is_active).length === 0 && (
                                                <div className="p-4 text-xs text-center text-neutral-500 font-medium">No active document types found.</div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Right Pane - Validation Rules Editor */}
                                <div className="md:col-span-3">
                                    <Card className="bg-white border-neutral-200 shadow-sm h-full">
                                        <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-4">
                                            <CardTitle className="text-base text-neutral-900 flex items-center gap-2">
                                                <Shield className="h-4 w-4 text-primary-600" />
                                                Validation Rules: {docRequirements.find(d => d.id === selectedDocTypeId)?.name || 'Select a Document Type'}
                                            </CardTitle>
                                            <CardDescription className="text-neutral-500">
                                                Define the strict criteria the OCR Bot must enforce for this specific document.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            {rulesLoading ? (
                                                <div className="flex flex-col items-center justify-center p-12 text-neutral-500 gap-3">
                                                    <RefreshCw className="h-8 w-8 animate-spin text-primary-500" />
                                                    <p className="text-sm font-medium">Loading rules...</p>
                                                </div>
                                            ) : !selectedDocTypeId ? (
                                                <div className="flex flex-col items-center justify-center p-12 text-neutral-400 gap-3">
                                                    <FileText className="h-10 w-10 opacity-20" />
                                                    <p className="font-medium">Select a document type from the left to configure its rules.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-8">
                                                    {/* Text Content Rules */}
                                                    <div>
                                                        <h3 className="text-sm font-bold text-neutral-900 mb-4 flex items-center border-b border-neutral-200 pb-2">
                                                            <FileText className="mr-2 h-4 w-4 text-primary-600" /> Text Extraction Rules
                                                        </h3>
                                                        <div className="grid grid-cols-1 gap-6 pl-1">
                                                            {/* Required Keywords */}
                                                            <div className="space-y-2">
                                                                <div className="flex flex-col gap-1.5">
                                                                    <div className="flex items-center justify-between">
                                                                        <Label className="text-xs font-bold text-success uppercase tracking-wider">Must Contain Keywords</Label>
                                                                        <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 uppercase tracking-wider">Comma separated</span>
                                                                    </div>
                                                                    <div className="flex items-start gap-2 bg-info/5 border border-info/20 p-2.5 rounded-md">
                                                                        <p className="text-[11px] text-info font-medium leading-relaxed">
                                                                            <strong className="font-bold">Recommendation:</strong> Choose broad/generic words for batch submissions (like Presentations). As long as one slide in the batch contains the word, the whole batch passes.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <Input
                                                                    value={docRules.required_keywords || ''}
                                                                    onChange={(e) => setDocRules({ ...docRules, required_keywords: e.target.value })}
                                                                    className="bg-white border-neutral-200 text-neutral-900 focus-visible:ring-success/20 focus-visible:border-success shadow-sm text-sm"
                                                                    placeholder="e.g. Vision & Mission, Grading System, Course Outcomes"
                                                                />
                                                                <p className="text-xs text-neutral-500 font-medium">The OCR bot will instantly reject the document if any of these phrases are missing.</p>
                                                            </div>

                                                            {/* Forbidden Keywords */}
                                                            <div className="space-y-2 mt-2">
                                                                <div className="flex flex-col gap-1.5">
                                                                    <div className="flex items-center justify-between">
                                                                        <Label className="text-xs font-bold text-destructive uppercase tracking-wider">Must NOT Contain Keywords</Label>
                                                                        <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 uppercase tracking-wider">Comma separated</span>
                                                                    </div>
                                                                    <div className="flex items-start gap-2 bg-warning/5 border border-warning/20 p-2.5 rounded-md">
                                                                        <p className="text-[11px] text-warning font-medium leading-relaxed">
                                                                            <strong className="font-bold">Recommendation:</strong> Choose broad/generic words for batch submissions (like Research). As long as one slide in the batch contains the word, the whole batch is rejected.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <Input
                                                                    value={docRules.forbidden_keywords || ''}
                                                                    onChange={(e) => setDocRules({ ...docRules, forbidden_keywords: e.target.value })}
                                                                    className="bg-white border-neutral-200 text-neutral-900 focus-visible:ring-destructive/20 focus-visible:border-destructive shadow-sm text-sm"
                                                                    placeholder="e.g. Draft, Unofficial, Template"
                                                                />
                                                                <p className="text-xs text-neutral-500 font-medium">Prevents upload spoofing (e.g. rejecting a document explicitly marked as "Draft").</p>
                                                            </div>

                                                            {/* Minimum Word Count */}
                                                            <div className="space-y-2 max-w-sm mt-2">
                                                                <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Minimum Word Count</Label>
                                                                <div className="flex items-center gap-3">
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        value={docRules.min_word_count ?? 0}
                                                                        onChange={(e) => setDocRules({ ...docRules, min_word_count: e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0 })}
                                                                        className="bg-white border-neutral-200 text-neutral-900 focus-visible:ring-primary-500 focus-visible:border-primary-500 shadow-sm font-mono text-lg w-32"
                                                                    />
                                                                    <span className="text-sm text-neutral-600 font-medium whitespace-nowrap">words minimum</span>
                                                                </div>
                                                                <p className="text-xs text-neutral-500 font-medium">Ensures documents have sufficient length, filtering out placeholder single-page uploads.</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* File Constraints */}
                                                    <div className="mt-8">
                                                        <h3 className="text-sm font-bold text-neutral-900 mb-4 flex items-center border-b border-neutral-200 pb-2">
                                                            <Archive className="mr-2 h-4 w-4 text-primary-600" /> Technical Constraints
                                                        </h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pl-1">
                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Max File Size (MB)</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={docRules.max_file_size_mb}
                                                                    onChange={(e) => setDocRules({ ...docRules, max_file_size_mb: e.target.value === '' ? '' : parseInt(e.target.value, 10) || 10 })}
                                                                    className="bg-white border-neutral-200 text-neutral-900 focus-visible:ring-primary-500 focus-visible:border-primary-500 shadow-sm"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Allowed Extensions</Label>
                                                                <Input
                                                                    value={docRules.allowed_extensions || ''}
                                                                    onChange={(e) => setDocRules({ ...docRules, allowed_extensions: e.target.value })}
                                                                    className="bg-white border-neutral-200 text-neutral-900 focus-visible:ring-primary-500 focus-visible:border-primary-500 shadow-sm"
                                                                    placeholder=".pdf, .docx, .xlsx"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Save Action */}
                                                    <div className="pt-6 mt-4 border-t border-neutral-200 flex justify-end">
                                                        <Button
                                                            variant="default"
                                                            className="shadow-sm active:scale-95 transition-all"
                                                            onClick={handleSaveRules}
                                                            disabled={loading || rulesLoading}
                                                        >
                                                            {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                                            Save Rules for {docRequirements.find(d => d.id === selectedDocTypeId)?.name || 'Document'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB: OCR & AI */}
                        <TabsContent value="ocr" className="mt-0 space-y-6">
                            <div className="space-y-6">

                                {/* Engine Config */}
                                <Card className="bg-white border-neutral-200 shadow-sm">
                                    <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-4">
                                        <CardTitle className="text-base text-neutral-900 flex items-center gap-2">
                                            <Cpu className="h-4 w-4 text-primary-600" /> OCR Engine Configuration
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-6">
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 border border-neutral-200 shadow-sm">
                                            <div>
                                                <Label className="text-neutral-900 font-bold text-sm">Enable Automated Validation</Label>
                                                <p className="text-xs text-neutral-500 mt-1 font-medium">Master switch to run the extraction engine on new uploads.</p>
                                            </div>
                                            <Switch
                                                checked={settings.ocr_enabled}
                                                onCheckedChange={(c) => updateSetting('ocr_enabled', c)}
                                                className="data-[state=checked]:bg-success shrink-0"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Test Area */}
                                <Card className="bg-white border-neutral-200 shadow-sm">
                                    <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-4">
                                        <CardTitle className="text-base text-neutral-900 font-bold">Parser Test Playground</CardTitle>
                                        <CardDescription className="text-neutral-500 font-medium">Test the Edge Function parser against real files to see how it extracts and validates data.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="flex flex-col gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Target Validation Rules (Document Type)</Label>
                                                <Select value={testDocTypeId} onValueChange={setTestDocTypeId}>
                                                    <SelectTrigger className="w-full sm:w-80 bg-white border-neutral-200 text-neutral-900 shadow-sm focus:ring-primary-500">
                                                        <SelectValue placeholder="Select Document Type" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white border-neutral-200 text-neutral-900 shadow-md">
                                                        {docRequirements.filter(d => d.is_active).map(doc => (
                                                            <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-3">
                                                {(!testFile || testFile.length === 0) ? (
                                                    <Input
                                                        id="testFileInput"
                                                        type="file"
                                                        multiple
                                                        onChange={(e) => setTestFile(Array.from(e.target.files))}
                                                        className="bg-white border-neutral-200 text-neutral-900 file:text-neutral-700 file:bg-neutral-100 file:border-0 file:rounded-sm file:mr-4 hover:file:bg-neutral-200 shadow-sm flex-1 font-medium transition-colors"
                                                    />
                                                ) : (
                                                    <div className="flex-1 bg-neutral-50 border border-neutral-200 rounded-md px-4 py-2 flex items-center justify-between text-sm overflow-hidden shadow-inner">
                                                        <span className="text-primary-600 font-bold truncate">
                                                            {testFile.length === 1 ? testFile[0].name : `${testFile.length} files staged for batch testing`}
                                                        </span>
                                                    </div>
                                                )}
                                                <Button
                                                    onClick={() => runTestOCR(testFile, testDocTypeId)}
                                                    disabled={!testFile || testFile.length === 0 || !testDocTypeId || processing}
                                                    className="bg-primary-600 hover:bg-primary-700 text-white shrink-0 shadow-sm active:scale-95 transition-all"
                                                >
                                                    {processing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                                                    Run Parser
                                                </Button>
                                            </div>
                                        </div>

                                        {testResult && (
                                            <div className={`border rounded-xl p-4 mt-4 shadow-sm transition-all ${testResult.success ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}`}>
                                                <div className={`flex justify-between items-center mb-3 border-b pb-3 ${testResult.success ? 'border-success/20' : 'border-destructive/20'}`}>
                                                    {testResult.success ? (
                                                        <div className="flex items-center gap-4 text-xs font-mono">
                                                            <span className="text-success font-bold uppercase tracking-wider flex items-center gap-1.5">
                                                                <CheckCircle className="h-3.5 w-3.5" /> Validation Passed
                                                            </span>
                                                            {testResult.processing_time_ms && <span className="text-neutral-500 font-medium">Runtime: {testResult.processing_time_ms}ms</span>}
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-4 text-xs font-mono text-destructive font-bold uppercase tracking-wider items-center gap-1.5">
                                                            <AlertCircle className="h-3.5 w-3.5" /> Validation Failed / Error
                                                        </div>
                                                    )}
                                                    <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider ${testResult.success ? 'border-success/30 text-success bg-success/10' : 'border-destructive/30 text-destructive bg-destructive/10'}`}>
                                                        {testResult.success ? 'Analysis Output' : 'System Message'}
                                                    </Badge>
                                                </div>

                                                {testResult.processedFiles && testResult.processedFiles.length > 0 && (
                                                    <div className="mb-4 text-xs text-neutral-600 font-mono">
                                                        <span className="font-bold text-neutral-900">Files Processed ({testResult.processedFiles.length}):</span>
                                                        <ul className="mt-1.5 ml-4 list-disc space-y-0.5">
                                                            {testResult.processedFiles.map((file, idx) => (
                                                                <li key={idx} className="truncate">{file}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                <div className="bg-white border border-neutral-200 rounded-lg p-3 shadow-inner">
                                                    <pre className={`text-xs font-mono overflow-auto max-h-64 whitespace-pre-wrap flex-1 ${testResult.success ? 'text-neutral-700' : 'text-destructive font-medium'}`}>
                                                        {testResult.success ? testResult.text : (testResult.error || testResult.text)}
                                                    </pre>
                                                </div>

                                                <div className="mt-4 flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            clearTestResult();
                                                            setTestFile([]);
                                                            setTestDocTypeId('');
                                                            const fileInput = document.getElementById('testFileInput');
                                                            if (fileInput) fileInput.value = '';
                                                        }}
                                                        className="text-xs font-bold text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                                                    >
                                                        Clear Results
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* TAB 4: MAINTENANCE / DANGER ZONE */}
                        <TabsContent value="maintenance" className="mt-0">
                            <Card className="bg-destructive/5 border-destructive/20 shadow-none">
                                <CardHeader className="border-b border-destructive/20 py-4 bg-white/50">
                                    <CardTitle className="text-base text-destructive flex items-center gap-2 font-bold">
                                        <AlertTriangle className="h-5 w-5" /> Danger Zone
                                    </CardTitle>
                                    <CardDescription className="text-destructive/70 font-medium">
                                        Irreversible actions. These will affect live data.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <DangerRow
                                        title="Reset Semester Data"
                                        desc="Clear all submissions for the current semester. Does not delete archives."
                                        btnText="Reset Semester"
                                        onClick={() => handleDangerAction('RESET_SEMESTER')}
                                    />
                                    <DangerRow
                                        title="Purge Old Archives"
                                        desc="Permanently remove files older than the retention period."
                                        btnText="Purge Archives"
                                        onClick={() => handleDangerAction('PURGE_ARCHIVES')}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </div >
                </Tabs >

                {/* Upload Template Modal */}
                <Dialog open={isTemplateModalOpen} onOpenChange={setTemplateModalOpen}>
                    <DialogContent className="bg-white border-neutral-200 text-neutral-900 max-w-lg shadow-xl">
                        <DialogHeader>
                            <DialogTitle className="text-neutral-900 flex items-center gap-2">
                                <LayoutTemplate className="h-5 w-5 text-primary-600" />
                                Upload New Template
                            </DialogTitle>
                            <DialogDescription className="text-neutral-500">
                                Tie this template to a specific Academic Year and Document Type schema.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Document File *</Label>
                                <Input
                                    type="file"
                                    onChange={(e) => setNewTemplate({ ...newTemplate, file: e.target.files?.[0] || null })}
                                    className="bg-white border-neutral-200 text-neutral-900 cursor-pointer shadow-sm file:text-neutral-700 file:bg-neutral-100 file:border-0 file:rounded-sm file:mr-4 hover:file:bg-neutral-200"
                                    accept=".pdf,.docx,.doc,.xlsx,.xls"
                                    disabled={isUploadingTemplate}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Template Title</Label>
                                    <Input
                                        placeholder={!newTemplate.file ? "Attach a file first..." : "e.g. Clearance Cert v1"}
                                        value={newTemplate.title}
                                        onChange={e => setNewTemplate({ ...newTemplate, title: e.target.value })}
                                        className="bg-white border-neutral-200 text-neutral-900 shadow-sm focus-visible:ring-primary-500 disabled:bg-neutral-100"
                                        disabled={!newTemplate.file || isUploadingTemplate}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">System Category</Label>
                                    <Select
                                        value={newTemplate.systemCategory}
                                        onValueChange={v => setNewTemplate({ ...newTemplate, systemCategory: v })}
                                        disabled={!newTemplate.file || isUploadingTemplate}
                                    >
                                        <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm focus:ring-primary-500 disabled:bg-neutral-100">
                                            <SelectValue placeholder={!newTemplate.file ? "Attach file first..." : "Select category..."} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-neutral-200 text-neutral-900 shadow-md">
                                            <SelectItem value="CLEARANCE_CERTIFICATE">Clearance Certificate</SelectItem>
                                            <SelectItem value="SYLLABUS">Syllabus</SelectItem>
                                            <SelectItem value="GRADE_SHEET">Grade Sheet</SelectItem>
                                            <SelectItem value="GENERAL">General</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-1 md:col-span-2 space-y-1.5">
                                    <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Description</Label>
                                    <Input
                                        placeholder={!newTemplate.file ? "Attach file first..." : "Optional description"}
                                        value={newTemplate.description}
                                        onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })}
                                        className="bg-white border-neutral-200 text-neutral-900 shadow-sm focus-visible:ring-primary-500 disabled:bg-neutral-100"
                                        disabled={!newTemplate.file || isUploadingTemplate}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Academic Year</Label>
                                    <Select
                                        value={newTemplate.academicYear}
                                        onValueChange={v => setNewTemplate({ ...newTemplate, academicYear: v })}
                                        disabled={!newTemplate.file || isUploadingTemplate}
                                    >
                                        <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm focus:ring-primary-500 disabled:bg-neutral-100">
                                            <SelectValue placeholder={!newTemplate.file ? "Attach file first..." : "e.g. 2024-2025"} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-neutral-200 text-neutral-900 shadow-md">
                                            <SelectItem value="2023-2024">2023-2024</SelectItem>
                                            <SelectItem value="2024-2025">2024-2025</SelectItem>
                                            <SelectItem value="2025-2026">2025-2026</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Semester</Label>
                                    <Select
                                        value={newTemplate.semester}
                                        onValueChange={v => setNewTemplate({ ...newTemplate, semester: v })}
                                        disabled={!newTemplate.file || isUploadingTemplate}
                                    >
                                        <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm focus:ring-primary-500 disabled:bg-neutral-100">
                                            <SelectValue placeholder={!newTemplate.file ? "Attach file first..." : "e.g. 1st Semester"} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-neutral-200 text-neutral-900 shadow-md">
                                            <SelectItem value="1st Semester">1st Semester</SelectItem>
                                            <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                                            <SelectItem value="Summer">Summer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="mt-4 gap-2 sm:gap-3">
                            <Button variant="outline" onClick={() => setTemplateModalOpen(false)} className="border-neutral-200 text-neutral-700 hover:bg-neutral-100">Cancel</Button>
                            <Button
                                className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm active:scale-95 transition-all"
                                disabled={!newTemplate.file || !newTemplate.academicYear || !newTemplate.semester || !newTemplate.systemCategory || isUploadingTemplate}
                                onClick={() => {
                                    setIsUploadingTemplate(true);
                                    addTemplate(
                                        newTemplate.file,
                                        newTemplate.title,
                                        newTemplate.description,
                                        newTemplate.systemCategory,
                                        newTemplate.academicYear,
                                        newTemplate.semester
                                    ).then(() => {
                                        setIsUploadingTemplate(false);
                                        setTemplateModalOpen(false);
                                        setNewTemplate({ file: null, title: '', description: '', systemCategory: '', academicYear: '', semester: '' });
                                    }).catch(() => {
                                        setIsUploadingTemplate(false);
                                    });
                                }}
                            >
                                {isUploadingTemplate ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isUploadingTemplate ? 'Uploading...' :
                                    <Button className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm active:scale-95 transition-all">
                                        <Plus className="h-4 w-4 mr-1" /> Upload Template
                                    </Button>}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Name Calibrator Modal */}
                <NameCalibratorModal
                    isOpen={isCalibratorOpen}
                    onClose={() => {
                        setIsCalibratorOpen(false);
                        setSelectedTemplateForCalibration(null);
                    }}
                    template={selectedTemplateForCalibration}
                    onSave={updateTemplateCoordinates}
                />

                {/* Danger Zone Action Modal */}
                <Dialog open={isDangerModalOpen} onOpenChange={setIsDangerModalOpen}>
                    <DialogContent className="bg-white border-destructive/30 text-neutral-900 max-w-md shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-destructive flex items-center gap-2 font-bold">
                                <AlertTriangle className="h-5 w-5" />
                                {dangerModalConfig.title}
                            </DialogTitle>
                            <DialogDescription className="text-neutral-600 mt-2 font-medium">
                                {dangerModalConfig.description}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4 space-y-3 border-y border-neutral-100 my-2">
                            <Label className="text-sm font-bold text-neutral-700">
                                Please type <span className="text-destructive font-mono select-none px-1.5 py-0.5 bg-destructive/10 border border-destructive/20 rounded">{dangerModalConfig.confirmationText}</span> to confirm.
                            </Label>
                            <Input
                                placeholder={`Type ${dangerModalConfig.confirmationText}`}
                                value={dangerModalInput}
                                onChange={(e) => setDangerModalInput(e.target.value)}
                                className="bg-neutral-50 border-neutral-200 text-neutral-900 focus-visible:ring-destructive/20 focus-visible:border-destructive font-mono font-bold shadow-inner"
                                autoComplete="off"
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsDangerModalOpen(false)}
                                className="text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border-neutral-200 shadow-sm"
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-destructive hover:bg-destructive/90 text-white shadow-sm transition-all active:scale-95"
                                onClick={executeDangerAction}
                                disabled={dangerModalInput !== dangerModalConfig.confirmationText || processing}
                            >
                                {processing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                                <X className="h-4 w-4 mr-2" />
                                Confirm Action
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div >
        </ToastProvider>
    );
}

// --- Sub-components ---

const TabItem = ({ value, label, icon: Icon }) => (
    <TabsTrigger
        value={value}
        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary-600 text-neutral-500 rounded-none px-4 py-3 hover:text-primary-700 hover:bg-neutral-100/50 transition-all font-medium text-sm"
    >
        <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span>{label}</span>
        </div>
    </TabsTrigger>
);

const InfoRow = ({ label, value }) => (
    <div className="flex justify-between items-center text-sm py-3 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 px-2 rounded transition-colors bg-white">
        <span className="text-neutral-500 font-medium">{label}</span>
        <span className="font-mono text-neutral-900 font-bold bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200 shadow-sm">{value}</span>
    </div>
);

const CheckboxItem = ({ label, checked, onChange }) => (
    <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white border border-neutral-200 hover:border-primary-400 shadow-sm transition-all cursor-pointer group" onClick={() => onChange(!checked)}>
        <Checkbox
            id={label}
            checked={checked}
            onCheckedChange={onChange}
            className="border-neutral-300 data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600 h-4 w-4 rounded shadow-sm group-hover:border-primary-400"
        />
        <label
            htmlFor={label}
            className="text-sm font-bold leading-none text-neutral-700 cursor-pointer select-none group-hover:text-neutral-900"
        >
            {label}
        </label>
    </div>
);

const DangerRow = ({ title, desc, btnText, onClick }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white border border-destructive/20 rounded-xl gap-4 hover:border-destructive/40 hover:shadow-sm transition-all">
        <div>
            <h4 className="font-bold text-destructive text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {title}
            </h4>
            <p className="text-xs text-neutral-600 font-medium mt-1 pl-6">{desc}</p>
        </div>
        <Button
            variant="outline"
            onClick={onClick}
            className="text-destructive hover:text-white hover:bg-destructive border-destructive/30 whitespace-nowrap shadow-sm transition-colors"
            size="sm"
        >
            {btnText}
        </Button>
    </div>
);