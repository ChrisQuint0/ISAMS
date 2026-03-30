import React, { useState, useEffect } from "react";
import { Laptop, Monitor, X, Wrench, RotateCcw, History, AlertTriangle, Clock, ShieldCheck, Loader2, AlertCircle } from "lucide-react";

import PCGridLayout from "../layouts/PCGridLayout";
import StationInspector from "../components/pc-management/StationInspector";
import BulkMaintenanceModal from "../components/pc-management/BulkMaintenanceModal";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePCManagement } from "../hooks/usePCManagement";
import { useAuth } from "../../auth/hooks/useAuth";

// GSDS Color Tokens
const GSDS_COLORS = {
    primary500: '#008A45',
    gold400: '#FFD700'
};

export default function PCManagement() {
    const labName = sessionStorage.getItem('active_lab_name') || "Lab 1";
    const displayTitle = labName.replace(/^(Computer\s*)?Lab\s/i, 'Computer Laboratory ');
    const { user } = useAuth();

    const {
        stations, maintenanceHistory, loading,
        convertToLaptop, convertToPC, flagMaintenance, clearMaintenance, resetTimers
    } = usePCManagement(labName);

    const [selectedPC, setSelectedPC] = useState(null);
    const [selectMode, setSelectMode] = useState(null);
    const [checkedPCs, setCheckedPCs] = useState([]);
    const [bulkMode, setBulkMode] = useState(null);
    const [bulkChecked, setBulkChecked] = useState([]);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);

    useEffect(() => {
        if (selectedPC) {
            const updatedPC = stations.find(s => s.id === selectedPC.id);
            if (updatedPC) setSelectedPC(updatedPC);
        }
    }, [stations, selectedPC?.id]);

    useEffect(() => {
        if (alertMessage) {
            const timer = setTimeout(() => setAlertMessage(null), 3500);
            return () => clearTimeout(timer);
        }
    }, [alertMessage]);

    const handleToggleCheck = (pcId) => {
        const targetStation = stations.find(s => s.id === pcId);
        if (!targetStation?.user) {
            setAlertMessage("Device modes can only be changed for occupied stations.");
            return;
        }
        setCheckedPCs(prev => prev.includes(pcId) ? prev.filter(id => id !== pcId) : [...prev, pcId]);
    };

    const handleBulkToggle = (pcId) => setBulkChecked(prev => prev.includes(pcId) ? prev.filter(id => id !== pcId) : [...prev, pcId]);

    const handleConvertToLaptop = async () => {
        await convertToLaptop(checkedPCs);
        setCheckedPCs([]); setSelectMode(null);
    };

    const handleConvertToPC = async () => {
        await convertToPC(checkedPCs);
        setCheckedPCs([]); setSelectMode(null);
    };

    const handleFlagMaintenance = async (pcId, note) => { await flagMaintenance([pcId], note, user?.user_metadata?.full_name); };
    const handleClearMaintenance = async (pcId) => { await clearMaintenance([pcId], user?.user_metadata?.full_name); };
    const handleResetTimer = async (pcId) => { await resetTimers([pcId]); };

    const handleBulkMaintenance = async (customNote) => {
        await flagMaintenance(bulkChecked, customNote, user?.user_metadata?.full_name);
        setBulkChecked([]); setBulkMode(null); setIsBulkModalOpen(false);
    };

    if (loading) {
        return (
            <div className="p-8 min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
                <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: '#008A45' }} />
                    <p className="font-mono text-xs uppercase tracking-widest animate-pulse" style={{ color: '#6b7280' }}>Scanning {labName} Hardware Fleet...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-neutral-100 min-h-screen text-neutral-900">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-[30px] font-bold text-neutral-900 tracking-tight" style={{ color: '#111827' }}>{displayTitle} — Station Map</h1>
                    <p className="text-neutral-600 text-sm italic">Visual Capacity & Hardware Management</p>
                </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                {!bulkMode && !selectMode && (
                    <>
                        <Button
                            onClick={() => { setBulkMode("maintenance"); setBulkChecked([]); }}
                            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest h-auto py-2 px-4"
                            style={{ backgroundColor: GSDS_COLORS.gold400, color: '#1a1a1a' }}
                        >
                            <Wrench size={12} /> Bulk Maintenance
                        </Button>
                        <Button
                            onClick={() => { setBulkMode("reset"); setBulkChecked([]); }}
                            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest h-auto py-2 px-4"
                            style={{ backgroundColor: GSDS_COLORS.primary500, color: '#ffffff' }}
                        >
                            <RotateCcw size={12} /> Bulk Reset Timers
                        </Button>
                        <div className="h-6 mx-1" style={{ borderLeft: '1px solid #e5e7eb' }} />
                        <Button
                            onClick={() => setSelectMode("laptop")}
                            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest h-auto py-2 px-4"
                            style={{ backgroundColor: GSDS_COLORS.gold400, color: '#1a1a1a' }}
                        >
                            <Laptop size={12} /> To Laptop
                        </Button>
                        <Button
                            onClick={() => setSelectMode("pc")}
                            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest h-auto py-2 px-4"
                            style={{ backgroundColor: GSDS_COLORS.primary500, color: '#ffffff' }}
                        >
                            <Monitor size={12} /> To PC
                        </Button>
                    </>
                )}

                {selectMode && (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg border" style={{
                            backgroundColor: GSDS_COLORS.gold400,
                            borderColor: GSDS_COLORS.gold400,
                            color: '#1a1a1a'
                        }}>
                            {checkedPCs.length} Selected
                        </span>
                        <Button
                            onClick={selectMode === "laptop" ? handleConvertToLaptop : handleConvertToPC}
                            disabled={checkedPCs.length === 0}
                            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest h-auto py-2 px-4"
                            style={{
                                backgroundColor: checkedPCs.length > 0 ? GSDS_COLORS.primary500 : '#d1d5db',
                                color: checkedPCs.length > 0 ? '#ffffff' : '#6b7280',
                                opacity: checkedPCs.length > 0 ? 1 : 0.6
                            }}
                        >
                            Confirm
                        </Button>
                        <Button
                            onClick={() => { setCheckedPCs([]); setSelectMode(null); }}
                            variant="outline"
                            size="icon"
                            className="h-auto p-2"
                        >
                            <X size={13} />
                        </Button>
                    </div>
                )}

                {bulkMode && (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg border" style={{
                            backgroundColor: GSDS_COLORS.gold400,
                            borderColor: GSDS_COLORS.gold400,
                            color: '#1a1a1a'
                        }}>
                            {bulkChecked.length} Selected
                        </span>
                        <Button
                            onClick={bulkMode === "maintenance" ? () => setIsBulkModalOpen(true) : async () => { await resetTimers(bulkChecked); setBulkChecked([]); setBulkMode(null); }}
                            disabled={bulkChecked.length === 0}
                            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest h-auto py-2 px-4"
                            style={{
                                backgroundColor: bulkChecked.length > 0 ? GSDS_COLORS.primary500 : '#d1d5db',
                                color: bulkChecked.length > 0 ? '#ffffff' : '#6b7280',
                                opacity: bulkChecked.length > 0 ? 1 : 0.6
                            }}
                        >
                            Confirm
                        </Button>
                        <Button
                            onClick={() => { setBulkChecked([]); setBulkMode(null); }}
                            variant="outline"
                            size="icon"
                            className="h-auto p-2"
                        >
                            <X size={13} />
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                <div className="flex-1 space-y-4 min-h-0">
                    <PCGridLayout
                        stations={stations}
                        selectedPC={selectedPC}
                        onSelectPC={setSelectedPC}
                        selectMode={!!selectMode || !!bulkMode}
                        checkedPCs={selectMode ? checkedPCs : bulkChecked}
                        onToggleCheck={selectMode ? handleToggleCheck : handleBulkToggle}
                    />
                </div>

                <div className="w-full lg:w-80 space-y-4 flex flex-col">
                    <div className="bg-white border rounded-2xl p-6 shadow-md flex-1 min-h-0 flex flex-col group relative overflow-hidden" style={{ borderColor: '#e5e7eb' }}>
                        <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2 mb-6">
                            <Monitor size={12} style={{ color: '#008A45' }} /> Station Inspector
                        </h3>
                        <StationInspector
                            selectedPC={selectedPC}
                            onFlagMaintenance={handleFlagMaintenance}
                            onClearMaintenance={handleClearMaintenance}
                            onResetTimer={handleResetTimer}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white border rounded-2xl p-5 shadow-md" style={{ borderColor: '#e5e7eb' }}>
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                    <History size={12} style={{ color: '#f59e0b' }} /> Maintenance History
                </h3>
                <div className="space-y-2 overflow-y-auto pr-1 max-h-64 relative z-10">
                    {maintenanceHistory.length === 0 ? (
                        <p className="w-full h-[250px] mt-4 flex items-center justify-center text-neutral-500 font-mono text-xs uppercase tracking-widest" style={{ color: '#9ca3af' }}>No maintenance events recorded</p>
                    ) : (
                        maintenanceHistory.map((entry) => (
                            <div key={entry.id} className="border rounded-lg p-3 transition-colors" style={{
                                backgroundColor: entry.action === "Flagged" ? 'rgba(245, 158, 11, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                                borderColor: entry.action === "Flagged" ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'
                            }}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold" style={{ color: '#111827' }}>{entry.pcId}</span>
                                        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border" style={{
                                            color: entry.action === "Flagged" ? '#f59e0b' : '#10b981',
                                            borderColor: entry.action === "Flagged" ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'
                                        }}>
                                            {entry.action === "Flagged" ? "Flagged" : "Cleared"}
                                        </span>
                                    </div>
                                    <span className="text-[9px] font-mono" style={{ color: '#6b7280' }}>{entry.time}</span>
                                </div>
                                <p className="text-[10px] truncate" style={{ color: '#4b5563' }}>{entry.note}</p>
                                <p className="text-[9px] mt-1" style={{ color: '#9ca3af' }}>{entry.date}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <BulkMaintenanceModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onConfirm={handleBulkMaintenance}
                pcCount={bulkChecked.length}
            />

            {alertMessage && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4">
                    <Alert variant="destructive" className="shadow-lg">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{alertMessage}</AlertDescription>
                    </Alert>
                </div>
            )}
        </div>
    );
}