import { Route, Navigate } from "react-router-dom";
import ThesisArchivingPage from "@/features/thesis-archiving/pages/ThesisArchivingPage";
import ThesisArchivingDashboardPage from "@/features/thesis-archiving/pages/ThesisArchivingDashboardPage";
import DigitalRepositoryPage from "@/features/thesis-archiving/pages/DigitalRepositoryPage";
import ThesisDetailPage from "@/features/thesis-archiving/pages/ThesisDetailPage";
import SimilarityCheckPage from "@/features/thesis-archiving/pages/SimilarityCheckPage";
import HTEDocumentArchivePage from "@/features/thesis-archiving/pages/HTEDocumentArchivePage";
import ReportsAnalyticsPage from "@/features/thesis-archiving/pages/ReportsAnalyticsPage";

export const ThesisArchivingRoutes = (ProtectedRoute) => (
    <>
        <Route
            path="/thesis-archiving"
            element={
                <ProtectedRoute>
                    <ThesisArchivingPage />
                </ProtectedRoute>
            }
        >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ThesisArchivingDashboardPage />} />
            <Route path="digital-repository">
                <Route index element={<DigitalRepositoryPage />} />
                <Route path=":id" element={<ThesisDetailPage />} />
            </Route>
            <Route path="similarity-check" element={<SimilarityCheckPage />} />

            <Route path="hte-archiving">
                <Route path="document-archive" element={<HTEDocumentArchivePage />} />
            </Route>

            <Route path="insights">
                <Route path="reports" element={<ReportsAnalyticsPage />} />
            </Route>
        </Route>
    </>
);
