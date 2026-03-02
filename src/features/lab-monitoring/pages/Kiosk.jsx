import { useEffect, useRef, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient" 
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Monitor, ScanBarcode, ShieldAlert, UserCheck, Loader2 } from "lucide-react"

export default function Kiosk() {
  const slots = ["", "", "-", "", "", "", "", ""]
  const videoRef = useRef(null)
  const inputRef = useRef(null)
  const streamRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  
  // FIX: Make sure the ID and Name are permanently locked from memory
  const labId = location.state?.labId || sessionStorage.getItem('active_lab_id') || "lab-1"
  
  const [labName, setLabName] = useState(location.state?.labName || sessionStorage.getItem('active_lab_name') || "Loading...")
  const [currentClass, setCurrentClass] = useState(null)
  const [cameraError, setCameraError] = useState("")
  const [idEntry, setIdEntry] = useState("")
  const [timestamp, setTimestamp] = useState("")
  const [isFocused, setIsFocused] = useState(false)

  const formatToAMPM = (timeStr) => {
    if (!timeStr) return "";
    if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr;
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHours = h % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTimestamp(
        now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) +
        " — " +
        now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  /**
   * 1. RESOLVE LABORATORY IDENTITY
   */
  useEffect(() => {
    const fetchLabInfo = async () => {
      const { data } = await supabase
        .from('laboratories_lm')
        .select('db_name')
        .eq('id', labId)
        .maybeSingle();

      if (data) {
        setLabName(data.db_name); 
      } else {
        setLabName(labId === "defense" ? "Defense" : "Lab 1");
      }
    };
    fetchLabInfo();
  }, [labId]);

  /**
   * 2. ROBUST SESSION DETECTION
   */
  useEffect(() => {
    const fetchActiveSession = async () => {
      if (labName === "Loading...") return;

      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const now = new Date();
      const today = dayNames[now.getDay()];

      const { data: sessions, error } = await supabase
        .from('lab_schedules_lm')
        .select('*')
        .eq('day', today)
        .eq('room', labName); 

      if (error || !sessions) return;

      const parseTimeToDate = (timeStr) => {
        if (!timeStr) return null;
        const d = new Date(now);
        const parts = timeStr.split(':');
        d.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
        return d;
      };

      const active = sessions.find(session => {
        const start = parseTimeToDate(session.time_start);
        const end = parseTimeToDate(session.time_end);
        return now >= start && now <= end;
      });

      setCurrentClass(active || null);
    };

    fetchActiveSession();
    const interval = setInterval(fetchActiveSession, 30000); 
    return () => clearInterval(interval);
  }, [labName]);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch (err) {
        setCameraError("Camera unavailable.")
      }
    }
    startCamera()
    return () => streamRef.current?.getTracks().forEach((t) => t.stop())
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "K") {
        e.preventDefault()
        if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop())
        // Keep sending the memory-locked lab ID back to dashboard
        navigate("/lab-dashboard", { state: { labId, labName } })
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [navigate, labId, labName])

  const sanitizedId = (value) => value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 7)
  const visibleChars = () => {
    const chars = sanitizedId(idEntry).split("")
    const output = []
    let idx = 0
    slots.forEach((slot) => {
      if (slot === "-") output.push("-")
      else { output.push(chars[idx] ?? ""); idx += 1 }
    })
    return output
  }

  const getActiveSlotIndex = () => {
    const len = sanitizedId(idEntry).length
    if (len >= 7) return -1 
    return len < 2 ? len : len + 1;
  }

  const handleInputChange = (e) => setIdEntry(sanitizedId(e.target.value))
  const handleKeyPress = (e) => e.key === "Enter" && sanitizedId(idEntry).length === 7 && handleSubmitId()
  const focusInput = () => inputRef.current?.focus()

  const handleSubmitId = () => {
    const cleanId = sanitizedId(idEntry)
    if (cleanId.length === 7) {
      const formattedId = cleanId.slice(0, 2) + "-" + cleanId.slice(2)
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop())
      navigate("/success", { 
        state: { 
          labId, 
          labName, 
          studentId: formattedId, 
          scheduleId: currentClass?.id 
        } 
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-lg">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-100 uppercase tracking-tight">Kiosk Mode</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm text-slate-400 font-medium">{labName}</p>
                <span className="text-slate-600 text-xs">—</span>
                {currentClass ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                    <UserCheck size={10} /> Active: {currentClass.subject_name} ({formatToAMPM(currentClass.time_start)} - {formatToAMPM(currentClass.time_end)})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                    <ShieldAlert size={10} /> No Active Session
                  </span>
                )}
              </div>
            </div>
          </div>
          <span className="text-sm text-slate-400 hidden md:block font-mono tracking-wider">{timestamp}</span>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        <Card className="group relative overflow-hidden bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all duration-300">
          <CardHeader className="relative pb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-900/50 border border-cyan-800/50">
                <ScanBarcode className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100 font-sans tracking-tight">Student Check-In</h2>
                <p className="text-xs text-slate-400 uppercase tracking-[0.15em] font-medium">Scan Barcode or Enter ID Manually</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative space-y-8">
            <div className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-xl border border-slate-700 bg-black/60 shadow-inner">
               <div className="aspect-[16/9] w-full">
                  <video ref={videoRef} className="h-full w-full object-cover -scale-x-100" autoPlay playsInline muted />
               </div>
               <div className="pointer-events-none absolute inset-0">
                  <div className="absolute left-4 top-6 h-14 w-14 border-l-4 border-t-4 border-cyan-400/70" />
                  <div className="absolute right-4 top-6 h-14 w-14 border-r-4 border-t-4 border-cyan-400/70" />
                  <div className="absolute left-4 bottom-6 h-14 w-14 border-b-4 border-l-4 border-cyan-400/70" />
                  <div className="absolute right-4 bottom-6 h-14 w-14 border-b-4 border-r-4 border-cyan-400/70" />
               </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="relative flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/60 px-5 py-4 cursor-text" onClick={focusInput}>
                <input ref={inputRef} className="absolute inset-0 h-full w-full opacity-0" value={idEntry} onChange={handleInputChange} onKeyPress={handleKeyPress} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} />
                {visibleChars().map((char, idx) => (
                  <div key={idx} className={`relative flex h-12 w-12 items-center justify-center rounded-lg border text-lg font-semibold text-slate-100 md:h-14 md:w-14 transition-all duration-200 ${
                      slots[idx] === "-" ? "w-10 border-transparent text-slate-500" : isFocused && idx === getActiveSlotIndex() ? "border-cyan-400 bg-slate-900/80 ring-1 ring-cyan-400/30" : "border-slate-600 bg-slate-900/80"
                  }`}>
                    {char || (slots[idx] === "-" ? "-" : "")}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Format: XX-XXXXX</p>
              {sanitizedId(idEntry).length === 7 && (
                <Button onClick={handleSubmitId} disabled={!currentClass} className="bg-cyan-600 hover:bg-cyan-700 text-white px-12 py-3 h-auto text-base font-bold uppercase tracking-widest shadow-lg disabled:opacity-30 transition-all">
                  Confirm Check-In
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6 py-6 text-[10px] text-slate-700 text-center font-black uppercase tracking-[0.5em]">
            ISAMS — College of Computer Studies Laboratory Management © 2026
        </div>
      </footer>
    </div>
  )
}