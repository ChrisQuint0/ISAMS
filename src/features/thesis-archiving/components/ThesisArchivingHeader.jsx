import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThesisSettingsModal } from "./ThesisSettingsModal";

export function ThesisArchivingHeader({ title, showSettings = true, right, variant = "dark" }) {
    const isDark = variant === "dark";

    return (
        <header className={`sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b backdrop-blur px-4 w-full shadow-sm transition-colors duration-200 ${isDark
                ? "border-slate-800 bg-slate-950/80 supports-[backdrop-filter]:bg-slate-950/80"
                : "border-neutral-200 bg-white/80 supports-[backdrop-filter]:bg-white/80"
            }`}>
            <div className="flex items-center gap-2 flex-1">
                <SidebarTrigger className={`transition-colors ${isDark
                        ? "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                    }`} />
                <div className={`h-6 w-px ${isDark ? "bg-slate-800" : "bg-neutral-200"}`} />
                <h1 className={`text-xl font-semibold ${isDark ? "text-slate-100" : "text-neutral-900"}`}>{title}</h1>
            </div>
            {right && <div className="flex items-center">{right}</div>}
            {showSettings && <ThesisSettingsModal variant={variant} />}
        </header>
    );
}
