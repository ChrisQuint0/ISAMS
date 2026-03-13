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
import { Plus, Edit, Upload, Check, X, Trash2, FileText, Bold, Italic, Heading1, Heading2, ChevronRight, Loader2, Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { thesisService } from "../services/thesisService";
import { useToast } from "@/components/ui/toast/toaster";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function EditThesisEntryModal({ open, onOpenChange, onSuccess, thesisData }) {
    const [view, setView] = useState("form"); // "form" | "editor"
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [authors, setAuthors] = useState([
        { firstName: "", lastName: "" },
    ]);
    const [category, setCategory] = useState("");
    const [categories, setCategories] = useState([]);
    const [advisers, setAdvisers] = useState([]);
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [adviser, setAdviser] = useState("");
    const [file, setFile] = useState(null);
    const [abstract, setAbstract] = useState("");
    const [tempAbstract, setTempAbstract] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const { addToast } = useToast();
    const { user } = useAuth();

    const actorInfo = {
        actorUserId: user?.id,
        actorName: user?.user_metadata?.first_name 
            ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim()
            : user?.email || "System User"
    };

    const years = Array.from({ length: 11 }, (_, i) => (new Date().getFullYear() - i).toString());

    const fileInputRef = useRef(null);
    const editorRef = useRef(null);

    // Initial data population
    useEffect(() => {
        if (thesisData && open) {
            setTitle(thesisData.title || "");
            setDescription(thesisData.description || "");
            setCategory(thesisData.category_id || "");
            setYear(String(thesisData.publication_year || new Date().getFullYear()));
            setAdviser(thesisData.adviser_id || "");
            setAbstract(thesisData.abstract || "");
            
            if (thesisData.authors && thesisData.authors.length > 0) {
                setAuthors(thesisData.authors.map(a => ({
                    firstName: a.first_name,
                    lastName: a.last_name
                })));
            } else {
                setAuthors([{ firstName: "", lastName: "" }]);
            }
        }
    }, [thesisData, open]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [cats, advs] = await Promise.all([
                    thesisService.getCategories(),
                    thesisService.getAdvisers()
                ]);
                setCategories(cats);
                setAdvisers(advs);
            } catch (error) {
                console.error("Error fetching modal data:", error);
            } finally {
                setFetchingData(false);
            }
        };
        fetchData();
    }, []);

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

    const handleUpdate = async () => {
        if (!title || !description || !category || !adviser) {
            alert("Please fill in all required fields.");
            return;
        }

        setLoading(true);
        try {
            let gdriveFile = null;
            if (file) {
                // 1. Upload new file if provided
                gdriveFile = await thesisService.uploadToDrive(file, actorInfo);
            }

            // 2. Prepare entry data
            const entryData = {
                title,
                description,
                abstract,
                category_id: category,
                adviser_id: adviser,
                publication_year: parseInt(year),
                updated_by: user?.id,
                updated_at: new Date().toISOString()
            };

            await thesisService.updateThesisEntry({
                id: thesisData.id,
                entry: entryData,
                authors,
                gdriveFile,
                actorInfo
            });

            addToast({
                title: "Success",
                description: "Thesis updated successfully!",
                variant: "success"
            });

            if (onSuccess) onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Update error:", error);
            addToast({
                title: "Error",
                description: "Failed to update entry: " + error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEditAbstract = () => {
        setTempAbstract(abstract);
        setView("editor");
    };

    useEffect(() => {
        if (view === "editor" && editorRef.current) {
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
                    background: #d1d5db;
                    border-radius: 9999px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                }
            `}} />
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] bg-white text-neutral-900 border border-neutral-200 p-0 overflow-hidden flex flex-col shadow-2xl shadow-neutral-900/10">
                    {view === "form" ? (
                        <>
                            <div className="relative px-8 pt-8 pb-6 border-b border-neutral-200 bg-gradient-to-br from-white via-white to-neutral-50/95">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-[100px] rounded-full pointer-events-none" />
                                <DialogHeader className="relative space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                                            <Edit className="h-5 w-5 text-primary-600" />
                                        </div>
                                        <div className="flex-1">
                                            <DialogTitle className="text-2xl font-bold text-neutral-900">
                                                Edit Research Entry
                                            </DialogTitle>
                                            <DialogDescription className="text-neutral-600 text-sm mt-1">
                                                Modify the details of this archived research paper
                                            </DialogDescription>
                                        </div>
                                    </div>
                                </DialogHeader>
                            </div>

                            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-7 custom-scrollbar">
                                <div className="space-y-5">
                                    <div className="flex items-center gap-2">
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
                                        <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Basic Information</span>
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
                                    </div>

                                    <div className="space-y-3">
                                        <Label htmlFor="title" className="text-sm font-medium text-neutral-700">
                                            Research Title <span className="text-destructive-semantic">*</span>
                                        </Label>
                                        <Input
                                            id="title"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Enter the complete research title"
                                            className="bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-500 focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:border-primary-500/40 h-11 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <Label htmlFor="description" className="text-sm font-medium text-neutral-700">
                                            Brief Description <span className="text-destructive-semantic">*</span>
                                        </Label>
                                        <textarea
                                            id="description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Provide a concise summary..."
                                            rows={4}
                                            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:border-primary-500/40 transition-all resize-none leading-relaxed"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="flex items-center gap-2">
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
                                        <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Authors</span>
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
                                    </div>

                                    <div className="space-y-3">
                                        {authors.map((author, index) => (
                                            <div key={index} className="relative group bg-neutral-50 border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition-all">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-xs font-medium text-neutral-600">Author {index + 1}</span>
                                                    {authors.length > 1 && (
                                                        <button
                                                            onClick={() => handleRemoveAuthor(index)}
                                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-600 hover:text-destructive-semantic hover:bg-destructive-semantic/10 rounded-md transition-all"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Input
                                                        placeholder="First Name"
                                                        value={author.firstName}
                                                        onChange={(e) => handleAuthorChange(index, "firstName", e.target.value)}
                                                        className="bg-neutral-50 h-9 focus-visible:ring-1"
                                                    />
                                                    <Input
                                                        placeholder="Last Name"
                                                        value={author.lastName}
                                                        onChange={(e) => handleAuthorChange(index, "lastName", e.target.value)}
                                                        className="bg-neutral-50 h-9 focus-visible:ring-1"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <Button type="button" variant="outline" onClick={handleAddAuthor} className="w-full border-dashed h-10">
                                        <Plus className="h-4 w-4 mr-2" /> Add Another Author
                                    </Button>
                                </div>

                                <div className="space-y-5">
                                    <div className="flex items-center gap-2">
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
                                        <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Research Details</span>
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <Label className="text-sm font-medium text-neutral-700">Category <span className="text-destructive-semantic">*</span></Label>
                                            <Select value={category} onValueChange={setCategory}>
                                                <SelectTrigger className="bg-neutral-50 h-10">
                                                    <SelectValue placeholder={fetchingData ? "Loading..." : "Select Category"} />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white">
                                                    {categories.map((cat) => (
                                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-sm font-medium text-neutral-700">Year <span className="text-destructive-semantic">*</span></Label>
                                            <Select value={year} onValueChange={setYear}>
                                                <SelectTrigger className="bg-neutral-50 h-10">
                                                    <SelectValue placeholder="Select Year" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white">
                                                    {years.map((y) => (
                                                        <SelectItem key={y} value={y}>{y}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium text-neutral-700">Adviser <span className="text-destructive-semantic">*</span></Label>
                                        <Select value={adviser} onValueChange={setAdviser}>
                                            <SelectTrigger className="bg-neutral-50 h-10 text-left">
                                                <SelectValue placeholder={fetchingData ? "Loading..." : "Select Adviser"} />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white">
                                                {advisers.map((adv) => (
                                                    <SelectItem key={adv.id} value={adv.id}>{adv.display_name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="flex items-center gap-2">
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
                                        <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Attachments</span>
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 bg-neutral-50 hover:border-neutral-300 transition-all group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-md bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                                                    <Edit className="h-4 w-4 text-neutral-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-neutral-900">Research Abstract</p>
                                                    <p className="text-xs text-neutral-600">{abstract ? "Content edited" : "Add detailed abstract content"}</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={handleEditAbstract} className="text-neutral-900 h-8 font-medium">
                                                {abstract ? "Modify" : "Edit"}
                                            </Button>
                                        </div>

                                        <div
                                            onClick={() => !file && fileInputRef.current?.click()}
                                            className={`p-4 rounded-lg border-2 border-dashed transition-all cursor-pointer ${file ? 'border-primary-500/30 bg-primary-500/5' : 'border-neutral-300 bg-neutral-50 hover:border-neutral-400'}`}
                                        >
                                            {file ? (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-md bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                                                            <FileText className="h-5 w-5 text-primary-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-neutral-900 truncate max-w-[300px]">{file.name}</p>
                                                            <p className="text-xs text-neutral-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="p-1.5 text-neutral-600 hover:text-destructive-semantic"><X className="h-4 w-4" /></button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-4 text-center">
                                                    <div className="h-12 w-12 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center mb-3">
                                                        <Upload className="h-5 w-5 text-neutral-600" />
                                                    </div>
                                                    <p className="text-sm font-medium text-neutral-700 mb-1">Replace Research PDF (Optional)</p>
                                                    <p className="text-xs text-neutral-600">Click to browse or drag and drop</p>
                                                </div>
                                            )}
                                            <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-8 py-5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-end gap-3 shrink-0">
                                <Button variant="outline" onClick={() => onOpenChange(false)} className="px-6 h-10 transition-all">Cancel</Button>
                                <Button onClick={handleUpdate} disabled={loading} className="bg-primary-500 hover:bg-primary-600 text-white px-8 h-10 font-medium">
                                    {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="px-8 pt-6 pb-4 border-b border-neutral-200 bg-white">
                                <div className="flex items-center gap-2 text-xs text-neutral-600 mb-3">
                                    <span className="hover:text-neutral-900 cursor-pointer" onClick={handleCancelAbstract}>Edit Research Entry</span>
                                    <ChevronRight className="h-3 w-3" />
                                    <span className="text-primary-600 font-medium">Abstract Editor</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xl font-bold text-neutral-900 truncate">{title || "Untitled Research"}</h3>
                                        <p className="text-xs text-neutral-600 mt-0.5">Editing Research Abstract</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button variant="outline" size="sm" onClick={handleCancelAbstract} className="h-9">Cancel</Button>
                                        <Button size="sm" onClick={handleSaveAbstract} className="bg-primary-500 hover:bg-primary-600 text-white h-9 px-4 font-medium">Save Changes</Button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-1 p-2 bg-neutral-50 border-b border-neutral-200">
                                <Button variant="ghost" size="sm" onClick={() => execCommand('bold')} className="h-9 w-9 p-0"><Bold className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="sm" onClick={() => execCommand('italic')} className="h-9 w-9 p-0"><Italic className="h-4 w-4" /></Button>
                                <Separator orientation="vertical" className="h-6 mx-1" />
                                <Button variant="ghost" size="sm" onClick={() => execCommand('formatBlock', 'h1')} className="h-9 w-9 p-0"><Heading1 className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="sm" onClick={() => execCommand('formatBlock', 'h2')} className="h-9 w-9 p-0"><Heading2 className="h-4 w-4" /></Button>
                            </div>

                            <div className="flex-1 bg-neutral-50 p-8 overflow-y-auto custom-scrollbar">
                                <div
                                    ref={editorRef}
                                    contentEditable
                                    suppressContentEditableWarning
                                    onPaste={handlePaste}
                                    className="max-w-3xl mx-auto min-h-[400px] outline-none text-neutral-900 leading-relaxed prose overflow-visible
                                [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6
                                [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5
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

