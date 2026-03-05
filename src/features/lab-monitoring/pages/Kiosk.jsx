import { useEffect, useRef, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient" 
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Monitor, ScanBarcode, ShieldAlert, UserCheck, Loader2, AlertTriangle } from "lucide-react"

// ZXing math engine
import { 
  MultiFormatReader, 
  BarcodeFormat, 
  DecodeHintType, 
  HTMLCanvasElementLuminanceSource, 
  BinaryBitmap, 
  HybridBinarizer 
} from '@zxing/library'

export default function Kiosk() {
  const slots = ["", "", "-", "", "", "", "", ""]
  const inputRef = useRef(null)
  
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const requestRef = useRef(null)

  const navigate = useNavigate()
  const location = useLocation()
  
  const labId = location.state?.labId || sessionStorage.getItem('active_lab_id') || "lab-1"
  const [labName, setLabName] = useState(location.state?.labName || sessionStorage.getItem('active_lab_name') || "Loading...")
  const [currentClass, setCurrentClass] = useState(null)
  const [idEntry, setIdEntry] = useState("")
  const [timestamp, setTimestamp] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [cameraStatus, setCameraStatus] = useState("loading")
  const [isProcessing, setIsProcessing] = useState(false)

  const sanitizedId = (value) => value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 7)

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

  useEffect(() => {
    const fetchLabInfo = async () => {
      const { data } = await supabase.from('laboratories_lm').select('db_name').eq('id', labId).maybeSingle();
      if (data) setLabName(data.db_name); 
      else setLabName(labId === "defense" ? "Defense" : "Lab 1");
    };
    fetchLabInfo();
  }, [labId]);

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

  // --- ZXING + CAMO SCANNER ENGINE ---
  useEffect(() => {
    if (isProcessing) return;

    let isMounted = true;
    let lastScanned = "";
    let lastScannedTime = 0;

    const startCamera = async () => {
      try {
        setCameraStatus("loading");

        await navigator.mediaDevices.getUserMedia({ video: true });
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        const phoneCam = videoDevices.find(device => {
            const name = device.label.toLowerCase();
            return name.includes("camo") || name.includes("iriun") || name.includes("droidcam");
        });

        const constraints = {
            video: phoneCam 
              ? { deviceId: { exact: phoneCam.deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
              : { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!isMounted) {
            stream.getTracks().forEach(t => t.stop());
            return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
        }

        if (isMounted) setCameraStatus("active");

        const codeReader = new MultiFormatReader();
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.CODE_128, 
            BarcodeFormat.CODE_39, 
            BarcodeFormat.QR_CODE
        ]);
        codeReader.setHints(hints);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        const scanFrame = () => {
            if (!isMounted || !videoRef.current || videoRef.current.readyState < 2) {
                requestRef.current = requestAnimationFrame(scanFrame);
                return;
            }

            const video = videoRef.current;
            
            if (canvas.width !== video.videoWidth) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }

            if (canvas.width > 0 && canvas.height > 0) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                try {
                    const luminanceSource = new HTMLCanvasElementLuminanceSource(canvas);
                    const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
                    const result = codeReader.decode(binaryBitmap);

                    if (result) {
                        const decodedText = result.getText();
                        const now = Date.now();
                        const cleaned = sanitizedId(decodedText);

                        if (!(cleaned === lastScanned && now - lastScannedTime < 2000)) {
                            lastScanned = cleaned;
                            lastScannedTime = now;

                            if (cleaned.length === 7) {
                                // Play a tiny beep sound on success!
                                try {
                                  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                                  const oscillator = audioCtx.createOscillator();
                                  oscillator.type = "sine";
                                  oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
                                  oscillator.connect(audioCtx.destination);
                                  oscillator.start();
                                  oscillator.stop(audioCtx.currentTime + 0.1);
                                } catch(e) {}

                                setIdEntry(cleaned);
                            }
                        }
                    }
                } catch (err) {
                }
            }

            requestRef.current = requestAnimationFrame(scanFrame);
        };

        requestRef.current = requestAnimationFrame(scanFrame);

      } catch (err) {
        console.error("Camera setup failed:", err);
        if (isMounted) setCameraStatus("error");
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isProcessing]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "K") {
        e.preventDefault()
        navigate("/lab-dashboard", { state: { labId, labName } })
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [navigate, labId, labName])

  useEffect(() => {
    if (sanitizedId(idEntry).length === 7 && currentClass && !isProcessing) {
      handleSubmitId(idEntry);
    }
    
  }, [idEntry, currentClass, isProcessing]);

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
  const handleKeyPress = (e) => e.key === "Enter" && sanitizedId(idEntry).length === 7 && handleSubmitId(idEntry)
  const focusInput = () => inputRef.current?.focus()

  const handleSubmitId = async (idToSubmit = idEntry) => {
    const cleanId = sanitizedId(idToSubmit);
    if (cleanId.length === 7) {
      setIsProcessing(true);
      const formattedId = cleanId.slice(0, 2) + "-" + cleanId.slice(2);
      
      try {
        const { data: student, error } = await supabase
          .from('students_lists_lm')
          .select('is_laptop_user')
          .eq('student_no', formattedId)
          .maybeSingle();

        if (error) throw error;
        
        if (!student) {
          alert("Student ID not found in the system. Please contact the Lab Admin.");
          setIdEntry(""); 
          setIsProcessing(false); 
          return;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }

        navigate("/success", { 
          state: { 
            labId, 
            labName, 
            studentId: formattedId, 
            scheduleId: currentClass?.id, 
            isLaptopUser: student.is_laptop_user 
          } 
        });

      } catch (err) {
        console.error("Kiosk lookup error:", err);
        alert("An error occurred during check-in. Please try again.");
        setIdEntry("");
        setIsProcessing(false);
      }
    }
  };

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
                <p className="text-xs text-slate-400 uppercase tracking-[0.15em] font-medium">Scan Barcode, QR Code, or Enter Manually</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative space-y-8">
            <div className="relative w-full max-w-2xl mx-auto rounded-xl border border-slate-700 bg-black/80 shadow-inner overflow-hidden flex flex-col items-center justify-center min-h-[350px]">

              {cameraStatus === 'loading' && (
                <div className="absolute flex flex-col items-center justify-center inset-0 gap-3 text-cyan-500 z-10 bg-slate-950">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="text-xs uppercase tracking-widest font-bold">Connecting Camera...</p>
                </div>
              )}

              {cameraStatus === 'error' && (
                <div className="absolute flex flex-col items-center justify-center inset-0 gap-3 text-rose-400 z-10 bg-slate-950">
                  <AlertTriangle className="w-10 h-10" />
                  <div className="text-center">
                    <p className="text-sm font-bold uppercase tracking-wider">Camera Error</p>
                    <p className="text-xs text-rose-400/70 mt-1">Make sure Camo Studio is running.</p>
                  </div>
                </div>
              )}

              <video 
                ref={videoRef} 
                className={`w-full max-h-[350px] object-contain transition-opacity duration-500 ${cameraStatus === 'active' ? 'opacity-100' : 'opacity-0'}`} 
                autoPlay 
                playsInline 
                muted 
              />

              {cameraStatus === 'active' && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div className="relative w-5/6 max-w-[500px] h-2/3 max-h-[300px]">
                    <div className={`absolute left-0 top-0 h-6 w-10 border-l-4 border-t-4 transition-colors ${isProcessing ? 'border-emerald-400' : 'border-cyan-400'}`} />
                    <div className={`absolute right-0 top-0 h-6 w-10 border-r-4 border-t-4 transition-colors ${isProcessing ? 'border-emerald-400' : 'border-cyan-400'}`} />
                    <div className={`absolute left-0 bottom-0 h-6 w-10 border-b-4 border-l-4 transition-colors ${isProcessing ? 'border-emerald-400' : 'border-cyan-400'}`} />
                    <div className={`absolute right-0 bottom-0 h-6 w-10 border-b-4 border-r-4 transition-colors ${isProcessing ? 'border-emerald-400' : 'border-cyan-400'}`} />
                    <div className={`absolute inset-x-0 top-1/2 h-0.5 transition-colors animate-pulse ${isProcessing ? 'bg-emerald-400' : 'bg-cyan-400/60'}`} />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-4">
              <div
                className="relative flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/60 px-5 py-4 cursor-text"
                onClick={focusInput}
              >
                <input
                  ref={inputRef}
                  className="absolute inset-0 h-full w-full opacity-0"
                  value={idEntry}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  disabled={isProcessing}
                />
                {visibleChars().map((char, idx) => (
                  <div
                    key={idx}
                    className={`relative flex h-12 w-12 items-center justify-center rounded-lg border text-lg font-semibold text-slate-100 md:h-14 md:w-14 transition-all duration-200 ${
                      slots[idx] === "-"
                        ? "w-10 border-transparent text-slate-500"
                        : isFocused && idx === getActiveSlotIndex()
                        ? "border-cyan-400 bg-slate-900/80 ring-1 ring-cyan-400/30"
                        : "border-slate-600 bg-slate-900/80"
                    }`}
                  >
                    {char || (slots[idx] === "-" ? "-" : "")}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Format: XX-XXXXX</p>
              
              {sanitizedId(idEntry).length === 7 && (
                <Button
                  onClick={() => handleSubmitId(idEntry)}
                  disabled={!currentClass || isProcessing}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-12 py-3 h-auto text-base font-bold uppercase tracking-widest shadow-lg disabled:opacity-30 transition-all min-w-[200px]"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Confirm Check-In"}
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