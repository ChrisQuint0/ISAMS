import React from "react";

export default function ActionCard({ icon: Icon, title, subtitle, onClick, iconColorClass = "bg-primary-500/10 text-primary-500" }) {
    const actionCardClass = "w-full flex items-center gap-4 p-4 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 hover:border-neutral-300 hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-0 text-left min-h-[80px]";

    return (
        <button onClick={onClick} className={actionCardClass}>
            <div className={`p-3 rounded-lg transition-transform shadow-md flex-shrink-0 ${iconColorClass}`}>
                <Icon size={20} />
            </div>
            <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-bold text-neutral-900">{title}</p>
                <p className="text-[10px] text-neutral-600 uppercase tracking-widest mt-0.5">{subtitle}</p>
            </div>
        </button>
    );
}