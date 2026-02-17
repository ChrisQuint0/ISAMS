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
    saving,
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
    position: ""
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
        position: profile.position || ""
      });
      setPreferences({
        emailEnabled: profile.email_reminders_enabled ?? true,
        frequency: profile.reminder_frequency || "Daily"
      });
    }
  }, [profile]);

  const handleProfileSave = async () => {
    await updateProfile(formData.firstName, formData.lastName);
  };

  const handlePreferencesSave = async () => {
    await updatePreferences(preferences.emailEnabled, preferences.frequency);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
        <p className="text-slate-400">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Account Settings</h1>
        <p className="text-slate-400">Manage your profile and notification preferences</p>
      </div>

      {error && (
        <Alert variant="destructive" className="border-red-900/50 bg-red-900/10 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-green-900/50 bg-green-900/10 text-green-200">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <User className="text-blue-400 mr-3 h-6 w-6" />
            <h2 className="text-lg font-semibold text-slate-100">Profile Information</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">First Name</label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Last Name</label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
              <Input
                value={formData.email}
                disabled
                className="bg-slate-800/50 border-slate-700 text-slate-400 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Department</label>
                <Input
                  value={formData.department}
                  disabled
                  className="bg-slate-800/50 border-slate-700 text-slate-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Position</label>
                <Input
                  value={formData.position}
                  disabled
                  className="bg-slate-800/50 border-slate-700 text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleProfileSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? (
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
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <Bell className="text-amber-400 mr-3 h-6 w-6" />
            <h2 className="text-lg font-semibold text-slate-100">Notifications</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-100">Email Reminders</p>
                <p className="text-sm text-slate-400">Receive updates about upcoming deadlines</p>
              </div>
              <Switch
                checked={preferences.emailEnabled}
                onCheckedChange={(checked) => setPreferences({ ...preferences, emailEnabled: checked })}
              />
            </div>

            {preferences.emailEnabled && (
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Reminder Frequency</label>
                <select
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={preferences.frequency}
                  onChange={(e) => setPreferences({ ...preferences, frequency: e.target.value })}
                >
                  <option value="Daily">Daily Summary</option>
                  <option value="Weekly">Weekly Digest</option>
                  <option value="Urgent">Only Urgent Deadlines (3 days left)</option>
                </select>
              </div>
            )}

            <div className="pt-4">
              <Button
                onClick={handlePreferencesSave}
                disabled={saving}
                variant="outline"
                className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              >
                {saving ? (
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
