import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ScheduleModal({ isOpen, onClose, onSave, editingId, initialData }) {
    const [formData, setFormData] = useState({
        subject: "", section: "", desc: "", prof: "", day: "Monday", time_start: "08:00", time_end: "11:00"
    });

    // Populate data when opening the modal for Editing
    useEffect(() => {
        if (isOpen && initialData) {
            setFormData({
                subject: initialData.subject || "",
                section: initialData.section || "",
                desc: initialData.desc || "",
                prof: initialData.prof || "",
                day: initialData.day || "Monday",
                time_start: initialData.raw_time_start ? initialData.raw_time_start.substring(0, 5) : "08:00",
                time_end: initialData.raw_time_end ? initialData.raw_time_end.substring(0, 5) : "11:00"
            });
        } else if (isOpen && !initialData) {
            setFormData({ subject: "", section: "", desc: "", prof: "", day: "Monday", time_start: "08:00", time_end: "11:00" });
        }
    }, [isOpen, initialData]);

    const handleSubmit = () => {
        onSave(formData, editingId);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-neutral-50 border-neutral-200 text-neutral-900 sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{editingId ? "Edit Laboratory Schedule" : "Add New Schedule"}</DialogTitle>
                    <DialogDescription className="text-neutral-600">Add or edit schedule details for laboratory sessions.</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-neutral-700">Course Code</Label>
                            <Input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-500" placeholder="e.g. IT305" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-neutral-700">Section</Label>
                            <Input value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} className="bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-500" placeholder="e.g. BSIT-3A" />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label className="text-neutral-700">Subject Description</Label>
                        <Input value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} className="bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-500" placeholder="e.g. Advanced Web Development" />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-neutral-700">Professor</Label>
                        <Input value={formData.prof} onChange={e => setFormData({...formData, prof: e.target.value})} className="bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-500" placeholder="e.g. Prof. Reyes" />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-neutral-700">Day of the Week</Label>
                        <select value={formData.day} onChange={e => setFormData({...formData, day: e.target.value})} className="flex h-10 w-full items-center justify-between rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none focus:ring-1 focus:ring-primary-600">
                            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-neutral-700">Start Time</Label>
                            <Input type="time" value={formData.time_start} onChange={e => setFormData({...formData, time_start: e.target.value})} className="bg-neutral-50 border-neutral-200 text-neutral-900 [color-scheme:light]" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-neutral-700">End Time</Label>
                            <Input type="time" value={formData.time_end} onChange={e => setFormData({...formData, time_end: e.target.value})} className="bg-neutral-50 border-neutral-200 text-neutral-900 [color-scheme:light]" />
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-4 gap-3">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button variant="default" onClick={handleSubmit}>{editingId ? "Update Schedule" : "Save Schedule"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}