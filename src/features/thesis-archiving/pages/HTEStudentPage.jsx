import React from "react";
import {
    FileText, Upload, CheckCircle2, Clock, RefreshCw, X,
    AlertTriangle, User, Calendar, Building2, ChevronRight,
    MinusCircle, Eye, EyeOff, Info, GraduationCap,
    LayoutDashboard, BookOpen, LogOut,
    KeyRound, Lock, Mail, Shield, Loader2
} from "lucide-react";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { HTEArchivingHeader } from "./HTEDocumentArchivePage";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { settingsService } from "@/features/settings/services/settingsService";
import { supabase } from "@/lib/supabaseClient";

// ─────────────────────────────────────────────────────────────────────────────
// Shared constants
// ─────────────────────────────────────────────────────────────────────────────
var ACCEPTED_FORMATS    = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"];
var ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".jpg", ".jpeg", ".png"];
var MAX_FILE_SIZE_MB    = 10;
var MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

var btnBase        = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 cursor-pointer";
var btnIconGhost   = btnBase + " size-7 text-neutral-500 border border-neutral-200 bg-white hover:bg-neutral-100 hover:text-neutral-900 hover:border-neutral-300 shadow-xs";
var btnSmDefault   = btnBase + " h-8 px-3 text-xs gap-1.5 bg-primary-500 text-white hover:bg-primary-600 shadow-sm border border-primary-600";
var btnSmSecondary = btnBase + " h-8 px-3 text-xs gap-1.5 bg-neutral-100 text-neutral-900 hover:bg-neutral-200 shadow-xs border border-neutral-300 hover:border-neutral-400";

// ─────────────────────────────────────────────────────────────────────────────
// STATUS SYSTEM
// Every document slot must display exactly one of three statuses.
// resolveStatus() is the single source of truth — all rendering reads from it.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves the display status for a document slot.
 * Rules (in priority order):
 *  1. If the field is deactivated  → "not_required"
 *  2. If there is an upload record with status "uploaded" → "uploaded"
 *  3. Everything else              → "pending"
 *
 * This guarantees every slot shows exactly one of the three statuses,
 * even if rec is missing, null, or has an unexpected status value from the DB.
 */
function resolveStatus(field, rec) {
    if (!field.active) return "not_required";
    if (rec && rec.status === "uploaded") return "uploaded";
    return "pending";
}

var STATUS_CONFIG = {
    "uploaded": {
        icon: CheckCircle2,
        text: "Uploaded",
        badge:   "bg-success/10 border-success/40 text-success",
        wrapper: "bg-success/10 border-success/30 text-success",
    },
    "pending": {
        icon: Clock,
        text: "Pending",
        badge:   "bg-warning/10 border-warning/40 text-warning",
        wrapper: "bg-warning/10 border-warning/30 text-warning",
    },
    "not_required": {
        icon: MinusCircle,
        text: "Not Required",
        badge:   "bg-neutral-500/10 border-neutral-500/40 text-neutral-500",
        wrapper: "bg-neutral-500/10 border-neutral-500/30 text-neutral-500",
    },
};

var PAGE = { OVERVIEW: "overview", OJT: "ojt", HTE: "hte", GUIDELINES: "guidelines" };

