import React, { useState, useEffect } from "react";
import { 
    Dialog, DialogContent, DialogDescription, 
    DialogFooter, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";

export default function BulkMaintenanceModal({ isOpen, onClose, onConfirm, pcCount }) {
    const [note, setNote] = useState("");

    // Reset the input field every time the modal opens
    useEffect(() => {
        if (isOpen) setNote("");
    }, [isOpen]);

    const handleSubmit = () => {
        if (!note.trim()) return;
        onConfirm(note.trim());
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-500">
                        <Wrench size={18} /> Bulk Flag for Maintenance
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        You are about to flag <strong className="text-slate-200">{pcCount} {pcCount === 1 ? 'station' : 'stations'}</strong> for maintenance. Please provide a reason for the audit trail.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="text-slate-300">Maintenance Note / Issue</Label>
                        <Input 
                            value={note} 
                            onChange={(e) => setNote(e.target.value)} 
                            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" 
                            placeholder="e.g. Network offline, Power issues..." 
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && note.trim() && handleSubmit()}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-3 mt-2">
                    <Button 
                        variant="outline" 
                        onClick={onClose} 
                        className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={!note.trim()}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                    >
                        Confirm Flag
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}