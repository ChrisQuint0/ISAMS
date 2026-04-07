import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { logAuditEvent } from "../utils/auditLogger";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Monitor, CheckCircle2, User, Calendar, Clock, ArrowLeft, Loader2, ShieldAlert, Laptop as LaptopIcon } from "lucide-react";

export default function Success() {
  const navigate = useNavigate();
  const location = useLocation();

  const { studentId, scheduleId, isLaptopUser } = location.state || {};
  const labId = location.state?.labId || sessionStorage.getItem('kiosk_labId') || "lab-1";
  const labName = location.state?.labName || sessionStorage.getItem('kiosk_labName') || "Lab 1";

  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timestamp, setTimestamp] = useState("");
  const [attendanceType, setAttendanceType] = useState("");
  const [restrictionMessage, setRestrictionMessage] = useState("");
  const [assignedPc, setAssignedPc] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [isLaptopMode, setIsLaptopMode] = useState(false);

  const hasProcessed = useRef(false);

  const formatToAMPM = (date) => {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  useEffect(() => {
    const processAttendance = async () => {
      if (hasProcessed.current) return;
      hasProcessed.current = true;

      try {
        setLoading(true);
        const now = new Date();
        setTimestamp(now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) + " — " + formatToAMPM(now));

        // 1. IDENTITY LOOKUP
        const { data: student, error: sError } = await supabase
          .from('students_lists_lm')
          .select('*, is_laptop_user')
          .eq('student_no', studentId)
          .maybeSingle();

        if (sError || !student) throw new Error("Student not found");
        setStudentData(student);

        // SYNC STATE: Enforce boolean logic for Laptop Users
        const isLaptop = Boolean(isLaptopUser === true || student.is_laptop_user === true);
        setIsLaptopMode(isLaptop);

        // 2. CHECK IF LOGGING OUT
        const { data: activeLog } = await supabase
          .from('attendance_logs_lm')
          .select(`id, pc_no, lab_schedules_lm!inner (time_end, is_early_dismissal_active)`)
          .eq('student_no', studentId)
          .eq('schedule_id', scheduleId)
          .is('time_out', null)
          .maybeSingle();

        if (activeLog) {
          // OUT LOGIC
          const cleanPcNo = activeLog.pc_no ? activeLog.pc_no.replace('PC-', '') : "";
          const paddedPcNo = cleanPcNo ? cleanPcNo.padStart(2, '0') : "";
          setAssignedPc(paddedPcNo ? `PC - ${paddedPcNo}` : "Laptop");

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
            await logAuditEvent({
              labName: labName,
              actor: "System",
              category: "Student Logs",
              action: "Student Time-Out",
              description: `${student.full_name} (${studentId}) timed out from ${paddedPcNo ? `PC-${paddedPcNo}` : "Laptop"}.`,
              severity: "Info"
            });
            setAttendanceType("Out");
            setCountdown(5);
          }
        } else {
          // IN LOGIC
          if (!scheduleId) {
            setAttendanceType("Restricted");
            setRestrictionMessage("No active class session detected.");
            setCountdown(8);
            setLoading(false);
            return;
          }

          // FETCH SETTINGS
          const { data: labSettings } = await supabase.from('lab_settings_lm').select('*').eq('lab_name', labName).maybeSingle();
          const hardCapacity = labSettings ? labSettings.hard_capacity : true;
          const autoAssignment = labSettings ? labSettings.auto_assignment : true;

          // FETCH ACTIVE SESSIONS FOR CURRENT LAB
          const { data: activeSessions } = await supabase
            .from('attendance_logs_lm')
            .select('pc_no, lab_schedules_lm!inner(room)')
            .eq('lab_schedules_lm.room', labName)
            .is('time_out', null);

          const activeCount = activeSessions ? activeSessions.length : 0;

          if (hardCapacity && activeCount >= 40) {
            setAttendanceType("Restricted");
            setRestrictionMessage("Laboratory at Maximum Capacity");
            setCountdown(8);
            setLoading(false);
            return;
          }

          let finalPcNo = "0";
          if (isLaptop) {
            finalPcNo = null;
            setAssignedPc("Laptop");
          } else {
            if (autoAssignment) {
              const { data: sectionPeers } = await supabase
                .from('students_lists_lm').select('student_no, full_name, is_laptop_user')
                .eq('course', student.course).eq('year_level', student.year_level).eq('section_block', student.section_block)
                .order('full_name', { ascending: true });

              const pcPeers = sectionPeers ? sectionPeers.filter(p => !p.is_laptop_user) : [];
              const rankIndex = pcPeers.findIndex(p => p.student_no === studentId);
              const studentRank = rankIndex !== -1 ? rankIndex + 1 : activeCount + 1;

              if (hardCapacity && studentRank > 40) {
                setAttendanceType("Restricted");
                setRestrictionMessage(`Access Denied: Section rank ${studentRank} exceeds laboratory capacity of 40.`);
                setCountdown(8);
                setLoading(false);
                return;
              }

              let pcNumber = studentRank;
              if (pcNumber > 40) pcNumber = 40;
              finalPcNo = pcNumber.toString().padStart(2, '0');
            } else {
              const occupiedArray = (activeSessions || [])
                .map(s => parseInt(s.pc_no, 10))
                .filter(n => !isNaN(n) && n >= 1 && n <= 40);
              const occupiedSet = new Set(occupiedArray);

              let found = 0;
              for (let i = 1; i <= 40; i++) {
                if (!occupiedSet.has(i)) {
                  found = i;
                  break;
                }
              }
              if (found === 0) found = Math.min(activeCount + 1, 40);
              finalPcNo = found.toString().padStart(2, '0');
            }
          }

          // INSERT ATTENDANCE
          const { data: insData, error: insError } = await supabase
            .from('attendance_logs_lm')
            .insert([{
              student_no: studentId,
              schedule_id: scheduleId,
              time_in: now.toISOString(),
              pc_no: finalPcNo,
              log_type: isLaptop ? 'Laptop' : 'PC'
            }])
            .select()
            .single();

          if (insError) {
            setAttendanceType("Restricted");
            setRestrictionMessage(insError.code === '23505' ? "Attendance already completed for this session." : insError.message);
            setCountdown(8);
          } else {
            const actualPcNo = insData && insData.pc_no ? insData.pc_no.padStart(2, '0') : "";
            setAssignedPc(actualPcNo ? `PC - ${actualPcNo}` : "Laptop");

            await logAuditEvent({
              labName: labName,
              actor: "System",
              category: "Student Logs",
              action: "Student Time-In",
              description: `${student.full_name} (${studentId}) timed in at ${actualPcNo ? `PC-${actualPcNo}` : "Laptop"}.`,
              severity: "Info"
            });
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
    else setTimeout(() => navigate("/kiosk-mode"), 0);
  }, [navigate, studentId, scheduleId, labId, labName, isLaptopUser]);

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
    return () => clearInterval(intervalId);
  }, [loading, countdown, navigate, labId, labName]);

  if (loading) return (
    <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
      <p className="text-neutral-500 font-mono text-[10px] tracking-widest uppercase">Validating Session...</p>
    </div>
  );

  const isRestricted = attendanceType === "Restricted";
  const sectionBlockFormatted = studentData ? `${studentData.course}-${studentData.year_level}${studentData.section_block}` : "N/A";

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans">
      <header className={`border-b ${isRestricted ? 'border-destructive-semantic/20 bg-destructive-semantic/5' : 'border-neutral-200 bg-neutral-100'} sticky top-0 z-50 shadow-sm`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${isRestricted ? 'bg-destructive-semantic' : 'bg-primary-500'} text-white shadow-md`}>
              {isRestricted ? <ShieldAlert size={20} /> : <Monitor size={20} />}
            </div>
            <h1 className="text-2xl font-semibold text-neutral-900 uppercase tracking-tight">
              {isRestricted ? "Access Restricted" : `Check-${attendanceType} Successful`}
            </h1>
          </div>
          <Button onClick={() => navigate("/kiosk-mode", { state: { labId, labName } })} variant="outline" className="bg-white text-neutral-900 border-neutral-200 hover:bg-neutral-200">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Kiosk
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full flex items-center justify-center">
        <div className="w-full space-y-6">
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <div className="relative">
              <div className={`flex items-center justify-center w-24 h-24 rounded-full ${isRestricted ? 'bg-destructive-semantic/10 border-destructive-semantic/30' : 'bg-success/10 border-success/30'} border-2 shadow-md`}>
                {isRestricted ? <ShieldAlert className={`w-14 h-14 ${isRestricted ? 'text-destructive-semantic' : 'text-success'}`} /> : <CheckCircle2 className={`w-14 h-14 ${isRestricted ? 'text-destructive-semantic' : 'text-success'} animate-in zoom-in duration-500`} />}
              </div>
            </div>

            <div className="space-y-2">
              <h2 className={`text-4xl font-black uppercase tracking-tighter ${isRestricted ? 'text-destructive-semantic' : 'text-neutral-900'}`}>
                {isRestricted ? "Denied" : attendanceType === "Out" ? "Session Complete" : "Access Confirmed"}
              </h2>
              <p className="text-neutral-600 text-lg">
                {isRestricted
                  ? restrictionMessage
                  : attendanceType === "Out"
                    ? "You have successfully signed out of the laboratory."
                    : "Welcome to the laboratory!"}
              </p>
            </div>
          </div>

          <Card className={`bg-white border-neutral-200 shadow-md transition-all duration-300 ${isRestricted ? 'ring-1 ring-destructive-semantic/20' : 'hover:border-neutral-300'}`}>
            <CardContent className="p-8 space-y-6 text-left">
              <div className="space-y-4">
                <div className="flex items-start gap-6 pb-6 border-b border-neutral-200">
                  <div className={`flex items-center justify-center w-16 h-16 rounded-2xl ${isRestricted ? 'bg-destructive-semantic/10 border-destructive-semantic/20' : isLaptopMode ? 'bg-primary-500/10 border-primary-500/20' : 'bg-primary-500/10 border-primary-500/20'} border shadow-sm`}>
                    {isLaptopMode && !isRestricted ? <LaptopIcon className="w-8 h-8 text-primary-600" /> : <User className={`w-8 h-8 ${isRestricted ? 'text-destructive-semantic' : 'text-primary-600'}`} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">
                      {isLaptopMode && !isRestricted ? "Device Mode" : "Assigned Workstation"}
                    </p>
                    <h3 className={`text-4xl font-black tracking-tighter tabular-nums ${isLaptopMode && !isRestricted ? "text-primary-600" : "text-neutral-900"}`}>
                      {assignedPc}
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-100 border border-neutral-200 shadow-sm">
                    <User className="w-5 h-5 text-neutral-500" />
                    <div><p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Student</p><p className="text-sm text-neutral-900 font-medium truncate">{studentData?.full_name || "Guest"}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-100 border border-neutral-200 shadow-sm">
                    <Calendar className="w-5 h-5 text-neutral-500" />
                    <div><p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Section Block</p><p className="text-sm text-neutral-900 font-medium">{sectionBlockFormatted}</p></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl border ${isRestricted ? 'bg-destructive-semantic/10 border-destructive-semantic/20' : 'bg-success/10 border-success/20'} shadow-sm`}>
                    <Clock className={`w-6 h-6 ${isRestricted ? 'text-destructive-semantic' : 'text-success'}`} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{isRestricted ? 'Attempted At' : `Time Recorded`}</p>
                    <p className={`text-sm font-bold tabular-nums ${isRestricted ? 'text-destructive-semantic' : 'text-neutral-900'}`}>{timestamp.split(' — ')[1]}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isRestricted ? 'bg-destructive-semantic/10 border-destructive-semantic/20' : 'bg-success/10 border-success/20'} shadow-sm`}>
                  <div className={`w-2 h-2 rounded-full ${isRestricted ? 'bg-destructive-semantic' : 'bg-success'} animate-pulse`} />
                  <span className={`text-xs font-black uppercase tracking-widest ${isRestricted ? 'text-destructive-semantic' : 'text-success'}`}>
                    {isRestricted ? 'Denied' : attendanceType === "In" ? (isLaptopMode ? "Laptop In" : "Entering") : "Exiting"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center pt-4">
            <p className="text-[10px] text-neutral-600 uppercase tracking-[0.3em]">
              Returning to scan mode in <span className="text-neutral-700 font-black tabular-nums">{countdown} seconds</span>...
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}