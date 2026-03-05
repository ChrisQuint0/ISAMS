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
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{editingId ? "Edit Laboratory Schedule" : "Add New Schedule"}</DialogTitle>
                    <DialogDescription className="hidden">Add or edit schedule details.</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Course Code</Label>
                            <Input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" placeholder="e.g. IT305" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Section</Label>
                            <Input value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" placeholder="e.g. BSIT-3A" />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label className="text-slate-300">Subject Description</Label>
                        <Input value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" placeholder="e.g. Advanced Web Development" />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-300">Professor</Label>
                        <Input value={formData.prof} onChange={e => setFormData({...formData, prof: e.target.value})} className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" placeholder="e.g. Prof. Reyes" />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-300">Day of the Week</Label>
                        <select value={formData.day} onChange={e => setFormData({...formData, day: e.target.value})} className="flex h-10 w-full items-center justify-between rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-1 focus:ring-blue-500">
                            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Start Time</Label>
                            <Input type="time" value={formData.time_start} onChange={e => setFormData({...formData, time_start: e.target.value})} className="bg-slate-800 border-slate-700 text-white [color-scheme:dark]" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">End Time</Label>
                            <Input type="time" value={formData.time_end} onChange={e => setFormData({...formData, time_end: e.target.value})} className="bg-slate-800 border-slate-700 text-white [color-scheme:dark]" />
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-4 gap-3">
                    <Button variant="outline" onClick={onClose} className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white">Cancel</Button>
                    <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">{editingId ? "Update Schedule" : "Save Schedule"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}