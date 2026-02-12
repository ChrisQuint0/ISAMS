import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function StudViolationDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/dashboard")}
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            >
              <ArrowLeft className="h-5 w-5" />dasdaw
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-slate-100">
                Student Violation Management
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Manage student violations
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 border border-slate-700 mb-6">
              <span className="text-3xl">👥</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">
              Coming Soon
            </h2>
            <p className="text-slate-400 max-w-md">
              Student Violation Management module is currently under
              development. Check back soon for updates.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="text-xs text-slate-500 text-center">
            ISAMS - Integrated Smart Academic Management System • College of
            Computer Studies © 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
