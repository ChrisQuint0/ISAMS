import React, { useState } from "react";
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
import { Settings, ShieldAlert, CheckCircle2 } from "lucide-react";

export function SimilaritySettingsModal({ open, onOpenChange, currentThreshold = 20, onSave }) {
    const [threshold, setThreshold] = useState(currentThreshold);

    const handleSave = () => {
        onSave?.(threshold);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Settings className="h-5 w-5 text-slate-400" />
                        Similarity Settings
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Configure the global threshold for similarity flagging.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="threshold" className="text-sm font-medium text-slate-300">
                                Flagging Threshold
                            </Label>
                            <span className="text-lg font-bold text-blue-400">{threshold}%</span>
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
                            <div className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-colors ${threshold > 50 ? "bg-slate-950 border-slate-800 opacity-50" : "bg-emerald-500/5 border-emerald-500/20"
                                }`}>
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                <span className="text-[10px] uppercase font-bold text-emerald-500">Safe Range</span>
                                <span className="text-xs text-slate-400">0% to {threshold}%</span>
                            </div>
                            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 flex flex-col items-center gap-1">
                                <ShieldAlert className="h-4 w-4 text-red-500" />
                                <span className="text-[10px] uppercase font-bold text-red-500">Flagged Range</span>
                                <span className="text-xs text-slate-400">{threshold}% to 100%</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Technical Note</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            Submissions exceeding this threshold will be automatically moved to the Audit Queue for Research Coordinator review. Changes apply to all new analysis results.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-300">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-blue-600 hover:bg-blue-500 text-white border-none"
                    >
                        Save Configuration
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
