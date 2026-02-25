import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function AddOffenseModal({ isOpen, onClose, onSuccess, editingOffense }) {
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        severity: "",
        description: ""
    });

    useEffect(() => {
        if (isOpen) {
            if (editingOffense) {
                setFormData({
                    name: editingOffense.name,
                    severity: editingOffense.severity,
                    description: editingOffense.description || ""
                });
            } else {
                setFormData({
                    name: "",
                    severity: "",
                    description: ""
                });
            }
            setErrorMsg(null);
            setSuccessMsg(null);
        }
    }, [isOpen, editingOffense]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.severity) return;

        setIsSaving(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            if (editingOffense) {
                const { error } = await supabase
                    .from('offense_types_sv')
                    .update({
                        name: formData.name,
                        severity: formData.severity,
                        description: formData.description || null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('offense_type_id', editingOffense.offense_type_id);

                if (error) throw error;
                setSuccessMsg("Offense updated successfully!");
            } else {
                const { error } = await supabase
                    .from('offense_types_sv')
                    .insert([{
                        name: formData.name,
                        severity: formData.severity,
                        description: formData.description || null
                    }]);

                if (error) throw error;
                setSuccessMsg("Offense created successfully!");
            }

            setTimeout(() => {
                onClose();
                if (onSuccess) onSuccess();
            }, 1500);
        } catch (err) {
            console.error("Error saving offense:", err);
            setErrorMsg(err.message || "Failed to save offense.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-200 p-0 overflow-hidden" style={{ maxWidth: "420px" }}>
                <div className="p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl text-white">
                            {editingOffense ? "Edit Offense" : "Add New Offense"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            {editingOffense ? "Update the details for this offense type." : "Create a new offense classification."}
                        </DialogDescription>
                    </DialogHeader>

                    {errorMsg && (
                        <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-3 rounded-md flex items-start gap-3 mb-4 text-xs">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <p>{errorMsg}</p>
                        </div>
                    )}

                    {successMsg && (
                        <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-3 rounded-md flex items-center gap-3 mb-4 text-xs">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <p>{successMsg}</p>
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Offense Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Cheating during exam"
                                className="bg-slate-950 border-slate-800 focus:border-indigo-500/50 h-9 text-sm"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="severity" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Severity Group *</Label>
                            <Select
                                value={formData.severity}
                                onValueChange={(val) => setFormData({ ...formData, severity: val })}
                                required
                            >
                                <SelectTrigger className="w-full bg-slate-950 border-slate-800 focus:border-indigo-500/50 h-9 text-sm">
                                    <SelectValue placeholder="Select severity..." />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                    <SelectItem value="Major">Major</SelectItem>
                                    <SelectItem value="Minor">Minor</SelectItem>
                                    <SelectItem value="Compliance">Compliance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="description" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Optional details..."
                                className="bg-slate-950 border-slate-800 focus:border-indigo-500/50 min-h-[80px] text-sm resize-none"
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
                            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white h-9 px-4 text-sm font-medium">
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-6 text-sm font-medium shadow-lg shadow-indigo-500/20" disabled={isSaving || !formData.name || !formData.severity}>
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                {editingOffense ? "Save Changes" : "Create Offense"}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
