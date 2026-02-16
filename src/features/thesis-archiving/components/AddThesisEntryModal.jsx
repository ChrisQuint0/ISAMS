import React, { useState, useRef, useEffect } from "react";
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
import { Plus, Edit, Upload, Check, X, Trash2, FileText, Bold, Italic, Heading1, Heading2, ChevronRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function AddThesisEntryModal({ open, onOpenChange }) {
    const [view, setView] = useState("form"); // "form" | "editor"
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
    const [abstract, setAbstract] = useState("");
    const [tempAbstract, setTempAbstract] = useState("");
    const fileInputRef = useRef(null);
    const editorRef = useRef(null);

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
            abstract,
            file: file?.name,
        });
        onOpenChange(false);
    };

    const handleEditAbstract = () => {
        setTempAbstract(abstract);
        setView("editor");
    };

    useEffect(() => {
        if (view === "editor" && editorRef.current) {
            // Focus and put caret at the end
            editorRef.current.focus();
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }, [view]);

    const handleSaveAbstract = () => {
        if (editorRef.current) {
            setAbstract(editorRef.current.innerHTML);
        }
        setView("form");
    };

    const handleCancelAbstract = () => {
        setView("form");
    };

    const execCommand = (command, value = null) => {
        // Enforce brackets for formatBlock to ensure cross-browser compatibility
        const finalValue = (command === 'formatBlock' && !value.startsWith('<')) ? `<${value}>` : value;
        document.execCommand(command, false, finalValue);
        if (editorRef.current) {
            editorRef.current.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, text);
    };

    const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1e293b;
                    border-radius: 9999px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #334155;
                }
            `}} />
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] bg-slate-900 text-slate-100 border border-slate-800 p-0 overflow-hidden flex flex-col shadow-2xl shadow-black/50">
                    {view === "form" ? (
                        <>
                            {/* Header with gradient accent */}
                            <div className="relative px-8 pt-8 pb-6 border-b border-slate-800/50 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-900/95">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />
                                <DialogHeader className="relative space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-blue-400" />
                                        </div>
                                        <div className="flex-1">
                                            <DialogTitle className="text-2xl font-bold text-slate-50">
                                                Add New Research Entry
                                            </DialogTitle>
                                            <DialogDescription className="text-slate-400 text-sm mt-1">
                                                Archive a new research paper to the digital repository
                                            </DialogDescription>
                                        </div>
                                    </div>
                                </DialogHeader>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-7 custom-scrollbar">
                                {/* Basic Information Section */}
                                <div className="space-y-5">
                                    <div className="flex items-center gap-2">
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Basic Information</span>
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                                    </div>

                                    <div className="space-y-3">
                                        <Label htmlFor="title" className="text-sm font-medium text-slate-300">
                                            Research Title <span className="text-rose-400">*</span>
                                        </Label>
                                        <Input
                                            id="title"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Enter the complete research title"
                                            className="bg-slate-950/80 border-slate-800/70 text-slate-100 placeholder:text-slate-600 focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:border-blue-500/40 h-11 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <Label htmlFor="description" className="text-sm font-medium text-slate-300">
                                            Brief Description <span className="text-rose-400">*</span>
                                        </Label>
                                        <textarea
                                            id="description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Provide a concise summary of the research focus and key findings..."
                                            rows={4}
                                            className="w-full rounded-lg border border-slate-800/70 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:border-blue-500/40 transition-all resize-none leading-relaxed"
                                        />
                                        <p className="text-xs text-slate-500">Max 200 characters recommended</p>
                                    </div>
                                </div>

                                {/* Authors Section */}
                                <div className="space-y-5">
                                    <div className="flex items-center gap-2">
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Authors</span>
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                                    </div>

                                    <div className="space-y-3">
                                        {authors.map((author, index) => (
                                            <div
                                                key={index}
                                                className="relative group bg-slate-950/40 border border-slate-800/40 rounded-lg p-4 hover:border-slate-700/60 transition-all"
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-xs font-medium text-slate-400">
                                                        Author {index + 1}
                                                    </span>
                                                    {authors.length > 1 && (
                                                        <button
                                                            onClick={() => handleRemoveAuthor(index)}
                                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-md transition-all"
                                                            title="Remove author"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <Input
                                                            placeholder="First Name"
                                                            value={author.firstName}
                                                            onChange={(e) => handleAuthorChange(index, "firstName", e.target.value)}
                                                            className="bg-slate-950/60 border-slate-800/50 text-slate-200 placeholder:text-slate-600 h-9 focus-visible:ring-1 focus-visible:ring-blue-500/30"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Input
                                                            placeholder="Last Name"
                                                            value={author.lastName}
                                                            onChange={(e) => handleAuthorChange(index, "lastName", e.target.value)}
                                                            className="bg-slate-950/60 border-slate-800/50 text-slate-200 placeholder:text-slate-600 h-9 focus-visible:ring-1 focus-visible:ring-blue-500/30"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleAddAuthor}
                                        className="w-full border-dashed border-slate-700 bg-transparent hover:bg-slate-800/50 hover:border-slate-600 text-slate-300 h-10"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Another Author
                                    </Button>
                                </div>

                                {/* Details Section */}
                                <div className="space-y-5">
                                    <div className="flex items-center gap-2">
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Research Details</span>
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <Label className="text-sm font-medium text-slate-300">
                                                Publication Year <span className="text-rose-400">*</span>
                                            </Label>
                                            <Select value={year} onValueChange={setYear}>
                                                <SelectTrigger className="bg-slate-950/80 border-slate-800/70 text-slate-200 h-10 focus:ring-2 focus:ring-blue-500/40">
                                                    <SelectValue placeholder="Select Year" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                                    {years.map((y) => (
                                                        <SelectItem key={y} value={y}>{y}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-sm font-medium text-slate-300">
                                                Research Adviser <span className="text-rose-400">*</span>
                                            </Label>
                                            <Select value={adviser} onValueChange={setAdviser}>
                                                <SelectTrigger className="bg-slate-950/80 border-slate-800/70 text-slate-200 h-10 text-left focus:ring-2 focus:ring-blue-500/40">
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
                                </div>

                                {/* Files Section */}
                                <div className="space-y-5">
                                    <div className="flex items-center gap-2">
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attachments</span>
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
                                    </div>

                                    <div className="space-y-4">
                                        {/* Abstract */}
                                        <div className="flex items-center justify-between p-4 rounded-lg border border-slate-800/40 bg-slate-950/40 hover:border-slate-700/60 transition-all group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-md bg-slate-800/50 border border-slate-700/30 flex items-center justify-center group-hover:border-slate-600/50 transition-all">
                                                    <Edit className="h-4 w-4 text-slate-400 group-hover:text-slate-300" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-200">Research Abstract</p>
                                                    <p className="text-xs text-slate-500">
                                                        {abstract ? "Content edited" : "Add detailed abstract content"}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleEditAbstract}
                                                className="text-slate-400 hover:text-slate-100 hover:bg-slate-800 h-8 font-medium"
                                            >
                                                {abstract ? "Modify" : "Edit"}
                                            </Button>
                                        </div>

                                        {/* PDF Upload */}
                                        <div
                                            onClick={() => !file && fileInputRef.current?.click()}
                                            className={`p-4 rounded-lg border-2 border-dashed transition-all cursor-pointer ${file
                                                ? 'border-blue-500/30 bg-blue-500/5'
                                                : 'border-slate-800/40 bg-slate-950/40 hover:border-slate-700/60 hover:bg-slate-900/40'
                                                }`}
                                        >
                                            {file ? (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                                            <FileText className="h-5 w-5 text-blue-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-200 truncate max-w-[300px]">
                                                                {file.name}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setFile(null);
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-md transition-all"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-4 text-center">
                                                    <div className="h-12 w-12 rounded-lg bg-slate-800/50 border border-slate-700/30 flex items-center justify-center mb-3">
                                                        <Upload className="h-5 w-5 text-slate-400" />
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-300 mb-1">
                                                        Upload Research PDF
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        Click to browse or drag and drop
                                                    </p>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="px-8 py-5 bg-slate-900/50 border-t border-slate-800/50 flex items-center justify-end gap-3 shrink-0">
                                <Button
                                    variant="ghost"
                                    onClick={() => onOpenChange(false)}
                                    className="text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 px-6 h-10"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 h-10 font-medium shadow-lg shadow-blue-900/30 transition-all"
                                >
                                    Save Entry
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Editor Header */}
                            <div className="px-8 pt-6 pb-4 border-b border-slate-800 bg-slate-900">
                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                                    <span className="hover:text-slate-300 cursor-pointer" onClick={handleCancelAbstract}>
                                        Add New Research Entry
                                    </span>
                                    <ChevronRight className="h-3 w-3" />
                                    <span className="text-blue-400 font-medium">Abstract Editor</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xl font-bold text-slate-50 truncate">
                                            {title || "Untitled Research"}
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-0.5">Editing Research Abstract</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleCancelAbstract}
                                            className="text-slate-400 hover:text-slate-100 hover:bg-slate-800 h-9"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleSaveAbstract}
                                            className="bg-blue-600 hover:bg-blue-500 text-white h-9 px-4 font-medium"
                                        >
                                            Save Changes
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Editor Toolbar */}
                            <div className="flex items-center justify-center gap-1 p-2 bg-slate-950/40 border-b border-slate-800/60">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => execCommand('bold')}
                                    className="h-9 w-9 p-0 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                                    title="Bold"
                                >
                                    <Bold className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => execCommand('italic')}
                                    className="h-9 w-9 p-0 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                                    title="Italic"
                                >
                                    <Italic className="h-4 w-4" />
                                </Button>
                                <Separator orientation="vertical" className="h-6 bg-slate-800 mx-1" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => execCommand('formatBlock', 'h1')}
                                    className="h-9 w-9 p-0 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                                    title="Heading 1"
                                >
                                    <Heading1 className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => execCommand('formatBlock', 'h2')}
                                    className="h-9 w-9 p-0 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                                    title="Heading 2"
                                >
                                    <Heading2 className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Editor Content Area */}
                            <div className="flex-1 bg-slate-950/20 p-8 overflow-y-auto custom-scrollbar">
                                <div
                                    ref={editorRef}
                                    contentEditable
                                    suppressContentEditableWarning
                                    onPaste={handlePaste}
                                    className="max-w-3xl mx-auto min-h-[400px] outline-none text-slate-200 leading-relaxed prose prose-invert overflow-visible selection:bg-blue-500/30
                                [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-slate-50 [&_h1]:mb-4 [&_h1]:mt-6
                                [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-100 [&_h2]:mb-3 [&_h2]:mt-5
                                [&_p]:mb-4"
                                    dangerouslySetInnerHTML={{ __html: tempAbstract || '<p><br></p>' }}
                                />
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
