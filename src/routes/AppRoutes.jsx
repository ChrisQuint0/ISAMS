import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom"; // Added Outlet
import { useAuth } from "@/features/auth/hooks/useAuth";
import LoginPage from "@/features/auth/pages/LoginPage";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import ThesisArchivingPage from "@/features/thesis-archiving/pages/ThesisArchivingPage";

// Imports for Laboratory Monitoring
import LabLayout from "@/features/lab-monitoring/layouts/LabLayout";
import LabSelectionPage from "@/features/lab-monitoring/pages/LabSelectionPage";
import LabDashboard from "@/features/lab-monitoring/pages/LabDashboard";
import AccessLogs from "@/features/lab-monitoring/pages/AccessLogs";
import LabSchedule from "@/features/lab-monitoring/pages/LabSchedule";
import PCManagement from "@/features/lab-monitoring/pages/PCManagement";
import ReportsAnalytics from "@/features/lab-monitoring/pages/ReportsAnalytics";
import LabSettings from "@/features/lab-monitoring/pages/LabSettings";
import AuditTrails from "@/features/lab-monitoring/pages/AuditTrails";
import Kiosk from "@/features/lab-monitoring/pages/Kiosk";
import Success from "@/features/lab-monitoring/pages/Success";

import { AdminAppRoutes } from "./faculty-requirements/AdminAppRoutes"; // Import the admin routes for faculty requirements
import { FacultyAppRoutes } from "./faculty-requirements/FacultyAppRoutes"; // Import the faculty routes
import { LaboratoryRoutes } from "./laboratory-management/LaboratoryRoutes";
import { ThesisArchivingRoutes } from "./thesis-archiving/ThesisArchivingRoutes";
import { StudViolationAppRoutes } from "./student-violation/StudViolationAppRoutes";

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Public Route wrapper
function PublicRoute({ children }) {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function FacultyRequirementsRouter() {
  const { user } = useAuth();

  if (user?.email === "admin@isams.edu") {
    return <Navigate to="/admin-dashboard" replace />;
  } else if (user?.email === "faculty@isams.edu") {
    return <Navigate to="/faculty-requirements/dashboard" replace />;
  }

  // Fallback if email doesn't strictly match either
  return <Navigate to="/admin-dashboard" replace />;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Thesis Archiving Module Routes */}
        {ThesisArchivingRoutes(ProtectedRoute)}

        {/* Faculty Requirements Module Routes */}
        <Route
          path="/faculty-requirements"
          element={
            <ProtectedRoute>
              <FacultyRequirementsRouter />
            </ProtectedRoute>
          }
        />
        {AdminAppRoutes}
        {FacultyAppRoutes}

        {/* STUDENT VIOLATIONS MODULE */}
        {StudViolationAppRoutes}

        {/* LABORATORY MANAGEMENT MODULE */}
        <Route
          path="/lab-monitoring"
          element={
            <ProtectedRoute>
              <LabSelectionPage />
            </ProtectedRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <LabLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/lab-dashboard" element={<LabDashboard />} />
          <Route path="/access-logs" element={<AccessLogs />} />
          <Route path="/lab-schedule" element={<LabSchedule />} />
          <Route path="/pc-management" element={<PCManagement />} />
          <Route path="/reports-analytics" element={<ReportsAnalytics />} />
          <Route path="/audit-trails" element={<AuditTrails />} />
          <Route path="/lab-settings" element={<LabSettings />} />
        </Route>

        {/* Kiosk Mode */}
        <Route
          path="/kiosk-mode"
          element={
            <ProtectedRoute>
              <Kiosk />
            </ProtectedRoute>
          }
        />
        <Route
          path="/success"
          element={
            <ProtectedRoute>
              <Success />
            </ProtectedRoute>
          }
        />
        {LaboratoryRoutes(ProtectedRoute)}

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
