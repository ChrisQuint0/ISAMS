import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function SimilarityScoreBadge({ score, className, threshold = 20 }) {
    const isFlagged = score > threshold;
    const isHigh = score > 50;

    let variant = "default";
    let Icon = CheckCircle2;
    let label = "Safe";
    let colorClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

    if (isHigh) {
        variant = "destructive";
        Icon = AlertCircle;
        label = "High Similarity";
        colorClass = "bg-red-500/10 text-red-400 border-red-500/20";
    } else if (isFlagged) {
        variant = "secondary";
        Icon = AlertTriangle;
        label = "Flagged";
        colorClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }

    return (
        <Badge
            variant="outline"
            className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 font-medium border transition-all",
                colorClass,
                className
            )}
        >
            <Icon className="h-3.5 w-3.5" />
            <span>{score}% Similarity</span>
            <span className="opacity-60 font-normal ml-0.5">• {label}</span>
        </Badge>
    );
}
