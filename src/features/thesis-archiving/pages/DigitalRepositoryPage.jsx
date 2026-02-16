import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Search, Plus, Calendar, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";

export default function DigitalRepositoryPage() {
    const [isAddEntryModalOpen, setIsAddEntryModalOpen] = React.useState(false);
    const navigate = useNavigate();

    const THESIS_ENTRIES = [
        {
            id: "1",
            title: "Automated Crops Monitoring using IoT",
            description: "A comprehensive study on leveraging IoT sensors for real-time agricultural oversight...",
            authors: ["Christopher Quinto", "John Doe", "Kendra Wilson"],
            year: "2025",
            category: "Internet of Things"
        },
        {
            id: "2",
            title: "Library Management System with RFID",
            description: "Development of a secure entry and borrowing system utilizing RFID technology...",
            authors: ["C. Quinto", "J. Doe", "K. Wilson"],
            year: "2025",
            category: "Information Systems"
        },
        {
            id: "3",
            title: "AI-Powered Traffic Management System",
            description: "Optimizing urban traffic flow using deep learning and real-time computer vision...",
            authors: ["S. Smith", "M. Johnson", "R. Lee"],
            year: "2024",
            category: "Artificial Intelligence"
        },
        {
            id: "4",
            title: "Blockchain for Secure Medical Records",
            description: "Establishing a decentralized and immutable ledger for patient healthcare data...",
            authors: ["A. Brown", "B. Clark", "D. Martinez"],
            year: "2024",
            category: "Cybersecurity"
        },
        {
            id: "5",
            title: "Machine Learning in Financial Forecasting",
            description: "Analyzing stock market trends and predicting fluctuations using LSTM networks...",
            authors: ["E. Garcia", "F. White", "G. Thompson"],
            year: "2023",
            category: "Machine Learning"
        }
    ];

    return (
        <div className="flex flex-col min-h-screen w-full bg-slate-950 text-slate-100">
            <ThesisArchivingHeader title="Digital Repository" />

            {/* Main Content */}
            <main className="flex-1 p-6">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Search and Filters */}
                    <div className="flex flex-wrap items-center gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
                        <div className="relative flex-1 min-w-[300px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search Title, Authors etc."
                                className="pl-10 bg-slate-950/50 border-slate-800 text-slate-100 placeholder:text-slate-500 focus-visible:ring-slate-700"
                            />
                        </div>
                        <Select defaultValue="all">
                            <SelectTrigger className="w-[140px] bg-slate-950/50 border-slate-800 text-slate-100">
                                <SelectValue placeholder="All Years" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                <SelectItem value="all">All Years</SelectItem>
                                <SelectItem value="2025">2025</SelectItem>
                                <SelectItem value="2024">2024</SelectItem>
                                <SelectItem value="2023">2023</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select defaultValue="all">
                            <SelectTrigger className="w-[140px] bg-slate-950/50 border-slate-800 text-slate-100">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                <SelectItem value="all">Category</SelectItem>
                                <SelectItem value="iot">Internet of Things</SelectItem>
                                <SelectItem value="ai">Artificial Intelligence</SelectItem>
                                <SelectItem value="ml">Machine Learning</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
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

                    {/* Thesis Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {THESIS_ENTRIES.map((entry) => (
                            <ThesisCard
                                key={entry.id}
                                entry={entry}
                                onClick={() => navigate(`${entry.id}`)}
                            />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

function ThesisCard({ entry, onClick }) {
    return (
        <div
            onClick={onClick}
            className="group relative bg-slate-900/60 border border-slate-800 rounded-xl p-6 hover:bg-slate-900/80 hover:border-slate-700 transition-all duration-300 cursor-pointer flex flex-col h-full shadow-sm hover:shadow-xl hover:shadow-blue-900/10"
        >
            <div className="flex justify-between items-start mb-4">
                <Badge variant="outline" className="bg-blue-500/10 border-blue-500/20 text-blue-400 font-medium">
                    {entry.category}
                </Badge>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {entry.year}
                </span>
            </div>

            <h3 className="text-lg font-bold text-slate-100 mb-3 group-hover:text-blue-400 transition-colors line-clamp-2">
                {entry.title}
            </h3>

            <p className="text-sm text-slate-400 mb-6 line-clamp-3 leading-relaxed flex-grow">
                {entry.description}
            </p>

            <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400 overflow-hidden">
                    <User className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                        {entry.authors.join(" • ")}
                    </span>
                </div>
            </div>
        </div>
    );
}
