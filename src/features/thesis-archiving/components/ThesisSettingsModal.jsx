import React, { useState, useMemo, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Settings, Edit, ChevronRight, Plus, Trash2, Check, ArrowLeft, Save } from "lucide-react";
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeBalham } from 'ag-grid-community';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Custom theme using AG Grid v33+ Theming API with Balham theme (better dark mode support)
const customTheme = themeBalham.withParams({
    accentColor: '#3b82f6',
    backgroundColor: '#020617',
    foregroundColor: '#e2e8f0',
    borderColor: '#1e293b',
    headerBackgroundColor: '#0f172a',
    headerTextColor: '#94a3b8',
    oddRowBackgroundColor: '#020617',
    rowHeight: 48,
    headerHeight: 40,
});

const ActionCellRenderer = (params) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isRecentSave, setIsRecentSave] = useState(false);

    useEffect(() => {
        if (!params.api) return;

        const onCellEditingStarted = (e) => {
            if (e.node === params.node) {
                setIsEditing(true);
                setIsRecentSave(false);
            }
        };

        const onCellEditingStopped = (e) => {
            if (e.node === params.node) {
                setIsEditing(false);
                // Disable the button for 1 second after saving
                setIsRecentSave(true);
                setTimeout(() => {
                    setIsRecentSave(false);
                }, 1000);
            }
        };

        params.api.addEventListener('cellEditingStarted', onCellEditingStarted);
        params.api.addEventListener('cellEditingStopped', onCellEditingStopped);

        const editingCells = params.api.getEditingCells();
        const isRowEditing = editingCells.some(cell => cell.rowIndex === params.node.rowIndex);
        setIsEditing(isRowEditing);

        return () => {
            params.api.removeEventListener('cellEditingStarted', onCellEditingStarted);
            params.api.removeEventListener('cellEditingStopped', onCellEditingStopped);
        };
    }, [params.api, params.node]);


    const handleClick = (e) => {
        e.stopPropagation();
        if (isEditing) {
            // Save the changes by stopping editing
            params.api.stopEditing();
        } else if (!isRecentSave) {
            // Delete the adviser - only if not in the 1s cooldown
            if (params.context && params.context.handleDeleteAdviser) {
                params.context.handleDeleteAdviser(params.data.id);
            }
        }
    };

    return (
        <div className="flex items-center justify-center w-full h-full">
            <button
                onClick={handleClick}
                disabled={isRecentSave}
                className={`p-1.5 rounded-md transition-all duration-200 ${isRecentSave
                        ? "opacity-30 cursor-not-allowed bg-slate-800/50"
                        : "hover:bg-slate-800 text-slate-400 hover:text-slate-100"
                    }`}
                title={isEditing ? "Save changes" : isRecentSave ? "Saved" : "Delete adviser"}
            >
                {isEditing ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                    <Trash2 className={`h-4 w-4 ${isRecentSave ? "text-slate-500" : "text-rose-400"}`} />
                )}
            </button>
        </div>
    );
};

