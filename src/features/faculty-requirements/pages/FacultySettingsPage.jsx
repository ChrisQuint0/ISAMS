import React, { useState } from 'react';
import {
  Save, RefreshCw, Eye, Settings, CheckCircle, AlertCircle,
  User, Bell, Shield, Mail, Phone, MapPin, Clock, Upload, Camera,
  Server, Activity, HardDrive, Terminal
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

export default function FacultySettingsPage() {
  // Mock state for UI display only (no backend functionality)
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const [profileData, setProfileData] = useState({
    fullName: "Dr. Juan Dela Cruz",
    employeeId: "FAC-2024-001",
    department: "Computer Science",
    position: "Assistant Professor",
    email: "juan.delacruz@plpasig.edu.ph",
    phone: "+63 912 345 6789",
    office: "Room 304, CCS Building",
    consultationHours: "Mon-Fri, 2:00 PM - 4:00 PM"
  });

  const [emailNotifications, setEmailNotifications] = useState({
    deadlineReminders: true,
    submissionConfirmations: true,
    validationResults: true,
    newRequirements: true,
    adminFeedback: true,
    weeklySummary: false
  });

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
          <p className="text-slate-400 text-sm">Manage your profile, notifications, and preferences</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setLoading(!loading)} 
          disabled={loading}
          className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> 
          Reload Settings
        </Button>
      </div>

      {/* Notifications */}
      <div className="shrink-0">
        {error && (
          <Alert variant="destructive" className="border-red-900/50 bg-red-900/10 text-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="border-green-900/50 bg-green-900/10 text-green-200">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* TABS ORGANIZATION */}
      <Tabs defaultValue="profile" className="flex-1 flex flex-col min-h-0 space-y-6">
        <div className="shrink-0 border-b border-slate-800 pb-0">
          <TabsList className="bg-transparent p-0 h-auto space-x-6">
            <TabItem value="profile" label="Profile" icon={User} />
            <TabItem value="notifications" label="Notifications" icon={Bell} />
            <TabItem value="security" label="Security" icon={Shield} />
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto pr-2">
          {/* TAB 1: PROFILE & INFORMATION */}
          <TabsContent value="profile" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Col: Profile Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-slate-900 border-slate-800 shadow-none">
                  <CardHeader className="border-b border-slate-800 py-4">
                    <CardTitle className="text-base text-slate-100">Personal Information</CardTitle>
                    <CardDescription className="text-slate-500">Update your profile details and contact information</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Full Name */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-400 uppercase">Full Name</Label>
                        <Input 
                          value={profileData.fullName}
                          onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                          className="bg-slate-950 border-slate-700 text-slate-200 focus:border-green-500 pr-4"
                        />
                      </div>

                      {/* Employee ID (Read-Only) */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-400 uppercase">Employee ID</Label>
                        <Input 
                          value={profileData.employeeId}
                          disabled
                          className="bg-slate-950/50 border-slate-700 text-slate-400 cursor-not-allowed pr-4"
                        />
                      </div>

                      {/* Department */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-400 uppercase">Department</Label>
                        <Select value={profileData.department}>
                          <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                            <SelectItem value="Computer Science">Computer Science</SelectItem>
                            <SelectItem value="Information Technology">Information Technology</SelectItem>
                            <SelectItem value="Computer Engineering">Computer Engineering</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Position */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-400 uppercase">Position</Label>
                        <Select value={profileData.position}>
                          <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                            <SelectItem value="Instructor">Instructor</SelectItem>
                            <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                            <SelectItem value="Associate Professor">Associate Professor</SelectItem>
                            <SelectItem value="Professor">Professor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-400 uppercase">Email Address</Label>
                        <Input 
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                          className="bg-slate-950 border-slate-700 text-slate-200 focus:border-green-500 pr-4"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-400 uppercase">Phone Number</Label>
                        <Input 
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                          className="bg-slate-950 border-slate-700 text-slate-200 focus:border-green-500 pr-4"
                        />
                      </div>

                      {/* Office Location */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-400 uppercase">Office Location</Label>
                        <Input 
                          value={profileData.office}
                          onChange={(e) => setProfileData({...profileData, office: e.target.value})}
                          className="bg-slate-950 border-slate-700 text-slate-200 focus:border-green-500 pr-4"
                        />
                      </div>

                      {/* Consultation Hours */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-400 uppercase">Consultation Hours</Label>
                        <Input 
                          value={profileData.consultationHours}
                          onChange={(e) => setProfileData({...profileData, consultationHours: e.target.value})}
                          className="bg-slate-950 border-slate-700 text-slate-200 focus:border-green-500 pr-4"
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                      <Button 
                        variant="outline"
                        className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        Reset
                      </Button>
                      <Button className="bg-green-600 hover:bg-green-700 text-white">
                        <Save className="mr-2 h-4 w-4"/> Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Col: Profile Photo & Account Info */}
              <div className="space-y-6">
                <Card className="bg-slate-900 border-slate-800 shadow-none">
                  <CardHeader className="border-b border-slate-800 py-4">
                    <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400"/> Profile Photo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex justify-center">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
                          <User className="h-16 w-16 text-slate-600" />
                        </div>
                        <button className="absolute bottom-0 right-0 bg-green-600 hover:bg-green-700 p-2 rounded-full border-2 border-slate-900 transition-colors">
                          <Camera className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-center space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        <Upload className="mr-2 h-4 w-4" /> Upload New Photo
                      </Button>
                      <p className="text-xs text-slate-500">JPG or PNG, max 5MB</p>
                    </div>

                    <div className="pt-4 space-y-1 border-t border-slate-800">
                      <InfoRow label="Account Status" value="Active" />
                      <InfoRow label="Member Since" value="Jan 2024" />
                      <InfoRow label="Last Login" value="Today, 9:30 AM" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: NOTIFICATION PREFERENCES */}
          <TabsContent value="notifications" className="mt-0">
            <Card className="bg-slate-900 border-slate-800 shadow-none">
              <CardHeader className="border-b border-slate-800 py-4">
                <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-green-400"/> Notification Preferences
                </CardTitle>
                <CardDescription className="text-slate-500">Manage how and when you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-8">
                
                {/* Email Notifications Section */}
                <div>
                  <h3 className="text-sm font-medium text-slate-200 mb-4 flex items-center">
                    <Mail className="mr-2 h-4 w-4 text-blue-400"/> Email Notifications
                  </h3>
                  <div className="space-y-3 pl-1">
                    <SwitchItem 
                      label="Deadline reminders (3 days before)"
                      checked={emailNotifications.deadlineReminders}
                      onChange={(c) => setEmailNotifications({...emailNotifications, deadlineReminders: c})}
                    />
                    <SwitchItem 
                      label="Submission confirmations"
                      checked={emailNotifications.submissionConfirmations}
                      onChange={(c) => setEmailNotifications({...emailNotifications, submissionConfirmations: c})}
                    />
                    <SwitchItem 
                      label="Document validation results"
                      checked={emailNotifications.validationResults}
                      onChange={(c) => setEmailNotifications({...emailNotifications, validationResults: c})}
                    />
                    <SwitchItem 
                      label="New requirements posted"
                      checked={emailNotifications.newRequirements}
                      onChange={(c) => setEmailNotifications({...emailNotifications, newRequirements: c})}
                    />
                    <SwitchItem 
                      label="Feedback from administrator"
                      checked={emailNotifications.adminFeedback}
                      onChange={(c) => setEmailNotifications({...emailNotifications, adminFeedback: c})}
                    />
                    <SwitchItem 
                      label="Weekly summary reports"
                      checked={emailNotifications.weeklySummary}
                      onChange={(c) => setEmailNotifications({...emailNotifications, weeklySummary: c})}
                    />
                  </div>
                </div>

                {/* Notification Timing */}
                <div className="pt-6 border-t border-slate-800">
                  <h3 className="text-sm font-medium text-slate-200 mb-4 flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-green-400"/> Notification Timing
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-400 uppercase">Reminder Frequency</Label>
                      <Select defaultValue="3days">
                        <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                          <SelectItem value="1day">1 day before deadline</SelectItem>
                          <SelectItem value="3days">3 days before deadline</SelectItem>
                          <SelectItem value="7days">7 days before deadline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-400 uppercase">Summary Frequency</Label>
                      <Select defaultValue="weekly">
                        <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <Button 
                    variant="outline"
                    className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Reset to Default
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <Save className="mr-2 h-4 w-4"/> Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: SECURITY */}
          <TabsContent value="security" className="mt-0">
            <Card className="bg-slate-900 border-slate-800 shadow-none">
              <CardHeader className="border-b border-slate-800 py-4">
                <CardTitle className="text-base text-slate-100 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400"/> Account Security
                </CardTitle>
                <CardDescription className="text-slate-500">Manage your password and security preferences</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-8">
                
                {/* Change Password */}
                <div>
                  <h3 className="text-sm font-medium text-slate-200 mb-4">Change Password</h3>
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-400 uppercase">Current Password</Label>
                      <Input 
                        type="password"
                        placeholder="Enter current password"
                        className="bg-slate-950 border-slate-700 text-slate-200 focus:border-green-500 pr-4"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-400 uppercase">New Password</Label>
                      <Input 
                        type="password"
                        placeholder="Enter new password"
                        className="bg-slate-950 border-slate-700 text-slate-200 focus:border-green-500 pr-4"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-400 uppercase">Confirm New Password</Label>
                      <Input 
                        type="password"
                        placeholder="Confirm new password"
                        className="bg-slate-950 border-slate-700 text-slate-200 focus:border-green-500 pr-4"
                      />
                    </div>
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      Change Password
                    </Button>
                  </div>
                </div>

                {/* Session Management */}
                <div className="pt-6 border-t border-slate-800">
                  <h3 className="text-sm font-medium text-slate-200 mb-4">Session Management</h3>
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-400 uppercase">Auto-Logout After Inactivity</Label>
                      <Select defaultValue="30min">
                        <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                          <SelectItem value="15min">15 minutes</SelectItem>
                          <SelectItem value="30min">30 minutes</SelectItem>
                          <SelectItem value="1hour">1 hour</SelectItem>
                          <SelectItem value="never">Never (not recommended)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <Save className="mr-2 h-4 w-4"/> Save Security Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// --- Sub-components ---

const TabItem = ({ value, label, icon: Icon }) => (
  <TabsTrigger 
    value={value}
    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-green-500 data-[state=active]:text-green-400 text-slate-400 rounded-none px-4 py-3 border-b-2 border-transparent hover:text-slate-200 transition-all"
  >
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </div>
  </TabsTrigger>
);

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between text-sm py-2 border-b border-slate-800 last:border-0">
    <span className="text-slate-400">{label}</span>
    <span className="font-medium text-slate-200">{value}</span>
  </div>
);

const SwitchItem = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/30 border border-slate-800/50 hover:border-slate-700 hover:bg-slate-950/50 transition-all">
    <Label className="text-sm font-medium leading-none text-slate-300 cursor-pointer">{label}</Label>
    <Switch 
      checked={checked}
      onCheckedChange={onChange}
      className="data-[state=checked]:bg-green-600"
    />
  </div>
);
