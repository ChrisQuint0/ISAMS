import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThesisSettingsModal } from "../components/ThesisSettingsModal";
import HTEStudentPage from "./HTEStudentPage";
import {
    Search, FileText, Upload, CheckCircle2, Clock, AlertCircle,
    Mail, Eye, Users, Building2, Download, X, ShieldCheck, GraduationCap,
    Ban, RefreshCw, Trash2, Calendar, User, ChevronRight, AlertTriangle,
    History, ChevronDown, ChevronUp, Settings, Plus, GripVertical,
    ToggleLeft, ToggleRight, Save, MinusCircle, ShieldAlert, Edit,
    Timer, UserPlus, ExternalLink, Loader2
} from "lucide-react";
import AddStudentModal from "../components/AddStudentModal";
import { thesisService } from "../services/thesisService";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

var hteTheme = themeQuartz.withParams({
    accentColor: '#0ea5e9',
    backgroundColor: '#ffffff',
    foregroundColor: '#171717',
    borderColor: '#e5e5e5',
    headerBackgroundColor: '#f9fafb',
    headerTextColor: '#6b7280',
    rowHeight: 52,
    headerHeight: 48,
});

var PORTAL_BASE_URL = "https://ojt-portal.university.edu/upload";

var RoleContext = React.createContext({ role: "admin", studentId: null });
export function useRole() { return React.useContext(RoleContext); }
export function RoleProvider(props) {
    return React.createElement(RoleContext.Provider, { value: { role: props.role, studentId: props.studentId } }, props.children);
}

var ACCEPTED_FORMATS = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
];
var ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".jpg", ".jpeg", ".png"];
var MAX_FILE_SIZE_MB = 10;
var MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
var DUPLICATE_SEND_COOLDOWN_MINUTES = 60;
var DUPLICATE_SEND_COOLDOWN_MS = DUPLICATE_SEND_COOLDOWN_MINUTES * 60 * 1000;

var INITIAL_DOC_FIELDS = [
    { id: "f-1", name: "Curriculum Vitae", category: "ojt", order: 1, active: true },
    { id: "f-2", name: "Certificate of Registration (COR)", category: "ojt", order: 2, active: true },
    { id: "f-3", name: "OJT Seminar Certificate", category: "ojt", order: 3, active: true },
    { id: "f-4", name: "Received Copy of the OJT Recommendation Letter", category: "ojt", order: 4, active: true },
    { id: "f-5", name: "OJT Waiver", category: "ojt", order: 5, active: true },
    { id: "f-6", name: "Training Agreement", category: "ojt", order: 6, active: true },
    { id: "f-7", name: "Job Description", category: "ojt", order: 7, active: true },
    { id: "f-8", name: "Attendance Record", category: "ojt", order: 8, active: true },
    { id: "f-9", name: "OJT Progress Report", category: "ojt", order: 9, active: true },
    { id: "f-10", name: "Job Proficiency Rating / Evaluation Sheet", category: "ojt", order: 10, active: true },
    { id: "f-11", name: "OJT Certificate", category: "ojt", order: 11, active: true },
    { id: "f-12", name: "Narrative Report", category: "ojt", order: 12, active: true },
    { id: "f-13", name: "Pictures with Captions", category: "ojt", order: 13, active: true },
    { id: "f-14", name: "Company Profile", category: "hte", order: 1, active: true },
    { id: "f-15", name: "Company Evaluation of Internship", category: "hte", order: 2, active: true },
];

function buildInitialUploads(fieldIds) {
    var records = {};
    for (var i = 0; i < fieldIds.length; i++) {
        records[fieldIds[i]] = { fieldId: fieldIds[i], status: "pending", file: null, uploadedBy: null, uploadedAt: null };
    }
    return records;
}

var ALL_FIELD_IDS = INITIAL_DOC_FIELDS.map(function (f) { return f.id; });

function makeUploadedRecord(fieldId, uploadedBy, uploadedAt, fileName, fileSize) {
    return { fieldId: fieldId, status: "uploaded", file: { name: fileName, size: fileSize }, uploadedBy: uploadedBy, uploadedAt: uploadedAt };
}

var INITIAL_STUDENTS = [
    {
        id: "25-00001", lastName: "Quinto", firstName: "Christopher", middleInitial: "A.",
        year: "2024-2025", semester: "2nd Semester", section: "4A", program: "Computer Science",
        adviser: "Dr. Ricardo Santos", email: "quinto_christopher@plpasig.edu.ph",
        name: "Christopher Quinto", // Backward compatibility
        uploads: (function () {
            var r = buildInitialUploads(ALL_FIELD_IDS);
            var uFields = ["f-1", "f-2", "f-3", "f-4", "f-5", "f-6", "f-7", "f-8", "f-9", "f-10"];
            for (var i = 0; i < uFields.length; i++) {
                r[uFields[i]] = makeUploadedRecord(uFields[i], "student", "2025-01-15T09:30:00Z", "doc_" + uFields[i] + ".pdf", 512000);
            }
            r["f-14"] = makeUploadedRecord("f-14", "coordinator", "2025-01-20T14:00:00Z", "company_profile.pdf", 1024000);
            return r;
        })(),
    },
    {
        id: "25-00002", lastName: "Santos", firstName: "Maria", middleInitial: "B.",
        year: "2024-2025", semester: "2nd Semester", section: "4B", program: "Information Technology",
        adviser: "Prof. Elena Cruz", email: "santos_maria@plpasig.edu.ph",
        name: "Maria Santos",
        uploads: (function () {
            var r = buildInitialUploads(ALL_FIELD_IDS);
            for (var i = 0; i < ALL_FIELD_IDS.length; i++) {
                r[ALL_FIELD_IDS[i]] = makeUploadedRecord(ALL_FIELD_IDS[i], "student", "2025-01-10T08:00:00Z", "doc_" + ALL_FIELD_IDS[i] + ".pdf", 400000);
            }
            return r;
        })(),
    },
    {
        id: "25-00003", lastName: "Dela Cruz", firstName: "Juan", middleInitial: "C.",
        year: "2024-2025", semester: "2nd Semester", section: "4A", program: "Computer Science",
        adviser: "Dr. Ricardo Santos", email: "dela_cruz_juan@plpasig.edu.ph",
        name: "Juan dela Cruz",
        uploads: (function () {
            var r = buildInitialUploads(ALL_FIELD_IDS);
            var uFields = ["f-1", "f-2", "f-3", "f-4", "f-5", "f-6", "f-7", "f-8"];
            for (var i = 0; i < uFields.length; i++) {
                r[uFields[i]] = makeUploadedRecord(uFields[i], "student", "2025-01-12T10:00:00Z", "doc_" + uFields[i] + ".pdf", 300000);
            }
            return r;
        })(),
    },
    {
        id: "25-00004", lastName: "Johnson", firstName: "Sarah", middleInitial: "D.",
        year: "2024-2025", semester: "2nd Semester", section: "4C", program: "Information Technology",
        adviser: "Prof. Elena Cruz", email: "johnson_sarah@plpasig.edu.ph",
        name: "Sarah Johnson",
        uploads: (function () {
            var r = buildInitialUploads(ALL_FIELD_IDS);
            var uFields = ["f-1", "f-2", "f-3", "f-4", "f-5", "f-6", "f-7", "f-8", "f-9", "f-10", "f-11", "f-12"];
            for (var i = 0; i < uFields.length; i++) {
                r[uFields[i]] = makeUploadedRecord(uFields[i], "student", "2025-01-14T09:00:00Z", "doc_" + uFields[i] + ".pdf", 600000);
            }
            r["f-14"] = makeUploadedRecord("f-14", "coordinator", "2025-01-22T15:30:00Z", "company_profile.pdf", 900000);
            r["f-15"] = makeUploadedRecord("f-15", "coordinator", "2025-01-22T15:30:00Z", "evaluation.pdf", 900000);
            return r;
        })(),
    },
    {
        id: "24-00015", lastName: "Lee", firstName: "Robert", middleInitial: "E.",
        year: "2023-2024", semester: "2nd Semester", section: "4A", program: "Computer Science",
        adviser: "Dr. Ricardo Santos", email: "lee_robert@plpasig.edu.ph",
        name: "Robert Lee",
        uploads: (function () {
            var r = buildInitialUploads(ALL_FIELD_IDS);
            for (var i = 0; i < ALL_FIELD_IDS.length; i++) {
                r[ALL_FIELD_IDS[i]] = makeUploadedRecord(ALL_FIELD_IDS[i], "student", "2024-06-01T08:00:00Z", "doc_" + ALL_FIELD_IDS[i] + ".pdf", 450000);
            }
            return r;
        })(),
    },
];

