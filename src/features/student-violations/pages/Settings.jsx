import React from "react";

const Settings = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      {/* PAGE HEADER: Following the Student Database/Dashboard typography */}
      <header className="mb-10 text-left shrink-0">
        <h1 className="text-xl font-bold text-white tracking-tight">System settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure and manage ISAMS module preferences</p>
      </header>

      {/* Placeholder Content */}
      <div className="flex items-center justify-center h-[400px] border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/20">
        <p className="text-slate-400 font-medium tracking-wide italic">Settings Page</p>
      </div>
    </div>
  );
};

export default Settings;