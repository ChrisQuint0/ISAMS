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

export function AddSanctionModal({ isOpen, onClose, onSuccess, editingSanction }) { 
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const [formData, setFormData] = useState({
        severity: "",
        frequency: 1,
        sanction_name: "",
        sanction_description: ""
    });

    useEffect(() => {
        if (isOpen) {
            if (editingSanction) {
                setFormData({
                    severity: editingSanction.severity,
                    frequency: editingSanction.frequency,
                    sanction_name: editingSanction.sanction_name,
                    sanction_description: editingSanction.sanction_description || ""
                });
            } else {
                setFormData({
                    severity: "",
                    frequency: 1,
                    sanction_name: "",
                    sanction_description: ""
                });
            }
            setErrorMsg(null);
            setSuccessMsg(null);
        }
    }, [isOpen, editingSanction]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.sanction_name || !formData.severity || !formData.frequency) return;

        setIsSaving(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            if (editingSanction) {
                const { error } = await supabase
                    .from('sanctions_sv')
                    .update({
                        severity: formData.severity,
                        frequency: parseInt(formData.frequency, 10),
                        sanction_name: formData.sanction_name,
                        sanction_description: formData.sanction_description || null
                    })
                    .eq('matrix_id', editingSanction.matrix_id);

                if (error) throw error;
                setSuccessMsg("Sanction matrix updated successfully!");
            } else {
                const { error } = await supabase
                    .from('sanctions_sv')
                    .insert([{
                        severity: formData.severity,
                        frequency: parseInt(formData.frequency, 10),
                        sanction_name: formData.sanction_name,
                        sanction_description: formData.sanction_description || null
                    }]);

                if (error) throw error;
                setSuccessMsg("Sanction matrix entry created!");
            }

            setTimeout(() => {
                onClose();
                if (onSuccess) onSuccess();
            }, 1500);
        } catch (err) {
            console.error("Error saving sanction matrix:", err);
            setErrorMsg(err.message || "Failed to save sanction matrix.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-200 p-0 overflow-hidden" style={{ maxWidth: "450px" }}>
                <div className="p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl text-white">
                            {editingSanction ? "Edit Sanction Matrix" : "Add Sanction Entry"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            {editingSanction ? "Update the details for this sanction entry." : "Map severity and frequency to a specific sanction."}
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="severity" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Severity *</Label>
                                <Select
                                    value={formData.severity}
                                    onValueChange={(val) => setFormData({ ...formData, severity: val })}
                                    required
                                >
                                    <SelectTrigger className="w-full bg-slate-950 border-slate-800 focus:border-rose-500/50 h-9 text-sm">
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                        <SelectItem value="Major">Major</SelectItem>
                                        <SelectItem value="Minor">Minor</SelectItem>
                                        <SelectItem value="Compliance">Compliance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="frequency" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Occurrence *</Label>
                                <Input
                                    id="frequency"
                                    type="number"
                                    min="1"
                                    value={formData.frequency}
                                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                    className="bg-slate-950 border-slate-800 focus:border-rose-500/50 h-9 text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="sanction_name" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Action / Sanction *</Label>
                            <Input
                                id="sanction_name"
                                value={formData.sanction_name}
                                onChange={(e) => setFormData({ ...formData, sanction_name: e.target.value })}
                                placeholder="e.g. 1 Month Suspension"
                                className="bg-slate-950 border-slate-800 focus:border-rose-500/50 h-9 text-sm"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="sanction_description" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</Label>
                            <Textarea
                                id="sanction_description"
                                value={formData.sanction_description}
                                onChange={(e) => setFormData({ ...formData, sanction_description: e.target.value })}
                                placeholder="Optional rules or details..."
                                className="bg-slate-950 border-slate-800 focus:border-rose-500/50 min-h-[80px] text-sm resize-none"
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
                            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white h-9 px-4 text-sm font-medium">
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white h-9 px-6 text-sm font-medium shadow-lg shadow-rose-500/20" disabled={isSaving || !formData.sanction_name || !formData.severity || !formData.frequency}>
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                {editingSanction ? "Save Changes" : "Create Entry"}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
