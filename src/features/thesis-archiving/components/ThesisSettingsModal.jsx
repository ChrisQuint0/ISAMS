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

// Custom theme using AG Grid v33+ Theming API with Balham theme (light neutral mode)
const customTheme = themeBalham.withParams({
    accentColor: '#3b82f6',
    backgroundColor: '#f5f5f4',
    foregroundColor: '#262524',
    borderColor: '#e7e5e4',
    headerBackgroundColor: '#fafaf9',
    headerTextColor: '#525252',
    oddRowBackgroundColor: '#f5f5f4',
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
            if (params.api && !params.api.isDestroyed()) {
                params.api.removeEventListener('cellEditingStarted', onCellEditingStarted);
                params.api.removeEventListener('cellEditingStopped', onCellEditingStopped);
            }
        };
    }, [params.api, params.node]);


    const handleClick = (e) => {
        e.stopPropagation();
        if (isEditing) {
            // Save the changes by stopping editing
            params.api.stopEditing();
        } else if (!isRecentSave) {
            // Delete the item - only if not in the 1s cooldown
            if (params.context && params.context.handleDelete) {
                params.context.handleDelete(params.data.id);
            }
        }
    };

    return (
        <div className="flex items-center justify-center w-full h-full">
            <button
                onClick={handleClick}
                disabled={isRecentSave}
                className={`p-1.5 rounded-md transition-all duration-200 ${
                    isRecentSave
                    ? "opacity-30 cursor-not-allowed bg-neutral-200/50"
                    : "hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900"
                    }`}
                title={isEditing ? "Save changes" : isRecentSave ? "Saved" : "Delete item"}
            >
                {isEditing ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                    <Trash2 className={`h-4 w-4 ${isRecentSave ? "text-neutral-400" : "text-red-500"}`} />
                )}
            </button>
        </div>
    );
};

