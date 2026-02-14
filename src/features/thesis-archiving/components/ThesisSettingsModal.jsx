import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Settings, Edit } from "lucide-react";

export function ThesisSettingsModal() {
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
            <DialogContent className="sm:max-w-[600px] bg-slate-900 text-slate-100 border-slate-800 gap-6">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold">Settings</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6">
                    {/* Theme */}
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

                    {/* Thesis Folder Link */}
                    <div className="flex items-center gap-4">
                        <Label htmlFor="thesis-link" className="text-base w-48 text-slate-100">
                            Thesis Folder Link
                        </Label>
                        <Input id="thesis-link" className="flex-1 bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-slate-700" />
                    </div>

                    {/* HTE GDrive Folder Link */}
                    <div className="flex items-center gap-4">
                        <Label htmlFor="hte-link" className="text-base w-48 text-slate-100">
                            HTE GDrive Folder Link
                        </Label>
                        <Input id="hte-link" className="flex-1 bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-slate-700" />
                    </div>

                    <div className="h-px bg-slate-800 my-2" />

                    {/* Adviser List */}
                    <div className="flex items-center gap-4">
                        <Label className="text-base w-48 text-slate-100">Adviser List</Label>
                        <Button variant="outline" className="flex-1 justify-start gap-2 h-10 px-4 font-normal text-base bg-transparent border-slate-800 text-slate-100 hover:bg-slate-800 hover:text-slate-100">
                            <Edit className="h-4 w-4" />
                            Edit / Add Advisers
                        </Button>
                    </div>

                    {/* Categories */}
                    <div className="flex items-center gap-4">
                        <Label className="text-base w-48 text-slate-100">Categories</Label>
                        <Button variant="outline" className="flex-1 justify-start gap-2 h-10 px-4 font-normal text-base bg-transparent border-slate-800 text-slate-100 hover:bg-slate-800 hover:text-slate-100">
                            <Edit className="h-4 w-4" />
                            Edit / Add Categories
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
