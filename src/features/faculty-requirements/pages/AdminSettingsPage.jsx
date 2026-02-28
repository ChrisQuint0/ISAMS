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
            addToast({ title: "Success", description: String(success), variant: "default" });
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
                background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0',
                padding: '6px 10px', borderRadius: '6px', fontSize: '13px',
                outline: 'none', minWidth: '180px', cursor: 'pointer',
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

// Custom dark Balham theme (standard across ISAMS)
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
            width: 150
        },
        {
            field: 'description',
            headerName: 'Description',
            flex: 1
        },
        {
            headerName: 'Actions',
            width: 100,
            sortable: false,
            filter: false,
            cellRenderer: (params) => {
                const id = params.data.holiday_id || params.data.id;
                if (pendingHolidayDeleteId === id) {
                    return React.createElement('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
                        React.createElement('button', {
                            style: { background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '12px', fontWeight: '600' },
                            onClick: () => { setPendingHolidayDeleteId(null); handleDeleteHoliday(id); }
                        }, 'Yes'),
                        React.createElement('button', {
                            style: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '12px' },
                            onClick: () => setPendingHolidayDeleteId(null)
                        }, 'No')
                    );
                }
                return React.createElement('button', {
                    style: { background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '12px', fontWeight: '600' },
                    onClick: () => setPendingHolidayDeleteId(id)
                }, 'Remove');
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

    // ── Faculty card grouped view ─────────────────────────────────────────────
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
                color: params.value ? '#34d399' : '#475569',
                fontStyle: params.value ? 'normal' : 'italic',
            }),
            valueFormatter: (params) => params.value || 'Double-click to set',
            tooltipValueGetter: () => 'Any format accepted — type freely (e.g. 2024-001, EMP-42, T123)',
        },
        {
            field: 'first_name',
            headerName: 'First Name',
            flex: 1,
            editable: false,
        },
        {
            field: 'last_name',
            headerName: 'Last Name',
            flex: 1,
            editable: false,
        },
        {
            field: 'email',
            headerName: 'Email',
            flex: 2,
            editable: false,
            cellStyle: { color: '#94a3b8' },
        },
        {
            field: 'employment_type',
            headerName: 'Employment Type',
            flex: 1,
            editable: true,
            singleClickEdit: false,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: { values: ['Full Time', 'Part Time'] },
            // Prevent Tab/Enter from navigating to adjacent rows while dropdown is open
            suppressKeyboardEvent: (params) => params.editing && ['Tab', 'Enter', 'ArrowDown', 'ArrowUp'].includes(params.event.key),
            valueFormatter: (params) => params.value || 'Double-click to set',
            cellStyle: (params) => ({
                color: params.value ? '#e2e8f0' : '#475569',
                fontStyle: params.value ? 'normal' : 'italic',
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
            // Prevent Tab/Enter from navigating to adjacent rows while dropdown is open
            suppressKeyboardEvent: (params) => params.editing && ['Tab', 'Enter', 'ArrowDown', 'ArrowUp'].includes(params.event.key),
            valueGetter: (params) => params.data.is_active ? 'Active' : 'Inactive',
            valueSetter: (params) => {
                params.data.is_active = params.newValue === 'Active';
                return true;
            },
            cellStyle: (params) => ({
                color: params.value === 'Active' ? '#34d399' : '#64748b',
                fontWeight: '500',
            }),
        },
    ], []);


    // AG Grid: column definitions for Course Catalog
    const catalogColumnDefs = useMemo(() => [
        { field: 'course_code', headerName: 'Code', width: 110, cellStyle: { fontFamily: 'monospace', color: '#34d399', fontWeight: 600 } },
        { field: 'course_name', headerName: 'Course Name', flex: 2, cellStyle: { color: '#e2e8f0' } },
        {
            field: 'semester', headerName: 'Semester', width: 130,
            cellStyle: { color: '#94a3b8', fontSize: '12px' },
            valueFormatter: p => p.value || '—'
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
            cellStyle: (params) => ({
                color: params.value === 'Active' ? '#34d399' : '#64748b',
                fontWeight: '500',
            }),
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
                <span className="font-medium text-emerald-400">{params.value}</span>
            )
        },
        {
            field: 'category',
            headerName: 'System Category',
            flex: 1.5,
            valueFormatter: params => params.value || 'General'
        },
        {
            field: 'academicYear',
            headerName: 'Academic Year',
            flex: 1,
            valueFormatter: params => params.value || 'N/A'
        },
        {
            field: 'semester',
            headerName: 'Semester',
            flex: 1,
            valueFormatter: params => params.value || 'N/A'
        },
        {
            field: 'isActive',
            headerName: 'Status',
            flex: 1,
            cellRenderer: (params) => (
                <span className={`font-medium text-sm ${params.value ? 'text-emerald-400' : 'text-slate-400'}`}>
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
                <div className="flex items-center gap-2 mt-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-blue-400 hover:bg-transparent hover:text-blue-400 cursor-pointer"
                        onClick={() => {
                            setSelectedTemplateForCalibration(params.data);
                            setIsCalibratorOpen(true);
                        }}
                    >
                        Calibrate
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-1 px-2 text-slate-400 hover:bg-transparent hover:text-slate-400 cursor-pointer"
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
                <span className="font-medium text-emerald-400">{params.value}</span>
            )
        },
        {
            field: 'category',
            headerName: 'System Category',
            flex: 1.5,
            valueFormatter: params => params.value || 'General'
        },
        {
            field: 'academicYear',
            headerName: 'Academic Year',
            flex: 1,
            valueFormatter: params => params.value || 'N/A'
        },
        {
            field: 'semester',
            headerName: 'Semester',
            flex: 1,
            valueFormatter: params => params.value || 'N/A'
        },
        {
            field: 'isActive',
            headerName: 'Status',
            flex: 1,
            cellRenderer: (params) => (
                <span className={`font-medium text-sm ${params.value ? 'text-emerald-400' : 'text-slate-400'}`}>
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
                <div className="flex items-center gap-2 mt-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-slate-400 hover:bg-transparent hover:text-slate-400 cursor-pointer"
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-100">System Settings</h1>
                        <p className="text-slate-400 text-sm">Configure automation, validation rules, and system preferences</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refresh}
                        disabled={loading}
                        className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Reload Settings
                    </Button>
                </div>



                {/* TABS ORGANIZATION */}
                <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0 space-y-6">
                    <div className="shrink-0 border-b border-slate-800 pb-0">
                        <TabsList className="bg-transparent p-0 h-auto space-x-6">
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
                                    <Card className="bg-slate-900 border-slate-800 shadow-none">
                                        <CardHeader className="border-b border-slate-800 py-4">
                                            <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                                                <Globe className="h-4 w-4 text-slate-400" /> Global Defaults
                                            </CardTitle>
                                            <CardDescription className="text-slate-500">Set default behaviors for new semesters</CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-6 space-y-6">
                                            {/* INPUTS - Replicated Style from File Constraints */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                                {/* Deadline Input */}
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold text-slate-400 uppercase">Default Deadline (Days)</Label>
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            value={deadlineDays}
                                                            onChange={(e) => setDeadlineDays(e.target.value)}
                                                            className="bg-slate-950 border-slate-700 text-slate-200 focus:border-blue-500 pr-4"// Added padding-right
                                                        />
                                                    </div>
                                                </div>

                                                {/* Grace Period Input */}
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold text-slate-400 uppercase">Grace Period (Days)</Label>
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            value={graceDays}
                                                            onChange={(e) => setGraceDays(e.target.value)}
                                                            className="bg-slate-950 border-slate-700 text-slate-200 focus:border-blue-500 pr-4" // Added padding-right
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold text-slate-400 uppercase">Auto-Reminders</Label>
                                                    <Select value={autoReminders} onValueChange={setAutoReminders}>
                                                        <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-200">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                                            <SelectItem value="3days">3 days before deadline</SelectItem>
                                                            <SelectItem value="7days">7 days before deadline</SelectItem>
                                                            <SelectItem value="disabled">Disabled</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold text-slate-400 uppercase">Archive Retention</Label>
                                                    <Select value={archiveRetention} onValueChange={setArchiveRetention}>
                                                        <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-200">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                                            <SelectItem value="3years">3 Years</SelectItem>
                                                            <SelectItem value="5years">5 Years</SelectItem>
                                                            <SelectItem value="permanent">Permanent</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-slate-800 flex justify-end">
                                                <Button
                                                    className="bg-blue-600 hover:bg-blue-700 text-white"
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
                                    <Card className="bg-slate-900 border-slate-800 shadow-none">
                                        <CardHeader className="border-b border-slate-800 py-4">
                                            <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                                                <HardDrive className="h-4 w-4 text-slate-400" /> GDrive Management
                                            </CardTitle>
                                            <CardDescription className="text-slate-500">Provide one parent folder; we'll handle the sub-folders automatically.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-6 space-y-6">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-2">
                                                        Main ISAMS GDrive Folder Link
                                                        {settings.gdrive_main_folder_id && (
                                                            <Badge variant="outline" className="text-[10px] h-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 py-0">Connected</Badge>
                                                        )}
                                                    </Label>
                                                    <Input
                                                        id="main-gdrive-link"
                                                        placeholder="https://drive.google.com/drive/folders/..."
                                                        value={mainGdriveLink}
                                                        onChange={(e) => setMainGdriveLink(e.target.value)}
                                                        disabled={!!settings.gdrive_main_folder_id && !isGdriveUnlocked}
                                                        className={`bg-slate-950 border-slate-700 text-slate-200 focus:border-blue-500 h-10 ${!!settings.gdrive_main_folder_id && !isGdriveUnlocked ? 'opacity-50 cursor-not-allowed' : ''
                                                            }`}
                                                    />
                                                </div>

                                                {(mainGdriveLink || settings.gdrive_root_folder_id) && (
                                                    <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50 space-y-2">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-slate-500 italic">Target Infrastructure:</span>
                                                            <span className="text-blue-400 font-mono text-[10px]">
                                                                {(() => {
                                                                    const match = mainGdriveLink.match(/folders\/([a-zA-Z0-9_-]+)/);
                                                                    return match ? match[1] : (settings.gdrive_main_folder_id || 'Not Set');
                                                                })()}
                                                            </span>
                                                        </div>

                                                        {settings.gdrive_root_folder_id && (
                                                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                                                                <div className="space-y-1">
                                                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Official Vault</p>
                                                                    <p className="text-[11px] text-emerald-400 font-mono truncate">{settings.gdrive_root_folder_id}</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Staging Sandbox</p>
                                                                    <p className="text-[11px] text-fuchsia-400 font-mono truncate">{settings.gdrive_staging_folder_id}</p>
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
                                                        className="text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                                                        onClick={() => window.open('/api/auth', '_blank')}
                                                    >
                                                        <RefreshCw className="mr-2 h-3 w-3" /> Refresh Auth
                                                    </Button>

                                                    {settings.gdrive_main_folder_id && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className={`transition-colors text-[11px] h-8 ${isGdriveUnlocked
                                                                ? "text-amber-400 hover:text-amber-400 hover:bg-amber-400/10"
                                                                : "text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10"
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
                                                    className={`${settings.gdrive_root_folder_id && !isGdriveUnlocked
                                                        ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                                                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20"
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
                                                            setIsGdriveUnlocked(false); // Relock after successful save
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
                                    <Card className="bg-slate-900 border-slate-800 shadow-none">
                                        <CardHeader className="border-b border-slate-800 py-4">
                                            <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                                                <Server className="h-4 w-4 text-slate-400" /> System Status
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6 space-y-4">

                                            {/* Operational Status Box */}
                                            {(() => {
                                                const isHealthy = !!systemHealth?.db_size;
                                                return (
                                                    <div className={`rounded-lg border p-4 space-y-3 transition-all duration-500 ${isHealthy
                                                        ? 'border-emerald-800/60 bg-emerald-950/30'
                                                        : 'border-red-800/60 bg-red-950/20'
                                                        }`}>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Operational Status</span>
                                                            <span className={`flex items-center gap-1.5 text-xs font-semibold ${isHealthy ? 'text-emerald-400' : 'text-red-400'
                                                                }`}>
                                                                <span className={`inline-block h-2 w-2 rounded-full animate-pulse ${isHealthy ? 'bg-emerald-400' : 'bg-red-400'
                                                                    }`} />
                                                                {isHealthy ? 'All Systems Go' : 'Degraded'}
                                                            </span>
                                                        </div>

                                                        <div className="space-y-2">
                                                            {/* Database row */}
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                                                    {isHealthy
                                                                        ? <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                                                                        : <WifiOff className="h-3.5 w-3.5 text-red-400" />
                                                                    }
                                                                    <span>Database</span>
                                                                </div>
                                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isHealthy
                                                                    ? 'bg-emerald-500/15 text-emerald-400'
                                                                    : 'bg-red-500/15 text-red-400'
                                                                    }`}>
                                                                    {isHealthy ? 'HEALTHY' : 'UNREACHABLE'}
                                                                </span>
                                                            </div>

                                                            {/* Operational Time row */}
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                                                    <Clock className="h-3.5 w-3.5 text-blue-400" />
                                                                    <span>Operational Time</span>
                                                                </div>
                                                                <span className="text-xs font-mono font-semibold text-blue-300">
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
                            <Card className="bg-slate-900 border-slate-800 shadow-none">
                                <CardHeader className="border-b border-slate-800 py-4">
                                    <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-emerald-400" /> Course Catalog
                                    </CardTitle>
                                    <CardDescription className="text-slate-500">
                                        Master list of courses offered. Add a course here first — sections are assigned below.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-5 space-y-4">
                                    {/* Add-to-catalog form */}
                                    <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-lg">
                                        <div className="grid grid-cols-12 gap-3 items-end">
                                            {/* Code */}
                                            <div className="col-span-2 space-y-1">
                                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Code *</label>
                                                <Input
                                                    placeholder="e.g. IT101"
                                                    value={newCatalog.code}
                                                    onChange={e => setNewCatalog(p => ({ ...p, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
                                                    maxLength={10}
                                                    className="bg-slate-900 border-slate-700 text-slate-200 font-mono"
                                                />
                                            </div>
                                            {/* Name */}
                                            <div className="col-span-5 space-y-1">
                                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Course Name *</label>
                                                <Input
                                                    placeholder="e.g. Networking 1"
                                                    value={newCatalog.name}
                                                    onChange={e => setNewCatalog(p => ({ ...p, name: e.target.value }))}
                                                    disabled={!catalogCodeValid}
                                                    className="bg-slate-900 border-slate-700 text-slate-200 disabled:opacity-40"
                                                />
                                            </div>
                                            {/* Semester */}
                                            <div className="col-span-3 space-y-1">
                                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Semester *</label>
                                                <Select
                                                    value={newCatalog.semester}
                                                    onValueChange={v => setNewCatalog(p => ({ ...p, semester: v }))}
                                                    disabled={!catalogCodeValid || !catalogNameValid}
                                                >
                                                    <SelectTrigger className="w-full bg-slate-900 border-slate-700 text-slate-200 disabled:opacity-40">
                                                        <SelectValue placeholder="Pick semester" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
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
                                                    className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40"
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
                                        <p className="text-xs text-red-400 font-medium italic flex items-center gap-1.5 mt-2">
                                            <AlertTriangle className="h-3 w-3" />
                                            {catalogConflictType} "{catalogConflictType === 'Code' ? newCatalog.code.toUpperCase() : newCatalog.name}" already exists in {existingCatalogEntry?.semester || 'another semester'}.
                                            Each course must have a unique code and name across all semesters.
                                        </p>
                                    )}

                                    {/* Catalog grid */}
                                    <div style={{ height: 280 }}>
                                        <AgGridReact
                                            theme={customTheme}
                                            rowData={masterCourseList}
                                            getRowId={p => String(p.data.id)}
                                            animateRows
                                            columnDefs={catalogColumnDefs}
                                            onCellValueChanged={handleCatalogCellValueChanged}
                                            stopEditingWhenCellsLoseFocus={true}
                                            overlayNoRowsTemplate='<span style="color:#475569;font-style:italic">No catalog entries yet. Add a course above.</span>'
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* ── Card 2: Faculty Course Assignments ───────────────────── */}
                            <Card className="bg-slate-900 border-slate-800 shadow-none">
                                <CardHeader className="border-b border-slate-800 py-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                                                <Users className="h-4 w-4 text-blue-400" /> Faculty Course Assignments
                                            </CardTitle>
                                            <CardDescription className="text-slate-500 mt-1">
                                                Overview of all faculty course loads. Assign a new section via the button.
                                            </CardDescription>
                                        </div>
                                        <Button
                                            className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                                            onClick={openAssignModal}
                                        >
                                            <Plus className="h-4 w-4 mr-2" /> Assign Faculty to Course
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-5">
                                    {facultyGroups.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <div className="p-4 rounded-full bg-slate-800/60 mb-4">
                                                <Users className="h-8 w-8 text-slate-600" />
                                            </div>
                                            <p className="text-slate-500 font-medium">No assignments yet</p>
                                            <p className="text-slate-600 text-sm mt-1">Click "Assign Faculty to Course" to get started.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                            {facultyGroups.map(group => {
                                                const initials = group.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                                                const avatarColors = [
                                                    'from-blue-600 to-blue-800',
                                                    'from-violet-600 to-violet-800',
                                                    'from-emerald-600 to-emerald-800',
                                                    'from-amber-600 to-amber-800',
                                                    'from-rose-600 to-rose-800',
                                                    'from-cyan-600 to-cyan-800',
                                                ];
                                                const colorIdx = group.name.charCodeAt(0) % avatarColors.length;
                                                return (
                                                    <div
                                                        key={group.faculty_id}
                                                        className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors"
                                                    >
                                                        {/* Faculty header */}
                                                        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                                                            <div className={`flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br ${avatarColors[colorIdx]} flex items-center justify-center text-white text-sm font-bold`}>
                                                                {initials}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-slate-100 font-semibold text-sm truncate">
                                                                    {group.name}
                                                                    {!group.is_active && (
                                                                        <span className="ml-2 text-xs text-amber-400 font-normal">Inactive</span>
                                                                    )}
                                                                </p>
                                                                {group.employment_type && (
                                                                    <p className="text-xs text-slate-500">{group.employment_type}</p>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                {(() => {
                                                                    const uniqueCourses = new Set(group.assignments.map(a => a.master_course_id || a.course_code)).size;
                                                                    const totalSections = group.assignments.length;
                                                                    return (
                                                                        <>
                                                                            <Badge variant="outline" className="border-blue-800/60 text-blue-400 text-[11px] px-2">
                                                                                {uniqueCourses} {uniqueCourses === 1 ? 'course' : 'courses'}
                                                                            </Badge>
                                                                            <Badge variant="outline" className="border-violet-800/60 text-violet-400 text-[11px] px-2">
                                                                                {totalSections} {totalSections === 1 ? 'section' : 'sections'}
                                                                            </Badge>
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                        {/* Course rows */}
                                                        <div className="divide-y divide-slate-800/60">
                                                            {group.assignments.map(asgn => (
                                                                <div
                                                                    key={asgn.course_id}
                                                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/30 transition-colors group"
                                                                >
                                                                    <span className="font-mono text-emerald-400 font-semibold text-xs w-16 shrink-0">
                                                                        {asgn.course_code}
                                                                    </span>
                                                                    <span className="flex-1 text-slate-300 text-sm truncate">
                                                                        {asgn.course_name}
                                                                    </span>
                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                        <span className="text-xs text-violet-400 font-bold bg-violet-900/30 border border-violet-800/50 rounded px-1.5 py-0.5">
                                                                            Sec {asgn.section || '—'}
                                                                        </span>
                                                                        <span className="text-xs text-slate-500 hidden sm:block">
                                                                            {asgn.semester || '—'}
                                                                        </span>
                                                                        {pendingDeleteId === asgn.course_id ? (
                                                                            <div className="flex items-center gap-1">
                                                                                <button
                                                                                    onClick={() => { setPendingDeleteId(null); handleDeleteCourse(asgn.course_id); }}
                                                                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-900/40 text-red-400 hover:bg-red-800/50 transition-colors"
                                                                                >
                                                                                    Confirm
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => setPendingDeleteId(null)}
                                                                                    className="text-[10px] font-medium px-1.5 py-0.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => setPendingDeleteId(asgn.course_id)}
                                                                                className="p-1 rounded text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                                                                title="Remove assignment"
                                                                            >
                                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )
                                    }
                                </CardContent>
                            </Card>

                            {/* ── Assign Faculty Modal ──────────────────────────────────── */}
                            <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
                                <DialogContent
                                    className="bg-slate-900 border-slate-700 text-slate-100 max-w-lg"
                                    showCloseButton={false}
                                >
                                    <DialogHeader>
                                        <DialogTitle className="text-slate-100 flex items-center gap-2">
                                            <Users className="h-5 w-5 text-blue-400" />
                                            Assign Faculty to Course
                                        </DialogTitle>
                                        <DialogDescription className="text-slate-500">
                                            Select a course from the catalog, pick a section letter, then choose the faculty member.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-4 py-2">
                                        {/* Course picker */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Course *</label>
                                            <Select
                                                value={String(newAssignment.master_course_id)}
                                                onValueChange={v => setNewAssignment(p => ({ ...p, master_course_id: v, section: '', faculty_id: '' }))}
                                            >
                                                <SelectTrigger className="w-full bg-slate-950 border-slate-700 text-slate-200">
                                                    <SelectValue placeholder="Select a course from catalog…" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                                    {masterCourseList.map(c => (
                                                        <SelectItem
                                                            key={c.id}
                                                            value={String(c.id)}
                                                            disabled={!c.is_active}
                                                            className={!c.is_active ? 'opacity-40 cursor-not-allowed' : ''}
                                                        >
                                                            {c.course_code} – {c.course_name} ({c.semester})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Auto-filled info row */}
                                        {selectedCatalogEntry && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Course Name</label>
                                                    <div className="bg-slate-950/60 border border-slate-700/50 rounded-md px-3 py-2 text-slate-400 text-sm">
                                                        {selectedCatalogEntry.course_name}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Semester</label>
                                                    <div className="bg-slate-950/60 border border-slate-700/50 rounded-md px-3 py-2 text-slate-400 text-sm font-mono">
                                                        {selectedCatalogEntry.semester}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Section + Faculty row */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Section *</label>
                                                <Input
                                                    placeholder="A"
                                                    value={newAssignment.section}
                                                    onChange={e => setNewAssignment(p => ({ ...p, section: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 2) }))}
                                                    maxLength={2}
                                                    disabled={!newAssignment.master_course_id}
                                                    className="bg-slate-950 border-slate-700 text-slate-200 font-mono text-center disabled:opacity-40"
                                                />
                                            </div>
                                            <div className="col-span-2 space-y-1">
                                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Faculty *</label>
                                                <Select
                                                    value={newAssignment.faculty_id}
                                                    onValueChange={v => setNewAssignment(p => ({ ...p, faculty_id: v }))}
                                                    disabled={!newAssignment.master_course_id}
                                                >
                                                    <SelectTrigger className="w-full bg-slate-950 border-slate-700 text-slate-200 disabled:opacity-40">
                                                        <SelectValue placeholder="Select faculty…" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                                        {facultyList.filter(f => f.first_name && f.last_name).map(f => (
                                                            <SelectItem
                                                                key={f.faculty_id}
                                                                value={f.faculty_id}
                                                                disabled={!f.is_active}
                                                                className={!f.is_active ? 'opacity-40 cursor-not-allowed' : ''}
                                                            >
                                                                {f.first_name} {f.last_name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Inline validation messages */}
                                        {facultyAlreadyOnSection && (
                                            <div className="flex items-center gap-2 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2">
                                                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                                                <p className="text-xs text-red-400">
                                                    This faculty is already assigned to {selectedCatalogEntry?.course_code} Section {newAssignment.section}.
                                                </p>
                                            </div>
                                        )}
                                        {!facultyAlreadyOnSection && sectionTaken && (
                                            <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-800/50 rounded-lg px-3 py-2">
                                                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                                                <p className="text-xs text-amber-400">
                                                    {selectedCatalogEntry?.course_code} Section {newAssignment.section} is already assigned to another faculty. Try a different section (B, C…).
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={closeAssignModal}
                                            className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40"
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
                            <Card className="bg-slate-900 border-slate-800 shadow-none">
                                <CardHeader className="border-b border-slate-800 py-4">
                                    <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                                        <Users className="h-4 w-4 text-blue-400" /> Faculty Management
                                    </CardTitle>
                                    <CardDescription className="text-slate-500">
                                        Double-click a cell to edit Emp ID, Employment Type, or Status. List updates automatically when permissions change.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="border border-slate-800 rounded-md overflow-hidden bg-slate-950" style={{ height: '500px' }}>
                                        <div style={{ height: '100%', width: '100%' }}>
                                            <AgGridReact
                                                theme={customTheme}
                                                rowData={facultyList}
                                                columnDefs={facultyColumnDefs}
                                                getRowId={(params) => String(params.data.faculty_id)}
                                                defaultColDef={{
                                                    sortable: true,
                                                    filter: true,
                                                    resizable: true,
                                                }}
                                                animateRows={true}
                                                stopEditingWhenCellsLoseFocus={true}
                                                onCellValueChanged={handleFacultyCellValueChanged}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent >

                        {/* TAB: DOCUMENT TYPES */}
                        <TabsContent value="doc_types" className="mt-0">
                            <Card className="bg-slate-900 border-slate-800 shadow-none">
                                <CardHeader className="border-b border-slate-800 py-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div>
                                            <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                                                <Folder className="h-4 w-4 text-blue-400" /> Document Requirements
                                            </CardTitle>
                                            <CardDescription className="text-slate-500">Manage required submissions and their target folders</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    {/* Add New Form */}
                                    <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 flex flex-col md:flex-row gap-3 items-start">
                                        {/* Requirement Name Column */}
                                        <div className="flex-1 space-y-1 w-full">
                                            <Label className="text-xs font-semibold text-slate-400 uppercase">Requirement Name</Label>
                                            <Input
                                                placeholder="e.g. Quarterly Report"
                                                value={newReq.name}
                                                onChange={(e) => setNewReq({ ...newReq, name: e.target.value })}
                                                className={`bg-slate-900 border-slate-700 text-slate-200 ${isDuplicateRequirement ? 'border-red-500/50' : ''}`}
                                            />
                                            <div className="min-h-[1.25rem]">
                                                {isDuplicateRequirement && (
                                                    <p className="text-[10px] text-red-400 font-medium italic flex items-center gap-1 mt-1">
                                                        <AlertTriangle className="h-2.5 w-2.5" />
                                                        "{newReq.name}" is already a requirement.
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* GDrive Folder Name Column */}
                                        <div className="flex-1 space-y-1 w-full">
                                            <Label className="text-xs font-semibold text-slate-400 uppercase">GDrive Folder Name</Label>
                                            <Input
                                                placeholder="e.g. Reports_Q1"
                                                value={newReq.folder}
                                                disabled={!newReq.name.trim() || isDuplicateRequirement}
                                                onChange={(e) => setNewReq({ ...newReq, folder: e.target.value })}
                                                className={`bg-slate-900 border-slate-700 text-slate-200 ${isDuplicateFolder ? 'border-red-500/50' : ''} disabled:opacity-30 disabled:cursor-not-allowed`}
                                            />
                                            <div className="min-h-[1.25rem]">
                                                {isDuplicateFolder && (
                                                    <p className="text-[10px] text-red-400 font-medium italic flex items-center gap-1 mt-1">
                                                        <AlertTriangle className="h-2.5 w-2.5" />
                                                        Folder "/{newReq.folder}" is already in use.
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Required Checkbox Column */}
                                        <div className="w-auto shrink-0 space-y-1">
                                            <Label className="text-xs font-semibold text-transparent select-none uppercase pointer-events-none">_</Label>
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
                                        <div className="w-auto shrink-0 space-y-1">
                                            <Label className="text-xs font-semibold text-transparent select-none uppercase pointer-events-none">_</Label>
                                            <div className="h-9 flex items-center">
                                                <Button
                                                    className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 disabled:opacity-40 h-10 px-6 w-full md:w-auto min-w-[80px]"
                                                    disabled={!canAddDocType}
                                                    onClick={() => {
                                                        if (canAddDocType) {
                                                            addDocRequirement(newReq);
                                                            setNewReq({ name: '', folder: '', required: true });
                                                        }
                                                    }}
                                                >
                                                    <Plus className="h-4 w-4 mr-2" /> Add
                                                </Button>
                                            </div>
                                            <div className="min-h-[1.25rem]" />
                                        </div>
                                    </div>

                                    {/* Card Grid */}
                                    {docRequirements.length === 0 ? (
                                        <div className="text-center py-12 text-slate-500">
                                            <Folder className="h-10 w-10 mx-auto mb-3 text-slate-700" />
                                            <p className="text-sm font-medium">No document types configured yet</p>
                                            <p className="text-xs mt-1">Use the form above to add your first requirement</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {docRequirements.map(req => {
                                                const isActive = req.is_active !== false;
                                                return (
                                                    <div
                                                        key={req.id}
                                                        className={`bg-slate-950/60 border rounded-xl overflow-hidden transition-all hover:shadow-lg ${isActive
                                                            ? 'border-slate-800 hover:border-slate-600'
                                                            : 'border-slate-800/50 opacity-60'
                                                            }`}
                                                    >
                                                        {/* Card Header */}
                                                        <div className="flex items-start gap-3 px-4 py-3.5 border-b border-slate-800/50">
                                                            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${req.required
                                                                ? 'bg-gradient-to-br from-blue-600/20 to-indigo-600/20 text-blue-400'
                                                                : 'bg-slate-800/60 text-slate-500'
                                                                }`}>
                                                                <FileIcon className="h-5 w-5" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-slate-100 font-semibold text-sm truncate">{req.name}</p>
                                                                <p className="text-xs text-slate-500 mt-0.5 font-mono truncate">/{req.folder}</p>
                                                            </div>
                                                        </div>

                                                        {/* Card Body — badges row */}
                                                        <div className="px-4 py-2.5 flex items-center gap-2 flex-wrap">
                                                            {req.required ? (
                                                                <Badge variant="outline" className="text-[10px] border-blue-800/60 text-blue-400 px-2">
                                                                    Required
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-500 px-2">
                                                                    Optional
                                                                </Badge>
                                                            )}
                                                            <Badge variant="outline" className={`text-[10px] px-2 ${isActive
                                                                ? 'border-emerald-800/60 text-emerald-400'
                                                                : 'border-amber-800/60 text-amber-400'
                                                                }`}>
                                                                {isActive ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                        </div>

                                                        {/* Card Footer — actions */}
                                                        <div className="px-4 py-2.5 border-t border-slate-800/50 flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] text-slate-500 uppercase font-semibold">Active</span>
                                                                <Switch
                                                                    checked={isActive}
                                                                    onCheckedChange={(c) => updateDocRequirement(req.id, { is_active: c })}
                                                                    className="data-[state=checked]:bg-emerald-600 scale-90"
                                                                />
                                                            </div>
                                                            {pendingDeleteId === req.id ? (
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        onClick={() => { setPendingDeleteId(null); deleteDocRequirement(req.id); }}
                                                                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-900/40 text-red-400 hover:bg-red-800/50 transition-colors"
                                                                    >
                                                                        Confirm
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setPendingDeleteId(null)}
                                                                        className="text-[10px] font-medium px-1.5 py-0.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => setPendingDeleteId(req.id)}
                                                                    className="p-1.5 rounded text-slate-600 hover:text-red-400 hover:bg-slate-800/50 transition-all"
                                                                    title="Delete document type"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
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
                            <Card className="bg-slate-900 border-slate-800 shadow-none">
                                <CardHeader className="border-b border-slate-800 py-4 flex flex-row justify-between items-center">
                                    <div>
                                        <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-emerald-400" /> Certificates
                                        </CardTitle>
                                        <CardDescription className="text-slate-500">Manage Clearance Certificates and visual calibration.</CardDescription>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                        onClick={() => setTemplateModalOpen(true)}
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Upload New Certificate
                                    </Button>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="ag-theme-balham-dark" style={{ height: 350, width: '100%' }}>
                                        <AgGridReact
                                            theme={customTheme}
                                            rowData={certificateTemplates}
                                            columnDefs={certificateColumnDefs}
                                            animateRows={true}
                                            suppressCellFocus={true}
                                            overlayNoRowsTemplate={
                                                `<div style="padding: 20px; text-align: center; color: #64748b;">
                                                <div style="font-size: 24px; margin-bottom: 8px;">🎓</div>
                                                No certificates deployed.
                                            </div>`
                                            }
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* General Templates Grid */}
                            <Card className="bg-slate-900 border-slate-800 shadow-none">
                                <CardHeader className="border-b border-slate-800 py-4 flex flex-row justify-between items-center">
                                    <div>
                                        <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                                            <LayoutTemplate className="h-4 w-4 text-purple-400" /> System Templates
                                        </CardTitle>
                                        <CardDescription className="text-slate-500">Manage Syllabus, Grade Sheets, and General templates.</CardDescription>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                        onClick={() => setTemplateModalOpen(true)}
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Upload New Template
                                    </Button>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="ag-theme-balham-dark" style={{ height: 350, width: '100%' }}>
                                        <AgGridReact
                                            theme={customTheme}
                                            rowData={generalTemplates}
                                            columnDefs={generalColumnDefs}
                                            animateRows={true}
                                            suppressCellFocus={true}
                                            overlayNoRowsTemplate={
                                                `<div style="padding: 20px; text-align: center; color: #64748b;">
                                                <div style="font-size: 24px; margin-bottom: 8px;">📑</div>
                                                No generic templates deployed.
                                            </div>`
                                            }
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB: SCHEDULING (HOLIDAYS) */}
                        < TabsContent value="scheduling" className="mt-0" >
                            <Card className="bg-slate-900 border-slate-800 shadow-none">
                                <CardHeader className="border-b border-slate-800 py-4">
                                    <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-blue-400" /> Holiday Scheduling
                                    </CardTitle>
                                    <CardDescription className="text-slate-500">Manage holidays to pause automated email reminders</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    {/* Add Holiday Date Range */}
                                    <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-lg flex flex-col md:flex-row gap-4 items-end">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-slate-400 uppercase">Start Date</Label>
                                            <Input
                                                type="date"
                                                value={newHoliday.startDate}
                                                min={todayStr}
                                                onChange={e => setNewHoliday({ ...newHoliday, startDate: e.target.value })}
                                                className={`bg-slate-900 border-slate-700 text-slate-200 ${holidayIsPast || holidayStartDateOccupied ? 'border-red-500/50' : ''}`}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-slate-400 uppercase">End Date (Optional)</Label>
                                            <Input
                                                type="date"
                                                value={newHoliday.endDate}
                                                min={newHoliday.startDate || todayStr}
                                                disabled={!newHoliday.startDate}
                                                onChange={e => setNewHoliday({ ...newHoliday, endDate: e.target.value })}
                                                className={`bg-slate-900 border-slate-700 text-slate-200 ${holidayEndDateInvalid || holidayEndDateOccupied || holidayEndDateSameAsStart ? 'border-red-500/50' : ''} disabled:opacity-30`}
                                            />
                                        </div>
                                        <div className="flex-1 space-y-2 w-full">
                                            <Label className="text-xs font-semibold text-slate-400 uppercase">Description</Label>
                                            <Input
                                                placeholder="e.g. Christmas Break"
                                                value={newHoliday.description}
                                                onChange={e => setNewHoliday({ ...newHoliday, description: e.target.value })}
                                                className={`bg-slate-900 border-slate-700 text-slate-200 ${holidayDescriptionDuplicate ? 'border-red-500/50' : ''}`}
                                            />
                                        </div>
                                        {/* Removed Recurring checkbox as it's redundant across semesters */}
                                        <Button
                                            className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 disabled:opacity-40"
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
                                    <div className="space-y-1">
                                        {holidayDescriptionDuplicate && (
                                            <p className="text-xs text-red-400 font-medium italic flex items-center gap-1.5">
                                                <AlertTriangle className="h-3 w-3" /> "{newHoliday.description}" already exists. Description must be unique.
                                            </p>
                                        )}
                                        {holidayIsPast && (
                                            <p className="text-xs text-red-400 font-medium italic flex items-center gap-1.5">
                                                <AlertTriangle className="h-3 w-3" /> Start date cannot be in the past.
                                            </p>
                                        )}
                                        {holidayEndDateInvalid && (
                                            <p className="text-xs text-red-400 font-medium italic flex items-center gap-1.5">
                                                <AlertTriangle className="h-3 w-3" /> End date must be after Start date.
                                            </p>
                                        )}
                                        {holidayOccupiedDates.length > 0 && (
                                            <p className="text-xs text-red-400 font-medium italic flex items-center gap-1.5">
                                                <AlertTriangle className="h-3 w-3" />
                                                Occupied: {holidayOccupiedDates.join(', ')}. Please choose different dates.
                                            </p>
                                        )}
                                        {holidayEndDateSameAsStart && (
                                            <p className="text-xs text-red-400 font-medium italic flex items-center gap-1.5">
                                                <AlertTriangle className="h-3 w-3" />
                                                {newHoliday.startDate} is already a start date. Please choose another date.
                                            </p>
                                        )}
                                    </div>

                                    {/* List */}
                                    <div className="space-y-2 mt-6">
                                        {holidays.length === 0 ? (
                                            <div className="text-center py-8 text-slate-500">No holidays scheduled.</div>
                                        ) : (
                                            <div className="h-[400px] w-full">
                                                <AgGridReact
                                                    theme={customTheme}
                                                    rowData={holidays}
                                                    columnDefs={holidayColDefs}
                                                    animateRows={true}
                                                    suppressCellFocus={true}
                                                    getRowId={(params) => String(params.data.holiday_id || params.data.id)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent >

                        {/* TAB 2: VALIDATION RULES */}
                        <TabsContent value="validation" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {/* Left Pane - Document Types List */}
                                <div className="md:col-span-1 space-y-4">
                                    <Card className="bg-slate-900 border-slate-800 shadow-none h-full md:max-h-[650px] flex flex-col">
                                        <CardHeader className="border-b border-slate-800 py-4 shrink-0">
                                            <CardTitle className="text-sm text-slate-100 flex items-center gap-2">
                                                <Folder className="h-4 w-4 text-blue-400" /> Document Types
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-2 space-y-1 overflow-auto flex-1">
                                            {docRequirements.filter(d => d.is_active).map(doc => (
                                                <button
                                                    key={doc.id}
                                                    onClick={() => setSelectedDocTypeId(doc.id)}
                                                    className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors flex items-center justify-between ${selectedDocTypeId === doc.id
                                                        ? 'bg-blue-600/20 text-blue-400 border border-blue-800/50'
                                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                                                        }`}
                                                >
                                                    <span className="truncate pr-2">{doc.name}</span>
                                                </button>
                                            ))}
                                            {docRequirements.filter(d => d.is_active).length === 0 && (
                                                <div className="p-4 text-xs text-center text-slate-500">No active document types found.</div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Right Pane - Validation Rules Editor */}
                                <div className="md:col-span-3">
                                    <Card className="bg-slate-900 border-slate-800 shadow-none h-full">
                                        <CardHeader className="border-b border-slate-800 py-4">
                                            <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                                                <Shield className="h-4 w-4 text-emerald-400" />
                                                Validation Rules: {docRequirements.find(d => d.id === selectedDocTypeId)?.name || 'Select a Document Type'}
                                            </CardTitle>
                                            <CardDescription className="text-slate-500">
                                                Define the strict criteria the OCR Bot must enforce for this specific document.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            {rulesLoading ? (
                                                <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
                                                    <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                                                    <p className="text-sm">Loading rules...</p>
                                                </div>
                                            ) : !selectedDocTypeId ? (
                                                <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
                                                    <FileText className="h-10 w-10 opacity-20" />
                                                    <p>Select a document type from the left to configure its rules.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-8">
                                                    {/* Text Content Rules */}
                                                    <div>
                                                        <h3 className="text-sm font-medium text-slate-200 mb-4 flex items-center border-b border-slate-800 pb-2">
                                                            <FileText className="mr-2 h-4 w-4 text-blue-400" /> Text Extraction Rules
                                                        </h3>
                                                        <div className="grid grid-cols-1 gap-5 pl-1">
                                                            <div className="space-y-2">
                                                                <div className="flex flex-col gap-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <Label className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Must Contain Keywords</Label>
                                                                        <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">Comma separated</span>
                                                                    </div>
                                                                    <p className="text-[11px] text-amber-500/90 font-medium leading-snug">
                                                                        <span className="font-bold">Recommendation:</span> Choose broad/generic words for batch submissions (like Presentations). As long as one slide in the batch contains the word, the whole batch passes.
                                                                    </p>
                                                                </div>
                                                                <Input
                                                                    value={docRules.required_keywords || ''}
                                                                    onChange={(e) => setDocRules({ ...docRules, required_keywords: e.target.value })}
                                                                    className="bg-slate-950 border-slate-700 text-slate-200 focus:border-emerald-500 text-base"
                                                                    placeholder="e.g. Vision & Mission, Grading System, Course Outcomes"
                                                                />
                                                                <p className="text-xs text-slate-500">The OCR bot will instantly reject the document if any of these phrases are missing.</p>
                                                            </div>

                                                            <div className="space-y-2 mt-2">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="text-sm font-semibold text-red-400 uppercase tracking-wider">Must NOT Contain Keywords</Label>
                                                                    <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">Comma separated</span>
                                                                </div>
                                                                <p className="text-[11px] text-amber-500/90 font-medium leading-snug">
                                                                    <span className="font-bold">Recommendation:</span> Choose broad/generic words for batch submissions (like Presentations). As long as one slide in the batch contains the word, the whole batch is rejected.
                                                                </p>
                                                                <Input
                                                                    value={docRules.forbidden_keywords || ''}
                                                                    onChange={(e) => setDocRules({ ...docRules, forbidden_keywords: e.target.value })}
                                                                    className="bg-slate-950 border-slate-700 text-slate-200 focus:border-red-500 text-base"
                                                                    placeholder="e.g. Draft, Unofficial, Template"
                                                                />
                                                                <p className="text-xs text-slate-500">Prevents upload spoofing (e.g. rejecting a document explicitly marked as "Draft").</p>
                                                            </div>

                                                            <div className="space-y-2 max-w-sm mt-2">
                                                                <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Minimum Word Count</Label>
                                                                <div className="flex items-center gap-3">
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        value={docRules.min_word_count ?? 0}
                                                                        onChange={(e) => setDocRules({ ...docRules, min_word_count: e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0 })}
                                                                        className="bg-slate-950 border-slate-700 text-slate-200 focus:border-blue-500 font-mono text-lg"
                                                                    />
                                                                    <span className="text-sm text-slate-500 whitespace-nowrap">words minimum</span>
                                                                </div>
                                                                <p className="text-xs text-slate-500">Ensures documents have sufficient length, filtering out placeholder single-page uploads.</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* File Constraints */}
                                                    <div className="mt-8">
                                                        <h3 className="text-sm font-medium text-slate-200 mb-4 flex items-center border-b border-slate-800 pb-2">
                                                            <Archive className="mr-2 h-4 w-4 text-amber-400" /> Technical Constraints
                                                        </h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pl-1">
                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Max File Size (MB)</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={docRules.max_file_size_mb}
                                                                    onChange={(e) => setDocRules({ ...docRules, max_file_size_mb: e.target.value === '' ? '' : parseInt(e.target.value, 10) || 10 })}
                                                                    className="bg-slate-950 border-slate-700 text-slate-200 focus:border-blue-500"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Allowed Extensions</Label>
                                                                <Input
                                                                    value={docRules.allowed_extensions || ''}
                                                                    onChange={(e) => setDocRules({ ...docRules, allowed_extensions: e.target.value })}
                                                                    className="bg-slate-950 border-slate-700 text-slate-200 focus:border-blue-500"
                                                                    placeholder=".pdf, .docx, .xlsx"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="pt-6 mt-4 border-t border-slate-800 flex justify-end">
                                                        <Button
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
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

                        {/* TAB 3: OCR & AI */}
                        < TabsContent value="ocr" className="mt-0 space-y-6" >
                            <div className="space-y-6">

                                {/* Engine Config */}
                                <Card className="bg-slate-900 border-slate-800 shadow-none">
                                    <CardHeader className="border-b border-slate-800 py-4">
                                        <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                                            <Cpu className="h-4 w-4 text-purple-400" /> OCR Engine Configuration
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-6">
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-slate-950/50 border border-slate-800">
                                            <div>
                                                <Label className="text-slate-200">Enable Automated Validation</Label>
                                                <p className="text-xs text-slate-500 mt-1">Master switch to run the extraction engine on new uploads</p>
                                            </div>
                                            <Switch
                                                checked={settings.ocr_enabled}
                                                onCheckedChange={(c) => updateSetting('ocr_enabled', c)}
                                                className="data-[state=checked]:bg-blue-600"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Test Area */}
                                <Card className="bg-slate-900 border-slate-800 shadow-none">
                                    <CardHeader className="border-b border-slate-800 py-4">
                                        <CardTitle className="text-base text-slate-100">Parser Test Playground</CardTitle>
                                        <CardDescription className="text-slate-500">Test the Edge Function parser against real files to see how it extracts and validates data.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="flex flex-col gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Validation Rules (Document Type)</Label>
                                                <Select value={testDocTypeId} onValueChange={setTestDocTypeId}>
                                                    <SelectTrigger className="w-full sm:w-80 bg-slate-950 border-slate-700 text-slate-200">
                                                        <SelectValue placeholder="Select Document Type" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
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
                                                        className="bg-slate-950 border-slate-700 text-slate-200 file:text-slate-300 file:bg-slate-800 file:border-0 file:rounded-sm file:mr-4 hover:file:bg-slate-700 flex-1"
                                                    />
                                                ) : (
                                                    <div className="flex-1 bg-slate-950 border border-slate-700 rounded-md px-4 py-2 flex items-center justify-between text-sm overflow-hidden">
                                                        <span className="text-emerald-400 font-medium truncate">
                                                            {testFile.length === 1 ? testFile[0].name : `${testFile.length} files staged for batch testing`}
                                                        </span>
                                                    </div>
                                                )}
                                                <Button
                                                    onClick={() => runTestOCR(testFile, testDocTypeId)}
                                                    disabled={!testFile || testFile.length === 0 || !testDocTypeId || processing}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                                                >
                                                    {processing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                                                    Run Parser
                                                </Button>
                                            </div>
                                        </div>

                                        {testResult && (
                                            <div className={`border ${testResult.success ? 'border-emerald-800 bg-emerald-950/20' : 'border-red-900/50 bg-red-950/20'} p-4 rounded-lg mt-4`}>
                                                <div className="flex justify-between mb-3 border-b border-slate-800 pb-2">
                                                    {testResult.success ? (
                                                        <div className="flex gap-4 text-xs font-mono">
                                                            <span className="text-emerald-400 font-bold uppercase tracking-wider">Validation Passed</span>
                                                            {testResult.processing_time_ms && <span className="text-slate-400">Runtime: {testResult.processing_time_ms}ms</span>}
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-4 text-xs font-mono text-red-400 font-bold uppercase tracking-wider">
                                                            <span>Validation Failed / Error</span>
                                                        </div>
                                                    )}
                                                    <Badge variant="outline" className={`text-[10px] border-slate-700 ${testResult.success ? 'text-slate-500' : 'text-red-400'}`}>
                                                        {testResult.success ? 'Analysis Output' : 'System Message'}
                                                    </Badge>
                                                </div>

                                                {testResult.processedFiles && testResult.processedFiles.length > 0 && (
                                                    <div className="mb-3 text-xs text-slate-400 font-mono">
                                                        <span className="font-semibold text-slate-300">Files Processed ({testResult.processedFiles.length}):</span>
                                                        <ul className="mt-1 ml-4 list-disc space-y-0.5">
                                                            {testResult.processedFiles.map((file, idx) => (
                                                                <li key={idx} className="truncate">{file}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                <pre className={`text-xs font-mono overflow-auto max-h-64 whitespace-pre-wrap flex-1 ${testResult.success ? 'text-slate-300' : 'text-red-300'}`}>
                                                    {testResult.success ? testResult.text : (testResult.error || testResult.text)}
                                                </pre>
                                                <div className="mt-3 flex justify-end">
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
                                                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                                                    >
                                                        Clear Results
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent >

                        {/* TAB 4: MAINTENANCE / DANGER ZONE */}
                        < TabsContent value="maintenance" className="mt-0" >
                            <Card className="bg-red-950/10 border-red-900/30 shadow-none">
                                <CardHeader className="border-b border-red-900/30 py-4">
                                    <CardTitle className="text-base text-red-400 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" /> Danger Zone
                                    </CardTitle>
                                    <CardDescription className="text-red-400/60">
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
                        </TabsContent >
                    </div >
                </Tabs >

                {/* Global Modals Mounted Outside of Tabs */}
                {/* Upload Template Modal */}
                <Dialog open={isTemplateModalOpen} onOpenChange={setTemplateModalOpen}>
                    <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-slate-100 flex items-center gap-2">
                                <LayoutTemplate className="h-5 w-5 text-purple-400" />
                                Upload New Template
                            </DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Tie this template to a specific Academic Year and Document Type schema.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-400 uppercase">Document File *</Label>
                                <Input
                                    type="file"
                                    onChange={(e) => setNewTemplate({ ...newTemplate, file: e.target.files?.[0] || null })}
                                    className="bg-slate-950 border-slate-700 text-slate-200 cursor-pointer"
                                    accept=".pdf,.docx,.doc,.xlsx,.xls"
                                    disabled={isUploadingTemplate}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-400 uppercase">Template Title</Label>
                                    <Input
                                        placeholder={!newTemplate.file ? "Attach a file first..." : "e.g. Clearance Cert v1"}
                                        value={newTemplate.title}
                                        onChange={e => setNewTemplate({ ...newTemplate, title: e.target.value })}
                                        className="bg-slate-950 border-slate-700 text-slate-200"
                                        disabled={!newTemplate.file || isUploadingTemplate}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-slate-400 uppercase">System Category</Label>
                                        <Select
                                            value={newTemplate.systemCategory}
                                            onValueChange={v => setNewTemplate({ ...newTemplate, systemCategory: v })}
                                            disabled={!newTemplate.file || isUploadingTemplate}
                                        >
                                            <SelectTrigger className="w-full bg-slate-950 border-slate-700 text-slate-200">
                                                <SelectValue placeholder={!newTemplate.file ? "Attach file first..." : "Select category..."} />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                                <SelectItem value="CLEARANCE_CERTIFICATE">Clearance Certificate</SelectItem>
                                                <SelectItem value="SYLLABUS">Syllabus</SelectItem>
                                                <SelectItem value="GRADE_SHEET">Grade Sheet</SelectItem>
                                                <SelectItem value="GENERAL">General</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-slate-400 uppercase">Description</Label>
                                    <Input
                                        placeholder={!newTemplate.file ? "Attach file first..." : "Optional description"}
                                        value={newTemplate.description}
                                        onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })}
                                        className="bg-slate-950 border-slate-700 text-slate-200"
                                        disabled={!newTemplate.file || isUploadingTemplate}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-slate-400 uppercase">Academic Year</Label>
                                        <Select
                                            value={newTemplate.academicYear}
                                            onValueChange={v => setNewTemplate({ ...newTemplate, academicYear: v })}
                                            disabled={!newTemplate.file || isUploadingTemplate}
                                        >
                                            <SelectTrigger className="w-full bg-slate-950 border-slate-700 text-slate-200">
                                                <SelectValue placeholder={!newTemplate.file ? "Attach file first..." : "e.g. 2024-2025"} />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                                <SelectItem value="2023-2024">2023-2024</SelectItem>
                                                <SelectItem value="2024-2025">2024-2025</SelectItem>
                                                <SelectItem value="2025-2026">2025-2026</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-slate-400 uppercase">Semester</Label>
                                        <Select
                                            value={newTemplate.semester}
                                            onValueChange={v => setNewTemplate({ ...newTemplate, semester: v })}
                                            disabled={!newTemplate.file || isUploadingTemplate}
                                        >
                                            <SelectTrigger className="w-full bg-slate-950 border-slate-700 text-slate-200">
                                                <SelectValue placeholder={!newTemplate.file ? "Attach file first..." : "e.g. 1st Semester"} />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                                <SelectItem value="1st Semester">1st Semester</SelectItem>
                                                <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                                                <SelectItem value="Summer">Summer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setTemplateModalOpen(false)} className="text-slate-400">Cancel</Button>
                            <Button
                                className="bg-purple-600 hover:bg-purple-700 text-white"
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
                                {isUploadingTemplate ? 'Uploading...' : 'Upload Template'}
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
                    <DialogContent className="bg-slate-900 border-red-900/50 text-slate-100 max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-red-400 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                {dangerModalConfig.title}
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 mt-2">
                                {dangerModalConfig.description}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4 space-y-3 border-y border-red-900/20 my-2">
                            <Label className="text-sm font-semibold text-slate-300">
                                Please type <span className="text-red-400 font-mono select-none px-1 py-0.5 bg-red-950/30 rounded">{dangerModalConfig.confirmationText}</span> to confirm.
                            </Label>
                            <Input
                                placeholder={`Type ${dangerModalConfig.confirmationText}`}
                                value={dangerModalInput}
                                onChange={(e) => setDangerModalInput(e.target.value)}
                                className="bg-slate-950 border-slate-700 text-slate-200 focus:border-red-500 font-mono"
                                autoComplete="off"
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                variant="ghost"
                                onClick={() => setIsDangerModalOpen(false)}
                                className="text-slate-400 hover:text-slate-300 hover:bg-slate-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={executeDangerAction}
                                disabled={dangerModalInput !== dangerModalConfig.confirmationText || processing}
                            >
                                {processing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
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
        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 text-slate-400 rounded-none px-4 py-3 border-b-2 border-transparent hover:text-slate-200 transition-all font-medium text-sm"
    >
        <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span>{label}</span>
        </div>
    </TabsTrigger>
);

const InfoRow = ({ label, value }) => (
    <div className="flex justify-between items-center text-sm py-3 border-b border-slate-800/50 last:border-0 hover:bg-slate-900/50 px-2 rounded transition-colors bg-transparent">
        <span className="text-slate-400 font-medium">{label}</span>
        <span className="font-mono text-slate-200 bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800">{value}</span>
    </div>
);

const CheckboxItem = ({ label, checked, onChange }) => (
    <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-950/30 border border-slate-800/50 hover:border-slate-700 hover:bg-slate-950/50 transition-all cursor-pointer group" onClick={() => onChange(!checked)}>
        <Checkbox
            id={label}
            checked={checked}
            onCheckedChange={onChange}
            className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-4 w-4 rounded shadow-sm group-hover:border-blue-500/50"
        />
        <label
            htmlFor={label}
            className="text-sm font-medium leading-none text-slate-300 cursor-pointer select-none group-hover:text-slate-200"
        >
            {label}
        </label>
    </div>
);

const DangerRow = ({ title, desc, btnText, onClick }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-red-950/10 border border-red-900/20 rounded-lg gap-4 hover:border-red-900/40 transition-all">
        <div>
            <h4 className="font-medium text-red-200 text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                {title}
            </h4>
            <p className="text-xs text-red-200/50 mt-1 pl-6">{desc}</p>
        </div>
        <Button
            variant="ghost"
            onClick={onClick}
            className="text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-red-900/30 hover:border-red-500/30 whitespace-nowrap"
            size="sm"
        >
            {btnText}
        </Button>
    </div>
);