import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { ArrowLeft, Monitor, Plus, Trash2 } from "lucide-react";

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
    bgColor: "bg-purple-950/30",
    iconBg: "bg-purple-900/50",
    iconBorder: "border-purple-800/50",
    accentLine: "bg-gradient-to-r from-purple-800/50 via-purple-700/50 to-purple-800/50",
  },
  {
    bgColor: "bg-emerald-950/30",
    iconBg: "bg-emerald-900/50",
    iconBorder: "border-emerald-800/50",
    accentLine: "bg-gradient-to-r from-emerald-800/50 via-emerald-700/50 to-emerald-800/50",
  },
  {
    bgColor: "bg-amber-950/30",
    iconBg: "bg-amber-900/50",
    iconBorder: "border-amber-800/50",
    accentLine: "bg-gradient-to-r from-amber-800/50 via-amber-700/50 to-amber-800/50",
  },
  {
    bgColor: "bg-rose-950/30",
    iconBg: "bg-rose-900/50",
    iconBorder: "border-rose-800/50",
    accentLine: "bg-gradient-to-r from-rose-800/50 via-rose-700/50 to-rose-800/50",
  },
];

const defaultLaboratories = [
  {
    id: "lab-1",
    title: "Computer Laboratory 1",
    description: "Main computer lab for general computing classes",
    pcCount: 40,
    seatCount: 40,
    occupancy: "12 / 40",
    ...colorPalettes[0],
  },
  {
    id: "lab-2",
    title: "Computer Laboratory 2",
    description: "Secondary lab for programming and development",
    pcCount: 35,
    seatCount: 35,
    occupancy: "8 / 35",
    ...colorPalettes[1],
  },
  {
    id: "lab-3",
    title: "Computer Laboratory 3",
    description: "Multimedia lab for design and media production",
    pcCount: 30,
    seatCount: 30,
    occupancy: "0 / 30",
    bgColor: "bg-slate-900/50",
    iconBg: "bg-slate-800",
    iconBorder: "border-slate-700",
    accentLine: "bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700",
  },
  {
    id: "lab-4",
    title: "Computer Laboratory 4",
    description: "Networking lab for network administration courses",
    pcCount: 25,
    seatCount: 25,
    occupancy: "20 / 25",
    ...colorPalettes[2],
  },
];

export default function LabSelectionPage() {
  const navigate = useNavigate();
  const [laboratories, setLaboratories] = useState(defaultLaboratories);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [labToDelete, setLabToDelete] = useState(null);
  const [newLab, setNewLab] = useState({
    name: "",
    description: "",
    pcCount: "",
    seatCount: "",
  });

  const handleLabClick = (labId) => {
    navigate("/lab-dashboard", { state: { labId } });
  };

  const handleAddLaboratory = () => {
    if (!newLab.name.trim() || !newLab.pcCount || !newLab.seatCount) return;

    const labIndex = laboratories.length;
    const palette = colorPalettes[labIndex % colorPalettes.length];
    const labId = `lab-${labIndex + 1}`;

    const lab = {
      id: labId,
      title: newLab.name.trim(),
      description: newLab.description.trim() || `${newLab.pcCount} PCs · ${newLab.seatCount} seats`,
      pcCount: parseInt(newLab.pcCount, 10),
      seatCount: parseInt(newLab.seatCount, 10),
      occupancy: `0 / ${newLab.seatCount}`,
      ...palette,
    };

    setLaboratories((prev) => [...prev, lab]);
    setNewLab({ name: "", description: "", pcCount: "", seatCount: "" });
    setDialogOpen(false);
  };

  const handleDeleteClick = (lab, e) => {
    e.stopPropagation();
    setLabToDelete(lab);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (labToDelete) {
      setLaboratories((prev) => prev.filter((lab) => lab.id !== labToDelete.id));
      setDeleteDialogOpen(false);
      setLabToDelete(null);
    }
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
                  Laboratory Monitoring
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Select a laboratory to manage
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-slate-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to ISAMS Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">
              Available Laboratories
            </h2>
            <p className="text-slate-400 text-sm">
              Choose a laboratory to view its dashboard, manage PCs, and monitor access
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-slate-100 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Laboratory
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-slate-100">Add New Laboratory</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Fill in the details below to register a new laboratory.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                <div className="space-y-2">
                  <Label htmlFor="lab-name" className="text-slate-300">
                    Laboratory Name
                  </Label>
                  <Input
                    id="lab-name"
                    placeholder="e.g. Computer Laboratory 5"
                    value={newLab.name}
                    onChange={(e) => setNewLab((prev) => ({ ...prev, name: e.target.value }))}
                    className="bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-600 focus-visible:ring-blue-600/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lab-description" className="text-slate-300">
                    Description <span className="text-slate-500 font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="lab-description"
                    placeholder="e.g. Main computer lab for general computing classes"
                    value={newLab.description}
                    onChange={(e) => setNewLab((prev) => ({ ...prev, description: e.target.value }))}
                    className="bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-600 focus-visible:ring-blue-600/20 min-h-20 resize-none"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pc-count" className="text-slate-300">
                      Number of PCs
                    </Label>
                    <Input
                      id="pc-count"
                      type="number"
                      min="0"
                      placeholder="e.g. 40"
                      value={newLab.pcCount}
                      onChange={(e) => setNewLab((prev) => ({ ...prev, pcCount: e.target.value }))}
                      className="bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-600 focus-visible:ring-blue-600/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seat-count" className="text-slate-300">
                      Number of Seats
                    </Label>
                    <Input
                      id="seat-count"
                      type="number"
                      min="1"
                      placeholder="e.g. 40"
                      value={newLab.seatCount}
                      onChange={(e) => setNewLab((prev) => ({ ...prev, seatCount: e.target.value }))}
                      className="bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-600 focus-visible:ring-blue-600/20"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-slate-100"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddLaboratory}
                  disabled={!newLab.name.trim() || !newLab.pcCount || !newLab.seatCount}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {laboratories.map((lab) => (
            <div
              key={lab.id}
              onClick={() => handleLabClick(lab.id)}
              className="cursor-pointer"
            >
              <Card
                className={`group relative overflow-hidden ${lab.bgColor} border-slate-800 hover:border-slate-700 hover:shadow-xl hover:shadow-slate-900/50 transition-all duration-300`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />

                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

                <CardHeader className="relative">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-14 h-14 rounded-xl ${lab.iconBg} border ${lab.iconBorder} flex items-center justify-center group-hover:border-slate-600 transition-all duration-300`}
                    >
                      <Monitor className="w-7 h-7 text-slate-200 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-slate-100 group-hover:text-white transition-colors duration-300">
                        {lab.title}
                      </CardTitle>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-slate-400">{lab.pcCount} PCs</span>
                        <span className="text-xs text-slate-600">•</span>
                        <span className="text-xs text-slate-400">{lab.seatCount} Seats</span>
                        <span className="text-xs text-slate-600">•</span>
                        <span className="text-xs text-slate-400">{lab.occupancy} occupied</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteClick(lab, e)}
                      className="flex-shrink-0 h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors duration-300">
                    {lab.description}
                  </p>
                </CardContent>

                <div
                  className={`absolute bottom-0 left-0 right-0 h-0.5 ${lab.accentLine} scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}
                />
              </Card>
            </div>
          ))}
        </div>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-slate-100">Delete Laboratory</DialogTitle>
              <DialogDescription className="text-slate-400">
                Are you sure you want to delete <span className="font-semibold text-slate-300">{labToDelete?.title}</span>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-slate-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
