import React, { useEffect } from "react";
import { ShieldCheck, Monitor, Save, Database, RefreshCcw, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import SettingRow from "../components/settings/SettingRow";
import ActionCard from "../components/settings/ActionCard";
import ImportDialog from "../components/settings/ImportDialog";
import { useLabSetting } from "../hooks/useLabSettings";

export default function LabSettings() {
    const {
        labName, isSaving, setIsSaving, isImportDialogOpen, handleImportDialogOpenChange,
        isPreviewDialogOpen, setIsPreviewDialogOpen, selectedFileName,
        selectedFileSize, isDragActive, importFileError, previewHeaders, previewRows,
        fileInputRef, openImportDialog, formatBytes, handleBrowseFile, handleFileInputChange,
        clearSelectedFile, handleDragOver, handleDragLeave, handleDrop,
        importDialogTitle, handleDownloadTemplate, handleUpload, isImporting,
        importSuccessMessage, setImportSuccessMessage, setImportFileError
    } = useLabSetting();

    // Auto-hide notifications after 3 seconds
    useEffect(() => {
        if (importSuccessMessage || (importFileError && !isImportDialogOpen)) {
            const timer = setTimeout(() => {
                setImportSuccessMessage("");
                setImportFileError("");
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [importSuccessMessage, importFileError, isImportDialogOpen, setImportSuccessMessage, setImportFileError]);

    return (
        <div className="p-8 space-y-10 bg-[#020617] min-h-screen text-slate-100 relative">
            
            {/* Centered Glass Notification Overlay */}
            {(importSuccessMessage || (importFileError && !isImportDialogOpen)) && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    {/* The Full Screen Frosted Glass Backdrop */}
                    <div 
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md pointer-events-auto" 
                        onClick={() => { setImportSuccessMessage(""); setImportFileError(""); }} 
                    />
                    
                    <div className="relative z-10 pointer-events-auto animate-in zoom-in-95 duration-300">
                        {importSuccessMessage && (
                            <div className="flex flex-col items-center gap-5 bg-white/[0.03] border border-white/10 text-emerald-400 p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-2xl max-w-sm text-center">
                                <div className="bg-emerald-500/20 p-4 rounded-full ring-8 ring-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                    <CheckCircle2 size={36} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-white">Import Successful</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed px-4">{importSuccessMessage}</p>
                                </div>
                                <button 
                                    onClick={() => setImportSuccessMessage("")}
                                    className="mt-2 w-full text-[10px] uppercase tracking-[0.2em] font-black px-6 py-3 bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 rounded-xl transition-all duration-300 text-white"
                                >
                                    Acknowledge
                                </button>
                            </div>
                        )}

                        {importFileError && !isImportDialogOpen && (
                            <div className="flex flex-col items-center gap-5 bg-white/[0.03] border border-white/10 text-rose-400 p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-2xl max-w-sm text-center">
                                <div className="bg-rose-500/20 p-4 rounded-full ring-8 ring-rose-500/5 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                                    <AlertCircle size={36} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-white">Import Fault</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed px-4">{importFileError}</p>
                                </div>
                                <button 
                                    onClick={() => setImportFileError("")}
                                    className="mt-2 w-full text-[10px] uppercase tracking-[0.2em] font-black px-6 py-3 bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 rounded-xl transition-all duration-300 text-white"
                                >
                                    Re-attempt
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Header section with Save button */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#1e293b] pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">{labName} - System Settings</h1>
                    <p className="text-slate-400 text-sm italic">Manage core attendance protocols and hardware maintenance thresholds.</p>
                </div>
                <button 
                    onClick={() => setIsSaving(true)} 
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2.5 px-6 rounded-lg transition-all relative overflow-hidden group/btn disabled:opacity-50"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover/btn:from-white/10 group-hover/btn:via-white/0 group-hover/btn:to-white/0 transition-all duration-500 pointer-events-none" />
                    <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                    <Save size={16} /> <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-7 gap-8 items-stretch">
                <section className="xl:col-span-4 h-full flex flex-col gap-6">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={18} className="text-sky-500" />
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Attendance Protocols</h2>
                    </div>
                    <div className="grid gap-4">
                        <SettingRow label="Anti-Cutting Protocol" description="Enforce session locking based on official schedule."><div className="w-10 h-5 bg-sky-600 rounded-full flex items-center justify-end px-1"><div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" /></div></SettingRow>
                        <SettingRow label="Hard Capacity Enforcer" description="Block Time-In if current occupancy reaches limit."><div className="w-10 h-5 bg-sky-600 rounded-full flex items-center justify-end px-1"><div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" /></div></SettingRow>
                        <SettingRow label="Automated Assignment" description="Auto-assign seats based on surname rank."><div className="w-10 h-5 bg-sky-600 rounded-full flex items-center justify-end px-1"><div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" /></div></SettingRow>
                    </div>

                    <section className="space-y-6">
                        <div className="flex items-center gap-2"><Monitor size={18} className="text-sky-500" /><h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Hardware Maintenance</h2></div>
                        <div className="p-6 bg-[#0f172a] border border-[#1e293b] rounded-xl flex flex-col gap-6 shadow-sm group relative overflow-hidden hover:border-slate-600 transition-colors">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-200">Predictive Health Threshold</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black leading-relaxed">Limit for PC proactive alerts.</p>
                                </div>
                                <div className="flex items-center gap-2 bg-[#020617] border border-[#1e293b] rounded-lg px-2 py-1 shadow-inner">
                                    <span className="text-sky-400 font-black text-xs">500</span><span className="text-[10px] text-slate-600 font-black ml-1">HRS</span>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-[#1e293b] rounded-full overflow-hidden">
                                <div className="h-full w-[80%] bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.3)]"></div>
                            </div>
                        </div>
                    </section>
                </section>

                <div className="xl:col-span-3 h-full flex flex-col gap-8">
                    <section className="space-y-5">
                        <div className="flex items-center gap-2"><Database size={18} className="text-sky-500" /><h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Data & Audit</h2></div>
                        <div className="space-y-3">
                            <ActionCard icon={RefreshCcw} title="Refresh Audit Logs" subtitle="Sync records" />
                            <ActionCard icon={Database} title="Export System Backup" subtitle="Download Backup" iconColorClass="bg-emerald-500/10 text-emerald-500" />
                        </div>
                    </section>

                    <section className="space-y-5">
                        <div className="flex items-center gap-2"><Upload size={18} className="text-sky-500" /><h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Data Import</h2></div>
                        <div className="space-y-3">
                            <ActionCard icon={Upload} title="Import Classlist" subtitle="Upload CSV for students." onClick={() => openImportDialog("classlist")} />
                            <ActionCard icon={Database} title="Import Laboratory Schedule" subtitle="Upload CSV for schedules." iconColorClass="bg-emerald-500/10 text-emerald-500" onClick={() => openImportDialog("schedule")} />
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