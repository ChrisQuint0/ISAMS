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
import { ArrowLeft, Monitor, Plus, Trash2, Loader2, UserCheck, ShieldAlert, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const colorPalettes = [
  {
    bgColor: "bg-green-600/10",
    iconBg: "bg-green-600/20",
    iconBorder: "border-green-500/30",
    accentLine: "bg-gradient-to-r from-green-600/50 via-green-500/50 to-green-600/50",
    iconColor: "text-green-600",
    semanticRole: "success",
  },
  {
    bgColor: "bg-yellow-600/10",
    iconBg: "bg-yellow-600/20",
    iconBorder: "border-yellow-500/30",
    accentLine: "bg-gradient-to-r from-yellow-600/50 via-yellow-500/50 to-yellow-600/50",
    iconColor: "text-yellow-600",
    semanticRole: "warning",
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
  const [alert, setAlert] = useState(null);

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
      setAlert({ type: 'success', title: 'Laboratory Added', description: `${newLab.name.trim()} has been deployed to the registry.` });
      setDialogOpen(false);
      setNewLab({ name: "", dbName: "", description: "", pcCount: "40", seatCount: "40" });
      setTimeout(() => setAlert(null), 4000);
    } catch (e) { 
      console.error(e);
      setAlert({ type: 'destructive', title: 'Failed to Add Laboratory', description: 'Unable to deploy laboratory to registry. Please try again.' });
      setTimeout(() => setAlert(null), 4000);
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
      setAlert({ type: 'success', title: 'Laboratory Decommissioned', description: `${labToDelete.title} has been removed from the registry.` });
      setDeleteDialogOpen(false);
      setTimeout(() => setAlert(null), 4000);
    } catch (e) { 
      console.error(e);
      setAlert({ type: 'destructive', title: 'Failed to Decommission', description: 'Unable to remove laboratory from registry. Please try again.' });
      setTimeout(() => setAlert(null), 4000);
    }
  };

  const getSmartGridLayout = (count) => {
    if (count === 1) return "grid-cols-1 max-w-4xl mx-auto w-full";
    if (count === 2) return "grid-cols-1 md:grid-cols-2 w-full";
    if (count === 4) return "grid-cols-1 md:grid-cols-2 w-full";
    return "grid-cols-1 md:grid-cols-2 w-full";
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
      <header className="border-b border-neutral-200 bg-neutral-100/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-700/20">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-neutral-900">Laboratory Monitoring</h1>
                <p className="text-sm text-neutral-500 mt-0.5">Select a laboratory to manage</p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to ISAMS Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
        {alert && (
          <Alert variant={alert.type} className="mb-6">
            {alert.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.description}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Available Laboratories</h2>
            <p className="text-neutral-500 text-sm italic">Live occupancy metrics tracked across all registered rooms</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" /> Add Laboratory
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-50 border-neutral-200 text-neutral-900 sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Laboratory</DialogTitle>
                <DialogDescription>Register a new room to the fleet registry.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="lab-name">Laboratory Name (Display)</Label>
                  <Input id="lab-name" value={newLab.name} onChange={e => setNewLab({...newLab, name: e.target.value})} placeholder="Display name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room-id">Room ID</Label>
                  <Input id="room-id" value={newLab.dbName} onChange={e => setNewLab({...newLab, dbName: e.target.value})} placeholder="e.g. 'Lab 1' or 'Defense'" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pc-count">PCs</Label>
                    <Input id="pc-count" type="number" value={newLab.pcCount} onChange={e => setNewLab({...newLab, pcCount: e.target.value})} placeholder="40" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seat-count">Seats</Label>
                    <Input id="seat-count" type="number" value={newLab.seatCount} onChange={e => setNewLab({...newLab, seatCount: e.target.value})} placeholder="40" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={newLab.description} onChange={e => setNewLab({...newLab, description: e.target.value})} className="resize-none h-20" placeholder="Brief description..." />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddLaboratory} variant="default" className="w-full">Deploy Laboratory</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
             <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
             <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">Polling Fleet Registry...</p>
          </div>
        ) : (
          <div className={`grid gap-6 transition-all duration-500 ease-in-out ${getSmartGridLayout(laboratories.length)}`}>
            {laboratories.map((lab, index) => {
              const palette = colorPalettes[index % colorPalettes.length];
              
              return (
                <div key={lab.id} onClick={() => handleLabClick(lab)} className="cursor-pointer h-full flex flex-col">
                  <Card className={`group relative overflow-hidden flex-1 bg-neutral-50 hover:bg-neutral-100 border-neutral-200 hover:border-neutral-300 hover:shadow-xl transition-all duration-300`}>
                    <CardHeader className="relative pb-2">
                      <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-14 h-14 rounded-xl ${palette.iconBg} border ${palette.iconBorder} flex items-center justify-center group-hover:border-neutral-300 transition-all duration-300`}>
                          <Monitor className={`w-7 h-7 ${palette.iconColor} group-hover:scale-110 transition-transform duration-300`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold text-neutral-900 transition-colors duration-300">
                            {lab.title}
                          </CardTitle>
                          <div className="flex items-center gap-3 mt-1.5 font-mono">
                            <span className="text-xs text-neutral-500">{lab.pc_count} PCs</span>
                            <span className="text-xs text-neutral-400">•</span>
                            <span className="text-xs text-neutral-500">{lab.seat_count} Seats</span>
                            <span className="text-xs text-neutral-400">•</span>
                            <span className={`text-xs font-bold ${lab.currentOccupancy > 0 ? 'text-success' : 'text-neutral-500'}`}>
                              {lab.currentOccupancy} / {lab.seat_count} occupied
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="destructive" size="icon"
                          onClick={(e) => handleDeleteClick(lab, e)}
                          className="flex-shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="relative pt-2 pb-5 flex flex-col justify-between h-full">
                      <p className="text-sm text-neutral-500 italic line-clamp-2 leading-relaxed group-hover:text-neutral-600 transition-colors mb-4">
                        {lab.description}
                      </p>
                      
                      <div className="mt-2">
                        {lab.activeSession ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-success/10 border border-success/20 text-success text-[10px] font-black uppercase tracking-widest">
                            <UserCheck size={12} /> 
                            Active: {lab.activeSession.section_block} - {lab.activeSession.subject_name}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 border border-neutral-200 text-neutral-500 text-[10px] font-black uppercase tracking-widest">
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
          <DialogContent className="bg-neutral-50 border-neutral-200 text-neutral-900 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-destructive-semantic">Decommission Laboratory</DialogTitle>
              <DialogDescription className="text-neutral-500 italic">
                Are you sure you want to remove <span className="font-semibold text-neutral-900">{labToDelete?.title}</span>? This action is permanent in the registry.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-3 mt-4">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>Decommission</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>

      <footer className="border-t border-neutral-200 bg-neutral-100/30 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center">
          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em]">
            ISAMS - College of Computer Studies © 2026
          </p>
        </div>
      </footer>
    </div>
  );
}