function validateFile(file) {
    if (ACCEPTED_FORMATS.indexOf(file.type) === -1) return "Unsupported format. Accepted: " + ACCEPTED_EXTENSIONS.join(", ");
    if (file.size > MAX_FILE_SIZE_BYTES) return "File too large. Max " + MAX_FILE_SIZE_MB + " MB. Current: " + (file.size / 1024 / 1024).toFixed(1) + " MB";
    return null;
}
function formatTimestamp(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function formatFileSize(bytes) {
    if (!bytes) return "—";
    if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB";
    return Math.round(bytes / 1024) + " KB";
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// Props: student, docFields, onUpload(studentId, fieldId, file)
// ─────────────────────────────────────────────────────────────────────────────
export default function HTEStudentPage(props) {
    var student   = props.student;
    var docFields = props.docFields;
    var onUpload  = props.onUpload;
    const { user } = useAuth();

    const actorInfo = React.useMemo(() => ({
        actorUserId: user?.id,
        actorName: user?.user_metadata?.first_name 
            ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim()
            : user?.email || "System User"
    }), [user]);

    var pa = React.useState(PAGE.OVERVIEW); var activePage = pa[0]; var setActivePage = pa[1];
    var ta = React.useState(null);          var toast = ta[0];      var setToast = ta[1];

    function handleError(msg) { setToast({ type: "error", msg: msg }); setTimeout(function() { setToast(null); }, 4000); }
    function handleUploadSuccess(name) { setToast({ type: "success", msg: '"' + name + '" uploaded successfully.' }); setTimeout(function() { setToast(null); }, 3500); }
    async function handleUpload(fieldId, file) {
        var err = validateFile(file);
        if (err) { handleError(err); return; }

        // Google Auth check removed for students - now using system token
        onUpload(student.id, fieldId, file, actorInfo);
        handleUploadSuccess(file.name);
    }

    // Separate all fields by category — inactive fields are NOT filtered out.
    // They are passed through to pages and displayed with "Not Required" status.
    var ojtFields = docFields.filter(function(f) { return f.category === "ojt"; }).sort(function(a,b) { return a.order - b.order; });
    var hteFields = docFields.filter(function(f) { return f.category === "hte"; }).sort(function(a,b) { return a.order - b.order; });

    // Active-only subsets are only used for completion counting — NOT for rendering
    var ojtActive = ojtFields.filter(function(f) { return f.active; });
    var hteActive = hteFields.filter(function(f) { return f.active; });

    var ojtUploaded = ojtActive.filter(function(f) { return resolveStatus(f, student.uploads[f.id]) === "uploaded"; }).length;
    var hteUploaded = hteActive.filter(function(f) { return resolveStatus(f, student.uploads[f.id]) === "uploaded"; }).length;

    var ojtPct   = ojtActive.length === 0 ? 100 : Math.round(ojtUploaded / ojtActive.length * 100);
    var htePct   = hteActive.length === 0 ? 100 : Math.round(hteUploaded / hteActive.length * 100);
    var totalAct = ojtActive.length + hteActive.length;
    var totalUp  = ojtUploaded + hteUploaded;
    var totalPct = totalAct === 0 ? 100 : Math.round(totalUp / totalAct * 100);
    var isComplete = totalPct === 100;

    if (!student) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-100">
                <div className="text-center">
                    <GraduationCap className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500 text-sm">No student record found.</p>
                </div>
            </div>
        );
    }

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-neutral-100 text-neutral-900">
                <StudentSidebar activePage={activePage} onNavigate={setActivePage} student={student} />
                <div className="flex flex-col flex-1 w-0 min-w-0">
                    <HTEArchivingHeader role="student" user={user} students={[student]} studentId={student.id} showFieldConfig={false} />
                    <main className="flex-1 w-full p-6">
                        {activePage === PAGE.OVERVIEW   && <OverviewPage   student={student} ojtFields={ojtFields} ojtActive={ojtActive} hteActive={hteActive} ojtUploaded={ojtUploaded} hteUploaded={hteUploaded} ojtPct={ojtPct} htePct={htePct} totalPct={totalPct} totalUp={totalUp} totalAct={totalAct} isComplete={isComplete} onNavigate={setActivePage} />}
                        {activePage === PAGE.OJT        && <OJTPage        student={student} fields={ojtFields} uploaded={ojtUploaded} total={ojtActive.length} pct={ojtPct} onUpload={handleUpload} onError={handleError} />}
                        {activePage === PAGE.HTE        && <HTEPage        student={student} fields={hteFields} uploaded={hteUploaded} total={hteActive.length} pct={htePct} onUpload={handleUpload} onError={handleError} />}
                        {activePage === PAGE.GUIDELINES && <GuidelinesPage />}
                    </main>
                </div>
                {toast && (
                    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] w-96 pointer-events-auto">
                        <Toast type={toast.type} message={toast.msg} onClose={function() { setToast(null); }} />
                    </div>
                )}
            </div>
        </SidebarProvider>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar — collapses to narrow icon rail on desktop, fully hides on mobile
