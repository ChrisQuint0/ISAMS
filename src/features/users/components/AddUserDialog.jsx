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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      await onSubmit?.(form);
      setForm(EMPTY_FORM);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-white text-gray-900 border-neutral-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add User</DialogTitle>
          <DialogDescription className="text-slate-400">
            Create a new account and assign it to a system module.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
          {/* Module */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-gray-700 text-sm">Create a user for</Label>
            <Select value={form.module} onValueChange={handleModuleChange}>
              <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:ring-neutral-500">
                <SelectValue placeholder="Select module…" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300 text-gray-900">
                {MODULES.map((m) => (
                  <SelectItem
                    key={m.value}
                    value={m.value}
                    className="focus:bg-neutral-50 focus:text-gray-900"
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
              <Label className="text-gray-700 text-sm">First Name</Label>
              <Input
                placeholder="Juan"
                value={form.firstName}
                onChange={handleField("firstName")}
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:ring-neutral-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-gray-700 text-sm">Last Name</Label>
              <Input
                placeholder="dela Cruz"
                value={form.lastName}
                onChange={handleField("lastName")}
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:ring-neutral-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-gray-700 text-sm">Email</Label>
            <Input
              type="email"
              placeholder="user@ccs.edu"
              value={form.email}
              onChange={handleField("email")}
              className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:ring-neutral-500"
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
              className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:ring-neutral-500"
            />
          </div>

          {/* Role — only show when a module is selected */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-gray-700 text-sm">Role</Label>
            <Select
              value={form.role}
              onValueChange={handleRoleChange}
              disabled={!form.module}
            >
              <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:ring-neutral-500 disabled:opacity-40 disabled:cursor-not-allowed">
                <SelectValue
                  placeholder={
                    form.module ? "Select role…" : "Select a module first"
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300 text-gray-900">
                {selectedModule?.roles.map((r) => (
                  <SelectItem
                    key={r.value}
                    value={r.value}
                    className="focus:bg-neutral-50 focus:text-gray-900"
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
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="bg-transparent border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40"
            >
              {isSubmitting ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
