import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, FileText, Users, Settings } from "lucide-react";

export default function RoleSelectionPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-slate-100">Faculty Requirements System</h1>
          <p className="text-xl text-slate-400">Choose your role to continue</p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Administrator Card */}
          <Card className="bg-slate-900 border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-slate-700">
            <CardHeader className="text-center space-y-4 pb-6">
              <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-blue-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-100">Administrator</CardTitle>
              <CardDescription className="text-slate-400">
                Manage faculty requirements, monitor submissions, and oversee the entire system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span>Monitor faculty submissions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-slate-400" />
                  <span>Configure deadlines and requirements</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span>Generate reports and analytics</span>
                </div>
              </div>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => navigate("/admin-dashboard")}
              >
                Continue as Administrator
              </Button>
            </CardContent>
          </Card>

          {/* Faculty Member Card */}
          <Card className="bg-slate-900 border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-slate-700">
            <CardHeader className="text-center space-y-4 pb-6">
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                <FileText className="h-8 w-8 text-green-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-100">Faculty Member</CardTitle>
              <CardDescription className="text-slate-400">
                Submit required documents, track your progress, and manage your submissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span>Submit required documents</span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-slate-400" />
                  <span>Track submission progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-400" />
                  <span>Access templates and resources</span>
                </div>
              </div>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => navigate("/faculty-requirements/dashboard")}
              >
                Continue as Faculty Member
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-slate-500">
            College of Computer Studies - Faculty Requirements Management System
          </p>
        </div>
      </div>
    </div>
  );
}
