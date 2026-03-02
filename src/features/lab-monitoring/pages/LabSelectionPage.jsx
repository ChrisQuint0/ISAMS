import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Monitor, Plus, Trash2, Loader2, UserCheck, ShieldAlert } from "lucide-react";

const colorPalettes = [
  {
    bgColor: "bg-cyan-950/30",
    iconBg: "bg-cyan-900/50",
    iconBorder: "border-cyan-800/50",
    accentLine: "bg-gradient-to-r from-cyan-800/50 via-cyan-700/50 to-cyan-800/50",
  },
  {
    bgColor: "bg-blue-950/30",
    iconBg: "bg-blue-900/50",
    iconBorder: "border-blue-800/50",
    accentLine: "bg-gradient-to-r from-blue-800/50 via-blue-700/50 to-blue-800/50",
  },
  {
    bgColor: "bg-slate-900/50",
    iconBg: "bg-slate-800",
    iconBorder: "border-slate-700",
    accentLine: "bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700",
  },
  {
    bgColor: "bg-indigo-950/30",
    iconBg: "bg-indigo-900/50",
    iconBorder: "border-indigo-800/50",
    accentLine: "bg-gradient-to-r from-indigo-800/50 via-indigo-700/50 to-indigo-800/50",
  },
  {
    bgColor: "bg-sky-950/30",
    iconBg: "bg-sky-900/50",
    iconBorder: "border-sky-800/50",
    accentLine: "bg-gradient-to-r from-sky-800/50 via-sky-700/50 to-sky-800/50",
  },
  {
    bgColor: "bg-violet-950/30",
    iconBg: "bg-violet-900/50",
    iconBorder: "border-violet-800/50",
    accentLine: "bg-gradient-to-r from-violet-800/50 via-violet-700/50 to-violet-800/50",
  },
  {
    bgColor: "bg-teal-950/30",
    iconBg: "bg-teal-900/50",
    iconBorder: "border-teal-800/50",
    accentLine: "bg-gradient-to-r from-teal-800/50 via-teal-700/50 to-teal-800/50",
  },
];

