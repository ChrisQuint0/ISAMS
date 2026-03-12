import React, { useState, useMemo } from 'react';
import { X, Calendar, Download, Loader2, Lock } from 'lucide-react';

export default function ExportMonthModal({ isOpen, onClose, onConfirm, reportTitle }) {
    // Force "Now" to Manila Time so the disabled state is accurate to your local clock
    const nowManila = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
    const currentMonthIdx = nowManila.getMonth(); 
    const currentYear = nowManila.getFullYear();

    const [selectedMonth, setSelectedMonth] = useState(currentMonthIdx);
    const [isExporting, setIsExporting] = useState(false);

    // Dynamic month list generation
    const months = useMemo(() => [
        { name: 'January', value: 0 },
        { name: 'February', value: 1 },
        { name: 'March', value: 2 },
        { name: 'April', value: 3 },
        { name: 'May', value: 4 },
        { name: 'June', value: 5 },
        { name: 'July', value: 6 },
        { name: 'August', value: 7 },
        { name: 'September', value: 8 },
        { name: 'October', value: 9 },
        { name: 'November', value: 10 },
        { name: 'December', value: 11 },
    ], []);

    if (!isOpen) return null;

    const handleExport = async () => {
        setIsExporting(true);
        // Small delay for UX feel
        await new Promise(resolve => setTimeout(resolve, 800));
        onConfirm(selectedMonth);
        setIsExporting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#0f172a] border border-[#1e293b] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-[#1e293b] flex justify-between items-center bg-[#1e293b]/20">
                    <div>
                        <h3 className="text-white font-bold text-lg uppercase tracking-tight">Export Report</h3>
                        <p className="text-slate-500 text-[10px] uppercase font-bold mt-1 tracking-widest">{reportTitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#1e293b] rounded-full text-slate-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4">
                        Select Target Month ({currentYear})
                    </label>
                    <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {months.map((m) => {
                            const isFuture = m.value > currentMonthIdx;
                            const isSelected = selectedMonth === m.value;

                            return (
                                <button
                                    key={m.value}
                                    disabled={isFuture}
                                    onClick={() => setSelectedMonth(m.value)}
                                    className={`
                                        flex items-center justify-between p-3 rounded-xl border transition-all
                                        ${isFuture 
                                            ? "bg-[#0f172a]/50 border-slate-800/50 text-slate-700 cursor-not-allowed opacity-50" 
                                            : isSelected 
                                                ? "bg-sky-500/15 border-sky-500 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.1)]" 
                                                : "bg-[#020617] border-[#1e293b] text-slate-500 hover:border-slate-600 hover:text-slate-300"
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <Calendar size={14} className={isSelected ? "text-sky-400" : "text-slate-600"} />
                                        <span className="text-sm font-bold">{m.name}</span>
                                    </div>
                                    {isFuture && <Lock size={12} className="text-slate-700" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-[#020617]/50 border-t border-[#1e293b] flex gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 px-4 py-2.5 rounded-xl border border-[#1e293b] text-slate-400 font-bold text-xs uppercase tracking-widest hover:bg-[#1e293b] transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-sky-900/20 transition-all disabled:opacity-50 active:scale-95"
                    >
                        {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                        {isExporting ? "Processing..." : "Download Report"}
                    </button>
                </div>
            </div>
        </div>
    );
}