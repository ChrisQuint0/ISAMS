import React, { useState, useEffect } from "react";
import { Loader2, Search, Database, FileCheck, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
    { label: "Extracting thesis metadata...", icon: Database },
    { label: "Cross-referencing repository...", icon: Search },
    { label: "Performing semantic analysis...", icon: Layers },
    { label: "Generating integrity report...", icon: FileCheck },
];

/**
 * Displays an animated loading state while the NLP analysis runs.
 * Does NOT auto-complete — the parent page controls the state transition
 * once the real backend call resolves.
 */
export function SimilarityAnalysisLoading() {
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Step cycling — cycles through steps but pauses at 90% to wait for real result
        const stepInterval = setInterval(() => {
            setCurrentStep(prev => (prev < STEPS.length - 1 ? prev + 1 : prev));
        }, 1800);

        // Progress bar fills to 90% then stalls — the parent resolves the final 10%
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prev + 1;
            });
        }, 60);

        return () => {
            clearInterval(stepInterval);
            clearInterval(progressInterval);
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in fade-in duration-500">
            <div className="relative">
                {/* Circular Progress Wrapper */}
                <div className="relative h-48 w-48 flex items-center justify-center">
                    <svg className="h-full w-full rotate-[-90deg]">
                        <circle
                            cx="96" cy="96" r="88"
                            className="stroke-gray-200 fill-none stroke-[6]"
                        />
                        <circle
                            cx="96" cy="96" r="88"
                            style={{
                                strokeDasharray: "552.92",
                                strokeDashoffset: 552.92 - (552.92 * progress) / 100,
                            }}
                            className="stroke-green-600 fill-none stroke-[6] transition-all duration-500 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-gray-900 italic tracking-tighter">
                            {progress}%
                        </span>
                        <span className="text-[10px] uppercase font-bold text-green-600 tracking-widest mt-1">
                            Analyzing
                        </span>
                    </div>
                </div>

                {/* Animated Rings */}
                <div className="absolute inset-0 -z-10 bg-green-500/10 rounded-full animate-ping opacity-20" />
            </div>

            <div className="space-y-6 max-w-sm w-full">
                <div className="space-y-4">
                    {STEPS.map((step, i) => (
                        <div
                            key={i}
                            className={cn(
                                "flex items-center gap-4 p-3 rounded-xl border transition-all duration-500",
                                i === currentStep
                                    ? "bg-green-50 border-green-400/40 text-green-800 translate-x-1"
                                    : i < currentStep
                                        ? "bg-gray-50 border-green-300/30 text-green-600/70"
                                        : "bg-transparent border-transparent text-gray-400 opacity-40"
                            )}
                        >
                            <step.icon className={cn("h-5 w-5 shrink-0", i === currentStep && "animate-pulse")} />
                            <span className="text-sm font-semibold">{step.label}</span>
                            {i < currentStep && <FileCheck className="h-4 w-4 ml-auto text-green-600" />}
                            {i === currentStep && <Loader2 className="h-4 w-4 ml-auto animate-spin text-green-600" />}
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-xs text-gray-400 italic max-w-xs mx-auto leading-relaxed">
                Processing document against the thesis repository. This may take a few seconds depending on repository size and document complexity.
            </p>
        </div>
    );
}