import React, { useEffect, useState } from "react";
import { ShieldCheck, Monitor, Save, Database, RefreshCcw, Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import SettingRow from "../components/settings/SettingRow";
import ActionCard from "../components/settings/ActionCard";
import ImportDialog from "../components/settings/ImportDialog";
import { useLabSetting } from "../hooks/useLabSettings";
import { useGlobalSettings } from "../context/LabSettingsContext";
import { useAuth } from "../../auth/hooks/useAuth";
import { logAuditEvent } from "../utils/auditLogger";

export default function LabSettings() {
    const { user } = useAuth();
    const {
        labName, isSaving, setIsSaving, isImportDialogOpen, handleImportDialogOpenChange,
        isPreviewDialogOpen, setIsPreviewDialogOpen, selectedFileName,
        selectedFileSize, isDragActive, importFileError, previewHeaders, previewRows,
        fileInputRef, openImportDialog, formatBytes, handleBrowseFile, handleFileInputChange,
        clearSelectedFile, handleDragOver, handleDragLeave, handleDrop,
        importDialogTitle, handleDownloadTemplate, handleUpload, isImporting,
        importSuccessMessage, setImportSuccessMessage, setImportFileError,
        notificationTitle, setNotificationTitle,
        settings, toggleSetting, handleThresholdChange, handleSaveChanges
    } = useLabSetting();

    const { refreshSettings } = useGlobalSettings();

    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isReconciling, setIsReconciling] = useState(false);

    const handleSaveWrapper = async () => {
        setNotificationTitle("Settings Updated");
        await handleSaveChanges(user?.user_metadata?.full_name);
        await refreshSettings();
        setImportSuccessMessage("System protocols updated successfully");
    };

    const handleFullSystemBackup = async () => {
        setIsBackingUp(true);
        try {
            const tables = [
                'lab_settings_lm', 'laboratories_lm', 'pc_stations_lm',
                'lab_schedules_lm', 'students_lists_lm', 'student_enrollments_lm',
                'attendance_logs_lm', 'pc_maintenance_history_lm'
            ];
            const backupData = {};
            for (const table of tables) {
                const { data, error } = await supabase.from(table).select('*');
                if (error) throw error;
                backupData[table] = data;
            }

            const jsonStr = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            a.download = `MASTER_BACKUP_${labName.replace(/\s+/g, '_')}_${timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setNotificationTitle("Backup Complete");
            setImportSuccessMessage("System backup completed successfully");
            await logAuditEvent({
                labName,
                actor: user?.user_metadata?.full_name || "System",
                category: 'Settings',
                action: 'System Backup',
                description: 'Full relational JSON snapshot generated',
                severity: 'Info'
            });
        } catch (error) {
            console.error(error);
            setImportFileError("Failed to generate backup: " + error.message);
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleManualSync = async () => {
        setIsReconciling(true);
        try {
            const { error } = await supabase.rpc('auto_checkout_ended_sessions');
            if (error) throw error;
            setNotificationTitle("Sync Complete");
            setImportSuccessMessage('Room status reconciled with database triggers.');
            await logAuditEvent({
                labName,
                actor: user?.user_metadata?.full_name || "System",
                category: 'Override',
                action: 'Manual Reconcile',
                description: 'Triggered auto-checkout for all rooms',
                severity: 'Warning'
            });
        } catch (error) {
            console.error(error);
            setImportFileError('Failed to reconcile room status: ' + error.message);
        } finally {
            setIsReconciling(false);
        }
    };

    // Auto-hide notifications after 3 seconds
    useEffect(() => {
        if (importSuccessMessage || (importFileError && !isImportDialogOpen)) {
            const timer = setTimeout(() => {
                setImportSuccessMessage("");
                setImportFileError("");
                setNotificationTitle("Import Successful");
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [importSuccessMessage, importFileError, isImportDialogOpen, setImportSuccessMessage, setImportFileError, setNotificationTitle]);

    return (
        <div className="p-6 space-y-10 bg-neutral-50 min-h-screen text-neutral-900 relative">

            {(importSuccessMessage || (importFileError && !isImportDialogOpen)) && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div
                        className="absolute inset-0 bg-neutral-900/20 pointer-events-auto"
                        onClick={() => { setImportSuccessMessage(""); setImportFileError(""); }}
                    />

                    <div className="relative z-10 pointer-events-auto animate-in zoom-in-95 duration-300">
                        {importSuccessMessage && (
                            <div className="flex flex-col items-center gap-5 bg-white border-neutral-200 text-success p-10 rounded-3xl shadow-lg max-w-sm text-center">
                                <div className="bg-success p-4 rounded-full ring-8 ring-success/20 shadow-md">
                                    <CheckCircle2 size={36} className="text-white" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-neutral-900">{notificationTitle}</h3>
                                    <p className="text-xs text-neutral-600 leading-relaxed px-4">{importSuccessMessage}</p>
                                </div>
                                <Button
                                    onClick={() => setImportSuccessMessage("")}
                                    className="w-full bg-success hover:bg-success/90 text-white"
                                >
                                    Acknowledge
                                </Button>
                            </div>
                        )}

                        {importFileError && !isImportDialogOpen && (
                            <div className="flex flex-col items-center gap-5 bg-white border-neutral-200 text-destructive-semantic p-10 rounded-3xl shadow-lg max-w-sm text-center">
                                <div className="bg-destructive-semantic p-4 rounded-full ring-8 ring-destructive-semantic/20 shadow-md">
                                    <AlertCircle size={36} className="text-white" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-neutral-900">Import Fault</h3>
                                    <p className="text-xs text-neutral-600 leading-relaxed px-4">{importFileError}</p>
                                </div>
                                <Button
                                    onClick={() => setImportFileError("")}
                                    variant="destructive"
                                    className="w-full"
                                >
                                    Re-attempt
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-200 pb-6">
                <div>
                    <h1 className="text-[30px] font-bold text-neutral-900 tracking-tight">{labName} - System Settings</h1>
                    <p className="text-neutral-600 text-sm italic">Manage core attendance protocols and hardware maintenance thresholds.</p>
                </div>
                <Button onClick={handleSaveWrapper} disabled={isSaving} className="bg-primary-500 hover:bg-primary-600 text-white">
                    <Save size={16} /> <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-7 gap-8">
                <section className="xl:col-span-4 flex flex-col gap-6">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={18} className="text-primary-500" />
                        <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Attendance Protocols</h2>
                    </div>
                    <div className="grid gap-4">
                        <SettingRow
                            label="Anti-Cutting Protocol"
                            description="Enforce session locking based on official schedule."
                            checked={settings.anti_cutting}
                            onChange={() => toggleSetting("anti_cutting")}
                        >
                            <div className={`w-10 h-5 rounded-full flex items-center px-1 cursor-pointer transition-colors ${settings.anti_cutting ? 'bg-primary-500 justify-end' : 'bg-neutral-300 justify-start'}`} onClick={() => toggleSetting("anti_cutting")}>
                                <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
                            </div>
                        </SettingRow>
                        <SettingRow
                            label="Hard Capacity Enforcer"
                            description="Block Time-In if current occupancy reaches limit."
                            checked={settings.hard_capacity}
                            onChange={() => toggleSetting("hard_capacity")}
                        >
                            <div className={`w-10 h-5 rounded-full flex items-center px-1 cursor-pointer transition-colors ${settings.hard_capacity ? 'bg-primary-500 justify-end' : 'bg-neutral-300 justify-start'}`} onClick={() => toggleSetting("hard_capacity")}>
                                <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
                            </div>
                        </SettingRow>
                        <SettingRow
                            label="Automated Assignment"
                            description="Auto-assign seats based on surname rank."
                            checked={settings.auto_assignment}
                            onChange={() => toggleSetting("auto_assignment")}
                        >
                            <div className={`w-10 h-5 rounded-full flex items-center px-1 cursor-pointer transition-colors ${settings.auto_assignment ? 'bg-primary-500 justify-end' : 'bg-neutral-300 justify-start'}`} onClick={() => toggleSetting("auto_assignment")}>
                                <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
                            </div>
                        </SettingRow>
                    </div>

                    <section className="space-y-6">
                        <div className="flex items-center gap-2"><Monitor size={18} className="text-primary-500" /><h2 className=" text-sm font-bold text-neutral-900 uppercase tracking-wider">Hardware Maintenance</h2></div>
                        <div className="p-6 bg-white border border-neutral-200 rounded-xl flex flex-col gap-6 shadow-sm transition-colors">
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-neutral-900">Predictive Health Threshold</p>
                                    <p className="text-[11px] text-neutral-600 uppercase tracking-wide">Limit for PC proactive alerts.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleThresholdChange(Math.max(100, settings.maintenance_threshold - 50))}
                                    >
                                        −
                                    </Button>
                                    <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-lg px-2 py-1 shadow-sm min-w-[60px] justify-center">
                                        <span className="text-primary-500 font-black text-xs">{settings.maintenance_threshold}</span><span className="text-[10px] text-neutral-600 font-black ml-1">HRS</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleThresholdChange(settings.maintenance_threshold + 50)}
                                    >
                                        +
                                    </Button>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-neutral-200 rounded-full overflow-hidden">
                                <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${Math.min(100, (settings.maintenance_threshold / 1000) * 100)}%` }}></div>
                            </div>
                        </div>
                    </section>
                </section>

                <div className="xl:col-span-3 flex flex-col gap-8">
                    <section className="space-y-5">
                        <div className="flex items-center gap-2"><Database size={18} className="text-primary-500" /><h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Data & Audit</h2></div>
                        <div className="space-y-3">
                            <ActionCard icon={isReconciling ? Loader2 : RefreshCcw} title="Reconcile Room Status" subtitle="Force-run auto-checkout triggers." onClick={handleManualSync} />
                            <ActionCard icon={isBackingUp ? Loader2 : Database} title="Generate System Snapshot" subtitle="Full relational backup of all lab data and settings." iconColorClass="bg-primary-500/10 text-primary-500" onClick={handleFullSystemBackup} />
                        </div>
                    </section>

                    <section className="space-y-5">
                        <div className="flex items-center gap-2"><Upload size={18} className="text-primary-500" /><h2 className=" text-sm font-bold text-neutral-900 uppercase tracking-wider">Data Import</h2></div>
                        <div className="space-y-3">
                            <ActionCard icon={Upload} title="Import Classlist" subtitle="Upload CSV for students." onClick={() => openImportDialog("classlist")} />
                            <ActionCard icon={Database} title="Import Laboratory Schedule" subtitle="Upload CSV for schedules." iconColorClass="bg-primary-500/10 text-primary-500" onClick={() => openImportDialog("schedule")} />
                        </div>
                    </section>
                </div>
            </div>

            <ImportDialog
                isOpen={isImportDialogOpen}
                onOpenChange={handleImportDialogOpenChange}
                isPreviewOpen={isPreviewDialogOpen}
                onPreviewOpenChange={setIsPreviewDialogOpen}
                title={importDialogTitle}
                fileInputRef={fileInputRef}
                handleFileInputChange={handleFileInputChange}
                handleDragOver={handleDragOver}
                handleDragLeave={handleDragLeave}
                handleDrop={handleDrop}
                isDragActive={isDragActive}
                handleBrowseFile={handleBrowseFile}
                handleDownloadTemplate={handleDownloadTemplate}
                selectedFileName={selectedFileName}
                selectedFileSize={selectedFileSize}
                formatBytes={formatBytes}
                clearSelectedFile={clearSelectedFile}
                previewHeaders={previewHeaders}
                previewRows={previewRows}
                importFileError={importFileError}
                handleUpload={handleUpload}
                isImporting={isImporting}
            />
        </div>
    );
}