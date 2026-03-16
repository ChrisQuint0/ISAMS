import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LogOut, UserRoundPlus, ArrowUpRight, Settings } from "lucide-react";
import isamsFavicon from "@/assets/images/isams_favicon.png";
import thesisIcon from "@/assets/icons/thesis_icon.svg";
import facReqIcon from "@/assets/icons/fac_req_icon.svg";
import classlistIcon from "@/assets/icons/classlist_icon.svg";
import labIcon from "@/assets/icons/lab_icon.svg";

const isAdmin = (rbac) => {
  if (!rbac) return false;
  return (
    rbac.superadmin === true ||
    rbac.thesis_role === "admin" ||
    rbac.facsub_role === "admin" ||
    rbac.labman_role === "admin" ||
    rbac.studvio_role === "admin"
  );
};

const isStudent = (rbac) => {
  if (!rbac) return true;
  return (
    !isAdmin(rbac) &&
    rbac.facsub_role !== "faculty" &&
    rbac.thesis_role !== "faculty" &&
    rbac.labman_role !== "faculty" &&
    rbac.studvio_role !== "faculty"
  );
};
export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, rbac, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const allModules = [
    {
      id: "thesis",
      title: "Thesis Archiving",
      description:
        "Manage and archive thesis documents with advanced search and categorization.",
      icon: thesisIcon,
      href: "/thesis-archiving",
      orb: "#BFDBFE",       // soft blue
      accent: "#2563EB",    // blue-600
      accentLight: "#DBEAFE",
    },
    {
      id: "facsub",
      title: "Faculty Requirement Submission",
      description:
        "Submit, track, and manage faculty requirements and documentation.",
      icon: facReqIcon,
      href: "/faculty-requirements",
      orb: "#FEF08A",       // soft yellow
      accent: "#D97706",    // amber-600
      accentLight: "#FEF3C7",
    },
    {
      id: "studvio",
      title: "Student Violation Management",
      description:
        "Record, review, and resolve student violations efficiently.",
      icon: classlistIcon,
      href: "/student-violations",
      orb: "#FBCFE8",       // soft pink
      accent: "#DB2777",    // pink-600
      accentLight: "#FCE7F3",
    },
    {
      id: "labman",
      title: "Laboratory Time Monitoring",
      description:
        "Monitor and track laboratory usage and time allocation across sessions.",
      icon: labIcon,
      href: "/lab-monitoring",
      orb: "#99F6E4",       // soft teal
      accent: "#0F766E",    // teal-700
      accentLight: "#CCFBF1",
    },
  ];

  const studentModules = [
    {
      id: "thesis",
      title: "Thesis Archiving",
      description:
        "Upload and manage your OJT and HTE documents for thesis archiving",
      icon: thesisIcon,
      href: "/student/documents",
      orb: "#BFDBFE",
      accent: "#2563EB",
      accentLight: "#DBEAFE",
    },
  ];

  const modules = isStudent(rbac)
    ? studentModules
    : allModules.filter(
      (module) => rbac?.superadmin || rbac?.[module.id]
    );

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-x-hidden">
      {/* ── Decorative background blobs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full"
          style={{ background: "radial-gradient(circle, #bbf7d0 0%, transparent 70%)", filter: "blur(60px)", opacity: 0.7 }} />
        <div className="absolute -top-20 right-0 w-[380px] h-[380px] rounded-full"
          style={{ background: "radial-gradient(circle, #BFDBFE 0%, transparent 70%)", filter: "blur(55px)", opacity: 0.65 }} />
        <div className="absolute top-[45%] -left-24 w-[320px] h-[320px] rounded-full"
          style={{ background: "radial-gradient(circle, #FDE68A 0%, transparent 70%)", filter: "blur(50px)", opacity: 0.55 }} />
        <div className="absolute top-[35%] right-[-60px] w-[360px] h-[360px] rounded-full"
          style={{ background: "radial-gradient(circle, #FBCFE8 0%, transparent 70%)", filter: "blur(55px)", opacity: 0.55 }} />
        <div className="absolute -bottom-24 left-[30%] w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, #99F6E4 0%, transparent 70%)", filter: "blur(60px)", opacity: 0.5 }} />
      </div>

      {/* ── Header ── */}
      <header
        className="relative z-50 sticky top-0"
        style={{
          background: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #008A45, #00c46a)",
                boxShadow: "0 2px 12px rgba(0,138,69,0.35)",
              }}
            >
              <img src={isamsFavicon} alt="ISAMS" className="w-6 h-6 object-contain" />
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {isStudent(rbac) ? "Student Portal" : "ISAMS Dashboard"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(0,138,69,0.07)",
                border: "1px solid rgba(0,138,69,0.15)",
              }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: "linear-gradient(135deg, #008A45, #00c46a)" }}
              >
                {user?.email?.[0]?.toUpperCase() ?? "U"}
              </div>
              <span className="text-xs text-gray-600 max-w-[150px] truncate">
                {user?.email}
              </span>
            </div>

            {isAdmin(rbac) && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => navigate("/system-settings")}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-105 hover:bg-gray-100 border border-black/10"
                      >
                        <Settings className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>System Settings</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => navigate("/users")}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-105 hover:bg-gray-100 border border-black/10"
                      >
                        <UserRoundPlus className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Manage Users</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-all duration-150 border border-black/10"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* ── Greeting ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-14 pb-10 w-full">
        <p className="text-xs font-semibold tracking-[0.18em] uppercase mb-2" style={{ color: "#008A45" }}>
          Welcome back
        </p>
        <h2 className="text-3xl font-bold text-gray-900 mb-1.5">
          {user?.user_metadata?.first_name && user?.user_metadata?.last_name
            ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
            : user?.email?.split("@")[0] ?? "User"}
        </h2>
        <p className="text-sm text-gray-400">
          {isStudent(rbac)
            ? "Upload and manage your OJT and HTE documents."
            : "Select a module below to access its features and functionality."}
        </p>
      </div>

      {/* ── Module grid ── */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-6 pb-14 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {modules.map((module, index) => (
            <button
              key={index}
              onClick={() => navigate(module.href)}
              className="group text-left w-full focus:outline-none transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className="relative rounded-2xl overflow-hidden p-6 h-full transition-all duration-300"
                style={{
                  background: "rgba(255,255,255,0.55)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.85)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.10), 0 0 0 1.5px ${module.accent}30, inset 0 1px 0 rgba(255,255,255,0.9)`;
                  e.currentTarget.style.borderColor = `${module.accent}35`;
                  e.currentTarget.style.background = "rgba(255,255,255,0.72)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.85)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.55)";
                }}
              >
                <div className="absolute top-0 left-8 right-8 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${module.accent}50, transparent)` }} />

                <div className="relative w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-105"
                  style={{ background: module.accentLight, border: `1px solid ${module.accent}25` }}>
                  <img src={module.icon} alt={module.title} className="w-5 h-5 object-contain"
                    style={{ filter: `brightness(0) saturate(100%) invert(20%)` }} />
                </div>

                <h3 className="relative text-[15px] font-semibold text-gray-900 mb-1.5 leading-snug pr-6">
                  {module.title}
                </h3>
                <p className="relative text-sm text-gray-500 leading-relaxed">
                  {module.description}
                </p>

                <div className="relative mt-4 flex items-center gap-1 text-xs font-semibold tracking-wide transition-all duration-200 group-hover:gap-2"
                  style={{ color: module.accent }}>
                  Open module
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-gray-100 bg-white/60">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <p className="text-xs text-gray-400 text-center">
            ISAMS — Integrated Smart Academic Management System &nbsp;·&nbsp; College of Computer Studies &nbsp;·&nbsp; © 2026
          </p>
        </div>
      </footer>
    </div>
  );
}