import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, UserRoundPlus } from "lucide-react";
import { AddUserDialog } from "@/features/users/components/AddUserDialog";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule, themeBalham } from "ag-grid-community";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// ─── Theme ────────────────────────────────────────────────────────────────────
const customTheme = themeBalham.withParams({
    accentColor: "#6366f1",
    backgroundColor: "#020617",
    foregroundColor: "#e2e8f0",
    borderColor: "#1e293b",
    headerBackgroundColor: "#0f172a",
    headerTextColor: "#94a3b8",
    oddRowBackgroundColor: "#020617",
    rowHeight: 48,
    headerHeight: 40,
});

// ─── Mock Data ────────────────────────────────────────────────────────────────
// Replace with Supabase fetch in a later pass.
const MOCK_USERS = [
    {
        id: "1",
        email: "alice@ccs.edu",
        thesis: true,
        thesis_role: "admin",
        facsub: true,
        facsub_role: "admin",
        labman: false,
        labman_role: null,
        studvio: false,
        studvio_role: null,
        created_at: "2026-01-10T08:00:00Z",
    },
    {
        id: "2",
        email: "bob@ccs.edu",
        thesis: true,
        thesis_role: "student",
        facsub: false,
        facsub_role: null,
        labman: true,
        labman_role: "faculty",
        studvio: false,
        studvio_role: null,
        created_at: "2026-01-15T09:30:00Z",
    },
    {
        id: "3",
        email: "carol@ccs.edu",
        thesis: false,
        thesis_role: null,
        facsub: true,
        facsub_role: "faculty",
        labman: true,
        labman_role: "admin",
        studvio: true,
        studvio_role: "admin",
        created_at: "2026-01-20T11:00:00Z",
    },
    {
        id: "4",
        email: "dave@ccs.edu",
        thesis: false,
        thesis_role: null,
        facsub: false,
        facsub_role: null,
        labman: false,
        labman_role: null,
        studvio: true,
        studvio_role: "admin",
        created_at: "2026-02-01T14:00:00Z",
    },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const MODULE_FILTER_OPTIONS = [
    { value: "all", label: "All Users" },
    { value: "thesis", label: "Thesis Archiving" },
    { value: "facsub", label: "Faculty Requirements" },
    { value: "labman", label: "Lab Monitoring" },
    { value: "studvio", label: "Student Violations" },
];

const ROLE_BADGE_STYLES = {
    admin: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    faculty: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    student: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
};

// ─── Cell Renderers ───────────────────────────────────────────────────────────
function RoleCellRenderer({ value }) {
    if (!value) {
        return <span className="text-slate-600 text-xs select-none">—</span>;
    }
    const style = ROLE_BADGE_STYLES[value] ?? "bg-slate-700 text-slate-300 border border-slate-600";
    return (
        <div className="flex items-center justify-center h-full">
            <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${style}`}
            >
                {value}
            </span>
        </div>
    );
}

function DateCellRenderer({ value }) {
    if (!value) return <span className="text-slate-600">—</span>;
    return (
        <span className="text-slate-400 text-xs tabular-nums">
            {new Date(value).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "short",
                day: "numeric",
            })}
        </span>
    );
}

// Returns the role value for a module column, or null if no access
function moduleValueGetter(activeField, roleField) {
    return (params) => (params.data[activeField] ? params.data[roleField] : null);
}

function filterUsers(users, module) {
    if (module === "all") return users;
    return users.filter((u) => u[module] === true);
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function UsersPage() {
    const navigate = useNavigate();
    const [moduleFilter, setModuleFilter] = useState("all");
    const [addUserOpen, setAddUserOpen] = useState(false);

    const rowData = filterUsers(MOCK_USERS, moduleFilter);

    const handleAddUser = (formData) => {
        // TODO: wire to Supabase in the next pass
        console.log("New user payload:", formData);
    };

    const columnDefs = useMemo(
        () => [
            {
                headerName: "#",
                valueGetter: (p) => p.node.rowIndex + 1,
                width: 60,
                sortable: false,
                filter: false,
                resizable: false,
                cellStyle: { color: "#64748b", fontVariantNumeric: "tabular-nums" },
            },
            {
                field: "email",
                headerName: "Email",
                flex: 2,
                cellStyle: { color: "#f1f5f9", fontWeight: 500 },
            },
            {
                headerName: "Thesis Archiving",
                valueGetter: moduleValueGetter("thesis", "thesis_role"),
                cellRenderer: RoleCellRenderer,
                flex: 1,
                filter: false,
            },
            {
                headerName: "Fac. Requirements",
                valueGetter: moduleValueGetter("facsub", "facsub_role"),
                cellRenderer: RoleCellRenderer,
                flex: 1,
                filter: false,
            },
            {
                headerName: "Lab Monitoring",
                valueGetter: moduleValueGetter("labman", "labman_role"),
                cellRenderer: RoleCellRenderer,
                flex: 1,
                filter: false,
            },
            {
                headerName: "Student Violations",
                valueGetter: moduleValueGetter("studvio", "studvio_role"),
                cellRenderer: RoleCellRenderer,
                flex: 1,
                filter: false,
            },
            {
                field: "created_at",
                headerName: "Joined",
                cellRenderer: DateCellRenderer,
                width: 140,
                filter: false,
            },
        ],
        []
    );

    const defaultColDef = useMemo(
        () => ({
            sortable: true,
            filter: true,
            resizable: true,
        }),
        []
    );

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={() => navigate("/dashboard")}
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-semibold text-slate-100">
                                    User Management
                                </h1>
                                <p className="text-sm text-slate-400 mt-0.5">
                                    Manage system users and their module roles
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setAddUserOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                        >
                            <UserRoundPlus className="h-4 w-4 mr-2" />
                            Add User
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full flex flex-col gap-6">
                {/* Filter Row */}
                <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-400">Filter by module:</span>
                    <Select value={moduleFilter} onValueChange={setModuleFilter}>
                        <SelectTrigger className="w-56 bg-slate-800 border-slate-700 text-slate-200 focus:ring-slate-600">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                            {MODULE_FILTER_OPTIONS.map((opt) => (
                                <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                    className="focus:bg-slate-700 focus:text-slate-100"
                                >
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span className="ml-auto text-xs text-slate-500">
                        {rowData.length} user{rowData.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {/* AG Grid Table */}
                <div
                    className="border border-slate-800 rounded-xl overflow-hidden"
                    style={{ height: "600px" }}
                >
                    <div style={{ height: "100%", width: "100%" }}>
                        <AgGridReact
                            theme={customTheme}
                            rowData={rowData}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            animateRows={true}
                        />
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-800 bg-slate-900/30">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <p className="text-xs text-slate-500 text-center">
                        ISAMS - Integrated Smart Academic Management System • College of
                        Computer Studies © 2026
                    </p>
                </div>
            </footer>

            <AddUserDialog
                open={addUserOpen}
                onOpenChange={setAddUserOpen}
                onSubmit={handleAddUser}
            />
        </div>
    );
}