// ─────────────────────────────────────────────────────────────────────────────
function StudentSidebar(props) {
    const { state, openMobile, isMobile } = useSidebar();
    var activePage = props.activePage;
    var onNavigate = props.onNavigate;
    var student    = props.student;

    var cpState = React.useState(false); var showChangePassword = cpState[0]; var setShowChangePassword = cpState[1];
    var modalState = React.useState(false); var showPasswordModal = modalState[0]; var setShowPasswordModal = modalState[1];

    if (isMobile && !openMobile) return null;
    var isCollapsed = !isMobile && state === "collapsed";

    var navItems = [
        { page: PAGE.OVERVIEW,   icon: LayoutDashboard, label: "Overview" },
        { page: PAGE.OJT,        icon: FileText,        label: "OJT Documents", badge: "OJT" },
        { page: PAGE.HTE,        icon: Building2,       label: "HTE Documents" },
        { page: PAGE.GUIDELINES, icon: Info,            label: "Guidelines" },
    ];

    return (
        <aside className={"flex-shrink-0 flex flex-col min-h-screen sticky top-0 h-screen bg-white border-r border-neutral-200 transition-[width] duration-200 overflow-hidden " + (isCollapsed ? "w-[52px]" : "w-60")}>
            {/* Brand */}
            <div className={"h-14 border-b border-neutral-200 flex items-center flex-shrink-0 " + (isCollapsed ? "justify-center" : "gap-3 px-4")}>
                <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0"><BookOpen className="h-4 w-4 text-white" /></div>
                {!isCollapsed && (
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-900 truncate leading-tight">HTE / OJT Portal</p>
                        <p className="text-[10px] text-neutral-500 truncate">Student Document Archive</p>
                    </div>
                )}
            </div>
            {/* Nav */}
            <nav className={"flex-1 overflow-y-auto " + (isCollapsed ? "px-2 py-3" : "p-3")}>
                {!isCollapsed && <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2 pt-1 pb-2">Menu</p>}
                <div className="space-y-0.5">
                    {navItems.map(function(item) {
                        var active = activePage === item.page;
                        return (
                            <button key={item.page} title={isCollapsed ? item.label : undefined} onClick={function() { onNavigate(item.page); }}
                                className={"w-full flex items-center rounded-lg text-sm font-medium transition-all " + (isCollapsed ? "justify-center p-2.5 " : "gap-2.5 px-3 py-2.5 ") + (active ? "bg-primary-500/10 text-primary-600" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900")}>
                                <item.icon className={"h-4 w-4 flex-shrink-0 " + (active ? "text-primary-500" : "text-neutral-400")} />
                                {!isCollapsed && (
                                    <React.Fragment>
                                        <span className="flex-1 text-left">{item.label}</span>
                                        {item.badge && <span className={"text-[10px] font-bold px-1.5 py-0.5 rounded-full " + (active ? "bg-primary-500/20 text-primary-600" : "bg-neutral-100 text-neutral-500")}>{item.badge}</span>}
                                    </React.Fragment>
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>
            {/* Footer */}
            <div className={"border-t border-neutral-200 flex-shrink-0 " + (isCollapsed ? "px-2 py-3" : "p-3")}>
                {isCollapsed ? (
                    <div className="flex flex-col items-center gap-2">
                        <button onClick={function () { setShowPasswordModal(true); }} title="Change Password" className="h-8 w-8 rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center cursor-pointer hover:bg-primary-500/20 transition-all">
                            <User className="h-4 w-4 text-primary-500" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {/* Change Password button — slides in above profile card */}
                        {showChangePassword && (
                            <button
                                onClick={function () { setShowPasswordModal(true); setShowChangePassword(false); }}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-primary-600 bg-primary-500/8 border border-primary-500/20 hover:bg-primary-500/15 hover:border-primary-500/30 transition-all cursor-pointer"
                            >
                                <KeyRound className="h-4 w-4" /><span>Change Password</span>
                            </button>
                        )}
                        {/* Clickable Profile Card */}
                        <div
                            onClick={function () { setShowChangePassword(function (p) { return !p; }); }}
                            className={"bg-neutral-50 border rounded-xl p-3 space-y-2.5 cursor-pointer transition-all " + (showChangePassword ? "border-primary-500/30 bg-primary-500/5 shadow-sm" : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100")}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className={"h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all " + (showChangePassword ? "bg-primary-500/15 border border-primary-500/30" : "bg-primary-500/10 border border-primary-500/20")}><User className="h-4 w-4 text-primary-500" /></div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-neutral-900 truncate leading-none">{student.name}</p>
                                    <p className="text-[10px] text-neutral-500 mt-0.5 truncate">{student.id}</p>
                                </div>
                                <ChevronRight className={"h-3 w-3 text-neutral-400 flex-shrink-0 transition-transform duration-200 " + (showChangePassword ? "rotate-90" : "")} />
                            </div>
                            <div className="space-y-1 text-[10px] text-neutral-500 pl-0.5">
                                <div className="flex items-center gap-1.5"><Calendar className="h-2.5 w-2.5 text-neutral-400 flex-shrink-0" /><span>{student.year} · {student.semester}</span></div>
                                <div className="flex items-center gap-1.5"><GraduationCap className="h-2.5 w-2.5 text-neutral-400 flex-shrink-0" /><span className="truncate">{student.email}</span></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Change Password Modal */}
            {showPasswordModal && (
                <ChangePasswordModal
                    studentEmail={student.email}
                    studentName={student.name}
                    onClose={function () { setShowPasswordModal(false); }}
                />
            )}
        </aside>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Overview Page
// ─────────────────────────────────────────────────────────────────────────────
function OverviewPage(props) {
    var student     = props.student;
    var ojtFields   = props.ojtFields;
    var ojtActive   = props.ojtActive;
    var hteActive   = props.hteActive;
    var ojtUploaded = props.ojtUploaded;
    var hteUploaded = props.hteUploaded;
    var ojtPct      = props.ojtPct;
    var htePct      = props.htePct;
    var totalPct    = props.totalPct;
    var totalUp     = props.totalUp;
    var totalAct    = props.totalAct;
    var isComplete  = props.isComplete;
    var onNavigate  = props.onNavigate;

    var pendingOjt = ojtActive.filter(function(f) {
        return resolveStatus(f, student.uploads[f.id]) === "pending";
    });

    return (
        <div className="w-full space-y-5">
            <div className={"rounded-2xl p-6 flex items-center gap-5 shadow-sm " + (isComplete ? "bg-success/8 border border-success/30" : "bg-gradient-primary")}>
                <div className={"h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm " + (isComplete ? "bg-success/15 border border-success/30" : "bg-white/15 border border-white/20")}>
                    {isComplete ? <CheckCircle2 className="h-7 w-7 text-success" /> : <GraduationCap className="h-7 w-7 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={"text-xl font-bold " + (isComplete ? "text-success" : "text-white")}>
                        {isComplete ? "All documents submitted!" : "Welcome, " + student.name.split(" ")[0] + "!"}
                    </p>
                    <p className={"text-sm mt-1 " + (isComplete ? "text-success/80" : "text-white/75")}>
                        {isComplete ? "Your submission is complete. Your coordinator will review your documents." : pendingOjt.length + " document(s) still pending — upload them to complete your submission."}
                    </p>
                    <p className={"text-xs mt-1 " + (isComplete ? "text-success/60" : "text-white/50")}>{student.year} · {student.semester} · {student.id}</p>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className={"text-5xl font-black leading-none " + (isComplete ? "text-success" : "text-white")}>{totalPct}%</p>
                    <p className={"text-xs mt-1 " + (isComplete ? "text-success/70" : "text-white/60")}>{totalUp} / {totalAct} docs</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={function() { onNavigate(PAGE.OJT); }} className="group text-left bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary-500/30 transition-all">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center"><FileText className="h-5 w-5 text-primary-500" /></div>
                            <div><p className="text-sm font-bold text-neutral-900">OJT Documents</p><p className="text-xs text-neutral-500 mt-0.5">Student uploaded</p></div>
                        </div>
                        <span className={"text-3xl font-black " + (ojtPct === 100 ? "text-success" : "text-primary-500")}>{ojtPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden mb-2">
                        <div className={"h-full rounded-full transition-all duration-700 " + (ojtPct === 100 ? "bg-success" : "bg-primary-500")} style={{ width: ojtPct + "%" }} />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500">{ojtUploaded} of {ojtActive.length} uploaded</span>
                        <span className="text-xs text-primary-500 font-semibold flex items-center gap-1 group-hover:gap-1.5 transition-all">Upload docs <ChevronRight className="h-3 w-3" /></span>
                    </div>
                </button>
                <button onClick={function() { onNavigate(PAGE.HTE); }} className="group text-left bg-white border border-neutral-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center"><Building2 className="h-5 w-5 text-neutral-500" /></div>
                            <div><p className="text-sm font-bold text-neutral-900">HTE Documents</p><p className="text-xs text-neutral-500 mt-0.5">Student uploaded</p></div>
                        </div>
                        <span className={"text-3xl font-black " + (htePct === 100 ? "text-success" : "text-neutral-400")}>{htePct}%</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden mb-2">
                        <div className={"h-full rounded-full transition-all duration-700 " + (htePct === 100 ? "bg-success" : "bg-neutral-400")} style={{ width: htePct + "%" }} />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500">{hteUploaded} of {hteActive.length} uploaded</span>
                        <span className="text-xs text-neutral-500 font-semibold flex items-center gap-1 group-hover:gap-1.5 transition-all">View status <ChevronRight className="h-3 w-3" /></span>
                    </div>
                </button>
            </div>

            {pendingOjt.length > 0 && (
                <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-warning/10 border border-warning/30 flex items-center justify-center"><Clock className="h-4 w-4 text-warning" /></div>
                            <div>
                                <p className="text-sm font-bold text-neutral-900">Pending OJT Documents</p>
                                <p className="text-xs text-neutral-500">{pendingOjt.length} document{pendingOjt.length !== 1 ? "s" : ""} awaiting upload</p>
                            </div>
                        </div>
                        <button onClick={function() { onNavigate(PAGE.OJT); }} className={btnSmDefault}><Upload className="h-3.5 w-3.5" /><span>Upload now</span></button>
                    </div>
                    <div className="divide-y divide-neutral-50">
                        {pendingOjt.slice(0, 6).map(function(field) {
                            return (
                                <div key={field.id} className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-50 transition-colors">
                                    <span className="h-1.5 w-1.5 rounded-full bg-warning flex-shrink-0" />
                                    <span className="text-sm text-neutral-700">{field.name}</span>
                                    <span className={"ml-auto text-xs px-2 py-0.5 rounded-full border font-semibold " + STATUS_CONFIG.pending.badge}>Pending</span>
                                </div>
                            );
                        })}
                        {pendingOjt.length > 6 && (
                            <button onClick={function() { onNavigate(PAGE.OJT); }} className="w-full px-5 py-3 text-left text-xs text-neutral-500 hover:text-primary-500 hover:bg-neutral-50 transition-colors">
                                +{pendingOjt.length - 6} more — view all documents →
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="bg-primary-500/5 border border-primary-500/20 rounded-xl p-4 flex items-start gap-3">
                <Info className="h-4 w-4 text-primary-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-neutral-600 leading-relaxed space-y-1">
                    <p><span className="font-semibold text-neutral-900">OJT Documents</span> — 13 required fields. Upload PDF, DOCX, JPG, or PNG files up to 10 MB each.</p>
                    <p><span className="font-semibold text-neutral-900">HTE Documents</span> — Company Profile and Company Evaluation. Upload PDF, DOCX, JPG, or PNG files up to 10 MB each.</p>
                    <p><span className="font-semibold text-neutral-900">Not Required</span> — Fields deactivated by your coordinator. Shown for visibility but excluded from completion %.</p>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// OJT Documents Page
// NOTE: fields = ALL ojt fields (active + inactive). Inactive ones render as
//       "Not Required" — they are never hidden.
// ─────────────────────────────────────────────────────────────────────────────
function OJTPage(props) {
    var student  = props.student;
    var fields   = props.fields;   // ALL ojt fields, sorted
    var uploaded = props.uploaded;
    var total    = props.total;    // active-only count for progress display
    var pct      = props.pct;
    var onUpload = props.onUpload;
    var onError  = props.onError;
    var isComplete = pct === 100;

    return (
        <div className="w-full space-y-5">
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center flex-shrink-0"><User className="h-6 w-6 text-primary-500" /></div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-neutral-900 text-base leading-none">{student.name}</p>
                    <p className="text-xs text-neutral-500 mt-1">{student.id} · {student.year} {student.semester}</p>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className={"text-3xl font-black leading-none " + (isComplete ? "text-success" : "text-primary-500")}>{pct}%</p>
                    <p className="text-xs text-neutral-500 mt-1">{uploaded} / {total} submitted</p>
                </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl px-5 py-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Submission Progress</span>
                    <span className={"text-xs font-bold " + (isComplete ? "text-success" : "text-primary-500")}>{isComplete ? "Complete ✓" : "In Progress"}</span>
                </div>
                <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div className={"h-full rounded-full transition-all duration-700 " + (isComplete ? "bg-success" : "bg-primary-500")} style={{ width: pct + "%" }} />
                </div>
            </div>

            <div className="bg-warning/8 border border-warning/30 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                <p className="text-xs text-neutral-700 leading-relaxed">
                    Upload all required OJT Trainee documents below. Accepted formats: <span className="font-semibold text-neutral-900">PDF, DOCX, JPG, PNG</span> · Max size: <span className="font-semibold text-neutral-900">10 MB</span>.
                    Slots marked <span className="font-semibold text-neutral-900">Not Required</span> have been deactivated by your coordinator and do not count toward completion.
                </p>
            </div>

            {/* Document list — every field rendered with one of three statuses */}
            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 border-b border-neutral-200 bg-gradient-primary flex items-center justify-between">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2"><FileText className="h-4 w-4" />OJT Trainee Documents</h2>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white/15 border border-white/25 text-white font-semibold">{uploaded} / {total} uploaded</span>
                </div>
                <div className="divide-y divide-neutral-100">
                    {fields.map(function(field, idx) {
                        var rec    = student.uploads[field.id];
                        var status = resolveStatus(field, rec); // always "uploaded" | "pending" | "not_required"
                        return <OJTDocRow key={field.id} index={idx + 1} field={field} rec={rec} status={status} onUpload={onUpload} />;
                    })}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// OJT Document Row
// status is always exactly one of: "uploaded" | "pending" | "not_required"
// ─────────────────────────────────────────────────────────────────────────────
function OJTDocRow(props) {
    var index    = props.index;
    var field    = props.field;
    var rec      = props.rec;
    var status   = props.status; // guaranteed to be one of the three valid values
    var onUpload = props.onUpload;

    var fileInputRef = React.useRef(null);
    var exp = React.useState(false); var expanded = exp[0]; var setExpanded = exp[1];

    var cfg           = STATUS_CONFIG[status]; // always defined — no fallback needed
    var StatusIcon    = cfg.icon;
    var isUploaded    = status === "uploaded";
    var isNotRequired = status === "not_required";

    function handleFileChange(e) { var file = e.target.files[0]; if (!file) return; onUpload(field.id, file); e.target.value = ""; }

    return (
        <div className={"transition-colors " + (isNotRequired ? "opacity-60 bg-neutral-50/60" : "hover:bg-neutral-50")}>
            <div className="flex items-center gap-3 px-5 py-4">
                <span className="text-xs font-bold text-neutral-300 w-5 text-right flex-shrink-0 tabular-nums">{index}</span>
                <div className={"h-9 w-9 rounded-lg border flex items-center justify-center flex-shrink-0 " + cfg.wrapper}><StatusIcon className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 truncate">{field.name}</p>
                    {isUploaded && rec && rec.uploadedAt ? (
                        <p className="text-xs text-neutral-500 mt-0.5">Uploaded {formatTimestamp(rec.uploadedAt)}{rec.file ? " · " + formatFileSize(rec.file.size) : ""} · by You</p>
                    ) : isNotRequired ? (
                        <p className="text-xs text-neutral-400 mt-0.5">Deactivated by coordinator — not counted toward completion</p>
                    ) : (
                        <p className="text-xs text-neutral-400 mt-0.5">PDF, DOCX, JPG, PNG · max 10 MB</p>
                    )}
                </div>
                {/* Status badge — always visible, always one of three values */}
                <span className={"text-xs px-2.5 py-1 rounded-full border font-semibold flex-shrink-0 " + cfg.badge}>{cfg.text}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isUploaded && (
                        <button title={expanded ? "Hide details" : "View details"} onClick={function() { setExpanded(function(p) { return !p; }); }} className={btnIconGhost}><Eye className="h-3.5 w-3.5" /></button>
                    )}
                    {/* Upload / Replace only on active fields */}
                    {!isNotRequired && (
                        <React.Fragment>
                            <input ref={fileInputRef} type="file" accept={ACCEPTED_EXTENSIONS.join(",")} onChange={handleFileChange} className="hidden" />
                            <button onClick={function() { if (fileInputRef.current) fileInputRef.current.click(); }} className={isUploaded ? btnSmSecondary : btnSmDefault}>
                                {isUploaded ? <RefreshCw className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
                                <span>{isUploaded ? "Replace" : "Upload"}</span>
                            </button>
                        </React.Fragment>
                    )}
                </div>
            </div>
            {expanded && isUploaded && rec && (
                <div className="mx-5 mb-4 p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3">File Details</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div><p className="text-neutral-400 mb-0.5">File name</p><p className="font-semibold text-neutral-900 truncate">{rec.file ? rec.file.name : "—"}</p></div>
                        <div><p className="text-neutral-400 mb-0.5">File size</p><p className="font-semibold text-neutral-900">{rec.file ? formatFileSize(rec.file.size) : "—"}</p></div>
                        <div><p className="text-neutral-400 mb-0.5">Uploaded at</p><p className="font-semibold text-neutral-900">{formatTimestamp(rec.uploadedAt)}</p></div>
                        <div><p className="text-neutral-400 mb-0.5">Uploaded by</p><p className="font-semibold text-neutral-900">{rec.uploadedBy === "coordinator" ? "Coordinator" : "You (Student)"}</p></div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// HTE Documents Page
// NOTE: fields = ALL hte fields. Inactive ones render as "Not Required".
// Students can upload to active HTE slots just like OJT slots.
// ─────────────────────────────────────────────────────────────────────────────
function HTEPage(props) {
    var student  = props.student;
    var fields   = props.fields;
    var uploaded = props.uploaded;
    var total    = props.total;
    var pct      = props.pct;
    var onUpload = props.onUpload;
    var onError  = props.onError;
    var isComplete = pct === 100;

    return (
        <div className="w-full space-y-5">
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center flex-shrink-0"><Building2 className="h-6 w-6 text-neutral-500" /></div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-neutral-900 text-base leading-none">HTE Documents</p>
                    <p className="text-xs text-neutral-500 mt-1">Host Training Establishment · {student.year} {student.semester}</p>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className={"text-3xl font-black leading-none " + (isComplete ? "text-success" : "text-neutral-400")}>{pct}%</p>
                    <p className="text-xs text-neutral-500 mt-1">{uploaded} / {total} uploaded</p>
                </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl px-5 py-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Submission Progress</span>
                    <span className={"text-xs font-bold " + (isComplete ? "text-success" : "text-neutral-500")}>{isComplete ? "Complete ✓" : "In Progress"}</span>
                </div>
                <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div className={"h-full rounded-full transition-all duration-700 " + (isComplete ? "bg-success" : "bg-neutral-400")} style={{ width: pct + "%" }} />
                </div>
            </div>

            <div className="bg-warning/8 border border-warning/30 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                <p className="text-xs text-neutral-700 leading-relaxed">
                    Upload all required HTE documents below. Accepted formats: <span className="font-semibold text-neutral-900">PDF, DOCX, JPG, PNG</span> · Max size: <span className="font-semibold text-neutral-900">10 MB</span>.
                    Slots marked <span className="font-semibold text-neutral-900">Not Required</span> have been deactivated by your coordinator and do not count toward completion.
                </p>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 border-b border-neutral-200 bg-neutral-800 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2"><Building2 className="h-4 w-4" />HTE Documents</h2>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-white/90 font-semibold">{uploaded} / {total} uploaded</span>
                </div>
                <div className="divide-y divide-neutral-100">
                    {fields.map(function(field, idx) {
                        var rec    = student.uploads[field.id];
                        var status = resolveStatus(field, rec);
                        return <HTEDocRow key={field.id} index={idx + 1} field={field} rec={rec} status={status} onUpload={onUpload} />;
                    })}
                </div>
            </div>
        </div>
    );
}

// Mirrors OJTDocRow — students can upload/replace active HTE slots
function HTEDocRow(props) {
    var index    = props.index;
    var field    = props.field;
    var rec      = props.rec;
    var status   = props.status;
    var onUpload = props.onUpload;

    var fileInputRef = React.useRef(null);
    var exp = React.useState(false); var expanded = exp[0]; var setExpanded = exp[1];

    var cfg           = STATUS_CONFIG[status];
    var StatusIcon    = cfg.icon;
    var isUploaded    = status === "uploaded";
    var isNotRequired = status === "not_required";

    function handleFileChange(e) { var file = e.target.files[0]; if (!file) return; onUpload(field.id, file); e.target.value = ""; }

    return (
        <div className={"transition-colors " + (isNotRequired ? "opacity-60 bg-neutral-50/60" : "hover:bg-neutral-50")}>
            <div className="flex items-center gap-3 px-5 py-4">
                <span className="text-xs font-bold text-neutral-300 w-5 text-right flex-shrink-0 tabular-nums">{index}</span>
                <div className={"h-9 w-9 rounded-lg border flex items-center justify-center flex-shrink-0 " + cfg.wrapper}><StatusIcon className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 truncate">{field.name}</p>
                    {isUploaded && rec && rec.uploadedAt ? (
                        <p className="text-xs text-neutral-500 mt-0.5">
                            Uploaded {formatTimestamp(rec.uploadedAt)}{rec.file ? " · " + formatFileSize(rec.file.size) : ""} · by {rec.uploadedBy === "coordinator" ? "Coordinator" : "You"}
                        </p>
                    ) : isNotRequired ? (
                        <p className="text-xs text-neutral-400 mt-0.5">Deactivated by coordinator — not counted toward completion</p>
                    ) : (
                        <p className="text-xs text-neutral-400 mt-0.5">PDF, DOCX, JPG, PNG · max 10 MB</p>
                    )}
                </div>
                <span className={"text-xs px-2.5 py-1 rounded-full border font-semibold flex-shrink-0 " + cfg.badge}>{cfg.text}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isUploaded && (
                        <button title={expanded ? "Hide details" : "View details"} onClick={function() { setExpanded(function(p) { return !p; }); }} className={btnIconGhost}>
                            <Eye className="h-3.5 w-3.5" />
                        </button>
                    )}
                    {!isNotRequired && (
                        <React.Fragment>
                            <input ref={fileInputRef} type="file" accept={ACCEPTED_EXTENSIONS.join(",")} onChange={handleFileChange} className="hidden" />
                            <button onClick={function() { if (fileInputRef.current) fileInputRef.current.click(); }} className={isUploaded ? btnSmSecondary : btnSmDefault}>
                                {isUploaded ? <RefreshCw className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
                                <span>{isUploaded ? "Replace" : "Upload"}</span>
                            </button>
                        </React.Fragment>
                    )}
                </div>
            </div>
            {expanded && isUploaded && rec && (
                <div className="mx-5 mb-4 p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3">File Details</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div><p className="text-neutral-400 mb-0.5">File name</p><p className="font-semibold text-neutral-900 truncate">{rec.file ? rec.file.name : "—"}</p></div>
                        <div><p className="text-neutral-400 mb-0.5">File size</p><p className="font-semibold text-neutral-900">{rec.file ? formatFileSize(rec.file.size) : "—"}</p></div>
                        <div><p className="text-neutral-400 mb-0.5">Uploaded at</p><p className="font-semibold text-neutral-900">{formatTimestamp(rec.uploadedAt)}</p></div>
                        <div><p className="text-neutral-400 mb-0.5">Uploaded by</p><p className="font-semibold text-neutral-900">{rec.uploadedBy === "coordinator" ? "Coordinator" : "You (Student)"}</p></div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Guidelines Page
// ─────────────────────────────────────────────────────────────────────────────
function GuidelinesPage() {
    var sections = [
        { accent: "bg-primary-500", icon: <FileText className="h-4 w-4 text-primary-500" />, title: "Required OJT Documents (13 fields)", items: ["Curriculum Vitae","Certificate of Registration (COR)","OJT Seminar Certificate","Received Copy of the OJT Recommendation Letter","OJT Waiver","Training Agreement","Job Description","Attendance Record","OJT Progress Report","Job Proficiency Rating / Evaluation Sheet","OJT Certificate","Narrative Report","Pictures with Captions"] },
        { accent: "bg-warning",     icon: <Upload className="h-4 w-4 text-warning" />,       title: "Upload Rules", items: ["Accepted formats: PDF, DOCX, JPG, JPEG, PNG only","Maximum file size: 10 MB per document","You may replace a previously uploaded document at any time","Upload timestamp and your identity are recorded automatically","Unsupported formats or oversized files will be rejected with an error"] },
        { accent: "bg-neutral-400", icon: <Building2 className="h-4 w-4 text-neutral-500" />,title: "HTE Documents", items: ["Company Profile and Company Evaluation are required HTE documents","Upload them just like OJT documents — PDF, DOCX, JPG, PNG up to 10 MB","Both students and coordinators may upload to HTE slots"] },
        {
            accent: "bg-neutral-300", icon: <MinusCircle className="h-4 w-4 text-neutral-400" />, title: "Document Statuses",
            items: [
                "Uploaded — File successfully submitted and on record",
                "Pending — No file yet; upload required to count toward 100%",
                "Not Required — Field deactivated by your coordinator; visible but excluded from completion calculation",
            ],
        },
    ];
    return (
        <div className="w-full space-y-5">
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center flex-shrink-0"><Info className="h-5 w-5 text-primary-500" /></div>
                <div>
                    <h2 className="text-base font-bold text-neutral-900">Submission Guidelines</h2>
                    <p className="text-xs text-neutral-500 mt-0.5">Read carefully before uploading your documents</p>
                </div>
            </div>
            {sections.map(function(sec, i) {
                return (
                    <div key={i} className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                        <div className={"h-1 " + sec.accent} />
                        <div className="p-5">
                            <div className="flex items-center gap-2 mb-3">{sec.icon}<h3 className="text-sm font-bold text-neutral-900">{sec.title}</h3></div>
                            <ul className="space-y-2">
                                {sec.items.map(function(item, j) {
                                    return <li key={j} className="flex items-start gap-2.5 text-sm text-neutral-600"><span className="h-1.5 w-1.5 rounded-full bg-neutral-300 flex-shrink-0 mt-[7px]" />{item}</li>;
                                })}
                            </ul>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Change Password Modal
// ─────────────────────────────────────────────────────────────────────────────
function ChangePasswordModal(props) {
    var studentEmail = props.studentEmail;
    var studentName = props.studentName;
    var onClose = props.onClose;

    // Steps: "otp" → "password" → "done"
    var stepState = React.useState("otp"); var step = stepState[0]; var setStep = stepState[1];
    var otpState = React.useState(""); var otp = otpState[0]; var setOtp = otpState[1];
    var passwordState = React.useState(""); var password = passwordState[0]; var setPassword = passwordState[1];
    var confirmState = React.useState(""); var confirmPassword = confirmState[0]; var setConfirmPassword = confirmState[1];
    var loadingState = React.useState(false); var loading = loadingState[0]; var setLoading = loadingState[1];
    var errorState = React.useState(""); var error = errorState[0]; var setError = errorState[1];
    var successState = React.useState(""); var success = successState[0]; var setSuccess = successState[1];
    var otpSentState = React.useState(false); var otpSent = otpSentState[0]; var setOtpSent = otpSentState[1];
    var showPwState = React.useState(false); var showPw = showPwState[0]; var setShowPw = showPwState[1];
    var showCpwState = React.useState(false); var showCpw = showCpwState[0]; var setShowCpw = showCpwState[1];
    var cooldownState = React.useState(0); var cooldown = cooldownState[0]; var setCooldown = cooldownState[1];

    React.useEffect(function () {
        if (cooldown <= 0) return;
        var timer = setTimeout(function () { setCooldown(function (c) { return c - 1; }); }, 1000);
        return function () { clearTimeout(timer); };
    }, [cooldown]);

    async function handleSendOtp() {
        setLoading(true);
        setError("");
        try {
            var res = await supabase.functions.invoke("send-student-otp", {
                body: { student_email: studentEmail, student_name: studentName }
            });
            if (res.error) throw new Error(res.error.message || "Failed to send OTP");
            if (res.data && res.data.error) throw new Error(res.data.error);
            setOtpSent(true);
            setCooldown(60);
            setSuccess("OTP sent to " + studentEmail);
            setTimeout(function () { setSuccess(""); }, 3000);
        } catch (err) {
            setError(err.message || "Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function handleVerifyOtp() {
        if (!otp || otp.length !== 6) { setError("Please enter a valid 6-digit OTP."); return; }
        setLoading(true);
        setError("");
        try {
            var res = await supabase.functions.invoke("update-student-password", {
                body: { student_email: studentEmail, otp: otp }
            });
            if (res.error) throw new Error(res.error.message || "Failed to verify OTP");
            if (res.data && res.data.error) throw new Error(res.data.error);
            setStep("password");
        } catch (err) {
            setError(err.message || "Invalid or expired OTP.");
        } finally {
            setLoading(false);
        }
    }

    async function handleSavePassword() {
        if (!password || password.length < 6) { setError("Password must be at least 6 characters."); return; }
        if (password !== confirmPassword) { setError("Passwords do not match."); return; }
        setLoading(true);
        setError("");
        try {
            var res = await supabase.functions.invoke("update-student-password", {
                body: { student_email: studentEmail, otp: otp, new_password: password }
            });
            if (res.error) throw new Error(res.error.message || "Failed to update password");
            if (res.data && res.data.error) throw new Error(res.data.error);
            setStep("done");
            setSuccess("Password changed successfully!");
        } catch (err) {
            setError(err.message || "Failed to update password.");
        } finally {
            setLoading(false);
        }
    }

    function handleOtpInput(e) {
        var val = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
        setOtp(val);
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={function (e) { if (e.target === e.currentTarget && step !== "done") onClose(); }}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-primary px-6 py-5 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
                        <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-bold text-white">Change Password</h2>
                        <p className="text-xs text-white/70 mt-0.5">
                            {step === "otp" ? "Verify your identity with OTP" : step === "password" ? "Set your new password" : "All done!"}
                        </p>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer">
                        <X className="h-4 w-4 text-white" />
                    </button>
                </div>

                {/* Step indicators */}
                <div className="px-6 pt-4 pb-2 flex items-center gap-2">
                    <div className={"flex items-center gap-1.5 text-xs font-semibold " + (step === "otp" ? "text-primary-600" : "text-success")}>
                        <div className={"h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold " + (step === "otp" ? "bg-primary-500 text-white" : "bg-success text-white")}>
                            {step === "otp" ? "1" : "✓"}
                        </div>
                        <span>Verify</span>
                    </div>
                    <div className={"flex-1 h-px " + (step !== "otp" ? "bg-success" : "bg-neutral-200")} />
                    <div className={"flex items-center gap-1.5 text-xs font-semibold " + (step === "password" ? "text-primary-600" : step === "done" ? "text-success" : "text-neutral-400")}>
                        <div className={"h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold " + (step === "password" ? "bg-primary-500 text-white" : step === "done" ? "bg-success text-white" : "bg-neutral-200 text-neutral-500")}>
                            {step === "done" ? "✓" : "2"}
                        </div>
                        <span>Reset</span>
                    </div>
                </div>

                <div className="px-6 py-4 space-y-4">
                    {error && (
                        <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl">
                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-red-700 leading-relaxed">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="flex items-start gap-2.5 p-3 bg-green-50 border border-green-200 rounded-xl">
                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-green-700 leading-relaxed">{success}</p>
                        </div>
                    )}

                    {step === "otp" && (
                        <React.Fragment>
                            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3">
                                <div className="flex items-center gap-2 text-xs text-neutral-600">
                                    <Mail className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
                                    <span>OTP will be sent to: <strong className="text-neutral-900">{studentEmail}</strong></span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Enter OTP Code</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={handleOtpInput}
                                    placeholder="Enter 6-digit code"
                                    maxLength={6}
                                    className="w-full h-11 px-4 text-center text-lg font-bold tracking-[0.5em] rounded-xl border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 placeholder:text-sm placeholder:tracking-normal outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                                    disabled={loading}
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSendOtp}
                                    disabled={loading || cooldown > 0}
                                    className={btnSmDefault + " flex-1 h-10 !text-sm"}
                                >
                                    {loading && !otpSent ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                                    <span>{cooldown > 0 ? "Resend in " + cooldown + "s" : otpSent ? "Resend OTP" : "Send OTP"}</span>
                                </button>
                                <button
                                    onClick={handleVerifyOtp}
                                    disabled={loading || otp.length !== 6}
                                    className={btnSmDefault + " flex-1 h-10 !text-sm !bg-neutral-800 !border-neutral-900 hover:!bg-neutral-700"}
                                >
                                    {loading && otpSent ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                                    <span>Submit</span>
                                </button>
                            </div>
                        </React.Fragment>
                    )}

                    {step === "password" && (
                        <React.Fragment>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                    <input
                                        type={showPw ? "text" : "password"}
                                        value={password}
                                        onChange={function (e) { setPassword(e.target.value); }}
                                        placeholder="Min. 6 characters"
                                        className="w-full h-11 pl-10 pr-10 rounded-xl border border-neutral-300 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                                        disabled={loading}
                                        autoFocus
                                    />
                                    <button type="button" onClick={function () { setShowPw(function (p) { return !p; }); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer">
                                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                    <input
                                        type={showCpw ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={function (e) { setConfirmPassword(e.target.value); }}
                                        placeholder="Re-enter password"
                                        className="w-full h-11 pl-10 pr-10 rounded-xl border border-neutral-300 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                                        disabled={loading}
                                    />
                                    <button type="button" onClick={function () { setShowCpw(function (p) { return !p; }); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer">
                                        {showCpw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            {password && confirmPassword && password !== confirmPassword && (
                                <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Passwords do not match</p>
                            )}
                            <button
                                onClick={handleSavePassword}
                                disabled={loading || !password || !confirmPassword || password !== confirmPassword}
                                className={btnSmDefault + " w-full h-10 !text-sm"}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                <span>Save New Password</span>
                            </button>
                        </React.Fragment>
                    )}

                    {step === "done" && (
                        <div className="text-center py-4">
                            <div className="h-16 w-16 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="h-8 w-8 text-success" />
                            </div>
                            <h3 className="text-base font-bold text-neutral-900 mb-1">Password Changed!</h3>
                            <p className="text-sm text-neutral-500 mb-5">Your password has been updated successfully. Use your new password next time you log in.</p>
                            <button onClick={onClose} className={btnSmDefault + " h-10 !text-sm px-8"}>
                                <span>Done</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────────────────────
function Toast(props) {
    var isError = props.type === "error";
    return (
        <div className={"pointer-events-auto flex items-stretch rounded-xl border shadow-lg overflow-hidden bg-white " + (isError ? "border-destructive-semantic/20" : "border-success/20")}>
            <div className={"w-1 flex-shrink-0 " + (isError ? "bg-destructive-semantic" : "bg-success")} />
            <div className="flex items-start gap-3 px-4 py-3.5 flex-1 min-w-0">
                <div className={"mt-0.5 flex-shrink-0 " + (isError ? "text-destructive-semantic" : "text-success")}>
                    {isError ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900">{isError ? "Upload Error" : "Success"}</p>
                    <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{props.message}</p>
                </div>
                <button onClick={props.onClose} className={btnIconGhost + " -mr-1 flex-shrink-0"}><X className="h-4 w-4" /></button>
            </div>
        </div>
    );
}
