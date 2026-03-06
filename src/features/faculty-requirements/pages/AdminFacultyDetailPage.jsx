import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Mail, Bell, RefreshCw, CheckCircle, AlertCircle,
    FileText, Download, User as UserIcon, BookOpen, Clock, AlertTriangle,
    CheckSquare, Square, ExternalLink, GraduationCap, Award
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';

import { settingsService } from '../services/AdminSettingService';
import { facultyMonitorService } from '../services/AdminFacultyMonitoringService';

export default function AdminFacultyDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [faculty, setFaculty] = useState(null);
    const [courses, setCourses] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Certificate state
    const [certificateName, setCertificateName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [facultyData, coursesData, templatesData] = await Promise.all([
                settingsService.getFacultyById(id),
                facultyMonitorService.getFacultyCourseStatus(id),
                settingsService.getTemplates()
            ]);

            setFaculty(facultyData);
            setCourses(coursesData || []);
            setTemplates(templatesData || []);
            setCertificateName(`${facultyData?.first_name || ''} ${facultyData?.last_name || ''}`.toUpperCase());
        } catch (err) {
            console.error(err);
            setError("Failed to load faculty details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

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

    const handleGenerateCertificate = async () => {
        const certificateTemplate = templates.find(t => t.system_category === 'CLEARANCE_CERTIFICATE' && t.is_active_default);

        if (!certificateTemplate) {
            setError("Active Clearance Certificate template not found in System Settings.");
            return;
        }

        setIsGenerating(true);
        try {
            // Fetch PDF bytes
            const bytes = await fetch(certificateTemplate.file_url).then(res => res.arrayBuffer());
            const pdfDoc = await PDFDocument.load(bytes);

            const pages = pdfDoc.getPages();
            const firstPage = pages[0];
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            // Stamp faculty name at coordinates
            // Default to calibrator settings or fallback
            const x = certificateTemplate.x_coord ? Number(certificateTemplate.x_coord) : 100;
            const y = certificateTemplate.y_coord ? Number(certificateTemplate.y_coord) : 300;

            firstPage.drawText(certificateName, {
                x: x,
                y: y,
                size: 24,
                font: helveticaFont,
                color: rgb(0, 107 / 255, 53 / 255), // Institutional Green
            });

            const pdfBytes = await pdfDoc.save();
            saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), `Clearance_${faculty?.last_name}_${new Date().getFullYear()}.pdf`);
            setSuccess("Certificate generated successfully!");
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error(err);
            setError("Failed to generate certificate.");
        } finally {
            setIsGenerating(false);
        }
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
                <AlertCircle className="h-12 w-12 text-rose-500" />
                <p className="text-lg font-bold">Faculty not found</p>
                <Button onClick={() => navigate('/admin-dashboard')}>Back to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 flex flex-col h-full bg-neutral-50 pb-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 px-1">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="h-10 w-10 rounded-full border border-neutral-200 bg-white shadow-sm"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
                                {faculty.first_name} {faculty.last_name}
                            </h1>
                            <Badge className={`uppercase text-[10px] font-black px-2 py-0.5 tracking-wider ${faculty.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-600'}`}>
                                {faculty.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                        <p className="text-neutral-500 text-sm font-medium">
                            {faculty.department} Department • {faculty.employment_type} • ID: {faculty.emp_id || 'N/A'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <Button
                        variant="outline"
                        className="bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 h-9 font-bold text-[10px] uppercase tracking-widest"
                    >
                        <Mail className="h-4 w-4 mr-2" /> Send Email
                    </Button>
                    <Button
                        variant="outline"
                        onClick={loadData}
                        className="bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 h-9 font-bold text-[10px] uppercase tracking-widest"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <Alert variant="destructive" className="bg-rose-50 border-rose-200 text-rose-800 shadow-sm animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                    <AlertTitle className="font-bold">Error Occurred</AlertTitle>
                    <AlertDescription className="font-medium">{error}</AlertDescription>
                </Alert>
            )}
            {success && (
                <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm animate-in fade-in slide-in-from-top-1">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <AlertTitle className="font-bold">Action Successful</AlertTitle>
                    <AlertDescription className="font-medium">{success}</AlertDescription>
                </Alert>
            )}

            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
                {/* Completion Progress */}
                <Card className="bg-white border-neutral-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 py-4">
                        <CardTitle className="text-sm font-bold text-neutral-900 uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle h="4" w="4" className="text-emerald-600" /> Submission Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-3xl font-black text-neutral-900">{stats.progress}%</p>
                                    <p className="text-[10px] uppercase font-bold text-neutral-400 mt-1">Institutional Completion Score</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-neutral-600">{stats.pending} Items Pending</p>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase">out of {stats.total} required</p>
                                </div>
                            </div>
                            <Progress value={stats.progress} className="h-2 bg-neutral-100 border border-neutral-200" />

                            {isFullyCleared ? (
                                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex items-center gap-3">
                                    <div className="h-8 w-8 bg-emerald-600 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                                        <Award className="h-5 w-5 text-white" />
                                    </div>
                                    <p className="text-xs font-bold text-emerald-800 leading-tight">Requirement Protocol Complete. Faculty is eligible for clearance.</p>
                                </div>
                            ) : (
                                <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg flex items-center gap-3">
                                    <div className="h-8 w-8 bg-amber-500 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                                        <Clock className="h-5 w-5 text-white" />
                                    </div>
                                    <p className="text-xs font-bold text-amber-800 leading-tight">Awaiting submissions for {stats.pending} requirements.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Clearance Certificate Generator */}
                <Card className={`lg:col-span-2 shadow-sm transition-all duration-300 ${isFullyCleared ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 border-emerald-800 text-white shadow-emerald-900/10' : 'bg-white border-neutral-200 text-neutral-900 grayscale'}`}>
                    <CardHeader className={`border-b border-white/10 py-4 ${isFullyCleared ? '' : 'bg-neutral-50/50 border-neutral-100'}`}>
                        <CardTitle className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${isFullyCleared ? 'text-white' : 'text-neutral-900'}`}>
                            <GraduationCap className="h-4 w-4" /> Clearance Certificate Protocol
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                            <div className="flex-1 space-y-4 w-full">
                                <div className="space-y-1.5">
                                    <Label className={`text-[10px] font-black uppercase tracking-widest pl-1 ${isFullyCleared ? 'text-emerald-100' : 'text-neutral-400'}`}>Print Name for Certificate</Label>
                                    <Input
                                        value={certificateName}
                                        onChange={(e) => setCertificateName(e.target.value.toUpperCase())}
                                        disabled={!isFullyCleared}
                                        className={`font-mono text-lg font-black border-2 transition-all h-12 ${isFullyCleared ? 'bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30' : 'bg-neutral-50 border-neutral-200 text-neutral-400'}`}
                                    />
                                    <p className={`text-[10px] font-medium italic ${isFullyCleared ? 'text-emerald-50/70' : 'text-neutral-400'}`}>
                                        * Defaults to faculty profile name. You can edit this for special prefixes/titles.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleGenerateCertificate}
                                    disabled={!isFullyCleared || isGenerating}
                                    className={`w-full py-6 text-sm font-black uppercase tracking-widest transition-all ${isFullyCleared ? 'bg-white text-emerald-700 hover:bg-emerald-50 shadow-xl' : 'bg-neutral-200 text-neutral-400'}`}
                                >
                                    {isGenerating ? (
                                        <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Stamping Document...</>
                                    ) : (
                                        <><Download className="h-4 w-4 mr-2" /> Generate Formal Certificate</>
                                    )}
                                </Button>
                            </div>

                            <div className={`w-36 h-36 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center ${isFullyCleared ? 'bg-white/10 border-white/30' : 'bg-neutral-50 border-neutral-100'}`}>
                                {isFullyCleared ? (
                                    <>
                                        <Award className="h-10 w-10 text-emerald-100 mb-2 drop-shadow-md" />
                                        <span className="text-[10px] font-extrabold uppercase leading-tight text-emerald-50">Authorized For Clearance</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="h-10 w-10 text-neutral-200 mb-2" />
                                        <span className="text-[10px] font-extrabold uppercase leading-tight text-neutral-300 italic">Not Yet Eligible</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Courses & Submissions Detailed Grid */}
            <div className="flex-1 space-y-6">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2 uppercase tracking-tight">
                        <BookOpen className="h-5 w-5 text-primary-600" /> Academic Submissions Breakdown
                    </h2>
                    <Badge variant="outline" className="bg-white text-neutral-500 font-bold px-3 py-1">
                        {courses.length} Active Courses
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {courses.map(course => (
                        <Card key={course.course_id} className="bg-white border-neutral-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
                            <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 py-3 px-4 flex-row justify-between items-center space-y-0">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-extrabold text-neutral-900 group-hover:text-primary-600 transition-colors">
                                            {course.course_code} - {course.section}
                                        </CardTitle>
                                        {!course.master_is_active && <Badge variant="destructive" className="text-[8px] h-4">Inactive</Badge>}
                                    </div>
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase truncate">{course.course_name}</p>
                                </div>
                                <div className="text-right ml-4 shrink-0">
                                    <p className="text-xs font-black text-neutral-900">{course.submitted_count}/{course.total_required}</p>
                                    <p className="text-[8px] uppercase font-bold text-neutral-400">Complete</p>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 flex flex-col">
                                <ScrollArea className="flex-1 h-[220px]">
                                    <div className="p-4 space-y-3">
                                        {course.documents && course.documents.map((doc, idx) => {
                                            const isDone = doc.status === 'APPROVED' || doc.status === 'VALIDATED' || doc.status === 'ARCHIVED';
                                            const isPending = doc.status === 'PENDING';
                                            const isMissing = !doc.submitted_at;

                                            return (
                                                <div
                                                    key={idx}
                                                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${isDone ? 'bg-emerald-50/30 border-emerald-100' : 'bg-neutral-50/30 border-neutral-200'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {isDone ? (
                                                            <CheckSquare className="h-4 w-4 text-emerald-600" />
                                                        ) : (
                                                            <Square className="h-4 w-4 text-neutral-300" />
                                                        )}
                                                        <span className={`text-xs font-bold ${isDone ? 'text-emerald-900' : 'text-neutral-700'}`}>
                                                            {doc.doc_type}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {doc.submitted_at && (
                                                            <span className="text-[9px] font-medium text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
                                                                {new Date(doc.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                            </span>
                                                        )}
                                                        <Badge className={`text-[9px] font-black tracking-widest px-1.5 py-0 shadow-none border ${isDone ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-neutral-200 border-neutral-300 text-neutral-500'}`}>
                                                            {doc.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>
                                <div className="p-3 bg-neutral-50/50 border-t border-neutral-100 mt-auto">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full bg-white h-8 text-[10px] font-bold uppercase tracking-widest text-primary-600 border-primary-200 hover:bg-primary-50"
                                        onClick={() => navigate(`/faculty-requirements/submission?instructor=${id}&course=${course.course_id}`)}
                                    >
                                        <Eye className="h-3 w-3 mr-2" /> View Detailed Logs
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Fixed ScrollArea for the implementation
function ScrollArea({ children, className }) {
    return (
        <div className={`overflow-y-auto ${className}`}>
            {children}
        </div>
    );
}
