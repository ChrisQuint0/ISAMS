import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

const formatShortDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export function ViolationHistoryModal({ isOpen, onClose, studentName, violations }) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col bg-white border-neutral-200 text-neutral-900 p-0 shadow-lg rounded-xl">
                <div className="px-6 py-4 border-b border-neutral-100 shrink-0">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-neutral-900 tracking-tight">
                            Violation History
                        </DialogTitle>
                        <DialogDescription className="text-neutral-500 font-medium">
                            Showing {violations.length} past violation {violations.length === 1 ? 'record' : 'records'} for <strong className="text-neutral-900">{studentName}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {violations.length === 0 ? (
                        <div className="text-center py-8 text-neutral-500 text-sm font-medium">
                            No violation records found.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {violations.map((v) => {
                                const severity = v.offense_types_sv?.severity || 'Unknown';
                                const isMajor = severity === 'Major';
                                const isMinor = severity === 'Minor';
                                const isCompliance = severity === 'Compliance';

                                let severityClass = 'bg-neutral-100 text-neutral-600';
                                if (isMajor) severityClass = 'bg-red-50 text-red-700 border border-red-200';
                                else if (isMinor) severityClass = 'bg-amber-50 text-amber-700 border border-amber-200';
                                else if (isCompliance) severityClass = 'bg-blue-50 text-blue-700 border border-blue-200';

                                let statusDotClass = 'bg-neutral-400';
                                if (v.status === 'Resolved') statusDotClass = 'bg-success';
                                else if (v.status === 'Dismissed') statusDotClass = 'bg-neutral-400';
                                else if (v.status === 'Pending') statusDotClass = 'bg-warning';
                                else if (v.status === 'Sanctioned') statusDotClass = 'bg-sanctioned';
                                else if (v.status === 'Under Investigation') statusDotClass = 'bg-info';

                                return (
                                    <div key={v.violation_id} className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 transition-colors">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="shrink-0">
                                                <ShieldAlert className={`w-4 h-4 ${isMajor ? 'text-red-500' : isMinor ? 'text-amber-500' : 'text-blue-500'}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-neutral-900 truncate">
                                                    {v.offense_types_sv?.name || 'Unknown Offense'}
                                                </p>
                                                <p className="text-xs text-neutral-500 font-medium">
                                                    {formatShortDate(v.incident_date)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${severityClass}`}>
                                                {severity}
                                            </span>
                                            <span className="flex items-center text-[11px] font-semibold text-neutral-500">
                                                <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${statusDotClass}`} />
                                                {v.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-neutral-100 bg-neutral-50 shrink-0 rounded-b-xl">
                    <div className="flex justify-end">
                        <Button type="button" variant="ghost" className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 font-bold" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
