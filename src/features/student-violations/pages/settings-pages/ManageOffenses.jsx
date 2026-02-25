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

const GRID_STYLE_OVERRIDES = `
  .ag-theme-quartz-dark {
    --ag-background-color: #0f172a !important;
    --ag-header-background-color: #1e293b !important;
    --ag-border-color: #1e293b !important;
    --ag-header-foreground-color: #94a3b8 !important;
    --ag-foreground-color: #ffffff !important;
    --ag-row-hover-color: rgba(30, 41, 59, 0.5) !important;
  }
  .ag-theme-quartz-dark .ag-header-cell-label {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
  }
  .ag-theme-quartz-dark .ag-cell {
    font-size: 14px;
    color: #e2e8f0 !important;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #1e293b44 !important;
  }
  .ag-theme-quartz-dark .ag-row {
    background-color: #0f172a !important;
  }
  .ag-theme-quartz-dark .ag-filter-wrapper {
    background-color: #1e293b !important;
    border: 1px solid #334155 !important;
  }
`;

const ManageOffenses = () => {
    const navigate = useNavigate();
    const [gridApi, setGridApi] = useState(null);
    const [offenses, setOffenses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

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

        // Inject Grid Styles
        const styleEl = document.createElement('style');
        styleEl.innerHTML = GRID_STYLE_OVERRIDES;
        document.head.appendChild(styleEl);
        return () => document.head.removeChild(styleEl);
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
            flex: 2,
            filter: true,
            cellStyle: { color: '#f8fafc', fontWeight: '600' }
        },
        {
            headerName: "Severity",
            field: "severity",
            flex: 1,
            filter: true,
            cellRenderer: (params) => {
                let colorClass = "text-slate-400";
                if (params.value === "Major") colorClass = "text-rose-400";
                if (params.value === "Minor") colorClass = "text-amber-400";
                if (params.value === "Compliance") colorClass = "text-emerald-400";

                return <span className={`font-medium ${colorClass}`}>{params.value}</span>;
            }
        },
        {
            headerName: "Description",
            field: "description",
            flex: 2,
            tooltipField: "description",
            cellStyle: { color: '#94a3b8' }
        },
        {
            headerName: "Actions",
            field: "action",
            width: 140,
            pinned: 'right',
            cellRenderer: (params) => (
                <div className="flex items-center justify-end h-full gap-2 pr-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 bg-slate-800 border-slate-700 text-slate-300 hover:text-indigo-400 transition-colors"
                        onClick={() => handleOpenModal(params.data)}
                        title="Edit"
                    >
                        <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 bg-slate-800 border-slate-700 text-slate-300 hover:text-rose-400 transition-colors"
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
        <div className="space-y-6 animate-in fade-in duration-500 text-left">
            {/* Header with Back Button */}
            <div className="flex flex-col gap-4">
                <Button
                    variant="ghost"
                    className="w-fit text-slate-400 hover:text-white pl-0 gap-2 hover:bg-transparent"
                    onClick={() => navigate('/violation-settings')}
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Settings
                </Button>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Manage Offenses</h1>
                        <p className="text-slate-400">Configure student offense types and categorization</p>
                    </div>
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                        onClick={() => handleOpenModal()}
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add Offense
                    </Button>
                </div>
            </div>

            {/* Grid Card */}
            <Card className="bg-slate-900 border-slate-800 flex flex-col rounded-lg overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800/20">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-slate-400" />
                        <h3 className="text-sm font-semibold text-slate-200">Offense Type Directory</h3>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input
                                placeholder="Search offenses..."
                                className="pl-9 bg-slate-950 border-slate-800 text-slate-200 text-sm h-9 rounded-md focus:ring-1 focus:ring-indigo-600"
                                onChange={(e) => gridApi?.setQuickFilter(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="h-9 px-3 bg-slate-800 border-slate-700 text-slate-400 hover:text-white">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="ag-theme-quartz-dark w-full" style={{ height: "600px" }}>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-slate-400">
                            Loading offenses...
                        </div>
                    ) : (
                        <AgGridReact
                            theme={themeQuartz}
                            rowData={offenses}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            onGridReady={(params) => setGridApi(params.api)}
                            animateRows={true}
                            rowHeight={48}
                            headerHeight={44}
                            pagination={true}
                            paginationPageSize={15}
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
