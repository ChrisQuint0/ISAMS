import React from "react";
import {
    Search, FileText, Upload, CheckCircle2, Clock, AlertCircle,
    Mail, Eye, Users, Building2, Download, X, ShieldCheck, GraduationCap,
    Ban, RefreshCw, Trash2, Calendar, User, ChevronRight, AlertTriangle,
    History, ChevronDown, ChevronUp, Settings, Plus, GripVertical,
    ToggleLeft, ToggleRight, Save,
} from "lucide-react";

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

var INITIAL_DOC_FIELDS = [
    { id: "f-1",  name: "Curriculum Vitae",                               category: "ojt", order: 1,  active: true },
    { id: "f-2",  name: "Certificate of Registration (COR)",              category: "ojt", order: 2,  active: true },
    { id: "f-3",  name: "OJT Seminar Certificate",                        category: "ojt", order: 3,  active: true },
    { id: "f-4",  name: "Received Copy of the OJT Recommendation Letter", category: "ojt", order: 4,  active: true },
    { id: "f-5",  name: "OJT Waiver",                                     category: "ojt", order: 5,  active: true },
    { id: "f-6",  name: "Training Agreement",                             category: "ojt", order: 6,  active: true },
    { id: "f-7",  name: "Job Description",                                category: "ojt", order: 7,  active: true },
    { id: "f-8",  name: "Attendance Record",                              category: "ojt", order: 8,  active: true },
    { id: "f-9",  name: "OJT Progress Report",                            category: "ojt", order: 9,  active: true },
    { id: "f-10", name: "Job Proficiency Rating / Evaluation Sheet",      category: "ojt", order: 10, active: true },
    { id: "f-11", name: "OJT Certificate",                                category: "ojt", order: 11, active: true },
    { id: "f-12", name: "Narrative Report",                               category: "ojt", order: 12, active: true },
    { id: "f-13", name: "Pictures with Captions",                         category: "ojt", order: 13, active: true },
    { id: "f-14", name: "Company Profile",                                category: "hte", order: 1,  active: true },
    { id: "f-15", name: "Company Evaluation of Internship",               category: "hte", order: 2,  active: true },
];

function buildInitialUploads(fieldIds) {
    var records = {};
    for (var i = 0; i < fieldIds.length; i++) {
        records[fieldIds[i]] = { fieldId: fieldIds[i], status: "pending", file: null, uploadedBy: null, uploadedAt: null };
    }
    return records;
}

var ALL_FIELD_IDS = INITIAL_DOC_FIELDS.map(function(f) { return f.id; });

function makeUploadedRecord(fieldId, uploadedBy, uploadedAt, fileName, fileSize) {
    return { fieldId: fieldId, status: "uploaded", file: { name: fileName, size: fileSize }, uploadedBy: uploadedBy, uploadedAt: uploadedAt };
}

var INITIAL_STUDENTS = [
    {
        id: "STU-2025-001", name: "Christopher Quinto", year: "2024-2025", semester: "2nd Semester",
        email: "quinto_christopher@plpasig.edu.ph",
        uploads: (function() {
            var r = buildInitialUploads(ALL_FIELD_IDS);
            var uFields = ["f-1","f-2","f-3","f-4","f-5","f-6","f-7","f-8","f-9","f-10"];
            for (var i = 0; i < uFields.length; i++) {
                r[uFields[i]] = makeUploadedRecord(uFields[i], "student", "2025-01-15T09:30:00Z", "doc_" + uFields[i] + ".pdf", 512000);
            }
            r["f-14"] = makeUploadedRecord("f-14", "coordinator", "2025-01-20T14:00:00Z", "company_profile.pdf", 1024000);
            return r;
        })(),
    },
    {
        id: "STU-2025-002", name: "Maria Santos", year: "2024-2025", semester: "2nd Semester",
        email: "santos_maria@plpasig.edu.ph",
        uploads: (function() {
            var r = buildInitialUploads(ALL_FIELD_IDS);
            for (var i = 0; i < ALL_FIELD_IDS.length; i++) {
                r[ALL_FIELD_IDS[i]] = makeUploadedRecord(ALL_FIELD_IDS[i], "student", "2025-01-10T08:00:00Z", "doc_" + ALL_FIELD_IDS[i] + ".pdf", 400000);
            }
            return r;
        })(),
    },
    {
        id: "STU-2025-003", name: "Juan dela Cruz", year: "2024-2025", semester: "2nd Semester",
        email: "dela_cruz_juan@plpasig.edu.ph",
        uploads: (function() {
            var r = buildInitialUploads(ALL_FIELD_IDS);
            var uFields = ["f-1","f-2","f-3","f-4","f-5","f-6","f-7","f-8"];
            for (var i = 0; i < uFields.length; i++) {
                r[uFields[i]] = makeUploadedRecord(uFields[i], "student", "2025-01-12T10:00:00Z", "doc_" + uFields[i] + ".pdf", 300000);
            }
            return r;
        })(),
    },
    {
        id: "STU-2025-004", name: "Sarah Johnson", year: "2024-2025", semester: "2nd Semester",
        email: "johnson_sarah@plpasig.edu.ph",
        uploads: (function() {
            var r = buildInitialUploads(ALL_FIELD_IDS);
            var uFields = ["f-1","f-2","f-3","f-4","f-5","f-6","f-7","f-8","f-9","f-10","f-11","f-12"];
            for (var i = 0; i < uFields.length; i++) {
                r[uFields[i]] = makeUploadedRecord(uFields[i], "student", "2025-01-14T09:00:00Z", "doc_" + uFields[i] + ".pdf", 600000);
            }
            r["f-14"] = makeUploadedRecord("f-14", "coordinator", "2025-01-22T15:30:00Z", "company_profile.pdf", 900000);
            r["f-15"] = makeUploadedRecord("f-15", "coordinator", "2025-01-22T15:30:00Z", "evaluation.pdf", 900000);
            return r;
        })(),
    },
    {
        id: "STU-2024-015", name: "Robert Lee", year: "2023-2024", semester: "2nd Semester",
        email: "lee_robert@plpasig.edu.ph",
        uploads: (function() {
            var r = buildInitialUploads(ALL_FIELD_IDS);
            for (var i = 0; i < ALL_FIELD_IDS.length; i++) {
                r[ALL_FIELD_IDS[i]] = makeUploadedRecord(ALL_FIELD_IDS[i], "student", "2024-06-01T08:00:00Z", "doc_" + ALL_FIELD_IDS[i] + ".pdf", 450000);
            }
            return r;
        })(),
    },
];

