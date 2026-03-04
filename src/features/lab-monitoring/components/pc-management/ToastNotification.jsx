import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ToastNotification({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-6 fade-in duration-300">
      <div className="bg-rose-950/80 border border-rose-500/30 shadow-2xl shadow-rose-900/30 backdrop-blur-md px-6 py-4 rounded-2xl flex items-center gap-4">
        <div className="bg-rose-500/20 p-2 rounded-full">
          <AlertTriangle size={16} className="text-rose-400" />
        </div>
        <span className="text-xs font-bold text-rose-200 uppercase tracking-widest">
          {message}
        </span>
        <button 
          onClick={onClose} 
          className="ml-2 text-rose-400 hover:text-white transition-colors bg-rose-500/10 hover:bg-rose-500/30 p-1.5 rounded-lg"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}