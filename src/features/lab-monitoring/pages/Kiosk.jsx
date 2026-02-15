import { useEffect, useRef, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ArrowLeft, Monitor, ScanBarcode } from "lucide-react"

// Lab name lookup
const labNames = {
  "lab-1": "Computer Laboratory 1",
  "lab-2": "Computer Laboratory 2",
  "lab-3": "Computer Laboratory 3",
  "lab-4": "Computer Laboratory 4",
};

export default function Kiosk() {
  const slots = ["", "", "-", "", "", "", "", ""]
  const videoRef = useRef(null)
  const inputRef = useRef(null)
  const streamRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const labId = location.state?.labId || "lab-1"
  const labName = location.state?.labName || labNames[labId] || "Computer Laboratory"
  const [cameraError, setCameraError] = useState("")
  const [idEntry, setIdEntry] = useState("")
  const [timestamp, setTimestamp] = useState("")

  // Live clock
  useEffect(() => {
    const tick = () => {
      const now = new Date()
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
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Camera
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        setCameraError("Camera unavailable. Check permissions or connect a camera.")
      }
    }

    startCamera()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  const sanitizedId = (value) =>
    value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 7)

  const visibleChars = () => {
    const chars = sanitizedId(idEntry).split("")
    const output = []
    let idx = 0
    slots.forEach((slot) => {
      if (slot === "-") {
        output.push("-")
      } else {
        output.push(chars[idx] ?? "")
        idx += 1
      }
    })
    return output
  }

  const handleInputChange = (e) => {
    setIdEntry(sanitizedId(e.target.value))
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && sanitizedId(idEntry).length === 7) {
      handleSubmitId()
    }
  }

  const focusInput = () => {
    if (inputRef.current) inputRef.current.focus()
  }

  const handleSubmitId = () => {
    const cleanId = sanitizedId(idEntry)
    if (cleanId.length === 7) {
      // Format ID with dash (e.g., AB-12345)
      const formattedId = cleanId.slice(0, 2) + "-" + cleanId.slice(2)
      
      // Stop camera before navigating
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      
      navigate("/success", { state: { labId, labName, studentId: formattedId } })
    }
  }

  const handleBackClick = () => {
    // Stop camera before navigating
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
    navigate("/lab-dashboard", { state: { labId } })
  }

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
                  Kiosk Mode
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  {labName} — Lab Check-In
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400 hidden md:block">{timestamp}</span>
              <Button
                onClick={handleBackClick}
                variant="outline"
                className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-slate-100 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        <div className="md:hidden text-center mb-6">
          <p className="text-sm text-slate-400">{timestamp}</p>
        </div>

        <Card className="group relative overflow-hidden bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />

          <CardHeader className="relative pb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-900/50 border border-cyan-800/50">
                <ScanBarcode className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Student Check-In</h2>
                <p className="text-xs text-slate-400 uppercase tracking-[0.15em]">Scan Barcode or Enter ID Manually</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative space-y-8">
            <div>
              <div className="relative w-full overflow-hidden rounded-xl border border-slate-700 bg-black/60 shadow-inner">
                <div className="aspect-[16/9] w-full">
                  <video
                    ref={videoRef}
                    className="h-full w-full object-cover -scale-x-100"
                    autoPlay
                    playsInline
                    muted
                  />
                </div>
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute left-4 top-6 h-14 w-14 border-l-4 border-t-4 border-cyan-400/70" />
                  <div className="absolute right-4 top-6 h-14 w-14 border-r-4 border-t-4 border-cyan-400/70" />
                  <div className="absolute left-4 bottom-6 h-14 w-14 border-b-4 border-l-4 border-cyan-400/70" />
                  <div className="absolute right-4 bottom-6 h-14 w-14 border-b-4 border-r-4 border-cyan-400/70" />
                  <div className="absolute inset-x-12 top-1/2 border-t border-slate-300/40" />
                  <div className="absolute inset-y-8 left-1/2 border-l border-slate-300/40" />
                </div>
              </div>
              <p className="text-sm text-slate-300 text-center mt-4 font-medium">
                Align your Student ID Barcode Here
              </p>
              {cameraError && (
                <p className="text-sm text-red-400 text-center mt-2">{cameraError}</p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-700" />
              <span className="text-xs text-slate-500 uppercase tracking-widest">or enter manually</span>
              <div className="flex-1 h-px bg-slate-700" />
            </div>

            {/* Manual ID Entry */}
            <div className="flex flex-col items-center gap-4">
              <div
                className="relative flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/60 px-5 py-4 cursor-text hover:border-slate-600 transition-colors"
                onClick={focusInput}
              >
                <input
                  ref={inputRef}
                  aria-label="Student ID"
                  className="absolute inset-0 h-full w-full opacity-0"
                  value={idEntry}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                />
                {visibleChars().map((char, idx) => (
                  <div
                    key={`${char}-${idx}`}
                    className={`flex h-12 w-12 items-center justify-center rounded-lg border border-slate-600 bg-slate-900/80 text-lg font-semibold text-slate-100 md:h-14 md:w-14 ${
                      slots[idx] === "-" ? "w-10 md:w-12 border-transparent bg-transparent text-slate-500" : ""
                    }`}
                  >
                    {char || (slots[idx] === "-" ? "-" : "")}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                Format: XX-XXXXX (e.g. AB-12345)
              </p>
              
              {/* Submit Button - shows when ID is complete */}
              {sanitizedId(idEntry).length === 7 && (
                <Button
                  onClick={handleSubmitId}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-2 h-auto text-base font-medium shadow-lg shadow-cyan-900/30 transition-all duration-300"
                >
                  Check In
                </Button>
              )}
            </div>
          </CardContent>

          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-800/50 via-cyan-700/50 to-cyan-800/50 scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        </Card>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="text-xs text-slate-500 text-center">
            ISAMS - Integrated Smart Academic Management System • College of Computer Studies © 2026
          </p>
        </div>
      </footer>
    </div>
  )
}