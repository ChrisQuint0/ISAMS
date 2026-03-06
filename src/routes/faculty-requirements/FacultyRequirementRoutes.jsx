import { Route } from "react-router-dom";
import FacultyModuleGuard from "@/features/faculty-requirements/components/FacultyModuleGuard";

// --- ADMIN IMPORTS ---
import AdminLayout from "@/features/faculty-requirements/layout/AdminLayout";
import AdminDashboardPage from "@/features/faculty-requirements/pages/AdminDashboardPage";
import AdminArchivePage from "@/features/faculty-requirements/pages/AdminArchivePage";
import AdminFacultyMonitorPage from "@/features/faculty-requirements/pages/AdminFacultyMonitorPage";
import AdminDeadlinePage from "@/features/faculty-requirements/pages/AdminDeadlinePage";
import AdminReportsPage from "@/features/faculty-requirements/pages/AdminReportsPage";
import AdminSettingsPage from "@/features/faculty-requirements/pages/AdminSettingsPage";
import AdminSemesterManagementPage from "@/features/faculty-requirements/pages/AdminSemesterManagementPage";
import AdminFacultyDetailPage from "@/features/faculty-requirements/pages/AdminFacultyDetailPage";

// --- FACULTY IMPORTS ---
import FacultyLayout from "@/features/faculty-requirements/layout/FacultyLayout";
import FacultyDashboardPage from "@/features/faculty-requirements/pages/FacultyDashboardPage";
import FacultySubmissionPage from "@/features/faculty-requirements/pages/FacultySubmissionPage";
import FacultyAnalyticsPage from "@/features/faculty-requirements/pages/FacultyAnalyticsPage";
import FacultyArchivePage from "@/features/faculty-requirements/pages/FacultyArchivePage";
import FacultyTemplateHubPage from "@/features/faculty-requirements/pages/FacultyTemplateHubPage";
import FacultySettingsPage from "@/features/faculty-requirements/pages/FacultySettingsPage";

export const FacultyRequirementsRoutes = (ProtectedRoute) => {
    return (
        <>
            {/* 1. ENTRY GUARD */}
            <Route
                path="/faculty-requirements"
                element={
                    <ProtectedRoute>
                        <FacultyModuleGuard />
                    </ProtectedRoute>
                }
            />

            {/* 2. ADMIN ROUTES */}
            <Route
                element={
                    <ProtectedRoute>
                        <AdminLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
                <Route path="/faculty-monitor" element={<AdminFacultyMonitorPage />} />
                <Route path="/deadlines" element={<AdminDeadlinePage />} />
                <Route path="/reports" element={<AdminReportsPage />} />
                <Route path="/settings" element={<AdminSettingsPage />} />
                <Route path="/semester-management" element={<AdminSemesterManagementPage />} />
                <Route path="/faculty/:id" element={<AdminFacultyDetailPage />} />
                <Route path="/archive" element={<AdminArchivePage />} />
            </Route>

            {/* 3. FACULTY ROUTES */}
            <Route
                element={
                    <ProtectedRoute>
                        <FacultyLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/faculty-requirements/dashboard" element={<FacultyDashboardPage />} />
                <Route path="/faculty-requirements/submission" element={<FacultySubmissionPage />} />
                <Route path="/faculty-requirements/analytics" element={<FacultyAnalyticsPage />} />
                <Route path="/faculty-requirements/archive" element={<FacultyArchivePage />} />
                <Route path="/faculty-requirements/hub" element={<FacultyTemplateHubPage />} />
                <Route path="/faculty-requirements/settings" element={<FacultySettingsPage />} />
            </Route>
        </>
    );
};