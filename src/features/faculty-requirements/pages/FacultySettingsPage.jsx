import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Bell, Save, RefreshCw, AlertCircle } from "lucide-react";
import { useFacultySettings } from "../hooks/FacultySettingsHook";
import { useToast } from "@/components/ui/toast/toaster";

// Toast Handler to mirror Admin pattern
const FacultyToastHandler = ({ success, error }) => {
  const { addToast } = useToast();

  useEffect(() => {
    if (success) {
      addToast({ title: "Success", description: String(success), variant: "success" });
    }
  }, [success, addToast]);

  useEffect(() => {
    if (error) {
      addToast({ title: "Error", description: String(error), variant: "destructive" });
    }
  }, [error, addToast]);

  return null;
};

export default function FacultySettingsPage() {
  const {
    profile,
    loading,
    savingProfile,
    savingPreferences,
    error,
    successMessage,
    updateProfile,
    updatePreferences
  } = useFacultySettings();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: ""
  });

  const [preferences, setPreferences] = useState({
    emailEnabled: true
  });

  // Load profile data into form when available
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        email: profile.email || ""
      });
      setPreferences({
        emailEnabled: profile.email_reminders_enabled ?? true
      });
    }
  }, [profile]);

  const handleProfileSave = async () => {
    await updateProfile(
      formData.firstName,
      formData.lastName,
      formData.email
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Loading Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-full bg-neutral-50/30">

      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Account Settings</h1>
        <p className="text-neutral-500 text-sm font-medium">Manage your profile and notification preferences</p>
      </div>

      <FacultyToastHandler success={successMessage} error={error} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">

        {/* Profile Information Card */}
        <Card className="bg-white border-neutral-200 shadow-sm overflow-hidden h-max">
          <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-3.5 px-4 shrink-0">
            <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <User className="h-4 w-4 text-primary-600" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 bg-white space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-0.5">First Name</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="bg-white border-neutral-200 text-neutral-900 focus-visible:ring-primary-500 focus-visible:border-primary-500 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-0.5">Last Name</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="bg-white border-neutral-200 text-neutral-900 focus-visible:ring-primary-500 focus-visible:border-primary-500 rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-0.5">Email Address</Label>
              <Input
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-white border-neutral-200 text-neutral-900 focus-visible:ring-primary-500 focus-visible:border-primary-500 rounded-lg"
              />
              <div className="bg-warning/5 border border-warning/20 rounded-lg p-3 mt-3 flex items-start gap-2.5 shadow-sm">
                <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-warning uppercase tracking-wider mb-0.5">Notice</p>
                  <p className="text-xs font-medium text-neutral-600 leading-relaxed">
                    Changing this email affects notifications but not your Google login credentials.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100 flex justify-end">
              <Button
                onClick={handleProfileSave}
                disabled={savingProfile}
                className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs h-9 px-5 shadow-sm active:scale-95 transition-all"
              >
                {savingProfile ? (
                  <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="h-3.5 w-3.5 mr-1.5" /> Save Profile</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings Card */}
        <Card className="bg-white border-neutral-200 shadow-sm overflow-hidden h-max">
          <CardHeader className="border-b border-neutral-200 bg-neutral-50/50 py-3.5 px-4 shrink-0">
            <CardTitle className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Bell className="h-4 w-4 text-warning" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 bg-white space-y-5">
            <div className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-xl shadow-sm transition-all hover:border-neutral-300">
              <div className="pr-4">
                <p className="text-sm font-bold text-neutral-900">Email Reminders</p>
                <p className="text-[11px] text-neutral-500 font-medium mt-1 leading-relaxed">
                  Receive daily automated digests about upcoming deadlines, grace periods, and required document submissions.
                </p>
              </div>
              <Switch
                checked={preferences.emailEnabled}
                onCheckedChange={async (checked) => {
                  setPreferences({ ...preferences, emailEnabled: checked });
                  await updatePreferences(checked);
                }}
                disabled={savingPreferences}
                className="data-[state=checked]:bg-success shadow-sm shrink-0"
              />
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}