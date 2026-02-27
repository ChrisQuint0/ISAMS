import React from "react";

export default function ActionCard({ icon: Icon, title, subtitle, onClick, iconColorClass = "bg-sky-500/10 text-sky-500" }) {
    const actionCardClass = "w-full flex items-center gap-4 p-4 bg-[#0f172a] border border-[#1e293b] rounded-xl hover:bg-[#131f36] hover:border-slate-600 hover:shadow-lg hover:shadow-slate-950/40 transition-all group relative overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-0";

    return (
        <button onClick={onClick} className={actionCardClass}>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
            <div className={`p-3 rounded-lg group-hover:scale-110 transition-transform ${iconColorClass}`}>
                <Icon size={20} />
            </div>
            <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{title}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{subtitle}</p>
            </div>
        </button>
    );
}