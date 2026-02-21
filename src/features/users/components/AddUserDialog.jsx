import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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

// ─── Module / Role Config ─────────────────────────────────────────────────────
const MODULES = [
    {
        value: "facsub",
        label: "Faculty Requirement Submission",
        roles: [
            { value: "faculty", label: "Faculty" },
            { value: "admin", label: "Admin" },
        ],
    },
    {
        value: "thesis",
        label: "Thesis Archiving",
        roles: [
            {
                value: "admin",
                label: "Admin",
                description: "Can edit, upload, and approve entries",
            },
            {
                value: "student",
                label: "Student",
                description: "Can view and upload",
            },
        ],
    },
    {
        value: "labman",
        label: "Laboratory Management",
        roles: [
            { value: "admin", label: "Admin" },
            { value: "faculty", label: "Faculty" },
        ],
    },
    {
        value: "studvio",
        label: "Student Violations",
        roles: [{ value: "admin", label: "Admin" }],
    },
];

const EMPTY_FORM = {
    module: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "",
};

// ─── Component ────────────────────────────────────────────────────────────────
export function AddUserDialog({ open, onOpenChange, onSubmit }) {
    const [form, setForm] = useState(EMPTY_FORM);

    const selectedModule = MODULES.find((m) => m.value === form.module);

    const handleModuleChange = (value) => {
        setForm((f) => ({ ...f, module: value, role: "" }));
    };

    const handleField = (field) => (e) => {
        setForm((f) => ({ ...f, [field]: e.target.value }));
    };

    const handleRoleChange = (value) => {
        setForm((f) => ({ ...f, role: value }));
    };

    const isValid =
        form.module &&
        form.firstName.trim() &&
        form.lastName.trim() &&
        form.email.trim() &&
        form.password.trim() &&
        form.role;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isValid) return;
        onSubmit?.(form);
        setForm(EMPTY_FORM);
        onOpenChange(false);
    };

    const handleCancel = () => {
        setForm(EMPTY_FORM);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] bg-slate-900 text-slate-100 border-slate-800">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        Add User
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Create a new account and assign it to a system module.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
                    {/* Module */}
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-slate-300 text-sm">Create a user for</Label>
                        <Select value={form.module} onValueChange={handleModuleChange}>
                            <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100 focus:ring-slate-700">
                                <SelectValue placeholder="Select module…" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                {MODULES.map((m) => (
                                    <SelectItem
                                        key={m.value}
                                        value={m.value}
                                        className="focus:bg-slate-800 focus:text-slate-100"
                                    >
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Name row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-slate-300 text-sm">First Name</Label>
                            <Input
                                placeholder="Juan"
                                value={form.firstName}
                                onChange={handleField("firstName")}
                                className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-slate-700"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-slate-300 text-sm">Last Name</Label>
                            <Input
                                placeholder="dela Cruz"
                                value={form.lastName}
                                onChange={handleField("lastName")}
                                className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-slate-700"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-slate-300 text-sm">Email</Label>
                        <Input
                            type="email"
                            placeholder="user@ccs.edu"
                            value={form.email}
                            onChange={handleField("email")}
                            className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-slate-700"
                        />
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-slate-300 text-sm">Password</Label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={handleField("password")}
                            className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-slate-700"
                        />
                    </div>

                    {/* Role — only show when a module is selected */}
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-slate-300 text-sm">Role</Label>
                        <Select
                            value={form.role}
                            onValueChange={handleRoleChange}
                            disabled={!form.module}
                        >
                            <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100 focus:ring-slate-700 disabled:opacity-40 disabled:cursor-not-allowed">
                                <SelectValue
                                    placeholder={
                                        form.module
                                            ? "Select role…"
                                            : "Select a module first"
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                {selectedModule?.roles.map((r) => (
                                    <SelectItem
                                        key={r.value}
                                        value={r.value}
                                        className="focus:bg-slate-800 focus:text-slate-100"
                                    >
                                        <div className="flex flex-col">
                                            <span>{r.label}</span>
                                            {r.description && (
                                                <span className="text-xs text-slate-500 font-normal">
                                                    {r.description}
                                                </span>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isValid}
                            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40"
                        >
                            Create User
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