function getActiveFields(docFields, category) {
    return docFields.filter(function (f) { return f.category === category && f.active; })
        .sort(function (a, b) { return a.order - b.order; });
}
function getAllActiveFields(docFields) {
    return docFields.filter(function (f) { return f.active; });
}
function getStudentStatus(student, docFields) {
    var active = getAllActiveFields(docFields);
    for (var i = 0; i < active.length; i++) {
        var rec = student.uploads[active[i].id];
        if (!rec || rec.status !== "uploaded") return "incomplete";
    }
    return "complete";
}
function countUploadedForFields(student, fields) {
    var count = 0;
    for (var i = 0; i < fields.length; i++) {
        var rec = student.uploads[fields[i].id];
        if (rec && rec.status === "uploaded") count++;
    }
    return count;
}
function validateFile(file) {
    if (ACCEPTED_FORMATS.indexOf(file.type) === -1) {
        return "Unsupported format. Accepted: " + ACCEPTED_EXTENSIONS.join(", ");
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
        return "File too large. Max " + MAX_FILE_SIZE_MB + " MB. Current: " + (file.size / 1024 / 1024).toFixed(1) + " MB";
    }
    return null;
}
function formatTimestamp(iso) {
    if (!iso) return "-";
    var d = new Date(iso);
    return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function formatFileSize(bytes) {
    if (!bytes) return "-";
    if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB";
    return Math.round(bytes / 1024) + " KB";
}
function generateFieldId() { return "f-custom-" + Date.now(); }

/**
 * Returns a map of { studentId -> ISO timestamp } for all students notified
 * within the cooldown window, based on the notification log.
 * This is the source of truth for "recently notified" state.
 */
function buildRecentlySentMap(notificationLog) {
    var now = Date.now();
    var map = {}; // studentId -> most recent send timestamp (ms)
    for (var i = 0; i < notificationLog.length; i++) {
        var entry = notificationLog[i];
        var sentAt = new Date(entry.timestamp).getTime();
        if (now - sentAt > DUPLICATE_SEND_COOLDOWN_MS) continue; // expired
        for (var j = 0; j < entry.students.length; j++) {
            var sid = entry.students[j].id;
            if (!map[sid] || sentAt > map[sid]) {
                map[sid] = sentAt; // keep most recent
            }
        }
    }
    return map;
}

/**
 * Given a set of selected student IDs and the recentlySentMap,
 * returns an object describing which are blocked vs. which can proceed.
 *   { allBlocked: bool, blockedIds: Set, allowedIds: Set }
 */
function classifySelection(selectedIds, recentlySentMap) {
    var blockedIds = new Set();
    var allowedIds = new Set();
    selectedIds.forEach(function (id) {
        if (recentlySentMap[id]) {
            blockedIds.add(id);
        } else {
            allowedIds.add(id);
        }
    });
    return {
        allBlocked: blockedIds.size === selectedIds.size,
        someBlocked: blockedIds.size > 0,
        blockedIds: blockedIds,
        allowedIds: allowedIds,
    };
}

function formatCooldownRemaining(sentAtMs) {
    var remaining = DUPLICATE_SEND_COOLDOWN_MS - (Date.now() - sentAtMs);
    if (remaining <= 0) return "0m";
    var minutes = Math.ceil(remaining / 60000);
    if (minutes >= 60) {
        var h = Math.floor(minutes / 60);
        var m = minutes % 60;
        return h + "h" + (m > 0 ? " " + m + "m" : "");
    }
    return minutes + "m";
}

// Button classes
var btnBase = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 cursor-pointer";
var btnDefault = btnBase + " h-9 px-4 py-2 bg-primary-500 text-white hover:bg-primary-600 shadow-sm border border-primary-600";
var btnOutline = btnBase + " h-9 px-4 py-2 border border-neutral-300 bg-white text-neutral-900 shadow-xs hover:bg-neutral-100 hover:border-neutral-400";
var btnGhost = btnBase + " h-9 px-4 py-2 text-neutral-900 border border-neutral-200 bg-white hover:bg-neutral-100 hover:border-neutral-300 shadow-xs";
var btnSecondary = btnBase + " h-9 px-4 py-2 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 shadow-xs border border-neutral-300 hover:border-neutral-400";
var btnDestructive = btnBase + " h-9 px-4 py-2 bg-destructive-semantic text-white hover:bg-destructive-semantic/90 shadow-sm border border-destructive-semantic";
var btnIconGhost = btnBase + " size-7 text-neutral-500 border border-neutral-200 bg-white hover:bg-neutral-100 hover:text-neutral-900 hover:border-neutral-300 shadow-xs";
var btnIconDestructive = btnBase + " size-7 text-destructive-semantic border border-destructive-semantic/30 bg-destructive-semantic/5 hover:bg-destructive-semantic/10 hover:border-destructive-semantic/50 shadow-xs";
var btnSmDefault = btnBase + " h-8 px-3 text-xs gap-1.5 bg-primary-500 text-white hover:bg-primary-600 shadow-sm border border-primary-600";
var btnSmOutline = btnBase + " h-8 px-3 text-xs gap-1.5 border border-neutral-300 bg-white text-neutral-900 shadow-xs hover:bg-neutral-100 hover:border-neutral-400";
var btnSmGhost = btnBase + " h-8 px-3 text-xs gap-1.5 text-neutral-500 border border-neutral-200 bg-white hover:bg-neutral-100 hover:text-neutral-900 hover:border-neutral-300 shadow-xs";
var btnSmSecondary = btnBase + " h-8 px-3 text-xs gap-1.5 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 shadow-xs border border-neutral-300 hover:border-neutral-400";
var btnWarning = btnBase + " h-9 px-4 py-2 bg-warning text-white hover:bg-warning/90 shadow-sm border border-warning/80";

var STATUS_CONFIG = {
    "uploaded": { icon: CheckCircle2, text: "Uploaded", badge: "bg-success/10 border-success/40 text-success", wrapper: "bg-success/10 border-success/30 text-success" },
    "pending": { icon: Clock, text: "Pending", badge: "bg-warning/10 border-warning/40 text-warning", wrapper: "bg-warning/10 border-warning/30 text-warning" },
    "not_required": { icon: MinusCircle, text: "Not Required", badge: "bg-neutral-500/10 border-neutral-500/40 text-neutral-500", wrapper: "bg-neutral-500/10 border-neutral-500/30 text-neutral-500" },
};

// ── Main Page ───────────────────────────────────────────────────────────────
export default function HTEDocumentArchivePage() {
    var ctx = useRole();
    var role = ctx.role;
    var studentId = ctx.studentId;
    const { user } = useAuth();

    const actorInfo = React.useMemo(() => ({
        actorUserId: user?.id,
        actorName: user?.user_metadata?.first_name 
            ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim()
            : user?.email || "System User"
    }), [user]);

    var s1 = React.useState([]); var students = s1[0]; var setStudents = s1[1];
    var s2 = React.useState([]); var docFields = s2[0]; var setDocFields = s2[1];
    var s3 = React.useState(""); var searchQuery = s3[0]; var setSearchQuery = s3[1];
    var s4 = React.useState("all"); var yearFilter = s4[0]; var setYearFilter = s4[1];
    var s5 = React.useState("all"); var statusFilter = s5[0]; var setStatusFilter = s5[1];
    var s18 = React.useState("all"); var programFilter = s18[0]; var setProgramFilter = s18[1];
    var s19 = React.useState("all"); var adviserFilter = s19[0]; var setAdviserFilter = s19[1];
    var s20 = React.useState("all"); var sectionFilter = s20[0]; var setSectionFilter = s20[1];
    var [loading, setLoading] = React.useState(true);
    var [filterOptions, setFilterOptions] = React.useState({ advisers: [], sections: [] });
    var s6 = React.useState(new Set()); var selectedStudents = s6[0]; var setSelectedStudents = s6[1];
    var s7 = React.useState(false); var showBatchPreview = s7[0]; var setShowBatchPreview = s7[1];
    var s8 = React.useState(null); var detailStudent = s8[0]; var setDetailStudent = s8[1];
    var s9 = React.useState(null); var uploadError = s9[0]; var setUploadError = s9[1];
    var s10 = React.useState(null); var uploadSuccess = s10[0]; var setUploadSuccess = s10[1];
    var s15 = React.useState(null); var notifySuccess = s15[0]; var setNotifySuccess = s15[1];
    var s11 = React.useState([]); var notificationLog = s11[0]; var setNotificationLog = s11[1];
    var s12 = React.useState(false); var showLog = s12[0]; var setShowLog = s12[1];
    var s13 = React.useState(false); var showFieldConfig = s13[0]; var setShowFieldConfig = s13[1];
    var up = React.useState(null); var uploadingFieldId = up[0]; var setUploadingFieldId = up[1];
    // Duplicate warn: now carries { blockedStudents, allowedStudents } instead of just a boolean
    var s14 = React.useState(null); var duplicateWarnData = s14[0]; var setDuplicateWarnData = s14[1];
    // Tick counter to force re-render so cooldown timers stay live
    var s16 = React.useState(0); var tick = s16[0]; var setTick = s16[1];
    var s17 = React.useState(false); var isAddStudentModalOpen = s17[0]; var setIsAddStudentModalOpen = s17[1];

    // Recompute the recently-sent map on every render (it's cheap — O(log entries))
    var recentlySentMap = buildRecentlySentMap(notificationLog);

    React.useEffect(function () {
        loadPageData();
    }, []);

    async function loadPageData() {
        setLoading(true);
        console.log("HTEArchive: Loading data...");
        try {
            const [fields, studentRecords, advisers, sections] = await Promise.all([
                thesisService.getHTEDocumentFields(),
                thesisService.getHTEStudents(),
                thesisService.getAdvisers(),
                thesisService.getSections()
            ]);
            console.log("HTEArchive: Data loaded", { fields, studentRecords, advisers, sections });
            const fieldsMapped = fields.map(f => ({
                ...f,
                active: f.is_active,
                order: f.display_order
            }));
            setDocFields(fieldsMapped);
            setFilterOptions({ advisers, sections });

            // Transform DB students into UI-friendly format
            const transformed = studentRecords.map(s => {
                const uploadsMap = {};
                fields.forEach(f => {
                    uploadsMap[f.id] = { fieldId: f.id, status: "pending", file: null };
                });

                (s.uploads || []).forEach(u => {
                    uploadsMap[u.field_id] = {
                        fieldId: u.field_id,
                        status: u.status,
                        file: u.status === "uploaded" ? { name: u.original_filename, size: u.file_size_bytes } : null,
                        uploadedBy: u.uploaded_by_role,
                        uploadedAt: u.uploaded_at,
                        gdrive_file_id: u.gdrive_file_id,
                        gdrive_view_link: u.gdrive_view_link
                    };
                });

                return {
                    ...s,
                    // Keep student_no as student_no for display
                    firstName: s.first_name,
                    lastName: s.last_name,
                    middleInitial: s.middle_name ? s.middle_name.charAt(0) + "." : "",
                    year: s.academic_year,
                    section: s.section_ref?.name || s.section,
                    adviser: s.adviser ? `${s.adviser.first_name} ${s.adviser.last_name}` : "None",
                    name: `${s.first_name} ${s.last_name}`,
                    uploads: uploadsMap
                };
            });

            console.log("HTEArchive: Transformed students", transformed);
            setStudents(transformed);
        } catch (error) {
            console.error("Failed to load archive data:", error);
        } finally {
            setLoading(false);
        }
    }

    // Live-tick every 30 seconds so "Xm remaining" badges refresh automatically
    React.useEffect(function () {
        var interval = setInterval(function () { setTick(function (t) { return t + 1; }); }, 30000);
        return function () { clearInterval(interval); };
    }, []);

    var visibleStudents = role === "admin"
        ? students
        : students.filter(function (s) { return s.id === studentId; });

    var filteredStudents = visibleStudents.filter(function (s) {
        var status = getStudentStatus(s, docFields);
        var sq = searchQuery.toLowerCase();
        var matchSearch = (s.name || "").toLowerCase().indexOf(sq) !== -1 || (s.student_no || "").toLowerCase().indexOf(sq) !== -1;
        var matchYear = yearFilter === "all" || s.year === yearFilter;
        var matchStatus = statusFilter === "all" || status === statusFilter;
        var matchProgram = programFilter === "all" || s.program === programFilter;
        var matchAdviser = adviserFilter === "all" || s.adviser_id === adviserFilter;
        var matchSection = sectionFilter === "all" || s.section === sectionFilter;
        return matchSearch && matchYear && matchStatus && matchProgram && matchAdviser && matchSection;
    });

    var incompleteStudents = filteredStudents.filter(function (s) { return getStudentStatus(s, docFields) === "incomplete"; });

    // Incomplete students who are NOT in the cooldown window — these can be selected
    var selectableStudents = incompleteStudents.filter(function (s) { return !recentlySentMap[s.id]; });

    // AG-Grid Column Definitions
    var columnDefs = React.useMemo(function () {
        return [
            {
                headerName: "Student",
                field: "lastName",
                minWidth: 200,
                flex: 1,
                pinned: 'left',
                valueGetter: function (params) {
                    return params.data.lastName + ", " + params.data.firstName + " " + params.data.middleInitial;
                }
            },
            {
                headerName: "Student ID",
                field: "student_no",
                width: 120,
                pinned: 'left'
            },
            {
                headerName: "OJT Docs",
                field: "ojtProgress",
                width: 150,
                cellRenderer: function (params) {
                    var ojtActive = getActiveFields(docFields, "ojt");
                    var ojtUploaded = countUploadedForFields(params.data, ojtActive);
                    var ojtPct = ojtActive.length === 0 ? 100 : Math.round(ojtUploaded / ojtActive.length * 100);
                    var color = ojtPct === 100 ? "success" : ojtPct >= 70 ? "primary" : "warning";
                    return (
                        <div className="flex items-center h-full">
                            <ProgressCell uploaded={ojtUploaded} total={ojtActive.length} pct={ojtPct} color={color} />
                        </div>
                    );
                }
            },
            {
                headerName: "HTE Docs",
                field: "hteProgress",
                width: 150,
                cellRenderer: function (params) {
                    var hteActive = getActiveFields(docFields, "hte");
                    var hteUploaded = countUploadedForFields(params.data, hteActive);
                    var htePct = hteActive.length === 0 ? 100 : Math.round(hteUploaded / hteActive.length * 100);
                    return (
                        <div className="flex items-center h-full">
                            <ProgressCell uploaded={hteUploaded} total={hteActive.length} pct={htePct} color="gold" />
                        </div>
                    );
                }
            },
            {
                headerName: "Period (SY)",
                field: "year",
                width: 120
            },
            {
                headerName: "Email",
                field: "email",
                minWidth: 220,
                flex: 1
            },
            {
                headerName: "Section",
                field: "section",
                width: 100
            },
            {
                headerName: "Adviser",
                field: "adviser",
                minWidth: 180,
                flex: 1
            },
            {
                headerName: "Program",
                field: "program",
                minWidth: 180,
                flex: 1
            },
            {
                headerName: "Folder Link",
                field: "gdrive_folder_link",
                minWidth: 200,
                flex: 1,
                editable: role === "admin",
                cellClass: role === "admin" ? "bg-amber-50/30 cursor-pointer" : "",
                cellRenderer: function (params) {
                    if (!params.value) return <span className="text-neutral-400 italic text-xs">No link set</span>;
                    return (
                        <div className="flex items-center gap-2 group h-full">
                            <a
                                href={params.value}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:underline truncate"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {params.value}
                            </a>
                            <ExternalLink className="h-3 w-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    );
                }
            },
            {
                headerName: "Status",
                field: "status",
                width: 130,
                cellRenderer: function (params) {
                    var status = getStudentStatus(params.data, docFields);
                    return (
                        <div className="flex items-center h-full">
                            <StatusBadge status={status} />
                        </div>
                    );
                }
            },
            {
                headerName: "Actions",
                width: 120,
                pinned: 'right',
                cellRenderer: function (params) {
                    return (
                        <div className="flex items-center h-full">
                            <button onClick={function () { setDetailStudent(params.data); }} className={btnGhost + " h-8 px-3 text-xs"}>
                                <span>{role === "admin" ? "View" : "My Docs"}</span>
                                <ChevronRight className="h-3.5 w-3.5 ml-1" />
                            </button>
                        </div>
                    );
                }
            }
        ];
    }, [docFields, role]);

    var defaultColDef = React.useMemo(function () {
        return {
            sortable: true,
            resizable: true,
            filter: true,
            suppressMovable: true,
        };
    }, []);

    var onSelectionChanged = React.useCallback(function (event) {
        var selectedRows = event.api.getSelectedRows();
        setSelectedStudents(new Set(selectedRows.map(function (s) { return s.id; })));
    }, []);

    async function handleUpload(sId, fieldId, file, uploaderRole) {
        var err = validateFile(file);
        if (err) { setUploadError(err); return; }

        setUploadingFieldId(fieldId);
        try {
            const result = await thesisService.uploadHTEDocument(sId, fieldId, file, uploaderRole === "admin" ? "coordinator" : "student", actorInfo);

            setStudents(function (prev) {
                return prev.map(function (s) {
                    if (s.id !== sId) return s;
                    var newUploads = {};
                    Object.keys(s.uploads || {}).forEach(function (k) { newUploads[k] = s.uploads[k]; });
                    newUploads[fieldId] = {
                        fieldId: fieldId,
                        status: "uploaded",
                        file: { name: file.name, size: file.size },
                        uploadedBy: uploaderRole === "admin" ? "coordinator" : "student",
                        uploadedAt: result.upload?.uploaded_at || new Date().toISOString()
                    };
                    return { ...s, uploads: newUploads };
                });
            });
            setUploadSuccess('"' + file.name + '" uploaded successfully.');
            setTimeout(function () { setUploadSuccess(null); }, 3500);

            // If the detail modal is open for this student, also update live_detail
            if (detailStudent && detailStudent.id === sId) {
                setDetailStudent(prev => {
                    var newUploads = {};
                    Object.keys(prev.uploads || {}).forEach(function (k) { newUploads[k] = prev.uploads[k]; });
                    newUploads[fieldId] = {
                        fieldId: fieldId,
                        status: "uploaded",
                        file: { name: file.name, size: file.size },
                        uploadedBy: uploaderRole === "admin" ? "coordinator" : "student",
                        uploadedAt: result.upload?.uploaded_at || new Date().toISOString()
                    };
                    return { ...prev, uploads: newUploads };
                });
            }

        } catch (error) {
            console.error("Upload failed", error);
            setUploadError(error.message || "Failed to upload document.");
        } finally {
            setUploadingFieldId(null);
        }
    }

    async function handleRemoveUpload(sId, fieldId) {
        try {
            await thesisService.deleteHTEDocument(sId, fieldId, actorInfo);
            setStudents(function (prev) {
                return prev.map(function (s) {
                    if (s.id !== sId) return s;
                    var newUploads = {};
                    Object.keys(s.uploads || {}).forEach(function (k) { newUploads[k] = s.uploads[k]; });
                    newUploads[fieldId] = { fieldId: fieldId, status: "pending", file: null, uploadedBy: null, uploadedAt: null };
                    return { ...s, uploads: newUploads };
                });
            });
            setUploadSuccess("Document removed.");
            setTimeout(function () { setUploadSuccess(null); }, 3500);

            if (detailStudent && detailStudent.id === sId) {
                setDetailStudent(prev => {
                    var newUploads = {};
                    Object.keys(prev.uploads || {}).forEach(function (k) { newUploads[k] = prev.uploads[k]; });
                    newUploads[fieldId] = { fieldId: fieldId, status: "pending", file: null, uploadedBy: null, uploadedAt: null };
                    return { ...prev, uploads: newUploads };
                });
            }
        } catch (error) {
            console.error("Remove failed", error);
            setUploadError(error.message || "Failed to remove document.");
        }
    }

    function handleBatchNotify() {
        // Logic for batch notification is already handled by detail logic and previews
        setShowBatchPreview(true);
    }

    /**
     * REVISED: Instead of a blanket duplicate-send modal for the entire batch,
     * classify which selected students are in cooldown vs. fresh.
     *
     * - If ALL are in cooldown → show the duplicate-warn modal (force-override needed)
     * - If SOME are in cooldown → show the modal listing the blocked ones, but proceed
     *   only for the allowed ones unless the coordinator explicitly overrides
     * - If NONE are in cooldown → go straight to preview
     */
    function handleBatchNotifyClick() {
        var ids = Array.from(selectedStudents);
        var classification = classifySelection(new Set(ids), recentlySentMap);

        if (!classification.someBlocked) {
            // Happy path: nobody in cooldown, go straight to preview
            setShowBatchPreview(true);
            return;
        }

        // Build the data to pass to the warning modal
        var blockedStudentsData = students.filter(function (s) { return classification.blockedIds.has(s.id); }).map(function (s) {
            return { id: s.id, name: s.name, email: s.email, sentAt: recentlySentMap[s.id] };
        });
        var allowedStudentsData = students.filter(function (s) { return classification.allowedIds.has(s.id); });

        setDuplicateWarnData({
            blockedStudents: blockedStudentsData,
            allowedStudents: allowedStudentsData,
            classification: classification,
        });
    }

    /**
     * Confirm sending only to the ALLOWED (non-cooldown) students.
     * Called from the duplicate-warn modal when user clicks "Skip & Notify Others".
     */
    function handleConfirmAllowedOnly() {
        if (!duplicateWarnData || duplicateWarnData.allowedStudents.length === 0) return;
        setDuplicateWarnData(null);
        // Narrow selection to only the allowed students, then open preview
        setSelectedStudents(new Set(duplicateWarnData.allowedStudents.map(function (s) { return s.id; })));
        setShowBatchPreview(true);
    }

    /**
     * Force-send to ALL selected students, including those in cooldown.
     * Only offered when the coordinator explicitly overrides.
     */
    function handleForceConfirmAll() {
        if (!duplicateWarnData) return;
        setDuplicateWarnData(null);
        // Keep the full original selection (blocked + allowed) and open preview
        setShowBatchPreview(true);
    }

    function handleConfirmBatch() {
        var activeFields = getAllActiveFields(docFields);
        var notified = students.filter(function (s) { return selectedStudents.has(s.id); });
        var entry = {
            id: "LOG-" + Date.now(), timestamp: new Date().toISOString(), initiatedBy: "OJT Coordinator", studentCount: notified.length,
            students: notified.map(function (s) {
                var missing = activeFields.filter(function (f) { var rec = s.uploads[f.id]; return !rec || rec.status !== "uploaded"; }).map(function (f) { return f.name; });
                return { id: s.id, name: s.name, email: s.email, missingDocs: missing };
            }),
        };
        setNotificationLog(function (prev) { return [entry].concat(prev); });
        setShowBatchPreview(false);
        setSelectedStudents(new Set());
        setNotifySuccess("Notifications sent to " + notified.length + " student(s).");
        setTimeout(function () { setNotifySuccess(null); }, 5000);
    }

    function handleAddField(name, category, order) {
        var newField = { id: generateFieldId(), name: name, category: category, order: parseInt(order, 10), active: true };
        setDocFields(function (prev) { return prev.concat([newField]); });
        setStudents(function (prev) {
            return prev.map(function (s) {
                if (s.uploads[newField.id]) return s;
                var newUploads = {};
                Object.keys(s.uploads).forEach(function (k) { newUploads[k] = s.uploads[k]; });
                newUploads[newField.id] = { fieldId: newField.id, status: "pending", file: null, uploadedBy: null, uploadedAt: null };
                return { id: s.id, name: s.name, year: s.year, semester: s.semester, email: s.email, uploads: newUploads };
            });
        });
        setUploadSuccess('"' + name + '" has been added as a new document field.');
        setTimeout(function () { setUploadSuccess(null); }, 4000);
    }

    function handleToggleFieldActive(fieldId) {
        setDocFields(function (prev) { return prev.map(function (f) { return f.id !== fieldId ? f : { id: f.id, name: f.name, category: f.category, order: f.order, active: !f.active }; }); });
    }
    function handleUpdateFieldOrder(fieldId, newOrder) {
        var parsed = parseInt(newOrder, 10);
        if (isNaN(parsed)) return;
        setDocFields(function (prev) { return prev.map(function (f) { return f.id !== fieldId ? f : { id: f.id, name: f.name, category: f.category, order: parsed, active: f.active }; }); });
    }
    function handleUpdateFieldName(fieldId, newName) {
        setDocFields(function (prev) { return prev.map(function (f) { return f.id !== fieldId ? f : { id: f.id, name: newName, category: f.category, order: f.order, active: f.active }; }); });
    }

    function handleAddNewStudent(newStudentData) {
        var newStudent = {
            id: newStudentData.studentId,
            lastName: newStudentData.lastName,
            firstName: newStudentData.firstName,
            middleInitial: newStudentData.middleName ? newStudentData.middleName.charAt(0) + "." : "",
            year: "2024-2025",
            semester: "2nd Semester",
            section: newStudentData.section,
            program: newStudentData.program,
            adviser: newStudentData.adviser,
            email: newStudentData.email,
            gdrive_folder_link: "",
            gdrive_folder_id: "",
            name: newStudentData.firstName + " " + newStudentData.lastName,
            uploads: buildInitialUploads(ALL_FIELD_IDS)
        };
        setStudents(function (prev) { return [newStudent].concat(prev); });
    }

    var selectedNotified = students.filter(function (s) { return selectedStudents.has(s.id); });
    var liveDetail = detailStudent ? students.find(function (s) { return s.id === detailStudent.id; }) : null;

    return (
        <div className="flex flex-col min-h-screen w-full bg-neutral-100 text-neutral-900">

            <HTEArchivingHeader
                role={role}
                students={students}
                studentId={studentId}
                showFieldConfig={showFieldConfig}
                onToggleFieldConfig={function () { setShowFieldConfig(function (p) { return !p; }); }}
                onAddStudent={function () { setIsAddStudentModalOpen(true); }}
            />

            <AddStudentModal
                open={isAddStudentModalOpen}
                onOpenChange={setIsAddStudentModalOpen}
                onAdd={function () {
                    loadPageData();
                }}
            />

            <main className="flex-1 p-6">
                <div className="space-y-5">
                    {role === "student" ? (
                        <HTEStudentPage
                            student={visibleStudents[0]}
                            docFields={docFields}
                            onUpload={function (sId, fieldId, file) { handleUpload(sId, fieldId, file, "student"); }}
                        />
                    ) : (
                        <React.Fragment>
                            {role === "admin" && showFieldConfig && (
                                <FieldConfigPanel
                                    docFields={docFields}
                                    onAddField={handleAddField}
                                    onToggleActive={handleToggleFieldActive}
                                    onUpdateOrder={handleUpdateFieldOrder}
                                    onUpdateName={handleUpdateFieldName}
                                />
                            )}

                            {!showFieldConfig && (
                                <React.Fragment>
                                    {role === "admin" && (
                                        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <div className="relative flex-1 min-w-[260px]">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search by name or ID..."
                                                        value={searchQuery}
                                                        onChange={function (e) { setSearchQuery(e.target.value); }}
                                                        className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-500 text-sm focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/20"
                                                    />
                                                </div>
                                                <SelectInput value={yearFilter} onChange={setYearFilter} options={[
                                                    { value: "all", label: "All Years" },
                                                    { value: "2024-2025", label: "2024-2025" },
                                                    { value: "2023-2024", label: "2023-2024" },
                                                ]} />
                                                <SelectInput value={statusFilter} onChange={setStatusFilter} options={[
                                                    { value: "all", label: "All Status" },
                                                    { value: "complete", label: "Complete" },
                                                    { value: "incomplete", label: "Incomplete" },
                                                ]} />
                                                <SelectInput value={programFilter} onChange={setProgramFilter} options={[
                                                    { value: "all", label: "All Programs" },
                                                    { value: "Computer Science", label: "Computer Science" },
                                                    { value: "Information Technology", label: "Information Technology" },
                                                ]} />
                                                <SelectInput value={adviserFilter} onChange={setAdviserFilter} options={[
                                                    { value: "all", label: "All Advisers" }
                                                ].concat(filterOptions.advisers.map(function (a) {
                                                    return {
                                                        value: a.id,
                                                        label: a.display_name || (a.first_name ? a.first_name + " " + a.last_name : "Unknown")
                                                    };
                                                }))} />
                                                <SelectInput value={sectionFilter} onChange={setSectionFilter} options={[
                                                    { value: "all", label: "All Sections" }
                                                ].concat(Array.from(new Set(filterOptions.sections.map(function (s) { return s.name; }))).map(function (name) {
                                                    return { value: name, label: name };
                                                }))} />
                                                <button onClick={function () {
                                                    setSearchQuery("");
                                                    setYearFilter("all");
                                                    setStatusFilter("all");
                                                    setProgramFilter("all");
                                                    setAdviserFilter("all");
                                                    setSectionFilter("all");
                                                }} className={btnSmGhost}>
                                                    <X className="h-3.5 w-3.5" /><span>Clear</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {role === "admin" && selectedStudents.size > 0 && (
                                        <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                                                    <Mail className="h-5 w-5 text-primary-500" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-neutral-900">{selectedStudents.size} student(s) selected</p>
                                                    <p className="text-sm text-neutral-500">Ready to send batch notification</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={function () { setSelectedStudents(new Set()); }} className={btnOutline}>Cancel</button>
                                                <button onClick={handleBatchNotifyClick} className={btnDefault}>
                                                    <Mail className="h-4 w-4" /><span>Send Notifications</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-gradient-primary">
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-base font-bold text-white">{role === "admin" ? "Student Document Status" : "My Document Status"}</h2>
                                                {role === "admin" && <span className="text-xs px-2 py-0.5 rounded-full bg-white/15 border border-white/25 text-white/80">{filteredStudents.length} students</span>}
                                            </div>
                                            {role === "admin" && selectedStudents.size > 0 && (
                                                <button onClick={handleBatchNotify} className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-primary-500/20 transition-all">
                                                    <Mail className="h-3.5 w-3.5" />
                                                    <span>Batch Notify ({selectedStudents.size})</span>
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ height: 600, width: '100%' }}>
                                            <AgGridReact
                                                theme={hteTheme}
                                                rowData={filteredStudents}
                                                columnDefs={columnDefs}
                                                defaultColDef={defaultColDef}
                                                getRowId={function (params) { return params.data.id; }}
                                                rowSelection={{ mode: 'multiRow', enableClickSelection: false, checkboxes: true, headerCheckbox: true }}
                                                selectionColumnDef={{ pinned: 'left', sortable: false, filter: false, suppressMenu: true, width: 50 }}
                                                onSelectionChanged={onSelectionChanged}
                                                animateRows={true}
                                                pagination={true}
                                                paginationPageSize={20}
                                            />
                                        </div>
                                    </div>

                                    {filteredStudents.length === 0 && (
                                        <div className="p-12 text-center">
                                            <FileText className="h-10 w-10 text-neutral-200 mx-auto mb-3" />
                                            <p className="text-neutral-500 text-sm">No students found</p>
                                        </div>
                                    )}

                                    {role === "admin" && notificationLog.length > 0 && (
                                        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                                            <button onClick={function () { setShowLog(function (p) { return !p; }); }} className="w-full px-5 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <History className="h-4 w-4 text-neutral-500" />
                                                    <span className="text-sm font-semibold text-neutral-900">Notification Log</span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full border border-neutral-200 bg-neutral-100 text-neutral-500">{notificationLog.length} event{notificationLog.length !== 1 ? "s" : ""}</span>
                                                </div>
                                                {showLog ? <ChevronUp className="h-4 w-4 text-neutral-500" /> : <ChevronDown className="h-4 w-4 text-neutral-500" />}
                                            </button>
                                            {showLog && (
                                                <div className="border-t border-neutral-200 divide-y divide-neutral-100">
                                                    {notificationLog.map(function (entry) {
                                                        return (
                                                            <div key={entry.id} className="p-5">
                                                                <div className="flex items-start justify-between mb-2">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="h-8 w-8 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center flex-shrink-0">
                                                                            <Mail className="h-3.5 w-3.5 text-neutral-500" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-semibold text-neutral-900">Batch notification — {entry.studentCount} student{entry.studentCount !== 1 ? "s" : ""}</p>
                                                                            <div className="flex items-center gap-3 mt-0.5">
                                                                                <span className="flex items-center gap-1 text-xs text-neutral-500"><User className="h-3 w-3" />{entry.initiatedBy}</span>
                                                                                <span className="flex items-center gap-1 text-xs text-neutral-500"><Calendar className="h-3 w-3" />{formatTimestamp(entry.timestamp)}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-500">{entry.id}</span>
                                                                </div>
                                                                <div className="ml-11 flex flex-wrap gap-1.5">
                                                                    {entry.students.map(function (s) {
                                                                        return <span key={s.id} className="text-xs bg-neutral-100 border border-neutral-200 text-neutral-900 px-2 py-0.5 rounded-full">{s.name}</span>;
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </React.Fragment>
                            )}
                        </React.Fragment>
                    )}
                </div>
            </main>

            {/* ── Duplicate Send Warning Modal (redesigned) ───────────────────── */}
            {
                duplicateWarnData ? (
                    <Modal onClose={function () { setDuplicateWarnData(null); }}>
                        <div className="p-6 space-y-5">
                            {/* Header */}
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-lg bg-warning/10 border border-warning/30 flex items-center justify-center flex-shrink-0">
                                    <ShieldAlert className="h-5 w-5 text-warning" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-neutral-900">Duplicate Notification Detected</h2>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                        {duplicateWarnData.blockedStudents.length === 1
                                            ? "1 student was"
                                            : duplicateWarnData.blockedStudents.length + " students were"} already notified within the {DUPLICATE_SEND_COOLDOWN_MINUTES}-minute cooldown window.
                                    </p>
                                </div>
                            </div>

                            {/* Blocked students list */}
                            <div className="rounded-lg border border-warning/30 bg-warning/5 divide-y divide-warning/15 overflow-hidden">
                                {duplicateWarnData.blockedStudents.map(function (s) {
                                    return (
                                        <div key={s.id} className="flex items-center justify-between px-4 py-2.5 gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-neutral-900">{s.name}</p>
                                                <p className="text-xs text-neutral-500">{s.email}</p>
                                            </div>
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning whitespace-nowrap">
                                                <Timer className="h-3 w-3" />
                                                {formatCooldownRemaining(s.sentAt)} left
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Guidance text */}
                            {duplicateWarnData.allowedStudents.length > 0 ? (
                                <p className="text-sm text-neutral-600">
                                    <span className="font-semibold text-neutral-900">{duplicateWarnData.allowedStudents.length} other student{duplicateWarnData.allowedStudents.length !== 1 ? "s" : ""}</span> in your selection are not in cooldown and can be notified now.
                                </p>
                            ) : (
                                <p className="text-sm text-neutral-600">All selected students are currently in the cooldown window. Sending duplicate notifications may confuse them.</p>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col gap-2 pt-1">
                                {/* Primary action depends on whether there are any "allowed" students */}
                                {duplicateWarnData.allowedStudents.length > 0 ? (
                                    <button onClick={handleConfirmAllowedOnly} className={btnDefault + " w-full justify-center"}>
                                        <Mail className="h-4 w-4" />
                                        <span>Notify {duplicateWarnData.allowedStudents.length} Eligible Student{duplicateWarnData.allowedStudents.length !== 1 ? "s" : ""} Only</span>
                                    </button>
                                ) : null}
                                {/* Force-override: always available but visually secondary */}
                                <button onClick={handleForceConfirmAll} className={btnWarning + " w-full justify-center"}>
                                    <ShieldAlert className="h-4 w-4" />
                                    <span>Override Cooldown & Notify All {selectedStudents.size}</span>
                                </button>
                                <button onClick={function () { setDuplicateWarnData(null); }} className={btnSecondary + " w-full justify-center"}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </Modal>
                ) : null
            }

            {/* Batch Preview Modal */}
            {
                showBatchPreview ? (
                    <Modal onClose={function () { setShowBatchPreview(false); }} wide={true}>
                        <div className="flex flex-col max-h-[90vh]">
                            <div className="p-6 border-b border-neutral-200 bg-gradient-primary">
                                <h2 className="text-xl font-bold text-white">Preview Batch Notification</h2>
                                <p className="text-sm text-white/70">Emails will be sent to <span className="text-gold-500 font-semibold">{selectedNotified.length} student(s)</span>. Review before confirming.</p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-neutral-50">
                                {selectedNotified.map(function (student) {
                                    var activeFields = getAllActiveFields(docFields);
                                    var missing = activeFields.filter(function (f) { var rec = student.uploads[f.id]; return !rec || rec.status !== "uploaded"; }).map(function (f) { return f.name; });
                                    var portalLink = PORTAL_BASE_URL + "/" + student.id;
                                    var wasRecentlyNotified = !!recentlySentMap[student.id];
                                    return (
                                        <div key={student.id} className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                                            <div className="px-4 py-2.5 bg-neutral-100 border-b border-neutral-200 flex items-center justify-between gap-3 flex-wrap">
                                                <div className="flex items-center gap-4 text-xs">
                                                    <span className="text-neutral-500">To:</span>
                                                    <span className="font-semibold text-neutral-900">{student.name}</span>
                                                    <span className="text-neutral-200">|</span>
                                                    <span className="text-neutral-500">{student.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {wasRecentlyNotified ? (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 border border-warning/40 text-warning font-medium flex items-center gap-1">
                                                            <Timer className="h-2.5 w-2.5" />Override
                                                        </span>
                                                    ) : null}
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 border border-warning/40 text-warning font-medium">{missing.length} pending</span>
                                                </div>
                                            </div>
                                            <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-200 flex items-center gap-3 text-xs">
                                                <span className="text-neutral-500">Subject:</span>
                                                <span className="text-neutral-900">Action Required: Pending OJT Document Submissions — {student.year} {student.semester}</span>
                                            </div>
                                            <div className="p-5 space-y-4 text-sm text-neutral-900 leading-relaxed">
                                                <p>Dear <span className="font-bold">{student.name}</span>,</p>
                                                <p className="text-neutral-500">
                                                    This is a reminder from your OJT Coordinator regarding your document submissions for the{" "}
                                                    <span className="text-neutral-900 font-medium">{student.year} {student.semester}</span> internship period. The following document(s) are still pending:
                                                </p>
                                                <ul className="space-y-2 pl-1">
                                                    {missing.map(function (docName, i) {
                                                        return (
                                                            <li key={i} className="flex items-start gap-2.5">
                                                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-warning flex-shrink-0" />
                                                                <span className="text-neutral-900">{docName}</span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                                <p className="text-neutral-500">Please upload your missing documents through your student portal:</p>
                                                <div className="bg-neutral-100 border border-neutral-200 rounded-lg px-4 py-3 flex items-center gap-3">
                                                    <Mail className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                                                    <span className="text-neutral-900 text-xs break-all font-medium">{portalLink}</span>
                                                </div>
                                                <p className="text-neutral-500 text-xs pt-1 border-t border-neutral-100">
                                                    If you have already submitted any documents in person, please coordinate with your OJT Coordinator for manual processing. Do not reply to this automated message.
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="p-5 border-t border-neutral-200 bg-white flex justify-end gap-3">
                                <button onClick={function () { setShowBatchPreview(false); }} className={btnSecondary}>Cancel</button>
                                <button onClick={handleConfirmBatch} className={btnDefault}>
                                    <Mail className="h-4 w-4" /><span>Confirm and Send {selectedNotified.length} Email(s)</span>
                                </button>
                            </div>
                        </div>
                    </Modal>
                ) : null
            }

            {/* Student Detail Modal */}
            {
                detailStudent ? (
                    <StudentDetailModal
                        student={liveDetail ? liveDetail : detailStudent}
                        role={role}
                        docFields={docFields}
                        onClose={function () { setDetailStudent(null); setShowBatchPreview(false); }}
                        onUpload={function (fieldId, file) { handleUpload(detailStudent.id, fieldId, file, role); }}
                        onRemoveUpload={function (fieldId) { handleRemoveUpload(detailStudent.id, fieldId); }}
                        onError={setUploadError}
                        uploadingFieldId={uploadingFieldId}
                    />
                ) : null
            }

            {/* Toast stack */}
            <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-3 w-96 pointer-events-none">
                {uploadError ? <Toast type="error" message={uploadError} onClose={function () { setUploadError(null); }} /> : null}
                {uploadSuccess ? <Toast type="success" message={uploadSuccess} onClose={function () { setUploadSuccess(null); }} /> : null}
                {notifySuccess ? <Toast type="notify" message={notifySuccess} onClose={function () { setNotifySuccess(null); }} /> : null}
            </div>

        </div >
    );
}

// ── Header ───────────────────────────────────────────────────────────────────
export function HTEArchivingHeader(props) {
    var role = props.role;
    var students = props.students;
    var studentId = props.studentId;
    var showFieldConfig = props.showFieldConfig;
    var onToggleFieldConfig = props.onToggleFieldConfig;
    var onAddStudent = props.onAddStudent;

    return (
        <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white">
            <div className="px-6 h-14 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                    <SidebarTrigger />
                    <div className="h-5 w-px bg-neutral-200" />
                    <h1 className="text-xl font-semibold text-neutral-900">Document Archive</h1>
                </div>
                <div className="flex items-center gap-3">
                    {role === "admin" ? (
                        <button
                            onClick={onToggleFieldConfig}
                            className={btnSmSecondary + " " + (showFieldConfig ? "bg-primary-500 text-white hover:bg-primary-600" : "")}>
                            <Settings className={"h-3.5 w-3.5 transition-transform " + (showFieldConfig ? "rotate-45" : "")} />
                            <span>{showFieldConfig ? "Close" : "Manage Fields"}</span>
                        </button>
                    ) : null}
                    <div className={"flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border " + (role === "admin" ? "bg-primary-500/10 border-primary-500/30 text-primary-600" : "bg-neutral-100 border-neutral-200 text-neutral-600")}>
                        {role === "admin" ? <ShieldCheck className="h-3.5 w-3.5" /> : <GraduationCap className="h-3.5 w-3.5" />}
                        <span>{role === "admin" ? "Admin" : "Student — " + (function () { for (var i = 0; i < students.length; i++) { if (students[i].id === studentId) return students[i].name; } return studentId; })()}</span>
                    </div>
                    {role === "admin" && (
                        <button onClick={onAddStudent} className={btnDefault + " h-8 px-3 text-xs"}>
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>Add Student</span>
                        </button>
                    )}
                    <ThesisSettingsModal />
                </div>
            </div>
        </header>
    );
}

// ── Field Config Panel ───────────────────────────────────────────────────────
function FieldConfigPanel(props) {
    var docFields = props.docFields; var onAddField = props.onAddField;
    var onToggleActive = props.onToggleActive; var onUpdateOrder = props.onUpdateOrder; var onUpdateName = props.onUpdateName;
    var fa = React.useState(""); var newName = fa[0]; var setNewName = fa[1];
    var fb = React.useState("ojt"); var newCategory = fb[0]; var setNewCategory = fb[1];
    var fc = React.useState("1"); var newOrder = fc[0]; var setNewOrder = fc[1];
    var fd = React.useState(null); var addError = fd[0]; var setAddError = fd[1];
    var ojtFields = docFields.filter(function (f) { return f.category === "ojt"; }).sort(function (a, b) { return a.order - b.order; });
    var hteFields = docFields.filter(function (f) { return f.category === "hte"; }).sort(function (a, b) { return a.order - b.order; });
    function handleAdd() {
        if (!newName.trim()) { setAddError("Document name is required."); return; }
        var parsed = parseInt(newOrder, 10);
        if (isNaN(parsed) || parsed < 1) { setAddError("Display order must be a positive integer."); return; }
        setAddError(null);
        onAddField(newName.trim(), newCategory, parsed);
        setNewName(""); setNewOrder("1");
    }
    function renderFieldRow(field) {
        return (
            <div key={field.id} className={"flex items-center gap-3 p-3 rounded-lg border transition-colors " + (field.active ? "bg-white border-neutral-200" : "bg-neutral-50 border-neutral-200 opacity-60")}>
                <GripVertical className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                <input type="number" value={field.order} min="1" onChange={function (e) { onUpdateOrder(field.id, e.target.value); }}
                    className="w-14 px-2 py-1 bg-neutral-50 border border-neutral-200 rounded text-neutral-900 text-xs text-center focus:outline-none focus:border-neutral-900" />
                <input type="text" value={field.name} onChange={function (e) { onUpdateName(field.id, e.target.value); }}
                    className="flex-1 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 text-sm focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/20" />
                <span className={"text-xs px-2 py-0.5 rounded-full border font-semibold " + (field.active ? "bg-success/10 border-success/30 text-success" : "bg-neutral-500/10 border-neutral-500/30 text-neutral-500")}>
                    {field.active ? "Active" : "Inactive"}
                </span>
                <button onClick={function () { onToggleActive(field.id); }} title={field.active ? "Deactivate field" : "Activate field"}
                    className={btnIconGhost + " " + (field.active ? "text-success hover:text-destructive-semantic hover:bg-destructive-semantic/10" : "text-neutral-500 hover:text-neutral-900")}>
                    {field.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                </button>
            </div>
        );
    }
    return (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center gap-3 bg-gradient-primary">
                <Settings className="h-4 w-4 text-gold-500" />
                <h2 className="text-base font-bold text-white">Document Field Configuration</h2>
                <span className="text-xs px-2 py-0.5 rounded-full border border-gold-500/50 bg-gold-500/15 text-gold-500">Admin Only</span>
            </div>
            <div className="p-6 space-y-6">
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
                    <h3 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2"><Plus className="h-4 w-4 text-neutral-500" />Add New Document Field</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-neutral-500 mb-1">Document Name / Label</label>
                            <input type="text" value={newName} onChange={function (e) { setNewName(e.target.value); }} placeholder="e.g. Medical Certificate"
                                className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-neutral-900 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/20" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 mb-1">Target Category</label>
                            <select value={newCategory} onChange={function (e) { setNewCategory(e.target.value); }}
                                className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-neutral-900 text-sm focus:outline-none focus:border-neutral-900">
                                <option value="ojt">OJT Trainee</option>
                                <option value="hte">HTE</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 mb-1">Display Order</label>
                            <input type="number" value={newOrder} min="1" onChange={function (e) { setNewOrder(e.target.value); }}
                                className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-neutral-900 text-sm focus:outline-none focus:border-neutral-900" />
                        </div>
                    </div>
                    {addError ? <p className="text-xs text-destructive-semantic mt-2">{addError}</p> : null}
                    <div className="mt-4 flex justify-end">
                        <button onClick={handleAdd} className={btnDefault}><Save className="h-4 w-4" /><span>Add Field</span></button>
                    </div>
                </div>
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2"><FileText className="h-4 w-4 text-neutral-500" />OJT Trainee Fields</h3>
                        <span className="text-xs text-neutral-500">{ojtFields.filter(function (f) { return f.active; }).length} active / {ojtFields.length} total</span>
                    </div>
                    <div className="space-y-2">{ojtFields.map(renderFieldRow)}</div>
                </div>
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2"><Building2 className="h-4 w-4 text-neutral-500" />HTE Fields</h3>
                        <span className="text-xs text-neutral-500">{hteFields.filter(function (f) { return f.active; }).length} active / {hteFields.length} total</span>
                    </div>
                    <div className="space-y-2">{hteFields.map(renderFieldRow)}</div>
                </div>

            </div>
        </div>
    );
}

// ── Student Detail Modal ─────────────────────────────────────────────────────
function StudentDetailModal(props) {
    var s = props.student; var role = props.role; var docFields = props.docFields;
    var onClose = props.onClose; var onUpload = props.onUpload; var onRemoveUpload = props.onRemoveUpload; var onError = props.onError;
    var uploadingFieldId = props.uploadingFieldId;
    var termArr = React.useState(s.year + " " + s.semester);
    var selectedTerm = termArr[0]; var setSelectedTerm = termArr[1];
    var availableTerms = [s.year + " " + s.semester, "2023-2024 2nd Semester", "2022-2023 2nd Semester"];
    var ojtFields = docFields.filter(function (f) { return f.category === "ojt"; }).sort(function (a, b) { return a.order - b.order; });
    var hteFields = docFields.filter(function (f) { return f.category === "hte" && (role === "admin" || f.active); }).sort(function (a, b) { return a.order - b.order; });
    var ojtActive = docFields.filter(function (f) { return f.category === "ojt" && f.active; });
    var hteActive = docFields.filter(function (f) { return f.category === "hte" && f.active; });
    var ojtUploaded = countUploadedForFields(s, ojtActive);
    var hteUploaded = countUploadedForFields(s, hteActive);
    return (
        <Modal onClose={onClose} wide={true}>
            <div className="flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-neutral-200 bg-gradient-primary">
                    <h2 className="text-xl font-bold text-white">Document Repository</h2>
                    <p className="text-sm text-white/70 mt-1">{s.name} <span className="text-gold-500">|</span> {s.id} <span className="text-gold-500">|</span> {s.year} {s.semester}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-neutral-50">
                    <DocSection title="OJT Trainee Documents" icon={<FileText className="h-5 w-5 text-neutral-500" />}
                        fields={ojtFields} uploads={s.uploads} canUpload={true} canDownload={role === "admin"} canRemove={role === "admin"}
                        onUpload={onUpload} onRemoveUpload={onRemoveUpload} onError={onError} badgeColor="primary"
                        uploadedCount={ojtUploaded} activeCount={ojtActive.length} showInactive={true} uploadingFieldId={uploadingFieldId} />
                    <DocSection title="Host Training Establishment Documents" icon={<Building2 className="h-5 w-5 text-neutral-500" />}
                        fields={hteFields} uploads={s.uploads} canUpload={true} canDownload={role === "admin"} canRemove={role === "admin"}
                        onUpload={onUpload} onRemoveUpload={onRemoveUpload} onError={onError} badgeColor="gold"
                        uploadedCount={hteUploaded} activeCount={hteActive.length} showInactive={true} uploadingFieldId={uploadingFieldId}
                        termSelector={role === "admin" ? (
                            <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                                <span className="text-xs text-neutral-500">Term:</span>
                                <select value={selectedTerm} onChange={function (e) { setSelectedTerm(e.target.value); }}
                                    className="text-xs px-2 py-1 bg-white border border-neutral-200 rounded text-neutral-900 focus:outline-none focus:border-neutral-900">
                                    {availableTerms.map(function (t) { return <option key={t} value={t}>{t}</option>; })}
                                </select>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                                <span className="text-xs text-neutral-500">{selectedTerm}</span>
                            </div>
                        )}
                    />
                </div>
                <div className="p-5 border-t border-neutral-200 bg-white flex justify-end">
                    <button onClick={onClose} className={btnSecondary}>Close</button>
                </div>
            </div>
        </Modal>
    );
}

function DocSection(props) {
    var title = props.title; var icon = props.icon; var fields = props.fields;
    var uploads = props.uploads; var canUpload = props.canUpload; var canDownload = props.canDownload;
    var canRemove = props.canRemove; var onUpload = props.onUpload; var onRemoveUpload = props.onRemoveUpload;
    var onError = props.onError; var badgeColor = props.badgeColor; var uploadedCount = props.uploadedCount;
    var activeCount = props.activeCount; var showInactive = props.showInactive;
    var termSelector = props.termSelector; var hteLocked = props.hteLocked;
    var uploadingFieldId = props.uploadingFieldId;
    var badgeClass = badgeColor === "primary" ? "bg-primary-500/8 border-primary-500/20 text-primary-500" : "bg-neutral-100 border-neutral-200 text-neutral-500";
    return (
        <div>
            <div className="flex items-start justify-between mb-3 gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">{icon}{title}</h3>
                    {hteLocked ? <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-neutral-200 bg-neutral-100 text-neutral-500"><Ban className="h-3 w-3" />Coordinator Only</span> : null}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {termSelector ? termSelector : null}
                    <span className={"text-xs px-2.5 py-1 rounded-full border font-semibold " + badgeClass}>{uploadedCount} / {activeCount} uploaded</span>
                </div>
            </div>
            <div className="space-y-2">
                {fields.map(function (field) {
                    var rec = uploads[field.id];
                    var isInactive = !field.active && showInactive;
                    var status = isInactive ? "not_required" : (rec ? rec.status : "pending");
                    return <DocumentItem key={field.id} field={field} rec={rec} status={status} isInactive={isInactive}
                        canUpload={canUpload && !isInactive} canDownload={canDownload && !isInactive} canRemove={canRemove && !isInactive}
                        onUpload={onUpload} onRemoveUpload={onRemoveUpload} onError={onError} isUploading={uploadingFieldId === field.id} />;
                })}
            </div>
        </div>
    );
}

function DocumentItem(props) {
    var field = props.field; var rec = props.rec; var status = props.status;
    var isInactive = props.isInactive; var canUpload = props.canUpload;
    var canDownload = props.canDownload; var canRemove = props.canRemove;
    var onUpload = props.onUpload; var onRemoveUpload = props.onRemoveUpload; var onError = props.onError;
    var isUploading = props.isUploading;
    var fileInputRef = React.useRef(null);
    var expandedArr = React.useState(false); var expanded = expandedArr[0]; var setExpanded = expandedArr[1];
    var cfg = STATUS_CONFIG[status] || STATUS_CONFIG["pending"];
    var Icon = cfg.icon;
    function handleFileChange(e) {
        var file = e.target.files[0];
        if (!file) return;
        var err = validateFile(file);
        if (err) { onError(err); e.target.value = ""; return; }
        onUpload(field.id, file);
        e.target.value = "";
    }
    return (
        <div className={"border rounded-lg overflow-hidden transition-colors " + (isInactive ? "border-neutral-200 opacity-50" : "bg-white border-neutral-200 hover:shadow-sm")}>
            <div className="p-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={"h-9 w-9 rounded-lg border flex items-center justify-center flex-shrink-0 " + cfg.wrapper}><Icon className="h-4 w-4" /></div>
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-neutral-900 text-sm truncate">{field.name}</p>
                            {rec && rec.uploadedBy && !isInactive ? <p className="text-xs text-neutral-500">by {rec.uploadedBy === "coordinator" ? "Coordinator" : "Student"}</p> : null}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={"text-xs px-2 py-0.5 rounded-full border font-semibold " + cfg.badge}>{cfg.text}</span>
                        {status === "uploaded" && !isInactive ? <button title={expanded ? "Hide details" : "View details"} onClick={function () { setExpanded(function (p) { return !p; }); }} className={btnIconGhost}><Eye className="h-3.5 w-3.5" /></button> : null}
                        {status === "uploaded" && canDownload ? <button title="Download file" className={btnIconGhost}><Download className="h-3.5 w-3.5" /></button> : null}
                        {!isInactive && canUpload ? (
                            <span>
                                <input ref={fileInputRef} type="file" accept={ACCEPTED_EXTENSIONS.join(",")} onChange={handleFileChange} className="hidden" />
                                <button disabled={isUploading} title={status === "uploaded" ? "Replace file" : "Upload document"} onClick={function () { if (fileInputRef.current) fileInputRef.current.click(); }} className={btnSmGhost}>
                                    {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : status === "uploaded" ? <RefreshCw className="h-3 w-3" /> : <Upload className="h-3 w-3" />}
                                    <span>{isUploading ? "Uploading..." : status === "uploaded" ? "Replace" : "Upload"}</span>
                                </button>
                            </span>
                        ) : null}
                        {status === "uploaded" && canRemove && !isUploading ? <button title="Remove file" onClick={function () { onRemoveUpload(field.id); }} className={btnIconDestructive}><Trash2 className="h-3.5 w-3.5" /></button> : null}
                    </div>
                </div>
                {expanded && status === "uploaded" && rec ? (
                    <div className="mt-3 pt-3 border-t border-neutral-100 grid grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center gap-2 text-neutral-500"><FileText className="h-3.5 w-3.5 text-neutral-200" /><span className="text-neutral-900 truncate">{rec.file && rec.file.name ? rec.file.name : "-"}</span></div>
                        <div className="flex items-center gap-2 text-neutral-500"><User className="h-3.5 w-3.5 text-neutral-200" /><span>{rec.uploadedBy === "coordinator" ? "Coordinator" : "Student"}</span></div>
                        <div className="flex items-center gap-2 text-neutral-500"><Calendar className="h-3.5 w-3.5 text-neutral-200" /><span>{formatTimestamp(rec.uploadedAt)}</span></div>
                        <div className="flex items-center gap-2 text-neutral-500"><FileText className="h-3.5 w-3.5 text-neutral-200" /><span>{formatFileSize(rec.file ? rec.file.size : null)}</span></div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function ProgressCell(props) {
    var uploaded = props.uploaded; var total = props.total; var pct = props.pct; var color = props.color;
    var barMap = { success: "bg-success", primary: "bg-primary-500", warning: "bg-warning", gold: "bg-yellow-500" };
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-neutral-900">{uploaded}/{total}</span>
                <span className="text-xs text-neutral-500">({pct}%)</span>
            </div>
            <div className="w-28 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                <div className={"h-full rounded-full transition-all " + (barMap[color] || "bg-neutral-900")} style={{ width: pct + "%" }} />
            </div>
        </div>
    );
}

function StatusBadge(props) {
    var isComplete = props.status === "complete";
    return (
        <span className={"inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border font-semibold " + (isComplete ? "bg-success/10 border-success/30 text-success" : "bg-neutral-100 border-neutral-200 text-neutral-500")}>
            {isComplete ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            <span>{isComplete ? "Complete" : "Incomplete"}</span>
        </span>
    );
}

function SelectInput(props) {
    var value = props.value; var onChange = props.onChange; var options = props.options;
    return (
        <select value={value} onChange={function (e) { onChange(e.target.value); }}
            className="px-3 py-2 bg-white border border-neutral-200 rounded-md text-neutral-900 text-sm focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/20 shadow-xs">
            {options.map(function (o, i) { return <option key={o.value + "-" + i} value={o.value}>{o.label}</option>; })}
        </select>
    );
}

function Modal(props) {
    var onClose = props.onClose; var children = props.children; var wide = props.wide;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className={"relative bg-white border border-neutral-200 rounded-2xl shadow-2xl w-full overflow-hidden " + (wide ? "max-w-4xl" : "max-w-md")}>
                {children}
            </div>
        </div>
    );
}

function Toast(props) {
    var type = props.type; var message = props.message; var onClose = props.onClose;
    var config = {
        error: { icon: AlertTriangle, iconCls: "text-destructive-semantic", bar: "bg-destructive-semantic", bg: "bg-white", border: "border-destructive-semantic/20", title: "Error" },
        success: { icon: CheckCircle2, iconCls: "text-success", bar: "bg-success", bg: "bg-white", border: "border-success/20", title: "Success" },
        notify: { icon: Mail, iconCls: "text-primary-500", bar: "bg-primary-500", bg: "bg-white", border: "border-primary-500/20", title: "Notifications Sent" },
    };
    var c = config[type] || config.success;
    var Icon = c.icon;
    return (
        <div className={"pointer-events-auto flex items-stretch rounded-xl border shadow-lg overflow-hidden " + c.bg + " " + c.border}>
            <div className={"w-1 flex-shrink-0 " + c.bar} />
            <div className="flex items-start gap-3 px-4 py-3.5 flex-1 min-w-0">
                <div className={"mt-0.5 flex-shrink-0 " + c.iconCls}><Icon className="h-5 w-5" /></div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900">{c.title}</p>
                    <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{message}</p>
                </div>
                <button onClick={onClose} className={btnIconGhost + " -mr-1 flex-shrink-0"}><X className="h-4 w-4" /></button>
            </div>
        </div>
    );
}
