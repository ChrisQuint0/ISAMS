import { Link } from "react-router-dom";
import { ShieldAlert, FileWarning, ArrowRight } from "lucide-react";

const Settings = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      {/* PAGE HEADER */}
      <header className="mb-10 text-left shrink-0">
        <h1 className="text-3xl font-bold text-white tracking-tight">System settings</h1>
        <p className="text-slate-400">Configure and manage ISAMS module preferences</p>
      </header>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Manage Offenses Card */}
        <Link
          to="/violation-settings/manage-offenses"
          className="group relative overflow-hidden bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all duration-300"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-500/10 p-3 rounded-lg text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">Manage Offenses</h3>
                <p className="text-sm text-slate-400 mt-1">Add, update, and categorize student offense types</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 group-hover:-rotate-45 transition-all" />
          </div>
        </Link>

        {/* Manage Sanctions Card */}
        <Link
          to="/violation-settings/manage-sanctions"
          className="group relative overflow-hidden bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-rose-500/50 hover:bg-slate-800/50 transition-all duration-300"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-rose-500/10 p-3 rounded-lg text-rose-400 group-hover:scale-110 group-hover:bg-rose-500/20 transition-all">
                <FileWarning className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-rose-300 transition-colors">Manage Sanctions</h3>
                <p className="text-sm text-slate-400 mt-1">Configure disciplinary actions and sanction matrices</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-rose-400 group-hover:-rotate-45 transition-all" />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Settings;