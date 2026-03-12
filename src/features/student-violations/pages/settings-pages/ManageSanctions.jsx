import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";
import { FileWarning, Search, ArrowLeft, Plus, Filter, Edit2, Trash2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";

import { AddSanctionModal } from "../../components/AddSanctionModal";

ModuleRegistry.registerModules([AllCommunityModule]);

// Custom theme using AG Grid v33+ Theming API with Quartz theme for a clean institutional look
const customTheme = themeQuartz.withParams({
    accentColor: 'var(--warning)',
    backgroundColor: 'var(--neutral-50)',
    foregroundColor: 'var(--neutral-900)',
    borderColor: 'var(--neutral-200)',
    headerBackgroundColor: 'var(--neutral-100)',
    headerTextColor: 'var(--neutral-900)',
    oddRowBackgroundColor: '#ffffff',
    rowHoverColor: 'var(--neutral-100)',
    selectedRowBackgroundColor: 'color-mix(in srgb, var(--warning) 10%, transparent)',
    rowHeight: 48,
    headerHeight: 40,
    headerFontWeight: '700',
    fontSize: '13px',
});

const ManageSanctions = () => {
    const navigate = useNavigate();
    const [gridApi, setGridApi] = useState(null);
    const [sanctions, setSanctions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchText, setSearchText] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSanction, setSelectedSanction] = useState(null);

    const fetchSanctions = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('sanctions_sv')
                .select('*')
                .order('severity', { ascending: true })
                .order('frequency', { ascending: true });

            if (error) throw error;
            setSanctions(data || []);
        } catch (err) {
            console.error("Error fetching sanctions:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSanctions();
    }, []);

    const handleOpenModal = (sanction = null) => {
        setSelectedSanction(sanction);
        setIsModalOpen(true);
    };

    const handleDelete = async (data) => {
        if (window.confirm(`Are you sure you want to delete this sanction matrix entry?`)) {
            try {
                const { error } = await supabase
                    .from('sanctions_sv')
                    .delete()
                    .eq('matrix_id', data.matrix_id);

                if (error) {
                    throw error;
                } else {
                    await fetchSanctions();
                }
            } catch (err) {
                console.error("Error deleting sanction:", err);
            }
        }
    };

    const formatFrequency = (freq) => {
        if (freq === 1) return "1st Offense";
        if (freq === 2) return "2nd Offense";
        if (freq === 3) return "3rd Offense";
        return `${freq}th Offense`;
    };

    const columnDefs = useMemo(() => [
        {
            headerName: "Severity",
            field: "severity",
            flex: 1,
            filter: true,
            cellRenderer: (params) => {
                let colorClass = "text-neutral-500 bg-neutral-100";
                if (params.value === "Major") colorClass = "text-destructive-semantic bg-red-50";
                if (params.value === "Minor") colorClass = "text-warning bg-amber-50";
                if (params.value === "Compliance") colorClass = "text-neutral-600 bg-neutral-100";

                return <span className={`font-bold text-[10px] uppercase tracking-widest px-2 py-1 rounded shadow-sm border border-neutral-200/50 ${colorClass}`}>{params.value}</span>;
            }
        },
        {
            headerName: "Occurrence",
            field: "frequency",
            flex: 1,
            filter: true,
            getQuickFilterText: (params) => formatFrequency(params.value),
            cellRenderer: (params) => (
                <span className="text-neutral-600 font-medium">{formatFrequency(params.value)}</span>
            )
        },
        {
            headerName: "Sanction",
            field: "sanction_name",
            flex: 1.5,
            filter: true,
            cellStyle: { color: 'var(--neutral-900)', fontWeight: '600' }
        },
        {
            headerName: "Description",
            field: "sanction_description",
            flex: 2,
            filter: true,
            tooltipField: "sanction_description",
            cellStyle: { color: 'var(--neutral-500)' }
        },
        {
            headerName: "Actions",
            field: "action",
            width: 140,
            pinned: 'right',
            cellRenderer: (params) => (
                <div className="flex items-center justify-end h-full gap-2 pr-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-neutral-400 hover:text-warning hover:bg-amber-50 transition-colors"
                        onClick={() => handleOpenModal(params.data)}
                        title="Edit"
                    >
                        <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-neutral-400 hover:text-destructive-semantic hover:bg-red-50 transition-colors"
                        onClick={() => handleDelete(params.data)}
                        title="Delete"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            )
        }
    ], []);

    const defaultColDef = useMemo(() => ({
        sortable: true,
        resizable: true,
    }), []);

    return (
        <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-500 text-left bg-neutral-50 px-2">
            {/* Header with Back Button */}
            <div className="flex flex-col gap-4">
                <Button
                    variant="ghost"
                    className="w-fit text-neutral-500 hover:text-neutral-900 pl-0 gap-2 hover:bg-transparent -ml-2 font-bold group"
                    onClick={() => navigate('/violation-settings')}
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Settings
                </Button>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Manage Sanctions</h1>
                        <p className="text-neutral-500 text-sm font-medium mt-1">Configure disciplinary actions and sanction matrices</p>
                    </div>
                    <Button
                        className="bg-warning hover:bg-amber-600 text-white shadow-md shadow-amber-900/10 font-bold h-9 px-4 rounded-md text-sm active:scale-95 transition-all"
                        onClick={() => handleOpenModal()}
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add Sanction Matrix
                    </Button>
                </div>
            </div>

            {/* Grid Card */}
            <Card className="bg-white border-neutral-200 shadow-sm flex flex-col rounded-lg overflow-hidden flex-1">
                <div className="px-4 py-4 flex items-center justify-between border-b border-neutral-100 bg-neutral-50/50">
                    <div className="flex items-center gap-2">
                        <FileWarning className="h-4 w-4 text-neutral-400" />
                        <h3 className="text-base font-bold text-neutral-900 uppercase tracking-tight">Sanction Matrix Database</h3>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-72 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-warning transition-colors" />
                            <Input
                                placeholder="Search sanctions..."
                                className="pl-9 h-8 bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400 text-xs font-medium rounded focus-visible:ring-warning focus-visible:border-warning transition-all"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="h-8 px-3 bg-white border-neutral-200 text-neutral-600 hover:text-warning hover:bg-amber-50">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="w-full flex-1" style={{ minHeight: "500px" }}>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-neutral-500 font-medium">
                            Loading sanctions...
                        </div>
                    ) : (
                        <AgGridReact
                            theme={customTheme}
                            rowData={sanctions}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            onGridReady={(params) => setGridApi(params.api)}
                            quickFilterText={searchText}
                            animateRows={true}
                            rowHeight={48}
                            headerHeight={44}
                            pagination={true}
                            paginationPageSize={15}
                        />
                    )}
                </div>
            </Card>

            <AddSanctionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchSanctions}
                editingSanction={selectedSanction}
            />
        </div>
    );
};

export default ManageSanctions;
