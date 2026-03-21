import React, { useState } from "react";
import { Monitor, Laptop, User, Wrench, RotateCcw, ShieldCheck, AlertTriangle, Clock, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import StationMaintenanceModal from "./StationMaintenanceModal";

// GSDS Color Tokens
const GSDS_COLORS = {
    primary500: '#008A45',
    gold400: '#FFD700'
};

export default function StationInspector({ selectedPC, onFlagMaintenance, onClearMaintenance, onResetTimer }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!selectedPC) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4" style={{ color: '#9ca3af', opacity: 0.5 }}>
                <Monitor size={48} strokeWidth={1} />
                <p className="text-xs uppercase tracking-widest text-center">Select a station<br/>to view details</p>
            </div>
        );
    }

    const isMaintenance = selectedPC.status === "Maintenance";
    const isLaptop = selectedPC.status === "Laptop";
    
    // Formatting the numeric hours for a clean display
    const displayHours = Number(selectedPC.hours || 0).toFixed(1);
    const healthPercentage = Math.min((selectedPC.hours / 500) * 100, 100);

    const handleConfirmMaintenance = (note) => {
        onFlagMaintenance(selectedPC.id, note);
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-5 flex-1 flex flex-col h-full">
            {/* Header: Station ID & Mode */}
            <div className="flex items-center gap-4 border-b pb-4" style={{ borderColor: '#e5e7eb' }}>
                <div className="p-3 rounded-xl transition-colors duration-500" style={{
                    backgroundColor: isMaintenance ? 'rgba(245, 158, 11, 0.2)' : isLaptop ? 'rgba(255, 215, 0, 0.2)' : 'rgba(0, 138, 69, 0.2)',
                    color: isMaintenance ? '#f59e0b' : isLaptop ? GSDS_COLORS.gold400 : GSDS_COLORS.primary500
                }}>
                    {isLaptop ? <Laptop size={28} /> : <Monitor size={28} />}
                </div>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#111827' }}>{selectedPC.id}</h2>
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{
                        color: isMaintenance ? '#f59e0b' : isLaptop ? GSDS_COLORS.gold400 : GSDS_COLORS.primary500
                    }}>
                        {selectedPC.status}
                    </span>
                </div>
            </div>

            {/* User Details Section */}
            <div>
                <span className="text-[10px] uppercase tracking-widest font-black" style={{ color: '#6b7280' }}>Current Occupant</span>
                {selectedPC.user ? (
                    <div className="p-4 rounded-lg mt-1 space-y-3 shadow-sm border" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border" style={{
                                backgroundColor: isLaptop ? 'rgba(255, 215, 0, 0.2)' : 'rgba(0, 138, 69, 0.2)',
                                borderColor: isLaptop ? 'rgba(255, 215, 0, 0.3)' : 'rgba(0, 138, 69, 0.3)',
                                color: isLaptop ? GSDS_COLORS.gold400 : GSDS_COLORS.primary500
                            }}>
                                <User size={18} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-base font-bold truncate leading-tight" style={{ color: '#111827' }}>{selectedPC.user.name}</p>
                                <p className="text-[10px] font-mono tracking-wider" style={{ color: '#6b7280' }}>{selectedPC.user.studentId}</p>
                            </div>
                        </div>
                        <div className="flex gap-4 pt-1" style={{ borderTop: '1px solid #e5e7eb' }}>
                            <div className="flex items-center gap-1.5">
                                <GraduationCap size={12} style={{ color: '#9ca3af' }} />
                                <span className="text-[11px] font-medium" style={{ color: '#6b7280' }}>{selectedPC.user.section}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock size={12} style={{ color: '#9ca3af' }} />
                                <span className="text-[11px] font-medium" style={{ color: '#6b7280' }}>In: {selectedPC.user.timeIn}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 mt-1 text-xs p-3 rounded-lg border" style={{
                        backgroundColor: '#f9fafb',
                        borderColor: '#e5e7eb',
                        borderStyle: 'dashed'
                    }}>
                        <User size={14} style={{ color: '#9ca3af' }} />
                        <span style={{ color: '#9ca3af' }} className="italic">No active session detected</span>
                    </div>
                )}
            </div>

            {/* Hardware Pulse: The Health Bar */}
            <div>
                <span className="text-[10px] uppercase tracking-widest font-black" style={{ color: '#6b7280' }}>Hardware Pulse</span>
                <div className="p-3 rounded-lg mt-1 space-y-2 shadow-sm border" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
                    <div className="flex justify-between text-[10px] font-mono tracking-tighter">
                        <span className="font-bold" style={{
                            color: selectedPC.hours >= 500 ? '#ef4444' : '#3b82f6',
                            animation: selectedPC.hours >= 500 ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
                        }}>
                            {displayHours} HRS
                        </span>
                        <span style={{ color: '#9ca3af' }}>500.0 MAX</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full overflow-hidden border" style={{ backgroundColor: '#f3f4f6', borderColor: '#e5e7eb' }}>
                        <div 
                            className="h-full transition-all duration-1000 ease-out" 
                            style={{ 
                                width: `${healthPercentage}%`,
                                backgroundColor: selectedPC.hours >= 500 ? '#ef4444' : selectedPC.hours >= 400 ? '#f59e0b' : '#3b82f6',
                                boxShadow: selectedPC.hours >= 500 ? '0_0_10px_rgba(239,68,68,0.5)' : 'none'
                            }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Maintenance Description (Conditional) */}
            {isMaintenance && selectedPC.maintenanceNote && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <span className="text-[10px] uppercase tracking-widest font-black flex items-center gap-1.5" style={{ color: '#f59e0b' }}>
                        <AlertTriangle size={10} /> Maintenance Log
                    </span>
                    <div className="p-3 rounded-lg mt-1 space-y-1.5 shadow-sm border" style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.05)',
                        borderColor: 'rgba(245, 158, 11, 0.2)'
                    }}>
                        <p className="text-[11px] leading-relaxed font-medium" style={{ color: '#111827' }}>{selectedPC.maintenanceNote}</p>
                        <p className="text-[9px] font-mono uppercase tracking-wider" style={{ color: '#9ca3af' }}>Flagged: {selectedPC.maintenanceDate}</p>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="mt-auto pt-4 space-y-2">
                {isMaintenance ? (
                    <Button 
                        onClick={() => onClearMaintenance(selectedPC.id)}
                        className="w-full flex items-center justify-center gap-2 text-[11px] font-bold h-auto py-3 uppercase tracking-widest"
                        style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderColor: 'rgba(16, 185, 129, 0.3)',
                            color: '#10b981'
                        }}
                    >
                        <ShieldCheck size={14} /> Mark as Resolved
                    </Button>
                ) : (
                    <Button 
                        onClick={() => setIsModalOpen(true)}
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2 text-[11px] font-bold h-auto py-3 uppercase tracking-widest"
                    >
                        <Wrench size={14} /> Flag Maintenance
                    </Button>
                )}

                <Button 
                    onClick={() => onResetTimer(selectedPC.id)}
                    disabled={selectedPC.hours === 0}
                    className="w-full flex items-center justify-center gap-2 text-[11px] font-bold h-auto py-3 uppercase tracking-widest"
                    style={{
                        backgroundColor: selectedPC.hours > 0 ? '#f59e0b' : '#d1d5db',
                        color: selectedPC.hours > 0 ? '#1a1a1a' : '#9ca3af',
                        opacity: selectedPC.hours > 0 ? 1 : 0.6
                    }}
                >
                    <RotateCcw size={14} /> Reset Usage Hours
                </Button>
            </div>

            <StationMaintenanceModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmMaintenance}
                pcId={selectedPC.id}
            />
        </div>
    );
}