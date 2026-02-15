import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Monitor, CheckCircle2, User, Calendar, Clock, ArrowLeft } from "lucide-react";

// Lab name lookup
const labNames = {
  "lab-1": "Computer Laboratory 1",
  "lab-2": "Computer Laboratory 2",
  "lab-3": "Computer Laboratory 3",
  "lab-4": "Computer Laboratory 4",
};

export default function Success() {
  const navigate = useNavigate();
  const location = useLocation();
  const labId = location.state?.labId || "lab-1";
  const labName = location.state?.labName || labNames[labId] || "Computer Laboratory";
  const studentId = location.state?.studentId || "AB-12345";
  const [timestamp, setTimestamp] = useState("");

  // Mock student data
  const studentData = {
    id: studentId,
    name: "Juan Dela Cruz",
    program: "Bachelor of Science in Computer Science",
    year: "3rd Year",
  };

  useEffect(() => {
    const now = new Date();
    setTimestamp(
      now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }) +
        " — " +
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
    );

    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate("/kiosk-mode", { state: { labId, labName } });
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate, labId, labName]);

  const handleBackToKiosk = () => {
    navigate("/kiosk-mode", { state: { labId, labName } });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-900/20">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-100">
                  Check-In Successful
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  {labName} — Student Portal
                </p>
              </div>
            </div>
            <Button
              onClick={handleBackToKiosk}
              variant="outline"
              className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-slate-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Kiosk
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full flex items-center justify-center">
        <div className="w-full space-y-6">
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-green-600/20 blur-3xl rounded-full animate-pulse" />
              <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-green-900/30 border-2 border-green-700">
                <CheckCircle2 className="w-14 h-14 text-green-400 animate-in zoom-in duration-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-slate-100">
                Welcome!
              </h2>
              <p className="text-slate-400 text-lg">
                You have successfully checked in to {labName}
              </p>
            </div>
          </div>

          <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all duration-300">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-900/50 border border-blue-800/50">
                    <User className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                      Student Information
                    </p>
                    <h3 className="text-xl font-semibold text-slate-100 mb-1">
                      {studentData.name}
                    </h3>
                    <p className="text-sm text-slate-400">
                      ID: {studentData.id}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">
                        Program
                      </p>
                      <p className="text-sm text-slate-200 font-medium">
                        {studentData.program}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                    <User className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">
                        Year Level
                      </p>
                      <p className="text-sm text-slate-200 font-medium">
                        {studentData.year}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-900/30 border border-emerald-800/50">
                    <Clock className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">
                      Check-in Time
                    </p>
                    <p className="text-sm text-slate-200 font-medium">
                      {timestamp}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-900/30 border border-green-800/50">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-green-400 font-medium uppercase tracking-wider">
                    Active
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-sm text-slate-500">
              Returning to kiosk in <span className="text-slate-400 font-semibold">5 seconds</span>...
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="text-xs text-slate-500 text-center">
            ISAMS - Integrated Smart Academic Management System • College of Computer Studies © 2026
          </p>
        </div>
      </footer>
    </div>
  );
}