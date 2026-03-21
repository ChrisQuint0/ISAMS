import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ToastNotification({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-6 fade-in duration-300">
      <div className="backdrop-blur-md shadow-lg rounded-2xl flex items-center gap-4 px-6 py-4 border" style={{
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.3)'
      }}>
        <div className="p-2 rounded-full" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
          <AlertTriangle size={16} style={{ color: '#ef4444' }} />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ef4444' }}>
          {message}
        </span>
        <button 
          onClick={onClose} 
          className="ml-2 transition-colors p-1.5 rounded-lg"
          style={{
            color: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)'
          }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}