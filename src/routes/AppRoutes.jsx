import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"; // Added Outlet
import { useAuth } from "@/features/auth/hooks/useAuth";
import LoginPage from "@/features/auth/pages/LoginPage";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";

import { AdminAppRoutes } from "./faculty-requirements/AdminAppRoutes"; // Import the admin routes for faculty requirements
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
        {AdminAppRoutes}

        {/* STUDENT VIOLATIONS MODULE */}
        {StudViolationAppRoutes}

        {/* LABORATORY MANAGEMENT MODULE */}
        {LaboratoryRoutes(ProtectedRoute)}

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}