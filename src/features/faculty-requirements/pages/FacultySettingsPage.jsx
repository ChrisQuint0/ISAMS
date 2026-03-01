import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Bell,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useFacultySettings } from "../hooks/FacultySettingsHook";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    email: "",
    department: "",
    position: "",
    consultationHours: ""
  });

  const [preferences, setPreferences] = useState({
    emailEnabled: true,
    frequency: "Daily"
  });

  // Load profile data into form when available
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        email: profile.email || "",
        department: profile.department || "",
        position: profile.position || "",
        consultationHours: profile.consultation_hours || ""
      });
      setPreferences({
        emailEnabled: profile.email_reminders_enabled ?? true,
        frequency: profile.reminder_frequency || "3_days_before"
      });
    }
  }, [profile]);

  const handleProfileSave = async () => {
    await updateProfile(
      formData.firstName,
      formData.lastName,
      formData.consultationHours,
      formData.department,
      formData.email
    );
  };

  const handlePreferencesSave = async () => {
    await updatePreferences(preferences.emailEnabled, preferences.frequency);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600 mb-4" />
        <p className="text-neutral-500 font-medium">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-1">Account Settings</h1>
        <p className="text-neutral-500 font-medium text-sm">Manage your profile and notification preferences</p>
      </div>

      {error && (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/5 text-destructive shadow-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-success/30 bg-success/5 text-success shadow-sm">
          <CheckCircle className="h-4 w-4 text-success" />
          <AlertDescription className="font-medium">{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 lg:p-8">
          <div className="flex items-center mb-6 pb-4 border-b border-neutral-100">
            <div className="p-2.5 bg-primary-50 rounded-lg mr-4 border border-primary-100 shadow-sm">
              <User className="text-primary-600 h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900">Profile Information</h2>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">First Name</label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="bg-white border-neutral-200 text-neutral-900 focus-visible:ring-primary-500 shadow-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Last Name</label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="bg-white border-neutral-200 text-neutral-900 focus-visible:ring-primary-500 shadow-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Email Address</label>
              <Input
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-white border-neutral-200 text-neutral-900 focus-visible:ring-primary-500 shadow-sm font-medium"
              />
              <p className="text-[11px] font-bold text-warning uppercase tracking-wider mt-2 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Changing this email affects notifications but not your login credentials.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Department</label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="bg-white border-neutral-200 text-neutral-900 focus-visible:ring-primary-500 shadow-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Position</label>
                <Input
                  value={formData.position}
                  disabled
                  className="bg-neutral-50 border-neutral-200 text-neutral-500 cursor-not-allowed shadow-inner font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Consultation Hours</label>
              <Input
                value={formData.consultationHours}
                onChange={(e) => setFormData({ ...formData, consultationHours: e.target.value })}
                placeholder="e.g. Mon/Wed 10:00 AM - 12:00 PM"
                className="bg-white border-neutral-200 text-neutral-900 focus-visible:ring-primary-500 shadow-sm font-medium"
              />
            </div>

            <div className="pt-4 border-t border-neutral-100 mt-6">
              <Button
                onClick={handleProfileSave}
                disabled={savingProfile}
                className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-sm active:scale-95 transition-all"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" /> Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 lg:p-8 flex flex-col h-max">
          <div className="flex items-center mb-6 pb-4 border-b border-neutral-100">
            <div className="p-2.5 bg-warning/10 rounded-lg mr-4 border border-warning/20 shadow-sm">
              <Bell className="text-warning h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900">Notifications</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-xl shadow-sm">
              <div>
                <p className="font-bold text-neutral-900">Email Reminders</p>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">Receive updates about upcoming deadlines</p>
              </div>
              <Switch
                checked={preferences.emailEnabled}
                onCheckedChange={(checked) => setPreferences({ ...preferences, emailEnabled: checked })}
                className="data-[state=checked]:bg-success shadow-sm"
              />
            </div>

            {preferences.emailEnabled && (
              <div className="p-1">
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Reminder Frequency</label>
                <select
                  className="w-full px-3 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm font-medium cursor-pointer"
                  value={preferences.frequency}
                  onChange={(e) => setPreferences({ ...preferences, frequency: e.target.value })}
                >
                  <option value="daily">Daily Summary</option>
                  <option value="weekly">Weekly Digest</option>
                  <option value="3_days_before">Only Urgent Deadlines (3 days left)</option>
                </select>
              </div>
            )}

            <div className="pt-4 border-t border-neutral-100">
              <Button
                onClick={handlePreferencesSave}
                disabled={savingPreferences}
                variant="outline"
                className="w-full sm:w-auto bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 font-bold shadow-sm active:scale-95 transition-all"
              >
                {savingPreferences ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" /> Save Preferences
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}