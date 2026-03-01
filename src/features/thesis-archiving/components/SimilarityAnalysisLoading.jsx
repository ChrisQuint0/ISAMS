import React, { useState, useEffect } from "react";
import { Loader2, Search, Database, FileCheck, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
    { label: "Extracting thesis metadata...", icon: Database },
    { label: "Cross-referencing repository...", icon: Search },
    { label: "Performing semantic analysis...", icon: Layers },
    { label: "Generating integrity report...", icon: FileCheck },
];

export function SimilarityAnalysisLoading({ onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const stepInterval = setInterval(() => {
            setCurrentStep(prev => (prev < STEPS.length - 1 ? prev + 1 : prev));
        }, 1200);

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    clearInterval(stepInterval);
                    setTimeout(onComplete, 500);
                    return 100;
                }
                return prev + 1;
            });
        }, 50);

        return () => {
            clearInterval(stepInterval);
            clearInterval(progressInterval);
        };
    }, [onComplete]);

    return (
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in fade-in duration-500">
            <div className="relative">
                {/* Circular Progress Wrapper */}
                <div className="relative h-48 w-48 flex items-center justify-center">
                    <svg className="h-full w-full rotate-[-90deg]">
                        <circle
                            cx="96"
                            cy="96"
                            r="88"
                            className="stroke-slate-900 fill-none stroke-[6]"
                        />
                        <circle
                            cx="96"
                            cy="96"
                            r="88"
                            style={{
                                strokeDasharray: "552.92",
                                strokeDashoffset: 552.92 - (552.92 * progress) / 100
                            }}
                            className="stroke-blue-500 fill-none stroke-[6] transition-all duration-300 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-slate-100 italic tracking-tighter">
                            {progress}%
                        </span>
                        <span className="text-[10px] uppercase font-bold text-blue-400 tracking-widest mt-1">
                            Analyzing
                        </span>
                    </div>
                </div>

                {/* Animated Rings */}
                <div className="absolute inset-0 -z-10 bg-blue-500/10 rounded-full animate-ping opacity-20" />
            </div>

            <div className="space-y-6 max-w-sm w-full">
                <div className="space-y-4">
                    {STEPS.map((step, i) => (
                        <div
                            key={i}
                            className={cn(
                                "flex items-center gap-4 p-3 rounded-xl border transition-all duration-500",
                                i === currentStep
                                    ? "bg-slate-900 border-blue-500/30 text-slate-100 translate-x-1"
                                    : i < currentStep
                                        ? "bg-slate-950/50 border-emerald-500/20 text-emerald-500/60"
                                        : "bg-transparent border-transparent text-slate-600 opacity-40"
                            )}
                        >
                            <step.icon className={cn(
                                "h-5 w-5 shrink-0",
                                i === currentStep && "animate-pulse"
                            )} />
                            <span className="text-sm font-semibold">{step.label}</span>
                            {i < currentStep && <FileCheck className="h-4 w-4 ml-auto" />}
                            {i === currentStep && <Loader2 className="h-4 w-4 ml-auto animate-spin" />}
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-xs text-slate-500 italic max-w-xs mx-auto leading-relaxed">
                This process typically takes 3-5 seconds depending on repository size and document complexity.
            </p>
        </div>
    );
}
