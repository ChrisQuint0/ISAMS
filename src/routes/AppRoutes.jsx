import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"; // Added Outlet
import { useAuth } from "@/features/auth/hooks/useAuth";
import LoginPage from "@/features/auth/pages/LoginPage";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import ThesisArchivingPage from "@/features/thesis-archiving/pages/ThesisArchivingPage";
import ClassManagementPage from "@/features/class-management/pages/ClassManagementPage";

import { AdminAppRoutes } from "./faculty-requirements/AdminAppRoutes"; // Import the admin routes for faculty requirements
import { LaboratoryRoutes } from "./laboratory-management/LaboratoryRoutes";

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
        {LaboratoryRoutes(ProtectedRoute)}

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
