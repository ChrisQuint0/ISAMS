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
import { CheckCircle2, AlertCircle, Loader2, Clock } from "lucide-react";

export function AddOffenseModal({ isOpen, onClose, onSuccess, editingOffense }) {
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [createdByName, setCreatedByName] = useState('Unknown');
    const [updatedByName, setUpdatedByName] = useState('Unknown');

    const [formData, setFormData] = useState({
        name: "",
        severity: "",
        description: ""
    });

    const resolveAuditNames = async (data) => {
        const uuids = [data.created_by, data.updated_by].filter(Boolean);
        if (uuids.length === 0) return;
        try {
            const { data: users, error } = await supabase
                .from('users_with_roles')
                .select('id, first_name, last_name')
                .in('id', uuids);
            if (error || !users) return;
            const map = {};
            users.forEach(u => { map[u.id] = `${u.first_name} ${u.last_name}`; });
            if (data.created_by && map[data.created_by]) setCreatedByName(map[data.created_by]);
            if (data.updated_by && map[data.updated_by]) setUpdatedByName(map[data.updated_by]);
        } catch (err) {
            console.error('Error resolving audit names:', err);
        }
    };

    useEffect(() => {
        if (isOpen) {
            if (editingOffense) {
                setFormData({
                    name: editingOffense.name,
                    severity: editingOffense.severity,
                    description: editingOffense.description || ""
                });
                resolveAuditNames(editingOffense);
            } else {
                setFormData({
                    name: "",
                    severity: "",
                    description: ""
                });
                setCreatedByName('Unknown');
                setUpdatedByName('Unknown');
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
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw new Error("Authentication error. Please log in again.");

            if (editingOffense) {
                const { error } = await supabase
                    .from('offense_types_sv')
                    .update({
                        name: formData.name,
                        severity: formData.severity,
                        description: formData.description || null,
                        updated_by: user.id,
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
                        description: formData.description || null,
                        created_by: user.id
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
            <DialogContent className="max-w-md bg-white border-neutral-200 text-neutral-900 p-0 overflow-hidden shadow-lg rounded-xl" style={{ maxWidth: "420px" }}>
                <div className="p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl font-bold text-neutral-900 tracking-tight">
                            {editingOffense ? "Edit Offense" : "Add New Offense"}
                        </DialogTitle>
                        <DialogDescription className="text-neutral-500 font-medium">
                            {editingOffense ? "Update the details for this offense type." : "Create a new offense classification."}
                        </DialogDescription>
                    </DialogHeader>

                    {errorMsg && (
                        <div className="bg-red-50 border border-red-200 text-destructive-semantic p-3 rounded-md flex items-start gap-3 mb-4 text-xs font-medium">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <p>{errorMsg}</p>
                        </div>
                    )}

                    {successMsg && (
                        <div className="bg-emerald-50 border border-emerald-200 text-success p-3 rounded-md flex items-center gap-3 mb-4 text-xs font-medium">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <p>{successMsg}</p>
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Offense Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Cheating during exam"
                                className="bg-white border-neutral-200 focus-visible:ring-primary-500 focus-visible:border-primary-500 h-9 text-sm text-neutral-900 placeholder:text-neutral-400"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="severity" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Severity Group *</Label>
                            <Select
                                value={formData.severity}
                                onValueChange={(val) => setFormData({ ...formData, severity: val })}
                                required
                            >
                                <SelectTrigger className="w-full bg-white border-neutral-200 focus:ring-primary-500 h-9 text-sm text-neutral-900">
                                    <SelectValue placeholder="Select severity..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-neutral-200 text-neutral-900">
                                    <SelectItem value="Major">Major</SelectItem>
                                    <SelectItem value="Minor">Minor</SelectItem>
                                    <SelectItem value="Compliance">Compliance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="description" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Optional details..."
                                className="bg-white border-neutral-200 focus-visible:ring-primary-500 focus-visible:border-primary-500 min-h-[80px] text-sm resize-none text-neutral-900 placeholder:text-neutral-400"
                            />
                        </div>

                        {editingOffense && (
                            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 grid grid-cols-2 gap-3 text-xs shadow-sm">
                                <div>
                                    <p className="text-neutral-500 uppercase tracking-wider font-bold mb-0.5 flex items-center gap-1"><Clock className="w-3 h-3" /> Created</p>
                                    <p className="text-neutral-900 font-bold">{editingOffense.created_at ? new Date(editingOffense.created_at).toLocaleString() : 'N/A'}</p>
                                    <p className="text-neutral-500 font-medium">by {createdByName}</p>
                                </div>
                                <div>
                                    <p className="text-neutral-500 uppercase tracking-wider font-bold mb-0.5 flex items-center gap-1"><Clock className="w-3 h-3" /> Last Modified</p>
                                    {editingOffense.updated_at ? (
                                        <>
                                            <p className="text-neutral-900 font-bold">{new Date(editingOffense.updated_at).toLocaleString()}</p>
                                            <p className="text-neutral-500 font-medium">by {updatedByName}</p>
                                        </>
                                    ) : (
                                        <p className="text-neutral-400 italic">Not yet modified</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-100">
                            <Button type="button" variant="ghost" onClick={onClose} className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 h-9 px-4 text-sm font-bold">
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white h-9 px-6 text-sm font-bold shadow-md shadow-primary-900/10" disabled={isSaving || !formData.name || !formData.severity}>
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
