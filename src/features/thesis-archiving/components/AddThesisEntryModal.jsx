import React, { useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import { Plus, Edit, Upload, Check, X, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function AddThesisEntryModal({ open, onOpenChange }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [authors, setAuthors] = useState([
        { firstName: "", lastName: "" },
        { firstName: "", lastName: "" },
        { firstName: "", lastName: "" },
    ]);
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [adviser, setAdviser] = useState("");
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);

    const handleAddAuthor = () => {
        setAuthors([...authors, { firstName: "", lastName: "" }]);
    };

    const handleRemoveAuthor = (index) => {
        if (authors.length > 1) {
            setAuthors(authors.filter((_, i) => i !== index));
        }
    };

    const handleAuthorChange = (index, field, value) => {
        const newAuthors = [...authors];
        newAuthors[index][field] = value;
        setAuthors(newAuthors);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSave = () => {
        console.log({
            title,
            description,
            authors,
            year,
            adviser,
            file: file?.name,
        });
        onOpenChange(false);
    };

    const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-slate-900 text-slate-100 border-slate-800 p-0 overflow-hidden shadow-2xl">
                <div className="max-h-[90vh] overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/50 hover:scrollbar-thumb-slate-600 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-950/50">
                    <DialogHeader className="mb-6 relative">
                        <DialogTitle className="text-2xl font-semibold text-slate-100">Add New Entry</DialogTitle>
                        <DialogDescription className="text-slate-400 mt-1">
                            Fill in the details below to archive a new research paper.
                        </DialogDescription>
                        <Separator className="bg-slate-800 mt-4" />
                    </DialogHeader>

                    <div className="space-y-8 pb-4">
                        {/* Title Section */}
                        <div className="space-y-2.5">
                            <Label htmlFor="title" className="text-sm font-medium text-slate-300">Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Automated Crop Monitoring using IoT"
                                className="bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-slate-700 h-11"
                            />
                        </div>

                        {/* Description Section */}
                        <div className="space-y-2.5">
                            <Label htmlFor="description" className="text-sm font-medium text-slate-300">Description</Label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Short description of the paper"
                                className="w-full min-h-[100px] rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-slate-700 transition-all resize-none"
                            />
                        </div>

                        {/* Authors Section */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold text-slate-200 tracking-wider">Authors</Label>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleAddAuthor}
                                    className="h-8 bg-slate-800 hover:bg-slate-700 text-slate-200 border-none shadow-sm"
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Author
                                </Button>
                            </div>

                            <div className="space-y-5">
                                {authors.map((author, index) => (
                                    <div key={index} className="group relative bg-slate-950/30 p-4 rounded-lg border border-slate-800/50 space-y-3">
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-xs font-medium text-white">Author {index + 1}</span>
                                            {authors.length > 1 && (
                                                <button
                                                    onClick={() => handleRemoveAuthor(index)}
                                                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors rounded-md hover:bg-rose-400/10"
                                                    title="Remove author"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-white ml-1">First Name</Label>
                                                <Input
                                                    placeholder="First Name"
                                                    value={author.firstName}
                                                    onChange={(e) => handleAuthorChange(index, "firstName", e.target.value)}
                                                    className="bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-700 h-9"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-white ml-1">Last Name</Label>
                                                <Input
                                                    placeholder="Last Name"
                                                    value={author.lastName}
                                                    onChange={(e) => handleAuthorChange(index, "lastName", e.target.value)}
                                                    className="bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-700 h-9"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Year and Adviser Section */}
                        <div className="grid grid-cols-2 gap-6 pt-2">
                            <div className="space-y-2.5">
                                <Label className="text-sm font-medium text-slate-300">Year</Label>
                                <Select value={year} onValueChange={setYear}>
                                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-10">
                                        <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                        {years.map((y) => (
                                            <SelectItem key={y} value={y}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2.5">
                                <Label className="text-sm font-medium text-slate-300">Adviser</Label>
                                <Select value={adviser} onValueChange={setAdviser}>
                                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-10 text-left">
                                        <SelectValue placeholder="Select Adviser" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                        <SelectItem value="doe">Professor John Doe, Ph.D</SelectItem>
                                        <SelectItem value="brown">Professor Dorothy Brown, MIT</SelectItem>
                                        <SelectItem value="turing">Professor Alan Turing, Ph.D.</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Abstract Section */}
                        <div className="space-y-3 pt-2">
                            <Label className="text-sm font-medium text-slate-300">Abstract</Label>
                            <div>
                                <Button
                                    variant="secondary"
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-none shadow-sm h-10 px-4"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Abstract
                                </Button>
                            </div>
                        </div>

                        {/* Softcopy Section */}
                        <div className="space-y-3 pt-2">
                            <Label className="text-sm font-medium text-slate-300">Softcopy</Label>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => fileInputRef.current.click()}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-none shadow-sm h-10 px-4"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Softcopy PDF
                                </Button>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                {file && (
                                    <div className="flex items-center gap-2.5 bg-slate-950 border border-slate-800/50 py-2 px-3 rounded-md overflow-hidden">
                                        <span className="text-xs text-slate-400 truncate max-w-[200px]">{file.name}</span>
                                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-5 bg-slate-900 border-t border-slate-800 sm:justify-end">
                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="bg-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-800 px-6 h-10"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px] font-medium shadow-lg shadow-blue-900/20 h-10"
                        >
                            Save
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
