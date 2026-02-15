import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ThesisArchivingHeader } from "../components/ThesisArchivingHeader";
import AddThesisEntryModal from "../components/AddThesisEntryModal";

export default function DigitalRepositoryPage() {
    const [isAddEntryModalOpen, setIsAddEntryModalOpen] = React.useState(false);

    return (
        <div className="flex flex-col min-h-screen w-full bg-slate-950">
            <ThesisArchivingHeader title="Digital Repository" />

            {/* Main Content */}
            <main className="flex-1 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Search and Filters */}
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search Title, Authors etc."
                                className="pl-10 bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500"
                            />
                        </div>
                        <Select defaultValue="all">
                            <SelectTrigger className="w-[140px] bg-slate-900 border-slate-800 text-slate-100">
                                <SelectValue placeholder="All Years" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                <SelectItem value="all">All Years</SelectItem>
                                <SelectItem value="2024">2024</SelectItem>
                                <SelectItem value="2023">2023</SelectItem>
                                <SelectItem value="2022">2022</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select defaultValue="all">
                            <SelectTrigger className="w-[140px] bg-slate-900 border-slate-800 text-slate-100">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                <SelectItem value="all">Category</SelectItem>
                                <SelectItem value="cs">Computer Science</SelectItem>
                                <SelectItem value="eng">Engineering</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            className="ml-auto bg-blue-600 hover:bg-blue-500 text-white"
                            onClick={() => setIsAddEntryModalOpen(true)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Entry
                        </Button>
                    </div>

                    <AddThesisEntryModal
                        open={isAddEntryModalOpen}
                        onOpenChange={setIsAddEntryModalOpen}
                    />

                    {/* Thesis Cards */}
                    <div className="space-y-4">
                        <ThesisCard
                            title="Automated Crops Monitoring using IoT (2024)"
                            description="A study focusing on the implementation of IoT sensors..."
                            authors={["C.Quinto", "J.Doe", "K.Wilson"]}
                        />
                        <ThesisCard
                            title="Library Management System with RFID (2025)"
                            description="Development of a secure entry and borrowing system."
                            authors={["C.Quinto", "J.Doe", "K.Wilson"]}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}

function ThesisCard({ title, description, authors }) {
    return (
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition-colors">
            <h3 className="text-lg font-semibold text-slate-100 mb-2">{title}</h3>
            <p className="text-sm text-slate-400 mb-3">{description}</p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
                {authors.map((author, idx) => (
                    <span key={idx}>
                        {author}
                        {idx < authors.length - 1 && " • "}
                    </span>
                ))}
            </div>
        </div>
    );
}
