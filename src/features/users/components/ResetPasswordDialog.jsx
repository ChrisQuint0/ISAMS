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
      <DialogContent className="sm:max-w-[400px] bg-white text-gray-900 border-neutral-200">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                Reset Password
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {user
                  ? `For ${user.first_name} ${user.last_name}`
                  : "Loading..."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-gray-700 text-sm">New Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:ring-neutral-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-gray-700 text-sm">Confirm Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`bg-white border text-gray-900 placeholder:text-gray-500 focus-visible:ring-neutral-500 ${
                confirmPassword && !isMatch
                  ? "border-rose-500/50 focus-visible:ring-rose-500/50"
                  : "border-gray-300"
              }`}
            />
            {confirmPassword && !isMatch && (
              <span className="text-rose-400 text-xs mt-0.5">
                Passwords do not match
              </span>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-2">
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
              disabled={!isValid}
              className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40"
            >
              Reset Password
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
