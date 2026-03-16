import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Mail, Bell, RefreshCw, CheckCircle, AlertCircle,
    FileText, Download, User as UserIcon, BookOpen, Clock, AlertTriangle,
    CheckSquare, Square, ExternalLink, GraduationCap, Award, Eye, Search,
    FileSpreadsheet, Info, UploadCloud, Folder, MoreVertical, HardDrive,
    Lock, Unlock, Edit2, Save, X, CloudLightning, Plus
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ToastProvider, useToast } from "@/components/ui/toast/toaster";
import { supabase } from '@/lib/supabaseClient';

import { settingsService } from '../services/AdminSettingService';
import { FacultySubmissionService } from '../services/FacultySubmissionService';
import { facultyMonitorService } from '../services/AdminFacultyMonitoringService';
import { getFolderLink, ensureFolderStructure, listGDriveFiles, getGDriveFileMetadata } from '../services/gdriveSettings';

export default function AdminFacultyDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [faculty, setFaculty] = useState(null);
    const [courses, setCourses] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [docTypes, setDocTypes] = useState([]);
    const [error, setError] = useState(null);

    // Force Submission State
    const [isForceModalOpen, setIsForceModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [forceCourseId, setForceCourseId] = useState("");
    const [forceDocTypeId, setForceDocTypeId] = useState("");
    const [forceFiles, setForceFiles] = useState([]);
    const [forceRequiredDocs, setForceRequiredDocs] = useState([]);

    // GDrive Edit State
    const [isGdriveUnlocked, setIsGdriveUnlocked] = useState(false);
    const [gdriveFolderIdInput, setGdriveFolderIdInput] = useState("");
    const [isRetrievingGdrive, setIsRetrievingGdrive] = useState(false);

    // Document Viewer State
    const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);
    const [viewerFiles, setViewerFiles] = useState([]);
    const [isViewerLoading, setIsViewerLoading] = useState(false);
    const [selectedViewerFile, setSelectedViewerFile] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [shouldTrash, setShouldTrash] = useState(false);
    const [viewerCourseContext, setViewerCourseContext] = useState(null);
    const [viewerDocContext, setViewerDocContext] = useState(null);
    const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
    const [pdfViewerUrl, setPdfViewerUrl] = useState("");
    const [pdfViewerTitle, setPdfViewerTitle] = useState("");

    // Request Revision State
    const [isRevisionDialogOpen, setIsRevisionDialogOpen] = useState(false);
    const [revisionDoc, setRevisionDoc] = useState(null);
    const [revisionReason, setRevisionReason] = useState("");
    const [isSavingRevision, setIsSavingRevision] = useState(false);

    const loadData = async (options = {}) => {
        const { showToast = false } = options;
        setLoading(true);
        setError(null);
        try {
            const [facultyData, coursesData, templatesData, docTypesData] = await Promise.all([
                settingsService.getFacultyById(id),
                facultyMonitorService.getFacultyCourseStatus(id),
                settingsService.getTemplates(),
                settingsService.getDocTypes()
            ]);

            setFaculty(facultyData);
            setCourses(coursesData || []);
            setTemplates(templatesData || []);
            setDocTypes(docTypesData || []);

            if (showToast && facultyData) {
                addToast({ title: "Success", description: "Profile data updated successfully.", variant: "success" });
            }
        } catch (err) {
            console.error(err);
            const msg = "Failed to load faculty details.";
            setError(msg);
            addToast({ title: "Error", description: msg, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    useEffect(() => {
        if (forceCourseId) {
            const loadDocs = async () => {
                try {
                    const docs = await FacultySubmissionService.getRequiredDocs(forceCourseId);
                    setForceRequiredDocs(docs || []);
                } catch (e) {
                    console.error("Failed to load required docs for force submission", e);
                }
            };
            loadDocs();
        } else {
            setForceRequiredDocs([]);
        }
    }, [forceCourseId, id]);

    useEffect(() => {
        if (faculty?.gdrive_folder_id) {
            setGdriveFolderIdInput(faculty.gdrive_folder_id);
        } else {
            setGdriveFolderIdInput("");
        }
    }, [faculty]);

    const stats = useMemo(() => {
        if (!courses || courses.length === 0) return { progress: 0, pending: 0, total: 0 };
        const total = courses.reduce((acc, c) => acc + (c.total_required || 0), 0);
        const submitted = courses.reduce((acc, c) => acc + (c.submitted_count || 0), 0);
        return {
            progress: total > 0 ? Math.round((submitted / total) * 100) : 0,
            pending: total - submitted,
            total
        };
    }, [courses]);

    const isFullyCleared = stats.progress === 100;

    const handleExportExecutiveReport = () => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.setTextColor(0, 138, 69);
        doc.text('Faculty Executive Summary', 14, 25);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Institutional Submission & Monitoring System (ISAMS)`, 14, 32);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 37);

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.setFont(undefined, 'bold');
        doc.text(`Faculty: ${faculty?.first_name} ${faculty?.last_name}`, 14, 48);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text(`Department: ${faculty?.department}`, 14, 54);
        doc.text(`Status: ${isFullyCleared ? 'CLEARED' : 'PENDING'}`, 14, 59);
        doc.text(`Overall Progress: ${stats.progress}%`, 14, 64);

        const tableData = courses.map(c => [
            c.course_code,
            c.section,
            c.course_name,
            `${c.submitted_count}/${c.total_required}`,
            c.submitted_count === c.total_required ? 'Complete' : 'Pending'
        ]);

        autoTable(doc, {
            head: [['Code', 'Sec', 'Course Name', 'Submissions', 'Status']],
            body: tableData,
            startY: 72,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [0, 138, 69], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 248, 245] }
        });

        const fileName = `Executive_Report_${faculty?.last_name}_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);
        addToast({ title: "Success", description: "Executive Report generated successfully!", variant: "success" });
    };

    const handleExportPDRReport = () => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.setTextColor(218, 165, 32);
        doc.text('Professional Development Report (PDR)', 14, 25);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Institutional Submission & Monitoring System (ISAMS)`, 14, 32);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 37);

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Faculty Performance Review: ${faculty?.first_name} ${faculty?.last_name}`, 14, 48);

        const tableData = [];
        courses.forEach(course => {
            course.documents?.forEach(doc => {
                tableData.push([
                    course.course_code,
                    doc.doc_type,
                    doc.status,
                    doc.submitted_at ? new Date(doc.submitted_at).toLocaleDateString() : 'N/A',
                    (doc.status === 'APPROVED' || doc.status === 'VALIDATED') ? 'Validated' :
                        doc.status === 'REVISION_REQUESTED' ? 'Requires Attention' : ''
                ]);
            });
        });

        autoTable(doc, {
            head: [['Course', 'Requirement', 'Status', 'Submission Date', 'Review Result']],
            body: tableData,
            startY: 55,
            theme: 'striped',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [218, 165, 32], textColor: [255, 255, 255] }
        });

        const fileName = `PDR_Report_${faculty?.last_name}_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);
        addToast({ title: "Success", description: "PDR Report generated successfully!", variant: "success" });
    };

    const handleForceSubmission = async () => {
        if (!forceCourseId || !forceDocTypeId || forceFiles.length === 0) {
            addToast({ title: "Missing Fields", description: "Please select a course, document type, and at least one file.", variant: "warning" });
            return;
        }

        setIsUploading(true);
        let successCount = 0;
        let failCount = 0;
        let lateCount = 0;

        try {
            const docRules = forceRequiredDocs.find(d => d.doc_type_id.toString() === forceDocTypeId.toString());
            const allowedExts = docRules?.allowed_extensions?.map(e => e.toLowerCase().trim()) || ['.pdf', '.docx', '.xlsx', '.png', '.jpg', '.jpeg'];

            for (let i = 0; i < forceFiles.length; i++) {
                const file = forceFiles[i];
                const ext = '.' + file.name.split('.').pop().toLowerCase();

                if (!allowedExts.includes(ext)) {
                    console.warn(`Skipping file ${file.name}: Invalid extension.`);
                    failCount++;
                    continue;
                }

                try {
                    const result = await facultyMonitorService.adminUploadSubmission({
                        file,
                        facultyId: id,
                        courseId: forceCourseId,
                        docTypeId: forceDocTypeId
                    });

                    successCount++;
                    if (result && result.is_late) lateCount++;
                } catch (err) {
                    console.error(`Failed to upload ${file.name}:`, err);
                    failCount++;
                }
            }

            if (successCount > 0) {
                const lateMsg = lateCount > 0 ? ` (${lateCount} marked as late)` : "";
                addToast({ 
                    title: "Upload Complete", 
                    description: `Successfully uploaded ${successCount} of ${forceFiles.length} file(s)${lateMsg}.`,
                    variant: "success" 
                });
            }

            if (failCount > 0) {
                addToast({ 
                    title: "Upload Issues", 
                    description: `${failCount} file(s) failed or were invalid.`, 
                    variant: "destructive" 
                });
            }

            if (successCount > 0) {
                setForceFiles([]);
                setForceDocTypeId("");
                setForceCourseId("");
                loadData();
            }
        } catch (err) {
            console.error(err);
            addToast({ title: "Error", description: "An unexpected error occurred during batch upload.", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    const handleOpenDocViewer = async (doc, course) => {
        setIsDocViewerOpen(true);
        setIsViewerLoading(true);
        setViewerFiles([]);
        setSelectedViewerFile(null);
        setSelectedFiles([]);
        setViewerCourseContext(course);
        const matchedDocType = docTypes.find(dt => dt.type_name === doc.doc_type);
        setViewerDocContext({ 
            ...doc, 
            doc_type_id: doc.doc_type_id || matchedDocType?.doc_type_id 
        });

        try {
            const { data: dbSubmissions, error } = await supabase
                .from('submissions_fs')
                .select(`*, documenttypes_fs!inner(type_name)`)
                .eq('faculty_id', id)
                .eq('course_id', course.course_id)
                .eq('documenttypes_fs.type_name', doc.doc_type)
                .order('submitted_at', { ascending: false });

            if (error) throw error;

            let gdriveFiles = [];
            try {
                let customFolderId = null;
                const dbFolderSub = dbSubmissions?.find(s => s.gdrive_link && s.gdrive_link.includes('/folders/'));

                if (dbFolderSub) {
                    const match = dbFolderSub.gdrive_link.match(/folders\/([a-zA-Z0-9_-]+)/);
                    if (match) customFolderId = match[1];
                }

                if (customFolderId) {
                    gdriveFiles = await listGDriveFiles(customFolderId) || [];
                } else {
                    const rootFolderId = await getFolderLink();
                    if (rootFolderId) {
                        const { data: settings } = await supabase
                            .from('systemsettings_fs')
                            .select('setting_key, setting_value')
                            .in('setting_key', ['current_semester', 'current_academic_year']);

                        const semester = settings?.find(s => s.setting_key === 'current_semester')?.setting_value;
                        const academicYear = settings?.find(s => s.setting_key === 'current_academic_year')?.setting_value;
                        const facultyName = `${faculty.first_name || ''} ${faculty.last_name || ''}`.trim();

                        const docTypeInfo = docTypes.find(dt => dt.type_name === doc.doc_type);
                        const technicalFolder = docTypeInfo?.gdrive_folder_name || doc.doc_type;

                        const folderId = await ensureFolderStructure(rootFolderId, {
                            academicYear, semester, facultyName,
                            courseCode: course.course_code, section: course.section, docTypeName: technicalFolder
                        });

                        gdriveFiles = await listGDriveFiles(folderId) || [];
                    }
                }
            } catch (gdErr) {
                console.error("GDrive fetch error in viewer:", gdErr);
            }

            const uniqueFilesMap = new Map();

            // 1. Process literal GDrive files (Current Reality)
            if (gdriveFiles && gdriveFiles.length > 0) {
                for (const gFile of gdriveFiles) {
                    const dbMatch = dbSubmissions?.find(db => db.gdrive_file_id === gFile.id);
                    
                    if (dbMatch) {
                        uniqueFilesMap.set(gFile.id, {
                            ...dbMatch,
                            gdrive_file_id: gFile.id,
                            original_filename: gFile.name, // Literal GDrive name
                            standardized_filename: dbMatch.standardized_filename || gFile.name,
                            gdrive_web_view_link: gFile.webViewLink,
                            file_size_bytes: gFile.size || dbMatch.file_size_bytes,
                            submitted_at: dbMatch.submitted_at || gFile.createdTime
                        });
                    } else {
                        uniqueFilesMap.set(gFile.id, {
                            submission_id: gFile.id, // Fallback ID
                            gdrive_file_id: gFile.id,
                            original_filename: gFile.name,
                            standardized_filename: gFile.name,
                            submission_status: "MANUAL UPLOAD",
                            gdrive_web_view_link: gFile.webViewLink,
                            file_size_bytes: gFile.size || 0,
                            submitted_at: gFile.createdTime || new Date().toISOString()
                        });
                    }
                }
            }

            // 2. Process DB entries that aren't first-level in this folder
            const remainingDbSubs = dbSubmissions?.filter(db => !uniqueFilesMap.has(db.gdrive_file_id)) || [];
            for (const db of remainingDbSubs) {
                try {
                    if (db.gdrive_file_id) {
                        const meta = await getGDriveFileMetadata(db.gdrive_file_id);
                        if (meta && !meta.trashed) {
                            uniqueFilesMap.set(db.gdrive_file_id, {
                                ...db,
                                original_filename: meta.name,
                                submission_status: "MISPLACED/MOVED",
                                gdrive_web_view_link: meta.webViewLink,
                                submitted_at: meta.createdTime || db.submitted_at
                            });
                            continue;
                        }
                    }
                } catch (e) {
                    console.log(`[Viewer] File ${db.gdrive_file_id} not found:`, e.message);
                }

                // If truly gone or failed meta, add as missing
                uniqueFilesMap.set(db.gdrive_file_id, {
                    ...db,
                    submission_status: db.submission_status === 'REVISION_REQUESTED'
                        ? 'REVISION_REQUESTED'
                        : "FILE DELETED/MISSING"
                });
            }

            const sortedFinal = Array.from(uniqueFilesMap.values()).sort((a, b) => 
                new Date(b.submitted_at) - new Date(a.submitted_at)
            );
            setViewerFiles(sortedFinal);

            // Trigger Background Sync for REVISION_REQUESTED files
            const revisionReqIds = sortedFinal
                .filter(f => f.submission_status === 'REVISION_REQUESTED' && f.submission_id && /^\d+$/.test(String(f.submission_id)))
                .map(f => f.submission_id);
            
            if (revisionReqIds.length > 0) {
                facultyMonitorService.syncSubmissionsWithGDrive(revisionReqIds).then(count => {
                    if (count > 0) {
                        // Refresh data if anything was updated to RESUBMITTED
                        loadData();
                        handleOpenDocViewer(doc, course); 
                    }
                });
            }

            if (sortedFinal.length > 0) {
                handleSelectViewerFile(sortedFinal[0]);
            }
        } catch (err) {
            console.error("Failed to fetch document files:", err);
            addToast({ title: "Error", description: "Failed to load submitted files.", variant: "destructive" });
        } finally {
            setIsViewerLoading(false);
        }
    };

    const handleSelectViewerFile = (fileObj) => {
        setSelectedViewerFile(fileObj);
        let finalUrl = fileObj.gdrive_web_view_link || fileObj.gdrive_link;
        if (finalUrl && finalUrl.includes('drive.google.com/file/d/')) {
            finalUrl = finalUrl.replace('/view', '/preview');
            if (!finalUrl.includes('/preview')) {
                finalUrl += '/preview';
            }
        }
        setPdfViewerUrl(finalUrl);
        setPdfViewerTitle(fileObj.original_filename || "Document");
    };

    const handleRequestRevision = (doc, courseCode) => {
        setRevisionDoc({ 
            ...doc, 
            courseCode, 
            filenames: [doc.original_filename], 
            standardized_filename: doc.standardized_filename,
            course_id: doc.course_id || viewerCourseContext?.course_id,
            doc_type_id: doc.doc_type_id || viewerDocContext?.doc_type_id
        });
        setRevisionReason("");
        setIsRevisionDialogOpen(true);
    };

    const confirmRevision = async () => {
        if (!revisionReason.trim()) {
            addToast({ title: "Reason Required", description: "Please provide a revision reason.", variant: "warning" });
            return;
        }

        setIsSavingRevision(true);
        try {
            // Unified Targets: Prefer selected files if any, otherwise fallback to the single revisionDoc
            const revisionTargets = selectedFiles.length > 0 ? selectedFiles : (revisionDoc ? [revisionDoc] : []);

            if (revisionTargets.length === 0) {
                console.warn("[Revision] No files targeted for revision.");
                setIsRevisionDialogOpen(false);
                return;
            }

            // 1. Extract Submission IDs (numeric only)
            const submissionIds = revisionTargets
                .map(f => f.submission_id)
                .filter(id => id && /^\d+$/.test(String(id)));

            // 2. Extract GDrive IDs
            const gdriveFileIds = revisionTargets
                .map(f => f.gdrive_file_id)
                .filter(Boolean);

            // 3. Identify Manual Uploads (non-numeric submission_id)
            const manualUploads = revisionTargets
                .filter(f => !/^\d+$/.test(String(f.submission_id)))
                .map(f => ({
                    gdrive_file_id: f.gdrive_file_id,
                    original_filename: f.original_filename || f.filenames?.[0] || "Unknown",
                    standardized_filename: f.standardized_filename || f.original_filename
                }));

            // 4. Construct metadata for notification
            const courseDetails = viewerCourseContext
                ? `${viewerCourseContext.course_code} - ${viewerCourseContext.section}`
                : revisionDoc?.courseCode || "N/A";

            const docType = viewerDocContext?.doc_type || revisionDoc?.doc_type || "N/A";

            const filenames = revisionTargets
                .map(f => f.original_filename || f.filenames?.[0] || "N/A")
                .join(", ");

            await facultyMonitorService.requestRevision({
                submissionIds,
                gdriveFileIds,
                shouldDelete: shouldTrash,
                facultyId: id,
                reason: revisionReason,
                courseDetails,
                docType,
                filenames,
                manualUploads,
                courseId: viewerCourseContext?.course_id || revisionDoc?.course_id,
                docTypeId: viewerDocContext?.doc_type_id || revisionDoc?.doc_type_id || docTypes.find(dt => dt.type_name === (viewerDocContext?.doc_type || revisionDoc?.doc_type))?.doc_type_id
            });

            // Count is exactly the set of targets processed
            const totalFileCount = revisionTargets.length;
            addToast({
                title: "Revision Requested",
                description: `Faculty notified for ${totalFileCount} file(s): ${filenames.length > 30 ? filenames.substring(0, 30) + '...' : filenames}`,
                variant: "success"
            });

            setIsRevisionDialogOpen(false);
            setSelectedFiles([]);
            loadData();
            if (isDocViewerOpen && viewerDocContext && viewerCourseContext) {
                handleOpenDocViewer(viewerDocContext, viewerCourseContext);
            }
        } catch (err) {
            console.error("[Revision Error]", err);
            addToast({ title: "Error", description: "Failed to request revision.", variant: "destructive" });
        } finally {
            setIsSavingRevision(false);
        }
    };

    const handleSaveGdriveId = async () => {
        if (!gdriveFolderIdInput.trim()) {
            addToast({ title: "Error", description: "Folder ID cannot be empty.", variant: "destructive" });
            return;
        }

        let targetId = gdriveFolderIdInput.trim();
        if (targetId.includes('drive.google.com')) {
            const match = targetId.match(/folders\/([a-zA-Z0-9_-]+)/);
            if (match) {
                targetId = match[1];
            } else {
                addToast({ title: "Invalid Link", description: "Could not extract folder ID from the link provided.", variant: "destructive" });
                return;
            }
        }
        try {
            await settingsService.updateFacultyManagement(id, 'gdrive_folder_id', targetId || null);
            setFaculty({ ...faculty, gdrive_folder_id: targetId || null });
            setIsGdriveUnlocked(false);
            addToast({ title: "Success", description: "Google Drive Folder ID updated successfully.", variant: "success" });
        } catch (err) {
            console.error(err);
            addToast({ title: "Save Failed", description: "Could not update folder ID.", variant: "destructive" });
        }
    };

    const handleAutoRetrieveGdrive = async () => {
        setIsRetrievingGdrive(true);
        try {
            const rootFolderId = await getFolderLink();
            if (!rootFolderId) {
                addToast({ title: "Configuration Error", description: "Admin GDrive Root Folder is not set.", variant: "destructive" });
                return;
            }
            const { data: settings } = await supabase
                .from('systemsettings_fs')
                .select('setting_key, setting_value')
                .in('setting_key', ['current_semester', 'current_academic_year']);

            const semester = settings?.find(s => s.setting_key === 'current_semester')?.setting_value;
            const academicYear = settings?.find(s => s.setting_key === 'current_academic_year')?.setting_value;
            const facultyName = `${faculty.first_name || ''} ${faculty.last_name || ''}`.trim();

            const folderId = await ensureFolderStructure(rootFolderId, { academicYear, semester, facultyName });

            if (folderId) {
                await settingsService.updateFacultyManagement(faculty.user_id, 'gdrive_folder_id', folderId);
                setFaculty({ ...faculty, gdrive_folder_id: folderId });
                setGdriveFolderIdInput(folderId);
                setIsGdriveUnlocked(false);
                addToast({ title: "Success", description: "Google Drive Folder successfully linked!", variant: "success" });
            }
        } catch (error) {
            console.error(error);
            addToast({ title: "Failed to Retrieve Folder", description: error.message || "An unknown error occurred.", variant: "destructive" });
        } finally {
            setIsRetrievingGdrive(false);
        }
    };

    const getDocStatus = (doc) => {
        if (!doc) return 'None';
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const parseLocalDate = (dateStr) => {
            if (!dateStr) return null;
            const [y, m, d] = dateStr.split("-").map(Number);
            return new Date(y, m - 1, d);
        };

        const issueDate = parseLocalDate(doc.issue_date);
        const dueDate = parseLocalDate(doc.deadline_date);
        const hardCutoff = dueDate ? new Date(dueDate) : null;
        if (hardCutoff) {
            hardCutoff.setDate(hardCutoff.getDate() + (doc.grace_period_days || 0));
        }

        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);

        if (!dueDate) return 'No Deadline';
        if (todayStart < issueDate) return 'Upcoming';
        if (todayStart > hardCutoff) return 'Passed';
        if (todayStart > dueDate) return 'Grace Period';
        return 'Active';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <RefreshCw className="h-10 w-10 text-primary-600 animate-spin" />
                <p className="font-bold text-neutral-400 uppercase tracking-widest text-xs">Loading Faculty Profile...</p>
            </div>
        );
    }

    if (!faculty) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="text-lg font-bold">Faculty not found</p>
                <Button onClick={() => navigate('/admin-dashboard')}>Back to Dashboard</Button>
            </div>
        );
    }

    return (
        <ToastProvider>
            <div className="space-y-6 flex flex-col h-full bg-neutral-50/30">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="h-9 w-9 rounded-md border-neutral-200 shadow-sm text-neutral-500 hover:text-neutral-900 shrink-0"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
                                    {faculty.first_name} {faculty.last_name}
                                </h1>
                                <Badge className={`uppercase text-[9px] font-black px-2 py-0.5 tracking-wider shadow-none ${faculty.is_active ? 'bg-success/10 text-success border-success/20' : 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>
                                    {faculty.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <div className="flex items-center text-neutral-500 text-xs font-medium gap-3 mt-1">
                                <span>{faculty.department} Department</span>
                                <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
                                <span>{faculty.employment_type}</span>
                                <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
                                <span className="font-mono">ID: {faculty.emp_id || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadData({ showToast: true })}
                            disabled={loading}
                            className="bg-primary-500 border-primary-500 text-neutral-50 hover:bg-primary-600 hover:text-neutral-50 shadow-sm text-xs font-bold"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh Faculty
                        </Button>
                        {faculty.gdrive_folder_id && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`https://drive.google.com/drive/folders/${faculty.gdrive_folder_id}`, '_blank')}
                                className="h-8 px-3 bg-white border-neutral-200 text-neutral-700 hover:text-primary-600 shadow-sm font-bold text-xs transition-all"
                            >
                                <Folder className="h-4 w-4 mr-2 text-primary-500" />
                                Drive Folder
                            </Button>
                        )}
                    </div>
                </div>

                {/* Top Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">

                    {/* Completion Progress */}
                    <Card className="bg-white border-neutral-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                        <CardContent className="p-5 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Completion Rate</p>
                                    <p className="text-3xl font-black text-neutral-900 tracking-tight">{stats.progress}%</p>
                                    <p className="text-[10px] text-neutral-400 mt-1 font-bold uppercase tracking-wider">{stats.pending} pending of {stats.total}</p>
                                </div>
                                <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-100">
                                    <CheckCircle className="h-5 w-5 text-success" />
                                </div>
                            </div>
                            <div className="mt-auto pt-2">
                                <Progress value={stats.progress} className="h-1.5 bg-neutral-100 border border-neutral-200/50" indicatorClassName={isFullyCleared ? 'bg-success' : 'bg-primary-500'} />
                                <p className={`text-[10px] font-bold mt-3 text-center uppercase tracking-widest ${isFullyCleared ? 'text-success' : 'text-warning'}`}>
                                    {isFullyCleared ? 'CLEARED FOR SEMESTER' : 'SUBMISSIONS PENDING'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* GDrive Connectivity Card */}
                    <Card className="bg-white border-neutral-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                        <CardContent className="p-5 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1 mr-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Drive Connectivity</p>
                                        {faculty?.gdrive_folder_id && (
                                            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse"></span>
                                        )}
                                    </div>

                                    {isGdriveUnlocked ? (
                                        <div className="relative mt-2">
                                            <Input
                                                autoFocus
                                                placeholder="Paste GDrive Link or ID..."
                                                value={gdriveFolderIdInput}
                                                onChange={(e) => setGdriveFolderIdInput(e.target.value)}
                                                className="bg-white border-primary-300 text-neutral-900 focus-visible:ring-primary-500 focus-visible:border-primary-500 h-8 text-[11px] font-mono pr-16 shadow-inner transition-all"
                                            />
                                            <Button
                                                size="sm"
                                                className="absolute right-1 top-1 h-6 px-2 bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-bold"
                                                onClick={handleSaveGdriveId}
                                            >
                                                Save
                                            </Button>
                                        </div>
                                    ) : (
                                        <p className="text-sm font-mono font-bold text-neutral-900 tracking-tight truncate mt-1">
                                            {faculty?.gdrive_folder_id ? faculty.gdrive_folder_id : 'NOT CONNECTED'}
                                        </p>
                                    )}
                                </div>
                                <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-100 shrink-0">
                                    <HardDrive className="h-5 w-5 text-info" />
                                </div>
                            </div>

                            <div className="mt-auto pt-4 flex gap-2 border-t border-neutral-100">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsGdriveUnlocked(!isGdriveUnlocked)}
                                    className={`flex-1 h-8 text-[10px] font-bold uppercase tracking-widest text-neutral-500 bg-neutral-50 transition-colors ${isGdriveUnlocked
                                        ? 'hover:text-destructive hover:bg-destructive/10'
                                        : 'hover:text-primary-600 hover:bg-primary-50'
                                        }`}
                                >
                                    {isGdriveUnlocked ? 'Cancel' : (faculty?.gdrive_folder_id ? 'Modify Link' : 'Add Link')}
                                </Button>
                                {!faculty?.gdrive_folder_id && (
                                    <Button
                                        size="sm"
                                        onClick={handleAutoRetrieveGdrive}
                                        disabled={isRetrievingGdrive}
                                        className="flex-1 h-8 text-[10px] font-bold uppercase tracking-widest bg-info hover:bg-info/90 text-white"
                                    >
                                        {isRetrievingGdrive ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Auto-Link'}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Faculty Reporting Tools */}
                    <Card className="bg-white border-neutral-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                        <CardContent className="p-5 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Documentation</p>
                                    <p className="text-lg font-bold text-neutral-900 tracking-tight leading-tight">Generate Official<br />Faculty Reports</p>
                                </div>
                                <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-100">
                                    <FileSpreadsheet className="h-5 w-5 text-primary-600" />
                                </div>
                            </div>
                            <div className="mt-auto flex gap-2">
                                <Button
                                    onClick={handleExportExecutiveReport}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 h-8 border-success/30 bg-success/5 text-success hover:bg-success/10 font-bold text-[10px] uppercase tracking-widest shadow-none"
                                >
                                    <FileText className="h-3 w-3 mr-1.5" /> Executive
                                </Button>
                                <Button
                                    onClick={handleExportPDRReport}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 h-8 border-warning/30 bg-warning/5 text-warning hover:bg-warning/10 font-bold text-[10px] uppercase tracking-widest shadow-none"
                                >
                                    <Bell className="h-3 w-3 mr-1.5" /> PDR
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Force Add Submission (Unified Filter/Form Style) */}
                <Card className="bg-white border-neutral-200 shadow-sm shrink-0 overflow-hidden">
                    <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-3.5 px-4">
                        <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
                            <UploadCloud className="h-4 w-4 text-primary-600" />
                            Admin Force Add Submission
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 bg-white">
                        {/* Unified Form Container */}
                        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex flex-col lg:flex-row flex-wrap gap-3 items-start lg:items-end shadow-sm">

                            <div className="flex-[1.5] space-y-1 w-full min-w-[200px]">
                                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-0.5">Course Assignment</label>
                                <Select value={forceCourseId} onValueChange={(val) => { setForceCourseId(val); setForceDocTypeId(""); }}>
                                    <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs focus:ring-primary-500/20 font-medium">
                                        <SelectValue placeholder="Choose a course..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-neutral-200">
                                        {courses.map(c => (
                                            <SelectItem key={c.course_id} value={c.course_id.toString()} className="font-medium text-xs">
                                                {c.course_code} - {c.section}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex-[1.5] space-y-1 w-full min-w-[200px]">
                                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-0.5">Document Type</label>
                                <Select value={forceDocTypeId} onValueChange={setForceDocTypeId} disabled={!forceCourseId}>
                                    <SelectTrigger className="w-full bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-xs focus:ring-primary-500/20 font-medium">
                                        <SelectValue placeholder={forceCourseId ? "Select Document..." : "Select Course First"} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-neutral-200">
                                        {forceRequiredDocs.map(doc => {
                                            const status = getDocStatus(doc);
                                            const isSubmitted = doc.is_submitted;
                                            const isLateSubmission = doc.is_submitted_late;

                                            let label = doc.type_name;
                                            if (doc.is_required === false) label += " (Optional)";

                                            let colorClass = "text-neutral-900 font-medium";
                                            let isDisabled = false;

                                            if (status === 'Upcoming') {
                                                label += " (Upcoming)";
                                                colorClass = "text-neutral-400";
                                                isDisabled = true;
                                            } else if (status === 'Passed') {
                                                if (!isSubmitted) {
                                                    label += " (Passed - Admin Override)";
                                                    colorClass = "text-neutral-500 italic";
                                                } else {
                                                    if (isLateSubmission) {
                                                        label += " (Submitted but Late & Passed)";
                                                        colorClass = "text-warning";
                                                    } else {
                                                        label += " (Submitted & Passed)";
                                                        colorClass = "text-success";
                                                    }
                                                }
                                            } else if (isSubmitted) {
                                                if (isLateSubmission) {
                                                    label += " (Submitted but Late)";
                                                    colorClass = "text-warning";
                                                } else {
                                                    label += " (Submitted)";
                                                    colorClass = "text-success";
                                                }
                                            } else if (status === 'Grace Period') {
                                                label += " (Late)";
                                                colorClass = "text-warning font-bold";
                                            }

                                            return (
                                                <SelectItem key={doc.doc_type_id} value={doc.doc_type_id.toString()} disabled={isDisabled} className={`text-xs ${colorClass}`}>
                                                    {label}
                                                </SelectItem>
                                            );
                                        })}
                                        {forceCourseId && forceRequiredDocs.length === 0 && (
                                            <div className="p-2 text-xs text-neutral-500 italic">No requirements configured</div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex-[1.5] space-y-1 w-full min-w-[200px]">
                                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-0.5">Upload Local File</label>
                                <input
                                    type="file"
                                    id="force-inline-upload"
                                    className="hidden"
                                    multiple
                                    accept={forceDocTypeId ? (forceRequiredDocs.find(d => d.doc_type_id.toString() === forceDocTypeId.toString())?.allowed_extensions?.join(',') || '.pdf,.docx,.xlsx,.png,.jpg,.jpeg') : undefined}
                                    onChange={(e) => setForceFiles(Array.from(e.target.files))}
                                />
                                <label
                                    htmlFor="force-inline-upload"
                                    className="flex items-center justify-between px-3 h-9 border border-neutral-200 bg-white shadow-sm rounded-md cursor-pointer hover:border-primary-300 transition-colors w-full"
                                >
                                    <span className="text-xs font-medium text-neutral-600 truncate mr-2">
                                        {forceFiles.length > 0
                                            ? (forceFiles.length === 1 ? forceFiles[0].name : `${forceFiles.length} files selected`)
                                            : "Select file(s)"}
                                    </span>
                                    <UploadCloud className="h-4 w-4 text-neutral-400 shrink-0" />
                                </label>
                            </div>

                            <Button
                                onClick={handleForceSubmission}
                                disabled={isUploading || !forceCourseId || !forceDocTypeId || forceFiles.length === 0}
                                className="h-9 px-5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 shrink-0"
                            >
                                {isUploading ? <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> : <Plus className="h-4 w-4 mr-1.5" />}
                                {isUploading ? 'Uploading...' : 'Confirm Upload'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Courses & Submissions Detailed Grid */}
                <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-primary-600" /> Academic Submissions Breakdown
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                        {courses.map(course => (
                            <Card key={course.course_id} className="bg-white border-neutral-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
                                <CardHeader className="bg-neutral-50/50 border-b border-neutral-200 py-3.5 px-4 flex-row justify-between items-center space-y-0">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-sm font-bold text-neutral-900 group-hover:text-primary-600 transition-colors truncate">
                                                {course.course_code} - {course.section}
                                            </CardTitle>
                                            {!course.master_is_active && <Badge variant="destructive" className="text-[8px] h-4 px-1 uppercase tracking-wider">Inactive</Badge>}
                                        </div>
                                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest truncate mt-0.5">{course.course_name}</p>
                                    </div>
                                    <div className="text-center shrink-0 bg-white border border-neutral-200 px-2 py-1 rounded-md shadow-sm mt-2">
                                        <p className="text-xs font-black text-neutral-900">Completion: {course.submitted_count} / {course.total_required}</p>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 flex-1 flex flex-col">
                                    <ScrollArea className="flex-1 h-[240px]">
                                        <div className="p-4 space-y-2">
                                            {course.documents && course.documents.map((doc, idx) => {
                                                const isDone = ['SUBMITTED', 'RESUBMITTED', 'APPROVED', 'VALIDATED', 'ARCHIVED'].includes(doc.status);
                                                const displayStatus = doc.status === 'REVISION_REQUESTED' ? 'ONGOING' :
                                                    doc.is_submitted_late ? 'LATE' :
                                                        (doc.status === 'APPROVED' || doc.status === 'VALIDATED' || doc.status === 'ARCHIVED') ? 'SUBMITTED' :
                                                            doc.status;

                                                // Minimalist List Design
                                                return (
                                                    <div key={idx} className="flex flex-col p-2.5 rounded-lg border border-neutral-100 bg-neutral-50/50 hover:bg-white hover:border-neutral-200 transition-all group/item">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <div className="flex items-center gap-2">
                                                                {isDone ? (
                                                                    <CheckSquare className="h-3.5 w-3.5 text-success" />
                                                                ) : (
                                                                    <Square className="h-3.5 w-3.5 text-neutral-300" />
                                                                )}
                                                                <span className={`text-xs font-bold truncate ${isDone ? 'text-neutral-900' : 'text-neutral-500'}`}>
                                                                    {doc.doc_type}
                                                                </span>
                                                            </div>
                                                            <Badge className={`text-[8px] font-extrabold tracking-widest px-1.5 py-0 shadow-none border uppercase ${doc.is_submitted_late ? 'bg-warning/10 border-warning/20 text-warning' :
                                                                isDone ? 'bg-success/10 border-success/20 text-success' :
                                                                    doc.status === 'REVISION_REQUESTED' ? 'bg-warning/10 border-warning/20 text-warning' :
                                                                        'bg-neutral-100 border-neutral-200 text-neutral-500'
                                                                }`}>
                                                                {doc.status === 'RESUBMITTED' ? 'SUBMITTED' : displayStatus}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                                                                {doc.submitted_at ? new Date(doc.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'NOT SUBMITTED'}
                                                            </span>

                                                            {/* Controls */}
                                                            <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                                {(doc.submitted_at || doc.status === 'VALIDATED' || doc.status === 'APPROVED' || doc.status === 'ARCHIVED' || doc.status === 'REVISION_REQUESTED' || doc.status === 'SUBMITTED') && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleOpenDocViewer(doc, course)}
                                                                        className="h-6 w-6 rounded-md text-neutral-400 hover:text-primary-600 hover:bg-primary-50"
                                                                        title="View Files"
                                                                    >
                                                                        <Eye className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                )}

                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Advanced Document Viewer Dialog */}
                <Dialog open={isDocViewerOpen} onOpenChange={setIsDocViewerOpen}>
                    <DialogContent className="max-w-[90vw] lg:max-w-7xl xl:max-w-[1400px] w-full h-[88vh] bg-white border-neutral-200 p-0 overflow-hidden flex flex-col shadow-2xl">
                        <DialogHeader className="px-5 py-4 border-b border-neutral-200 bg-neutral-50/50 shrink-0 flex flex-row items-center justify-between">
                            <div>
                                <DialogTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary-600" />
                                    {viewerCourseContext?.course_code} - {viewerDocContext?.doc_type}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-neutral-500 font-medium mt-1">
                                    Viewing all submitted files for this requirement in {viewerCourseContext?.section}.
                                </DialogDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Badge 1: Base Status (Submitted/Late) */}
                                <Badge className={`uppercase tracking-wider font-bold text-[10px] px-2 py-0.5 shadow-none border mt-5 ${viewerDocContext?.is_submitted_late ? 'bg-warning/10 text-warning border-warning/20' : 'bg-success/10 text-success border-success/20'}`}>
                                    {viewerDocContext?.is_submitted_late ? 'LATE' : 'SUBMITTED'}
                                </Badge>

                                {/* Badge 2: Revision Contextual Status */}
                                {(viewerDocContext?.status === 'REVISION_REQUESTED' || viewerDocContext?.status === 'RESUBMITTED') && (
                                    <Badge className={`uppercase tracking-wider font-bold text-[10px] px-2 py-0.5 shadow-none border mt-5 ${viewerDocContext?.status === 'REVISION_REQUESTED' ? 'bg-warning/10 text-warning border-warning/20' : 'bg-success/10 text-success border-success/20'}`}>
                                        {viewerDocContext?.status === 'REVISION_REQUESTED' ? 'REQUEST REVISION' : 'APPROVED AND SUBMITTED'}
                                    </Badge>
                                )}
                            </div>
                        </DialogHeader>

                        <div className="flex-1 flex overflow-hidden">
                            {/* Left Side: File List */}
                            <div className="w-1/3 min-w-[300px] border-r border-neutral-200 bg-neutral-50 flex flex-col">
                                <div className="p-3 border-b border-neutral-200 bg-neutral-100/50 flex justify-between items-center">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Submitted Files ({viewerFiles.length})</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                    {isViewerLoading ? (
                                        <div className="flex flex-col items-center justify-center h-full text-neutral-400 gap-2">
                                            <RefreshCw className="h-5 w-5 animate-spin" />
                                            <span className="text-xs font-medium">Loading files...</span>
                                        </div>
                                    ) : viewerFiles.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-10 px-4 bg-white rounded-xl border border-dashed border-neutral-200 text-center space-y-4 shadow-sm">
                                            <div className="bg-neutral-50 p-3 rounded-full border border-neutral-100">
                                                <Search className="h-6 w-6 text-neutral-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-neutral-900">No matched files found</p>
                                                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Ensure files are in the GDrive subfolder.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 overflow-hidden flex flex-col">
                                            <ScrollArea className="flex-1 pr-3">
                                                <div className="space-y-2.5 pb-4">
                                                    {viewerFiles.map((file) => (
                                                        <div
                                                            key={file.submission_id || file.gdrive_file_id}
                                                            className={`group relative p-3 rounded-xl border transition-all cursor-pointer flex gap-3 ${selectedViewerFile?.submission_id === (file.submission_id || file.gdrive_file_id) ? 'bg-primary-50 border-primary-300 shadow-sm' : 'bg-white border-neutral-200 hover:border-primary-200 hover:shadow-sm'}`}
                                                            onClick={() => handleSelectViewerFile(file)}
                                                        >
                                                            {file.submission_id && (
                                                                <div
                                                                    className="pt-0.5"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const isSelected = selectedFiles.some(f => f.submission_id === file.submission_id);
                                                                        if (isSelected) {
                                                                            setSelectedFiles(selectedFiles.filter(f => f.submission_id !== file.submission_id));
                                                                        } else {
                                                                            setSelectedFiles([...selectedFiles, {
                                                                                submission_id: file.submission_id,
                                                                                gdrive_file_id: file.gdrive_file_id,
                                                                                original_filename: file.original_filename,
                                                                                standardized_filename: file.standardized_filename,
                                                                                doc_type_id: file.doc_type_id || viewerDocContext?.doc_type_id
                                                                            }]);
                                                                        }
                                                                    }}
                                                                >
                                                                    <Checkbox
                                                                        checked={selectedFiles.some(f => f.submission_id === file.submission_id)}
                                                                        className="border-neutral-300 data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600 h-4 w-4 rounded"
                                                                    />
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="mb-2">
                                                                    <p className={`text-sm font-bold truncate pr-3 ${selectedViewerFile?.submission_id === (file.submission_id || file.gdrive_file_id) ? 'text-primary-900' : 'text-neutral-900'}`} title={file.original_filename}>
                                                                        {file.original_filename || "Document"}
                                                                    </p>
                                                                    <div className="flex flex-wrap gap-1.5 mt-2 min-h-[14px]">
                                                                        {/* Only show badge if the specific file is requested for revision */}
                                                                        {(file.submission_status === 'REVISION_REQUESTED' || file.status === 'REVISION_REQUESTED') && (
                                                                            <Badge className="text-[7px] font-black bg-warning/10 text-warning border-warning/20 px-1 py-0 h-3.5 shrink-0 uppercase tracking-tighter">
                                                                                Request Revision
                                                                            </Badge>
                                                                        )}
                                                                        {(file.submission_status === 'RESUBMITTED' || file.status === 'RESUBMITTED') && (
                                                                            <Badge className="text-[7px] font-black bg-success/10 text-success border-success/20 px-1 py-0 h-3.5 shrink-0 uppercase tracking-tighter">
                                                                                Approved and Submitted
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-between items-center text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock className="h-3 w-3" />
                                                                        {new Date(file.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                    </span>
                                                                    <span>{(file.file_size_bytes / 1024 / 1024).toFixed(2)} MB</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>

                                            {selectedFiles.length > 0 && (
                                                <div className="pt-4 border-t border-neutral-200 mt-auto shrink-0 animate-in slide-in-from-bottom-2 duration-300">
                                                    <Button
                                                        variant="warning"
                                                        className="w-full bg-warning hover:bg-warning/90 text-white font-bold h-10 shadow-sm border-0 flex items-center justify-center gap-2"
                                                        onClick={() => {
                                                            const filenames = selectedFiles.map(f => f.original_filename);
                                                            setRevisionDoc({
                                                                doc_type: viewerDocContext.doc_type,
                                                                courseCode: viewerCourseContext.course_code,
                                                                filenames,
                                                                course_id: viewerCourseContext.course_id,
                                                                doc_type_id: viewerDocContext.doc_type_id
                                                            });
                                                            setRevisionReason("");
                                                            setIsRevisionDialogOpen(true);
                                                        }}
                                                    >
                                                        <AlertTriangle className="h-4 w-4" />
                                                        Request Revision ({selectedFiles.length})
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Side: Embedded Preview */}
                            <div className="flex-1 bg-neutral-100 flex flex-col relative">
                                {!selectedViewerFile ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-neutral-400">
                                        <Eye className="h-12 w-12 mb-3 opacity-20 text-neutral-500" />
                                        <p className="font-bold text-sm">Select a file to preview</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="h-12 bg-white border-b border-neutral-200 flex items-center px-5 justify-between shrink-0 shadow-sm z-10">
                                            <span className="text-sm font-bold text-neutral-800 truncate pr-4">{selectedViewerFile.original_filename}</span>
                                            <a
                                                href={selectedViewerFile.gdrive_web_view_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[10px] font-bold uppercase tracking-wider text-primary-600 hover:bg-primary-50 border border-transparent hover:border-primary-100 px-3 py-1.5 flex items-center gap-1.5 rounded-md transition-all shrink-0"
                                            >
                                                Open Native <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                        <iframe
                                            src={pdfViewerUrl}
                                            className="w-full flex-1 border-0 bg-white"
                                            title="Document Preview"
                                            allow="autoplay"
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Request Revision Dialog */}
                <Dialog open={isRevisionDialogOpen} onOpenChange={setIsRevisionDialogOpen}>
                    <DialogContent className="max-w-md bg-white border-neutral-200 p-0 overflow-hidden shadow-2xl">
                        <DialogHeader className="px-5 py-4 border-b border-neutral-200 bg-neutral-50/50">
                            <DialogTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-warning" />
                                Request Document Revision
                            </DialogTitle>
                            <DialogDescription className="text-xs text-neutral-500 font-medium mt-1">
                                The faculty will be notified and the document status will be updated.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="p-5 space-y-5 bg-white">
                            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 flex items-start gap-3 shadow-inner">
                                <FileText className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-0.5">Requirement Context</p>
                                    <p className="text-sm font-bold text-neutral-900 mb-2 truncate">{revisionDoc?.courseCode} — {revisionDoc?.doc_type}</p>

                                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1 mt-3">Target Files</p>
                                    <div className="max-h-24 overflow-y-auto pr-2 custom-scrollbar bg-white border border-neutral-200 rounded-md p-2 w-full min-w-0 overflow-hidden">
                                        {revisionDoc?.filenames?.map((name, i) => (
                                            <div key={i} className="grid grid-cols-[min-content_1fr] items-center gap-2 mb-1 w-full min-w-0">
                                                <span className="w-1 h-1 rounded-full bg-warning shrink-0" />
                                                <p className="text-[11px] font-bold text-neutral-700 truncate min-w-0" title={name}>
                                                    {name}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                                 {/* File Deletion Option Removed as per USER request */}

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5">Revision Reason <span className="text-destructive">*</span></Label>
                                <Textarea
                                    placeholder="Describe what needs to be corrected or resubmitted..."
                                    value={revisionReason}
                                    onChange={e => setRevisionReason(e.target.value)}
                                    className="bg-white border-neutral-200 text-neutral-900 font-medium resize-none focus-visible:ring-primary-500 shadow-sm h-24"
                                />
                            </div>
                        </div>
                        <DialogFooter className="px-5 py-4 border-t border-neutral-200 bg-neutral-50/50 gap-2 sm:gap-3 flex-wrap sm:justify-end">
                            <Button variant="outline" onClick={() => setIsRevisionDialogOpen(false)} className="border-neutral-200 text-neutral-600 hover:bg-neutral-100 font-bold shadow-sm h-9">
                                Cancel
                            </Button>
                            <Button
                                disabled={isSavingRevision || !revisionReason.trim()}
                                className="bg-warning hover:bg-warning/90 text-white font-bold shadow-sm active:scale-95 transition-all px-5 h-9"
                                onClick={confirmRevision}
                            >
                                {isSavingRevision ? (
                                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                                ) : (
                                    <><AlertTriangle className="h-4 w-4 mr-2" /> Submit Request</>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </ToastProvider>
    );
}