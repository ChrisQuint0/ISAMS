import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Monitor, CheckCircle2, User, Calendar, Clock, ArrowLeft, Loader2, ShieldAlert } from "lucide-react";

export default function Success() {
  const navigate = useNavigate();
  const location = useLocation();
  const { studentId, scheduleId } = location.state || {};
  
  // Retrieve the anchored lab identity so navigation back to Kiosk is safe
  const labId = location.state?.labId || sessionStorage.getItem('kiosk_labId') || "lab-1";
  const labName = location.state?.labName || sessionStorage.getItem('kiosk_labName') || "Lab 1";
  
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timestamp, setTimestamp] = useState("");
  const [attendanceType, setAttendanceType] = useState(""); 
  const [restrictionMessage, setRestrictionMessage] = useState(""); 
  const [assignedPc, setAssignedPc] = useState(null);
  const [countdown, setCountdown] = useState(0); 
  
  const hasProcessed = useRef(false);

  const formatToAMPM = (date) => {
    return date.toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit", 
      hour12: true 
    });
  };

  useEffect(() => {
    const processAttendance = async () => {
      if (hasProcessed.current) return;
      hasProcessed.current = true;

      try {
        setLoading(true);
        const now = new Date();
        const amPmTime = formatToAMPM(now);
        setTimestamp(now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) + " — " + amPmTime);

        // --- 1. IDENTITY LOOKUP ---
        const { data: student, error: sError } = await supabase
          .from('students_lists_lm').select('*').eq('student_no', studentId).maybeSingle();

        if (sError || !student) throw new Error("Student not found");
        setStudentData(student);

        // PC calculation formatting: "PC - 10"
        const { data: sectionPeers } = await supabase
          .from('students_lists_lm').select('student_no')
          .eq('course', student.course).eq('year_level', student.year_level).eq('section_block', student.section_block)
          .order('full_name', { ascending: true });

        const rank = sectionPeers.findIndex(p => p.student_no === studentId);
        const pcNumber = rank !== -1 ? rank + 1 : 0;
        setAssignedPc(`PC - ${pcNumber}`); 

        // --- 2. ATTENDANCE LOGIC ---
        // Ensure we only find an open session for THIS specific class schedule
        const { data: activeLog } = await supabase
          .from('attendance_logs_lm')
          .select(`id, pc_no, lab_schedules_lm!inner (time_end, is_early_dismissal_active)`)
          .eq('student_no', studentId)
          .eq('schedule_id', scheduleId) 
          .is('time_out', null)
          .maybeSingle();

        if (activeLog) {
            // ==========================================
            // BRANCH A: TIMING OUT
            // ==========================================
            const schedule = activeLog.lab_schedules_lm;
            const parseTime = (timeStr) => {
              const [timePart, modifier] = timeStr.toLowerCase().split(/(am|pm)/);
              let [hours, minutes] = timePart.split(':');
              let h = parseInt(hours, 10);
              if (modifier === 'pm' && h < 12) h += 12;
              if (modifier === 'am' && h === 12) h = 0;
              const d = new Date(now);
              d.setHours(h, parseInt(minutes, 10), 0, 0);
              return d;
            };

            const endTimeDate = parseTime(schedule.time_end);
            
            if (!schedule.is_early_dismissal_active && now < endTimeDate) {
              setAttendanceType("Restricted");
              setRestrictionMessage(`Session ongoing. Time-out restricted until ${formatToAMPM(endTimeDate)}.`);
              setCountdown(8);
            } else {
              await supabase.from('attendance_logs_lm').update({ time_out: now.toISOString() }).eq('id', activeLog.id);
              setAttendanceType("Out");
              setCountdown(5); 
            }
        } else {
            // ==========================================
            // BRANCH B: NEW TIME IN
            // ==========================================
            
            if (!scheduleId) {
              setAttendanceType("Restricted");
              setRestrictionMessage("No active class session detected. Access is currently locked.");
              setCountdown(8); 
              setLoading(false);
              return;
            }

            // Execute Insertion directly. 
            // The Postgres trigger will block it if sections don't match.
            const { error: insError } = await supabase
                .from('attendance_logs_lm')
                .insert([{ 
                  student_no: studentId, 
                  schedule_id: scheduleId, 
                  time_in: now.toISOString(),
                  pc_no: pcNumber.toString(),
                  log_type: 'PC'
                }]);

            if (insError) {
                if (insError.code === '23505') {
                    setAttendanceType("Restricted");
                    setRestrictionMessage("Attendance already completed for this session.");
                    setCountdown(8);
                } else { 
                    // This will display the custom Postgres Trigger error message
                    setAttendanceType("Restricted");
                    setRestrictionMessage(`${insError.message}`);
                    setCountdown(8);
                }
            } else {
                setAttendanceType("In");
                setCountdown(5); 
            }
        }
      } catch (e) {
        console.error(e);
        setTimeout(() => navigate("/kiosk-mode", { state: { labId, labName } }), 3000);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) processAttendance();
    else navigate("/kiosk-mode");
  }, [navigate, studentId, scheduleId, labId, labName]);

  // BULLETPROOF TIMER
  useEffect(() => {
    let intervalId;
    if (!loading && countdown > 0) {
      intervalId = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(intervalId);
            navigate("/kiosk-mode", { state: { labId, labName } });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [loading, countdown, navigate, labId, labName]);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
        <p className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">Validating Session...</p>
    </div>
  );

  const isRestricted = attendanceType === "Restricted";
  const sectionBlockFormatted = studentData ? `${studentData.course}-${studentData.year_level}${studentData.section_block}` : "N/A";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <header className={`border-b ${isRestricted ? 'border-rose-800 bg-rose-950/20' : 'border-slate-800 bg-slate-900/50'} backdrop-blur-sm sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${isRestricted ? 'bg-rose-600' : 'bg-blue-600'} text-white shadow-lg`}>
                {isRestricted ? <ShieldAlert size={20} /> : <Monitor size={20} />}
              </div>
              <h1 className="text-2xl font-semibold text-slate-100 uppercase tracking-tight">
                {isRestricted ? "Access Restricted" : `Check-${attendanceType} Successful`}
              </h1>
            </div>
            <Button onClick={() => navigate("/kiosk-mode", { state: { labId, labName } })} variant="outline" className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Kiosk
            </Button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full flex items-center justify-center">
        <div className="w-full space-y-6">
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <div className="relative">
              <div className={`absolute inset-0 ${isRestricted ? 'bg-rose-600/20' : 'bg-green-600/20'} blur-3xl rounded-full animate-pulse`} />
              <div className={`relative flex items-center justify-center w-24 h-24 rounded-full ${isRestricted ? 'bg-rose-900/30 border-rose-700' : 'bg-green-900/30 border-green-700'} border-2`}>
                {isRestricted ? <ShieldAlert className="w-14 h-14 text-rose-400" /> : <CheckCircle2 className="w-14 h-14 text-green-400 animate-in zoom-in duration-500" />}
              </div>
            </div>
            <div className="space-y-2">
              <h2 className={`text-4xl font-black uppercase tracking-tighter ${isRestricted ? 'text-rose-500' : 'text-slate-100'}`}>
                {isRestricted ? "Denied" : "Access Confirmed"}
              </h2>
              <p className="text-slate-400 text-lg">
                {isRestricted ? restrictionMessage : "Welcome to the laboratory!"}
              </p>
            </div>
          </div>

          <Card className={`bg-slate-900/50 border-slate-800 shadow-2xl transition-all duration-300 ${isRestricted ? 'ring-1 ring-rose-500/30' : 'hover:border-slate-700'}`}>
            <CardContent className="p-8 space-y-6 text-left">
              <div className="space-y-4">
                <div className="flex items-start gap-6 pb-6 border-b border-slate-800">
                  <div className={`flex items-center justify-center w-16 h-16 rounded-2xl ${isRestricted ? 'bg-rose-900/50 border-rose-800/50' : 'bg-blue-900/50 border-blue-800/50'} border`}>
                    <User className={`w-8 h-8 ${isRestricted ? 'text-rose-400' : 'text-blue-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Assigned Workstation</p>
                    <h3 className="text-6xl font-black text-white tracking-tighter tabular-nums">{assignedPc || "PC - 00"}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <User className="w-5 h-5 text-slate-400" />
                    <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Student</p><p className="text-sm text-slate-200 font-medium truncate">{studentData?.full_name || "Guest"}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Section Block</p><p className="text-sm text-slate-200 font-medium">{sectionBlockFormatted}</p></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl border ${isRestricted ? 'bg-rose-900/30 border-rose-800/50' : 'bg-emerald-900/30 border-emerald-800/50'}`}>
                    <Clock className={`w-6 h-6 ${isRestricted ? 'text-rose-400' : 'text-emerald-400'}`} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isRestricted ? 'Attempted At' : `Time Recorded`}</p>
                    <p className={`text-sm font-bold tabular-nums ${isRestricted ? 'text-rose-400' : 'text-slate-200'}`}>{timestamp.split(' — ')[1]}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isRestricted ? 'bg-rose-900/30 border-rose-800/50' : 'bg-green-900/30 border-green-800/50'}`}>
                  <div className={`w-2 h-2 rounded-full ${isRestricted ? 'bg-rose-500' : 'bg-green-500'} animate-pulse`} />
                  <span className={`text-xs font-black uppercase tracking-widest ${isRestricted ? 'text-rose-400' : 'text-green-400'}`}>
                    {isRestricted ? 'Denied' : attendanceType === "In" ? "Entering" : "Exiting"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center pt-4">
            <p className="text-[10px] text-slate-600 uppercase tracking-[0.3em]">
              Returning to scan mode in <span className="text-slate-400 font-black tabular-nums">{countdown} seconds</span>...
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/30 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 text-xs text-slate-500 text-center uppercase tracking-[0.2em]">
            ISAMS - College of Computer Studies © 2026
        </div>
      </footer>
    </div>
  );
}