import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Settings, ShieldAlert, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export function SimilaritySettingsModal({ open, onOpenChange, currentThreshold = 20, onSave }) {
    const [threshold, setThreshold] = useState(currentThreshold);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Sync when currentThreshold prop changes (loaded from DB)
    useEffect(() => {
        setThreshold(currentThreshold);
    }, [currentThreshold]);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            await onSave?.(threshold);
            setSaved(true);
            setTimeout(() => {
                setSaved(false);
                onOpenChange(false);
            }, 800);
        } catch (err) {
            console.error("[SimilaritySettingsModal] Save failed:", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-white border-gray-200 text-gray-900">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
                        <Settings className="h-5 w-5 text-gray-500" />
                        Similarity Settings
                    </DialogTitle>
                    <DialogDescription className="text-gray-500">
                        Configure the global threshold for similarity flagging.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="threshold" className="text-sm font-medium text-gray-700">
                                Flagging Threshold
                            </Label>
                            <span className="text-lg font-bold text-green-700">{threshold}%</span>
                        </div>

                        <Slider
                            id="threshold"
                            value={[threshold]}
                            onValueChange={([val]) => setThreshold(val)}
                            max={100}
                            step={1}
                            className="py-4"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-colors ${threshold > 50 ? "bg-gray-50 border-gray-200 opacity-50" : "bg-green-50 border-green-200"
                                }`}>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-[10px] uppercase font-bold text-green-700">Safe Range</span>
                                <span className="text-xs text-gray-500">0% to {threshold}%</span>
                            </div>
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex flex-col items-center gap-1">
                                <ShieldAlert className="h-4 w-4 text-red-500" />
                                <span className="text-[10px] uppercase font-bold text-red-600">Flagged Range</span>
                                <span className="text-xs text-gray-500">{threshold}% to 100%</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Technical Note</h4>
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                            Submissions exceeding this threshold will be automatically moved to the Audit Queue for Research Coordinator review.
                            Changes apply to all <strong>new</strong> analysis results. This change is saved to the audit history.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-300 text-gray-600 hover:bg-gray-50">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || saved}
                        className="bg-green-700 hover:bg-green-800 text-white border-none"
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : saved ? (
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                        ) : null}
                        {saved ? "Saved!" : "Save Configuration"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}