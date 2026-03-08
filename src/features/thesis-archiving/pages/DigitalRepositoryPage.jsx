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
import { thesisService } from "../services/thesisService";
import { useToast } from "@/components/ui/toast/toaster";

export default function DigitalRepositoryPage() {
    const [isAddEntryModalOpen, setIsAddEntryModalOpen] = React.useState(false);
    const navigate = useNavigate();

    const [entries, setEntries] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [categories, setCategories] = React.useState([]);
    const [years, setYears] = React.useState([]);
    const { addToast } = useToast();

    // Filter states
    const [searchQuery, setSearchQuery] = React.useState("");
    const [debouncedSearch, setDebouncedSearch] = React.useState("");
    const [selectedYear, setSelectedYear] = React.useState("all");
    const [selectedCategory, setSelectedCategory] = React.useState("all");

    // Debounce search query
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchDropdownData = React.useCallback(async () => {
        try {
            const [categoriesData, yearsData] = await Promise.all([
                thesisService.getCategories(),
                thesisService.getPublicationYears()
            ]);
            setCategories(categoriesData);
            setYears(yearsData);
        } catch (error) {
            console.error("Error fetching dropdown data:", error);
        }
    }, []);

    const fetchEntries = React.useCallback(async () => {
        try {
            setLoading(true);
            const data = await thesisService.getThesisEntries({
                search: debouncedSearch,
                year: selectedYear,
                categoryId: selectedCategory
            });

            // Map the Supabase data to match the UI's expected structure
            const mappedData = data.map(entry => ({
                id: entry.id,
                title: entry.title,
                description: entry.description,
                authors: entry.authors
                    ? entry.authors
                        .sort((a, b) => a.display_order - b.display_order)
                        .map(a => `${a.first_name} ${a.last_name}`)
                    : [],
                year: entry.publication_year.toString(),
                category: entry.category?.name || "Uncategorized"
            }));

            setEntries(mappedData);
        } catch (error) {
            console.error("Error fetching entries:", error);
            addToast({
                title: "Error",
                description: "Failed to load repository data.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [addToast, debouncedSearch, selectedYear, selectedCategory]);

    React.useEffect(() => {
        fetchDropdownData();
    }, [fetchDropdownData]);

    React.useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    return (
        <div className="flex flex-col min-h-screen w-full bg-neutral-100 text-neutral-900">
            <ThesisArchivingHeader title="Digital Repository" variant="light" />

            {/* Main Content */}
            <main className="flex-1 p-6">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Search and Filters */}
                    <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-neutral-200">
                        <div className="relative flex-1 min-w-[300px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                            <Input
                                placeholder="Search Title, Authors etc."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-500 focus-visible:ring-neutral-900/20"
                            />
                        </div>
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="w-[140px] bg-neutral-50 border-neutral-200 text-neutral-900">
                                <SelectValue placeholder="All Years" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-neutral-200 text-neutral-900">
                                <SelectItem value="all">All Years</SelectItem>
                                {years.map(year => (
                                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-[140px] bg-neutral-50 border-neutral-200 text-neutral-900">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-neutral-200 text-neutral-900">
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            className="bg-primary-500 hover:bg-primary-600 text-white shadow-sm border border-primary-600"
                            onClick={() => setIsAddEntryModalOpen(true)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Entry
                        </Button>
                    </div>

                    <AddThesisEntryModal
                        open={isAddEntryModalOpen}
                        onOpenChange={setIsAddEntryModalOpen}
                        onSuccess={fetchEntries}
                    />

                    {/* Thesis Cards Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-64 rounded-xl bg-neutral-200 animate-pulse border border-neutral-300" />
                            ))}
                        </div>
                    ) : entries.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {entries.map((entry) => (
                                <ThesisCard
                                    key={entry.id}
                                    entry={entry}
                                    onClick={() => navigate(`${entry.id}`)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-neutral-500 border-2 border-dashed border-neutral-300 rounded-2xl">
                            <span className="text-lg font-medium mb-1">No researches found</span>
                            <p className="text-sm">Click the button above to archive your first entry.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function ThesisCard({ entry, onClick }) {
    return (
        <div
            onClick={onClick}
            className="group relative bg-white border border-neutral-200 rounded-xl p-6 hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-300 cursor-pointer flex flex-col h-full shadow-sm hover:shadow-md"
        >
            <div className="flex justify-between items-start mb-4">
                <Badge variant="outline" className="bg-primary-500/10 border-primary-500/20 text-primary-600 font-medium">
                    {entry.category}
                </Badge>
                <span className="text-xs text-neutral-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {entry.year}
                </span>
            </div>

            <h3 className="text-lg font-bold text-neutral-900 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">
                {entry.title}
            </h3>

            <p className="text-sm text-neutral-600 mb-6 line-clamp-3 leading-relaxed flex-grow">
                {entry.description}
            </p>

            <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-neutral-600 overflow-hidden">
                    <User className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                        {entry.authors.join(" • ")}
                    </span>
                </div>
            </div>
        </div>
    );
}
