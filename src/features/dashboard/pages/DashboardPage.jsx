import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut } from "lucide-react";
import thesisIcon from "@/assets/icons/thesis_icon.svg";
import facReqIcon from "@/assets/icons/fac_req_icon.svg";
import classlistIcon from "@/assets/icons/classlist_icon.svg";
import labIcon from "@/assets/icons/lab_icon.svg";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleModuleClick = (href) => {
    console.log("Navigating to:", href);
    navigate(href);
  };

  const modules = [
    {
      title: "Thesis Archiving",
      description:
        "Manage and archive thesis documents with advanced search and categorization",
      icon: thesisIcon,
      href: "/thesis-archiving",
      bgColor: "bg-slate-900/50",
      iconBg: "bg-slate-800",
      iconBorder: "border-slate-700",
      accentLine: "bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700",
    },
    {
      title: "Faculty Requirement Submission",
      description:
        "Submit, track, and manage faculty requirements and documentation",
      icon: facReqIcon,
      href: "/admin-dashboard",
      bgColor: "bg-blue-950/30",
      iconBg: "bg-blue-900/50",
      iconBorder: "border-blue-800/50",
      accentLine:
        "bg-gradient-to-r from-blue-800/50 via-blue-700/50 to-blue-800/50",
    },
    {
      title: "Student Violation Management",
      description:
        "Manage and track student violations effectively",
      icon: classlistIcon,
      href: "/student-violations",
      bgColor: "bg-purple-950/30",
      iconBg: "bg-purple-900/50",
      iconBorder: "border-purple-800/50",
      accentLine:
        "bg-gradient-to-r from-purple-800/50 via-purple-700/50 to-purple-800/50",
    },
    {
      title: "Laboratory Time Monitoring",
      description: "Monitor and track laboratory usage and time allocation",
      icon: labIcon,
      href: "/lab-monitoring",
      bgColor: "bg-cyan-950/30",
      iconBg: "bg-cyan-900/50",
      iconBorder: "border-cyan-800/50",
      accentLine:
        "bg-gradient-to-r from-cyan-800/50 via-cyan-700/50 to-cyan-800/50",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-100">
                ISAMS Dashboard
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Welcome back, {user?.email}
              </p>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-slate-100 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-100 mb-2">
            System Modules
          </h2>
          <p className="text-slate-400 text-sm">
            Select a module to access its features and functionality
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((module, index) => (
            <div
              key={index}
              onClick={() => handleModuleClick(module.href)}
              className="cursor-pointer"
            >
              <Card
                className={`group relative overflow-hidden ${module.bgColor} border-slate-800 hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/50`}
              >
                {/* Gloss effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-400/0 via-slate-400/0 to-slate-400/0 group-hover:from-slate-400/5 group-hover:via-slate-400/0 group-hover:to-slate-400/0 transition-all duration-500 pointer-events-none" />

                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

                <CardHeader className="relative">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-14 h-14 rounded-xl ${module.iconBg} border ${module.iconBorder} flex items-center justify-center group-hover:border-slate-600 transition-all duration-300`}
                    >
                      <img
                        src={module.icon}
                        alt={`${module.title} icon`}
                        className="w-8 h-8 object-contain group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-slate-100 group-hover:text-white transition-colors duration-300">
                        {module.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors duration-300">
                    {module.description}
                  </p>
                </CardContent>

                {/* Bottom accent line */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-0.5 ${module.accentLine} scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}
                />
              </Card>
            </div>
          ))}
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
    </div>
  );
}
