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
import { KeyRound } from "lucide-react";

export function ResetPasswordDialog({ open, onOpenChange, user, onSubmit }) {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const isMatch = password === confirmPassword;
    const isValid = password.length > 0 && isMatch;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isValid || !user) return;
        onSubmit?.({ id: user.id, password });
        setPassword("");
        setConfirmPassword("");
        onOpenChange(false);
    };

    const handleCancel = () => {
        setPassword("");
        setConfirmPassword("");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] bg-slate-900 text-slate-100 border-slate-800">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <KeyRound className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-semibold">
                                Reset Password
                            </DialogTitle>
                            <DialogDescription className="text-slate-400">
                                {user ? `For ${user.first_name} ${user.last_name}` : "Loading..."}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-slate-300 text-sm">New Password</Label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-slate-700"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label className="text-slate-300 text-sm">Confirm Password</Label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`bg-slate-950 border text-slate-100 placeholder:text-slate-600 focus-visible:ring-slate-700 ${confirmPassword && !isMatch ? "border-rose-500/50 focus-visible:ring-rose-500/50" : "border-slate-800"
                                }`}
                        />
                        {confirmPassword && !isMatch && (
                            <span className="text-rose-400 text-xs mt-0.5">Passwords do not match</span>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-2">
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
                            className="bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40"
                        >
                            Reset Password
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
