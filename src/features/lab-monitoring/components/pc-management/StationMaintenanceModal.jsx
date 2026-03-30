import React, { useState, useEffect } from "react";
import { 
    Dialog, DialogContent, DialogDescription, 
    DialogFooter, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";

// GSDS Color Tokens
const GSDS_COLORS = {
    gold400: '#FFD700',
    warning: '#f59e0b'
};

export default function StationMaintenanceModal({ isOpen, onClose, onConfirm, pcId }) {
    const [note, setNote] = useState("");

    // Reset the input field every time the modal opens
    useEffect(() => {
        if (isOpen) setNote("");
    }, [isOpen]);

    const handleSubmit = () => {
        if (!note.trim()) return;
        onConfirm(note);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-neutral-50 border-neutral-200 text-neutral-900 sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2" style={{ color: GSDS_COLORS.warning }}>
                        <Wrench size={18} /> Flag {pcId} for Maintenance
                    </DialogTitle>
                    <DialogDescription className="text-neutral-500">
                        Please describe the hardware or software issue affecting this station for the audit trail.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="text-neutral-700">Maintenance Note / Issue</Label>
                        <Input 
                            value={note} 
                            onChange={(e) => setNote(e.target.value)} 
                            className="bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-500" 
                            placeholder="e.g. Keyboard unresponsive, Monitor flickering..." 
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && note.trim() && handleSubmit()}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-3 mt-2">
                    <Button 
                        variant="outline" 
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={!note.trim()}
                        className="font-bold text-white"
                        style={{
                            backgroundColor: note.trim() ? GSDS_COLORS.gold400 : '#d1d5db',
                            color: note.trim() ? '#1a1a1a' : '#6b7280'
                        }}
                    >
                        Confirm Flag
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}