import { Route } from "react-router-dom";
import AdminLayout from "@/features/faculty-requirements/layout/AdminLayout";

// Import your pages...
import AdminDashboardPage from "@/features/faculty-requirements/pages/AdminDashboardPage";
import AdminArchivePage from "@/features/faculty-requirements/pages/AdminArchivePage";
import AdminFacultyMonitorPage from "@/features/faculty-requirements/pages/AdminFacultyMonitorPage";
import AdminDeadlinePage from "@/features/faculty-requirements/pages/AdminDeadlinePage";
import AdminValidationPage from "@/features/faculty-requirements/pages/AdminValidationPage";
import AdminReportsPage from "@/features/faculty-requirements/pages/AdminReportsPage";
import AdminSettingsPage from "@/features/faculty-requirements/pages/AdminSettingsPage";

export const AdminAppRoutes = (
  <Route element={<AdminLayout />}>
    <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
    <Route path="/faculty-monitor" element={<AdminFacultyMonitorPage />} />
    <Route path="/deadlines" element={<AdminDeadlinePage />} />
    <Route path="/validation" element={<AdminValidationPage />} />
    <Route path="/reports" element={<AdminReportsPage />} />
    <Route path="/settings" element={<AdminSettingsPage />} />
    <Route path="/archive" element={<AdminArchivePage />} />
  </Route>
);