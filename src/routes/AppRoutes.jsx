import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import LoginPage from "@/features/auth/pages/LoginPage";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import ThesisArchivingPage from "@/features/thesis-archiving/pages/ThesisArchivingPage";
import ClassManagementPage from "@/features/class-management/pages/ClassManagementPage";

// Imports for Laboratory Monitoring
import LabLayout from "@/features/lab-monitoring/layouts/LabLayout";
import LabDashboard from "@/features/lab-monitoring/pages/LabDashboard";
import AccessLogs from "@/features/lab-monitoring/pages/AccessLogs";
import LabSchedule from "@/features/lab-monitoring/pages/LabSchedule";
import PCManagement from "@/features/lab-monitoring/pages/PCManagement";
import ReportsAnalytics from "@/features/lab-monitoring/pages/ReportsAnalytics";
import LabSettings from "@/features/lab-monitoring/pages/LabSettings";
import Kiosk from "@/features/lab-monitoring/pages/Kiosk";
import Success from "@/features/lab-monitoring/pages/Success";

import { AdminAppRoutes } from "./faculty-requirements/AdminAppRoutes"; // Import the admin routes for faculty requirements

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Public Route wrapper (redirect to dashboard if already logged in)
function PublicRoute({ children }) {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
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

        {/* Module Routes */}
        <Route
          path="/thesis-archiving"
          element={
            <ProtectedRoute>
              <ThesisArchivingPage />
            </ProtectedRoute>
          }
        />

        {/* Faculty Requirements Module Routes */}
        {AdminAppRoutes}

        <Route
          path="/class-management"
          element={
            <ProtectedRoute>
              <ClassManagementPage />
            </ProtectedRoute>
          }
        />

        {/* LABORATORY MANAGEMENT MODULE */}
        <Route
          element={
            <ProtectedRoute>
              <LabLayout />
            </ProtectedRoute>
          }
        >
          {/* Default to Dashboard when hitting the root folder */}
          <Route path="/lab-monitoring" element={<LabDashboard />} />

          {/* Admin Mode */}
          <Route path="/lab-dashboard" element={<LabDashboard />} />
          <Route path="/access-logs" element={<AccessLogs />} />
          <Route path="/lab-schedule" element={<LabSchedule />} />
          <Route path="/pc-management" element={<PCManagement />} />
          <Route path="/reports-analytics" element={<ReportsAnalytics />} />
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

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
