import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThesisSettingsModal } from "./ThesisSettingsModal";

export function ThesisArchivingHeader({ title }) {
    return (
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 px-4 w-full">
            <div className="flex items-center gap-2 flex-1">
                <SidebarTrigger className="text-slate-400 hover:text-slate-300 hover:bg-slate-800" />
                <div className="h-6 w-px bg-slate-800" />
                <h1 className="text-xl font-semibold text-slate-100">{title}</h1>
            </div>
            <ThesisSettingsModal />
        </header>
    );
}