function getActiveFields(docFields, category) {
    return docFields.filter(function(f) { return f.category === category && f.active; })
        .sort(function(a, b) { return a.order - b.order; });
}

function getAllActiveFields(docFields) {
    return docFields.filter(function(f) { return f.active; });
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

function generateFieldId() {
    return "f-custom-" + Date.now();
}

var STATUS_CONFIG = {
    "uploaded":     { icon: CheckCircle2, text: "Uploaded",     badge: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400", wrapper: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" },
    "pending":      { icon: Clock,        text: "Pending",       badge: "bg-amber-500/15 border-amber-500/40 text-amber-400",       wrapper: "bg-amber-500/10 border-amber-500/30 text-amber-400" },
};

export default function HTEDocumentArchivePage() {
    var ctx = useRole();
    var role = ctx.role;
    var studentId = ctx.studentId;

    var s1 = React.useState(INITIAL_STUDENTS);       var students = s1[0];           var setStudents = s1[1];
    var s2 = React.useState(INITIAL_DOC_FIELDS);     var docFields = s2[0];          var setDocFields = s2[1];
    var s3 = React.useState("");                      var searchQuery = s3[0];        var setSearchQuery = s3[1];
    var s4 = React.useState("all");                   var yearFilter = s4[0];         var setYearFilter = s4[1];
    var s5 = React.useState("all");                   var statusFilter = s5[0];       var setStatusFilter = s5[1];
    var s6 = React.useState(new Set());               var selectedStudents = s6[0];   var setSelectedStudents = s6[1];
    var s7 = React.useState(false);                   var showBatchPreview = s7[0];   var setShowBatchPreview = s7[1];
    var s8 = React.useState(null);                    var detailStudent = s8[0];      var setDetailStudent = s8[1];
    var s9 = React.useState(null);                    var uploadError = s9[0];        var setUploadError = s9[1];
    var s10 = React.useState(null);                   var uploadSuccess = s10[0];     var setUploadSuccess = s10[1];
    var s11 = React.useState([]);                     var notificationLog = s11[0];   var setNotificationLog = s11[1];
    var s12 = React.useState(false);                  var showLog = s12[0];           var setShowLog = s12[1];
    var s13 = React.useState(false);                  var showFieldConfig = s13[0];   var setShowFieldConfig = s13[1];

    var visibleStudents = role === "admin"
        ? students
        : students.filter(function(s) { return s.id === studentId; });

    var filteredStudents = visibleStudents.filter(function(s) {
        var status = getStudentStatus(s, docFields);
        var sq = searchQuery.toLowerCase();
        var matchSearch = s.name.toLowerCase().indexOf(sq) !== -1 || s.id.toLowerCase().indexOf(sq) !== -1;
        var matchYear = yearFilter === "all" || s.year === yearFilter;
        var matchStatus = statusFilter === "all" || status === statusFilter;
        return matchSearch && matchYear && matchStatus;
    });

    var incompleteStudents = filteredStudents.filter(function(s) { return getStudentStatus(s, docFields) === "incomplete"; });

    function handleUpload(sId, fieldId, file, uploaderRole) {
        var err = validateFile(file);
        if (err) { setUploadError(err); return; }
        setStudents(function(prev) {
            return prev.map(function(s) {
                if (s.id !== sId) return s;
                var newUploads = {};
                var keys = Object.keys(s.uploads);
                for (var i = 0; i < keys.length; i++) { newUploads[keys[i]] = s.uploads[keys[i]]; }
                newUploads[fieldId] = {
                    fieldId: fieldId,
                    status: "uploaded",
                    file: { name: file.name, size: file.size },
                    uploadedBy: uploaderRole === "admin" ? "coordinator" : "student",
                    uploadedAt: new Date().toISOString(),
                };
                return { id: s.id, name: s.name, year: s.year, semester: s.semester, email: s.email, uploads: newUploads };
            });
        });
        setUploadSuccess('"' + file.name + '" uploaded successfully.');
        setTimeout(function() { setUploadSuccess(null); }, 3500);
    }

    function handleRemoveUpload(sId, fieldId) {
        setStudents(function(prev) {
            return prev.map(function(s) {
                if (s.id !== sId) return s;
                var newUploads = {};
                var keys = Object.keys(s.uploads);
                for (var i = 0; i < keys.length; i++) { newUploads[keys[i]] = s.uploads[keys[i]]; }
                newUploads[fieldId] = { fieldId: fieldId, status: "pending", file: null, uploadedBy: null, uploadedAt: null };
                return { id: s.id, name: s.name, year: s.year, semester: s.semester, email: s.email, uploads: newUploads };
            });
        });
    }

    function handleSelectAll() {
        if (selectedStudents.size === incompleteStudents.length) {
            setSelectedStudents(new Set());
        } else {
            var ids = incompleteStudents.map(function(s) { return s.id; });
            setSelectedStudents(new Set(ids));
        }
    }

    function handleSelectStudent(id) {
        setSelectedStudents(function(prev) {
            var n = new Set(prev);
            if (n.has(id)) { n.delete(id); } else { n.add(id); }
            return n;
        });
    }

    function handleConfirmBatch() {
        var activeFields = getAllActiveFields(docFields);
        var notified = students.filter(function(s) { return selectedStudents.has(s.id); });
        var entry = {
            id: "LOG-" + Date.now(),
            timestamp: new Date().toISOString(),
            initiatedBy: "OJT Coordinator",
            studentCount: notified.length,
            students: notified.map(function(s) {
                var missing = [];
                for (var i = 0; i < activeFields.length; i++) {
                    var rec = s.uploads[activeFields[i].id];
                    if (!rec || rec.status !== "uploaded") missing.push(activeFields[i].name);
                }
                return { id: s.id, name: s.name, email: s.email, missingDocs: missing };
            }),
        };
        setNotificationLog(function(prev) { return [entry].concat(prev); });
        setShowBatchPreview(false);
        setSelectedStudents(new Set());
        setUploadSuccess("Notifications sent to " + notified.length + " student(s).");
        setTimeout(function() { setUploadSuccess(null); }, 4000);
    }

    function handleAddField(name, category, order) {
        var newField = { id: generateFieldId(), name: name, category: category, order: parseInt(order, 10), active: true };
        setDocFields(function(prev) { return prev.concat([newField]); });
        setStudents(function(prev) {
            return prev.map(function(s) {
                if (s.uploads[newField.id]) return s;
                var newUploads = {};
                var keys = Object.keys(s.uploads);
                for (var i = 0; i < keys.length; i++) { newUploads[keys[i]] = s.uploads[keys[i]]; }
                newUploads[newField.id] = { fieldId: newField.id, status: "pending", file: null, uploadedBy: null, uploadedAt: null };
                return { id: s.id, name: s.name, year: s.year, semester: s.semester, email: s.email, uploads: newUploads };
            });
        });
    }

    function handleToggleFieldActive(fieldId) {
        setDocFields(function(prev) {
            return prev.map(function(f) {
                if (f.id !== fieldId) return f;
                return { id: f.id, name: f.name, category: f.category, order: f.order, active: !f.active };
            });
        });
    }

    function handleUpdateFieldOrder(fieldId, newOrder) {
        var parsed = parseInt(newOrder, 10);
        if (isNaN(parsed)) return;
        setDocFields(function(prev) {
            return prev.map(function(f) {
                if (f.id !== fieldId) return f;
                return { id: f.id, name: f.name, category: f.category, order: parsed, active: f.active };
            });
        });
    }

    function handleUpdateFieldName(fieldId, newName) {
        setDocFields(function(prev) {
            return prev.map(function(f) {
                if (f.id !== fieldId) return f;
                return { id: f.id, name: newName, category: f.category, order: f.order, active: f.active };
            });
        });
    }

    var totalComplete = filteredStudents.filter(function(s) { return getStudentStatus(s, docFields) === "complete"; }).length;
    var totalIncomplete = incompleteStudents.length;
    var avgCompletion = 0;
    if (filteredStudents.length > 0) {
        var sum = 0;
        var activeAll = getAllActiveFields(docFields);
        filteredStudents.forEach(function(s) {
            sum += activeAll.length === 0 ? 1 : countUploadedForFields(s, activeAll) / activeAll.length;
        });
        avgCompletion = Math.round(sum / filteredStudents.length * 100);
    }

    var selectedNotified = students.filter(function(s) { return selectedStudents.has(s.id); });
    var liveDetail = detailStudent ? students.find(function(s) { return s.id === detailStudent.id; }) : null;

    return (
        <div className="flex flex-col min-h-screen w-full bg-slate-950 text-slate-100">
            <header className="border-b border-slate-800 bg-slate-950 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-semibold tracking-tight text-slate-100">HTE Document Archive</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {role === "admin" ? (
                            <button
                                onClick={function() { setShowFieldConfig(function(p) { return !p; }); }}
                                className={"flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg border transition-all shadow-sm " + (showFieldConfig ? "bg-blue-600 border-blue-500 text-white shadow-blue-500/20 hover:bg-blue-700" : "bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:border-slate-500 hover:text-white")}>
                                <Settings className={"h-3.5 w-3.5 transition-transform " + (showFieldConfig ? "rotate-45" : "")} />
                                <span>{showFieldConfig ? "Close" : "Manage Document Fields"}</span>
                            </button>
                        ) : null}
                        <div className={"flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border " + (role === "admin" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400")}>
                            {role === "admin" ? <ShieldCheck className="h-3.5 w-3.5" /> : <GraduationCap className="h-3.5 w-3.5" />}
                            <span>{role === "admin" ? "Admin" : "Student - " + (function() { for (var i = 0; i < students.length; i++) { if (students[i].id === studentId) return students[i].name; } return studentId; })()}</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-6">
                <div className="max-w-7xl mx-auto space-y-6">

                    {uploadError ? <Toast type="error" message={uploadError} onClose={function() { setUploadError(null); }} /> : null}
                    {uploadSuccess ? <Toast type="success" message={uploadSuccess} onClose={function() { setUploadSuccess(null); }} /> : null}

                    {/* Stats — always visible */}
                    {role === "admin" ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard icon={Users}        label="Total Students"  value={filteredStudents.length} color="blue" />
                            <StatCard icon={CheckCircle2} label="Complete"        value={totalComplete}           color="green" />
                            <StatCard icon={AlertCircle}  label="Incomplete"      value={totalIncomplete}         color="amber" />
                            <StatCard icon={FileText}     label="Avg. Completion" value={avgCompletion + "%"}     color="purple" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 max-w-sm">
                            {visibleStudents.map(function(s) {
                                var activeFields = getAllActiveFields(docFields);
                                var pct = activeFields.length === 0 ? 100 : Math.round(countUploadedForFields(s, activeFields) / activeFields.length * 100);
                                return (
                                    <React.Fragment key={s.id}>
                                        <StatCard icon={FileText}     label="Docs Submitted" value={countUploadedForFields(s, activeFields) + " / " + activeFields.length} color="blue" />
                                        <StatCard icon={CheckCircle2} label="My Completion"   value={pct + "%"} color={pct === 100 ? "green" : "amber"} />
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    )}

                    {/* Student info banner */}
                    {role === "student" ? (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-blue-300">HTE Document Upload Access</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    As a student, you can upload Host Training Establishment (HTE) documents only. OJT Trainee documents are managed by your coordinator.
                                </p>
                            </div>
                        </div>
                    ) : null}

                    {/* Field Config Panel — admin only */}
                    {role === "admin" && showFieldConfig ? (
                        <FieldConfigPanel
                            docFields={docFields}
                            onAddField={handleAddField
                                
                            }
                            onToggleActive={handleToggleFieldActive}
                            onUpdateOrder={handleUpdateFieldOrder}
                            onUpdateName={handleUpdateFieldName}
                        />
                    ) : null}

                    {/* Everything below is hidden while Field Config is open */}
                    {!showFieldConfig ? (
                        <React.Fragment>

                            {/* Search & filters — admin only */}
                            {role === "admin" ? (
                                <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="relative flex-1 min-w-[260px]">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                            <input
                                                type="text"
                                                placeholder="Search by name or ID..."
                                                value={searchQuery}
                                                onChange={function(e) { setSearchQuery(e.target.value); }}
                                                className="w-full pl-10 pr-4 py-2 bg-slate-950/50 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-slate-600"
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
                                        <button onClick={function() { setSearchQuery(""); setYearFilter("all"); setStatusFilter("all"); }} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 text-sm hover:bg-slate-800 transition-colors">
                                            <X className="h-3.5 w-3.5" /><span>Clear</span>
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            {/* Batch notify bar */}
                            {role === "admin" && selectedStudents.size > 0 ? (
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <Mail className="h-5 w-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-100">{selectedStudents.size} student(s) selected</p>
                                            <p className="text-sm text-slate-400">Ready to send batch notification</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={function() { setSelectedStudents(new Set()); }} className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 text-sm hover:bg-slate-800 transition-colors">Cancel</button>
                                        <button onClick={function() { setShowBatchPreview(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm transition-colors">
                                            <Mail className="h-4 w-4" /><span>Send Notifications</span>
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            {/* Student table */}
                            <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl overflow-hidden">
                                <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-base font-semibold text-slate-100">{role === "admin" ? "Student Document Status" : "My Document Status"}</h2>
                                        {role === "admin" ? <span className="text-xs px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800/50 text-slate-400">{filteredStudents.length} students</span> : null}
                                    </div>
                                    {role === "admin" && incompleteStudents.length > 0 ? (
                                        <button onClick={handleSelectAll} className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 transition-colors">
                                            {selectedStudents.size === incompleteStudents.length ? "Deselect All" : "Select All Incomplete"}
                                        </button>
                                    ) : null}
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-900/60 border-b border-slate-800/50">
                                            <tr>
                                                {role === "admin" ? <th className="px-4 py-3 text-left text-xs text-slate-500 uppercase tracking-wider font-medium">Select</th> : null}
                                                <th className="px-4 py-3 text-left text-xs text-slate-500 uppercase tracking-wider font-medium">Student</th>
                                                <th className="px-4 py-3 text-left text-xs text-slate-500 uppercase tracking-wider font-medium">Period</th>
                                                <th className="px-4 py-3 text-left text-xs text-slate-500 uppercase tracking-wider font-medium">OJT Docs</th>
                                                <th className="px-4 py-3 text-left text-xs text-slate-500 uppercase tracking-wider font-medium">HTE Docs</th>
                                                <th className="px-4 py-3 text-left text-xs text-slate-500 uppercase tracking-wider font-medium">Status</th>
                                                <th className="px-4 py-3 text-left text-xs text-slate-500 uppercase tracking-wider font-medium">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/30">
                                            {filteredStudents.map(function(student) {
                                                var status = getStudentStatus(student, docFields);
                                                var ojtActive = getActiveFields(docFields, "ojt");
                                                var hteActive = getActiveFields(docFields, "hte");
                                                var ojtUploaded = countUploadedForFields(student, ojtActive);
                                                var hteUploaded = countUploadedForFields(student, hteActive);
                                                var ojtPct = ojtActive.length === 0 ? 100 : Math.round(ojtUploaded / ojtActive.length * 100);
                                                var htePct = hteActive.length === 0 ? 100 : Math.round(hteUploaded / hteActive.length * 100);
                                                return (
                                                    <tr key={student.id} className="hover:bg-slate-900/40 transition-colors">
                                                        {role === "admin" ? (
                                                            <td className="px-4 py-4">
                                                                {status === "incomplete" ? (
                                                                    <input type="checkbox" checked={selectedStudents.has(student.id)} onChange={function() { handleSelectStudent(student.id); }} className="h-4 w-4 rounded border-slate-700 bg-slate-900" />
                                                                ) : null}
                                                            </td>
                                                        ) : null}
                                                        <td className="px-4 py-4">
                                                            <p className="font-medium text-slate-100">{student.name}</p>
                                                            <p className="text-xs text-slate-500">{student.id}</p>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <p className="text-slate-300">{student.year}</p>
                                                            <p className="text-xs text-slate-500">{student.semester}</p>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <ProgressCell uploaded={ojtUploaded} total={ojtActive.length} pct={ojtPct} color={ojtPct === 100 ? "emerald" : ojtPct >= 70 ? "blue" : "amber"} />
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <ProgressCell uploaded={hteUploaded} total={hteActive.length} pct={htePct} color={htePct === 100 ? "emerald" : "purple"} />
                                                        </td>
                                                        <td className="px-4 py-4"><StatusBadge status={status} /></td>
                                                        <td className="px-4 py-4">
                                                            <button onClick={function() { setDetailStudent(student); }} className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm transition-colors">
                                                                {role === "admin" ? <Eye className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                                                <span>{role === "admin" ? "View" : "My Docs"}</span>
                                                                <ChevronRight className="h-3.5 w-3.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {filteredStudents.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <FileText className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                                        <p className="text-slate-500 text-sm">No students found</p>
                                    </div>
                                ) : null}
                            </div>

                            {/* Notification Log */}
                            {role === "admin" && notificationLog.length > 0 ? (
                                <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl overflow-hidden">
                                    <button onClick={function() { setShowLog(function(p) { return !p; }); }} className="w-full p-4 flex items-center justify-between hover:bg-slate-900/60 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <History className="h-4 w-4 text-slate-400" />
                                            <span className="text-sm font-semibold text-slate-100">Notification Log</span>
                                            <span className="text-xs px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800/50 text-slate-400">{notificationLog.length} event{notificationLog.length !== 1 ? "s" : ""}</span>
                                        </div>
                                        {showLog ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                                    </button>
                                    {showLog ? (
                                        <div className="border-t border-slate-800/50 divide-y divide-slate-800/30">
                                            {notificationLog.map(function(entry) {
                                                return (
                                                    <div key={entry.id} className="p-4">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                                                                    <Mail className="h-3.5 w-3.5 text-blue-400" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-slate-100">Batch notification - {entry.studentCount} student{entry.studentCount !== 1 ? "s" : ""}</p>
                                                                    <div className="flex items-center gap-3 mt-0.5">
                                                                        <span className="flex items-center gap-1 text-xs text-slate-500"><User className="h-3 w-3" />{entry.initiatedBy}</span>
                                                                        <span className="flex items-center gap-1 text-xs text-slate-500"><Calendar className="h-3 w-3" />{formatTimestamp(entry.timestamp)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400">{entry.id}</span>
                                                        </div>
                                                        <div className="ml-11 flex flex-wrap gap-1.5">
                                                            {entry.students.map(function(s) {
                                                                return <span key={s.id} className="text-xs bg-slate-800/70 text-slate-300 px-2 py-0.5 rounded">{s.name}</span>;
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}

                        </React.Fragment>
                    ) : null}

                </div>
            </main>

            {/* Batch Preview Modal */}
            {showBatchPreview ? (
                <Modal onClose={function() { setShowBatchPreview(false); }} wide={true}>
                    <div className="flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-800">
                            <h2 className="text-xl font-semibold text-slate-100 mb-1">Preview Batch Notification</h2>
                            <p className="text-sm text-slate-400">Emails will be sent to <span className="text-slate-200 font-medium">{selectedNotified.length} student(s)</span>. Review before confirming.</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {selectedNotified.map(function(student) {
                                var activeFields = getAllActiveFields(docFields);
                                var missing = [];
                                for (var i = 0; i < activeFields.length; i++) {
                                    var rec = student.uploads[activeFields[i].id];
                                    if (!rec || rec.status !== "uploaded") missing.push(activeFields[i].name);
                                }
                                var portalLink = PORTAL_BASE_URL + "/" + student.id;
                                return (
                                    <div key={student.id} className="bg-slate-950/60 border border-slate-800 rounded-lg overflow-hidden">
                                        <div className="px-4 py-2.5 bg-slate-900/70 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                                            <div className="flex items-center gap-4 text-xs">
                                                <span className="text-slate-500">To:</span>
                                                <span className="font-medium text-slate-200">{student.name}</span>
                                                <span className="text-slate-600">|</span>
                                                <span className="text-slate-400">{student.email}</span>
                                            </div>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 flex-shrink-0">{missing.length} pending</span>
                                        </div>
                                        <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/50 flex items-center gap-3 text-xs">
                                            <span className="text-slate-500">Subject:</span>
                                            <span className="text-slate-300">Action Required: Pending OJT Document Submissions - {student.year} {student.semester}</span>
                                        </div>
                                        <div className="p-5 space-y-4 text-sm text-slate-300 leading-relaxed">
                                            <p>Dear <span className="font-semibold text-blue-400">{student.name}</span>,</p>
                                            <p className="text-slate-400">
                                                This is a reminder from your OJT Coordinator regarding your document submissions for the{" "}
                                                <span className="text-slate-200">{student.year} {student.semester}</span> internship period. The following document(s) are still pending:
                                            </p>
                                            <ul className="space-y-2 pl-1">
                                                {missing.map(function(docName, i) {
                                                    return (
                                                        <li key={i} className="flex items-start gap-2.5">
                                                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                                            <span className="text-slate-200">{docName}</span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                            <p className="text-slate-400">Please upload your missing documents through your student portal:</p>
                                            <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg px-4 py-3 flex items-center gap-3">
                                                <Mail className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                                <span className="text-blue-400 text-xs break-all">{portalLink}</span>
                                            </div>
                                            <p className="text-slate-500 text-xs pt-1 border-t border-slate-800/50">
                                                If you have already submitted any documents in person, please coordinate with your OJT Coordinator for manual processing. Do not reply to this automated message.
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
                            <button onClick={function() { setShowBatchPreview(false); }} className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 text-sm hover:bg-slate-800 transition-colors">Cancel</button>
                            <button onClick={handleConfirmBatch} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
                                <Mail className="h-4 w-4" /><span>Confirm and Send {selectedNotified.length} Email(s)</span>
                            </button>
                        </div>
                    </div>
                </Modal>
            ) : null}

            {/* Student Detail Modal */}
            {detailStudent ? (
                <StudentDetailModal
                    student={liveDetail ? liveDetail : detailStudent}
                    role={role}
                    docFields={docFields}
                    onClose={function() { setDetailStudent(null); }}
                    onUpload={function(fieldId, file) { handleUpload(detailStudent.id, fieldId, file, role); }}
                    onRemoveUpload={function(fieldId) { handleRemoveUpload(detailStudent.id, fieldId); }}
                    onError={setUploadError}
                />
            ) : null}
        </div>
    );
}

// ---
function FieldConfigPanel(props) {
    var docFields = props.docFields;
    var onAddField = props.onAddField;
    var onToggleActive = props.onToggleActive;
    var onUpdateOrder = props.onUpdateOrder;
    var onUpdateName = props.onUpdateName;

    var fa = React.useState(""); var newName = fa[0]; var setNewName = fa[1];
    var fb = React.useState("ojt"); var newCategory = fb[0]; var setNewCategory = fb[1];
    var fc = React.useState("1"); var newOrder = fc[0]; var setNewOrder = fc[1];
    var fd = React.useState(null); var addError = fd[0]; var setAddError = fd[1];

    var ojtFields = docFields.filter(function(f) { return f.category === "ojt"; }).sort(function(a, b) { return a.order - b.order; });
    var hteFields = docFields.filter(function(f) { return f.category === "hte"; }).sort(function(a, b) { return a.order - b.order; });

    function handleAdd() {
        if (!newName.trim()) { setAddError("Document name is required."); return; }
        var parsed = parseInt(newOrder, 10);
        if (isNaN(parsed) || parsed < 1) { setAddError("Display order must be a positive integer."); return; }
        setAddError(null);
        onAddField(newName.trim(), newCategory, parsed);
        setNewName("");
        setNewOrder("1");
    }

    function renderFieldRow(field) {
        return (
            <div key={field.id} className={"flex items-center gap-3 p-3 rounded-lg border transition-colors " + (field.active ? "bg-slate-900/50 border-slate-800" : "bg-slate-950/30 border-slate-800/40 opacity-60")}>
                <GripVertical className="h-4 w-4 text-slate-600 flex-shrink-0" />
                <input
                    type="number"
                    value={field.order}
                    min="1"
                    onChange={function(e) { onUpdateOrder(field.id, e.target.value); }}
                    className="w-14 px-2 py-1 bg-slate-950/70 border border-slate-700 rounded text-slate-300 text-xs text-center focus:outline-none focus:border-slate-500"
                />
                <input
                    type="text"
                    value={field.name}
                    onChange={function(e) { onUpdateName(field.id, e.target.value); }}
                    className="flex-1 px-3 py-1.5 bg-slate-950/70 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-slate-500"
                />
                <span className={"text-xs px-2 py-0.5 rounded-full border font-medium " + (field.active ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-slate-500/10 border-slate-500/30 text-slate-400")}>
                    {field.active ? "Active" : "Inactive"}
                </span>
                <button
                    onClick={function() { onToggleActive(field.id); }}
                    title={field.active ? "Deactivate field" : "Activate field"}
                    className={"h-7 w-7 rounded flex items-center justify-center transition-colors " + (field.active ? "text-emerald-400 hover:text-red-400 hover:bg-red-500/10" : "text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10")}>
                    {field.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                </button>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/40 border border-violet-500/30 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800/50 flex items-center gap-3">
                <Settings className="h-4 w-4 text-violet-400" />
                <h2 className="text-base font-semibold text-slate-100">Document Field Configuration</h2>
                <span className="text-xs px-2 py-0.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400">Admin Only</span>
            </div>

            <div className="p-6 space-y-6">
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                        <Plus className="h-4 w-4 text-blue-400" />Add New Document Field
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2">
                            <label className="block text-xs text-slate-500 mb-1">Document Name / Label</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={function(e) { setNewName(e.target.value); }}
                                placeholder="e.g. Medical Certificate"
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Target Category</label>
                            <select
                                value={newCategory}
                                onChange={function(e) { setNewCategory(e.target.value); }}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500">
                                <option value="ojt">OJT Trainee</option>
                                <option value="hte">HTE</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Display Order</label>
                            <input
                                type="number"
                                value={newOrder}
                                min="1"
                                onChange={function(e) { setNewOrder(e.target.value); }}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                    {addError ? <p className="text-xs text-red-400 mt-2">{addError}</p> : null}
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleAdd}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
                            <Save className="h-4 w-4" /><span>Add Field</span>
                        </button>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-400" />OJT Trainee Fields
                        </h3>
                        <span className="text-xs text-slate-500">{ojtFields.filter(function(f) { return f.active; }).length} active / {ojtFields.length} total</span>
                    </div>
                    <div className="space-y-2">
                        {ojtFields.map(renderFieldRow)}
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-purple-400" />HTE Fields
                        </h3>
                        <span className="text-xs text-slate-500">{hteFields.filter(function(f) { return f.active; }).length} active / {hteFields.length} total</span>
                    </div>
                    <div className="space-y-2">
                        {hteFields.map(renderFieldRow)}
                    </div>
                </div>

                <p className="text-xs text-slate-600 border-t border-slate-800/50 pt-4">
                    Deactivated fields are hidden from students and coordinators but retained for audit purposes. Existing uploaded files are never deleted when a field is deactivated. Completeness is calculated using active fields only.
                </p>
            </div>
        </div>
    );
}

// ---
function StudentDetailModal(props) {
    var s = props.student;
    var role = props.role;
    var docFields = props.docFields;
    var onClose = props.onClose;
    var onUpload = props.onUpload;
    var onRemoveUpload = props.onRemoveUpload;
    var onError = props.onError;

    var ojtFields = docFields.filter(function(f) {
        return f.category === "ojt" && (role === "admin" || f.active);
    }).sort(function(a, b) { return a.order - b.order; });

    var hteFields = docFields.filter(function(f) {
        return f.category === "hte" && (role === "admin" || f.active);
    }).sort(function(a, b) { return a.order - b.order; });

    var ojtActive = docFields.filter(function(f) { return f.category === "ojt" && f.active; });
    var hteActive = docFields.filter(function(f) { return f.category === "hte" && f.active; });
    var ojtUploaded = countUploadedForFields(s, ojtActive);
    var hteUploaded = countUploadedForFields(s, hteActive);

    return (
        <Modal onClose={onClose} wide={true}>
            <div className="flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-xl font-semibold text-slate-100">Document Repository</h2>
                    <p className="text-sm text-slate-400 mt-1">{s.name} | {s.id} | {s.year} {s.semester}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <DocSection
                        title="OJT Trainee Documents"
                        icon={<FileText className="h-5 w-5 text-blue-400" />}
                        fields={ojtFields}
                        uploads={s.uploads}
                        canUpload={role === "admin"}
                        canDownload={role === "admin"}
                        canRemove={role === "admin"}
                        onUpload={onUpload}
                        onRemoveUpload={onRemoveUpload}
                        onError={onError}
                        badgeColor="blue"
                        uploadedCount={ojtUploaded}
                        activeCount={ojtActive.length}
                    />
                    <DocSection
                        title="Host Training Establishment Documents"
                        icon={<Building2 className="h-5 w-5 text-purple-400" />}
                        fields={hteFields}
                        uploads={s.uploads}
                        canUpload={true}
                        canDownload={role === "admin"}
                        canRemove={role === "admin"}
                        onUpload={onUpload}
                        onRemoveUpload={onRemoveUpload}
                        onError={onError}
                        badgeColor="purple"
                        uploadedCount={hteUploaded}
                        activeCount={hteActive.length}
                    />
                </div>
                <div className="p-6 border-t border-slate-800 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 text-sm hover:bg-slate-800 transition-colors">Close</button>
                </div>
            </div>
        </Modal>
    );
}

function DocSection(props) {
    var title = props.title;
    var icon = props.icon;
    var fields = props.fields;
    var uploads = props.uploads;
    var canUpload = props.canUpload;
    var canDownload = props.canDownload;
    var canRemove = props.canRemove;
    var onUpload = props.onUpload;
    var onRemoveUpload = props.onRemoveUpload;
    var onError = props.onError;
    var badgeColor = props.badgeColor;
    var uploadedCount = props.uploadedCount;
    var activeCount = props.activeCount;

    var badgeClass = badgeColor === "blue" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-purple-500/10 border-purple-500/30 text-purple-400";

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">{icon}{title}</h3>
                <span className={"text-xs px-2.5 py-1 rounded-full border font-medium " + badgeClass}>{uploadedCount} / {activeCount} uploaded</span>
            </div>
            <div className="space-y-2">
                {fields.map(function(field) {
                    var rec = uploads[field.id];
                    var status = rec ? rec.status : "pending";
                    var isInactive = !field.active;
                    return (
                        <DocumentItem
                            key={field.id}
                            field={field}
                            rec={rec}
                            status={status}
                            isInactive={isInactive}
                            canUpload={canUpload && !isInactive}
                            canDownload={canDownload}
                            canRemove={canRemove}
                            onUpload={onUpload}
                            onRemoveUpload={onRemoveUpload}
                            onError={onError}
                        />
                    );
                })}
            </div>
        </div>
    );
}

function DocumentItem(props) {
    var field = props.field;
    var rec = props.rec;
    var status = props.status;
    var isInactive = props.isInactive;
    var canUpload = props.canUpload;
    var canDownload = props.canDownload;
    var canRemove = props.canRemove;
    var onUpload = props.onUpload;
    var onRemoveUpload = props.onRemoveUpload;
    var onError = props.onError;

    var fileInputRef = React.useRef(null);
    var expandedArr = React.useState(false); var expanded = expandedArr[0]; var setExpanded = expandedArr[1];

    var cfg = STATUS_CONFIG[status] ? STATUS_CONFIG[status] : STATUS_CONFIG["pending"];
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
        <div className={"border rounded-lg overflow-hidden transition-colors " + (isInactive ? "border-slate-800/30 opacity-40" : "border-slate-800 hover:border-slate-700")}>
            <div className="bg-slate-950/50 p-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={"h-9 w-9 rounded-lg border flex items-center justify-center flex-shrink-0 " + cfg.wrapper}>
                            <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-100 text-sm truncate">{field.name}</p>
                            <div className="flex items-center gap-2">
                                {rec && rec.uploadedBy ? <p className="text-xs text-slate-500">by {rec.uploadedBy === "coordinator" ? "Coordinator" : "Student"}</p> : null}
                                {isInactive ? <span className="text-xs text-slate-600 italic">Inactive field</span> : null}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={"text-xs px-2 py-0.5 rounded-full border font-medium " + cfg.badge}>{cfg.text}</span>
                        {status === "uploaded" && !isInactive ? (
                            <button title={expanded ? "Hide file details" : "View file details"} onClick={function() { setExpanded(function(p) { return !p; }); }} className="h-7 w-7 rounded flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
                                <Eye className="h-3.5 w-3.5" />
                            </button>
                        ) : null}
                        {status === "uploaded" && canDownload ? (
                            <button title="Download file" className="h-7 w-7 rounded flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
                                <Download className="h-3.5 w-3.5" />
                            </button>
                        ) : null}
                        {!isInactive && canUpload ? (
                            <span>
                                <input ref={fileInputRef} type="file" accept={ACCEPTED_EXTENSIONS.join(",")} onChange={handleFileChange} className="hidden" />
                                <button
                                    title={status === "uploaded" ? "Upload a new version of this file" : "Upload this document (PDF, DOCX, JPG, PNG · max 10 MB)"}
                                    onClick={function() { if (fileInputRef.current) { fileInputRef.current.click(); } }}
                                    className={"flex items-center gap-1 text-xs px-2.5 py-1 rounded transition-colors " + (status === "uploaded" ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "text-blue-400 hover:text-blue-300 hover:bg-blue-500/10")}>
                                    {status === "uploaded" ? <RefreshCw className="h-3 w-3" /> : <Upload className="h-3 w-3" />}
                                    <span>{status === "uploaded" ? "Replace" : "Upload"}</span>
                                </button>
                            </span>
                        ) : null}
                        {status === "uploaded" && canRemove ? (
                            <button title="Remove this file" onClick={function() { onRemoveUpload(field.id); }} className="h-7 w-7 rounded flex items-center justify-center text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        ) : null}
                    </div>
                </div>
                {expanded && status === "uploaded" && rec ? (
                    <div className="mt-3 pt-3 border-t border-slate-800/50 grid grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center gap-2 text-slate-400">
                            <FileText className="h-3.5 w-3.5 text-slate-600" />
                            <span className="text-slate-300 truncate">{rec.file && rec.file.name ? rec.file.name : "-"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                            <User className="h-3.5 w-3.5 text-slate-600" />
                            <span>{rec.uploadedBy === "coordinator" ? "Coordinator" : "Student"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                            <Calendar className="h-3.5 w-3.5 text-slate-600" />
                            <span>{formatTimestamp(rec.uploadedAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                            <FileText className="h-3.5 w-3.5 text-slate-600" />
                            <span>{formatFileSize(rec.file ? rec.file.size : null)}</span>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function StatCard(props) {
    var Icon = props.icon; var label = props.label; var value = props.value; var color = props.color;
    var clsMap = { blue: "bg-blue-500/10 border-blue-500/30 text-blue-400", green: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400", amber: "bg-amber-500/10 border-amber-500/30 text-amber-400", purple: "bg-purple-500/10 border-purple-500/30 text-purple-400" };
    return (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-3">
                <div className={"h-11 w-11 rounded-lg flex items-center justify-center border " + (clsMap[color] || clsMap.blue)}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-xl font-bold text-slate-100">{value}</p>
                </div>
            </div>
        </div>
    );
}

function ProgressCell(props) {
    var uploaded = props.uploaded; var total = props.total; var pct = props.pct; var color = props.color;
    var barMap = { emerald: "bg-emerald-500", blue: "bg-blue-500", amber: "bg-amber-500", purple: "bg-purple-500" };
    var barColor = barMap[color] || "bg-blue-500";
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-slate-300">{uploaded}/{total}</span>
                <span className="text-xs text-slate-500">({pct}%)</span>
            </div>
            <div className="w-28 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className={"h-full " + barColor + " transition-all"} style={{ width: pct + "%" }} />
            </div>
        </div>
    );
}

function StatusBadge(props) {
    var isComplete = props.status === "complete";
    return (
        <span className={"inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border font-medium " + (isComplete ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400" : "bg-amber-500/15 border-amber-500/40 text-amber-400")}>
            {isComplete ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            <span>{isComplete ? "Complete" : "Incomplete"}</span>
        </span>
    );
}

function SelectInput(props) {
    var value = props.value; var onChange = props.onChange; var options = props.options;
    return (
        <select value={value} onChange={function(e) { onChange(e.target.value); }} className="px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-slate-600">
            {options.map(function(o) { return <option key={o.value} value={o.value}>{o.label}</option>; })}
        </select>
    );
}

function Modal(props) {
    var onClose = props.onClose; var children = props.children; var wide = props.wide;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />
            <div className={"relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full overflow-hidden " + (wide ? "max-w-4xl" : "max-w-2xl")}>
                {children}
            </div>
        </div>
    );
}

function Toast(props) {
    var type = props.type; var message = props.message; var onClose = props.onClose;
    var isError = type === "error";
    return (
        <div className={"flex items-start gap-3 p-4 rounded-xl border " + (isError ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400")}>
            {isError ? <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" /> : <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />}
            <p className="text-sm flex-1">{message}</p>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X className="h-4 w-4" /></button>
        </div>
    );
}
