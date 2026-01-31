import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import LoginPage from "@/features/auth/pages/LoginPage";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import ThesisArchivingPage from "@/features/thesis-archiving/pages/ThesisArchivingPage";
import FacultyRequirementsPage from "@/features/faculty-requirements/pages/FacultyRequirementsPage";
import ClassManagementPage from "@/features/class-management/pages/ClassManagementPage";
import LabMonitoringPage from "@/features/lab-monitoring/pages/LabMonitoringPage";

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
        <Route
          path="/faculty-requirements"
          element={
            <ProtectedRoute>
              <FacultyRequirementsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/class-management"
          element={
            <ProtectedRoute>
              <ClassManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lab-monitoring"
          element={
            <ProtectedRoute>
              <LabMonitoringPage />
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
