import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";
import { ShieldAlert, Search, ArrowLeft, Plus, Filter, Edit2, Trash2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";

import { AddOffenseModal } from "../../components/AddOffenseModal";

ModuleRegistry.registerModules([AllCommunityModule]);

// Custom theme using AG Grid v33+ Theming API with Quartz theme for a clean institutional look
const customTheme = themeQuartz.withParams({
  accentColor: 'var(--primary-600)',
  backgroundColor: 'var(--neutral-50)',
  foregroundColor: 'var(--neutral-900)',
  borderColor: 'var(--neutral-200)',
  headerBackgroundColor: 'var(--neutral-100)',
  headerTextColor: 'var(--neutral-900)',
  oddRowBackgroundColor: '#ffffff',
  rowHoverColor: 'var(--neutral-100)',
  selectedRowBackgroundColor: 'color-mix(in srgb, var(--primary-500) 10%, transparent)',
  rowHeight: 48,
  headerHeight: 40,
  headerFontWeight: '700',
  fontSize: '13px',
});

const ManageOffenses = () => {
    const navigate = useNavigate();
    const [gridApi, setGridApi] = useState(null);
    const [offenses, setOffenses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchText, setSearchText] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOffense, setSelectedOffense] = useState(null);

    const fetchOffenses = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('offense_types_sv')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setOffenses(data || []);
        } catch (err) {
            console.error("Error fetching offenses:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOffenses();
    }, []);

    const handleOpenModal = (offense = null) => {
        setSelectedOffense(offense);
        setIsModalOpen(true);
    };

    const handleDelete = async (data) => {
        if (window.confirm(`Are you sure you want to delete ${data.name}?`)) {
            try {
                const { error } = await supabase
                    .from('offense_types_sv')
                    .delete()
                    .eq('offense_type_id', data.offense_type_id);

                if (error) {
                    if (error.code === '23503') {
                        alert('Cannot delete this offense because it is referenced in existing violations.');
                    } else {
                        throw error;
                    }
                } else {
                    await fetchOffenses();
                }
            } catch (err) {
                console.error("Error deleting offense:", err);
            }
        }
    };

    const columnDefs = useMemo(() => [
        {
            headerName: "ID",
            field: "offense_type_id",
            width: 80,
        },
        {
            headerName: "Offense Name",
            field: "name",
            flex: 1,
            filter: true,
            cellStyle: { color: 'var(--neutral-900)', fontWeight: '600' }
        },
        {
            headerName: "Severity",
            field: "severity",
            width: 120,
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
            headerName: "Description",
            field: "description",
            flex: 2,
            filter: true,
            tooltipField: "description",
            cellStyle: { color: 'var(--neutral-500)' }
        },
        {
            headerName: "Actions",
            field: "action",
            width: 100,
            pinned: 'right',
            headerClass: 'text-center',
            cellRenderer: (params) => (
                <div className="flex items-center justify-center h-full gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
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
                        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Manage Offenses</h1>
                        <p className="text-neutral-500 text-sm font-medium mt-1">Configure student offense types and categorization</p>
                    </div>
                    <Button
                        className="bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-emerald-900/10 font-bold h-9 px-4 rounded-md text-sm active:scale-95"
                        onClick={() => handleOpenModal()}
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add Offense
                    </Button>
                </div>
            </div>

            {/* Grid Card */}
            <Card className="flex-1 bg-white border-neutral-200 flex flex-col rounded-lg overflow-hidden shadow-sm p-0 z-10">
                <div className="px-5 pt-5 pb-2 flex items-center justify-between bg-white relative z-20">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="h-[15px] w-[15px] text-neutral-600" />
                        <h3 className="text-[15px] font-bold text-neutral-900 uppercase tracking-wider leading-none">Offense Type Directory</h3>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-72 group">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 group-focus-within:text-primary-600 transition-colors" />
                            <Input
                                placeholder="Search offenses..."
                                className="pl-8 h-7 bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-primary-500 focus-visible:border-primary-500 transition-all font-medium text-xs shadow-sm rounded-md"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="w-full flex-1 hide-ag-scrollbars [&_.ag-root-wrapper]:border-none [&_.ag-header]:border-t-0 -mt-[15px]" style={{ minHeight: "500px" }}>
                    <style>{`
                        .hide-ag-scrollbars .ag-body-viewport::-webkit-scrollbar,
                        .hide-ag-scrollbars .ag-body-vertical-scroll-viewport::-webkit-scrollbar,
                        .hide-ag-scrollbars .ag-body-horizontal-scroll-viewport::-webkit-scrollbar {
                            display: none !important;
                            width: 0 !important;
                            height: 0 !important;
                        }
                        .hide-ag-scrollbars .ag-body-viewport,
                        .hide-ag-scrollbars .ag-body-vertical-scroll-viewport,
                        .hide-ag-scrollbars .ag-body-horizontal-scroll-viewport {
                            -ms-overflow-style: none !important;
                            scrollbar-width: none !important;
                        }
                    `}</style>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-neutral-500 font-medium">
                            Loading offenses...
                        </div>
                    ) : (
                        <AgGridReact
                            theme={customTheme}
                            rowData={offenses}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            onGridReady={(params) => setGridApi(params.api)}
                            quickFilterText={searchText}
                            animateRows={true}
                            rowHeight={48}
                            headerHeight={44}
                            pagination={true}
                            paginationPageSize={15}
                            suppressCellFocus={true}
                        />
                    )}
                </div>
            </Card>

            <AddOffenseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchOffenses}
                editingOffense={selectedOffense}
            />
        </div>
    );
};

export default ManageOffenses;
