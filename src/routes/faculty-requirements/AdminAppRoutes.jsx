import { Route } from "react-router-dom";
import { ProtectedRoute } from "../RouteGuards";
import AdminLayout from "@/features/faculty-requirements/layout/AdminLayout"; // Import the new layout

// Import your pages...
import AdminDashboardPage from "@/features/faculty-requirements/pages/AdminDashboardPage";
import AdminArchivePage from "@/features/faculty-requirements/pages/AdminArchivePage";
import AdminFacultyMonitorPage from "@/features/faculty-requirements/pages/AdminFacultyMonitorPage";
import AdminDeadlinePage from "@/features/faculty-requirements/pages/AdminDeadlinePage";
import AdminValidationPage from "@/features/faculty-requirements/pages/AdminValidationPage";
import AdminReportsPage from "@/features/faculty-requirements/pages/AdminReportsPage";
import AdminSettingsPage from "@/features/faculty-requirements/pages/AdminSettingsPage";

export const AdminAppRoutes = [
  <Route key="admin-layout" element={<AdminLayout />}>
    <Route
      path="/admin-dashboard"
      element={
        <ProtectedRoute>
          <AdminDashboardPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/faculty-monitor"
      element={
        <ProtectedRoute>
          <AdminFacultyMonitorPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/deadlines"
      element={
        <ProtectedRoute>
          <AdminDeadlinePage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/validation"
      element={
        <ProtectedRoute>
          <AdminValidationPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/reports"
      element={
        <ProtectedRoute>
          <AdminReportsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings"
      element={
        <ProtectedRoute>
          <AdminSettingsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/archive"
      element={
        <ProtectedRoute>
          <AdminArchivePage />
        </ProtectedRoute>
      }
    />
  </Route>
];