export default function LabSelectionPage() {
  const navigate = useNavigate();
  const [laboratories, setLaboratories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [labToDelete, setLabToDelete] = useState(null);
  const [newLab, setNewLab] = useState({
    name: "",
    dbName: "",
    description: "",
    pcCount: "40",
    seatCount: "40",
  });

  const fetchLabs = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const today = now.toLocaleDateString("en-US", { weekday: "long" });

      const { data: labs, error } = await supabase
        .from('laboratories_lm')
        .select('*')
        .order('db_name', { ascending: true });

      if (error) throw error;

      // Fetch today's schedule for all rooms
      const { data: schedules } = await supabase
        .from('lab_schedules_lm')
        .select('*')
        .eq('day', today);

      const parseTimeToDate = (timeStr) => {
        if (!timeStr) return null;
        const [timePart, modifier] = timeStr.toLowerCase().split(/(am|pm)/);
        let [hours, minutes] = timePart.trim().split(':');
        let h = parseInt(hours, 10);
        if (modifier === 'pm' && h < 12) h += 12;
        if (modifier === 'am' && h === 12) h = 0;
        const d = new Date(now);
        d.setHours(h, parseInt(minutes, 10), 0, 0);
        return d;
      };

      const labsWithMetrics = await Promise.all(labs.map(async (lab) => {
        const { count } = await supabase
          .from('attendance_logs_lm')
          .select('id, lab_schedules_lm!inner(room)', { count: 'exact', head: true })
          .is('time_out', null)
          .eq('lab_schedules_lm.room', lab.db_name);

        // Determine if this specific lab has an ongoing class right now
        const activeSession = schedules?.find(s => {
          if (s.room !== lab.db_name) return false;
          const start = parseTimeToDate(s.time_start);
          const end = parseTimeToDate(s.time_end);
          return now >= start && now <= end;
        });
        
        return { 
          ...lab, 
          currentOccupancy: count || 0,
          activeSession: activeSession || null
        };
      }));

      setLaboratories(labsWithMetrics);
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
    const sub = supabase.channel('selection-room-updates')
      .on('postgres_changes', { event: '*', table: 'attendance_logs_lm' }, fetchLabs)
      .subscribe();
    
    // Auto-refresh the cards every minute to keep the Active Session badge accurate
    const intervalId = setInterval(fetchLabs, 60000);

    return () => {
      supabase.removeChannel(sub);
      clearInterval(intervalId);
    };
  }, []);

  const handleLabClick = (lab) => {
    sessionStorage.setItem('active_lab_id', lab.id);
    sessionStorage.setItem('active_lab_name', lab.db_name);
    
    navigate("/lab-dashboard", { 
      state: { labId: lab.id, labName: lab.db_name } 
    });
  };

  const handleAddLaboratory = async () => {
    if (!newLab.name.trim() || !newLab.dbName.trim()) return;

    try {
      const { error } = await supabase
        .from('laboratories_lm')
        .insert([{
          title: newLab.name.trim(),
          db_name: newLab.dbName.trim(),
          description: newLab.description.trim(),
          pc_count: parseInt(newLab.pcCount),
          seat_count: parseInt(newLab.seatCount)
        }]);

      if (error) throw error;
      fetchLabs();
      setDialogOpen(false);
      setNewLab({ name: "", dbName: "", description: "", pcCount: "40", seatCount: "40" });
    } catch (e) { 
      console.error(e); 
    }
  };

  const handleDeleteClick = (lab, e) => {
    e.stopPropagation();
    setLabToDelete(lab);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!labToDelete) return;
    try {
      await supabase.from('laboratories_lm').delete().eq('id', labToDelete.id);
      fetchLabs();
      setDeleteDialogOpen(false);
    } catch (e) { 
      console.error(e); 
    }
  };

  // Smart Layout Generator
  const getSmartGridLayout = (count) => {
    if (count === 1) return "grid-cols-1 max-w-2xl mx-auto w-full";
    if (count === 2) return "grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto w-full";
    if (count === 4) return "grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto w-full"; // Prevents 3 top, 1 bottom
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full"; // Default for 3, 5, 6+
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-900/20">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-100">Laboratory Monitoring</h1>
                <p className="text-sm text-slate-400 mt-0.5">Select a laboratory to manage</p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-slate-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to ISAMS Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">Available Laboratories</h2>
            <p className="text-slate-400 text-sm italic">Live occupancy metrics tracked across all registered rooms</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700">
                <Plus className="h-4 w-4 mr-2" /> Add Laboratory
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Laboratory</DialogTitle>
                <DialogDescription className="text-slate-400">Register a new room to the fleet registry.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-slate-300">Laboratory Name (Display)</Label>
                  <Input value={newLab.name} onChange={e => setNewLab({...newLab, name: e.target.value})} className="bg-slate-800 border-slate-700 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Room ID (e.g. "Lab 1" or "Defense")</Label>
                  <Input value={newLab.dbName} onChange={e => setNewLab({...newLab, dbName: e.target.value})} className="bg-slate-800 border-slate-700 text-white font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">PCs</Label>
                    <Input type="number" value={newLab.pcCount} onChange={e => setNewLab({...newLab, pcCount: e.target.value})} className="bg-slate-800 border-slate-700 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Seats</Label>
                    <Input type="number" value={newLab.seatCount} onChange={e => setNewLab({...newLab, seatCount: e.target.value})} className="bg-slate-800 border-slate-700 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Description</Label>
                  <Textarea value={newLab.description} onChange={e => setNewLab({...newLab, description: e.target.value})} className="bg-slate-800 border-slate-700 text-white resize-none h-20" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddLaboratory} className="bg-blue-600 hover:bg-blue-700 text-white w-full">Deploy Laboratory</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
             <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
             <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Polling Fleet Registry...</p>
          </div>
        ) : (
          <div className={`grid gap-6 transition-all duration-500 ease-in-out ${getSmartGridLayout(laboratories.length)}`}>
            {laboratories.map((lab, index) => {
              const palette = colorPalettes[index % colorPalettes.length];
              
              return (
                <div key={lab.id} onClick={() => handleLabClick(lab)} className="cursor-pointer h-full flex flex-col">
                  <Card className={`group relative overflow-hidden flex-1 ${palette.bgColor} border-slate-800 hover:border-slate-700 hover:shadow-xl transition-all duration-300`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 transition-all duration-500 pointer-events-none" />
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

                    <CardHeader className="relative pb-2">
                      <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-14 h-14 rounded-xl ${palette.iconBg} border ${palette.iconBorder} flex items-center justify-center group-hover:border-slate-600 transition-all duration-300`}>
                          <Monitor className="w-7 h-7 text-slate-200 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold text-slate-100 group-hover:text-white transition-colors duration-300">
                            {lab.title}
                          </CardTitle>
                          <div className="flex items-center gap-3 mt-1.5 font-mono">
                            <span className="text-xs text-slate-400">{lab.pc_count} PCs</span>
                            <span className="text-xs text-slate-600">•</span>
                            <span className="text-xs text-slate-400">{lab.seat_count} Seats</span>
                            <span className="text-xs text-slate-600">•</span>
                            <span className={`text-xs font-bold ${lab.currentOccupancy > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {lab.currentOccupancy} / {lab.seat_count} occupied
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost" size="icon"
                          onClick={(e) => handleDeleteClick(lab, e)}
                          className="flex-shrink-0 h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="relative pt-2 pb-5 flex flex-col justify-between h-full">
                      <p className="text-sm text-slate-400 italic line-clamp-2 leading-relaxed group-hover:text-slate-300 transition-colors mb-4">
                        {lab.description}
                      </p>
                      
                      {/* Active Session Status Badge */}
                      <div className="mt-2">
                        {lab.activeSession ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                            <UserCheck size={12} /> 
                            Active: {lab.activeSession.section_block} - {lab.activeSession.subject_name}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/50 border border-slate-700/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            <ShieldAlert size={12} /> 
                            Room Idle
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${palette.accentLine} scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
                  </Card>
                </div>
              );
            })}
          </div>
        )}

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-rose-500">Decommission Laboratory</DialogTitle>
              <DialogDescription className="text-slate-400 italic">
                Are you sure you want to remove <span className="font-semibold text-slate-300">{labToDelete?.title}</span>? This action is permanent in the registry.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-3 mt-4">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="bg-slate-800 border-slate-700 text-slate-300">Cancel</Button>
              <Button onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold">Decommission</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/30 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
            ISAMS - College of Computer Studies © 2026
          </p>
        </div>
      </footer>
    </div>
  );
}