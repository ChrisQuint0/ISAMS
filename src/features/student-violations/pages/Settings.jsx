import { Link } from "react-router-dom";
import { ShieldAlert, FileWarning, ArrowRight } from "lucide-react";

const Settings = () => {
  return (
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-500 text-left bg-neutral-50">
      {/* PAGE HEADER */}
      <header className="mb-8 text-left shrink-0">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">System settings</h1>
        <p className="text-neutral-500 text-sm font-medium mt-1">Configure and manage ISAMS module preferences</p>
      </header>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Manage Offenses Card */}
        <Link
          to="/violation-settings/manage-offenses"
          className="group relative overflow-hidden bg-white border border-neutral-200 rounded-xl p-6 hover:border-primary-300 hover:shadow-md transition-all duration-300 flex flex-col"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary-50 p-3 rounded-lg text-primary-600 group-hover:scale-110 group-hover:bg-primary-100 transition-all">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900 group-hover:text-primary-700 transition-colors">Manage Offenses</h3>
                <p className="text-sm text-neutral-500 font-medium mt-1">Add, update, and categorize student offense types</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-primary-500 transition-all font-bold" />
          </div>
        </Link>

        {/* Manage Sanctions Card */}
        <Link
          to="/violation-settings/manage-sanctions"
          className="group relative overflow-hidden bg-white border border-neutral-200 rounded-xl p-6 hover:border-warning hover:shadow-md transition-all duration-300 flex flex-col"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-amber-50 p-3 rounded-lg text-warning group-hover:scale-110 group-hover:bg-amber-100 transition-all">
                <FileWarning className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900 group-hover:text-amber-600 transition-colors">Manage Sanctions</h3>
                <p className="text-sm text-neutral-500 font-medium mt-1">Configure disciplinary actions and sanction matrices</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-warning transition-all font-bold" />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Settings;