export function ThesisSettingsModal() {
    const [view, setView] = useState('settings'); // 'settings' | 'advisers'
    const [advisers, setAdvisers] = useState([
        { id: 1, name: "Professor. Alan Turing, Ph.D." },
        { id: 2, name: "Professor. Dorothy Brown, MIT" },
    ]);
    const [newAdviserName, setNewAdviserName] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [adviserToDelete, setAdviserToDelete] = useState(null);

    const handleBack = () => {
        setView('settings');
    };

    const handleAddAdviser = () => {
        if (!newAdviserName.trim()) return;
        const newId = Math.max(...advisers.map(a => a.id), 0) + 1;
        setAdvisers([...advisers, { id: newId, name: newAdviserName }]);
        setNewAdviserName("");
    };

    const handleDeleteAdviser = (id) => {
        const adviser = advisers.find(a => a.id === id);
        setAdviserToDelete(adviser);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (adviserToDelete) {
            setAdvisers(advisers.filter(a => a.id !== adviserToDelete.id));
            setIsDeleteDialogOpen(false);
            setAdviserToDelete(null);
        }
    };

    const handleCellValueChanged = (event) => {
        // Update the advisers state with the new value
        setAdvisers(prevAdvisers =>
            prevAdvisers.map(adviser =>
                adviser.id === event.data.id
                    ? { ...adviser, name: event.data.name }
                    : adviser
            )
        );
    };


    const columnDefs = useMemo(() => [
        {
            field: "name",
            headerName: "Name",
            flex: 1,
            editable: true,
            singleClickEdit: false,
        },
        {
            field: "actions",
            headerName: "Action",
            width: 100,
            cellRenderer: ActionCellRenderer,
            editable: false
        }
    ], []);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                >
                    <Settings className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-slate-900 text-slate-100 border-slate-800 gap-6 min-h-[500px] flex flex-col">
                {view === 'settings' ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-semibold">Settings</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Manage application preferences and configurations.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-6 flex-1">
                            <div className="flex items-center gap-4">
                                <Label htmlFor="theme" className="text-base w-48 text-slate-100">
                                    Theme
                                </Label>
                                <Select defaultValue="dark">
                                    <SelectTrigger className="w-[140px] bg-slate-950 border-slate-800 text-slate-100 focus:ring-slate-700">
                                        <SelectValue placeholder="Select theme" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                        <SelectItem value="light" className="focus:bg-slate-800 focus:text-slate-100">Light</SelectItem>
                                        <SelectItem value="dark" className="focus:bg-slate-800 focus:text-slate-100">Dark</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-4">
                                <Label htmlFor="thesis-link" className="text-base w-48 text-slate-100">
                                    Thesis Folder Link
                                </Label>
                                <Input id="thesis-link" className="flex-1 bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-slate-700" />
                            </div>

                            <div className="flex items-center gap-4">
                                <Label htmlFor="hte-link" className="text-base w-48 text-slate-100">
                                    HTE GDrive Folder Link
                                </Label>
                                <Input id="hte-link" className="flex-1 bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-slate-700" />
                            </div>

                            <div className="h-px bg-slate-800 my-2" />

                            <div className="flex items-center gap-4">
                                <Label className="text-base w-48 text-slate-100">Adviser List</Label>
                                <Button
                                    variant="outline"
                                    className="flex-1 justify-start gap-2 h-10 px-4 font-normal text-base bg-transparent border-slate-800 text-slate-100 hover:bg-slate-800 hover:text-slate-100"
                                    onClick={() => setView('advisers')}
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit / Add Advisers
                                </Button>
                            </div>

                            <div className="flex items-center gap-4">
                                <Label className="text-base w-48 text-slate-100">Categories</Label>
                                <Button variant="outline" className="flex-1 justify-start gap-2 h-10 px-4 font-normal text-base bg-transparent border-slate-800 text-slate-100 hover:bg-slate-800 hover:text-slate-100">
                                    <Edit className="h-4 w-4" />
                                    Edit / Add Categories
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-slate-800 mt-auto">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                                Save
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col h-full gap-4">
                        <DialogHeader>
                            <div className="flex items-center gap-1 text-sm mb-1">
                                <button
                                    onClick={handleBack}
                                    className="text-slate-400 hover:text-slate-100 transition-colors flex items-center"
                                >
                                    Settings
                                </button>
                                <ChevronRight className="h-4 w-4 text-slate-600" />
                                <span className="text-slate-100 font-medium">Advisers List</span>
                            </div>
                            <DialogTitle className="text-xl font-semibold">Manage Advisers</DialogTitle>
                            <DialogDescription className="text-slate-400 text-sm">
                                These advisers would appear as an option in the adviser dropdown when adding a new research entry.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex gap-2 items-center">
                            <Input
                                placeholder="Enter Adviser Name"
                                value={newAdviserName}
                                onChange={(e) => setNewAdviserName(e.target.value)}
                                className="bg-slate-950 border-slate-800 text-slate-100"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddAdviser();
                                }}
                            />
                            <Button
                                variant="outline"
                                className="bg-slate-100 text-slate-900 hover:bg-slate-200 border-none font-medium shrink-0"
                                onClick={handleAddAdviser}
                            >
                                Add
                            </Button>
                        </div>

                        <div className="border border-slate-800 rounded-md overflow-hidden bg-slate-950" style={{ height: '350px' }}>
                            <div style={{ height: '100%', width: '100%' }}>
                                <AgGridReact
                                    theme={customTheme}
                                    rowData={advisers}
                                    columnDefs={columnDefs}
                                    defaultColDef={{
                                        sortable: true,
                                        filter: true,
                                        resizable: true,
                                    }}
                                    context={{ handleDeleteAdviser }}
                                    animateRows={true}
                                    stopEditingWhenCellsLoseFocus={true}
                                    onCellValueChanged={handleCellValueChanged}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[400px] bg-slate-900 text-slate-100 border-slate-800 p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-rose-400">Confirm Deletion</DialogTitle>
                        <DialogDescription className="text-slate-400 pt-2 text-base">
                            Are you sure you want to delete adviser <span className="text-slate-100 font-medium">"{adviserToDelete?.name}"</span>?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            className="bg-transparent border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmDelete}
                            className="bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}