export function ThesisSettingsModal({ variant = "dark" }) {
    const isDark = variant === "dark";
    const [view, setView] = useState('settings'); // 'settings' | 'advisers' | 'categories'
    const [advisers, setAdvisers] = useState([
        { id: 1, name: "Professor. Alan Turing, Ph.D." },
        { id: 2, name: "Professor. Dorothy Brown, MIT" },
    ]);
    const [newAdviserName, setNewAdviserName] = useState("");

    const [categories, setCategories] = useState([
        { id: 1, name: "AI" },
        { id: 2, name: "Internet of things" },
    ]);
    const [newCategoryName, setNewCategoryName] = useState("");

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const handleBack = () => {
        setView('settings');
    };

    const handleAddAdviser = () => {
        if (!newAdviserName.trim()) return;
        const newId = Math.max(...advisers.map(a => a.id), 0) + 1;
        setAdvisers([...advisers, { id: newId, name: newAdviserName }]);
        setNewAdviserName("");
    };

    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return;
        const newId = Math.max(...categories.map(c => c.id), 0) + 1;
        setCategories([...categories, { id: newId, name: newCategoryName }]);
        setNewCategoryName("");
    };

    const handleDelete = (id) => {
        const item = view === 'advisers'
            ? advisers.find(a => a.id === id)
            : categories.find(c => c.id === id);
        setItemToDelete(item);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            if (view === 'advisers') {
                setAdvisers(advisers.filter(a => a.id !== itemToDelete.id));
            } else {
                setCategories(categories.filter(c => c.id !== itemToDelete.id));
            }
            setIsDeleteDialogOpen(false);
            setItemToDelete(null);
        }
    };

    const handleCellValueChanged = (event) => {
        if (view === 'advisers') {
            setAdvisers(prevAdvisers =>
                prevAdvisers.map(adviser =>
                    adviser.id === event.data.id
                        ? { ...adviser, name: event.data.name }
                        : adviser
                )
            );
        } else {
            setCategories(prevCategories =>
                prevCategories.map(category =>
                    category.id === event.data.id
                        ? { ...category, name: event.data.name }
                        : category
                )
            );
        }
    };


    const columnDefs = useMemo(() => {
        const fieldName = view === 'advisers' ? "name" : "name";
        const headerName = view === 'advisers' ? "Name" : "Category Name";

        return [
            {
                field: "name",
                headerName: headerName,
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
        ];
    }, [view]);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-neutral-600 hover:text-white hover:bg-primary-500 transition-colors"
                >
                    <Settings className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white text-neutral-900 border-neutral-200 gap-6 min-h-[500px] flex flex-col">
                {view === 'settings' ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-semibold text-neutral-900">Settings</DialogTitle>
                            <DialogDescription className="text-neutral-600">
                                Manage application preferences and configurations.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-6 flex-1">
                            <div className="flex items-center gap-4">
                                <Label htmlFor="theme" className="text-base w-48 text-neutral-900">
                                    Theme
                                </Label>
                                <Select defaultValue="light">
                                    <SelectTrigger className="w-[140px] bg-white border-neutral-200 text-neutral-900 focus:ring-neutral-300">
                                        <SelectValue placeholder="Select theme" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-neutral-200 text-neutral-900">
                                        <SelectItem value="light" className="focus:bg-neutral-100 focus:text-neutral-900">Light</SelectItem>
                                        <SelectItem value="dark" className="focus:bg-neutral-100 focus:text-neutral-900">Dark</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-4">
                                <Label htmlFor="thesis-link" className="text-base w-48 text-neutral-900">
                                    Thesis Folder Link
                                </Label>
                                <Input id="thesis-link" className="flex-1 bg-white border-neutral-200 text-neutral-900 focus-visible:ring-neutral-300" />
                            </div>

                            <div className="flex items-center gap-4">
                                <Label htmlFor="hte-link" className="text-base w-48 text-neutral-900">
                                    HTE GDrive Folder Link
                                </Label>
                                <Input id="hte-link" className="flex-1 bg-white border-neutral-200 text-neutral-900 focus-visible:ring-neutral-300" />
                            </div>

                            <div className="h-px bg-neutral-200 my-2" />

                            <div className="flex items-center gap-4">
                                <Label className="text-base w-48 text-neutral-900">Adviser List</Label>
                                <Button
                                    variant="outline"
                                    className="flex-1 justify-start gap-2 h-10 px-4 font-normal text-base bg-white border-neutral-200 text-neutral-900 hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-300"
                                    onClick={() => setView('advisers')}
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit / Add Advisers
                                </Button>
                            </div>

                            <div className="flex items-center gap-4">
                                <Label className="text-base w-48 text-neutral-900">Categories</Label>
                                <Button
                                    variant="outline"
                                    className="flex-1 justify-start gap-2 h-10 px-4 font-normal text-base bg-white border-neutral-200 text-neutral-900 hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-300"
                                    onClick={() => setView('categories')}
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit / Add Categories
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-neutral-200 mt-auto">
                            <Button className="bg-primary-500 hover:bg-primary-600 text-white w-full sm:w-auto">
                                Save
                            </Button>
                        </div>
                    </>
                ) : view === 'advisers' ? (
                    <div className="flex flex-col h-full gap-4">
                        <DialogHeader>
                            <div className="flex items-center gap-1 text-sm mb-1">
                                <button
                                    onClick={handleBack}
                                    className="text-neutral-600 hover:text-neutral-900 transition-colors flex items-center"
                                >
                                    Settings
                                </button>
                                <ChevronRight className="h-4 w-4 text-neutral-400" />
                                <span className="text-neutral-900 font-medium">Advisers List</span>
                            </div>
                            <DialogTitle className="text-xl font-semibold text-neutral-900">Manage Advisers</DialogTitle>
                            <DialogDescription className="text-neutral-600 text-sm">
                                These advisers would appear as an option in the adviser dropdown when adding a new research entry.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex gap-2 items-center">
                            <Input
                                placeholder="Enter Adviser Name"
                                value={newAdviserName}
                                onChange={(e) => setNewAdviserName(e.target.value)}
                                className="bg-white border-neutral-200 text-neutral-900 focus-visible:ring-neutral-300"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddAdviser();
                                }}
                            />
                            <Button
                                variant="outline"
                                className="bg-primary-500 text-white hover:bg-primary-600 border-none font-medium shrink-0"
                                onClick={handleAddAdviser}
                            >
                                Add
                            </Button>
                        </div>

                        <div className="border border-neutral-200 rounded-md overflow-hidden bg-white" style={{ height: '350px' }}>
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
                                    context={{ handleDelete }}
                                    animateRows={true}
                                    stopEditingWhenCellsLoseFocus={true}
                                    onCellValueChanged={handleCellValueChanged}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full gap-4">
                        <DialogHeader>
                            <div className="flex items-center gap-1 text-sm mb-1">
                                <button
                                    onClick={handleBack}
                                    className="text-neutral-600 hover:text-neutral-900 transition-colors flex items-center"
                                >
                                    Settings
                                </button>
                                <ChevronRight className="h-4 w-4 text-neutral-400" />
                                <span className="text-neutral-900 font-medium">Categories</span>
                            </div>
                            <DialogTitle className="text-xl font-semibold text-neutral-900">Manage Categories</DialogTitle>
                            <DialogDescription className="text-neutral-600 text-sm">
                                These categories would appear as an option in the category dropdown when adding a new research entry.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex gap-2 items-center">
                            <Input
                                placeholder="Enter Category Name"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="bg-white border-neutral-200 text-neutral-900 focus-visible:ring-neutral-300"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddCategory();
                                }}
                            />
                            <Button
                                variant="outline"
                                className="bg-primary-500 text-white hover:bg-primary-600 border-none font-medium shrink-0"
                                onClick={handleAddCategory}
                            >
                                Add
                            </Button>
                        </div>

                        <div className="border border-neutral-200 rounded-md overflow-hidden bg-white" style={{ height: '350px' }}>
                            <div style={{ height: '100%', width: '100%' }}>
                                <AgGridReact
                                    theme={customTheme}
                                    rowData={categories}
                                    columnDefs={columnDefs}
                                    defaultColDef={{
                                        sortable: true,
                                        filter: true,
                                        resizable: true,
                                    }}
                                    context={{ handleDelete }}
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
                <DialogContent className="sm:max-w-[400px] bg-white text-neutral-900 border-neutral-200 p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-red-600">Confirm Deletion</DialogTitle>
                        <DialogDescription className="text-neutral-600 pt-2 text-base">
                            Are you sure you want to delete <span className="text-neutral-900 font-medium">"{itemToDelete?.name}"</span>?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            className="bg-white border-neutral-200 text-neutral-900 hover:bg-neutral-50 hover:text-neutral-900"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}