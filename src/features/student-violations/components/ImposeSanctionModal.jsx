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
import { supabase } from "@/lib/supabaseClient";
import { CheckCircle2, AlertCircle, Loader2, Sparkles, TrendingUp, BookOpen } from "lucide-react";

export function ImposeSanctionModal({ isOpen, onClose, onSuccess, violationData }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const [sanctionName, setSanctionName] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [deadlineDate, setDeadlineDate] = useState("");

    const [ruleSuggestions, setRuleSuggestions] = useState([]);
    const [historySuggestions, setHistorySuggestions] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        if (isOpen && violationData) {
            analyzeSuggestions(violationData);
        }
    }, [isOpen, violationData]);

    const analyzeSuggestions = async (vData) => {
        setIsAnalyzing(true);
        setRuleSuggestions([]);
        setHistorySuggestions([]);

        try {
            // --- 1. Rule-based Suggestions (Sanction Matrix) ---
            // First, determine frequency. How many past violations of this SEVERITY does the student have?
            // NOTE: The violation record includes offense_types_sv inside `violationData`.
            // But we might only have `vData.violation` string from the grid. We need to query to get severity if not passed.

            // Let's get the full violation details first to be safe
            const { data: fullViolation, error: vError } = await supabase
                .from('violations_sv')
                .select(`
                    violation_id,
                    student_number,
                    offense_type_id,
                    offense_types_sv (severity)
                `)
                .eq('violation_id', vData.violation_id)
                .single();

            if (vError) throw vError;

            const severity = fullViolation.offense_types_sv.severity;
            const offenseTypeId = fullViolation.offense_type_id;
            const studentNumber = fullViolation.student_number;

            // Count previous violations of the same severity for this student
            const { data: pastViolations, error: countError } = await supabase
                .from('violations_sv')
                .select(`
                    violation_id,
                    offense_types_sv!inner(severity)
                `)
                .eq('student_number', studentNumber)
                .eq('offense_types_sv.severity', severity)
                // Exclude future violations in case dates are weird, but standard count is fine
                .order('created_at', { ascending: true });

            if (countError) throw countError;

            // Find which offense number this is (1st, 2nd, etc.)
            // We just find its zero-based index in the chronologically ordered list of this student's violations of this severity
            const offenseIndex = pastViolations.findIndex(v => v.violation_id === fullViolation.violation_id);
            const frequency = offenseIndex === -1 ? 1 : offenseIndex + 1; // Default to 1st if not found for some reason

            // Fetch Rule-based suggestion
            const { data: rules, error: rulesError } = await supabase
                .from('sanctions_sv')
                .select('*')
                .eq('severity', severity)
                .eq('frequency', frequency);

            if (rulesError) throw rulesError;
            setRuleSuggestions(rules || []);


            // --- 2. Historical Data Suggestions ---
            // Fetch what sanctions were given in the past for THIS EXACT offense_type_id across all students
            const { data: historicalSanctions, error: histError } = await supabase
                .from('student_sanctions_sv')
                .select(`
                    penalty_name,
                    violations_sv!inner(offense_type_id)
                `)
                .eq('violations_sv.offense_type_id', offenseTypeId);

            if (histError) throw histError;

            // Aggregate and count occurrences
            if (historicalSanctions && historicalSanctions.length > 0) {
                const counts = {};
                historicalSanctions.forEach(record => {
                    const name = record.penalty_name;
                    counts[name] = (counts[name] || 0) + 1;
                });

                // Sort by count descending, take top 3
                const sortedHistory = Object.entries(counts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([name, count]) => ({ penalty_name: name, count }));

                setHistorySuggestions(sortedHistory);
            }

        } catch (error) {
            console.error("Error analyzing AI suggestions:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleApplySuggestion = (suggestionText) => {
        setSanctionName(suggestionText);
    };

    const resetState = () => {
        setErrorMsg(null);
        setSuccessMsg(null);
        setIsSubmitting(false);
        setSanctionName("");
        setDescription("");
        setStartDate(new Date().toISOString().split('T')[0]);
        setDeadlineDate("");
        setRuleSuggestions([]);
        setHistorySuggestions([]);
    };

    const handleOpenChange = (open) => {
        if (!open) {
            resetState();
            onClose();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!sanctionName) {
            setErrorMsg("Sanction Action is required.");
            return;
        }

        setIsSubmitting(true);
        setSuccessMsg(null);
        setErrorMsg(null);

        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) throw new Error("Authentication error. Please log in again.");

            // First, ensure the primary violation status is updated to "Sanctioned" to trigger DB logic correctly
            // (Even though the DB has a trigger, sometimes we might be changing status inside ManageViolation UI. doing it here explicitly guarantees data consistency if called directly)

            // Note: The schema has an auto_mark_as_sanctioned_sv trigger now, so creating the sanction will update the violation automatically.

            const insertData = {
                violation_id: violationData.violation_id,
                penalty_name: sanctionName,
                description: description || null,
                start_date: startDate || null,
                deadline_date: deadlineDate || null,
                status: 'In Progress',
                assigned_by: user.id
            };

            const { error: insertError } = await supabase
                .from('student_sanctions_sv')
                .insert([insertData]);

            if (insertError) {
                // Handle duplicate sanction error constraint
                if (insertError.code === '23505') {
                    throw new Error("A sanction already exists for this violation.");
                }
                throw insertError;
            }

            setSuccessMsg("Sanction imposed successfully!");
            setTimeout(() => {
                handleOpenChange(false);
                if (onSuccess) onSuccess();
            }, 1500);
        } catch (error) {
            console.error("Error imposing sanction:", error);
            setErrorMsg(`Failed to impose sanction: ${error.message || 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!violationData) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col bg-white border-neutral-200 text-neutral-900 p-0 shadow-2xl rounded-xl">
                <div className="p-6 border-b border-neutral-100 shrink-0 bg-white/80 backdrop-blur-sm z-10 relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                            Impose Sanction
                        </DialogTitle>
                        <DialogDescription className="text-neutral-500 font-medium">
                            Determine and assign a disciplinary action for <strong className="text-neutral-900">{violationData.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    {errorMsg && (
                        <div className="bg-red-50 border border-red-200 text-destructive-semantic p-3 rounded-md flex items-start gap-3 mt-4 text-sm font-medium">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p>{errorMsg}</p>
                        </div>
                    )}

                    {successMsg && (
                        <div className="bg-emerald-50 border border-emerald-200 text-success p-3 rounded-md flex items-center gap-3 mt-4 text-sm font-medium animate-in fade-in zoom-in-95">
                            <CheckCircle2 className="w-5 h-5" />
                            <p>{successMsg}</p>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-6">

                    {/* --- AI Suggestions Engine Panel --- */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-primary-500" />
                            <h3 className="text-xs font-bold text-primary-700 uppercase tracking-wider">System Suggestions</h3>
                        </div>

                        {isAnalyzing ? (
                            <div className="flex items-center justify-center p-6 text-neutral-500">
                                <Loader2 className="w-5 h-5 animate-spin mr-3 text-primary-500" />
                                <span className="text-sm font-medium animate-pulse">Analyzing rules and historical data...</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Rule-based */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                                        <BookOpen className="w-3.5 h-3.5" /> HandBook Rules
                                    </div>
                                    {ruleSuggestions.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {ruleSuggestions.map((rule, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => handleApplySuggestion(rule.sanction_name)}
                                                    className="text-xs bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 hover:border-emerald-300 px-3 py-1.5 rounded-full shadow-sm transition-all flex items-center gap-2 group active:scale-95 font-medium"
                                                    title={rule.sanction_description || "As per student handbook"}
                                                >
                                                    {rule.sanction_name}
                                                    <span className="opacity-0 group-hover:opacity-100 font-bold transition-opacity">→</span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-neutral-500 italic bg-white/50 border border-neutral-100 rounded px-2 py-1 inline-block">No exact handbook match found for this frequency.</p>
                                    )}
                                </div>

                                {/* Historical Data */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary-700 uppercase tracking-wider">
                                        <TrendingUp className="w-3.5 h-3.5" /> Past Records (Same Offense)
                                    </div>
                                    {historySuggestions.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {historySuggestions.map((hist, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => handleApplySuggestion(hist.penalty_name)}
                                                    className="text-xs bg-white hover:bg-primary-50 text-primary-700 border border-primary-200 hover:border-primary-300 px-3 py-1.5 rounded-full shadow-sm transition-all flex items-center gap-2 group active:scale-95 font-medium"
                                                    title={`Used ${hist.count} times in the past`}
                                                >
                                                    {hist.penalty_name} <span className="bg-primary-100 text-primary-800 px-1.5 py-0.5 rounded-md text-[10px] ml-1 font-bold">{hist.count}x</span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-neutral-500 italic bg-white/50 border border-neutral-100 rounded px-2 py-1 inline-block">No past sanctions recorded for this specific offense.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- Manual Input Form --- */}
                    <form id="impose-sanction-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="sanctionName" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Sanction Action <span className="text-destructive-semantic">*</span></Label>
                            <Input
                                id="sanctionName"
                                value={sanctionName}
                                onChange={(e) => setSanctionName(e.target.value)}
                                placeholder="e.g. 3 Days Suspension"
                                className="bg-white border-neutral-200 focus-visible:ring-primary-500 text-sm text-neutral-900 transition-all shadow-sm h-9"
                                required
                            />
                            <p className="text-[11px] text-neutral-500 font-medium">You can select a suggestion above or enter a custom action.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Conditions / Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Additional requirements or details for this sanction..."
                                className="bg-white border-neutral-200 min-h-[80px] focus-visible:ring-primary-500 text-sm text-neutral-900 resize-none shadow-sm placeholder:text-neutral-400"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Start Date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-sm focus-visible:ring-primary-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="deadlineDate" className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Deadline / End Date</Label>
                                <Input
                                    id="deadlineDate"
                                    type="date"
                                    min={startDate}
                                    value={deadlineDate}
                                    onChange={(e) => setDeadlineDate(e.target.value)}
                                    className="bg-white border-neutral-200 text-neutral-900 shadow-sm h-9 text-sm focus-visible:ring-primary-500"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-neutral-100 bg-neutral-50 shrink-0 rounded-b-xl">
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="ghost" className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 font-bold" onClick={() => handleOpenChange(false)}>Cancel</Button>
                        <Button form="impose-sanction-form" type="submit" className="bg-destructive-semantic hover:bg-red-600 text-white font-bold shadow-md transition-all active:scale-95 px-6" disabled={isSubmitting || !sanctionName}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Confirm & Impose Sanction
                        </Button>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}
