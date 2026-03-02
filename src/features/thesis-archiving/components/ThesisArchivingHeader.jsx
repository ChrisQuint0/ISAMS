import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThesisSettingsModal } from "./ThesisSettingsModal";

export function ThesisArchivingHeader({ title, showSettings = true, right }) {
    return (
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 bg-white backdrop-blur supports-[backdrop-filter]:bg-white/95 px-4 w-full shadow-sm">
            <div className="flex items-center gap-2 flex-1">
                <SidebarTrigger className="text-gray-600 hover:text-gray-700 hover:bg-gray-100" />
                <div className="h-6 w-px bg-gray-200" />
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            </div>
            {right && <div className="flex items-center">{right}</div>}
            {showSettings && <ThesisSettingsModal />}
        </header>
    );
}
