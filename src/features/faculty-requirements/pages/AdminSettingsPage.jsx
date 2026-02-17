import React, { useState } from 'react';
import {
    Save, Database, Terminal, Trash2, RefreshCw, Eye, Settings,
    Cpu, CheckCircle, AlertCircle, Play, Shield, FileText,
    Clock, Archive, AlertTriangle, HardDrive, Server, Activity,

    ChevronUp, ChevronDown, Plus, Folder, File as FileIcon, LayoutTemplate, Users, BookOpen
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

// Hook
import { useAdminSettings } from '../hooks/AdminSettingHook';

export default function AdminSettingsPage() {
    const {
        loading, processing, error, success,
        settings, queue, testResult,
        updateSetting, runTestOCR, processQueue, runBackup, refresh,
        docRequirements, addDocRequirement, updateDocRequirement, deleteDocRequirement,
        templates, addTemplate, deleteTemplate,

        facultyList, handleAddFaculty, handleToggleFacultyStatus,
        courseList, handleAddCourse, handleDeleteCourse
    } = useAdminSettings();

    const [testFile, setTestFile] = useState(null);
    const [newReq, setNewReq] = useState({ name: '', folder: '', required: true });

    // Faculty Form State
    const [newFaculty, setNewFaculty] = useState({
        first_name: '', last_name: '', email: '', department: '', employee_id: ''
    });

    // Course Form State
    const [newCourse, setNewCourse] = useState({
        code: '', name: '', department: 'CCS', semester: '1st Semester', academic_year: '2023-2024', faculty_id: ''
    });

    // -- State for General Settings --
    const [deadlineDays, setDeadlineDays] = useState(14);
    const [graceDays, setGraceDays] = useState(3);

    // -- UI STATE FOR NON-OCR SETTINGS --
    const [valRules, setValRules] = useState({
        vision: true, grading: true, consultation: true, outcomes: false
    });

    return (
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

            {/* Notifications */}
            <div className="shrink-0">
                {error && (
                    <Alert variant="destructive" className="border-red-900/50 bg-red-900/10 text-red-200">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {success && (
                    <Alert className="border-green-900/50 bg-green-900/10 text-green-200">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}
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
                                        <CardTitle className="text-base text-slate-100">Global Defaults</CardTitle>
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
                                                <Select defaultValue="3days">
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
                                                <Select defaultValue="5years">
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

                                        <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                                            <Button
                                                variant="outline"
                                                className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800"
                                            >
                                                Reset
                                            </Button>
                                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                                <Save className="mr-2 h-4 w-4" /> Save Changes
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Col: System Info */}
                            <div className="space-y-6">
                                <Card className="bg-slate-900 border-slate-800 shadow-none h-full">
                                    <CardHeader className="border-b border-slate-800 py-4">
                                        <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                                            <Server className="h-4 w-4 text-slate-400" /> System Status
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
                                            <Activity className="h-5 w-5 text-green-400" />
                                            <div>
                                                <p className="text-sm font-medium text-green-400">All Systems Operational</p>
                                                <p className="text-xs text-green-400/70">Uptime: 14 days, 2 hours</p>
                                            </div>
                                        </div>

                                        <div className="space-y-1 pt-2">
                                            <InfoRow label="Version" value="2.1.0" />
                                            <InfoRow label="Last Backup" value="Today, 02:00 AM" />
                                            <InfoRow label="DB Size" value="4.2 GB" />
                                            <InfoRow label="Users" value="49 Active" />
                                        </div>

                                        <div className="pt-4 space-y-2">
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-800"
                                                onClick={runBackup}
                                                disabled={processing}
                                            >
                                                {processing ? (
                                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <HardDrive className="mr-2 h-4 w-4 text-blue-400" />
                                                )}
                                                Run Backup
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-800"
                                            >
                                                <Terminal className="mr-2 h-4 w-4 text-slate-400" /> View Logs
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>



                    {/* TAB: COURSE MANAGEMENT */}
                    <TabsContent value="courses" className="mt-0">
                        <Card className="bg-slate-900 border-slate-800 shadow-none">
                            <CardHeader className="border-b border-slate-800 py-4">
                                <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-emerald-400" /> Course Management
                                </CardTitle>
                                <CardDescription className="text-slate-500">Manage courses and faculty assignments</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {/* Add Course Form */}
                                <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-lg space-y-4">
                                    <h3 className="text-sm font-medium text-slate-200">Add New Course</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                                        <Input
                                            placeholder="Course Code (e.g. IT101)"
                                            value={newCourse.code}
                                            onChange={e => setNewCourse({ ...newCourse, code: e.target.value })}
                                            className="bg-slate-900 border-slate-700 text-slate-200"
                                        />
                                        <Input
                                            placeholder="Course Name"
                                            value={newCourse.name}
                                            onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
                                            className="bg-slate-900 border-slate-700 text-slate-200 lg:col-span-2"
                                        />
                                        <Select
                                            value={newCourse.faculty_id}
                                            onValueChange={v => setNewCourse({ ...newCourse, faculty_id: v })}
                                        >
                                            <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200">
                                                <SelectValue placeholder="Assign Faculty" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                                {facultyList.filter(f => f.is_active).map(f => (
                                                    <SelectItem key={f.faculty_id} value={f.faculty_id}>
                                                        {f.first_name} {f.last_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select
                                            value={newCourse.semester}
                                            onValueChange={v => setNewCourse({ ...newCourse, semester: v })}
                                        >
                                            <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200">
                                                <SelectValue placeholder="Semester" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                                <SelectItem value="1st Semester">1st Sem</SelectItem>
                                                <SelectItem value="2nd Semester">2nd Sem</SelectItem>
                                                <SelectItem value="Summer">Summer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <div className="flex justify-end">
                                            <Button
                                                size="sm"
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white w-full"
                                                onClick={async () => {
                                                    if (newCourse.code && newCourse.name) {
                                                        const success = await handleAddCourse(newCourse);
                                                        if (success) setNewCourse({ code: '', name: '', department: 'CCS', semester: '1st Semester', academic_year: '2023-2024', faculty_id: '' });
                                                    }
                                                }}
                                            >
                                                <Plus className="h-4 w-4 mr-2" /> Add
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Course List */}
                                <div className="space-y-2">
                                    <div className="grid grid-cols-12 text-xs font-medium text-slate-500 px-3 pb-2 border-b border-slate-800">
                                        <div className="col-span-2">Code</div>
                                        <div className="col-span-4">Course Name</div>
                                        <div className="col-span-3">Assigned Faculty</div>
                                        <div className="col-span-2">Sem</div>
                                        <div className="col-span-1 text-right">Action</div>
                                    </div>
                                    {courseList.length === 0 ? (
                                        <div className="text-center py-8 text-slate-500">No courses found. Add one above.</div>
                                    ) : (
                                        courseList.map(c => (
                                            <div key={c.course_id} className="grid grid-cols-12 items-center p-3 text-sm bg-slate-950/30 border border-slate-800 rounded-lg hover:border-slate-700">
                                                <div className="col-span-2 font-mono text-emerald-400">{c.course_code}</div>
                                                <div className="col-span-4 text-slate-300 truncate pr-2">{c.course_name}</div>
                                                <div className="col-span-3 text-slate-400 flex items-center gap-2">
                                                    {c.faculty_name ? (
                                                        <span className="text-slate-200">{c.faculty_name}</span>
                                                    ) : (
                                                        <span className="text-slate-600 italic">Unassigned</span>
                                                    )}
                                                </div>
                                                <div className="col-span-2 text-slate-500 text-xs">{c.semester}</div>
                                                <div className="col-span-1 flex justify-end">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-slate-900"
                                                        onClick={() => handleDeleteCourse(c.course_id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB: FACULTY MANAGEMENT */}
                    <TabsContent value="faculty" className="mt-0">
                        <Card className="bg-slate-900 border-slate-800 shadow-none">
                            <CardHeader className="border-b border-slate-800 py-4">
                                <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                                    <Users className="h-4 w-4 text-blue-400" /> Faculty Management
                                </CardTitle>
                                <CardDescription className="text-slate-500">Add new faculty or deactivate accounts</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {/* Add Faculty Form */}
                                <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-lg space-y-4">
                                    <h3 className="text-sm font-medium text-slate-200">Add New Faculty</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                                        <Input
                                            placeholder="First Name"
                                            value={newFaculty.first_name}
                                            onChange={e => setNewFaculty({ ...newFaculty, first_name: e.target.value })}
                                            className="bg-slate-900 border-slate-700 text-slate-200"
                                        />
                                        <Input
                                            placeholder="Last Name"
                                            value={newFaculty.last_name}
                                            onChange={e => setNewFaculty({ ...newFaculty, last_name: e.target.value })}
                                            className="bg-slate-900 border-slate-700 text-slate-200"
                                        />
                                        <Input
                                            placeholder="Email"
                                            value={newFaculty.email}
                                            onChange={e => setNewFaculty({ ...newFaculty, email: e.target.value })}
                                            className="bg-slate-900 border-slate-700 text-slate-200"
                                        />
                                        <Input
                                            placeholder="Employee ID"
                                            value={newFaculty.employee_id}
                                            onChange={e => setNewFaculty({ ...newFaculty, employee_id: e.target.value })}
                                            className="bg-slate-900 border-slate-700 text-slate-200"
                                        />
                                        <Select
                                            value={newFaculty.department}
                                            onValueChange={v => setNewFaculty({ ...newFaculty, department: v })}
                                        >
                                            <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200">
                                                <SelectValue placeholder="Department" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                                <SelectItem value="CCS">CCS</SelectItem>
                                                <SelectItem value="CEAS">CEAS</SelectItem>
                                                <SelectItem value="CBA">CBA</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            size="sm"
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                            onClick={async () => {
                                                if (newFaculty.email && newFaculty.first_name) {
                                                    const success = await handleAddFaculty(newFaculty);
                                                    if (success) setNewFaculty({ first_name: '', last_name: '', email: '', department: '', employee_id: '' });
                                                }
                                            }}
                                        >
                                            <Plus className="h-4 w-4 mr-2" /> Add Faculty
                                        </Button>
                                    </div>
                                </div>

                                {/* Faculty List */}
                                <div className="space-y-2">
                                    <div className="grid grid-cols-12 text-xs font-medium text-slate-500 px-3 pb-2 border-b border-slate-800">
                                        <div className="col-span-3">Name</div>
                                        <div className="col-span-3">Email</div>
                                        <div className="col-span-2">Dept</div>
                                        <div className="col-span-2">Emp ID</div>
                                        <div className="col-span-2 text-right">Status</div>
                                    </div>
                                    {facultyList.map(f => (
                                        <div key={f.faculty_id} className="grid grid-cols-12 items-center p-3 text-sm bg-slate-950/30 border border-slate-800 rounded-lg hover:border-slate-700">
                                            <div className="col-span-3 font-medium text-slate-200">{f.last_name}, {f.first_name}</div>
                                            <div className="col-span-3 text-slate-400 truncate pr-2">{f.email}</div>
                                            <div className="col-span-2 text-slate-400">{f.department}</div>
                                            <div className="col-span-2 text-slate-500 font-mono text-xs">{f.employee_id || '-'}</div>
                                            <div className="col-span-2 flex justify-end">
                                                <Switch
                                                    checked={f.is_active}
                                                    onCheckedChange={() => handleToggleFacultyStatus(f.faculty_id, f.is_active)}
                                                    className="data-[state=checked]:bg-emerald-600"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB: DOCUMENT TYPES */}
                    <TabsContent value="doc_types" className="mt-0">
                        <Card className="bg-slate-900 border-slate-800 shadow-none">
                            <CardHeader className="border-b border-slate-800 py-4 flex flex-row justify-between items-center">
                                <div>
                                    <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                                        <Folder className="h-4 w-4 text-blue-400" /> Document Requirements
                                    </CardTitle>
                                    <CardDescription className="text-slate-500">Manage required submissions and their target folders</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {/* Add New Form */}
                                <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 flex flex-col md:flex-row gap-4 items-end">
                                    <div className="flex-1 space-y-2 w-full">
                                        <Label className="text-xs font-semibold text-slate-400 uppercase">Requirement Name</Label>
                                        <Input
                                            placeholder="e.g. Quarterly Report"
                                            value={newReq.name}
                                            onChange={(e) => setNewReq({ ...newReq, name: e.target.value })}
                                            className="bg-slate-900 border-slate-700 text-slate-200"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-2 w-full">
                                        <Label className="text-xs font-semibold text-slate-400 uppercase">GDrive Folder Name</Label>
                                        <Input
                                            placeholder="e.g. Reports_Q1"
                                            value={newReq.folder}
                                            onChange={(e) => setNewReq({ ...newReq, folder: e.target.value })}
                                            className="bg-slate-900 border-slate-700 text-slate-200"
                                        />
                                    </div>
                                    <div className="flex items-center h-10 pb-1">
                                        <CheckboxItem
                                            label="Required"
                                            checked={newReq.required}
                                            onChange={(c) => setNewReq({ ...newReq, required: c })}
                                        />
                                    </div>
                                    <Button
                                        className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                                        onClick={() => {
                                            if (newReq.name && newReq.folder) {
                                                addDocRequirement(newReq);
                                                setNewReq({ name: '', folder: '', required: true });
                                            }
                                        }}
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Add
                                    </Button>
                                </div>

                                {/* List */}
                                <div className="space-y-2">
                                    {docRequirements.map(req => (
                                        <div key={req.id} className="flex items-center justify-between p-3 bg-slate-950/30 border border-slate-800 rounded-lg group hover:border-slate-700 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded ${req.required ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                                                    <FileIcon className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-200 text-sm">{req.name}</p>
                                                    <p className="text-xs text-slate-500">Folder: /{req.folder}</p>
                                                </div>
                                                {req.required && <Badge variant="outline" className="text-[10px] border-blue-900 text-blue-400 ml-2">Required</Badge>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={req.is_active}
                                                    onCheckedChange={(c) => updateDocRequirement(req.id, { is_active: c })}
                                                    className="data-[state=checked]:bg-emerald-600"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-slate-800"
                                                    onClick={() => deleteDocRequirement(req.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB: TEMPLATES */}
                    <TabsContent value="templates" className="mt-0">
                        <Card className="bg-slate-900 border-slate-800 shadow-none">
                            <CardHeader className="border-b border-slate-800 py-4 flex flex-row justify-between items-center">
                                <div>
                                    <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                                        <LayoutTemplate className="h-4 w-4 text-purple-400" /> Faculty Templates
                                    </CardTitle>
                                    <CardDescription className="text-slate-500">Upload standard templates for faculty use</CardDescription>
                                </div>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="template-upload"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                addTemplate(e.target.files[0]);
                                                e.target.value = null;
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                                        onClick={() => document.getElementById('template-upload')?.click()}
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Upload Template
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {templates.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-lg">
                                        <LayoutTemplate className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        <p>No templates uploaded yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {templates.map(t => (
                                            <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/30 border border-slate-800 hover:border-slate-700">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="p-2 bg-purple-500/10 text-purple-400 rounded shrink-0">
                                                        <FileIcon className="h-5 w-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-slate-200 truncate">{t.name}</p>
                                                        <p className="text-xs text-slate-500">{t.size} • {t.updated}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-slate-800 shrink-0"
                                                    onClick={() => deleteTemplate(t.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 2: VALIDATION RULES */}
                    <TabsContent value="validation" className="mt-0">
                        <Card className="bg-slate-900 border-slate-800 shadow-none">
                            <CardHeader className="border-b border-slate-800 py-4">
                                <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-emerald-400" /> Automated Validation Criteria
                                </CardTitle>
                                <CardDescription className="text-slate-500">Define what the system checks for in submitted documents</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-8">

                                {/* Section 1 */}
                                <div>
                                    <h3 className="text-sm font-medium text-slate-200 mb-4 flex items-center">
                                        <FileText className="mr-2 h-4 w-4 text-blue-400" /> Syllabus Requirements
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-1">
                                        <CheckboxItem
                                            label='Must contain "Vision & Mission"'
                                            checked={valRules.vision}
                                            onChange={(c) => setValRules(p => ({ ...p, vision: c }))}
                                        />
                                        <CheckboxItem
                                            label='Must contain "Grading System"'
                                            checked={valRules.grading}
                                            onChange={(c) => setValRules(p => ({ ...p, grading: c }))}
                                        />
                                        <CheckboxItem
                                            label='Must contain "Consultation Hours"'
                                            checked={valRules.consultation}
                                            onChange={(c) => setValRules(p => ({ ...p, consultation: c }))}
                                        />
                                        <CheckboxItem
                                            label='Must contain "Course Outcomes"'
                                            checked={valRules.outcomes}
                                            onChange={(c) => setValRules(p => ({ ...p, outcomes: c }))}
                                        />
                                    </div>
                                </div>

                                {/* Section 2 */}
                                <div>
                                    <h3 className="text-sm font-medium text-slate-200 mb-4 flex items-center">
                                        <Archive className="mr-2 h-4 w-4 text-amber-400" /> File Constraints
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-1">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-slate-400 uppercase">Max File Size (MB)</Label>
                                            <Input
                                                type="number"
                                                defaultValue="10"
                                                className="bg-slate-950 border-slate-700 text-slate-200 focus:border-blue-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-slate-400 uppercase">Allowed Extensions</Label>
                                            <Input
                                                defaultValue=".pdf, .docx, .xlsx"
                                                className="bg-slate-950 border-slate-700 text-slate-200 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-800 flex justify-end">
                                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                        <Save className="mr-2 h-4 w-4" /> Update Rules
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 3: OCR & AI */}
                    <TabsContent value="ocr" className="mt-0 space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">

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
                                                <Label className="text-slate-200">Enable Tesseract OCR</Label>
                                                <p className="text-xs text-slate-500 mt-1">Extract text for automated validation</p>
                                            </div>
                                            <Switch
                                                checked={settings.ocr_enabled}
                                                onCheckedChange={(c) => updateSetting('ocr_enabled', c)}
                                                className="data-[state=checked]:bg-blue-600"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-slate-400 uppercase">Language Model</Label>
                                                <Input
                                                    value={settings.ocr_language || 'eng'}
                                                    onChange={(e) => updateSetting('ocr_language', e.target.value)}
                                                    className="bg-slate-950 border-slate-700 text-slate-200"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-slate-400 uppercase">Min. Confidence (%)</Label>
                                                <Input
                                                    type="number"
                                                    value={settings.ocr_confidence_threshold || 80}
                                                    onChange={(e) => updateSetting('ocr_confidence_threshold', e.target.value)}
                                                    className="bg-slate-950 border-slate-700 text-slate-200"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Test Area */}
                                <Card className="bg-slate-900 border-slate-800 shadow-none">
                                    <CardHeader className="border-b border-slate-800 py-4">
                                        <CardTitle className="text-base text-slate-100">Test Playground</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <Input
                                                type="file"
                                                onChange={(e) => setTestFile(e.target.files[0])}
                                                className="bg-slate-950 border-slate-700 text-slate-200 file:text-slate-300 file:bg-slate-800 file:border-0 file:rounded-sm file:mr-4 hover:file:bg-slate-700"
                                            />
                                            <Button
                                                onClick={() => runTestOCR(testFile)}
                                                disabled={!testFile || processing}
                                                className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                                            >
                                                {processing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                                                Run Test
                                            </Button>
                                        </div>

                                        {testResult && (
                                            <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg mt-4">
                                                <div className="flex justify-between mb-3 border-b border-slate-800 pb-2">
                                                    <div className="flex gap-4 text-xs font-mono">
                                                        <span className="text-green-400">Confidence: {testResult.confidence.toFixed(1)}%</span>
                                                        <span className="text-slate-400">Time: {testResult.processing_time_ms}ms</span>
                                                    </div>
                                                    <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-500">Raw Output</Badge>
                                                </div>
                                                <pre className="text-xs text-slate-300 font-mono overflow-auto max-h-48 whitespace-pre-wrap">
                                                    {testResult.text}
                                                </pre>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Queue Widget */}
                            <div className="lg:col-span-1">
                                <Card className="bg-slate-900 border-slate-800 shadow-none h-full flex flex-col">
                                    <CardHeader className="border-b border-slate-800 py-4 shrink-0">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-base text-slate-100">Processing Queue</CardTitle>
                                            <Badge className="bg-blue-900/30 text-blue-300 border-blue-800">
                                                {queue.length} Pending
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1 overflow-auto pt-4 relative">
                                        {queue.length === 0 ? (
                                            <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-slate-500 gap-2">
                                                <CheckCircle className="h-8 w-8 opacity-20" />
                                                <span className="text-sm">Queue is empty</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {queue.map(job => (
                                                    <div key={job.job_id} className="flex justify-between items-center text-xs p-3 border border-slate-800 rounded-lg bg-slate-950/30 hover:border-slate-700 transition-colors">
                                                        <div className="min-w-0 mr-2">
                                                            <p className="truncate font-medium text-slate-300">{job.filename}</p>
                                                            <p className="text-slate-500">ID: {job.job_id.substring(0, 8)}</p>
                                                        </div>
                                                        <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400 shrink-0">
                                                            {job.status}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="sticky bottom-0 pt-4 bg-slate-900 mt-auto">
                                            <Button
                                                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                                                size="sm"
                                                onClick={processQueue}
                                                disabled={queue.length === 0 || processing}
                                            >
                                                {processing ? 'Processing...' : 'Process Batch Now'}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* TAB 4: MAINTENANCE / DANGER ZONE */}
                    <TabsContent value="maintenance" className="mt-0">
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
                                    title="Clear Validation Queue"
                                    desc="Approve all currently pending items automatically."
                                    btnText="Auto-Approve All"
                                    onClick={() => alert("This would auto-approve all items.")}
                                />
                                <DangerRow
                                    title="Reset Semester Data"
                                    desc="Clear all submissions for the current semester. Does not delete archives."
                                    btnText="Reset Semester"
                                    onClick={() => alert("Resetting semester...")}
                                />
                                <DangerRow
                                    title="Purge Old Archives"
                                    desc="Permanently remove files older than the retention period."
                                    btnText="Purge Archives"
                                    onClick={() => alert("Purging old files...")}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs >
        </div >
    );
}

// --- Sub-components ---

const TabItem = ({ value, label, icon: Icon }) => (
    <TabsTrigger
        value={value}
        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 text-slate-400 rounded-none px-4 py-3 border-b-2 border-transparent hover:text-slate-200 transition-all"
    >
        <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span>{label}</span>
        </div>
    </TabsTrigger>
);

const InfoRow = ({ label, value }) => (
    <div className="flex justify-between text-sm py-2 border-b border-slate-800 last:border-0">
        <span className="text-slate-400">{label}</span>
        <span className="font-medium text-slate-200">{value}</span>
    </div>
);

const CheckboxItem = ({ label, checked, onChange }) => (
    <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-950/30 border border-slate-800/50 hover:border-slate-700 hover:bg-slate-950/50 transition-all cursor-pointer" onClick={() => onChange(!checked)}>
        <Checkbox
            id={label}
            checked={checked}
            onCheckedChange={onChange}
            className="border-slate-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 h-4 w-4"
        />
        <label
            htmlFor={label}
            className="text-sm font-medium leading-none text-slate-300 cursor-pointer select-none"
        >
            {label}
        </label>
    </div>
);

const DangerRow = ({ title, desc, btnText, onClick }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-red-950/20 border border-red-900/30 rounded-lg gap-4">
        <div>
            <h4 className="font-medium text-red-300 text-sm">{title}</h4>
            <p className="text-xs text-red-400/60 mt-1">{desc}</p>
        </div>
        <Button
            variant="destructive"
            onClick={onClick}
            className="bg-red-600/80 hover:bg-red-600 text-white border border-red-500/50 whitespace-nowrap"
            size="sm"
        >
            {btnText}
        </Button>
    </div>
);